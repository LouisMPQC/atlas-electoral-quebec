# Atlas électoral du Québec

Résultats des élections générales québécoises de **2018, 2022 et 2026**, région par région, circonscription par circonscription et section de vote par section de vote, lus du point de vue du Parti Québécois.

Outil conçu par **Louis Morin Payette**, avec l'aide de Claude (Anthropic).

## Contenu
- `docs/` : le site publié sur GitHub Pages (accueil par régions, une page par circonscription).
- `scripts/` : la chaîne de traitement des données.
- `gabarits/` : les modèles HTML des pages.
- `.github/workflows/donnees-brutes.yml` : télécharge les fichiers officiels d'Élections Québec et les publie dans la version « donnees-brutes ».

## Reconstruire le site
```
python3 scripts/lire_resultats.py BRUT X res.pkl     # résultats par bureau, vérifiés contre les totaux officiels
python3 scripts/geo.py DOSSIER                       # sections, régions, transposition 2018/2022 -> 2026
python3 scripts/donnees_site.py DOSSIER SORTIE       # données de chaque page
python3 scripts/construire_site.py DOSSIER docs gabarits
```

## Méthode
- Chaque circonscription de 2026 est rattachée à la région administrative où habite la majorité de ses électeurs.
- Les résultats de 2018 et de 2022 sont transposés sur les sections de 2026 : les votes de chaque ancienne section (jour du scrutin, anticipation et votes spéciaux répartis) sont distribués selon la surface commune, pondérée par la densité d'électeurs des sections de 2026. Les totaux du Québec sont conservés.
- Tous les totaux par circonscription sont vérifiés contre les résultats officiels d'Élections Québec.

Données : Élections Québec, données ouvertes (dgeq.org).
