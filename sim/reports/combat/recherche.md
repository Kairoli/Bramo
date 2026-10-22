# Recherche de plans

> Généré par `pnpm --filter @bramo/sim sim combat-search`. Ne pas modifier à la main.

Toutes les combinaisons de 5 sorts accessibles à chaque voie (au plus un ultime), sans horaire (tous à 0 s, par cooldown croissant), arme : la première de la classe. Criblage à 2 graines au danger normal ; les plus rapides en moyenne, les plus sûrs (PV) et le plus rapide de chaque rencontre sont rejoués à 12 graines aux dangers ×1,0, ×1,5, ×2,0, ×2,5, ×3,0, ×4,0. Kit seul, statistiques normalisées.

**Lecture.** Temps : médiane des victoires du **plan le plus rapide de la voie pour ce profil** ; PV : ceux **de ce même plan**. Écart : par rapport au même calcul pour la voie de dégâts de la classe. **Mur** : plus haut danger où au moins un plan rejoué de la voie gagne 90 % des combats (≥ signifie que le plus haut danger essayé est franchi).

## Répertoire 40

| Voie | Plan le plus rapide en moyenne | Moyenne | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | Frappe d’atelier, Trempe vive, Poinçon du maître, Éclat du four, Coup de travers | 44,2 s | 37,8 s · 63 % · mur ×2,5 | 59,8 s · 42 % · mur ×1,5 | 39,5 s · 58 % · mur ×2,0 | 44,3 s · 55 % · mur ×2,5 | 44,3 s · 69 % · mur ×3,0 | 39,6 s · 71 % · mur ×3,0 |
| Enclumier | Frappe d’atelier, Trempe vive, Éclat du four, Coup de travers, Marteau de retour | 46,9 s | 39,5 s (+5 %) · 67 % · mur ×3,0 | 62,5 s (+5 %) · 42 % · mur ×1,5 | 42,8 s (+8 %) · 63 % · mur ×2,5 | 46,8 s (+6 %) · 57 % · mur ×3,0 | 46,8 s (+6 %) · 73 % · mur ×3,0 | 43,4 s (+9 %) · 75 % · mur ≥ ×4,0 |
| Rémouleur | Frappe d’atelier, Trempe vive, Éclat du four, Coup de travers, Marteau de retour | 49,5 s | 42,8 s (+13 %) · 65 % · mur ×3,0 | 67,3 s (+13 %) · 48 % · mur ×2,0 | 44,3 s (+12 %) · 75 % · mur ×2,5 | 48,0 s (+8 %) · 60 % · mur ×3,0 | 48,5 s (+10 %) · 75 % · mur ×3,0 | 45,1 s (+14 %) · 89 % · mur ×3,0 |
| Tue-Bête | Lecture de piste, Trait de poursuite, Tir de travers, Flèche barbelée, Tir à la couture | 46,8 s | 39,3 s · 60 % · mur ×2,5 | 62,3 s · 35 % · mur ×1,5 | 43,0 s · 54 % · mur ×2,0 | 45,8 s · 56 % · mur ×2,5 | 45,8 s · 70 % · mur ×3,0 | 43,0 s · 66 % · mur ×3,0 |
| Piégeur | Lecture de piste, Trait de poursuite, Collet vif, Flèche barbelée, Dents de fer | 49,9 s | 43,3 s (+10 %) · 68 % · mur ×3,0 | 67,3 s (+8 %) · 37 % · mur ×1,5 | 45,3 s (+5 %) · 65 % · mur ×2,5 | 48,3 s (+5 %) · 59 % · mur ×3,0 | 48,3 s (+5 %) · 74 % · mur ×3,0 | 45,3 s (+5 %) · 75 % · mur ×3,0 |
| Meneur de meute | Lecture de piste, Trait de poursuite, Tir de travers, Flèche barbelée, Garde de meute | 52,0 s | 45,0 s (+15 %) · 79 % · mur ×2,5 | 69,3 s (+11 %) · 59 % · mur ×1,5 | 46,5 s (+8 %) · 76 % · mur ×2,5 | 51,5 s (+13 %) · 66 % · mur ×3,0 | 51,5 s (+13 %) · 81 % · mur ×3,0 | 47,8 s (+11 %) · 83 % · mur ×3,0 |
| Fulgurant | Trait incandescent, Cercle de givre, Trait fulgurant, Trait de gel, Rature ardente | 42,7 s | 37,0 s · 69 % · mur ×3,0 | 57,5 s · 44 % · mur ×2,0 | 37,1 s · 62 % · mur ×2,5 | 43,0 s · 60 % · mur ×3,0 | 43,0 s · 73 % · mur ×3,0 | 37,9 s · 74 % · mur ≥ ×4,0 |
| Sigillaire | Trait incandescent, Cercle de givre, Trait fulgurant, Trait de gel, Anneau de cendres | 45,7 s | 38,3 s (+3 %) · 71 % · mur ×3,0 | 61,1 s (+6 %) · 52 % · mur ×2,0 | 39,3 s (+6 %) · 67 % · mur ×3,0 | 46,3 s (+8 %) · 63 % · mur ×3,0 | 46,3 s (+8 %) · 76 % · mur ≥ ×4,0 | 41,0 s (+8 %) · 80 % · mur ≥ ×4,0 |
| Glyphiste | Trait incandescent, Trait fulgurant, Trait de gel, Anneau de cendres, Sceau de résonance | 46,7 s | 38,3 s (+3 %) · 90 % · mur ×3,0 | 63,3 s (+10 %) · 62 % · mur ×2,0 | 41,3 s (+11 %) · 71 % · mur ×2,5 | 46,3 s (+8 %) · 69 % · mur ×3,0 | 45,8 s (+6 %) · 83 % · mur ×3,0 | 42,6 s (+13 %) · 83 % · mur ≥ ×4,0 |

