# Le joueur bloqué : comment il s'en sort

> **Statut** : mesures et propositions du 24 octobre 2026 (soir), à la demande de Louis : « quelqu'un qui perd 100 % de ses
> fights, ça va arriver. Ce qui est le plus important, c'est voir comment il peut se sortir de cette situation. Meilleur build ?
> Farm de l'équipement ? Tout importe, mais il faut que le jeu soit intéressant et pas un waiting simulator. Comment est-ce qu'un
> joueur bloqué progresse avec le temps pour se débloquer ? » **Rien n'est codé ni adopté.** Mesures :
> `sim/src/tempo/levers.ts` (rapport `sim/reports/combat/tempo/leviers.md`), sur la proposition [`build-v3.md`](build-v3.md)
> au rythme vif avec la limite serrée (20 s en zone, 35 s contre un gardien).

## 1. Ce qui débloque, mesuré

Au mur des six gardiens et des deux zones les plus dures, pour les neuf voies, on part d'un joueur **moyen** (un build tiré au
hasard, le médian de sept) et on mesure ce que chaque levier lui fait gagner, en **paliers d'avance** (un palier = un palier
d'équipement de plus, ou environ dix niveaux de classe).

| Levier | Gain médian | Vaut au moins un palier | Ce qu'il faut faire |
|---|---|---|---|
| **Changer de build** (le bon archétype pour ce mur) | **1,2** | 65 % des cas | comprendre le mur, réunir les bonnes gemmes et ensembles |
| Ensemble 4 pièces de la mécanique | 0,7 | 18 % | quatre pièces d'un ensemble de situation |
| Équipement Épique au lieu de Rare | 0,5 | 13 % | butin, atelier, vitrine |
| Gemme de situation | 0,4 | 7 % | 12 vestiges + Joaillerie, ou le marché |
| Préparation (une heure) | 0,4 | 4 % | une fourniture de combat (artisans, marché) |
| Un rang d'Affineur (+3 %) | 0,2 | rarement | de l'or et de la poussière |
| Régler ses minuteurs | 0,0 | jamais au mur | (aide à aller vite, pas à passer un mur) |
| **Tout à la fois** | **2,5** | **99 %** | |

Selon le mur, la réponse change : contre le Notaire et la Mère Grise, l'ensemble de la mécanique vaut presque autant que le build
(1,1 à 1,5 palier) ; contre le Contremaître et le Régent, il ne sert presque à rien et tout se joue sur le build (1,1 à 1,4) ; au
Gué des plaies, c'est la préparation et l'ensemble (érosion).

## 2. Le temps : attendre ne suffit pas, et c'est voulu

| Ce qu'on attend | Temps de combat |
|---|---|
| 10 niveaux de classe à partir du 20 (≈ 1 palier) | 16 h |
| 10 niveaux de classe à partir du 40 | 92 h |
| 10 niveaux de classe à partir du 60 | 516 h |
| Une pièce Épique ou mieux (un emplacement au hasard) | 33 h |
| Une pièce d'ensemble (un des ensembles de la zone, un emplacement au hasard) | 25 h |
| Les 12 vestiges d'une gemme de situation | 5 h |
| Un objet nommé (garantie) | 100 h sur la même rencontre |

La route tourne environ 16 à 24 h par jour pour qui passe deux fois par jour : ces heures sont presque des heures réelles.

- **Avant le niveau 30, attendre marche** : 10 niveaux en moins d'une journée. Un débutant bloqué se débloque tout seul, c'est
  bien : il n'a pas encore les outils.
- **Après le niveau 40, attendre ne marche plus** : un palier de niveaux, c'est 4 jours, puis 3 semaines. Le joueur bloqué
  **doit agir**. Ce n'est pas un waiting simulator.
- **Agir est rapide quand on sait quoi faire** : une gemme de situation en quelques heures, un changement de build en une soirée
  si on a les pièces, et le marché pour ce qu'on n'a pas. Le joueur qui cumule gagne 2,5 paliers, soit l'équivalent de semaines
  d'attente.

## 3. Le vrai problème : savoir quoi faire, et réunir les pièces

