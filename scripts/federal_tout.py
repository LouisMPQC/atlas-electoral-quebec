"""Pages fédérales (angle Bloc Québécois) pour les partielles du 7 décembre 2026 :
résultats par bureau de vote d'Élections Canada (2021 et 2025), limites des sections,
transposition de 2021 sur les sections de 2025. Produit des pages au même format que
les pages provinciales de l'atlas."""
import sys, csv, re, json, math, os, pickle, unicodedata
from collections import defaultdict, Counter
import geopandas as gpd, numpy as np
from shapely.geometry import mapping, Point
from shapely.ops import unary_union

X, BRUT, OUT, PROV = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
BQC = {24037: 'Zumretay Arkin', 24065: 'Alexandre Curzi', 24066: 'Caroline Émond'}  # partielles du 7 décembre 2026
CIBLES = {}
for fn in sorted(os.listdir(f'{X}/r2025')):
    f = int(fn[:5]); r = next(csv.reader(open(f'{X}/r2025/{fn}', encoding='utf-8-sig')) for _ in [0])
    rows = list(csv.reader(open(f'{X}/r2025/{fn}', encoding='utf-8-sig')))
    CIBLES[f] = rows[1][2].replace('--', '–')
PARTIS = ['BQ', 'PLC', 'NPD', 'PCC', 'PV', 'AUT']

def parti(fr):
    if fr.startswith('Bloc'): return 'BQ'
    if fr.startswith('Libéral'): return 'PLC'
    if fr.startswith('NPD'): return 'NPD'
    if fr.startswith('Conservateur'): return 'PCC'
    if fr.startswith('Parti Vert'): return 'PV'
    return 'AUT'

def base(p):
    return re.sub(r'[A-Z]+$', '', p.split('-')[0])

def lire(annee, fed):
    rows = list(csv.reader(open(f'{X}/r{annee}/{fed}.csv', encoding='utf-8-sig')))[1:]
    polls = {}
    cand = defaultdict(int); cname = {}
    nom = rows[0][2].replace('--', '–')
    for r in rows:
        p = r[3].strip(); q = parti(r[14])
        rec = polls.setdefault(p, {'v': {x: 0 for x in PARTIS}, 'rej': int(r[8] or 0), 'el': int(r[9] or 0), 'name': r[4],
                                   'void': r[5] == 'Y', 'nopoll': r[6] == 'Y', 'comb': r[7].strip()})
        v = int(r[17] or 0); rec['v'][q] += v
        key = (r[12] + ' ' + r[10]).strip(); cand[key] += v; cname[key] = q
    C = {'code': fed, 'nom': nom, 'sv': {}, 'bva': {}, 'spec': {}}
    for p, rec in polls.items():
        if p.startswith('S/R'):
            C['spec']['Votes spéciaux, groupe ' + p[-1]] = rec; continue
        b = base(p); n = int(b)
        if 600 <= n < 700:
            C['bva'][b] = rec; continue
        o = C['sv'].get(b)
        if o is None:
            rec = dict(rec, v=dict(rec['v'])); rec['parts'] = 1; rec['combs'] = [rec['comb']] if rec['comb'] else []
            C['sv'][b] = rec
        else:
            for x in PARTIS: o['v'][x] += rec['v'][x]
            o['rej'] += rec['rej']; o['el'] += rec['el']; o['parts'] += 1
            if rec['comb']: o['combs'].append(rec['comb'])
    for b, o in C['sv'].items():
        if sum(o['v'].values()) == 0 and o['combs']:
            o['regr'] = base(o['combs'][0])
    tv = sum(sum(r['v'].values()) for r in polls.values())
    C['valid'] = tv; C['rej'] = sum(r['rej'] for r in polls.values())
    C['el'] = sum(r['el'] for r in polls.values())  # total officiel (inclut les électeurs inscrits aux votes spéciaux)
    C['cand'] = sorted([[cname[k], k, v] for k, v in cand.items()], key=lambda x: -x[2])
    return C

def geo(annee, feds):
    p = f'{X}/pd2025/SHP/PD_CA_2025_EN.shp' if annee == '2025' else f'{X}/pd2021/PD_CA_2021_EN.shp'
    w = 'FED_NUM IN (' + ','.join(str(f) for f in feds) + ')'
    g = gpd.read_file(p, where=w)
    g['fed'] = g['FED_NUM'].astype(int); g['sv'] = g['PD_NUM'].astype(int).astype(str)
    g = g.dissolve(by=['fed', 'sv'], aggfunc={'ADV_POLL_N': 'first'}).reset_index().to_crs(32198)
    g['k'] = g['fed'].astype(str) + '_' + g['sv']; g['area'] = g.geometry.area
    return g

