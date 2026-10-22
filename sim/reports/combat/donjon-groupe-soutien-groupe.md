# Essai de donjon en groupe

> Généré par `pnpm --filter @bramo/sim sim combat-dungeon-party`. Ne pas modifier à la main.

Fonderie prototype (pack → duel → charge → pack → ward → recovery), plans conseillés au répertoire 80, 12 graines. Ennemis à l'échelle du groupe : PV × N, cadence des attaques × N, coups répartis entre les membres. PV gardés par membre ; un membre tombé revient à 50 % après une salle gagnée ; les soutiens visent l'allié le plus bas. Cellule : parcours réussis (chutes de membres par parcours).

## Repos 20 % · rien

| Composition | ×1 | ×1,25 | ×1,5 | ×2 | Aide aux alliés / dégâts reçus (×1) | Durée médiane d'un parcours réussi (×1) |
|---|---|---|---|---|---|---|
| Trempe-Rouge seul | 0 % (1,0) | 0 % (1,0) | 0 % (1,0) | 0 % (1,0) | — | — |
| 4 dégâts | 100 % (2,5) | 0 % (4,8) | 0 % (5,0) | 0 % (4,3) | 1 % | 5,7 min |
| 3 dégâts + contrôle | 100 % (0,0) | 0 % (4,0) | 0 % (5,0) | 0 % (4,0) | 7 % | 5,7 min |
| 2 dégâts + 2 contrôles | 100 % (0,0) | 67 % (4,3) | 0 % (4,0) | 0 % (4,0) | 10 % | 5,8 min |
| 2 dégâts + soutien + contrôle | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,1) | 52 % | 6,1 min |
| 2 dégâts + 2 soutiens | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,4) | 81 % | 6,8 min |
| 2 soutiens + 2 contrôles | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 95 % | 7,3 min |
| 4 soutiens | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 136 % | 9,1 min |

## Repos 20 % · 3 potions + repas

| Composition | ×1 | ×1,25 | ×1,5 | ×2 | Aide aux alliés / dégâts reçus (×1) | Durée médiane d'un parcours réussi (×1) |
|---|---|---|---|---|---|---|
| Trempe-Rouge seul | 0 % (1,0) | 0 % (1,0) | 0 % (1,0) | 0 % (1,0) | — | — |
| 4 dégâts | 100 % (0,0) | 17 % (4,3) | 0 % (4,8) | 0 % (4,0) | 1 % | 5,6 min |
| 3 dégâts + contrôle | 100 % (0,0) | 100 % (0,1) | 0 % (4,0) | 0 % (6,4) | 7 % | 5,7 min |
| 2 dégâts + 2 contrôles | 100 % (0,0) | 100 % (0,0) | 25 % (4,4) | 0 % (4,6) | 10 % | 5,8 min |
| 2 dégâts + soutien + contrôle | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 52 % | 6,1 min |
| 2 dégâts + 2 soutiens | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 81 % | 6,8 min |
| 2 soutiens + 2 contrôles | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 67 % (1,8) | 95 % | 7,3 min |
| 4 soutiens | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 136 % | 9,1 min |

## Repos 30 % · rien

| Composition | ×1 | ×1,25 | ×1,5 | ×2 | Aide aux alliés / dégâts reçus (×1) | Durée médiane d'un parcours réussi (×1) |
|---|---|---|---|---|---|---|
| Trempe-Rouge seul | 75 % (0,3) | 0 % (1,0) | 0 % (1,0) | 0 % (1,0) | — | 5,6 min |
| 4 dégâts | 100 % (0,0) | 17 % (3,8) | 0 % (5,0) | 0 % (4,3) | 1 % | 5,6 min |
| 3 dégâts + contrôle | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 0 % (4,0) | 7 % | 5,7 min |
| 2 dégâts + 2 contrôles | 100 % (0,0) | 100 % (0,0) | 67 % (2,3) | 0 % (4,1) | 10 % | 5,8 min |
| 2 dégâts + soutien + contrôle | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 51 % | 6,1 min |
| 2 dégâts + 2 soutiens | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 76 % | 6,8 min |
| 2 soutiens + 2 contrôles | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 95 % | 7,3 min |
| 4 soutiens | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 136 % | 9,1 min |

## Repos 30 % · 3 potions + repas

| Composition | ×1 | ×1,25 | ×1,5 | ×2 | Aide aux alliés / dégâts reçus (×1) | Durée médiane d'un parcours réussi (×1) |
|---|---|---|---|---|---|---|
| Trempe-Rouge seul | 100 % (0,0) | 0 % (1,0) | 0 % (1,0) | 0 % (1,0) | — | 5,6 min |
| 4 dégâts | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 0 % (4,0) | 1 % | 5,6 min |
| 3 dégâts + contrôle | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (5,0) | 7 % | 5,7 min |
| 2 dégâts + 2 contrôles | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 10 % | 5,8 min |
| 2 dégâts + soutien + contrôle | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 51 % | 6,1 min |
| 2 dégâts + 2 soutiens | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 0 % (4,0) | 76 % | 6,8 min |
| 2 soutiens + 2 contrôles | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 95 % | 7,3 min |
| 4 soutiens | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 100 % (0,0) | 136 % | 9,1 min |

## Aide apportée aux alliés, par voie (danger ×1, repos 30 %, 3 potions + repas)

Soins utiles, dégâts absorbés par ses boucliers et dégâts évités par ses affaiblissements, **sur les alliés seulement**, en moyenne par parcours (6 salles). À comparer aux 2 800 PV d’un membre.

| Composition | Aide par voie | Dégâts reçus par l’équipe |
|---|---|---|
| 4 dégâts | Trempe-Rouge 191 · Tue-Bête 0 · Fulgurant 0 | 22493 |
| 3 dégâts + contrôle | Trempe-Rouge 0 · Tue-Bête 0 · Fulgurant 144 · Sigillaire 1135 | 19017 |
| 2 dégâts + 2 contrôles | Trempe-Rouge 84 · Fulgurant 22 · Sigillaire 964 · Enclumier 781 | 18292 |
| 2 dégâts + soutien + contrôle | Trempe-Rouge 20 · Fulgurant 170 · Glyphiste 6731 · Sigillaire 1220 | 15931 |
| 2 dégâts + 2 soutiens | Trempe-Rouge 3 · Fulgurant 14 · Glyphiste 7298 · Rémouleur 6806 | 18608 |
| 2 soutiens + 2 contrôles | Glyphiste 6713 · Rémouleur 5696 · Sigillaire 1522 · Enclumier 779 | 15510 |
| 4 soutiens | Glyphiste 15024 · Rémouleur 8829 · Meneur de meute 4953 | 21115 |

