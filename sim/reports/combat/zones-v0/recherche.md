# Recherche de plans

> Généré par `pnpm --filter @bramo/sim sim combat-search`. Ne pas modifier à la main.

Toutes les combinaisons de 5 sorts accessibles à chaque voie (au plus un ultime), sans horaire (tous à 0 s, par cooldown croissant), arme : la première de la classe. Criblage à 2 graines au danger normal ; les plus rapides en moyenne, les plus sûrs (PV) et le plus rapide de chaque rencontre sont rejoués à 12 graines aux dangers ×1,0, ×1,5, ×2,0, ×2,5, ×3,0, ×4,0. Kit seul, statistiques normalisées.

**Lecture.** Temps : médiane des victoires du **plan le plus rapide de la voie pour ce profil** ; PV : ceux **de ce même plan**. Écart : par rapport au même calcul pour la voie de dégâts de la classe. **Mur** : plus haut danger où au moins un plan rejoué de la voie gagne 90 % des combats (≥ signifie que le plus haut danger essayé est franchi).

## Répertoire 80

| Voie | Plan le plus rapide en moyenne | Moyenne | La Chaussée des lanternes | Les Fossés gris | La Cour des trois coups | Les Vergers de verre | Le Cloître des balances | Les Fours de recuit | La Salle des échos | Le Gué des plaies | La Chambre aux deux sceaux | Les Terrasses de la vigie | L'Atelier des mauvais jours | Le Belvédère des trois vents |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | Frappe d’atelier, Trempe vive, Coup de travers, Deuxième frappe, Reprise au rouge | 38,6 s | 38,6 s · 57 % · mur ×2,0 | 35,0 s · 66 % · mur ×3,0 | 35,0 s · 51 % · mur ×2,0 | 28,8 s · 64 % · mur ×2,5 | 40,8 s · 73 % · mur ×3,0 | 35,0 s · 60 % · mur ×2,5 | 44,3 s · 69 % · mur ×3,0 | 34,1 s · 58 % · mur ×2,5 | 46,8 s · 59 % · mur ×2,0 | 39,5 s · 55 % · mur ×2,5 | 44,0 s · 57 % · mur ×2,5 | 34,1 s · 39 % · mur ×1,5 |
| Enclumier | Frappe d’atelier, Trempe vive, Poinçon du maître, Coup de travers, Marteau de retour | 45,3 s | 48,1 s (+25 %) · 52 % · mur ×2,0 | 41,8 s (+19 %) · 63 % · mur ×3,0 | 41,8 s (+19 %) · 49 % · mur ×2,0 | 33,3 s (+16 %) · 58 % · mur ×2,0 | 49,8 s (+22 %) · 72 % · mur ×3,0 | 41,8 s (+19 %) · 53 % · mur ×2,5 | 48,8 s (+10 %) · 72 % · mur ×3,0 | 38,8 s (+14 %) · 60 % · mur ×2,5 | 59,3 s (+27 %) · 56 % · mur ×2,5 | 45,3 s (+15 %) · 59 % · mur ×2,0 | 48,8 s (+11 %) · 58 % · mur ×2,5 | 38,8 s (+14 %) · 38 % · mur ×1,5 |
| Rémouleur | Frappe d’atelier, Trempe vive, Coup de travers, Marteau de retour, Pose de rivets | 49,3 s | 51,4 s (+33 %) · 51 % · mur ×2,0 | 43,9 s (+25 %) · 77 % · mur ×3,0 | 43,9 s (+25 %) · 63 % · mur ×2,0 | 35,0 s (+22 %) · 61 % · mur ×2,0 | 54,8 s (+34 %) · 73 % · mur ×3,0 | 43,9 s (+25 %) · 65 % · mur ×2,5 | 54,8 s (+24 %) · 86 % · mur ×3,0 | 41,8 s (+22 %) · 54 % · mur ×2,5 | 66,0 s (+41 %) · 65 % · mur ×2,5 | 47,3 s (+20 %) · 57 % · mur ×2,0 | 54,8 s (+24 %) · 57 % · mur ×2,5 | 42,3 s (+24 %) · 46 % · mur ×1,5 |
| Tue-Bête | Lecture de piste, Trait de poursuite, Flèche barbelée, Tir à la couture, Morsure croisée | 42,8 s | 48,9 s · 43 % · mur ×1,5 | 38,5 s · 60 % · mur ×2,5 | 38,5 s · 41 % · mur ×1,5 | 31,3 s · 56 % · mur ×2,0 | 45,3 s · 66 % · mur ×2,5 | 38,5 s · 47 % · mur ×2,0 | 47,5 s · 64 % · mur ×2,5 | 37,3 s · 56 % · mur ×2,0 | 55,3 s · 52 % · mur ×2,0 | 43,3 s · 51 % · mur ×2,0 | 47,3 s · 54 % · mur ×2,0 | 37,3 s · 33 % · mur ×1,0 |
| Piégeur | Lecture de piste, Trait de poursuite, Flèche barbelée, Dents de fer, Regard fixe | 46,3 s | 49,3 s (+1 %) · 55 % · mur ×2,0 | 40,5 s (+5 %) · 63 % · mur ×2,5 | 40,5 s (+5 %) · 49 % · mur ×2,0 | 34,8 s (+11 %) · 54 % · mur ×2,0 | 52,5 s (+16 %) · 69 % · mur ×3,0 | 40,5 s (+5 %) · 53 % · mur ×2,5 | 52,3 s (+10 %) · 71 % · mur ×3,0 | 38,5 s (+3 %) · 60 % · mur ×2,0 | 63,0 s (+14 %) · 55 % · mur ×2,5 | 46,5 s (+8 %) · 58 % · mur ×2,5 | 51,3 s (+8 %) · 55 % · mur ×2,5 | 38,0 s (+2 %) · 39 % · mur ×1,5 |
| Meneur de meute | Lecture de piste, Trait de poursuite, Flèche barbelée, Garde de meute, Regard fixe | 49,4 s | 53,3 s (+9 %) · 52 % · mur ×2,0 | 43,8 s (+14 %) · 72 % · mur ×3,0 | 43,8 s (+14 %) · 54 % · mur ×2,0 | 35,3 s (+13 %) · 71 % · mur ×2,0 | 53,3 s (+18 %) · 74 % · mur ×3,0 | 43,8 s (+14 %) · 60 % · mur ×2,5 | 55,5 s (+17 %) · 82 % · mur ×3,0 | 42,8 s (+15 %) · 60 % · mur ×2,0 | 68,5 s (+24 %) · 88 % · mur ×2,5 | 49,4 s (+14 %) · 55 % · mur ×2,0 | 53,3 s (+13 %) · 61 % · mur ×2,5 | 42,8 s (+15 %) · 41 % · mur ×1,5 |
| Fulgurant | Trait incandescent, Trait fulgurant, Trait de gel, Trait des éclats, Rature ardente | 38,7 s | 39,3 s · 57 % · mur ×2,0 | 35,3 s · 68 % · mur ×3,0 | 35,3 s · 53 % · mur ×2,0 | 29,3 s · 64 % · mur ×2,5 | 39,8 s · 74 % · mur ×3,0 | 35,3 s · 62 % · mur ×2,5 | 44,8 s · 68 % · mur ×3,0 | 33,3 s · 62 % · mur ×2,5 | 51,5 s · 64 % · mur ×2,5 | 39,3 s · 55 % · mur ×2,5 | 44,8 s · 56 % · mur ×2,5 | 33,3 s · 45 % · mur ×1,5 |
| Sigillaire | Trait incandescent, Cercle de givre, Trait fulgurant, Trait de gel, Cercle révélateur | 43,2 s | 46,3 s (+18 %) · 58 % · mur ×2,5 | 39,3 s (+11 %) · 68 % · mur ×3,0 | 39,3 s (+11 %) · 58 % · mur ×2,0 | 30,3 s (+3 %) · 64 % · mur ×2,5 | 44,3 s (+11 %) · 77 % · mur ≥ ×4,0 | 39,3 s (+11 %) · 54 % · mur ×2,5 | 47,5 s (+6 %) · 72 % · mur ≥ ×4,0 | 37,6 s (+13 %) · 65 % · mur ×2,5 | 58,8 s (+14 %) · 65 % · mur ×3,0 | 44,6 s (+14 %) · 60 % · mur ×2,5 | 47,4 s (+6 %) · 61 % · mur ×3,0 | 37,6 s (+13 %) · 49 % · mur ×1,5 |
| Glyphiste | Trait incandescent, Trait fulgurant, Sceau de résonance, Ligne de partage, Trait de relève | 43,4 s | 46,5 s (+18 %) · 65 % · mur ×2,5 | 39,3 s (+11 %) · 80 % · mur ×3,0 | 39,3 s (+11 %) · 66 % · mur ×2,0 | 30,6 s (+5 %) · 75 % · mur ×2,5 | 44,5 s (+12 %) · 84 % · mur ≥ ×4,0 | 39,3 s (+11 %) · 67 % · mur ×2,5 | 47,3 s (+6 %) · 84 % · mur ×3,0 | 37,3 s (+12 %) · 76 % · mur ×2,5 | 59,1 s (+15 %) · 72 % · mur ×2,5 | 43,8 s (+11 %) · 70 % · mur ×2,5 | 47,3 s (+6 %) · 78 % · mur ×2,5 | 37,3 s (+12 %) · 52 % · mur ×1,5 |

Sorts de voie dans le plan le plus rapide en moyenne :

- Trempe-Rouge : Deuxième frappe, Reprise au rouge
- Enclumier : **aucun**
- Rémouleur : Pose de rivets
- Tue-Bête : Tir à la couture, Morsure croisée
- Piégeur : Dents de fer
- Meneur de meute : Garde de meute
- Fulgurant : Trait des éclats, Rature ardente
- Sigillaire : **aucun**
- Glyphiste : Sceau de résonance, Trait de relève

