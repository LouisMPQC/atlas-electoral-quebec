"""Écrit les 78 pages fédérales et l'accueil fédéral dans docs/federal/."""
import sys, pickle, json, os, time
S, ACC, DOCS, GAB = sys.argv[1:5]
P = pickle.load(open(S, 'rb'))
V = time.strftime('%Y%m%d%H%M')
gab = open(f'{GAB}/federale.html', encoding='utf-8').read()
J = lambda o: json.dumps(o, separators=(',', ':'), ensure_ascii=False).replace('</', '<\\/')
pages = sorted(P.values(), key=lambda p: p['nom'])
for p in pages:
    reg = [s for s in pages if s['reg'] == p['reg']]
    nav = ''.join(f'<option value="{s["slug"]}"{" selected" if s is p else ""}>{s["nom"]}</option>' for s in reg)
    pill = (f'  <span class="pill">Élection partielle le 7 décembre 2026 · {p["bq26"]} pour le Bloc</span>' if p.get('bq26') else '')
    html = (gab.replace('__NOM__', p['nom']).replace('__NAV__', nav).replace('__PILL__', pill)
            .replace('__V__', V).replace('__DATA__', J(p)))
    d = f'{DOCS}/federal/{p["slug"]}'; os.makedirs(d, exist_ok=True)
    open(f'{d}/index.html', 'w', encoding='utf-8').write(html)
acc = json.load(open(ACC, encoding='utf-8'))
json.dump(acc, open(f'{DOCS}/federal/accueil.json', 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
open(f'{DOCS}/federal/index.html', 'w', encoding='utf-8').write(open(f'{GAB}/accueil_federal.html', encoding='utf-8').read().replace('__V__', V))
print('pages fédérales', len(pages))
