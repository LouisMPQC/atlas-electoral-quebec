"""Prépare la géométrie des sections de vote (2018, 2022, 2026), rattache chaque
circonscription de 2026 à sa région administrative et transpose les résultats de
2018 et 2022 sur les sections de 2026 (répartition par surface, pondérée par la
densité d'électeurs des sections de 2026)."""
import sys, pickle, json
import geopandas as gpd, pandas as pd, numpy as np
from collections import defaultdict

S = sys.argv[1]
D = pickle.load(open(f'{S}/res.pkl', 'rb'))
P = {'2026': f'{S}/x/sections_vote_2026_shapefile/sections_de_vote_15_07_2026_shapefile.shp',
     '2022': f'{S}/x/sections_vote_2022_shapefile/Section_de_vote.shp',
     '2018': f'{S}/x/sections_vote_2018_shapefile/Sections_vote_23_08_2018_shapefile/Section_de_vote.shp'}
PARTIS = ['PQ', 'CAQ', 'PLQ', 'QS', 'PCQ', 'AUT']

# Division de recensement (2 premiers chiffres du code de municipalité) -> région administrative
DR = {}
for r, codes in {
    '11': '01-06', '01': '07-14', '03': '15-16,20-23,34', '12': '17-19,25-29,31,33', '05': '30,40-45',
    '17': '32,38-39,49-50', '04': '35-37,51,90', '16': '46-48,53-59,67-71', '14': '52,60-64', '13': '65',
    '06': '66', '15': '72-79', '07': '80-84', '08': '85-89', '02': '91-94', '09': '95-98', '10': '99'}.items():
    for part in codes.split(','):
        a, b = (part.split('-') + [part])[:2]
        for i in range(int(a), int(b) + 1):
            DR[f'{i:02d}'] = r
REGIONS = {'01': 'Bas-Saint-Laurent', '02': 'Saguenay–Lac-Saint-Jean', '03': 'Capitale-Nationale', '04': 'Mauricie',
           '05': 'Estrie', '06': 'Montréal', '07': 'Outaouais', '08': 'Abitibi-Témiscamingue', '09': 'Côte-Nord',
           '10': 'Nord-du-Québec', '11': 'Gaspésie–Îles-de-la-Madeleine', '12': 'Chaudière-Appalaches', '13': 'Laval',
           '14': 'Lanaudière', '15': 'Laurentides', '16': 'Montérégie', '17': 'Centre-du-Québec'}

G = {}
for y, p in P.items():
    g = gpd.read_file(p)
    g = g[g['IND_OFF'] == 'O'].copy()
    cep = 'CO_CEP_VG' if 'CO_CEP_VG' in g else 'CO_CEP'
    sv = 'NO_SV_VG' if 'NO_SV_VG' in g else 'NO_SV'
    mu = 'CODE_MUNCP' if 'CODE_MUNCP' in g else 'CO_MUNCP'
    g['cep'] = g[cep].astype(int); g['sv'] = g[sv].astype(float).astype(int).astype(str)
    g['mun'] = g[mu].astype(str).str.zfill(5); g['nmun'] = g['NM_MUNCP']
    g['area_part'] = g.geometry.area
    g = g.sort_values('area_part', ascending=False)
    g = g.dissolve(by=['cep', 'sv'], aggfunc={'mun': 'first', 'nmun': 'first'}).reset_index()
    g = g.to_crs(32198)  # Québec Lambert (NAD83), en mètres
    g['area'] = g.geometry.area
    g['k'] = g['cep'].astype(str) + '_' + g['sv']
    ins = {f'{c}_{s}': r['ins'] for c, C in D[y].items() for s, r in C['sv'].items()}
    g['ins'] = g['k'].map(ins).fillna(0)
    G[y] = g
    print(y, len(g), 'sections')

# --- régions des circonscriptions de 2026 ---
g26 = G['2026']
g26['reg'] = g26['mun'].str[:2].map(DR)
assert g26['reg'].notna().all(), g26[g26['reg'].isna()][['mun', 'nmun']].drop_duplicates().head()
REGC = {}
for c, sub in g26.groupby('cep'):
    w = sub.groupby('reg')['ins'].sum()
    REGC[int(c)] = w.idxmax()
