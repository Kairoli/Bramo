# Rapport du simulateur

> Généré par `pnpm --filter @bramo/sim sim report`. Ne pas modifier à la main.

## Données du jeu (data/) : Minage seul, sans outil, repas ni coup de fouet

| Profil | h eff./jour | Niv. 10 | Niv. 20 | Niv. 30 | Niv. 45 | Niv. 60 | Niv. 70 | Niv. 85 | Niv. 90 | Niv. 99 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Régulier : 2 h d’un bloc le soir | 18,0 | 3,0 h | 12 h | 1,5 j | 6,0 j | 22 j | 53 j | — | — | — |
| Régulier : 2 h par jour en deux sessions | 24,0 | 3,5 h | 11 h | 1,2 j | 4,5 j | 17 j | 40 j | — | — | — |
| Casu : 20 min, une session le soir | 16,4 | 3,3 h | 12 h | 1,6 j | 6,4 j | 25 j | 58 j | — | — | — |
| Onglet visible toute la journée (7 h–23 h) | 24,0 | 3,0 h | 10 h | 1,1 j | 4,4 j | 17 j | 40 j | — | — | — |

## Présence : heures effectives par jour selon la variante

| Variante | Casu : 20 min, une session le soir | Casu : 2 visites (5 min matin, 15 min soir) | Téléphone : 6 visites de 3 min | Régulier : 2 h par jour en deux sessions | Onglet visible toute la journée (7 h–23 h) | Onglet visible jour et nuit | Onglet 24 h / casu 20 min | Régulier / casu 20 min | Téléphone / onglet 16 h |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 % hors ligne, plafond 12 h (prototype sans énergie) | 3,4 | 6,3 | 6,4 | 6,6 | 18,0 | 24,0 | ×7,13 | ×1,95 | 35 % |
| 50 % hors ligne, plafond 16 h | 8,4 | 12,2 | 12,2 | 13,0 | 20,0 | 24,0 | ×2,87 | ×1,56 | 61 % |
| 75 % hors ligne, plafond 16 h | 12,4 | 18,1 | 18,1 | 18,5 | 22,0 | 24,0 | ×1,94 | ×1,50 | 82 % |
| 100 %, autonomie 12 h | 12,4 | 24,0 | 24,0 | 20,0 | 24,0 | 24,0 | ×1,94 | ×1,62 | 100 % |
| 100 %, autonomie 16 h | 16,4 | 24,0 | 24,0 | 24,0 | 24,0 | 24,0 | ×1,47 | ×1,47 | 100 % |
| **Décidé** : 100 %, 16 h, 2 coups de fouet de 30 min utilisés | 16,9 | 24,5 | 24,5 | 24,5 | 24,5 | 24,5 | ×1,45 | ×1,45 | 100 % |
| 100 %, autonomie 24 h | 24,0 | 24,0 | 24,0 | 24,0 | 24,0 | 24,0 | ×1,00 | ×1,00 | 100 % |

## Repas actuels (data/)

| Repas | Bonus | Cuisson | Chaîne complète | Or PNJ | h de bonus / h de cuisson | h de bonus / h de chaîne | Rendement autonome |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tisane de menthe | +3 % × 1 h 00 | 15 s | 1 min | 0 | 240 | 71 | ×2,1 |
| Poisson grillé au thym | +4 % × 45 min | 20 s | 1 min | 24 | 135 | 56 | ×2,3 |
| Bouillon d'ortie | +5 % × 1 h 15 | 25 s | 2 min | 0 | 180 | 38 | ×1,9 |
| Truite à la sauge | +7 % × 45 min | 30 s | 2 min | 100 | 90 | 26 | ×1,9 |
| Soupe aux lys-lanternes | +8 % × 1 h 00 | 40 s | 2 min | 48 | 90 | 26 | ×2,1 |
| Festin du givre | +10 % × 1 h 30 | 60 s | 4 min | 100 | 90 | 21 | ×2,1 |

## Progression (boucle-v0, mêmes règles que data/)

