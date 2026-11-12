"""Produit les données du site : un fichier par circonscription de 2026 et un
fichier national (accueil par régions)."""
import sys, pickle, json, re, math, unicodedata, os
import numpy as np
import geopandas as gpd
from shapely.geometry import mapping
from shapely.ops import unary_union
from collections import defaultdict, Counter

S, OUT = sys.argv[1], sys.argv[2]
D = pickle.load(open(f'{S}/res.pkl', 'rb'))
GG = pickle.load(open(f'{S}/geo.pkl', 'rb'))
G, REGC, REGIONS, TR = GG['G'], GG['REGC'], GG['REGIONS'], GG['TR']
PARTIS = ['PQ', 'CAQ', 'PLQ', 'QS', 'PCQ', 'AUT']
os.makedirs(f'{OUT}/c', exist_ok=True)
CANON = {8: 'PQ', 27: 'CAQ', 6: 'PLQ', 40: 'QS', 22: 'PCQ'}
OFF26 = {c['numeroCirconscription']: c for c in json.load(open(f'{S}/brut/2026_resultats.json', encoding='utf-8-sig'))['circonscriptions']}

def slug(s):
    s = unicodedata.normalize('NFD', s); s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def rnd(c):
    if isinstance(c[0], (list, tuple)): return [rnd(x) for x in c]
    return [round(c[0], 5), round(c[1], 5)]

def geo_wgs(gdf):
    g = gdf.copy()
    tol = np.maximum(2.5, np.sqrt(g.geometry.area) / 200)
    g['geometry'] = [geom.simplify(t, preserve_topology=True) for geom, t in zip(g.geometry, tol)]
    return g.to_crs(4326)

def mun_clean(s):
    return re.sub(r',\s*[a-zA-Z\-]+$', '', s or '').strip()

def secteurs(rows):
    """Municipalité quand la circonscription en compte plusieurs, sinon secteur électoral d'Élections Québec."""
    muns = {mun_clean(r['mun']) for r in rows.values()}
    if len(muns) >= 2:
        return {k: mun_clean(r['mun']) for k, r in rows.items()}, 'Municipalité'
    return {k: ('Secteur ' + r['sect']) if r.get('sect') else '' for k, r in rows.items()}, 'Secteur électoral'

def annee(y, cep_list, keys_by_cep, label_mode):
    """Assemble une année pour une page : sections (clé cep_sv), BVA, votes spéciaux."""
    g = G[y]; R = {}; feats = []; sec = {}; bva_of = {}; A = {}; SP = {}; SPr = {}
    multi = len(cep_list) > 1
    lab = lambda c, s: (s + ' · ' + D[y][c]['nom']) if multi else s
    rows_all = {}
    for c in cep_list:
        C = D[y][c]
        for s in keys_by_cep[c]:
            rows_all[f'{c}_{s}'] = C['sv'][s]
    secmap, sectyp = secteurs(rows_all)
    for c in cep_list:
        C = D[y][c]; keep = set(keys_by_cep[c])
        for s in keep:
            r = C['sv'][s]; k = f'{c}_{s}'
            d = {p: r['v'][p] for p in PARTIS}; d['ins'] = r['ins']; d['rej'] = r['rej']
            rg = r.get('regr', '')
            if rg.startswith('Regr. BVO-') and sum(r['v'].values()) == 0:
                d['regr'] = f'{c}_{rg.split("-", 1)[1]}'
            R[k] = d; sec[k] = secmap[k]
        for b, x in C['bva'].items():
            mem = [s for s in x['s'] if s in C['sv']]
            on = [s for s in mem if s in keep]
            if not mem or len(on) * 2 < len(mem): continue
            ak = f'{c}_{b}'
            w = Counter(); insb = 0
            for s in on:
                w[secmap[f'{c}_{s}']] += C['sv'][s]['ins'] or 1; insb += C['sv'][s]['ins']; bva_of[f'{c}_{s}'] = ak
            tw = sum(w.values()) or 1
            A[ak] = {'lab': b + ((' · ' + C['nom']) if multi else ''), 'v': {p: x['v'][p] for p in PARTIS}, 'rej': x['rej'],
                     's': [f'{c}_{s}' for s in on], 'w': {k2: round(v / tw, 4) for k2, v in w.items()}, 'ins': insb,
                     'part': len(on) < len(mem)}
    # votes spéciaux : seulement pour l'ancienne circonscription principale (les spéciaux n'ont pas de territoire)
    main = cep_list[0]
    for lab2, x in D[y][main]['spec'].items():
        if sum(x['v'].values()) == 0 and x['rej'] == 0: continue
        SP[lab2] = {p: x['v'][p] for p in PARTIS}; SPr[lab2] = x['rej']
    # géométrie
    sub = g[g['k'].isin(R.keys())]
    if len(sub):
        gw = geo_wgs(sub)
        for k, geom, mun in zip(gw['k'], gw.geometry, gw['nmun']):
            c, s = k.split('_')
            feats.append({'type': 'Feature', 'properties': {'k': k, 'n': lab(int(c), s), 'mun': mun},
                          'geometry': {'type': geom.geom_type, 'coordinates': rnd(mapping(geom)['coordinates'])}})
        # contours des BVA et masque
        Afc = []
        for ak, a in A.items():
            gs = sub[sub['k'].isin(a['s'])]
            if not len(gs): continue
            u = unary_union(list(gs.buffer(3).geometry)).buffer(-3)
            u = gpd.GeoSeries([u], crs=32198).simplify(max(8, math.sqrt(u.area) / 300)).to_crs(4326).iloc[0]
            Afc.append({'type': 'Feature', 'properties': {'a': ak, 'lab': a['lab']}, 'geometry': {'type': u.geom_type, 'coordinates': rnd(mapping(u)['coordinates'])}})
        um = unary_union(list(sub.buffer(15).geometry)).buffer(-5)
        um = gpd.GeoSeries([um], crs=32198).simplify(max(20, math.sqrt(um.area) / 300)).to_crs(4326).iloc[0]
        rings = [[[round(y_, 5), round(x_, 5)] for x_, y_ in p.exterior.coords] for p in (um.geoms if um.geom_type == 'MultiPolygon' else [um]) if p.area > 1e-8]
    else:
        Afc, rings = [], []
    return {'fc': {'type': 'FeatureCollection', 'features': feats}, 'R': R, 'A': A, 'SP': SP, 'SPr': SPr,
            'sec': sec, 'sectyp': sectyp, 'bva': bva_of, 'Afc': {'type': 'FeatureCollection', 'features': Afc}, 'm': rings,
            'olds': [D[y][c]['nom'] for c in cep_list]}

