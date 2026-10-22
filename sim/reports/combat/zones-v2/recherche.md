# Recherche de plans

> Généré par `pnpm --filter @bramo/sim sim combat-search`. Ne pas modifier à la main.

Toutes les combinaisons de 5 sorts accessibles à chaque voie (au plus un ultime), sans horaire (tous à 0 s, par cooldown croissant), arme : la première de la classe. Criblage à 2 graines au danger normal ; les plus rapides en moyenne, les plus sûrs (PV) et le plus rapide de chaque rencontre sont rejoués à 12 graines aux dangers ×1,0, ×1,5, ×2,0, ×2,5, ×3,0, ×4,0. Kit seul, statistiques normalisées.

**Lecture.** Temps : médiane des victoires du **plan le plus rapide de la voie pour ce profil** ; PV : ceux **de ce même plan**. Écart : par rapport au même calcul pour la voie de dégâts de la classe. **Mur** : plus haut danger où au moins un plan rejoué de la voie gagne 90 % des combats (≥ signifie que le plus haut danger essayé est franchi).

## Répertoire 80

| Voie | Plan le plus rapide en moyenne | Moyenne | La Chaussée des lanternes | Les Fossés gris | La Cour des trois coups | Les Vergers de verre | Le Cloître des balances | Les Fours de recuit | La Salle des échos | Le Gué des plaies | La Chambre aux deux sceaux | Les Terrasses de la vigie | L’Atelier des mauvais jours | Le Belvédère des trois vents |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | Frappe d’atelier, Trempe vive, Poinçon du maître, Coup de travers, Deuxième frappe | 49,2 s | 66,3 s · 62 % · mur ×3,0 | 40,8 s · 54 % · mur ×3,0 | 39,5 s · 29 % · mur ×1,0 | 39,5 s · 42 % · mur ×1,5 | 46,3 s · 74 % · mur ×3,0 | 41,3 s · 50 % · mur ≥ ×4,0 | 66,5 s · 66 % · mur ×3,0 | 39,5 s · 51 % · mur ×2,5 | 57,3 s · 73 % · mur ≥ ×4,0 | 41,3 s · 42 % · mur ×1,5 | 53,0 s · 57 % · mur ×2,5 | 41,3 s · 40 % · mur ×3,0 |
| Enclumier | Frappe d’atelier, Trempe vive, Éclat du four, Coup de travers, Marteau de retour | 56,8 s | 71,6 s (+8 %) · 68 % · mur ×3,0 | 46,8 s (+15 %) · 47 % · mur ×3,0 | 46,3 s (+17 %) · 37 % · mur ×1,5 | 46,3 s (+17 %) · 22 % · mur ×1,0 | 64,8 s (+40 %) · 75 % · mur ×3,0 | 47,3 s (+15 %) · 48 % · mur ≥ ×4,0 | 71,0 s (+7 %) · 68 % · mur ×3,0 | 46,3 s (+17 %) · 42 % · mur ×2,5 | 66,4 s (+16 %) · 75 % · mur ≥ ×4,0 | 47,3 s (+15 %) · 53 % · mur ×1,5 | 59,8 s (+13 %) · 56 % · mur ×2,5 | 47,3 s (+15 %) · 38 % · mur ×3,0 |
| Rémouleur | Frappe d’atelier, Trempe vive, Éclat du four, Coup de travers, Marteau de retour | 61,4 s | 80,3 s (+21 %) · 72 % · mur ×3,0 | 49,8 s (+22 %) · 50 % · mur ×3,0 | 48,5 s (+23 %) · 23 % · mur ×1,5 | 48,5 s (+23 %) · 26 % · mur ×1,0 | 80,0 s (+73 %) · 72 % · mur ×3,0 | 50,8 s (+23 %) · 49 % · mur ≥ ×4,0 | 83,3 s (+25 %) · 73 % · mur ≥ ×4,0 | 48,5 s (+23 %) · 43 % · mur ×2,5 | 73,8 s (+29 %) · 81 % · mur ≥ ×4,0 | 50,8 s (+23 %) · 29 % · mur ×1,5 | 66,8 s (+26 %) · 58 % · mur ×2,5 | 50,8 s (+23 %) · 37 % · mur ×3,0 |
| Tue-Bête | Lecture de piste, Trait de poursuite, Flèche barbelée, Tir à la couture, Morsure croisée | 54,4 s | 69,3 s · 60 % · mur ×2,5 | 45,5 s · 44 % · mur ×1,5 | 44,6 s · 19 % · mur ×1,0 | 44,6 s · 24 % · mur ×1,0 | 68,0 s · 62 % · mur ×2,5 | 45,8 s · 44 % · mur ×3,0 | 68,0 s · 63 % · mur ×2,5 | 44,6 s · 41 % · mur ×1,5 | 68,0 s · 69 % · mur ×3,0 | 45,8 s · 40 % · mur ×1,5 | 58,3 s · 50 % · mur ×2,0 | 45,8 s · 33 % · mur ×2,5 |
| Piégeur | Lecture de piste, Trait de poursuite, Flèche barbelée, Flèches de gêne, Regard fixe | 59,1 s | 74,3 s (+7 %) · 69 % · mur ×3,0 | 47,5 s (+4 %) · 45 % · mur ×1,5 | 47,3 s (+6 %) · 26 % · mur ×1,5 | 47,3 s (+6 %) · 20 % · mur ×1,0 | 71,3 s (+5 %) · 68 % · mur ×3,0 | 49,8 s (+9 %) · 42 % · mur ≥ ×4,0 | 69,3 s (+2 %) · 69 % · mur ×3,0 | 47,3 s (+6 %) · 40 % · mur ×1,5 | 77,9 s (+15 %) · 72 % · mur ≥ ×4,0 | 49,6 s (+8 %) · 37 % · mur ×1,5 | 62,5 s (+7 %) · 52 % · mur ×2,5 | 49,8 s (+9 %) · 33 % · mur ×3,0 |
| Meneur de meute | Lecture de piste, Trait de poursuite, Flèche barbelée, Garde de meute, Partage de chasse | 61,9 s | 79,6 s (+15 %) · 87 % · mur ×3,0 | 51,1 s (+12 %) · 67 % · mur ×3,0 | 50,1 s (+12 %) · 42 % · mur ×1,0 | 50,1 s (+12 %) · 41 % · mur ×1,0 | 82,0 s (+21 %) · 83 % · mur ×3,0 | 52,3 s (+14 %) · 68 % · mur ≥ ×4,0 | 71,3 s (+5 %) · 100 % · mur ×3,0 | 50,1 s (+12 %) · 62 % · mur ×2,0 | 79,6 s (+17 %) · 99 % · mur ≥ ×4,0 | 52,3 s (+14 %) · 48 % · mur ×1,5 | 67,0 s (+15 %) · 87 % · mur ×2,5 | 52,3 s (+14 %) · 57 % · mur ×3,0 |
| Fulgurant | Trait incandescent, Trait fulgurant, Trait de gel, Trait des éclats, Rature ardente | 49,1 s | 68,3 s · 66 % · mur ×3,0 | 40,8 s · 54 % · mur ×3,0 | 40,8 s · 29 % · mur ×1,5 | 40,8 s · 36 % · mur ×1,5 | 42,3 s · 77 % · mur ≥ ×4,0 | 41,3 s · 52 % · mur ≥ ×4,0 | 65,5 s · 67 % · mur ≥ ×4,0 | 40,8 s · 50 % · mur ×2,5 | 49,3 s · 76 % · mur ≥ ×4,0 | 41,3 s · 44 % · mur ×1,5 | 52,8 s · 57 % · mur ×2,5 | 41,3 s · 41 % · mur ≥ ×4,0 |
| Sigillaire | Trait incandescent, Cercle de givre, Trait fulgurant, Trait de gel, Cercle révélateur | 55,1 s | 72,4 s (+6 %) · 69 % · mur ≥ ×4,0 | 46,5 s (+14 %) · 49 % · mur ×3,0 | 45,5 s (+12 %) · 35 % · mur ×1,5 | 45,5 s (+12 %) · 31 % · mur ×1,0 | 47,3 s (+12 %) · 80 % · mur ≥ ×4,0 | 46,9 s (+14 %) · 48 % · mur ≥ ×4,0 | 68,5 s (+5 %) · 67 % · mur ≥ ×4,0 | 45,5 s (+12 %) · 43 % · mur ×2,5 | 57,3 s (+16 %) · 73 % · mur ≥ ×4,0 | 46,9 s (+14 %) · 54 % · mur ×2,0 | 58,5 s (+11 %) · 61 % · mur ×3,0 | 46,9 s (+14 %) · 38 % · mur ×3,0 |
| Glyphiste | Trait incandescent, Trait fulgurant, Trait de gel, Cercle révélateur, Sceau de résonance | 55,2 s | 70,0 s (+3 %) · 95 % · mur ≥ ×4,0 | 46,9 s (+15 %) · 60 % · mur ×3,0 | 45,8 s (+12 %) · 54 % · mur ×1,5 | 45,5 s (+12 %) · 46 % · mur ×1,5 | 47,0 s (+11 %) · 93 % · mur ≥ ×4,0 | 47,5 s (+15 %) · 56 % · mur ≥ ×4,0 | 68,9 s (+5 %) · 81 % · mur ≥ ×4,0 | 46,0 s (+13 %) · 54 % · mur ×2,5 | 57,3 s (+16 %) · 87 % · mur ≥ ×4,0 | 47,3 s (+15 %) · 52 % · mur ×2,0 | 57,3 s (+9 %) · 81 % · mur ×2,5 | 47,5 s (+15 %) · 43 % · mur ≥ ×4,0 |

Sorts de voie dans le plan le plus rapide en moyenne :

- Trempe-Rouge : Deuxième frappe
- Enclumier : **aucun**
- Rémouleur : **aucun**
- Tue-Bête : Tir à la couture, Morsure croisée
- Piégeur : Flèches de gêne
- Meneur de meute : Garde de meute, Partage de chasse
- Fulgurant : Trait des éclats, Rature ardente
- Sigillaire : **aucun**
- Glyphiste : Sceau de résonance

