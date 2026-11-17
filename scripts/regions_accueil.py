"""Polygones des 17 régions et statistiques pour la page d'ouverture (docs/assets/regions.json)."""
import sys, pickle, json
import geopandas as gpd
Q, DOCS = sys.argv[1], sys.argv[2]
GG = pickle.load(open(f'{Q}/geo.pkl', 'rb'))
g = gpd.read_file(f'{Q}/brut/circonscriptions_2026.json').to_crs(32198)
g['reg'] = g['CO_CEP'].astype(int).map(GG['REGC'])
assert g['reg'].notna().all()
g['geometry'] = g.buffer(200)
r = g[['reg', 'geometry']].dissolve(by='reg').reset_index()
r['geometry'] = r.buffer(-200).simplify(1500)
r = r.to_crs(4326)
prov = json.load(open(f'{DOCS}/assets/quebec.json', encoding='utf-8'))
fed = json.load(open(f'{DOCS}/federal/accueil.json', encoding='utf-8'))
def stats(circ, me):
    o = {}
    for c in circ:
        w = max(c['v'], key=c['v'].get)
        s = o.setdefault(c['r'], {'n': 0, 'me': 0, 'v': 0, 't': 0})
        s['n'] += 1; s['me'] += w == me; s['v'] += c['v'][me]; s['t'] += sum(c['v'].values())
    return {k: {'n': v['n'], 'me': v['me'], 'pc': round(100 * v['v'] / v['t'], 1)} for k, v in o.items()}
out = {'regions': GG['REGIONS'], 'prov': stats(prov['circ'], 'PQ'), 'fed': stats(fed['circ'], 'BQ'),
       'parts': [{'n': c['n'], 's': c['s'], 'r': c['r'], 'b': c['bq26']} for c in fed['circ'] if c.get('bq26')],
       'fc': json.loads(r[['reg', 'geometry']].to_json(drop_id=True))}
for f in out['fc']['features']:
    def rd(x): return [rd(y) for y in x] if isinstance(x[0], list) else [round(x[0], 4), round(x[1], 4)]
    f['geometry']['coordinates'] = rd(f['geometry']['coordinates'])
json.dump(out, open(f'{DOCS}/assets/regions.json', 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
print({k: (v['n'], v['me'], v['pc']) for k, v in sorted(out['prov'].items())})
print({k: (v['n'], v['me'], v['pc']) for k, v in sorted(out['fed'].items())})
import time
open(f'{DOCS}/index.html', 'w', encoding='utf-8').write(open('gabarits/ouverture.html', encoding='utf-8').read().replace('__V__', time.strftime('%Y%m%d%H%M')))