# --- 2025 : les trois circonscriptions ---
R25 = {f: lire('2025', f) for f in CIBLES}
G25 = geo('2025', list(CIBLES))
for f, C in R25.items():
    s = sum(C['v'][x] for C in [] for x in []) if False else None
    print(C['nom'], '2025 : votes valides', C['valid'], ', rejetés', C['rej'], ', élu', C['cand'][0][1])
# BVA membership 2025 from geometry
# --- 2021 : circonscriptions qui touchent les trois ---
feds21 = sorted(int(fn[:5]) for fn in os.listdir(f'{X}/r2021'))
G21 = geo('2021', feds21)
R21 = {f: lire('2021', f) for f in feds21}
print('2021 :', len(feds21), 'circonscriptions')

def adv_map(g):
    m = defaultdict(list)
    for k, a in zip(g['k'], g['ADV_POLL_N']):
        fed, sv = k.split('_'); m[(int(fed), str(a))].append(sv)
    return m
ADV25, ADV21 = adv_map(G25), adv_map(G21)

# --- votes complets par section 2021 puis transposition sur 2025 ---
def complets(C, adv):
    sv = C['sv']; base_ = {s: dict(r['v']) for s, r in sv.items()}
    hotes = defaultdict(list)
    for s, r in sv.items():
        if r.get('regr') and r['regr'] in sv: hotes[r['regr']].append(s)
    for h, mem in hotes.items():
        grp = [h] + mem; ti = sum(sv[s]['el'] for s in grp) or len(grp); hv = dict(base_[h])
        for s in grp: base_[s] = {p: hv[p] * ((sv[s]['el'] or (0 if ti else 1)) / ti) for p in PARTIS}
    day = {s: dict(v) for s, v in base_.items()}; full = {s: dict(v) for s, v in base_.items()}
    def spread(v, mem):
        mem = [s for s in mem if s in full] or list(full)
        w = [sum(day[s].values()) for s in mem]
        if sum(w) == 0: w = [sv[s]['el'] or 1 for s in mem]
        t = sum(w)
        for s, wi in zip(mem, w):
            for p in PARTIS: full[s][p] += v[p] * wi / t
    for b, x in C['bva'].items(): spread(x['v'], adv.get((C['code'], b), []))
    for x in C['spec'].values(): spread(x['v'], list(full))
    return {f'{C["code"]}_{s}': (day[s], full[s]) for s in full}
V21 = {}
for f, C in R21.items(): V21.update(complets(C, ADV21))
g25i = G25[['k', 'fed', 'area', 'geometry']].copy()
el25 = {f'{f}_{s}': r['el'] for f, C in R25.items() for s, r in C['sv'].items()}
g25i['dens'] = g25i['k'].map(el25).fillna(0) / g25i['area'].clip(lower=1)
ov = gpd.overlay(G21[['k', 'fed', 'geometry']].rename(columns={'k': 'ko', 'fed': 'fo'}), g25i, how='intersection', keep_geom_type=True)
ov['w'] = ov.geometry.area * (ov['dens'] + 1e-7)
# part de chaque ancienne section qui tombe dans les trois circonscriptions (le reste va ailleurs)
G21['areaall'] = G21.geometry.area
ov['share_area'] = ov.geometry.area / ov['ko'].map(dict(zip(G21['k'], G21['areaall'])))
EST = defaultdict(lambda: {'d': defaultdict(float), 'f': defaultdict(float)}); DEST = defaultdict(lambda: defaultdict(float))
# normalisation : on répartit la part de surface couverte, pondérée par la densité, sur les sections 2025
for ko, grp in ov.groupby('ko'):
    if ko not in V21: continue
    cover = min(1.0, grp['share_area'].sum())
    ww = grp['w'] / grp['w'].sum() * cover
    d, fu = V21[ko]
    for kn, fn, w in zip(grp['k'], grp['fed'], ww):
        for p in PARTIS: EST[kn]['d'][p] += d[p] * w; EST[kn]['f'][p] += fu[p] * w
        DEST[ko][int(fn)] += w

def slug(s):
    s = unicodedata.normalize('NFD', s); s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')
def rnd(c):
    if isinstance(c[0], (list, tuple)): return [rnd(x) for x in c]
    return [round(c[0], 5), round(c[1], 5)]

