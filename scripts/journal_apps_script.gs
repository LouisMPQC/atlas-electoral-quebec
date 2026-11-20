/**
 * Journal des consultations de l'Atlas électoral du Québec.
 * Script lié au Google Sheet « Atlas électoral : administration des accès » (Extensions > Apps Script).
 * Déployé comme application Web : exécuter en tant que moi, accès : tout le monde.
 *
 * - Les cartes (docs/assets/gate.js) envoient une ligne par visite, et par tentative de code quand la barrière est active.
 *   Ni code tapé ni adresse IP ne sont reçus.
 * - Le tableau de bord (docs/admin/) demande les statistiques avec le code universel, vérifié ici et non dans la page.
 *
 * AVANT DE COLLER DANS APPS SCRIPT : remplacer __SEL__ et __EMPREINTE__ par le sel et l'empreinte SHA-256 du code
 * universel (document « atlas-codes-acces » du projet claude.ai). Ne jamais publier ces deux valeurs dans le dépôt.
 */
const ADMIN = { sel: '__SEL__', empreinte: '__EMPREINTE__' };
const FUSEAU = 'America/Toronto';
const ONGLET_JOURNAL = 'Journal';
const ONGLET_PERSONNES = 'Personnes';
const RESULTATS = { visite: 'Visite', ok: 'Accès accordé', refus: 'Code incorrect', hors: 'Code valide, hors de ses accès' };
const MAX_ESSAIS_ADMIN = 8; // par heure

function doPost(e) {
  let d = {};
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return texte_('x'); }
  if (d.action === 'admin') return statistiques_(String(d.code || ''));
  return consigner_(d);
}

function doGet() { return texte_('Journal de l’Atlas électoral : actif.'); }

/* ---------- réception d'une visite ou d'une tentative ---------- */
function consigner_(d) {
  const page = String(d.page || '');
  if (!RESULTATS[d.resultat] || !/^(circonscription|federal)\/[a-z0-9-]{2,80}$/.test(page)) return texte_('x');
  const verrou = LockService.getScriptLock();
  if (!verrou.tryLock(8000)) return texte_('occupé');
  try {
    const ss = SpreadsheetApp.getActive();
    const qui = String(d.qui || '').slice(0, 12);
    preparer_(ss).appendRow([
      new Date(), nomDe_(ss, qui) || 'Anonyme',
      page.indexOf('federal/') === 0 ? 'Fédéral' : 'Provincial', page.split('/')[1],
      RESULTATS[d.resultat], String(d.appareil || '').slice(0, 12), String(d.ecran || '').slice(0, 12), qui
    ]);
    return texte_('ok');
  } finally { verrou.releaseLock(); }
}

/* ---------- statistiques pour le tableau de bord ---------- */
function statistiques_(code) {
  const cache = CacheService.getScriptCache();
  const essais = Number(cache.get('adm_echecs') || 0);
  if (essais >= MAX_ESSAIS_ADMIN) return json_({ erreur: 'bloque' });
  if (sha256_(ADMIN.sel + ':' + code) !== ADMIN.empreinte) {
    cache.put('adm_echecs', String(essais + 1), 3600);
    return json_({ erreur: 'code' });
  }
  const ss = SpreadsheetApp.getActive();
  const v = preparer_(ss).getDataRange().getValues().slice(1).filter(r => r[0] instanceof Date);
  const jour = t => Utilities.formatDate(t, FUSEAU, 'yyyy-MM-dd');
  const auj = new Date(), J = 864e5;
  // 30 derniers jours, y compris aujourd'hui
  const jours = [];
  for (let i = 29; i >= 0; i--) jours.push({ d: jour(new Date(auj.getTime() - i * J)), visites: 0, codes: 0 });
  const idx = {}; jours.forEach((x, i) => idx[x.d] = i);
  const pages = {}, appareils = {}, personnes = {};
  let visites7 = 0, visites30 = 0, refus7 = 0, total = 0;
  v.forEach(r => {
    const t = r[0], age = (auj - t) / J, res = r[4], page = (r[2] === 'Fédéral' ? 'federal/' : 'circonscription/') + r[3];
    const estVisite = res === RESULTATS.visite;
    if (estVisite) total++;
    if (idx[jour(t)] !== undefined) (estVisite ? jours[idx[jour(t)]].visites++ : jours[idx[jour(t)]].codes++);
    if (estVisite && age <= 7) visites7++;
    if (res === RESULTATS.refus && age <= 7) refus7++;
    if (estVisite && age <= 30) {
      visites30++;
      pages[page] = (pages[page] || 0) + 1;
      appareils[r[5] || 'inconnu'] = (appareils[r[5] || 'inconnu'] || 0) + 1;
    }
    if (r[7] && r[7] !== '') {
      const p = personnes[r[1]] || (personnes[r[1]] = { nom: r[1], n: 0, dernier: 0 });
      p.n++; if (t.getTime() > p.dernier) p.dernier = t.getTime();
    }
  });
  const recents = v.slice(-60).reverse().map(r => ({
    t: r[0].getTime(), personne: r[1], page: (r[2] === 'Fédéral' ? 'federal/' : 'circonscription/') + r[3],
    resultat: r[4], appareil: r[5]
  }));
  return json_({
    maj: auj.getTime(), total: total, visites7: visites7, visites30: visites30, refus7: refus7,
    aujourdhui: jours[jours.length - 1].visites, jours: jours,
    pages: Object.keys(pages).map(k => ({ page: k, n: pages[k] })).sort((a, b) => b.n - a.n).slice(0, 15),
    distinctes30: Object.keys(pages).length, appareils: appareils,
    personnes: Object.keys(personnes).map(k => personnes[k]).sort((a, b) => b.dernier - a.dernier),
    recents: recents
  });
}

/* ---------- utilitaires ---------- */
function nomDe_(ss, qui) {
  if (!qui) return '';
  const p = ss.getSheetByName(ONGLET_PERSONNES);
  if (!p) return qui;
  const v = p.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) if (String(v[i][0]) === qui) return v[i][1];
  return qui;
}
function sha256_(t) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, t, Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}
function texte_(t) { return ContentService.createTextOutput(t); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Crée ou retrouve les onglets. */
function preparer_(ss) {
  ss = ss || SpreadsheetApp.getActive();
  if (!ss.getSheetByName(ONGLET_PERSONNES)) ss.getSheets()[0].setName(ONGLET_PERSONNES);
  let j = ss.getSheetByName(ONGLET_JOURNAL);
  if (!j) {
    j = ss.insertSheet(ONGLET_JOURNAL, 0);
    j.appendRow(['Date et heure', 'Personne', 'Palier', 'Circonscription', 'Résultat', 'Appareil', 'Écran', 'Identifiant']);
    j.getRange('A1:H1').setFontWeight('bold');
    j.setFrozenRows(1);
    j.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    j.setColumnWidth(1, 160); j.setColumnWidth(2, 190); j.setColumnWidth(4, 260); j.setColumnWidth(5, 220);
  }
  return j;
}

/** À lancer une fois à la main (bouton Exécuter) : crée les onglets et déclenche l'autorisation. */
function installer() { preparer_(); }
