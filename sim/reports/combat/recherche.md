# Recherche de plans

> Généré par `pnpm --filter @bramo/sim sim combat-search`. Ne pas modifier à la main.

Toutes les combinaisons de 5 sorts accessibles à chaque voie (au plus un ultime), sans horaire (tous à 0 s, par cooldown croissant), arme : la première de la classe. Criblage à 2 graines au danger normal ; les plus rapides en moyenne, les plus sûrs (PV) et le plus rapide de chaque rencontre sont rejoués à 12 graines aux dangers ×1,0, ×1,5, ×2,0, ×2,5, ×3,0, ×4,0. Kit seul, statistiques normalisées.

**Lecture.** Temps : médiane des victoires du **plan le plus rapide de la voie pour ce profil** ; PV : ceux **de ce même plan**. Écart : par rapport au même calcul pour la voie de dégâts de la classe. **Mur** : plus haut danger où au moins un plan rejoué de la voie gagne 90 % des combats (≥ signifie que le plus haut danger essayé est franchi).

## Répertoire 40

| Voie | Plan le plus rapide en moyenne | Moyenne | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | Frappe d’atelier, Trempe vive, Poinçon du maître, Éclat du four, Coup de travers | 48,0 s | 39,8 s · 62 % · mur ×2,5 | 64,1 s · 37 % · mur ×1,5 | 43,9 s · 56 % · mur ×2,0 | 47,3 s · 53 % · mur ×2,5 | 47,3 s · 68 % · mur ×3,0 | 44,0 s · 69 % · mur ×3,0 |
| Enclumier | Frappe d’atelier, Trempe vive, Éclat du four, Coup de travers, Marteau de retour | 47,0 s | 39,5 s (-1 %) · 63 % · mur ×2,5 | 63,1 s (-2 %) · 42 % · mur ×1,5 | 42,8 s (-3 %) · 58 % · mur ×2,0 | 46,8 s (-1 %) · 55 % · mur ×3,0 | 46,8 s (-1 %) · 70 % · mur ×3,0 | 43,4 s (-1 %) · 72 % · mur ×3,0 |
| Rémouleur | Frappe d’atelier, Trempe vive, Éclat du four, Coup de travers, Marteau de retour | 49,5 s | 42,8 s (+8 %) · 65 % · mur ×3,0 | 67,5 s (+5 %) · 44 % · mur ×2,0 | 44,3 s (+1 %) · 75 % · mur ×2,5 | 48,0 s (+2 %) · 60 % · mur ×3,0 | 48,5 s (+3 %) · 75 % · mur ×3,0 | 45,1 s (+3 %) · 89 % · mur ×3,0 |
| Tue-Bête | Lecture de piste, Trait de poursuite, Tir de travers, Flèche barbelée, Tir à la couture | 48,2 s | 41,3 s · 63 % · mur ×2,0 | 66,8 s · 32 % · mur ×1,5 | 43,1 s · 54 % · mur ×2,0 | 46,8 s · 56 % · mur ×2,5 | 46,8 s · 70 % · mur ×3,0 | 43,8 s · 66 % · mur ×3,0 |
| Piégeur | Lecture de piste, Trait de poursuite, Collet vif, Flèche barbelée, Dents de fer | 49,9 s | 43,3 s (+5 %) · 66 % · mur ×2,5 | 68,3 s (+2 %) · 35 % · mur ×1,5 | 45,3 s (+5 %) · 60 % · mur ×2,5 | 48,3 s (+3 %) · 57 % · mur ×3,0 | 48,3 s (+3 %) · 70 % · mur ×3,0 | 45,3 s (+3 %) · 71 % · mur ×3,0 |
| Meneur de meute | Lecture de piste, Trait de poursuite, Tir de travers, Flèche barbelée, Garde de meute | 52,0 s | 45,0 s (+9 %) · 79 % · mur ×2,5 | 69,3 s (+4 %) · 59 % · mur ×1,5 | 46,5 s (+8 %) · 76 % · mur ×2,5 | 51,5 s (+10 %) · 66 % · mur ×3,0 | 51,5 s (+10 %) · 81 % · mur ×3,0 | 47,8 s (+9 %) · 83 % · mur ×3,0 |
| Fulgurant | Trait incandescent, Cercle de givre, Trait fulgurant, Trait de gel, Rature ardente | 42,7 s | 37,0 s · 69 % · mur ×3,0 | 57,5 s · 44 % · mur ×2,0 | 37,1 s · 62 % · mur ×2,5 | 43,0 s · 60 % · mur ×3,0 | 43,0 s · 73 % · mur ×3,0 | 37,9 s · 74 % · mur ≥ ×4,0 |
| Sigillaire | Trait incandescent, Cercle de givre, Trait fulgurant, Trait de gel, Sceau d’arrêt | 46,8 s | 39,3 s (+6 %) · 70 % · mur ×3,0 | 61,6 s (+7 %) · 47 % · mur ×2,0 | 39,8 s (+7 %) · 64 % · mur ×2,5 | 47,3 s (+10 %) · 60 % · mur ×3,0 | 47,3 s (+10 %) · 75 % · mur ×3,0 | 42,0 s (+11 %) · 78 % · mur ≥ ×4,0 |
| Glyphiste | Trait incandescent, Trait fulgurant, Trait de gel, Anneau de cendres, Sceau de résonance | 46,7 s | 38,3 s (+3 %) · 90 % · mur ×3,0 | 64,0 s (+11 %) · 60 % · mur ×2,0 | 41,3 s (+11 %) · 71 % · mur ×2,5 | 46,3 s (+8 %) · 69 % · mur ×3,0 | 45,8 s (+6 %) · 83 % · mur ×3,0 | 42,6 s (+13 %) · 83 % · mur ≥ ×4,0 |