QR = None
if os.path.exists(f'{BRUT}/quartiers_montreal.geojson'):
    QR = gpd.read_file(f'{BRUT}/quartiers_montreal.geojson').to_crs(32198)

def secteurs(g, C, keys):
    names = {}
    for k in keys:
        r = C[k.split('_')[0]]['sv'][k.split('_')[1]] if False else None
    return names

def annee(yk, Rmap, G, ADV, keys_by_fed):
    R = {}; feats = []; sec = {}; bva = {}; A = {}; SP = {}; SPr = {}; orph = []
    multi = len(keys_by_fed) > 1
    lab = lambda f, s: (s + ' · ' + Rmap[f]['nom']) if multi else s
    keys = [f'{f}_{s}' for f, ss in keys_by_fed.items() for s in ss]
    sub = G[G['k'].isin(keys)]
    # secteurs : nom de municipalité des bureaux ; à Montréal, quartiers de référence
    muni = {}
    for f, ss in keys_by_fed.items():
        for s in ss:
            n = Rmap[f]['sv'][s]['name']
            muni[f'{f}_{s}'] = '' if n.startswith('Mobile') or n.startswith('SVR') else n
    secnote = None
    if len({m for m in muni.values() if m}) >= 2:
        for k in keys: sec[k] = muni[k]
        sectyp = 'Municipalité'; secnote = 'Les secteurs sont les municipalités de la circonscription (bureaux itinérants exclus).'
    else:
        qmap = {}
        if QR is not None:
            pts = sub.copy(); pts['geometry'] = pts.geometry.representative_point()
            j = gpd.sjoin(pts[['k', 'geometry']], QR[['nom_qr', 'geometry']], predicate='within', how='left')
            qmap = {k: q for k, q in zip(j['k'], j['nom_qr']) if isinstance(q, str)}
        if len(qmap) >= .8 * max(1, len(sub)):
            for k in keys: sec[k] = qmap.get(k, '')
            sectyp = 'Quartier'; secnote = 'Les secteurs sont les quartiers de référence de la Ville de Montréal ; chaque section est rattachée au quartier où se trouve son centre.'
        else:
            # une seule municipalité hors Montréal : les secteurs sont les territoires des bureaux de vote par anticipation
            for f, ss in keys_by_fed.items():
                for s in ss:
                    a_ = next((b for (ff, b), mem in ADV.items() if ff == f and s in mem), None)
                    sec[f'{f}_{s}'] = ('Secteur du BVA ' + a_ + ((' · ' + Rmap[f]['nom']) if multi else '')) if a_ else ''
            sectyp = 'Secteur'; secnote = 'La circonscription compte une seule municipalité : les secteurs sont les territoires des bureaux de vote par anticipation (BVA), qui regroupent chacun plusieurs sections voisines.'
    for f, ss in keys_by_fed.items():
        C = Rmap[f]
        for s in ss:
            r = C['sv'][s]; k = f'{f}_{s}'
            d = {p: r['v'][p] for p in PARTIS}; d['ins'] = r['el']; d['rej'] = r['rej']
            if r.get('regr'): d['regr'] = f'{f}_{r["regr"]}'
            R[k] = d
        keep = set(ss)
        for b, x in C['bva'].items():
            mem = [s for s in ADV.get((f, b), []) if s in C['sv']]
            on = [s for s in mem if s in keep]
            if not mem:
                orph.append((f, b, x)); continue
            if len(on) * 2 < len(mem): continue
            ak = f'{f}_{b}'; w = Counter(); insb = 0
            for s in on:
                w[sec.get(f'{f}_{s}', '')] += C['sv'][s]['el'] or 1; insb += C['sv'][s]['el']; bva[f'{f}_{s}'] = ak
            tw = sum(w.values()) or 1
            A[ak] = {'lab': 'BVA ' + b + ((' · ' + C['nom']) if multi else ''), 'v': {p: x['v'][p] for p in PARTIS}, 'rej': x['rej'],
                     's': [f'{f}_{s}' for s in sorted(on, key=int)], 'w': {k2: round(v / tw, 4) for k2, v in w.items()}, 'ins': insb, 'part': len(on) < len(mem)}
    main = list(keys_by_fed)[0]
    for l2, x in Rmap[main]['spec'].items():
        SP[l2] = {p: x['v'][p] for p in PARTIS}; SPr[l2] = x['rej']
    for f, b, x in orph:  # BVA sans section rattachée dans le fichier des limites
        if f == main and sum(x['v'].values()):
            SP[f'BVA {b} (sans territoire)'] = {p: x['v'][p] for p in PARTIS}; SPr[f'BVA {b} (sans territoire)'] = x['rej']
    gw = sub.copy()
    tol = np.maximum(2.5, np.sqrt(gw.geometry.area) / 200)
    gw['geometry'] = [geom.simplify(t, preserve_topology=True) for geom, t in zip(gw.geometry, tol)]
    gw = gw.to_crs(4326)
    for k, geom in zip(gw['k'], gw.geometry):
        f, s = k.split('_')
        feats.append({'type': 'Feature', 'properties': {'k': k, 'n': lab(int(f), s), 'mun': muni.get(k, '')},
                      'geometry': {'type': geom.geom_type, 'coordinates': rnd(mapping(geom)['coordinates'])}})
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
    return {'fc': {'type': 'FeatureCollection', 'features': feats}, 'R': R, 'A': A, 'SP': SP, 'SPr': SPr, 'sec': sec, 'sectyp': sectyp,
            'secnote': secnote, 'bva': bva, 'Afc': {'type': 'FeatureCollection', 'features': Afc}, 'm': rings, 'olds': [Rmap[f]['nom'] for f in keys_by_fed]}

