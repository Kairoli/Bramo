# Les gemmes de talent

**[Décidé par Louis le 24 octobre]** Les 34 gemmes de talent du catalogue (`data/combat/talents.yaml`) deviennent des objets
qu'on taille, qu'on achète et qu'on trouve : « pas trop dur à obtenir, mais pas trop facile non plus ». Les chiffres sont
de Claude (`# à équilibrer`).

## Pourquoi

Les réserves (Tisons, Ferveur…) sont le cœur du build. Mais dans le butin, **une seule pièce dépensait une réserve** (le
Marteau des griefs, la Rancœur). Toutes les autres pièces qui dépensent sont des gemmes de talent, qui n'existaient pas en
jeu : on remplissait ses jauges sans jamais pouvoir les vider. La décision de fond était déjà prise (`../combat-items.md` :
les talents sont portés par des gemmes, taillées en Joaillerie, achetables, trouvables).

## Comment on les obtient

**Taillées en Joaillerie** (onglet « Talents »), en trois paliers selon leur rôle :

| Rôle | Niveau de Joaillerie | Temps | Ingrédients | Valeur |
|---|---|---|---|---|
| **Remplir** une réserve (13 gemmes) | 20 | 1 min | 4 perles de verre, 2 poussière de rune, **15 vestiges**, **4 poussière de Lointain** | 220 à 280 |
| **Amplifier, relier**, ou utilitaire (11) | 30 | 2 min | 2 lingots d'argent, 3 poussière de rune, **25 vestiges**, **8 poussière de Lointain** | 400 à 500 |
| **Dépenser** une réserve, la récompense (10) | 40 | 3 min | 1 améthyste taillée, 1 noyau runique, **35 vestiges**, **15 poussière de Lointain** | 700 à 840 |

**Le vestige dit la région de la réserve** :

| Réserve | Vestige | Région |
|---|---|---|
| Tisons, Mesure | Scorie de mémoire | Les Forges éteintes |
| Frimas (et les utilitaires) | Galets du puits | Les Abords du bourg |
| Ferveur, Trophées | Ambre de veille | La Lisière des veilleurs |
| Échos | Encre fossile | Les Archives englouties |
| Rancœur | Éclat de serment | Le Bastion des longues veilles |
| Entailles | Quartz de faille | La Cicatrice des trois vents |

**La poussière de Lointain** vient du démontage chez l'Affineur : le butin qu'on ne garde pas nourrit les gemmes. C'est aussi
ce qui retient le rythme.

**Trouvées en combat**, rarement : 0,05 % par unité de butin (6 minutes de combat), une gemme de la région de la rencontre
(son vestige). Environ **une tous les 8 jours de combat**. Elle ressort au journal (« Gemme de talent ») et en tête du
résumé d'absence.

**Achetées** : ce sont des objets comme les autres, ils se vendent au marché. Un joueur qui ne monte pas la Joaillerie les
achète à un joaillier.

## Le rythme visé

D'après la simulation de serveur (`../simulation-serveur.md`) : un métier principal atteint le niveau 40 en 5 à 16 jours ;
on gagne environ 40 vestiges par jour de route (et ils sont peu chers au marché) ; le démontage rapporte de l'ordre de 5 à 7
poussières de Lointain par jour si l'on démonte ce qu'on ne porte pas.

- **Première gemme qui remplit** : dès le premier ou le deuxième jour de Joaillerie (niveau 20 en un jour pour un artisan).
- **Première gemme qui dépense** : environ une semaine (Joaillerie 40, 15 poussières), plus tôt en l'achetant.
- **Un build complet** (deux gemmes qui remplissent, une qui amplifie, une qui dépense : 31 poussières) : une à deux semaines.

Jamais le premier jour, jamais un mur : la gemme est un objectif de la première ou deuxième semaine, et un vrai commerce
pour les joailliers.

## Où elles agissent

Une gemme de talent se sertit comme une gemme de situation (arme, torse, tête, collier) et prend une des **quatre places de
talent**, comme un objet nommé (les nommés d'abord). Une même gemme n'agit qu'une fois. Elle entre en concurrence avec les
gemmes de situation : réponse à un mur, ou moteur de build, c'est un vrai choix.

## Ce qui reste

- Le simulateur de serveur ne sait pas encore monter un build autour d'une réserve : ses bots ne choisissent que des gemmes
  de situation. Le rythme ci-dessus est un calcul, pas une mesure ; la puissance des gemmes avait été mesurée au banc
  (`../coherence/build.md` §4 : meilleur build +28 à +45 % de vitesse).
- Le texte des gemmes est celui du catalogue (proposé par Claude, pas encore relu par Louis).

Fichiers : `generer.mjs` (relançable) écrit les objets dans `data/items.yaml` et les recettes dans
`data/recipes/crafting.yaml` ; `rules.loot.talentGem` dans `data/combat/rules.yaml`.
