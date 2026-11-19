/**
 * Journal des accès de l'Atlas électoral du Québec.
 * Script lié au Google Sheet « Atlas électoral : administration des accès » (Extensions > Apps Script).
 * Déployé comme application Web : exécuter en tant que moi, accès : tout le monde.
 * La page de code (docs/assets/gate.js) envoie une ligne par tentative ; ni code ni adresse IP ne sont reçus.
 */
const ONGLET_JOURNAL = 'Journal';
const ONGLET_PERSONNES = 'Personnes';
const RESULTATS = { ok: 'Accès accordé', refus: 'Code incorrect', hors: 'Code valide, hors de ses accès' };

function doPost(e) {
  const verrou = LockService.getScriptLock();
  if (!verrou.tryLock(8000)) return ContentService.createTextOutput('occupé');
  try {
    let d = {};
    try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return ContentService.createTextOutput('x'); }
    const page = String(d.page || '');
    if (!RESULTATS[d.resultat] || !/^(circonscription|federal)\/[a-z0-9-]{2,80}$/.test(page)) return ContentService.createTextOutput('x');
    const qui = String(d.qui || '').slice(0, 12);
    const ss = SpreadsheetApp.getActive();
    const journal = preparer_(ss);
    journal.appendRow([
      new Date(),
      nomDe_(ss, qui),
      page.indexOf('federal/') === 0 ? 'Fédéral' : 'Provincial',
      page.split('/')[1],
      RESULTATS[d.resultat],
      String(d.appareil || '').slice(0, 12),
      String(d.ecran || '').slice(0, 12),
      qui
    ]);
    return ContentService.createTextOutput('ok');
  } finally {
    verrou.releaseLock();
  }
}

/** Nom affiché à partir de l'identifiant (onglet Personnes, colonnes A et B). */
function nomDe_(ss, qui) {
  if (!qui) return '';
  const p = ss.getSheetByName(ONGLET_PERSONNES);
  if (!p) return qui;
  const v = p.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) if (String(v[i][0]) === qui) return v[i][1];
  return qui;
}

/** Crée ou retrouve les onglets. À lancer une fois à la main (bouton Exécuter) pour autoriser le script. */
function preparer_(ss) {
  ss = ss || SpreadsheetApp.getActive();
  const premiere = ss.getSheets()[0];
  if (!ss.getSheetByName(ONGLET_PERSONNES)) premiere.setName(ONGLET_PERSONNES);
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

function installer() { preparer_(); }