# rattachement des sections 2021 à la page qui en reçoit le plus
ASSIGN = defaultdict(lambda: defaultdict(list))
for ko, dd in DEST.items():
    fn = max(dd, key=dd.get); f, s = ko.split('_')
    if dd[fn] >= .2: ASSIGN[fn][int(f)].append(s)

CFG = {'me': 'BQ', 'po': PARTIS,
       'pl': {'BQ': 'Bloc Québécois', 'PLC': 'Parti libéral', 'NPD': 'NPD', 'PCC': 'Parti conservateur', 'PV': 'Parti vert', 'AUT': 'Autres'},
       'ab': {'BQ': 'Bloc', 'PLC': 'PLC', 'NPD': 'NPD', 'PCC': 'PCC', 'PV': 'PV', 'AUT': 'Autres'},
       'le': {'BQ': 'Le Bloc', 'PLC': 'Le Parti libéral', 'NPD': 'Le NPD', 'PCC': 'Le Parti conservateur', 'PV': 'Le Parti vert', 'AUT': 'Un autre candidat'},
       'du': 'du Bloc',
       'pc': {'BQ': '#3fb6e8', 'PLC': '#e5534b', 'NPD': '#f39a3d', 'PCC': '#5a82d0', 'PV': '#4caf6a', 'AUT': '#8a96a3'},
       'yr': {'y25': {'yr': '2025', 'date': '28 avril 2025', 't': 'Élection générale fédérale du 28 avril 2025'},
              'y21': {'yr': '2021', 'date': '20 septembre 2021', 't': 'Élection générale fédérale du 20 septembre 2021'}},
       'yks': ['y25', 'y21'], 'evo': [['e21', '2021', 'y21']], 'org': 'Élections Canada', 'strong': 25}
GP = pickle.load(open(f'{PROV}/geo.pkl', 'rb'))
REGIONS = GP['REGIONS']; DR = {}
for r_, codes in {'11': '01-06', '01': '07-14', '03': '15-16,20-23,34', '12': '17-19,25-29,31,33', '05': '30,40-45', '17': '32,38-39,49-50', '04': '35-37,51,90',
                  '16': '46-48,53-59,67-71', '14': '52,60-64', '13': '65', '06': '66', '15': '72-79', '07': '80-84', '08': '85-89', '02': '91-94', '09': '95-98', '10': '99'}.items():
    for part in codes.split(','):
        a_, b_ = (part.split('-') + [part])[:2]
        for i in range(int(a_), int(b_) + 1): DR[f'{i:02d}'] = r_