| Profil (Minage, sauf forgerons) | Niv. 10 | Niv. 20 | Niv. 30 | Niv. 45 | Niv. 60 | Niv. 70 | Niv. 85 | Niv. 90 | Niv. 99 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Spécialiste casu (20 min/j, outils, sans repas) | 3,3 h | 12 h | 1,5 j | 5,4 j | 19 j | 45 j | 5,2 mois | 8,1 mois | — |
| Spécialiste régulier (2 visites/j, outils, repas) | 2,5 h | 10 h | 1,1 j | 3,7 j | 13 j | 29 j | 3,3 mois | 5,2 mois | 11,2 mois |
| Spécialiste tryhard (+ repas 10 % et clan 10 %) | 2,0 h | 7,5 h | 21 h | 3,1 j | 11 j | 26 j | 3,1 mois | 4,8 mois | 10,4 mois |
| Partagé : 3 métiers + combat, régulier | 10 h | 1,7 j | 4,3 j | 15 j | 51 j | 3,8 mois | 13,4 mois | 20,8 mois | 44,9 mois |
| Partagé : 3 métiers + combat, casu | 13 h | 1,9 j | 5,9 j | 22 j | 2,6 mois | 5,9 mois | 20,8 mois | 32,4 mois | — |
| Forgeron autonome (mine son minerai) | 4,8 h | 17 h | 1,5 j | 5,7 j | 21 j | 49 j | 5,8 mois | 9,0 mois | 19,5 mois |
| Forgeron qui achète le minerai | 1,3 h | 4,6 h | 13 h | 2,2 j | 8,1 j | 19 j | 2,3 mois | 3,5 mois | 7,7 mois |
| Forgeron qui achète aussi ses lingots | 1,3 h | 4,5 h | 12 h | 2,0 j | 7,3 j | 17 j | 2,0 mois | 3,2 mois | 6,8 mois |

## Ce qu’un personnage atteint avec le temps (boucle-v0)

| Niveau atteint dans un métier | 1 semaine | 1 mois | 3 mois | 6 mois | 1 an |
| --- | --- | --- | --- | --- | --- |
| Spécialiste, casu (20 min/j) | 46 | 65 | 78 | 86 | 94 |
| Un métier principal (½) + combat, casu (20 min/j) | 33 | 56 | 69 | 78 | 86 |
| 3 métiers + combat (¼ chacun), casu (20 min/j) | 13 | 46 | 60 | 69 | 78 |
| Spécialiste, régulier (2 visites/j) | 51 | 70 | 83 | 91 | 99 |
| Un métier principal (½) + combat, régulier (2 visites/j) | 40 | 61 | 75 | 83 | 91 |
| 3 métiers + combat (¼ chacun), régulier (2 visites/j) | 21 | 51 | 66 | 75 | 83 |

## Chaînes de production (boucle-v0)

