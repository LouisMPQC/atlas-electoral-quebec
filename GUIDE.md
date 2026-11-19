# Atlas électoral du Québec : guide de reprise

Outil conçu par **Louis Morin Payette** (avec l'aide de Claude). Ce document regroupe tout ce qu'il faut pour reprendre le travail dans une nouvelle conversation : où sont les choses, comment tout reconstruire, et les décisions déjà prises.

## En bref

- **Site** : https://louismpqc.github.io/atlas-electoral-quebec/ (GitHub Pages, publie le dossier `docs/` de la branche `main`).
- **Dépôt** : `LouisMPQC/atlas-electoral-quebec` (public).
- **Reconstruire tout le site** : `bash scripts/tout_reconstruire.sh DOSSIER_DE_TRAVAIL CHEMIN/codes.json`, puis vérifier et publier (`git add -A && git commit && git push`).
- **Codes d'accès** : jamais dans le dépôt. Le fichier `codes.json` est conservé hors du dépôt (document « atlas-codes-acces » du projet claude.ai). Sans lui, le script s'arrête plutôt que d'inventer de nouveaux codes.

## Ce que contient le site

| Adresse | Contenu | Accès |
|---|---|---|
| `/` | Page d'ouverture en forme d'application : sélecteur Provincial / Fédéral, 17 régions avec silhouettes, tuiles de statistiques, liste des circonscriptions avec recherche | Public |
| `/provincial/` | Accueil provincial par régions (PQ ; 2018, 2022, 2026 ; 127 circonscriptions) | Public |
| `/federal/` | Accueil fédéral par régions (Bloc ; 2021, 2025 ; 78 circonscriptions), partielles en évidence | Public |
| `/circonscription/<slug>/` | Carte par section de vote, provincial | Code à 3 chiffres |
| `/federal/<slug>/` | Carte par section de vote, fédéral | Code à 3 chiffres, sauf les 3 partielles (libres) |

Liens directs utiles : `/#prov/12` (une région au provincial), `/#fed/16` (au fédéral), `?s=24037_103` sur une page de circonscription (ouvre une section).

### Les cartes par circonscription

- Questions : où le parti est fort, face à un autre parti, score de chaque parti, gagnant (intensité selon l'avance), participation, progression depuis l'élection précédente.
- Filtres, secteurs (municipalités, quartiers de Montréal ou secteurs de BVA), onglets Bureaux / Secteurs / À cibler / Évolution, export CSV, impression propre des listes.
- Terrain : bouton « Me localiser » (suivi GPS continu et section courante), Itinéraire Google Maps et lien direct dans chaque fiche de section, bouton Plan / Satellite, mode terrain, carte en premier sur téléphone.
- Fond de carte : Esri Dark Gray assombri (Carto exige maintenant une clé payante). Les rues et leurs noms transparaissent en zoomant.

### Partielles fédérales du 7 décembre 2026 (seulement sur ces 3 pages)

Laurier–Sainte-Marie (Zumretay Arkin), Rosemont–La Petite-Patrie (Alexandre Curzi), Saint-Hyacinthe–Bagot–Acton (Caroline Émond). Demandes de Nathan Loiselle (DOC du Bloc dans Laurier–Sainte-Marie).

- Votes du Bloc par section (nombre, pas seulement %) et critère « faire sortir le vote ».
- PQ du 5 octobre 2026 reporté sur les sections fédérales, et carte « PQ fort, Bloc faible ».
- Lieux de vote : liste officielle intégrée pour Laurier–Sainte-Marie (35 lieux du jour J, 16 BVA du 27 au 30 novembre) dans `donnees/lieux_partielles.json`, géocodés dans `donnees/geocodage_lieux.json`. Pour les deux autres, un bouton permet de coller une liste à la main (gardée sur l'appareil).
- Pour ajouter une liste officielle : compléter `donnees/lieux_partielles.json` (clé = numéro de circonscription fédérale), pousser : la GitHub Action « Géocodage des lieux de vote » publie la release `geocodage` ; copier `geocodage.json` vers `donnees/geocodage_lieux.json`, puis reconstruire.

## Données et sources

- **Élections Québec** : résultats par bureau de vote 2018, 2022, 2026 et sections de vote (shapefiles). Release `donnees-brutes`, produite par l'Action `donnees-brutes.yml`.
- **Élections Canada** : résultats par bureau 2021 et 2025 (fichiers 24001 à 24080) et sections de vote. Release `donnees-federales` (Action `donnees-federales.yml`). Quartiers de référence de Montréal (données ouvertes de la Ville).
- **Adresses Québec (iCherche)** : géolocalisation des adresses (dans le navigateur, et dans l'Action de géocodage avec un en-tête User-Agent).
- L'espace de travail de Claude n'a pas accès à ces sites : tout passe par les GitHub Actions et les releases, téléchargées avec `gh api` (API REST seulement).

## Méthodes

- Les totaux par circonscription sont vérifiés contre les résultats officiels (y compris BVA et votes spéciaux).
- Anciennes élections sur les limites actuelles : répartition « dasymétrique » (surface commune pondérée par la densité d'électeurs de la section récente). Estimations, totaux conservés.
- Région d'une circonscription : région administrative où habite la majorité de ses électeurs (2 premiers chiffres du code municipal).
- Sections « comptées avec une voisine » : affichées en gris, sans pourcentage propre.
- PQ 2026 sur les sections fédérales : votes du jour du scrutin des sections provinciales, répartis de la même façon (`scripts/pq_sur_federal.py`).

## Chaîne de construction (ce que fait `tout_reconstruire.sh`)

1. `lire_resultats.py` : lit et vérifie les résultats provinciaux → `res.pkl`.
2. `geo.py` : géométries, régions, transpositions → `geo.pkl`.
3. `donnees_site.py` puis `construire_site.py` : pages provinciales et `docs/provincial/`.
4. `federal_tout.py` : 78 circonscriptions fédérales → `pages_tout.pkl` ; `pq_sur_federal.py` et `lieux.py` ajoutent les données des partielles.
5. `accueil_federal.py` (gabarit de l'accueil fédéral dérivé de l'accueil provincial) puis `construire_federal.py`.
6. `regions_accueil.py` : page d'ouverture et `docs/assets/regions.json`.
7. `acces.py codes.json docs` : pose les codes (à refaire après toute reconstruction).

Fichiers du site : `docs/assets/circo.js` (carte, générique grâce à `DATA.cfg`), `docs/assets/site.css` (thème « verre »), `docs/assets/gate.js` (page de code), gabarits dans `gabarits/`.

## Vérifier avant de publier

Tests faits avec Playwright (Chromium préinstallé) sur un serveur local (`python3 -m http.server 8765` dans `docs/`) : chaque page s'ouvre sans erreur JavaScript et le total du tableau égale le total officiel ; pas de débordement horizontal sur téléphone (390 px) ; page de code (bon code, mauvais code, code universel, rechargement). Pour tester les cartes sans les codes, remplacer `gate.js` par un script vide dans le test.

## Décisions et préférences

- Textes en français soigné, registre standard, sans tirets cadratins (—).
- Style visuel : verre dépoli sombre, tuiles pastel, police Inter (inspiré d'une maquette fournie par Louis). Route 127 sert de référence pour la netteté des cartes.
- Le nom de Louis figure sur le site (en-tête et pied de page).
- Accès : barrière JavaScript assumée (simple, pas un coffre-fort). Codes à 3 chiffres redemandés à chaque visite, code universel pour Louis, partielles libres. Vraie protection possible plus tard : Cloudflare Pages + Access (dépôt privé, nom de domaine).
- Clé Google Maps (Map Tiles API, fond sombre sur mesure et satellite) : envisagée, pas encore faite.

## Idées en attente

- Lieux de vote officiels de Rosemont et de Saint-Hyacinthe (dès réception).
- Fond Google Maps si une clé est fournie.
- Profils de recensement par section (Statistique Canada) : faisable mais lourd.