p26 = GP['G']['2026'][['mun', 'geometry']].copy(); p26['reg'] = p26['mun'].str[:2].map(DR)
pts = G25[['k', 'fed', 'geometry']].copy(); pts['geometry'] = pts.geometry.representative_point()
pts['el'] = pts['k'].map(el25).fillna(0) + 1
jj = gpd.sjoin(pts, p26[['reg', 'geometry']], predicate='within', how='left')
REGF = {int(f): grp.groupby('reg')['el'].sum().idxmax() for f, grp in jj.dropna(subset=['reg']).groupby('fed')}
print('régions fédérales :', Counter(REGIONS[r_] for r_ in REGF.values()))
pages = {}
for f, nom in CIBLES.items():
    C = R25[f]
    y25 = annee('y25', R25, G25, ADV25, {f: list(C['sv'].keys())})
    y25['res'] = {'valid': C['valid'], 'rej': C['rej'], 'el': C['el'], 'adv': sum(sum(b['v'].values()) for b in C['bva'].values()), 'trans': False, 'cand': C['cand']}
    bq = 100 * sum(x for p_, n_, x in C['cand'] if p_ == 'BQ') / C['valid']
    cfg = dict(CFG, strong=int(max(20, 5 * math.ceil((bq + 3) / 5))))  # seuil « Bloc fort » adapté à la circonscription
    reg = REGF[f]
    page = {'code': f, 'nom': nom, 'slug': slug(nom), 'cfg': cfg, 'y25': y25, 'bq26': BQC.get(f), 'reg': reg, 'regn': REGIONS[reg],
            'crumb': '<a href="../../">Atlas électoral du Québec</a> › <a href="../#r=' + reg + '">Fédéral · ' + REGIONS[reg] + '</a>'}
    A_ = ASSIGN.get(f, {})
    if A_:
        orig = Counter()
        for ko, dd in DEST.items():
            if f in dd: orig[int(ko.split('_')[0])] += dd[f] * sum(V21[ko][1].values())
        order = sorted(A_, key=lambda x: -orig[x])
        y21 = annee('y21', R21, G21, ADV21, {o: A_[o] for o in order})
        t = defaultdict(float)
        for kn, e in EST.items():
            if kn.startswith(f'{f}_'):
                for p in PARTIS: t[p] += e['f'][p]
        so = sum(orig.values())
        y21['res'] = {'valid': round(sum(t.values())), 'trans': True, 'v': {p: round(t[p]) for p in PARTIS},
                      'origins': [[R21[o]['nom'], round(100 * orig[o] / so, 1)] for o, _ in orig.most_common() if orig[o] / so >= .01]}
        page['y21'] = y21
    evo = {}
    for kn in y25['R']:
        x = EST.get(kn)
        if x and sum(x['d'].values()) > 5:
            td = sum(x['d'].values()); evo[kn] = {'e21': {p: round(100 * x['d'][p] / td, 2) for p in PARTIS}}
    page['evo'] = evo
    pages[f] = page
    r21 = page.get('y21', {}).get('res', {})
    print(nom, len(y25['R']), 'sections 2025 ;', len(page.get('y21', {}).get('R', {})), 'sections 2021 ; secteurs :', y25['sectyp'],
          '; Bloc 2025', round(100 * sum(x for p, n, x in C['cand'] if p == 'BQ') / C['valid'], 1), '; Bloc 2021 transposé', round(100 * r21['v']['BQ'] / r21['valid'], 1) if r21 else None,
          '; origines', r21.get('origins'))
pickle.dump(pages, open(OUT, 'wb'))
fedpoly = G25.dissolve(by='fed').reset_index()[['fed', 'geometry']]
fedpoly['geometry'] = fedpoly.geometry.simplify(200)
fw = fedpoly.to_crs(4326)
def rnd4(c):
    if isinstance(c[0], (list, tuple)): return [rnd4(x) for x in c]
    return [round(c[0], 4), round(c[1], 4)]
feats = [{'type': 'Feature', 'properties': {'c': int(f)}, 'geometry': {'type': g.geom_type, 'coordinates': rnd4(mapping(g)['coordinates'])}} for f, g in zip(fw['fed'], fw.geometry)]
circ = []
for f, p in pages.items():
    r = p['y25']['res']; v = {q: 0 for q in PARTIS}
    for q, n, x in r['cand']: v[q] += x
    row = {'c': f, 'n': p['nom'], 's': p['slug'], 'r': p['reg'], 'v': v, 'valid': r['valid'], 'rej': r['rej'], 'el': r['el'], 'elu': r['cand'][0][1],
           'cand': {q: n for q, n, x in sorted(r['cand'], key=lambda t: t[2]) if q != 'AUT'}}
    if 'y21' in p: row['y21'] = p['y21']['res']['v']
    if p.get('bq26'): row['bq26'] = p['bq26']
    circ.append(row)
json.dump({'regions': {p['reg']: p['regn'] for p in pages.values()}, 'circ': sorted(circ, key=lambda x: x['n']), 'fc': {'type': 'FeatureCollection', 'features': feats}},
          open(OUT.replace('.pkl', '_accueil.json'), 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
