"""Écrit le site statique dans docs/ : une page par circonscription et les données de l'accueil."""
import sys, pickle, json, os, time
import geopandas as gpd
from shapely.geometry import mapping
S, DOCS, GAB = sys.argv[1], sys.argv[2], sys.argv[3]
P = pickle.load(open(f'{S}/pages.pkl', 'rb'))
PARTIS = ['PQ', 'CAQ', 'PLQ', 'QS', 'PCQ', 'AUT']
V = time.strftime('%Y%m%d%H%M')
gab = open(f'{GAB}/circonscription.html', encoding='utf-8').read()
J = lambda o: json.dumps(o, separators=(',', ':'), ensure_ascii=False).replace('</', '<\\/')

byreg = {}
for p in P.values(): byreg.setdefault(p['reg'], []).append(p)
for p in P.values():
    sibs = sorted(byreg[p['reg']], key=lambda x: x['nom'])
    nav = ''.join(f'<option value="{s["slug"]}"{" selected" if s is p else ""}>{s["nom"]}</option>' for s in sibs)
    data = {k: v for k, v in p.items()}
    html = (gab.replace('__NOM__', p['nom']).replace('__REGION__', p['regn']).replace('__NAV__', nav)
            .replace('__V__', V).replace('__DATA__', J(data)))
    d = f'{DOCS}/circonscription/{p["slug"]}'
    os.makedirs(d, exist_ok=True)
    open(f'{d}/index.html', 'w', encoding='utf-8').write(html)

# --- accueil ---
g = gpd.read_file(f'{S}/brut/circonscriptions_2026.json').to_crs(32198)
g['code'] = g['CO_CEP'].astype(int)
codes = set(P.keys()); assert set(g['code']) == codes, (set(g['code']) ^ codes)
g['geometry'] = g.geometry.simplify(250)
gw = g.to_crs(4326)
def rnd(c):
    if isinstance(c[0], (list, tuple)): return [rnd(x) for x in c]
    return [round(c[0], 4), round(c[1], 4)]
feats = []
for code, geom in zip(gw['code'], gw.geometry):
    feats.append({'type': 'Feature', 'properties': {'c': int(code)}, 'geometry': {'type': geom.geom_type, 'coordinates': rnd(mapping(geom)['coordinates'])}})
circ = []
for c, p in P.items():
    r = p['y26']['res']; v = {q: 0 for q in PARTIS}
    for q, n, x in r['cand']: v[q] += x
    cand = {q: n for q, n, x in sorted(r['cand'], key=lambda t: t[2]) if q != 'AUT'}
    row = {'c': c, 'n': p['nom'], 's': p['slug'], 'r': p['reg'], 'v': v, 'valid': r['valid'], 'rej': r['rej'], 'el': r['el'],
           'elu': r['cand'][0][1], 'cand': cand}
    for yk in ['y22', 'y18']:
        if yk in p: row[yk] = p[yk]['res']['v']
    circ.append(row)
NAT = {'regions': P[next(iter(P))]['regn'] and {p['reg']: p['regn'] for p in P.values()}, 'circ': sorted(circ, key=lambda x: x['n']),
       'fc': {'type': 'FeatureCollection', 'features': feats}}
open(f'{DOCS}/index.html', 'w', encoding='utf-8').write(open(f'{GAB}/accueil.html', encoding='utf-8').read().replace('__V__', V))
open(f'{DOCS}/assets/quebec.json', 'w', encoding='utf-8').write(json.dumps(NAT, separators=(',', ':'), ensure_ascii=False))
print('pages', len(P), 'accueil', os.path.getsize(f'{DOCS}/assets/quebec.json') // 1000, 'Ko', 'version', V)
