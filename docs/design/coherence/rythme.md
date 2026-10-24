# Le rythme du combat : plus vif, plus gros, plus lisible

> **Statut** : essais du 24 octobre 2026 (soir), à la demande de Louis : « améliorer le système de classes, builds, voies…
> avec un peu plus d'impact : des chiffres plus gros, des combats un peu plus vifs, des builds vitesse d'attaque ? Tout en
> conservant les aspects très synergiques de nos gemmes, des sets. Rien ne doit être complètement inutile. Se rapprocher d'un
> MMO réel, mixé avec des looters comme The Division où les builds sont à l'infini et dépendent de la recherche du joueur.
> Améliorer au max la compréhension. Je trouve les combats un peu longs, ce qui réduit l'utilité des timers sur ses sorts.
> Essaie de voir si des solutions sont possibles, et teste-les. »
>
> **Adopté dans le jeu le 24 octobre au soir** ([`build-v3.md`](build-v3.md) §8) : le rythme vif, les recharges et délais des talents
> × 0,7, le repos à 2 s, une potion par rencontre, le plafond de Cadence à 50 %, une limite de temps propre à chaque rencontre.
> **Pas adoptés** : les chiffres × 10 (la Force du moteur de Puissance donne déjà les gros chiffres ; le × 10 toucherait la Marée,
> l'or des dégâts affichés et tous les textes), `gcdHaste` (trop fort), le report des réserves d'une rencontre à l'autre (gain
> faible pour une règle de plus). Les essais se font avec `sim/src/rythme.ts` (variantes par variables
> d'environnement, voir son en-tête). Trois petits ajouts au moteur, **inactifs par défaut** (les 201 tests passent, les
> combats existants sont identiques) : `rules.gcdHaste` (la Cadence raccourcit aussi le délai entre deux sorts), l'action de
> talent `cooldownCut` (raccourcir la recharge des sorts), `CombatantSetup.startPools` et `CombatantResult.pools` (réserves
> au début et à la fin d'une rencontre).

## 1. Ce qu'on mesure aujourd'hui

Banc : les trois classes, la 5ᵉ étape et le gardien de chacun des 12 chapitres de la route (24 rencontres), le personnage au
niveau du palier de l'étape avec **un équipement Rare complet de son niveau** (la référence de l'équilibrage), le plan
conseillé, 6 combats par cas.

| | Aujourd'hui |
|---|---|
| Durée d'un combat | **65 s** (zones 66 s, gardiens 63 s) ; de 42 s à 171 s |
| Sorts lancés par combat | 33 (chaque sort part **6 à 9 fois**) |
| Coup moyen / plus gros coup | **121** / 1 051 (Forgefeu), 602 (Traqueur), 542 (Runiste) |
| Victoires | 98 % (zones 99 %, gardiens 96 %) |
| PV au plus bas | zones 40 %, gardiens 22 % |
| Part des dégâts | sorts ~60 %, attaques de base ~35 %, afflictions ~4 % |

Louis a raison : quand chaque sort part huit fois, l'ouverture (« sort 1 tout de suite, sort 2 après 3 s… ») ne pèse
presque rien sur le résultat. Et des coups à 121 font petit.

## 2. Ce qui a été essayé, et ce qui marche

### 2.1 Des chiffres dix fois plus gros : oui, sans risque

Tout × 10 (Puissance, PV, dégâts et soins ennemis) : **exactement le même combat** (mêmes durées, mêmes victoires au
centième), avec des coups moyens de **1 207** et des pointes à **10 507**. C'est ce qui a été fait pour l'or (« un joueur qui
voit 5 000 est plus content que 50 »). Les coefficients des sorts et des talents (en × Puissance) ne changent pas.

### 2.2 Des combats vifs à danger égal : oui

Le réglage retenu (« rythme-v1 », à écrire en proposition) :