| Chaîne | Temps autonome | Part du dernier métier | Étapes | Parcelle·h | Or PNJ | Répartition | Niveaux requis |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tenue de lin (capuche, robe, chausses, mitaines) | 2 h 00 | 66 % | 12 | 48,6 | 0 | Couture 1 h 19, Agriculture 41 min, Tannerie 0 min, Chasse 0 min, Bûcheronnage 0 min | Couture 10, Agriculture 1, Tannerie 1, Chasse 1, Bûcheronnage 1 |
| Robe d’adepte runée (textile teint + runes) | 1 h 54 | 9 % | 17 | 44,7 | 0 | Couture 1 h 04, Agriculture 31 min, Enchantement 10 min, Minage 7 min, Alchimie 1 min, Herboristerie 1 min, Bûcheronnage 0 min | Enchantement 25, Couture 25, Agriculture 15, Minage 20, Alchimie 20, Bûcheronnage 1, Herboristerie 20 |
| Pourpoint de cuir (armure du Traqueur) | 1 h 05 | 53 % | 11 | 1,2 | 0 | Tannerie 35 min, Bûcheronnage 18 min, Chasse 8 min, Minage 2 min, Forge 1 min, Agriculture 1 min, Couture 1 min | Tannerie 25, Chasse 20, Bûcheronnage 1, Couture 1, Agriculture 1, Forge 1, Minage 1 |
| Épée de fer | 35 min | 57 % | 7 | 0,0 | 0 | Forge 20 min, Minage 14 min, Tannerie 1 min, Chasse 0 min, Bûcheronnage 0 min | Forge 20, Minage 10, Tannerie 1, Chasse 1, Bûcheronnage 1 |
| Arc court de frêne | 26 min | 76 % | 10 | 1,0 | 0 | Menuiserie 20 min, Bûcheronnage 4 min, Agriculture 1 min, Couture 1 min, Tannerie 0 min, Chasse 0 min | Menuiserie 20, Bûcheronnage 20, Couture 1, Agriculture 1, Tannerie 1, Chasse 1 |
| 150 flèches à pointe de fer | 11 min | 19 % | 8 | 0,0 | 0 | Chasse 6 min, Menuiserie 2 min, Minage 1 min, Forge 1 min, Bûcheronnage 1 min | Menuiserie 15, Bûcheronnage 1, Forge 15, Minage 10, Chasse 5 |
| Anneau d’argent à l’améthyste | 24 min | 67 % | 6 | 0,0 | 0 | Joaillerie 16 min, Minage 8 min | Joaillerie 40, Minage 35 |
| Pioche de fer | 37 min | 48 % | 7 | 0,0 | 0 | Minage 19 min, Forge 18 min, Menuiserie 0 min, Bûcheronnage 0 min | Forge 15, Minage 10, Menuiserie 10, Bûcheronnage 10 |
| Ragoût du traqueur × 12 (24 h de bonus) | 27 min | 22 % | 4 | 14,4 | 0 | Chasse 13 min, Herboristerie 8 min, Cuisine 6 min | Cuisine 25, Chasse 20, Agriculture 5, Herboristerie 10 |
| 10 potions de soin mineures | 13 min | 28 % | 5 | 0,0 | 0 | Herboristerie 8 min, Alchimie 4 min, Minage 1 min, Bûcheronnage 1 min | Alchimie 5, Minage 1, Bûcheronnage 1, Herboristerie 1 |
| Charpente de chêne (projet de clan) | 16 min | 32 % | 7 | 0,0 | 0 | Construction 5 min, Bûcheronnage 5 min, Menuiserie 3 min, Minage 2 min, Forge 1 min | Construction 1, Menuiserie 10, Bûcheronnage 10, Forge 1, Minage 1 |

## Repas proposés (boucle-v0)

| Repas | Bonus | Cuisson | Chaîne complète | Or PNJ | h de bonus / h de cuisson | h de bonus / h de chaîne | Rendement autonome |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tisane de menthe | +3 % × 1 h 00 | 15 s | 1 min | 0 | 240 | 71 | ×2,1 |
| Poisson grillé au thym | +4 % × 1 h 00 | 20 s | 1 min | 0 | 180 | 50 | ×2,0 |
| Pain de campagne | +3 % × 1 h 30 | 20 s | 1 min | 0 | 270 | 68 | ×2,0 |
| Bouillon d'ortie | +5 % × 1 h 15 | 25 s | 2 min | 0 | 180 | 38 | ×1,9 |
| Ragoût du traqueur | +6 % × 2 h 00 | 30 s | 3 min | 0 | 240 | 35 | ×2,1 |
| Truite à la sauge | +7 % × 1 h 15 | 30 s | 3 min | 0 | 150 | 27 | ×1,9 |
| Soupe aux lys-lanternes | +8 % × 1 h 15 | 40 s | 3 min | 0 | 113 | 24 | ×1,9 |
| Festin du givre | +10 % × 1 h 45 | 60 s | 5 min | 0 | 105 | 20 | ×2,0 |

## Économie (boucle-v0)

### Variantes (avec combat, par joueur et par jour)