g26 = G['2026']
pages = {}
# anciennes sections : page de 2026 qui en reçoit la plus grande part
assign = {}
for y in ['2022', '2018']:
    assign[y] = defaultdict(lambda: defaultdict(list))
    for ko, dd in TR[y]['dest'].items():
        cn = max(dd, key=dd.get); c, s = ko.split('_')
        assign[y][cn][int(c)].append(s)
    # sections sans polygone ou sans part : rattachées à la page qui reçoit le plus de leur ancienne circonscription
    for c, C in D[y].items():
        for s in C['sv']:
            ko = f'{c}_{s}'
            if ko in TR[y]['dest']: continue
            tally = Counter()
            for s2 in C['sv']:
                dd = TR[y]['dest'].get(f'{c}_{s2}')
                if dd: tally[max(dd, key=dd.get)] += 1
            if tally: assign[y][tally.most_common(1)[0][0]][c].append(s)

# origines et totaux transposés par circonscription de 2026
transp = {}
for y in ['2022', '2018']:
    est = TR[y]['est']; tot = defaultdict(lambda: defaultdict(float)); orig = defaultdict(Counter)
    kcep = dict(zip(g26['k'], g26['cep']))
    for kn, e in est.items():
        cn = int(kcep[kn])
        for p in PARTIS: tot[cn][p] += e['f'].get(p, 0)
    for ko, dd in TR[y]['dest'].items():
        c = int(ko.split('_')[0])
        # poids en votes complets
        for cn, w in dd.items(): orig[cn][c] += w
    transp[y] = (tot, orig)

NAT = {'regions': REGIONS, 'circ': []}
for c26, C in sorted(D['2026'].items(), key=lambda kv: kv[1]['nom']):
    nom = C['nom']; sl = slug(nom); reg = REGC[c26]
    keys26 = {c26: list(C['sv'].keys())}
    y26 = annee('2026', [c26], keys26, False)
    page = {'code': c26, 'nom': nom, 'slug': sl, 'reg': reg, 'regn': REGIONS[reg], 'y26': y26}
    tv = C['tot']['bv']
    oc = OFF26[c26]
    cl = sorted([[CANON.get(k['numeroPartiPolitique'], 'AUT'), k['prenom'] + ' ' + k['nom'], k['nbVoteTotal']] for k in oc['candidats']], key=lambda x: -x[2])
    page['y26']['res'] = {'valid': tv, 'rej': C['tot']['rej'], 'el': C['off']['inscrits'],
                          'adv': sum(b['bv'] for b in C['bva'].values()), 'trans': False, 'cand': cl}
    # transposés
    for y, yk in [('2022', 'y22'), ('2018', 'y18')]:
        A_ = assign[y].get(c26, {})
        if not A_: continue
        tot, orig = transp[y]
        order = sorted(A_.keys(), key=lambda c: -orig[c26][c])
        yy = annee(y, order, A_, True)
        t = {p: tot[c26][p] for p in PARTIS}; tvt = sum(t.values())
        o = orig[c26]; so = sum(o.values())
        yy['res'] = {'valid': round(tvt), 'trans': True, 'v': {p: round(t[p]) for p in PARTIS},
                     'origins': [[D[y][c]['nom'], round(100 * o[c] / so, 1)] for c, _ in o.most_common() if o[c] / so >= .01]}
        page[yk] = yy
    # évolution par section 2026 (vote du jour, estimation)
    evo = {}
    for kn in y26['R']:
        e = {}
        for y, ek in [('2022', 'e22'), ('2018', 'e18')]:
            x = TR[y]['est'].get(kn)
            if x and sum(x['d'].values()) > 5:
                td = sum(x['d'].values()); e[ek] = {p: round(100 * x['d'][p] / td, 2) for p in PARTIS}
        if e: evo[kn] = e
    page['evo'] = evo
    pages[c26] = page
    print(nom, len(y26['R']), 'sections', {yk: len(page[yk]['R']) for yk in ['y22', 'y18'] if yk in page})
pickle.dump(pages, open(f'{S}/pages.pkl', 'wb'))
