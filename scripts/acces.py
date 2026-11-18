"""Un code d'accès différent par circonscription.

Les codes eux-mêmes ne sont jamais publiés : ils vivent dans un fichier hors du dépôt (premier argument).
Chaque page reçoit seulement un sel aléatoire et l'empreinte SHA-256 de son code.
Usage : python3 scripts/acces.py CODES.json docs
"""
import sys, json, os, secrets, hashlib, glob
CODES, DOCS = sys.argv[1], sys.argv[2]
ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
codes = json.load(open(CODES)) if os.path.exists(CODES) else {}
pages = sorted(glob.glob(f'{DOCS}/circonscription/*/index.html') + glob.glob(f'{DOCS}/federal/*/index.html'))
TAG = '<script src="../../assets/gate.js'
n_new = 0
for p in pages:
    key = os.path.relpath(os.path.dirname(p), DOCS)  # ex. circonscription/levis
    if key not in codes:
        c = ''.join(secrets.choice(ALPHA) for _ in range(12))
        codes[key] = {'code': '-'.join([c[:4], c[4:8], c[8:]]), 'sel': secrets.token_hex(8)}; n_new += 1
    e = codes[key]
    h = hashlib.sha256((e['sel'] + ':' + e['code'].replace('-', '')).encode()).hexdigest()
    html = open(p, encoding='utf-8').read()
    i = html.index(TAG)
    j = html.rfind('<script>window.AEQ_G=', 0, i)
    if j != -1 and html[j:i].count('</script>') == 1: html = html[:j] + html[i:]; i = html.index(TAG)
    html = html[:i] + f'<script>window.AEQ_G={{s:"{e["sel"]}",h:"{h}"}}</script>' + html[i:]
    open(p, 'w', encoding='utf-8').write(html)
json.dump(codes, open(CODES, 'w'), indent=1, ensure_ascii=False)
print('pages', len(pages), 'nouveaux codes', n_new)