Sorts de voie dans le plan le plus rapide en moyenne :

- Trempe-Rouge : **aucun**
- Enclumier : **aucun**
- Rémouleur : **aucun**
- Tue-Bête : Tir à la couture
- Piégeur : Dents de fer
- Meneur de meute : Garde de meute
- Fulgurant : Rature ardente
- Sigillaire : Sceau d’arrêt
- Glyphiste : Sceau de résonance

## Répertoire 80

| Voie | Plan le plus rapide en moyenne | Moyenne | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | Frappe d’atelier, Trempe vive, Coup de travers, Deuxième frappe, Reprise au rouge | 42,9 s | 37,3 s · 65 % · mur ×2,5 | 57,5 s · 42 % · mur ×1,5 | 38,3 s · 60 % · mur ×2,0 | 41,8 s · 58 % · mur ×3,0 | 41,8 s · 71 % · mur ×3,0 | 39,1 s · 72 % · mur ×3,0 |
| Enclumier | Frappe d’atelier, Trempe vive, Éclat du four, Coup de travers, Marteau de retour | 47,0 s | 39,5 s (+6 %) · 63 % · mur ×2,5 | 58,4 s (+2 %) · 46 % · mur ×1,5 | 42,3 s (+10 %) · 58 % · mur ×2,5 | 46,8 s (+12 %) · 55 % · mur ×3,0 | 46,8 s (+12 %) · 70 % · mur ×3,0 | 42,3 s (+8 %) · 72 % · mur ×3,0 |
| Rémouleur | Frappe d’atelier, Trempe vive, Éclat du four, Coup de travers, Marteau de retour | 49,5 s | 42,3 s (+13 %) · 68 % · mur ×3,0 | 63,1 s (+10 %) · 51 % · mur ×2,0 | 44,3 s (+16 %) · 63 % · mur ×2,5 | 48,0 s (+15 %) · 60 % · mur ×3,0 | 48,5 s (+16 %) · 75 % · mur ×3,0 | 45,1 s (+15 %) · 89 % · mur ×3,0 |
| Tue-Bête | Lecture de piste, Trait de poursuite, Tir à la couture, Morsure croisée, Regard fixe | 46,4 s | 38,5 s · 60 % · mur ×2,0 | 60,9 s · 35 % · mur ×1,5 | 40,8 s · 56 % · mur ×2,0 | 45,8 s · 51 % · mur ×2,5 | 45,8 s · 65 % · mur ×3,0 | 41,0 s · 68 % · mur ×3,0 |
| Piégeur | Lecture de piste, Trait de poursuite, Flèche barbelée, Dents de fer, Regard fixe | 48,5 s | 38,9 s (+1 %) · 65 % · mur ×2,5 | 67,8 s (+11 %) · 40 % · mur ×1,5 | 43,5 s (+7 %) · 59 % · mur ×2,5 | 47,3 s (+3 %) · 54 % · mur ×3,0 | 47,3 s (+3 %) · 68 % · mur ×3,0 | 44,5 s (+9 %) · 70 % · mur ×3,0 |
| Meneur de meute | Lecture de piste, Trait de poursuite, Flèche barbelée, Garde de meute, Regard fixe | 51,0 s | 42,8 s (+11 %) · 73 % · mur ×2,5 | 69,3 s (+14 %) · 59 % · mur ×2,0 | 45,3 s (+11 %) · 72 % · mur ×2,5 | 50,1 s (+10 %) · 80 % · mur ×3,0 | 50,1 s (+10 %) · 94 % · mur ×3,0 | 46,5 s (+13 %) · 84 % · mur ×3,0 |
| Fulgurant | Trait incandescent, Trait fulgurant, Trait de gel, Trait des éclats, Rature ardente | 41,4 s | 34,5 s · 68 % · mur ×2,5 | 57,3 s · 43 % · mur ×2,0 | 37,3 s · 60 % · mur ×2,0 | 40,8 s · 60 % · mur ×3,0 | 40,8 s · 72 % · mur ×3,0 | 37,5 s · 74 % · mur ×3,0 |
| Sigillaire | Trait incandescent, Cercle de givre, Trait fulgurant, Trait de gel, Sceau d’arrêt | 46,8 s | 39,3 s (+14 %) · 70 % · mur ×3,0 | 61,3 s (+7 %) · 41 % · mur ×2,0 | 39,8 s (+7 %) · 64 % · mur ×2,5 | 46,3 s (+13 %) · 55 % · mur ×3,0 | 46,3 s (+13 %) · 68 % · mur ×3,0 | 42,0 s (+12 %) · 78 % · mur ×3,0 |
| Glyphiste | Trait incandescent, Trait fulgurant, Trait de gel, Sceau de résonance, Ligne de partage | 46,3 s | 38,5 s (+12 %) · 77 % · mur ×3,0 | 60,6 s (+6 %) · 66 % · mur ×2,0 | 41,0 s (+10 %) · 69 % · mur ×2,5 | 45,8 s (+12 %) · 71 % · mur ×3,0 | 45,4 s (+11 %) · 88 % · mur ×3,0 | 41,0 s (+9 %) · 94 % · mur ×3,0 |

Sorts de voie dans le plan le plus rapide en moyenne :

- Trempe-Rouge : Deuxième frappe, Reprise au rouge
- Enclumier : **aucun**
- Rémouleur : **aucun**
- Tue-Bête : Tir à la couture, Morsure croisée
- Piégeur : Dents de fer
- Meneur de meute : Garde de meute
- Fulgurant : Trait des éclats, Rature ardente
- Sigillaire : Sceau d’arrêt
- Glyphiste : Sceau de résonance

