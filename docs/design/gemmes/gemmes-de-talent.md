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

**Taillées en Joaillerie** (onglet « Talents »), en trois paliers selon leur rôle (chiffres après l'équilibrage du §
« Mesuré au simulateur ») :

| Rôle | Niveau de Joaillerie | Temps | Ingrédients | Valeur |
|---|---|---|---|---|
| **Remplir** une réserve (9 gemmes) | 15 | 1 min | 4 perles de verre, 2 poussière de rune, **15 vestiges**, **4 poussière de Lointain** | 220 à 280 |
| **Amplifier, relier**, ou utilitaire (14) | 25 | 2 min | 2 lingots d'argent, 3 poussière de rune, **20 vestiges**, **8 poussière de Lointain** | 360 à 440 |
| **Dépenser** une réserve, la récompense (11) | 25 | 3 min | 4 lingots d'argent, 6 perles de verre, **30 vestiges**, **12 poussière de Lointain** | 560 à 680 |

**Le vestige dit la région de la réserve**, toujours parmi les quatre premières régions (atteintes vers le 20e jour) :

| Réserve | Vestige | Région |
|---|---|---|
| Frimas (et les utilitaires) | Galets du puits | Les Abords du bourg |
| Tisons, Mesure, Rancœur | Scorie de mémoire | Les Forges éteintes |
| Ferveur, Trophées | Ambre de veille | La Lisière des veilleurs |
| Échos, Entailles | Encre fossile | Les Archives englouties |

**La poussière de Lointain** vient du démontage chez l'Affineur : le butin qu'on ne garde pas nourrit les gemmes.

**Trouvées en combat** : 0,1 % par unité de butin (6 minutes de combat), une gemme de la région de la rencontre (son
vestige), de n'importe quel rôle. Environ **une tous les 4 jours de combat**. Elle ressort au journal (« Gemme de
talent ») et en tête du résumé d'absence.

**Achetées** : ce sont des objets comme les autres, ils se vendent au marché. Un joueur qui ne monte pas la Joaillerie les
achète à un joaillier.

## Mesuré au simulateur (24 octobre)

Louis : « fais en sorte de tester tout ça pour un bon équilibrage ». Le simulateur de serveur (120 joueurs, 60 et 90 jours,
même graine) a appris à : **démonter** ce qu'on ne porte pas ; **choisir une réserve** (celle que remplissent ses objets
nommés et ensembles, sinon celle de sa classe) ; réunir **une paire** (de quoi remplir, de quoi dépenser) avant de sertir,
puis un amplificateur ; **tailler** soi-même avec la Joaillerie, sinon acheter (jusqu'au tiers de son or) ou laisser une
demande ; et pour les joailliers, **répondre aux demandes** du marché. Une paire n'est gardée que si le combat contre son mur
s'en trouve vraiment meilleur.

| Réglage | Paire réunie (premier quart / médiane) | Joueurs qui l'ont en 60 j | Prix des gemmes qui dépensent |
|---|---|---|---|
| Premier jet : dépenser au niveau 40 avec améthyste et noyau runique (Enchantement 35) ; vestiges du Bastion et de la Cicatrice | — / 45e jour (90 j) | 13 sur 34 | 4 à 7 fois la référence |
| Niveaux 15 / 25 / 30, matières de Joaillerie, quatre premières régions | 22e / 41e jour | 21 sur 34 | 4 à 7 fois |
| **Retenu** : dépenser au niveau 25, butin deux fois plus fréquent | **16e / 22e jour** | **32 sur 34** | 1,2 à 4 fois |

**Sur 90 jours** (rapports `sim/reports/serveur/talent-final.md` et `talent-off.md`, sans gemmes de talent) : 33 joueurs sur
34 qui sertissent ont leur paire ; elle accélère le milieu de partie (le tryhard méta atteint l'étape 120 au 26e jour au
lieu du 35e ; route au 30e jour : 140 au lieu de 114) sans changer la fin (étape 152 au lieu de 149 au 89e jour : les murs
de fin restent des murs). L'écart tryhard / casu tranquille au 30e jour passe de 1,15 à 1,32 (principe : jamais plus de 2 à
2,5). Classes, or créé et détruit, Gini : inchangés.

Ce qui freinait n'était pas la poussière (5 par joueur et par jour, elle se vend 8 or) ni les vestiges (peu chers), mais
**le nombre de joailliers** capables de tailler les gemmes qui dépensent. Le reste du rythme dépend du marché, comme voulu :
un joaillier en fait un vrai commerce.

## Où elles agissent

Une gemme de talent se sertit comme une gemme de situation (arme, torse, tête, collier) et prend une des **quatre places de
talent**, comme un objet nommé (les nommés d'abord). Une même gemme n'agit qu'une fois. Elle entre en concurrence avec les
gemmes de situation : réponse à un mur, ou moteur de build, c'est un vrai choix.

## Ce qui reste

- Les bots ne montent qu'une paire autour d'une seule réserve ; un vrai joueur combinera mieux (deux réserves reliées, un
  ensemble qui va avec) : les gemmes vaudront un peu plus chez un joueur qui calcule. À revoir quand de vrais joueurs
  auront essayé.
- Les gemmes qui dépensent restent chères au marché (1,2 à 4 fois leur référence) : c'est le commerce des joailliers, à
  surveiller.
- Le texte des gemmes est celui du catalogue (proposé par Claude, pas encore relu par Louis).

Fichiers : `generer.mjs` (relançable) écrit les objets dans `data/items.yaml` et les recettes dans
`data/recipes/crafting.yaml` ; `rules.loot.talentGem` dans `data/combat/rules.yaml`.