| Variante | Part utile de la production | Perdu au recyclage | Vendu au PNJ | Stocké | Or créé / joueur / jour |
| --- | --- | --- | --- | --- | --- |
| Comme le prototype : rachat PNJ à 25 % sans plafond, ni Construction ni recyclage | 5 % | 0 % | 47 % | 47 % | 1 553 |
| Usure ×3 et repas plus forts (seule réponse par l'usure) | 7 % | 0 % | 46 % | 46 % | 1 415 |
| Recommandé : Construction (15 % de l'artisanat), recyclage (60 % du surplus fabriqué), rachat PNJ 10 % plafonné à 2 000 or/semaine | 26 % | 12 % | 18 % | 45 % | -90 |

### Variante recommandée : postes de consommation (heures de travail par joueur et par jour)

| Poste | Sans combat (aujourd’hui) | Avec combat (P4) |
| --- | --- | --- |
| Heures de métier produites | 20,8 | 16,3 |
| Outils (réparations) | 0,06 | 0,05 |
| Repas | 0,35 | 0,44 |
| Armes (réparations) | 0,00 | 0,01 |
| Armures (réparations) | 0,00 | 0,03 |
| Flèches | 0,00 | 0,11 |
| Potions | 0,00 | 0,20 |
| Construction (pose et matériaux) | 4,31 | 3,37 |
| Kits des nouveaux | 0,02 | 0,02 |
| **Total consommé** | 4,74 | 4,22 |
| **Part de la production qui sert** | 23 % | 26 % |

### Variante recommandée : or par joueur et par jour

| Flux | Or / jour |
| --- | --- |
| + Rachat du marchand PNJ | 286 |
| + Épreuves des maîtres | 40 |
| − Taxe du marché | 244 |
| − Réparations au PNJ | 49 |
| − Entretien du clan | 42 |
| − Services en or (postes, expéditions) | 80 |
| **Solde (création nette d’or)** | **-90** |

### Sensibilité (variante recommandée, avec combat) : chaque hypothèse ÷2 puis ×2

| Hypothèse | Valeur | ÷2 : part utile / or net | ×2 : part utile / or net |
| --- | --- | --- | --- |
| wear.tool.lifeHours | 60 | 26 % / -120 | 26 % / -75 |
| wear.armor.lifeHours | 150 | 26 % / -105 | 26 % / -82 |
| meals.bonus | 0.06 | 25 % / -90 | 29 % / -90 |
| combat.arrowsPerHour | 60 | 26 % / -90 | 27 % / -90 |
| construction.craftTimeShare | 0.15 | 16 % / -90 | 47 % / -90 |
| recycling.craftedSurplusRecycled | 0.6 | 26 % / -90 | 26 % / -90 |
| gold.npcBuyback | 0.1 | 26 % / -122 | 26 % / -90 |
| gold.npcWeeklyCap | 2000 | 26 % / -233 | 26 % / 132 |
| gold.tradedShare | 0.3 | 26 % / 32 | 26 % / -334 |

### Taille du serveur (variante recommandée)

| Joueurs | Spécialistes par métier (moyenne) | Métiers sans spécialiste | Métiers avec moins de 3 | Outils réparés / semaine | Repas / jour | Flèches / jour | Or créé / jour |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | 0,7 | 8,7 | 16,3 | 38 | 147 | 1 916 | -1 794 |
| 50 | 1,8 | 3,6 | 12,4 | 95 | 367 | 4 790 | -4 486 |
| 200 | 7,1 | 0,2 | 1,8 | 380 | 1 467 | 19 160 | -17 945 |

### Débouchés durables des objets de bas niveau (≤ niv. 10, consommés par des recettes ≥ niv. 20)

| Objet | Recettes de niveau ≥ 20 qui le consomment |
| --- | --- |
| Fil de lin | Arc court de frêne, Pourpoint de cuir, Robe d'adepte |
| Lanières de cuir | Épée de fer, Arc court de frêne |
| Fiole | Élixir du mineur, Encre runique |
| Thym | Ragoût du traqueur, Élixir du mineur |
| Lingot de fer | Épée de fer |
| Clous et rivets | Pourpoint de cuir |
| Manche de chêne | Pioche d'acier |
| Minerai de fer | Lingot d'acier |
| Écorce | Cuir épais |
| Poisson frais | Soupe aux lys-lanternes |

Sans débouché de haut niveau dans la proposition (36) : Filasse de lin, Grain, Lingot de bronze, Fer d'outil en bronze, Pioche de bronze, Hache de bronze, Serpe de bronze, Marteau de bronze, Scie de bronze, Couteau de bronze, Planche de pin, Manche de pin, Planche de chêne, Hampes de flèche, Cuir souple, Toile de lin, Capuche de lin, Robe de lin, Chausses de lin, Mitaines de lin, Tisane de menthe, Poisson grillé au thym, Pain de campagne, Potion de soin mineure, Charpente de chêne, Pan de mur en pierre, Minerai de cuivre, Minerai d'étain, Bloc de pierre, Sable, Bûche de pin, Bûche de chêne, Menthe sauvage, Petite peau, Viande de gibier, Plume.