| Levier | Valeur | Pourquoi |
|---|---|---|
| PV ennemis des zones | ÷ 2,5 | des zones en ~20 s |
| PV des gardiens | ÷ 1,5 | les gardiens restent un vrai combat (~33 s) |
| Dégâts ennemis | × le même facteur, × 1,5 de plus en zone, × 1,3 sur les gardiens | sans ce supplément, le danger s'effondre (l'érosion, les charges et la fureur n'ont plus le temps de monter) |
| Cadence des attaques ennemies | **× 2, deux fois moins fort** | sinon un coup lourd emporte les deux tiers des PV d'un coup : on perd « au hasard » (91 % de victoires au lieu de 99 % à danger moyen égal) |
| Mécaniques ennemies (fenêtres, charges, gardes, érosion, renforts) | 1,5 fois plus fréquentes | on les voit encore plusieurs fois par combat |
| Recharge des sorts | × 0,7 | plus de sorts par seconde |
| Délais internes des talents et seuils « compétence de N s ou plus » | × 0,7 | sinon les gemmes qui les demandent ne se déclenchent plus |

Résultat : **zones en 20 s, gardiens en 33 s** (contre 66 et 63), 14 sorts par combat en zone et 24 contre un gardien (chaque
sort part **2 à 4 fois** : l'ouverture et l'ordre redeviennent une vraie partie du combat), **97 % de victoires en zone et
41 % de PV au plus bas** (contre 99 % et 40 % aujourd'hui), gardiens à ~95 %. Les trois classes restent au coude à coude
(92 à 94 % de victoires sur l'ensemble).

**Coût pour le serveur : aucun.** Le moteur coûte environ 70 ms de calcul par heure de route simulée, combats longs ou
courts : il y a 2,5 fois plus de rencontres, chacune 2,5 fois plus courte.

### 2.3 Les synergies survivent : oui, à deux réglages près

Trois gemmes de la même réserve (une qui remplit, une qui dépense, une qui amplifie) serties sur le set de référence :

| Réserve | Gain de vitesse aujourd'hui | Gain en combat vif | Dépenses par combat (aujourd'hui → vif) |
|---|---|---|---|
| Tisons | −15 % | −15 % | 40 → 21 |
| Entailles | −11 % | −12 % | 20 → 13 |
| Rancœur | −8 % | −8 % | 24 → 14 |
| Frimas | −8 % | −8 % | 8 → 3 |
| Mesure | −8 % | −4 % | 8 → 3 |
| Échos | −6 % | −4 % | 20 → 12 |
| Trophées | −6 % | −4 % (−15 % avec le report) | 2,4 → 1,6 (2,4) |
| Ferveur | −5 % | 0 % | 8 → 3 (4) |

Les réserves se dépensent **au même rythme par seconde** qu'avant, donc moins de fois par combat. Celles qui se construisent sur
la durée y perdent : la Mesure, la Ferveur, les Trophées. Deux réponses testées ou à tester :

- **Le report** (testé) : sur la route, **la moitié des réserves passe à la rencontre suivante** (on enchaîne les groupes comme
  dans un MMO). Les Trophées (une charge par ennemi vaincu) en profitent le plus (−15 %), la Ferveur dépense 46 % de plus. Il
  ne change rien aux autres. À garder seulement pour la route et les patrouilles (pas les gardiens, la Marée, la Lice).
- **Recaler les seuils** de la Mesure (« 5 au moins », « compétence de 16 s ou plus ») et de la Ferveur : à faire dans la
  proposition, avec le banc complet.

### 2.4 Des builds de vitesse : oui, avec deux changements

> **Mis à jour le même soir** ([`build-v3.md`](build-v3.md)) : au banc complet des builds, le plafond relevé **et** `gcdHaste` ensemble rendaient la Cadence trop forte (en tête des trois voies du Forgefeu) ; la v3 garde le plafond à 50 % et écarte `gcdHaste`.

À budget égal (la Cadence prise sur la Puissance, mêmes dégâts par seconde sur le papier) :

| Build | Aujourd'hui | Avec la Cadence sur le délai entre sorts | + gemme « chaque attaque de base raccourcit les recharges de 0,4 s » |
|---|---|---|---|
| Puissance (Cadence 12 %) | 26 s | 26 s | 24 s |
| Cadence 50 % | 29 s | 27 s | **24 s** |
| Cadence 80 % | 31 s | 28 s | 25 s |

- Aujourd'hui, la Cadence est un piège : les sorts butent sur le délai fixe d'une seconde entre deux compétences, et la Cadence
  est plafonnée à 23 %. **Proposé** : la Cadence raccourcit aussi ce délai (`gcdHaste`, comme la hâte d'un MMO) et son
  plafond monte à 50 %.
- Une Cadence haute fait **plus d'actions** : plus de déclenchements (procs 15 → 27 par combat), donc elle se marie avec les
  réserves d'actions (Mesure, Entailles, Tisons : +50 % de dépenses de Tisons à 50 % de Cadence). C'est l'archétype « vitesse »
  qu'on cherchait, à la *Division* : il ne vaut pas plus que la Puissance tout seul, il vaut plus **avec les bonnes gemmes**.
- **Proposé** : un petit groupe de gemmes et une ligne de Cadence plus forte autour de ça (« La Trotteuse » : chaque attaque de
  base raccourcit les recharges ; un ensemble « Cadence » à 4 pièces ; les Dagues, arme la plus rapide, comme porte d'entrée).
  Contrepartie mesurée : moins de Puissance, c'est aussi des boucliers et des soins plus faibles (93 % de victoires à 80 % de
  Cadence, sans gemme).

### 2.5 L'ouverture : à renforcer par le contenu

Ouverture conseillée contre ouverture inversée (mêmes minuteurs, sorts dans l'ordre inverse) : aujourd'hui, aucune différence de
durée ; en combat vif, −3 points de victoires et −5 points de PV au plus bas en zone. Les combats courts aident, mais l'ordre
compte peu parce que **peu de sorts préparent le suivant**. À ajouter dans les kits (proposé) : des enchaînements explicites
(« Lecture de piste » marque, « Trait de poursuite » frappe plus fort une cible marquée ; une Chauffe qui donne des Braises à
dépenser dans la Trempe suivante), affichés dans la Préparation (« ce sort prépare : … »).

## 3. Ce qu'il faudrait changer ailleurs

- **Le repos entre deux rencontres** (5 s) : sur des combats de 20 s, il ferait perdre 20 % du temps de combat crédité (7 %
  aujourd'hui). À descendre à 2 s.
- **Les potions** (2 par rencontre au plus) : 2,5 fois plus de rencontres par heure, donc jusqu'à 2,5 fois plus de potions bues.
  Passer à « 2 par tranche de 60 s de combat » pour garder la même consommation (l'économie des alchimistes ne bouge pas).
- **Le butin et l'XP** se comptent déjà au temps de combat (unités de 6 min) : inchangés.
- **La limite de temps** (240 s) : 120 s suffisent.
- **La Marée** se joue au score sur un temps fixe : elle n'a pas besoin du rythme ; on y applique seulement le ×10 des chiffres.
- **Tout le banc à rejouer** avant d'adopter (`combat-build --step catalogue|base|builds|buildwalls|situation`, les murs de la
  route `wall.ts`, la simulation de serveur sur 60 jours) : ces essais n'ont pas joué les voies (niveau 30 et plus), ni les
  ensembles et les objets nommés.

## 4. Comprendre ce qui se passe

Ce qui existe déjà (24 octobre) : les huit jauges en combat avec leur bulle, les pastilles des mécaniques en direct, les icônes
d'état, la barre de sorts avec les recharges, les nombres de dégâts, la fiche du build (places de talent, ensembles, réserves,
« sans effet pour l'instant »), l'effet réel de chaque statistique d'une pièce. Ce qui manque, c'est **le « pourquoi »** :
pourquoi j'ai gagné vite, pourquoi j'ai perdu, qu'est-ce que mon talent a vraiment fait.

Six ajouts, du plus utile au moins urgent :

1. **Le détail du combat** (le « compteur » des MMO, comme Details! dans World of Warcraft) : à la fin de chaque rencontre,
   et dans « Dernier combat », des barres : dégâts par source (attaque de base, chaque sort, les afflictions, **chaque
   talent, gemme, ensemble et objet nommé par son nom**), dégâts par seconde, soins et boucliers, et de l'autre côté ce que
   l'ennemi a fait (coups, charges, aura, érosion). Le moteur compte déjà presque tout (`metrics` : `damage:<origine>`,
   `talent:<clé>`, `spent:<réserve>`) ; il manque le compte par sort et par talent nommé.
2. **Les talents qui s'allument** : quand une gemme ou un ensemble agit, sa petite icône apparaît au-dessus du personnage
   avec son nombre (« Feu aux poudres · 1 240 »), comme les talents de *The Division 2*. On **voit** son build travailler.
3. **La défaite expliquée** : une phrase, pas un journal. « Tombé à 46 s : la charge de la Vigie (7 600) a pris 41 % de
   vos PV. Ce qui y répond : l'Hématite d'arrêt (gemme), l'ensemble Enclume patiente, plus de Vitalité. » Les réponses
   viennent de `encounterMechanics`, qui les connaît déjà.
4. **Le mannequin** (le banc d'essai des MMO) : dans l'onglet Build, « Tester ce build » joue 30 s contre un mannequin et
   contre la rencontre en cours, et donne les dégâts par seconde, le temps de victoire et la part de chaque source. Changer une
   gemme, relancer, comparer : c'est la boucle de recherche du looter (« les builds dépendent de la recherche du joueur »).
   Un combat coûte environ 1 ms au serveur : c'est gratuit.
5. **La pièce comparée en vrai** : dans la fiche d'une pièce, « sur la rencontre en cours : −8 % de temps de victoire » (le
   serveur joue le combat avec et sans elle), en plus de l'effet de chaque statistique.
6. **La carte de l'ennemi** : ses PV, son coup ordinaire en part de vos PV (« un coup = 6 % de vos PV »), sa mécanique la plus
   dangereuse pour **votre** build (celle qui a fait le plus de dégâts dans vos derniers combats).

Règle d'écriture, la même partout (Louis : « trop d'infos ») : **un chiffre et une phrase** à l'écran, le détail dans la
bulle.

## 5. Ordre proposé

1. Louis tranche les questions du §6.
2. **Proposition `sim/proposals/rythme-v1/`** : les chiffres ×10 et le rythme vif écrits dans les données (rencontres, sorts,
   talents, règles), le repos, les potions, la limite ; le banc complet rejoué ; les seuils de la Mesure et de la Ferveur
   recalés.
3. **Compréhension** : le détail du combat et la défaite expliquée d'abord (ils servent tout de suite, même sans le rythme), puis
   le mannequin.
4. Les builds de Cadence (`gcdHaste`, plafond, gemmes, ensemble) et le report des réserves sur la route.
5. Les enchaînements dans les kits (ouverture).

## 6. À trancher par Louis

1. **Chiffres × 10** (coups à 1 200, gros coups à 10 000) : oui ?
2. **Combats vifs** : zones vers 20 s et gardiens vers 33 s, ou un entre-deux (zones 30 s, gardiens 45 s) ?
3. **Des réserves qui passent d'une rencontre à l'autre** sur la route (la moitié) : d'accord pour cette règle de plus ?
4. **L'archétype Cadence** (la Cadence raccourcit le délai entre deux sorts, plafond à 50 %, gemmes de vitesse) : on y va ?
