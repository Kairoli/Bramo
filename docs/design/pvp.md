# Le PvP : la Lice

> **Statut** : conçu le 24 octobre 2026 (soir), à la demande de Louis : « planifier le système PvP, un système d'arène,
> etc. ». **Rien n'est codé ni simulé.** Tout ce qui suit est **proposé par Claude**, sauf ce qui est marqué Décidé. Le combat
> de Bramo est automatique : le PvP l'est aussi, c'est **un affrontement de builds**.

## 1. Ce qui est déjà décidé ou écrit

- [Décidé par Louis, 21 octobre] Le triangle mêlée > tir > magie est abandonné pour les monstres, **réservé à un éventuel
  PvP**.
- [Décidé] Le combat est entièrement automatique ; la préparation (build, plan de sorts, préréglages) est le jeu.
- Le dossier du cœur du jeu (`coeur-du-jeu/Bramo-coeur-du-jeu.md` §18) prévoit : des **coefficients propres au PvP**
  (corriger un soin en arène ne doit pas casser un soutien en donjon), une limite de **contrôle dur** propre à chaque joueur
  (une réserve de *Résolution*), des duels puis des combats à trois, et **aucune gemme ni aucun ensemble indispensable au PvE
  qui ne s'obtiendrait qu'en PvP**.
- Les statistiques « mortes » (Ténacité, résistance au ralentissement) n'ont de sens qu'en PvP (`coherence/coherence.md` §5).

## 2. Ce que font les jeux du genre

- **AFK Arena, Hero Wars, Legend of Mushroom** (combat automatique) : une **arène asynchrone**. On affronte la **défense**
  enregistrée d'un autre joueur, qui n'a pas besoin d'être en ligne ; quelques **défis par jour** ; trois adversaires proposés
  autour de son rang ; un classement, des paliers (Bronze → Légende), des récompenses de fin de saison ; une arène **entre
  serveurs** quand un serveur est trop petit.
- **Guild Wars 2, World of Warcraft (modèles de tournoi)** : en PvP classé, les **statistiques sont égalisées** ; seuls les
  choix comptent (talents, sorts, équipement de *build*). C'est ce qui rend le PvP juste pour celui qui joue peu.
- **Dofus (Kolizéum)** : PvP par équipes de clan ou de joueurs, avec sa propre monnaie de cosmétiques.

L'arène asynchrone est faite pour Bramo : le combat est déjà automatique, rejoué à l'écran à partir d'une graine, et un serveur
de quelques dizaines de joueurs (plus les bots, [`bots.md`](bots.md)) suffit à la remplir, puisque l'adversaire n'a pas besoin
d'être là.

## 3. La Lice (duel classé, asynchrone)

**Dans le monde** : la Lice est le champ clos derrière la halle de la guilde. On n'y affronte pas le joueur lui-même mais son
**Reflet** : une copie de son personnage que l'eau de la Marée garde en mémoire (la Marée prend des choses au monde et les rend
de travers ; ici, elle rend des gens). C'est ce qui explique qu'on combatte quelqu'un qui dort, et c'est aussi une **réponse au
dessin** : nos personnages regardent toujours vers la droite et ne sont jamais retournés en miroir ; le Reflet, lui, **est**
un miroir, teinté d'eau (contour bleu-vert, léger tremblé). L'exception à la règle devient un trait du monde. [à valider]

**Comment ça marche** :

1. On choisit sa **défense** parmi ses préréglages (le système existe : classe, voie, sorts, équipement). C'est son Reflet.
2. On a **5 défis par jour** (jamais achetables, ni contre de l'or ni contre de l'argent ; ils ne se cumulent pas au-delà de
   10, pour qu'un absent ne soit pas puni et qu'un tryhard ne joue pas 50 fois).
3. Le jeu propose **trois adversaires** autour de son classement (un plus faible, un égal, un plus fort, avec leur classe,
   leur voie et leurs réponses visibles : on choisit son adversaire en connaissant son build, c'est là que la recherche du
   joueur compte).
4. Le combat se joue tout de suite, **au meilleur de trois manches** (une manche dure 20 à 40 s visées : trois en moins de
   deux minutes). On le regarde sur la même scène que la route, avec la barre de sorts des deux côtés.
5. Victoire : des points de classement (type Elo, plus si l'adversaire était plus fort) ; défaite : on en perd moins qu'on
   n'en gagne contre un égal. **Quand on est attaqué**, on ne perd jamais de points (personne n'est puni de ne pas être là) ;
   le défenseur gagne un petit bonus s'il tient.
6. Un journal « On m'a défié » avec le **replay** et un bouton **Revanche** (gratuit, une fois).

**Paliers** (le rang affiché) : Ferraille, Cuivre, Bronze, Fer, Acier, Argent, Or, puis **Lanterne** (les 10 premiers du
serveur). Chaque saison de dix semaines (alignée sur les saisons numérotées), le classement se tasse vers le milieu sans
repartir de zéro.

## 4. Égaliser ou pas : la décision la plus importante

