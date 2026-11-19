"""Ajoute les lieux de vote (liste du directeur du scrutin, géocodée) aux pages des partielles dans pages_tout.pkl."""
import sys, json, pickle
PAGES, LIEUX, GEO = sys.argv[1:4]
P = pickle.load(open(PAGES, 'rb')); D = json.load(open(LIEUX, encoding='utf-8')); G = json.load(open(GEO, encoding='utf-8'))
for p in P.values():
    c = D.get(str(p['code']))
    if not c: p.pop('lieux', None); continue
    out = {}
    for t in ('bvo', 'bva'):
        out[t] = []
        for x in c.get(t, []):
            g = G.get(x['adr']) or {}
            out[t].append({**x, 'lat': round(g['lat'], 6) if g else None, 'lng': round(g['lng'], 6) if g else None})
    p['lieux'] = out
    ks = {k for k in p['y25']['R']}
    nb = {f"{p['code']}_{n}" for x in out['bvo'] for n in x['sec']}; na = {f"{p['code']}_{n}" for x in out['bva'] for n in x['sec']}
    sans = sorted(int(k.split('_')[1]) for k in ks if k not in nb and int(k.split('_')[1]) < 500)
    print(p['slug'], 'BVO', len(out['bvo']), 'BVA', len(out['bva']), '· sections sans BVO :', sans, '· sans BVA :', sorted(int(k.split('_')[1]) for k in ks if k not in na and int(k.split('_')[1]) < 500))
pickle.dump(P, open(PAGES, 'wb'))
