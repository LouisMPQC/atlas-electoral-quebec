"""Lit les résultats par bureau de vote d'Élections Québec (2018, 2022, 2026)
et vérifie que chaque circonscription redonne exactement les totaux officiels."""
import csv, glob, json, os, re, sys, pickle
from collections import defaultdict

BRUT = sys.argv[1]       # dossier des fichiers bruts
X = sys.argv[2]          # dossier des zip décompressés
OUT = sys.argv[3]
CANON = {8: 'PQ', 27: 'CAQ', 6: 'PLQ', 40: 'QS', 22: 'PCQ'}
PARTIS = ['PQ', 'CAQ', 'PLQ', 'QS', 'PCQ', 'AUT']

def norm(s):
    import unicodedata
    s = unicodedata.normalize('NFD', s)
    return re.sub(r'[^a-z]', '', ''.join(c for c in s if not unicodedata.combining(c)).lower())

def ranges(txt):
    out = []
    for part in txt.split(','):
        part = part.strip()
        m = re.match(r'^(\d+)\s*à\s*(\d+)$', part)
        if m:
            out += [str(i) for i in range(int(m.group(1)), int(m.group(2)) + 1)]
        elif re.match(r'^\d+[A-Z]?$', part):
            out.append(part)
    return out

def lire(annee):
    off = json.load(open(f'{BRUT}/{annee}_resultats.json', encoding='utf-8-sig'))
    offc = {c['numeroCirconscription']: c for c in off['circonscriptions']}
    res = {}
    fichiers = sorted(glob.glob(f'{X}/resultats_bv_{annee}/*.csv') + glob.glob(f'{X}/resultats_bv_{annee}/*.xlsx'))
    for f in fichiers:
        if f.endswith('.xlsx'):  # quatre circonscriptions de 2018 sont publiées en Excel
            import openpyxl
            ws = openpyxl.load_workbook(f, read_only=True, data_only=True).active
            rows = [['' if c is None else str(int(c)) if isinstance(c, float) and c == int(c) else str(c) for c in r] for r in ws.iter_rows(values_only=True)]
            rows = [r for r in rows if any(x.strip() for x in r)]
            hi = next(i for i, r in enumerate(rows) if r and r[0].strip() == 'Code')
            rows = rows[hi:]
        else:
            rows = list(csv.reader(open(f, encoding='latin1'), delimiter=';'))
        h = rows[0]
        iv = next(i for i, c in enumerate(h) if c.strip() in ('Bulletins valides', 'B.V.'))
        cands = h[9:iv]
        code = int(rows[1][0]); oc = offc[code]
        # candidat -> parti
        m = {}
        for i, hc in enumerate(cands):
            hn = norm(hc)
            hit = [k for k in oc['candidats'] if hn.startswith(norm(k['nom'] + k['prenom']))]
            if len(hit) != 1:
                hit = [k for k in oc['candidats'] if hc.strip().endswith(k['abreviationPartiPolitique'])]
            if len(hit) != 1:
                raise SystemExit(f'{annee} {f}: candidat ambigu {hc!r}')
            m[i] = CANON.get(hit[0]['numeroPartiPolitique'], 'AUT')
        C = {'code': code, 'nom': oc['nomCirconscription'], 'sv': {}, 'bva': {}, 'spec': {}, 'tot': None,
             'cands': [[m[i], hc.strip()] for i, hc in enumerate(cands)],
             'off': {'valides': oc['nbVoteValide'], 'rejetes': oc['nbVoteRejete'], 'inscrits': oc['nbElecteurInscrit']}}
        for r in rows[1:]:
            if len(r) < iv + 2 or not r[0].strip().isdigit():
                continue
            v = defaultdict(int)
            for i in range(len(cands)):
                v[m[i]] += int(r[9 + i] or 0)
            v = {p: v.get(p, 0) for p in PARTIS}
            rec = {'v': v, 'rej': int(r[iv + 1] or 0), 'bv': int(r[iv] or 0), 'ins': int(r[8] or 0)}
            assert sum(v.values()) == rec['bv'], (f, r)
            lab = r[4].strip(); sv = r[7].strip()
            if sv:
                sv = re.sub(r'[A-Z]+$', '', sv)  # 12A et 12B partagent le polygone de la section 12
                rec.update(mun=lab, sect=r[5].strip(), regr=r[6].strip())
                if sv in C['sv']:
                    o = C['sv'][sv]
                    for p in PARTIS: o['v'][p] += v[p]
                    o['rej'] += rec['rej']; o['bv'] += rec['bv']; o['ins'] += rec['ins']
                else:
                    C['sv'][sv] = rec
            elif lab.startswith('BVA'):
                mm = re.match(r'^(BVA\d+)\s*:\s*SV no\s*(.*)$', lab)
                rec['s'] = sorted(set(re.sub(r'[A-Z]+$', '', x) for x in ranges(mm.group(2))), key=lambda x: int(x)) if mm else []
                C['bva'][mm.group(1) if mm else lab] = rec
            elif lab.startswith('Total de la circonscription'):
                C['tot'] = rec
            elif lab.startswith('Majorit'):
                continue
            else:
                rec['regr'] = r[6].strip()
                C['spec'][lab] = rec
        # vérifications
        s = lambda d, k: sum(x[k] for x in d.values())
        tb = s(C['sv'], 'bv') + s(C['bva'], 'bv') + s(C['spec'], 'bv')
        tr = s(C['sv'], 'rej') + s(C['bva'], 'rej') + s(C['spec'], 'rej')
        assert tb == C['tot']['bv'] == oc['nbVoteValide'], (annee, C['nom'], tb, C['tot']['bv'], oc['nbVoteValide'])
        assert tr == C['tot']['rej'] == oc['nbVoteRejete'], (annee, C['nom'], tr, C['tot']['rej'], oc['nbVoteRejete'])
        for p in PARTIS:
            assert s({k: {'x': x['v'][p]} for k, x in {**C['sv'], **C['bva'], **C['spec']}.items()}, 'x') == C['tot']['v'][p]
        # chaque section citée par un BVA existe
        miss = [x for b in C['bva'].values() for x in b['s'] if x not in C['sv']]
        if miss:
            print(f'  avis {annee} {C["nom"]}: sections de BVA absentes {miss[:5]}')
        res[code] = C
    assert len(res) == len(offc), (annee, len(res), len(offc))
    return res

D = {}
for a in ['2018', '2022', '2026']:
    D[a] = lire(a)
    nv = sum(c['tot']['bv'] for c in D[a].values())
    print(a, len(D[a]), 'circonscriptions,', nv, 'votes valides, totaux conformes')
pickle.dump(D, open(OUT, 'wb'))
