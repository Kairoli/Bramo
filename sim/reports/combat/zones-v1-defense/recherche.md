# Recherche de plans

> Généré par `pnpm --filter @bramo/sim sim combat-search`. Ne pas modifier à la main.

Toutes les combinaisons de 5 sorts accessibles à chaque voie (au plus un ultime), sans horaire (tous à 0 s, par cooldown croissant), arme : la première de la classe. Criblage à 2 graines au danger normal ; les plus rapides en moyenne, les plus sûrs (PV) et le plus rapide de chaque rencontre sont rejoués à 12 graines aux dangers ×1,0, ×1,5, ×2,0, ×2,5, ×3,0, ×4,0. Kit seul, statistiques normalisées.

**Lecture.** Temps : médiane des victoires du **plan le plus rapide de la voie pour ce profil** ; PV : ceux **de ce même plan**. Écart : par rapport au même calcul pour la voie de dégâts de la classe. **Mur** : plus haut danger où au moins un plan rejoué de la voie gagne 90 % des combats (≥ signifie que le plus haut danger essayé est franchi).

## Répertoire 80

| Voie | Plan le plus rapide en moyenne | Moyenne | La Chaussée des lanternes | Les Fossés gris | La Cour des trois coups | Les Vergers de verre | Le Cloître des balances | Les Fours de recuit | La Salle des échos | Le Gué des plaies | La Chambre aux deux sceaux | Les Terrasses de la vigie | L'Atelier des mauvais jours | Le Belvédère des trois vents |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | Frappe d’atelier, Coup de travers, Deuxième frappe, Marteau de retour, Reprise au rouge | 43,3 s | 38,6 s · 57 % · mur ×3,0 | 35,0 s · 51 % · mur ×3,0 | 35,0 s · 3 % · mur ×1,0 | 28,8 s · 53 % · mur ×2,0 | 41,3 s · 70 % · mur ≥ ×4,0 | 35,0 s · 40 % · mur ×2,0 | 57,5 s · 60 % · mur ≥ ×4,0 | 34,1 s · 36 % · mur ×2,0 | 59,8 s · 51 % · mur ×3,0 | 41,8 s · 17 % · mur ×1,0 | 54,1 s · 49 % · mur ×3,0 | 34,1 s · 1 % · mur ×1,0 |
| Enclumier | Frappe d’atelier, Trempe vive, Coup de travers, Marteau de retour, La Grande Trempe | 52,4 s | 48,3 s (+25 %) · 52 % · mur ×3,0 | 41,8 s (+19 %) · 43 % · mur ×3,0 | 42,3 s (+21 %) · 10 % · mur ×1,0 | 33,3 s (+16 %) · 45 % · mur ×1,5 | 55,8 s (+35 %) · 69 % · mur ≥ ×4,0 | 41,8 s (+19 %) · 17 % · mur ×2,0 | 62,0 s (+8 %) · 64 % · mur ≥ ×4,0 | 38,8 s (+14 %) · 38 % · mur ×2,0 | 80,0 s (+34 %) · 69 % · mur ≥ ×4,0 | 53,9 s (+29 %) · 3 % · mur ×1,0 | 61,3 s (+13 %) · 47 % · mur ×3,0 | 39,5 s (+16 %) · 8 % · mur ×1,0 |
| Rémouleur | Frappe d’atelier, Trempe vive, Coup de travers, Marteau de retour, Pose de rivets | 55,8 s | 53,0 s (+37 %) · 92 % · mur ×3,0 | 43,9 s (+25 %) · 63 % · mur ×3,0 | 43,9 s (+25 %) · 30 % · mur ×1,5 | 35,0 s (+22 %) · 54 % · mur ×1,5 | 56,8 s (+38 %) · 86 % · mur ≥ ×4,0 | 43,9 s (+25 %) · 50 % · mur ×2,0 | 66,1 s (+15 %) · 83 % · mur ≥ ×4,0 | 42,3 s (+24 %) · 43 % · mur ×2,5 | 86,8 s (+45 %) · 46 % · mur ≥ ×4,0 | 54,8 s (+31 %) · 4 % · mur ×1,5 | 67,3 s (+24 %) · 72 % · mur ≥ ×4,0 | 42,3 s (+24 %) · 27 % · mur ×1,0 |
| Tue-Bête | Trait de poursuite, Sifflet bref, Tir à la couture, Battement de meute, Morsure croisée | 54,3 s | 50,3 s · 55 % · mur ×2,5 | 38,5 s · 43 % · mur ×2,0 | 42,4 s · 3 % · mur ×1,0 | 31,3 s · 45 % · mur ×1,5 | 51,4 s · 61 % · mur ×3,0 | 38,5 s · 10 % · mur ×1,5 | 60,3 s · 58 % · mur ×3,0 | 37,3 s · 32 % · mur ×1,5 | 87,3 s · 29 % · mur ×2,5 | 45,3 s · 15 % · mur ×1,0 | 59,3 s · 41 % · mur ×2,5 | 38,9 s · 2 % · mur ×1,0 |
| Piégeur | Lecture de piste, Trait de poursuite, Collet vif, Flèche barbelée, Regard fixe | 52,8 s | 49,3 s (-2 %) · 55 % · mur ×2,5 | 40,5 s (+5 %) · 45 % · mur ×2,0 | 42,3 s (-0 %) · 7 % · mur ×1,0 | 34,8 s (+11 %) · 40 % · mur ×1,5 | 55,3 s (+8 %) · 70 % · mur ≥ ×4,0 | 40,5 s (+5 %) · 23 % · mur ×1,5 | 61,3 s (+2 %) · 77 % · mur ≥ ×4,0 | 38,5 s (+3 %) · 37 % · mur ×1,5 | 90,6 s (+4 %) · 41 % · mur ×3,0 | 47,0 s (+4 %) · 31 % · mur ×1,5 | 62,8 s (+6 %) · 44 % · mur ×2,5 | 38,0 s (-2 %) · 6 % · mur ×1,0 |
| Meneur de meute | Lecture de piste, Trait de poursuite, Flèche barbelée, Garde de meute, Regard fixe | 55,4 s | 53,5 s (+6 %) · 40 % · mur ×3,0 | 43,8 s (+14 %) · 62 % · mur ×3,0 | 43,8 s (+3 %) · 14 % · mur ×1,0 | 35,3 s (+13 %) · 82 % · mur ×2,0 | 56,8 s (+10 %) · 97 % · mur ≥ ×4,0 | 43,8 s (+14 %) · 37 % · mur ×2,0 | 67,8 s (+12 %) · 98 % · mur ≥ ×4,0 | 42,8 s (+15 %) · 37 % · mur ×2,0 | 103,3 s (+18 %) · 90 % · mur ≥ ×4,0 | 53,1 s (+17 %) · 12 % · mur ×1,5 | 67,1 s (+13 %) · 94 % · mur ×3,0 | 42,8 s (+10 %) · 19 % · mur ×1,0 |
| Fulgurant | Trait incandescent, Trait fulgurant, Trait de gel, Trait des éclats, Rature ardente | 43,8 s | 39,3 s · 57 % · mur ×3,0 | 35,3 s · 53 % · mur ×3,0 | 35,3 s · 5 % · mur ×1,0 | 29,3 s · 54 % · mur ×2,0 | 41,3 s · 73 % · mur ≥ ×4,0 | 35,3 s · 41 % · mur ×2,0 | 57,3 s · 62 % · mur ≥ ×4,0 | 33,3 s · 40 % · mur ×2,0 | 61,3 s · 66 % · mur ≥ ×4,0 | 42,8 s · 21 % · mur ×1,5 | 53,3 s · 50 % · mur ×3,0 | 33,3 s · 18 % · mur ×1,0 |
| Sigillaire | Trait incandescent, Cercle de givre, Trait fulgurant, Trait de gel, Cercle révélateur | 47,5 s | 46,3 s (+18 %) · 58 % · mur ×3,0 | 39,3 s (+11 %) · 51 % · mur ×3,0 | 39,3 s (+11 %) · 19 % · mur ×1,5 | 30,3 s (+3 %) · 54 % · mur ×2,0 | 44,5 s (+8 %) · 75 % · mur ≥ ×4,0 | 39,3 s (+11 %) · 18 % · mur ×2,0 | 59,3 s (+3 %) · 65 % · mur ≥ ×4,0 | 37,6 s (+13 %) · 46 % · mur ×2,5 | 70,9 s (+16 %) · 67 % · mur ≥ ×4,0 | 45,3 s (+6 %) · 33 % · mur ×1,5 | 58,5 s (+10 %) · 53 % · mur ≥ ×4,0 | 37,6 s (+13 %) · 22 % · mur ×1,5 |
| Glyphiste | Trait incandescent, Trait fulgurant, Trait de gel, Cercle révélateur, Sceau de résonance | 47,9 s | 41,3 s (+5 %) · 80 % · mur ≥ ×4,0 | 39,3 s (+11 %) · 65 % · mur ≥ ×4,0 | 39,3 s (+11 %) · 35 % · mur ×1,5 | 30,3 s (+3 %) · 72 % · mur ×2,5 | 44,5 s (+8 %) · 91 % · mur ≥ ×4,0 | 38,3 s (+9 %) · 43 % · mur ×2,0 | 57,3 s (+0 %) · 86 % · mur ≥ ×4,0 | 37,3 s (+12 %) · 66 % · mur ×2,5 | 74,0 s (+21 %) · 68 % · mur ≥ ×4,0 | 46,0 s (+8 %) · 53 % · mur ×1,5 | 58,9 s (+11 %) · 79 % · mur ≥ ×4,0 | 37,1 s (+12 %) · 29 % · mur ×1,5 |

Sorts de voie dans le plan le plus rapide en moyenne :

- Trempe-Rouge : Deuxième frappe, Reprise au rouge
- Enclumier : **aucun**
- Rémouleur : Pose de rivets
- Tue-Bête : Tir à la couture, Morsure croisée
- Piégeur : **aucun**
- Meneur de meute : Garde de meute
- Fulgurant : Trait des éclats, Rature ardente
- Sigillaire : **aucun**
- Glyphiste : Sceau de résonance

