# Niveau de classe requis par étape (audit, phase 3)

Commande : `pnpm --filter @bramo/sim exec tsx src/tempo/needed.ts` (commit `990d15b`, données `data/`). Plus petit niveau de
classe où la classe gagne au moins 8 combats sur 10 (graines 1 à 10).

**Ce que l'outil suppose** (lu dans `sim/src/tempo/needed.ts`) : le set de départ, ramené au plancher (75 % d'un Rare de son
niveau à partir du niveau 40) ; le plan conseillé ; aucune gemme, aucun ensemble, aucun système de Puissance (seuls les
points forts de classe, actifs d'office). **Et aucune voie** : le personnage de l'outil n'en choisit jamais, il joue sans
passif de voie ni sort de voie au-delà du niveau 30, ce qu'aucun vrai joueur ne fait. C'est donc le pire cas d'un joueur qui
ne touche à rien, pas un joueur réel.

| Étape | Palier | Rencontre | Forgefeu | Traqueur | Runiste |
|---|---|---|---|---|---|
| 1-1 | 1 | La Chaussée des lanternes | 1 | 1 | 1 |
| 1-5 | 4 | La Chaussée des lanternes | 1 | 1 | 1 |
| 1-9 | 7 | La Chaussée des lanternes | 1 | 1 | 1 |
| 1-10 | 8 | Mère Grise, la Lavandière | 10 | 5 | 10 |
| 2-5 | 11 | Les Fossés gris | 10 | 10 | 10 |
| 2-10 | 15 | Mère Grise, la Lavandière | 15 | 10 | 10 |
| 3-10 | 23 | Le Contremaître rouge | 44 | 36 | 31 |
| 4-10 | 30 | Le Contremaître rouge | 50 | 47 | 45 |
| 5-10 | 38 | La Matriarche de résine | 56 | 30 | 51 |
| 6-10 | 45 | La Matriarche de résine | 63 | 43 | 58 |
| 7-10 | 53 | Le Notaire des marées | 70 | 33 | 66 |
| 8-10 | 60 | Le Notaire des marées | 77 | 64 | 73 |
| 9-10 | 68 | Le Gardien des trois portes | 88 | 76 | 74 |
| 10-10 | 75 | Le Gardien des trois portes | 95 | 82 | 87 |
| 11-10 | 83 | Le Régent des courants | 99 | 96 | 94 |
| 12-10 | 90 | Le Régent des courants | plus de 99 | plus de 99 | plus de 99 |

Lecture : sans réponse aux mécaniques, le Traqueur passe les gardiens à fenêtres (Notaire, Matriarche) 20 à 37 niveaux avant
les deux autres classes (son « affût » perce les fenêtres fermées, et il a +8 % de Puissance sur la route). D'après
`verifier.md` §8, 37 niveaux autour du niveau 50 à 70, c'est environ deux mois de route. À confirmer en phase 4 avec des
joueurs réels (voie choisie, butin, gemmes, Puissance) : la simulation de serveur, elle, montre des classes beaucoup plus
proches (route médiane 159 à 177 au 89e jour dans la version d'avant le recalage).