Deux choses manquent aujourd'hui.

1. **Le joueur ne sait pas pourquoi il bloque.** Il voit « Défaite » trois fois et la route qui recule. Rien ne lui dit que c'est
   l'érosion qui le tue, ni qu'un autre archétype passerait.
2. **Le bon build demande des pièces qu'il n'a pas** : une pièce d'ensemble précise ne tombe qu'au hasard, parmi plusieurs
   ensembles et onze emplacements (compter des semaines pour un 4 pièces précis en farmant seul) ; une gemme de talent se taille
   (Joaillerie 15 à 25, 15 à 30 vestiges et de la poussière) ou s'achète.

Le second est voulu (« personne ne fait tout seul » : le marché, la vitrine, les commandes, le clan). Le premier ne l'est pas.

## 4. Ce que je propose

### 4.1 Le conseiller du mur (le plus important)

Quand la route recule trois fois sur la même étape, une carte apparaît sur l'accueil : **« Bloqué devant le Notaire des
marées »**, avec :

- **Ce qui vous tue**, en une phrase (« l'érosion : 41 % des dégâts reçus »), tirée du détail du combat ([`rythme.md`](rythme.md) §4).
- **Ce qui y répond**, classé par ce que ça rapporte **pour vous** (le serveur joue le combat avec et sans, comme le mannequin) :
  « un build Endurance : +1,4 palier », « l'ensemble Ciré du Gué : +1,1 », « la Perle de lessive : +0,6 », « un Rinçage clair :
  +0,5 ».
- **Où l'obtenir**, comme pour les recettes : la Joaillerie (avec le lien vers la recette), le marché (avec le prix du jour), la
  zone où tombent les pièces, un artisan qui accepte les commandes.

C'est la même idée que « Où l'obtenir » pour les ingrédients (déjà fait), appliquée au combat. Un joueur bloqué a toujours trois
ou quatre choses concrètes à faire, jamais « attendez ».

### 4.2 Le butin ciblé (à la *Division 2*)

Sur la route comme en patrouille, le joueur peut choisir **ce qu'il chasse** dans une zone : un ensemble, ou un emplacement.
Le butin de la zone penche vers ce choix (par exemple : la moitié des pièces d'ensemble de la zone sont de l'ensemble choisi),
sans en tomber plus. Être bloqué devient un objectif : « je farme les Vergers pour mon Ciré du Gué ».

### 4.3 Une garantie pour les pièces d'ensemble

Comme pour les objets nommés (une garantie à 100 h) : après N heures de chasse ciblée sans pièce de l'ensemble choisi, la
suivante est garantie. Un joueur déterminé sait qu'il aura son 4 pièces en quelques jours, même sans le marché. Chiffres à régler
au simulateur.

### 4.4 Le mannequin et la Puissance de combat

Le mannequin (« Tester ce build » contre la rencontre où l'on bloque) et la Puissance de combat (un seul nombre, calculé par un
vrai combat) : le joueur compare deux builds avant de dépenser son or ([`build-v3.md`](build-v3.md) §6).

### 4.5 Ce qui ne doit pas exister

- **Pas de bonus « à force de perdre »** (un buff qui monte à chaque défaite) : ce serait exactement le waiting simulator, on
  passerait le mur en attendant.
- **Pas d'achat de puissance** (principe 4) : on peut acheter à d'autres joueurs, jamais au jeu.

## 5. À vérifier ensuite

- **Le temps réel passé bloqué**, par façon de jouer, avec la simulation de serveur (`sim/src/server/`) une fois la v3 branchée
  dedans : combien de jours un casu, un tryhard, un artisan restent devant chaque mur, et quel levier ils utilisent. Cible
  proposée : quelques jours pour celui qui agit, jamais des semaines sans rien à faire.
- **Le prix des leviers au marché** (gemmes, pièces d'ensemble, préparations) dans la simulation d'économie.

## 6. À trancher par Louis

1. **Le conseiller du mur** : oui ?
2. **Le butin ciblé** (choisir l'ensemble ou l'emplacement qu'on chasse dans une zone) et sa **garantie** : oui ?