print('régions :', {REGIONS[r]: n for r, n in pd.Series(REGC).value_counts().items()})

# --- votes complets par section (jour + anticipation + votes spéciaux répartis) ---
def complets(y):
    out = {}
    for c, C in D[y].items():
        sv = C['sv']
        base = {s: dict(r['v']) for s, r in sv.items()}
        # sections regroupées : les votes du bureau hôte sont répartis selon les électeurs
        hotes = defaultdict(list)
        for s, r in sv.items():
            rg = r.get('regr', '')
            if rg.startswith('Regr. BVO-'):
                h = rg.split('-', 1)[1]
                if h in sv: hotes[h].append(s)
        for h, mem in hotes.items():
            grp = [h] + mem; tot_ins = sum(sv[s]['ins'] for s in grp) or len(grp)
            hv = dict(base[h])
            for s in grp:
                f = (sv[s]['ins'] or (1 if not tot_ins else 0)) / tot_ins
                base[s] = {p: hv[p] * f for p in PARTIS}
        day = {s: dict(v) for s, v in base.items()}
        full = {s: dict(v) for s, v in base.items()}
        def spread(v, members, wkey):
            members = [s for s in members if s in full]
            if not members: members = list(full)
            w = [sum(day[s].values()) if wkey == 'bv' else sv[s]['ins'] for s in members]
            if sum(w) == 0: w = [sv[s]['ins'] or 1 for s in members]
            t = sum(w)
            for s, wi in zip(members, w):
                for p in PARTIS: full[s][p] += v[p] * wi / t
        for b in C['bva'].values(): spread(b['v'], b['s'], 'bv')
        for x in C['spec'].values(): spread(x['v'], list(full), 'bv')
        for s in full: out[f'{c}_{s}'] = (day[s], full[s])
        # contrôle : la somme redonne le total officiel
        for p in PARTIS:
            assert abs(sum(full[s][p] for s in full) - C['tot']['v'][p]) < 1e-6, (y, C['nom'], p)
    return out

# --- transposition sur les sections de 2026 ---
g26i = g26[['k', 'cep', 'area', 'ins', 'geometry']].copy()
g26i['dens'] = g26i['ins'] / g26i['area'].clip(lower=1)
TR = {}
for y in ['2022', '2018']:
    V = complets(y)
    go = G[y][['k', 'cep', 'geometry']].rename(columns={'k': 'ko', 'cep': 'cepo'})
    ov = gpd.overlay(go, g26i, how='intersection', keep_geom_type=True)
    ov['a'] = ov.geometry.area
    ov['w'] = ov['a'] * (ov['dens'] + 1e-7)
    ov['w'] = ov['w'] / ov.groupby('ko')['w'].transform('sum')
    perdus = set(V) - set(ov['ko'])
    print(y, 'intersections', len(ov), '; sections sans correspondance :', len(perdus))
    est = defaultdict(lambda: {'d': defaultdict(float), 'f': defaultdict(float)})
    dest = defaultdict(lambda: defaultdict(float))   # part de chaque ancienne section dans chaque circonscription 2026
    for ko, kn, cn, w in zip(ov['ko'], ov['k'], ov['cep'], ov['w']):
        if ko not in V: continue
        d, f = V[ko]
        e = est[kn]
        for p in PARTIS:
            e['d'][p] += d[p] * w; e['f'][p] += f[p] * w
        dest[ko][int(cn)] += w
    # votes des anciennes sections sans polygone : répartis dans la circonscription 2026 la plus proche de leur ancienne circonscription
    tot_old = sum(sum(f.values()) for d, f in V.values()); tot_new = sum(sum(e['f'].values()) for e in est.values())
    print(y, 'votes transposés', round(tot_new), 'sur', tot_old, f'({100*tot_new/tot_old:.3f} %)')
    TR[y] = {'est': {k: {'d': dict(v['d']), 'f': dict(v['f'])} for k, v in est.items()},
             'dest': {k: dict(v) for k, v in dest.items()}}
pickle.dump({'G': {y: g.drop(columns=['area_part'], errors='ignore') for y, g in G.items()},
             'REGC': REGC, 'REGIONS': REGIONS, 'TR': TR}, open(f'{S}/geo.pkl', 'wb'))
print('ok')
