"""Codes d'accès personnels (un par personne) et adresse du journal des accès.

Le fichier des personnes vit hors du dépôt (document « atlas-codes-acces » du projet claude.ai) :
  {"p01": {"nom": "...", "code": "123456", "sel": "...", "acces": ["*" | "circonscription/*" | "federal/*" | "circonscription/levis", ...]}, ...}
gate.js ne reçoit que l'identifiant (p01...), le sel, l'empreinte SHA-256 et la liste d'accès : ni nom ni code.
Usage : python3 scripts/personnes.py PERSONNES.json docs [URL_DU_JOURNAL]
"""
import sys, json, hashlib, re
PERS, DOCS = sys.argv[1], sys.argv[2]
URL = sys.argv[3] if len(sys.argv) > 3 else None
P = json.load(open(PERS, encoding='utf-8'))
codes = [v['code'] for v in P.values()]
assert len(codes) == len(set(codes)), 'deux personnes ont le même code'
assert all(len(c) == 6 and c.isdigit() for c in codes), 'les codes personnels ont 6 chiffres'
liste = [{'i': k, 's': v['sel'], 'h': hashlib.sha256((v['sel'] + ':' + v['code']).encode()).hexdigest(), 'a': v.get('acces', [])}
         for k, v in sorted(P.items())]
f = f'{DOCS}/assets/gate.js'
g = open(f, encoding='utf-8').read()
g = re.sub(r'/\*P\*/.*?/\*P\*/', '/*P*/' + json.dumps(liste, separators=(',', ':')) + '/*P*/', g, flags=re.S)
if URL is not None:
    g = re.sub(r'/\*L\*/.*?/\*L\*/', '/*L*/' + json.dumps(URL) + '/*L*/', g, flags=re.S)
open(f, 'w', encoding='utf-8').write(g)
print('personnes', len(liste), '| journal', 'inchangé' if URL is None else (URL or 'désactivé'))
