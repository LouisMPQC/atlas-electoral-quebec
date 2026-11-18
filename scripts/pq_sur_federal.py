"""Reporte les résultats du PQ du 5 octobre 2026 (sections provinciales, jour du scrutin) sur les sections fédérales
des circonscriptions en élection partielle. Répartition selon la surface commune pondérée par la densité d'électeurs
de chaque section fédérale. Ajoute p['pq26'] = {section fédérale: [votes PQ, votes valides]} dans pages_tout.pkl."""
import sys, pickle
import geopandas as gpd
from shapely.geometry import shape
PAGES, Q = sys.argv[1], sys.argv[2]
P = pickle.load(open(PAGES, 'rb'))
GG = pickle.load(open(f'{Q}/geo.pkl', 'rb'))
RES = pickle.load(open(f'{Q}/res.pkl', 'rb'))['2026']
prov = GG['G']['2026'][['k', 'cep', 'sv', 'geometry']].copy()
def votes(r):
    c = RES.get(int(r.cep)) if int(r.cep) in RES else RES.get(str(r.cep))
    if not c: return None
    s = c['sv'].get(str(r.sv))
    if not s or s.get('regr'): return None
    return s['v'].get('PQ', 0), sum(s['v'].values())
prov['pv'] = prov.apply(votes, axis=1)
prov = prov[prov['pv'].notna()]
for p in P.values():
    if not p.get('bq26'): continue
    y = p['y25']
    f = gpd.GeoDataFrame([{'k': ft['properties']['k'], 'geometry': shape(ft['geometry'])} for ft in y['fc']['features']], crs=4326).to_crs(32198)
    f['ins'] = f['k'].map(lambda k: (y['R'].get(k) or {}).get('ins', 0))
    f['dens'] = f['ins'] / f.area.clip(lower=1)
    src = prov[prov.intersects(f.union_all())]
    ov = gpd.overlay(src[['k', 'pv', 'geometry']].rename(columns={'k': 'ks'}), f[['k', 'dens', 'geometry']], how='intersection', keep_geom_type=True)
    ov['w'] = ov.area * (ov['dens'] + 1e-9)
    ov['w'] = ov['w'] / ov.groupby('ks')['w'].transform('sum')
    out = {}
    for r in ov.itertuples():
        pq, va = r.pv
        o = out.setdefault(r.k, [0.0, 0.0]); o[0] += pq * r.w; o[1] += va * r.w
    p['pq26'] = {k: [round(a, 1), round(b, 1)] for k, (a, b) in out.items()}
    tp = sum(a for a, b in out.values()); tv = sum(b for a, b in out.values())
    print(p['slug'], len(out), 'sections fédérales', 'PQ', round(100 * tp / tv, 1), '%', 'valides', round(tv))
pickle.dump(P, open(PAGES, 'wb'))