Sorts de voie dans le plan le plus rapide en moyenne :

- Trempe-Rouge : **aucun**
- Enclumier : **aucun**
- Rémouleur : **aucun**
- Tue-Bête : Tir à la couture
- Piégeur : Dents de fer
- Meneur de meute : Garde de meute
- Fulgurant : Rature ardente
- Sigillaire : **aucun**
- Glyphiste : Sceau de résonance

## Répertoire 80

| Voie | Plan le plus rapide en moyenne | Moyenne | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | Frappe d’atelier, Trempe vive, Éclat du four, Coup de travers, Deuxième frappe | 41,0 s | 35,0 s · 68 % · mur ×3,0 | 55,5 s · 43 % · mur ×2,0 | 36,0 s · 60 % · mur ×2,5 | 39,5 s · 58 % · mur ×3,0 | 39,5 s · 72 % · mur ×3,0 | 37,3 s · 74 % · mur ×3,0 |
| Enclumier | Frappe d’atelier, Trempe vive, Éclat du four, Coup de travers, Marteau de retour | 46,9 s | 39,5 s (+13 %) · 67 % · mur ×3,0 | 61,4 s (+11 %) · 42 % · mur ×2,0 | 42,3 s (+17 %) · 63 % · mur ×2,5 | 46,8 s (+18 %) · 57 % · mur ×3,0 | 46,8 s (+18 %) · 73 % · mur ≥ ×4,0 | 42,3 s (+13 %) · 74 % · mur ≥ ×4,0 |
| Rémouleur | Frappe d’atelier, Trempe vive, Éclat du four, Coup de travers, Marteau de retour | 49,5 s | 42,3 s (+21 %) · 68 % · mur ×3,0 | 63,1 s (+14 %) · 51 % · mur ×2,0 | 44,3 s (+23 %) · 63 % · mur ×2,5 | 48,0 s (+22 %) · 60 % · mur ×3,0 | 48,5 s (+23 %) · 75 % · mur ×3,0 | 45,1 s (+21 %) · 89 % · mur ×3,0 |
| Tue-Bête | Lecture de piste, Trait de poursuite, Flèche barbelée, Tir à la couture, Pas de côté | 45,1 s | 38,1 s · 60 % · mur ×2,5 | 59,5 s · 45 % · mur ×1,5 | 39,3 s · 56 % · mur ×2,0 | 44,6 s · 52 % · mur ×2,5 | 44,6 s · 66 % · mur ×3,0 | 40,8 s · 69 % · mur ×3,0 |
| Piégeur | Lecture de piste, Trait de poursuite, Flèche barbelée, Dents de fer, Regard fixe | 48,4 s | 38,9 s (+2 %) · 67 % · mur ×3,0 | 67,0 s (+13 %) · 51 % · mur ×2,0 | 43,5 s (+11 %) · 63 % · mur ×2,5 | 47,3 s (+6 %) · 56 % · mur ×3,0 | 47,3 s (+6 %) · 69 % · mur ×3,0 | 44,5 s (+9 %) · 72 % · mur ×3,0 |
| Meneur de meute | Lecture de piste, Trait de poursuite, Flèche barbelée, Garde de meute, Regard fixe | 51,0 s | 42,8 s (+12 %) · 73 % · mur ×2,5 | 69,3 s (+16 %) · 59 % · mur ×2,0 | 45,3 s (+15 %) · 72 % · mur ×2,5 | 50,1 s (+12 %) · 80 % · mur ×3,0 | 50,1 s (+12 %) · 94 % · mur ×3,0 | 46,5 s (+14 %) · 84 % · mur ×3,0 |
| Fulgurant | Trait incandescent, Trait fulgurant, Trait de gel, Trait des éclats, Rature ardente | 41,4 s | 34,5 s · 68 % · mur ×3,0 | 57,3 s · 43 % · mur ×2,0 | 37,3 s · 60 % · mur ×2,5 | 40,8 s · 60 % · mur ×3,0 | 40,8 s · 72 % · mur ×3,0 | 37,5 s · 74 % · mur ×3,0 |
| Sigillaire | Trait incandescent, Cercle de givre, Trait fulgurant, Trait de gel, Ligne de partage | 45,6 s | 38,0 s (+10 %) · 69 % · mur ×3,0 | 60,0 s (+5 %) · 49 % · mur ×2,0 | 39,3 s (+5 %) · 66 % · mur ×3,0 | 45,5 s (+12 %) · 61 % · mur ×3,0 | 45,5 s (+12 %) · 73 % · mur ≥ ×4,0 | 40,3 s (+7 %) · 78 % · mur ≥ ×4,0 |
| Glyphiste | Trait incandescent, Trait fulgurant, Trait de gel, Sceau de résonance, Ligne de partage | 46,3 s | 38,5 s (+12 %) · 77 % · mur ×3,0 | 60,6 s (+6 %) · 66 % · mur ×2,0 | 41,0 s (+10 %) · 69 % · mur ×3,0 | 45,8 s (+12 %) · 71 % · mur ×3,0 | 45,4 s (+11 %) · 88 % · mur ≥ ×4,0 | 41,0 s (+9 %) · 94 % · mur ≥ ×4,0 |

Sorts de voie dans le plan le plus rapide en moyenne :

- Trempe-Rouge : Deuxième frappe
- Enclumier : **aucun**
- Rémouleur : **aucun**
- Tue-Bête : Tir à la couture, Pas de côté
- Piégeur : Dents de fer
- Meneur de meute : Garde de meute
- Fulgurant : Trait des éclats, Rature ardente
- Sigillaire : **aucun**
- Glyphiste : Sceau de résonance

