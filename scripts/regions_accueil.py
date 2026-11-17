"""Données de la page d'ouverture (docs/assets/regions.json) : régions, silhouettes, circonscriptions par région, aux deux paliers."""
import sys, pickle, json, time
import geopandas as gpd
from shapely.geometry import Polygon, MultiPolygon
Q, DOCS = sys.argv[1], sys.argv[2]
GG = pickle.load(open(f'{Q}/geo.pkl', 'rb'))
REG = GG['REGIONS']

# --- silhouettes SVG (une par région + le Québec entier), normalisées dans une boîte 100 x 100 ---
g = gpd.read_file(f'{Q}/brut/circonscriptions_2026.json').to_crs(32198)
g['reg'] = g['CO_CEP'].astype(int).map(GG['REGC'])
assert g['reg'].notna().all()
g['geometry'] = g.buffer(300)
r = g[['reg', 'geometry']].dissolve(by='reg').reset_index()
r['geometry'] = r.buffer(-300)


def svgpath(geom, keep=0.004):
    x0, y0, x1, y1 = geom.bounds
    span = max(x1 - x0, y1 - y0)
    geom = geom.simplify(span / 260)
    polys = list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom]
    polys = [p for p in polys if p.area >= keep * span * span * 0.02]
    sx = 100 / span; ox = (100 - (x1 - x0) * sx) / 2; oy = (100 - (y1 - y0) * sx) / 2
    out = []
    for p in polys:
        pts = [(ox + (x - x0) * sx, oy + (y1 - y) * sx) for x, y in p.exterior.coords]
        out.append('M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z')
    return ''.join(out)


SIL = {row.reg: svgpath(row.geometry) for row in r.itertuples()}
SIL['QC'] = svgpath(r.union_all(), keep=0.02)

# --- résultats ---
prov = json.load(open(f'{DOCS}/assets/quebec.json', encoding='utf-8'))
fed = json.load(open(f'{DOCS}/federal/accueil.json', encoding='utf-8'))


def pct(v, p):
    t = sum(v.values()); return round(100 * v.get(p, 0) / t, 1) if t else 0


def palier(circ, me, prevk, yr, prevyr, ab):
    C = []; R = {}
    for c in sorted(circ, key=lambda c: c['n']):
        order = sorted(c['v'], key=lambda p: -c['v'][p]); w = order[0]
        mep = pct(c['v'], me); rk = order.index(me) + 1
        gap = mep - pct(c['v'], order[1]) if w == me else mep - pct(c['v'], w)
        row = {'n': c['n'], 's': c['s'], 'r': c['r'], 'w': w, 'e': c['elu'], 'p': mep, 'rk': rk, 'g': round(gap, 1),
               'pv': pct(c[prevk], me) if c.get(prevk) else None, 'pa': round(100 * (c['valid'] + c['rej']) / c['el'], 1),
               'm': c['cand'].get(me, '')}
        if c.get('bq26'): row['b26'] = c['bq26']
        C.append(row)
        s = R.setdefault(c['r'], {'n': 0, 'seats': {}, 'v': {}, 'pv': {}, 'vot': 0, 'el': 0})
        s['n'] += 1; s['seats'][w] = s['seats'].get(w, 0) + 1
        for p, x in c['v'].items(): s['v'][p] = s['v'].get(p, 0) + x
        for p, x in (c.get(prevk) or {}).items(): s['pv'][p] = s['pv'].get(p, 0) + x
        s['vot'] += c['valid'] + c['rej']; s['el'] += c['el']
    tot = {'n': 0, 'seats': {}, 'v': {}, 'pv': {}, 'vot': 0, 'el': 0}
    for s in R.values():
        tot['n'] += s['n']; tot['vot'] += s['vot']; tot['el'] += s['el']
        for k in ('seats', 'v', 'pv'):
            for p, x in s[k].items(): tot[k][p] = tot[k].get(p, 0) + x
    R['QC'] = tot
    out = {}
    for k, s in R.items():
        out[k] = {'n': s['n'], 'seats': s['seats'], 'pc': {p: pct(s['v'], p) for p in s['v']},
                  'pv': pct(s['pv'], me) if s['pv'] else None, 'pa': round(100 * s['vot'] / s['el'], 1),
                  'close': sum(1 for c in C if (k == 'QC' or c['r'] == k) and abs(c['g']) < 5)}
    return {'me': me, 'yr': yr, 'prev': prevyr, 'circ': C, 'reg': out}


out = {'regions': REG, 'sil': SIL,
       'prov': palier(prov['circ'], 'PQ', 'y22', 2026, 2022, None),
       'fed': palier(fed['circ'], 'BQ', 'y21', 2025, 2021, None)}
json.dump(out, open(f'{DOCS}/assets/regions.json', 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
print('regions.json', len(json.dumps(out)) // 1000, 'Ko', {k: out[k]['reg']['QC']['seats'] for k in ('prov', 'fed')})
open(f'{DOCS}/index.html', 'w', encoding='utf-8').write(open('gabarits/ouverture.html', encoding='utf-8').read().replace('__V__', time.strftime('%Y%m%d%H%M')))
