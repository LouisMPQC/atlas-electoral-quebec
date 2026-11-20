"""Fabrique le fichier des codes (codes.json) à partir d'un code à 3 chiffres par région administrative.

Chaque carte provinciale ou fédérale reçoit le code de sa région (champ « r » de docs/assets/regions.json) ;
les partielles (b26) restent libres. Les sels sont tirés au hasard : seuls les codes comptent.
Usage : python3 scripts/codes_regions.py REGIONS_CODES.json MAITRE_CODE MAITRE_SEL > codes.json
  REGIONS_CODES.json = {"01": {"nom": "Bas-Saint-Laurent", "code": "118"}, ...} (hors du dépôt)
Ensuite : python3 scripts/acces.py codes.json docs
"""
import sys, json, secrets
REG = json.load(open(sys.argv[1], encoding='utf-8'))
R = json.load(open('docs/assets/regions.json', encoding='utf-8'))
codes = {'_maitre': {'code': sys.argv[2], 'sel': sys.argv[3]}}
for niveau, dossier in [('prov', 'circonscription'), ('fed', 'federal')]:
    for c in R[niveau]['circ']:
        if niveau == 'fed' and c.get('b26'):
            continue
        codes[f"{dossier}/{c['s']}"] = {'code': REG[c['r']]['code'], 'sel': secrets.token_hex(8), 'r': c['r']}
json.dump(codes, sys.stdout, indent=1, ensure_ascii=False)
