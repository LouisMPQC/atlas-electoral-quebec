"""Codes d'accès des cartes : un par circonscription, ou un par région (champ « r » dans le fichier des codes).

Les codes eux-mêmes ne sont jamais publiés : ils vivent dans un fichier hors du dépôt (premier argument).
Chaque page reçoit seulement un sel aléatoire et l'empreinte SHA-256 de son code.
Usage : python3 scripts/acces.py CODES.json docs
"""
import sys, json, os, secrets, hashlib, glob
CODES, DOCS = sys.argv[1], sys.argv[2]
codes = json.load(open(CODES)) if os.path.exists(CODES) else {}
# codes à 3 chiffres, uniques, sans suites évidentes
codes = {k: v for k, v in codes.items() if k == '_maitre' or (len(v['code']) == 3 and v['code'].isdigit())}
BANNIS = {'000', '111', '222', '333', '444', '555', '666', '777', '888', '999', '123', '234', '345', '456', '567', '678', '789', '321', '987'}
pris = {v['code'] for k, v in codes.items() if k != '_maitre'} | BANNIS
def nouveau():
    while True:
        c = f'{secrets.randbelow(1000):03d}'
        if c not in pris: pris.add(c); return c
if '_maitre' not in codes:
    codes['_maitre'] = {'code': f'{secrets.randbelow(10000):04d}', 'sel': secrets.token_hex(8)}
M = codes['_maitre']
MH = hashlib.sha256((M['sel'] + ':' + M['code']).encode()).hexdigest()
g = open(f'{DOCS}/assets/gate.js', encoding='utf-8').read()
import re
g = re.sub(r',M=\{[^}]*\};', ',M={s:"' + M['sel'] + '",h:"' + MH + '"};', g)
open(f'{DOCS}/assets/gate.js', 'w', encoding='utf-8').write(g)
PARTIELLES = {'federal/' + c['s'] for c in json.load(open(f'{DOCS}/assets/regions.json', encoding='utf-8'))['fed']['circ'] if c.get('b26')}
pages = sorted(glob.glob(f'{DOCS}/circonscription/*/index.html') + glob.glob(f'{DOCS}/federal/*/index.html'))
TAG = '<script src="../../assets/gate.js'
n_new = 0
for p in pages:
    key = os.path.relpath(os.path.dirname(p), DOCS)  # ex. circonscription/levis
    html = open(p, encoding='utf-8').read()
    i = html.index(TAG)
    j = html.rfind('<script>window.AEQ_G=', 0, i)
    if j != -1 and html[j:i].count('</script>') == 1: html = html[:j] + html[i:]; i = html.index(TAG)
    if key in PARTIELLES:  # partielles : accès libre
        codes.pop(key, None); open(p, 'w', encoding='utf-8').write(html); continue
    if key not in codes:
        codes[key] = {'code': nouveau(), 'sel': secrets.token_hex(8)}; n_new += 1
    e = codes[key]
    h = hashlib.sha256((e['sel'] + ':' + e['code']).encode()).hexdigest()
    r = f',r:"{e["r"]}"' if e.get('r') else ''  # code par région : la région est notée au journal
    html = html[:i] + f'<script>window.AEQ_G={{s:"{e["sel"]}",h:"{h}"{r}}}</script>' + html[i:]
    open(p, 'w', encoding='utf-8').write(html)
json.dump(codes, open(CODES, 'w'), indent=1, ensure_ascii=False)
print('pages', len(pages), 'nouveaux codes', n_new)
