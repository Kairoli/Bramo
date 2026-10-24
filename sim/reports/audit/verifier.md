# Vérification des outils de simulation (audit, phase 3)

## 1. Le témoin du banc et le même équipement en jeu

| Classe | Banc (`makeBuild`) | Jeu (`combatantOf`, niveau 20) | Plancher ? | Écart de Puissance |
|---|---|---|---|---|
| forgefire | P 97,3 · PV 2 564 · Déf 22,7 % · Crit 21,9 % · Cad 29,0 % | P 97,3 · PV 2 564 · Déf 22,7 % · Crit 21,9 % · Cad 29,0 % | non | +0,0 % |
| tracker | P 112,5 · PV 2 639 · Déf 20,2 % · Crit 25,9 % · Cad 12,0 % | P 121,5 · PV 2 639 · Déf 20,2 % · Crit 25,9 % · Cad 12,0 % | non | +8,0 % |
| runist | P 97,8 · PV 2 606 · Déf 18,5 % · Crit 22,1 % · Cad 12,0 % | P 97,8 · PV 2 606 · Déf 18,5 % · Crit 22,1 % · Cad 12,0 % | non | +0,0 % |

Le banc ne voit pas les points forts de classe (`data/power/4-classes.yaml`, actifs d'office) : le Traqueur a +8 % de Puissance sur la route dans le jeu, pas au banc.

## 2. Le cache du simulateur de serveur

Même combattant (systèmes de Puissance montés : régénération 0,27 %/s, contre-attaque 1,2 %, combo 1,2 %), même rencontre. « Cache » = build arrondi (Puissance et PV par pas de 2 %, le reste au centième) et graines 0 à 5, comme `fightCache.ts`.

| Cas | Régén. / contre / combo (exact → arrondi) | Victoires exactes, graines 0-5 | Cache | Victoires exactes, 60 graines | Exact sur 60 graines, petites parts arrondies seulement | Durée exacte / cache (s) |
|---|---|---|---|---|---|---|
| tracker niv. 40, étape 5-5 (au mur) | 0,27 / 1,2 / 1,2 % → 0 / 1 / 1 % | 67 % | 50 % | 50 % | 25 % | 22,9 / 22,6 |
| forgefire niv. 40, étape 5-5 (au mur) | 0,27 / 1,2 / 1,2 % → 0 / 1 / 1 % | 67 % | 33 % | 50 % | 27 % | 22,6 / 22,2 |
| runist niv. 60, étape 7-10 (au mur) | 0,27 / 1,2 / 1,2 % → 0 / 1 / 1 % | 67 % | 0 % | 50 % | 13 % | 38,8 / 36,3 |
| forgefire niv. 60, étape 7-10 (au mur) | 0,27 / 1,2 / 1,2 % → 0 / 1 / 1 % | 50 % | 17 % | 50 % | 10 % | 37,3 / 35,8 |
| tracker niv. 25, étape 3-10 (au mur) | 0,27 / 1,2 / 1,2 % → 0 / 1 / 1 % | 50 % | 0 % | 50 % | 7 % | 25,6 / 24,8 |
| runist niv. 25, étape 3-10 (au mur) | 0,27 / 1,2 / 1,2 % → 0 / 1 / 1 % | 33 % | 33 % | 50 % | 13 % | 27,8 / 27,6 |

## 3. Les points forts de classe selon le contenu

| Classe | Route | Marée (`tide`) | Lice (`arena`) | Donjon (`dungeon`) |
|---|---|---|---|---|
| forgefire | P 97,3, PV 2 564 | P 97,3, PV 2 564 | P 97,3, PV 2 770 | P 97,3, PV 2 770 |
| tracker | P 121,5, PV 2 639 | P 112,5, PV 2 639 | P 112,5, PV 2 639 | P 112,5, PV 2 639 |
| runist | P 97,8, PV 2 606 | P 105,6, PV 2 606 | P 97,8, PV 2 606 | P 97,8, PV 2 606 |

Dans le jeu, `tideScore` (`packages/shared/src/combat/tide.ts`) appelle `combatantOf(state, content)` sans contexte, donc « route » : la Marée applique le bonus de route du Traqueur et ignore celui du Runiste et la recherche « Le Savoir de la Marée ». Aucun appel du jeu ne passe `arena` ni `dungeon` (ces contenus n'existent pas) : le point fort du Forgefeu ne s'applique nulle part.

## 4. Le plancher, niveau par niveau

Le plancher ne baisse jamais d'un niveau au suivant (niveaux 1 à 99).

## 5. Un vrai équipement contre le plancher

Équipement complet d'une rareté au palier de la courbe du niveau (sans ligne aléatoire, sans ensemble), porté au niveau L. « Plancher » : le plancher l'emporte (l'équipement ne compte pas).

| Niveau | Commun | Rare | Épique | Légendaire |
|---|---|---|---|---|
| 1 | **plancher** (0,98) | équipement (1,01) | équipement (1,03) | équipement (1,07) |
| 5 | **plancher** (0,97) | **plancher** (0,99) | équipement (1,01) | équipement (1,05) |
| 9 | **plancher** (0,95) | **plancher** (0,97) | **plancher** (1,00) | équipement (1,03) |
| 10 | équipement (1,02) | équipement (1,05) | équipement (1,07) | équipement (1,11) |
| 15 | équipement (1,00) | équipement (1,03) | équipement (1,06) | équipement (1,09) |
| 19 | **plancher** (0,99) | équipement (1,02) | équipement (1,04) | équipement (1,07) |
| 20 | équipement (1,08) | équipement (1,11) | équipement (1,17) | équipement (1,21) |
| 25 | équipement (1,06) | équipement (1,09) | équipement (1,15) | équipement (1,19) |
| 29 | équipement (1,05) | équipement (1,08) | équipement (1,14) | équipement (1,18) |
| 30 | équipement (1,16) | équipement (1,20) | équipement (1,22) | équipement (1,26) |
| 35 | équipement (1,15) | équipement (1,19) | équipement (1,21) | équipement (1,25) |
| 39 | équipement (1,14) | équipement (1,17) | équipement (1,20) | équipement (1,24) |
| 40 | équipement (1,24) | équipement (1,28) | équipement (1,31) | équipement (1,35) |
| 45 | équipement (1,19) | équipement (1,22) | équipement (1,25) | équipement (1,29) |
| 49 | équipement (1,14) | équipement (1,18) | équipement (1,20) | équipement (1,24) |
| 50 | équipement (1,24) | équipement (1,28) | équipement (1,31) | équipement (1,35) |
| 59 | équipement (1,14) | équipement (1,18) | équipement (1,21) | équipement (1,24) |
| 60 | équipement (1,24) | équipement (1,28) | équipement (1,31) | équipement (1,35) |
| 70 | équipement (1,25) | équipement (1,29) | équipement (1,31) | équipement (1,35) |
| 80 | équipement (1,24) | équipement (1,29) | équipement (1,31) | équipement (1,35) |
| 89 | équipement (1,15) | équipement (1,18) | équipement (1,21) | équipement (1,24) |
| 90 | équipement (1,24) | équipement (1,28) | équipement (1,31) | équipement (1,35) |

Entre parenthèses : indice de mur de l'équipement / indice de mur du plancher. Sous 1, toutes les statistiques de l'équipement sont remplacées par le plancher (`wornLoadout`) : critique, Cadence, Défense choisies n'y changent rien ; seuls les talents, ensembles et outils comptent encore.

## 6. Déterminisme

Deux appels identiques de `fight` donnent exactement le même résultat, journal compris.

## 7. Vitesse du moteur

600 rencontres de la route (29,8 s de combat en moyenne) : 0,56 ms de calcul par rencontre, sur cette machine, un seul cœur.

## 8. Le temps de monter les niveaux de classe

Heures de route (combats de 21 s, repos 2 s, toutes gagnées, sans coup de fouet ni Banquet) pour atteindre un niveau depuis le niveau 1, et pour les 10 niveaux suivants. Une journée de jeu = 16 h d'autonomie au plus.

| Niveau | Depuis le niveau 1 | Les 10 niveaux suivants |
|---|---|---|
| 10 | 3 h (0,2 j à 16 h/j) | 8 h (0,5 j) |
| 20 | 11 h (0,7 j à 16 h/j) | 18 h (1,1 j) |
| 30 | 29 h (1,8 j à 16 h/j) | 42 h (2,7 j) |
| 40 | 71 h (4,4 j à 16 h/j) | 100 h (6,3 j) |
| 50 | 171 h (10,7 j à 16 h/j) | 238 h (14,9 j) |
| 60 | 410 h (25,6 j à 16 h/j) | 565 h (35,3 j) |
| 70 | 975 h (60,9 j à 16 h/j) | 1 341 h (83,8 j) |
| 80 | 2 316 h (144,7 j à 16 h/j) | 3 182 h (198,9 j) |
| 89 | 5 042 h (315,1 j à 16 h/j) | 6 925 h (432,8 j) |

## 9. Un palier d'équipement vaut-il ×1,096 de mur ?

Témoin du banc (Rare de palier 20, plan conseillé), puis le même avec Puissance et PV × 1,12 ; mur = plus haut danger gagné 7 fois sur 8 (`wallOf`).

| Voie | Rapport de mur médian sur les 18 rencontres | Plus bas | Plus haut |
|---|---|---|---|
| Trempe-Rouge | ×1,095 | ×1,080 | ×1,118 |
| Tue-Bête | ×1,087 | ×1,072 | ×1,118 |
| Fulgurant | ×1,087 | ×1,080 | ×1,126 |

