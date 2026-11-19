#!/usr/bin/env bash
# Reconstruit tout l'Atlas électoral du Québec à partir de zéro, dans une nouvelle session.
#   bash scripts/tout_reconstruire.sh [DOSSIER_DE_TRAVAIL] [FICHIER_DES_CODES]
# 1. télécharge les données brutes publiées dans les « releases » GitHub du dépôt
#    (donnees-brutes, donnees-federales : produites par les GitHub Actions du même nom) ;
# 2. relit les résultats, prépare les géométries, reporte les anciennes élections sur les limites actuelles ;
# 3. écrit le site dans docs/ (provincial, fédéral, page d'ouverture) et pose les codes d'accès.
# Ensuite : vérifier, puis git add -A && git commit && git push (GitHub Pages publie docs/).
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"; cd "$REPO"
W="${1:-${TMPDIR:-/tmp}/atlas-travail}"; CODES="${2:-$HOME/atlas-acces/codes.json}"
Q="$W/qc"; F="$W/fed"; mkdir -p "$Q/brut" "$Q/x" "$F/brut" "$F/x"
R="$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')"
dl(){ # dl TAG DOSSIER : télécharge les fichiers d'une release (sans retélécharger ce qui est déjà là)
  gh api "repos/$R/releases/tags/$1" --jq '.assets[] | "\(.id)\t\(.name)"' | while IFS=$'\t' read -r id name; do
    [ -s "$2/$name" ] || { echo "  téléchargement : $name"; gh api -H 'Accept: application/octet-stream' "repos/$R/releases/assets/$id" > "$2/$name"; }; done; }
echo "1/4 Données brutes"
dl donnees-brutes "$Q/brut"
for z in "$Q"/brut/*.zip; do d="$Q/x/$(basename "$z" .zip)"; [ -d "$d" ] || unzip -q -o "$z" -d "$d"; done
dl donnees-federales "$F/brut"
[ -d "$F/x/pd2025" ] || unzip -q -o "$F/brut/pd2025.zip" -d "$F/x/pd2025"
[ -d "$F/x/pd2021" ] || unzip -q -o "$F/brut/pd2021.zip" -d "$F/x/pd2021"
[ -d "$F/x/r2025" ] || unzip -q -o "$F/brut/resultats_qc.zip" -d "$F/x"
echo "2/4 Provincial (2018, 2022, 2026)"
python3 scripts/lire_resultats.py "$Q/brut" "$Q/x" "$Q/res.pkl"
python3 scripts/geo.py "$Q"
python3 scripts/donnees_site.py "$Q" "$Q/site"
python3 scripts/construire_site.py "$Q" docs gabarits
echo "3/4 Fédéral (2021, 2025) et partielles"
python3 scripts/federal_tout.py "$F/x" "$F/brut" "$F/pages_tout.pkl" "$Q"
python3 scripts/pq_sur_federal.py "$F/pages_tout.pkl" "$Q"
python3 scripts/lieux.py "$F/pages_tout.pkl" donnees/lieux_partielles.json donnees/geocodage_lieux.json
python3 scripts/accueil_federal.py > /dev/null
python3 scripts/construire_federal.py "$F/pages_tout.pkl" "$F/pages_tout_accueil.json" docs gabarits
echo "4/4 Page d'ouverture et codes d'accès"
python3 scripts/regions_accueil.py "$Q" docs
if [ -s "$CODES" ]; then python3 scripts/acces.py "$CODES" docs
else echo "ATTENTION : fichier des codes introuvable ($CODES). Les codes existants seraient remplacés par de nouveaux."
     echo "Récupérer le fichier des codes (document « atlas-codes-acces » du projet claude.ai) avant de publier."; exit 1; fi
echo "Terminé. Vérifier le site (python3 -m http.server dans docs/), puis publier."