| | **Lice égalisée** (recommandé pour le classé) | **Lice libre** |
|---|---|---|
| Statistiques | ramenées au même budget pour tous (Puissance, PV, Défense…) ; les **proportions** de son équipement comptent (plus de Cadence, moins de Défense) | celles de l'équipement porté |
| Ce qui compte | classe, voie, sorts, plan, **gemmes de talent, ensembles, objets nommés, lignes de build** | tout, et d'abord le niveau et le butin |
| Pour qui | tout le monde, le casu peut monter Or avec un bon build | ceux qui ont le meilleur équipement |
| Principe 2 (2 à 2,5 fois) | tenu | cassé : celui qui farme le plus gagne toujours |

**Recommandation** : la Lice classée est **égalisée** (on garde la recherche de build à l'infini, à la *The Division 2*, et le
casu reste dans la course) ; une **Lice libre** existe à côté, sans classement ni récompense, pour défier un ami ou un membre du
clan avec son vrai équipement (« amical »).

## 5. Les règles propres au PvP (dans `data/combat/pvp.yaml`)

- **Résolution** : chaque combattant a un budget de contrôle dur (étourdissement) qui se recharge ; au-delà, un contrôle devient
  une petite Pression. Sans elle, un build de contrôle enchaîne l'adversaire du début à la fin.
- **Soins et boucliers** à ×0,7 en PvP (à mesurer), pour que deux soutiens ne fassent pas match nul pendant 4 minutes.
- **Usure de la Lice** : après 30 s de manche, les deux combattants subissent +5 % de dégâts par tranche de 5 s : une manche
  finit toujours.
- **Le triangle** [à trancher par Louis] : le dossier recommande **de ne pas** le remettre (il remplace le choix du build par
  un contre-choix gratuit de classe). Variante douce : ±5 % seulement, affichée.
- Les statistiques « mortes » prennent un sens : la **Ténacité** réduit la durée des contrôles subis, la résistance au
  ralentissement aussi. Elles reviennent dans les lignes, mais seulement pour la Lice.

## 6. Les récompenses (jamais de puissance)

- **Jetons de Lice** à chaque victoire et en fin de semaine selon le palier : ils achètent des **cosmétiques** (une tenue
  « Champion de la Lice » par classe, des ornements, des cadres de photo, des effets de victoire).
- **Titres** de fin de saison (« Lanterne de la Saison 1 », « Or de la Lice »), un **ornement** pour les 10 premiers.
- Une petite part d'**or** par victoire, au plus quelques centaines par jour (de l'or neuf : à mesurer au simulateur
  d'économie ; à défaut, rien).
- Aucune gemme, aucun ensemble, aucun objet nommé réservé à la Lice.

## 7. Plus tard

- **Joutes des clans** (chaque semaine) : chaque clan aligne cinq Reflets, cinq duels l'un après l'autre ; un classement des
  clans qui donne du **Renom** (le système existe).
- **Tournoi de la Lice** (une fois par mois, un soir) : un tableau à élimination de 16 ou 32, joué à heure fixe et regardé
  **en direct** comme la Marée (la scène existe), avec le récapitulatif.
- **Combats à trois** (trois Reflets contre trois) : quand les duels seront justes.
- **Lice entre serveurs** si un jour il y a plusieurs serveurs ([`serveur.md`](serveur.md)).

## 8. Ce qu'il faut construire, dans l'ordre

1. **Moteur** : un combat joueur contre joueur (aujourd'hui une équipe affronte des ennemis décrits par une rencontre ; il faut
   qu'un combattant affronte un autre combattant, avec ses sorts, ses réserves et ses talents des deux côtés), la Résolution,
   l'usure, les coefficients PvP, l'égalisation des statistiques. Tests de conservation (le PvE ne bouge pas).
2. **Simulateur** : la matrice des neuf voies contre les neuf voies, avec les meilleurs builds de chacune ; critère proposé :
   chaque voie gagne entre 40 et 60 % de ses duels contre l'ensemble, et chaque voie a au moins un « mauvais » adversaire et un
   « bon » (sinon il n'y a pas de choix d'adversaire).
3. **Serveur** : le Reflet (la défense enregistrée, figée au moment où on la choisit), le classement, les défis du jour, le
   journal des combats (avec la graine, pour le replay), les jetons.
4. **Client** : une tuile **Lice** dans les modes de la salle Combat (à côté de Profondeurs, Éclaireurs…), la page de la Lice
   (son rang, ses défis, trois adversaires, sa défense), le combat rejoué, le classement.
5. Visuels : le Reflet (contour d'eau sur le personnage retourné), le décor de la Lice (3200 × 640), les icônes de paliers (huit),
   la tenue de Champion.

**Avant tout** : le nouveau rythme du combat ([`coherence/rythme.md`](coherence/rythme.md)) : des manches de 20 à 40 s ne sont
possibles qu'avec des combats plus vifs.

## 9. À trancher par Louis

1. **Lice égalisée** pour le classé (recommandé), ou avec le vrai équipement ?
2. Le **Reflet** (l'adversaire retourné en miroir et teinté d'eau, justifié par la Marée) : d'accord pour cette exception ?
3. Le **triangle** : aucun (recommandé), ±5 %, ou plus ?
4. De l'**or** en récompense de la Lice, ou seulement des jetons et des cosmétiques ?
