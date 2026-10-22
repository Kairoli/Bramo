# Le butin, les recettes et les métiers

> **Statut** : proposition de Claude du 22 octobre 2026, à la demande de Louis (« le loot et les recettes : qui drop quoi, où, combien, comment » ; « refais un check sur les métiers : que tous soient bien utilisés, à peu près équitablement, s'il en manque, si on peut en rajouter »). **Rien n'est adopté.** S'appuie sur le dossier de GPT ([`../activites-artisanat/Bramo-activites-artisanat.md`](../activites-artisanat/Bramo-activites-artisanat.md) §4 à §7 et §11 : patrons de recettes, matières par palier, unités de butin), sur [`../metiers.md`](../metiers.md), sur le build v2 ([`../coherence/build.md`](../coherence/build.md)) et sur le monde ([`le-monde.md`](le-monde.md)).

> **Mise à jour du 22 octobre au soir** : à la demande de Louis (« pousse tout le contenu »), le catalogue des dix paliers (4 152 modèles avec les armes à valeur égale), les zones et gardiens du monde et le **butin de combat** (§2 : unité de 6 min, vestiges, objets classiques, pièces d'ensemble au 40+, nommés garantis) sont **dans le jeu** (`data/`, `combat/progress.ts`, `apps/server/src/game.ts`). Gemmes brutes, caches et toutes les recettes d'équipement restent à faire. Les lignes « Où on en est vraiment » ci-dessous décrivent l'état d'avant.

## En bref

- **Où on en est vraiment** : le catalogue d'objets du jeu s'arrête au **palier 20** (paliers 1, 10 et 20, 769 modèles), pas 30. Et dans le jeu, **aucun objet ne tombe ni ne se fabrique encore** : seul le bouton de test en crée. GPT a fait un vrai barème de recettes (28 patrons, une matière par palier), jamais installé.
- **Nouveau, à la demande de Louis** (« il faut créer les équipements jusqu'au bout ; tous les objets doivent monter avec les paliers ») : **le catalogue des dix paliers existe**, en proposition (§1.3) : 4 072 modèles, classiques à tous les paliers, ensembles de 40 à 90, les 12 nommés.
- **Le principe** : trois façons d'avoir un objet (**le trouver, le fabriquer, l'acheter**), et **le combat ne donne jamais de matières premières** (minerai, bois, peaux…) : c'est le travail des métiers. Le combat donne des **vestiges** (la matière des ensembles), des **objets finis**, des **gemmes brutes** et les **objets nommés**.
- **Les métiers** : les 17 servent tous à quelque chose, mais l'équipement les fait travailler très inégalement. **La Forge ne fait que 6 % du travail d'un équipement complet**, la Tannerie 16 %. Une correction simple (la cuirasse se termine à la Forge) ramène les trois métiers d'armure autour de 10 à 12 % chacun. Deux métiers restent faibles : l'**Artificerie** et l'**Exploration**. Je propose de quoi les nourrir, et **de n'ajouter aucun métier pour l'instant**.

---

## 1. Les paliers

### 1.1 Ce qui existe

**Décidé par Louis** (`combat-items.md` §5.5) : un palier d'équipement **tous les dix niveaux**, de 1 à 90.

**Ce qui est dans le jeu** : les paliers **1, 10 et 20** (Commun à Légendaire, sept vêtements, trois bijoux, neuf armes, sept anciens ensembles, 21 nommés). Rien au-delà. Les minerais existent déjà jusqu'à l'astralite, mais pas les cuirs, les tissus, ni les objets.

### 1.2 Où se trouve chaque palier

| Palier | Région | Où exactement | Niveau de classe pour en profiter |
|---|---|---|---|
| 1 | Les Abords du bourg | la Chaussée des lanternes | 1 |
| 10 | Les Abords du bourg | les Fossés gris | 10 |
| 20 | Les Forges éteintes | la Cour des trois coups | 20 |
| 30 | Les Forges éteintes | les Vergers de verre | 30 |
| 40 | les quatre régions hautes | leurs zones au **premier cercle** | 40 |
| 50 à 90 | les mêmes quatre régions | **cercles 50, 60, 70, 80 et 90** | 50 à 90 |

**Le cercle** : dans les quatre régions hautes (Lisière, Archives, Bastion, Cicatrice), on choisit à quel cercle on entre. Ce sont les mêmes lieux avec des ennemis plus forts et un **butin d'un palier plus haut**. Le cercle change le **palier** de ce qui tombe ; la **profondeur** (de +0 à +10, `build.md` §5) change seulement la **qualité** à l'intérieur de ce palier. On ne reçoit jamais un objet d'un palier au-dessus de son niveau de classe : un ami de niveau 90 n'aide pas un débutant à obtenir du palier 90.

### 1.3 Le catalogue des dix paliers (fait, en proposition)

**Les paliers vont jusqu'à 90** (décision du 21 octobre : un palier tous les dix niveaux) ; le niveau 99 est un accomplissement, sans nouveau palier : l'équipement 90 sert jusqu'au bout. Si tu veux un vrai « palier 99 » (une tenue de prestige du Grand maître, par exemple), c'est faisable, mais ce serait le seul palier hors du rythme.

Le générateur (`docs/design/catalogue/export_gear_v2.mjs`) écrit dans `sim/proposals/coherence-v2/` (`gear_base.yaml`, puis `gear.yaml` après la règle des armes, et `gear_sets.yaml`) ; **`data/` n'est pas touché**.

| Ce qu'il contient | Combien |
|---|---|
| **Objets classiques** : 4 familles de vêtements × 7 emplacements, bijoux, 9 armes ; **les 4 raretés à chacun des 10 paliers** ; protecteur et offensif | 2 680 |
| **Pièces des 15 ensembles du build v2**, paliers 40 à 90, Épique et Légendaire ; un ensemble de toutes les classes existe en cuirasse (Forgefeu, Traqueur) et en tenue de piste (Traqueur, Runiste) | 1 296 |
| **Les 12 objets nommés**, de leur premier palier à 90 (une nouvelle version à chaque palier) | 81 |
| Pièces de départ, inchangées | 15 |

Ce qui change par rapport au catalogue actuel :
- **une matière par palier** (la table du §3.3) : le « Heaume du Cogneur » existe en bronze, fer, acier, acier trempé… jusqu'à l'astralite ; les bijoux et le sceptre vont du cuivre à l'électrum, avec **l'argent au 30 et l'or au 50** ;
- **les raretés valent +5 % par rang** (combat-items.md §5.5) : le Commun a deux lignes fixes comme les autres (il n'en avait qu'une, d'où un saut de 2,5 paliers vers le Rare), et le Légendaire existe en protecteur et en offensif (il n'avait qu'une orientation par emplacement, d'où un Légendaire plus faible que l'Épique). Le rang ajoute aussi une ligne aléatoire (Commun 0 à 1, Rare 1 à 2, Épique 2 à 3, Légendaire 3 à 4) ;
- **les armes à valeur égale** (`../coherence/classes.md`) ;
- la conversion des statistiques donne **+12 % de Puissance et de PV par palier** sur les dix paliers.

La mesure de la courbe (palier par palier, rareté par rareté) est au §1.4.

### 1.4 La courbe mesurée

Dans le moteur de combat, les neuf voies, les 18 rencontres, sans talent (rapport : [`equipement.md`](../../../sim/reports/combat/coherence-v2/coherence-zones-v2/equipement.md)) :

| Ce qu'on compare | Gain de mur (médiane) | Ce qui était visé |
|---|---|---|
| **Un palier de plus** (de 1 à 90, Rare) | **×1,09 à chaque palier** (×1,12 entre 20 et 30) | +12 % de stats ≈ ×1,096 : tenu |
| **Commun → Rare → Épique → Légendaire** | **×1,03 à chaque rang**, aux paliers 20 et 60 (Rare → Épique au palier 60 : ×1,00, à la précision de la mesure) | une rareté ≈ +5 % de stats, et **toujours dans l'ordre** : tenu (avant : ×1,25, ×1,12, puis ×0,92 : le Légendaire était sous l'Épique) |
| Une ligne aléatoire de plus (le rang en donne une) | ×1,03 pour un kit Rare entier au jet moyen | la ligne variable compte, sans écraser le palier |
| Un Rare du palier 10 contre un Commun du palier 20 | ×1,06 pour le Commun | une pièce d'un palier en dessous reste proche : tenu |
| Armure toute protectrice / toute offensive | ×0,85 / ×0,92 du mélange | **pas tenu** : le mélange est le meilleur, et le tout-protecteur perd environ un palier contre le tout-offensif. À régler par la valeur de la Défense dans la conversion (`perDefense`), plus tard |

En clair : **avec le même temps de jeu, monter d'un palier compte toujours plus qu'une rareté** (environ trois rangs de rareté pour un palier), et un objet plus rare est toujours un peu meilleur, jamais moins bon.

---

## 2. Qui fait tomber quoi

### 2.1 L'unité de butin

Tout se compte en **unités** (règle du dossier de GPT, §11) : **une unité = environ 6 minutes de combat** à la vitesse d'un build de référence. Un combat de 30 s vaut un douzième d'unité. Un build plus rapide gagne donc plus d'unités par heure, sans tricher. Un combat perdu ne donne rien.

### 2.2 Ce que contient une unité

| Butin | Par unité | Ce que c'est |
|---|---|---|
| **Vestiges** de la région | **2 garantis** | la matière qui sert à fabriquer les ensembles de la région |
| **Objet classique** | 20 % | une pièce d'équipement finie, avec ses lignes aléatoires |
| **Gemme brute** | 8 % | à faire tailler par un joaillier : c'est l'entrée des talents |
| **Cache d'ensemble** | 4 % (10 % en donjon) | une pièce d'un ensemble de la région, la famille choisie avant de partir |
| **Objet nommé** visé | 5 %, **garanti à la 20ᵉ unité** | le talent unique d'un ennemi précis |
| Minerai, bois, peaux, fibres, or | **jamais** | c'est le travail des métiers |

**La rareté** d'un objet classique : 55 % Commun, 30 % Rare, 13 % Épique, 2 % Légendaire, décalés de 2 points vers le haut par cran de profondeur. Une cache d'ensemble est Épique (10 % de chances de Légendaire).

### 2.3 Par activité

| Activité | Ce qui y tombe en plus | Rythme (build de référence) |
|---|---|---|
| **Patrouille** (1 h) | 10 unités | **20 vestiges, 2 objets, 0,8 gemme brute, 0,4 cache** ; un nommé visé toutes les **1 h 20** en moyenne (garantie comprise) |
| **Donjon** (parcours complet, ~18 min) | 3 unités (salles 3, 5 et 6), + le coffre gardé (1 à 3 unités de vestiges), + la première fois une apparence | par heure : **~33 vestiges, 2 objets, 1 cache**, le nommé du gardien ; plus riche qu'une Patrouille, mais plus dur et souvent en groupe |
| **Route des Lointains** | les coffres de checkpoint, **une seule fois** (objet Rare, gemme, +1 % de Puissance ×3, titres) | — |
| **Marée du soir** | des éclats chaque soir ; le **coffre du dimanche** (4 meilleurs soirs) : réserves de matières (40 min de collecte), une chance de cache, une apparence | une fois par semaine |
| **Contrats du Panneau** | vestiges, une réserve de matières (10 min), un jeton | 3 par semaine |
| **Caravane du clan** | une réserve de matières, des jetons, du Renom | une par semaine |
| **Concours des Maîtres** | le poinçon, un titre, du Renom | un par mois |

Un build 25 % plus rapide fait 25 % d'unités en plus. La profondeur donne de meilleures raretés et plus de lignes, pas plus d'unités.

### 2.4 Par région

| Région | Paliers | Vestige | Ensembles qu'on y trouve (familles) | Objets nommés (qui les porte) |
|---|---|---|---|---|
| **Les Abords du bourg** | 1, 10 | **Galets du puits** | aucun (avant 40) : les galets font les **gemmes de situation** fenêtres et érosion | Le Petit Arrangement (le Collecteur du bourbier) |
| **Les Forges éteintes** | 20, 30 | **Scorie de mémoire** | aucun (avant 40) : les scories font les **gemmes de situation** coups lourds et renforts | Le Marteau des griefs (le Veilleur de four), La Forge portative (le Contremaître rouge), La Ponctuelle (la Cloche de fer) |
| **La Lisière des veilleurs** | 40 à 90 | **Ambre de veille** | Les Mains de traverse, Le Pied-de-biche (gardes) ; Les Veilleurs du sceau, Le Tablier de suie (aura) | L'Arc des Ronceraies (le Cerf de braise) |
| **Les Archives englouties** | 40 à 90 | **Encre fossile** | Les Heures creuses, Le Sablier fêlé (fenêtres) ; Les Habits de pluie, Le Ciré du Gué (érosion) | Le Dernier Avertissement (le Témoin sous l'eau), Le Bénéfice du doute (le Chantre muet) |
| **Le Bastion des longues veilles** | 40 à 90 | **Éclat de serment** | les quatre des gardes et des coups lourds (Mains de traverse, Pied-de-biche, Enclume patiente, Fondeurs sourds) | Le Sceau qui tient (l'Intendant de verre), Le Fil du retour (le Porte-serment de la meute) |
| **La Cicatrice des trois vents** | 40 à 90 | **Quartz de faille** (s'échange 4 contre 1 vestige d'une autre région) | les quatre des renforts et de l'aura (Passeurs de braise, Meute du dimanche, Veilleurs du sceau, Tablier de suie) | Le Mauvais Présage (la Sentinelle fendue), Le Sac sans fond (le Régent des courants), Les Heures supplémentaires (le Héraut des trois vents) |

**Les ensembles de classe** (Le Fer du second feu, La Battue silencieuse, La Phrase inachevée) tombent dans **tous les donjons** à partir du palier 40, dans les caches, pour la classe de celui qui joue.

**Les nommés après leur région** : un nommé des Abords ou des Forges existe aussi aux paliers suivants ; il tombe alors chez son porteur dans la région haute qui partage ses familles (Archives pour les Abords ; Bastion et Cicatrice pour les Forges), au cercle choisi.

**Les ensembles à partir du palier 40** [Décidé par Louis, 22 octobre], en Épique et Légendaire. Avant 40, on répond aux mécaniques des Abords et des Forges avec les **gemmes et les préparations de situation** (`build.md` §2), qui existent dès le début, et avec son plan ; les ensembles arrivent quand le joueur connaît déjà le principe. Les vestiges des Abords et des Forges servent alors aux **gemmes de situation** de leurs familles (§3.1) et se vendent aux joailliers.

---

## 3. Comment on fabrique

### 3.1 Ce qui se fabrique, ce qui ne se fabrique pas

| Objet | Fabriqué ? | Par qui | Ce qu'il faut de spécial |
|---|---|---|---|
| Objets classiques (toutes raretés) | oui | Forge, Tannerie, Couture, Menuiserie, Joaillerie, Enchantement | les matières du palier ; on **choisit** le modèle et la rareté |
| Pièces d'ensemble | oui | les mêmes | + des **vestiges** de la région (table du dossier §6 en Épique et Légendaire ; la moitié en Rare) + un **liant de mémoire** (Enchantement) en Épique, deux en Légendaire, aucun en Rare |
| Gemmes de build (34) | oui | Joaillerie | 2 gemmes taillées + 1 noyau runique (Enchantement) + 2 poudres ; **on choisit le talent** |
| Gemmes de situation (6) | oui | Joaillerie | 1 gemme taillée + 1 noyau + **3 vestiges de la région de sa famille** |
| Préparations de situation (6) | oui | Alchimie (et Cuisine pour deux d'entre elles) | des réactifs courants ; une préparation sert un combat |
| Objets nommés (12) | **non** (décision de V1) | — | on les trouve, on les achète au marché, on les répare chez un artisan |

### 3.2 La règle d'une recette, en simple

Chaque objet part d'un **patron** (28 patrons, dossier de GPT §6 : « un plastron, c'est 18 métaux, 4 cuirs, 2 tissus et 8 minutes »). Ensuite :
- **le palier** multiplie les quantités (×1 au palier 1, ×2 au palier 40, ×3,5 au palier 90) et demande **la matière principale de son palier** (le mithril au 40) ; les matières d'appoint restent de bas palier (un plastron de palier 90 ne demande pas une Couture 90) ;
- **la rareté** se choisit et multiplie encore les quantités (Rare ×1,35, Épique ×1,8, Légendaire ×2,6) ;
- les **lignes aléatoires** se tirent à la fabrication, comme pour un objet trouvé ; le **chef-d'œuvre** reste la signature de l'artisan.

**Exemple : les Bottes « encore cinq minutes »** (Le Sablier fêlé), pour un Traqueur, palier 10, Rare :

| Il faut | Combien | Qui le fournit |
|---|---|---|
| Cuir souple (palier 10) | 12 | Tannerie (peaux de la Chasse, écorce du Bûcheronnage) |
| Tissu (palier 1) | 4 | Couture (fibres de l'Agriculture) |
| Lingot (palier 1) | 2 | Forge (minerai du Minage) |
| Poudre d'atelier (palier 10) | 1 | Recyclage d'un vieil objet, ou abrasif de l'Alchimie |
| Galets du puits (palier 10) | 2 | le combat dans les Abords, ou le marché |
| Fabrication | 4 min 8 s | Tannerie niveau 10 |

### 3.3 Les matières par palier (proposition du dossier de GPT, que je recommande)

| Palier | Métal (Forge) | Bois (Menuiserie) | Cuir (Tannerie) | Tissu (Couture) | Bijou et pierre (Joaillerie) |
|---|---|---|---|---|---|
| 1 | Bronze | Pin | Cuir brut | Toile de lin | Cuivre, quartz |
| 10 | Fer | Chêne | Cuir souple | Lin serré | Cuivre poli, quartz clair |
| 20 | Acier | Frêne | Cuir renforcé | Sergé de lin | Cuivre ciselé, agate |
| 30 | Acier trempé | If | Cuir de lande | Toile de chanvre | Argent, améthyste |
| 40 | Mithril | Bois de lune | Cuir de veille | Toile de coton | Argent pur, opale |
| 50 | Mithril renforcé | Charme | Cuir de voyage | Coton croisé | Or, topaze |
| 60 | Orichalque | Cèdre | Cuir lamellaire | Soie végétale | Or pur, saphir |
| 70 | Azurite | Ébène | Cuir de rafale | Toile des brumes | Électrum, aigue-marine |
| 80 | Sombracier | Bois d'ombre | Cuir nocturne | Étoffe nocturne | Électrum sombre, onyx |
| 90 | Astralite | Bois d'aurore | Cuir astral | Étoffe d'aurore | Électrum astral, cristal astral |

**[Décidé par Louis, 22 octobre] : l'argent et l'or vont à la Joaillerie** (bijoux et sceptres), la Forge garde un métal par palier.

### 3.4 La vie d'un objet

**Trouvé ou fabriqué → porté → il s'use** (au temps de combat, jamais pendant l'absence) **→ réparé** par le métier qui l'a fait (Forge pour le métal, Tannerie pour le cuir, Couture pour le tissu, Menuiserie pour le bois, Joaillerie pour les bijoux), pour environ 30 % de ses matières ordinaires **→ vendu au marché, ou recyclé** en **poudres d'atelier**, qui servent à la finition de nouveaux objets. Le recyclage ne rend jamais les vestiges, les liants ni les gemmes.

---

## 4. Le contrôle des métiers

### 4.1 La part de chaque métier dans un équipement complet

J'ai compté le travail qu'il faut, de la récolte à la dernière couture, pour **équiper un personnage** : armure, bijoux, arme, quatre gemmes, huit pièces d'ensemble. C'est la moyenne des trois classes, avec les patrons et les chaînes du dossier. Ce sont des ordres de grandeur, pas un équilibrage.

| Métier | Aujourd'hui | Avec la cuirasse à la Forge | Pourquoi |
|---|---|---|---|
| Minage | 20 % | 22 % | tous les métaux, les pierres runiques, les gemmes |
| Joaillerie | 16 % | 16 % | bijoux et **toutes les gemmes de talent** |
| Tannerie | **16 %** | 12 % | trois familles d'armure sur quatre étaient en cuir |
| Couture | 11 % | 11 % | robes, capes, tissu d'appoint |
| **Forge** | **6 %** | **10 %** | seule l'armure du Forgefeu était en métal |
| Herboristerie | 7 % | 7 % | encres, extraits tannants |
| Chasse | 5 % | 4 % | les peaux |
| Alchimie | 5 % | 5 % | encres, extraits, abrasifs |
| Enchantement | 5 % | 5 % | noyaux des gemmes, liants des ensembles |
| Bûcheronnage | 4 % | 3 % | bois des armes, écorce |
| Agriculture | 3 % | 3 % | fibres |
| Menuiserie | 2 % | 2 % | arcs, arbalètes, bâtons |
| Cuisine, Pêche, Artificerie, Construction, Exploration | 0 % | 0 % | ils ne font pas d'équipement : voir §4.2 |

**La correction proposée** : la **cuirasse** (cuir bouilli renforcé de plaques, portée par le Forgefeu et le Traqueur) devient une pièce **terminée à la Forge**, moitié métal, moitié cuir fourni par la Tannerie. Les trois métiers d'armure passent à 10, 11 et 12 %, et ils dépendent les uns des autres.

### 4.2 Tous les débouchés, pas seulement l'équipement

| Métier | Équipement | Consommables | Clan, Marée, caravane, Concours | Verdict |
|---|---|---|---|---|
| **Minage** | tous les métaux, gemmes, pierres runiques | sable des fioles | pierre des bâtiments et de la digue | **fort** |
| **Bûcheronnage** | bois des armes, écorce du cuir | bois de chauffe | **planches de tous les bâtiments**, le pont de la caravane | bon (la Construction compense le peu d'équipement) |
| **Herboristerie** | encres, extraits | **repas et potions** | relais de la caravane | bon |
| **Pêche** | perles (bijoux) | **la moitié des repas** | relais de la caravane | correct, un peu étroit |
| **Agriculture** | fibres du tissu | repas | champs du clan | correct |
| **Chasse** | **les peaux de tout le cuir** | viande des repas | — | bon |
| **Forge** | armures de métal, cuirasses, armes de mêlée, lingots | — | **les outils de tous les métiers**, rivets, poulies de la caravane | bon avec la cuirasse |
| **Menuiserie** | arcs, arbalètes, bâtons | — | **manches de tous les outils, charpentes**, digue | bon (même raison que le Bûcheronnage) |
| **Cuisine** | — | **repas de tout le monde, vivres** des donjons et de la caravane | relais | **fort** |
| **Alchimie** | encres, extraits, abrasifs | **potions des donjons, les six préparations de situation** | huile des lanternes | **fort** |
| **Tannerie** | trail, cuirasses (avec la Forge), ceintures | — | sacs de la digue | bon |
| **Couture** | robes, capes | — | **bannières de clan** (les rangs), cordages, mèches des lanternes | bon |
| **Joaillerie** | bijoux, **toutes les gemmes de talent** | — | — | **fort** (attention : c'est le passage obligé des talents) |
| **Enchantement** | noyaux, liants, grimoires, **relance de ligne** (avec la Poudre des contrats) | — | — | bon |
| **Construction** | — | — | **bâtiments de clan, décor des rangs, digue, pont** | **fort** (le grand puits) |
| **Artificerie** | — | — | treuils de la caravane, balises du Géant | **faible** |
| **Exploration** | — | — | relevés du Géant | **faible** |

### 4.3 Ce que je propose pour les deux métiers faibles

**L'Artificerie : les outils de la Chasse, et les mécanismes des activités.**
- Les **outils de la Chasse sont des pièges** (collets, nasses, appeaux) : c'est l'Artificerie qui les fabrique, comme la Forge fait les pioches. Elle a ainsi une demande qui revient (l'usure des outils).
- Les **mécanismes** : treuils et poulies de la caravane, balises et lanternes de la Marée, **engins de chantier** qui réduisent le coût d'un bâtiment de clan (`metiers.md`).
- Plus tard, les **leurres et fumigènes** comme préparations de combat (une variante des six préparations de situation).

**L'Exploration : le fournisseur des Éclaireurs.** [Louis garde les Éclaireurs et le fait de devoir les nourrir.] Tout le monde peut envoyer son éclaireur, nourri par la Cuisine ; l'explorateur, lui, est celui qui **lui ouvre la route**, comme le forgeron fournit les pioches :
- l'Exploration fabrique des **itinéraires** (une carte de région, à usage unique). Sans itinéraire, un éclaireur ne va que dans les Abords du bourg ; avec l'itinéraire d'une région, il y va, et un itinéraire de meilleur palier lui fait rapporter plus (cercle plus haut, plus de chances de cartes de piste) ;
- l'explorateur part aussi **lui-même**, comme activité de son métier (c'est son travail, comme un mineur à la mine) : il en rapporte les itinéraires, les **relevés** de la Veille des Géants, et l'**Atlas** (une collection de lieux, en titres et apparences) ;
- plus l'explorateur est haut niveau, plus ses itinéraires vont loin.

Ainsi les Éclaireurs font travailler **deux métiers** (Cuisine pour les vivres, Exploration pour les itinéraires), et le combattant n'est jamais immobilisé.

### 4.4 Faut-il ajouter des métiers ?

**Je recommande de ne rien ajouter maintenant.** Avec 20 joueurs, 17 métiers font déjà moins d'un spécialiste par métier (simulateur, `metiers.md` §3) ; chaque métier de plus vide un marché. Le jeu en a d'ailleurs déjà 10 qui ne sont pas jouables (Chasse, Agriculture, Tannerie, Couture, Alchimie, Joaillerie, Enchantement, Artificerie, Construction, Exploration).

Quand la population le permettra, les trois extensions déjà prévues, dans cet ordre :
1. **Élevage** (laine pour la Couture, plumes, lait et œufs pour la Cuisine), d'abord comme une branche de l'Agriculture ;
2. **Archéologie** (fouiller les sites trouvés par l'Exploration : objets de collection, plans d'apparence) ;
3. **Dressage** (les compagnons du Meneur de meute, en apparence ; jamais de puissance).

Les idées écartées le restent, et deviennent des recettes dans un métier existant : la Verrerie (Alchimie et Joaillerie), la Teinturerie (Couture), la Brasserie (Cuisine).

### 4.5 Chaque métier a sa place dans le monde

| Activité | Métiers qui y participent |
|---|---|
| Marée du soir : la Débâcle | Minage (pierre), Bûcheronnage et Menuiserie (planches), Tannerie (sacs), Construction (la digue) |
| Marée du soir : la Nuit des Lanternes | Alchimie (huile, verre), Couture (mèches), Artificerie (lanternes), Joaillerie (lentilles) |
| Marée du soir : la Veille des Géants | Artificerie (balises), Couture (cordages), Exploration (relevés), Cuisine (vivres) |
| La caravane du clan | Menuiserie, Bûcheronnage, Cuisine, Pêche, Herboristerie, Couture, Forge, et un build de combat |
| Le Concours des Maîtres | un métier différent chaque mois, **tous les métiers d'artisanat à tour de rôle**, Cuisine et Alchimie comprises (« le plat du mois », « la potion du mois ») |
| Les rangs de clan | Construction, Couture (bannières), et tous les apports aux bâtiments |

---

## 5. Décisions et choix restants

**Décidé par Louis le 22 octobre** : l'argent et l'or à la Joaillerie ; les ensembles à partir du palier 40 ; tous les objets, classiques compris, à tous les paliers ; les Éclaireurs gardés, à nourrir.

**Encore à trancher** :
1. **La cuirasse à la Forge** (pour équilibrer Forge, Tannerie et Couture) : oui ou non ?
2. **L'Exploration comme fournisseur d'itinéraires des Éclaireurs** (§4.3) : oui ou non ?
3. **Le rythme des nommés** : un nommé visé toutes les 1 h 20 de combat en moyenne. Trop rapide, trop lent ?
4. **Un palier 99** de prestige, ou s'arrêter à 90 (§1.3) ?

## 6. Les sorts et les talents : comment on les obtient

Deux choses différentes, qu'on appelle parfois toutes les deux « compétences » :

**Les sorts** (les 66 compétences de classe, ce que le personnage lance en combat) **viennent du niveau de la classe**, en combattant. Chaque classe a 12 sorts communs, appris entre les niveaux 1 et 85 ; au niveau 30 on choisit sa voie, qui donne 3 sorts de plus (niveaux 30, 50 et 70) ; l'ultime arrive au niveau 75. On en porte 4, puis 5 à partir de la voie, dans son plan. **Pas de métier ni de butin** : tout joueur d'une classe a tous ses sorts à niveau égal, et le choix est dans le plan (lesquels porter, dans quel ordre).

**Les talents** (ce qui fait le build) viennent de deux sources :
- **les gemmes** : le **joaillier** les fabrique (2 gemmes taillées + 1 noyau runique de l'enchanteur + 2 poudres), **le talent se choisit à la fabrication**. Les gemmes brutes viennent du Minage ou du combat (8 % par unité). On les achète au marché, ou on les fait faire : c'est le métier de commande par excellence ;
- **les objets nommés** : **uniquement en combat** (5 % par unité sur leur porteur, garantis à la 20ᵉ), ou au marché.

Si tu veux que les sorts aussi se trouvent (un parchemin rare qui apprend une **variante** d'un sort, par exemple « Trait de poursuite, version qui ricoche »), c'est possible, mais ce serait un troisième système de puissance à équilibrer : je ne le recommande pas pour la première version.

## 7. Ce qu'il faut construire

| Morceau | Taille |
|---|---|
| ~~Générer le catalogue des paliers 30 à 90~~ **fait en proposition** (§1.3) ; reste à le recopier dans `data/` quand tu valides | petit |
| Les matières des métiers « bientôt » : cuirs, tissus, métaux précieux, encres, noyaux, liants | moyen |
| Les recettes d'équipement depuis les 28 patrons (le dossier de GPT en a déplié 4 293, pour les anciens ensembles : à refaire pour les 15 ensembles v2) | moyen, généré |
| Le butin des combats : unités, vestiges, objets, gemmes brutes, caches, nommés et leur garantie | moyen |
| Recyclage en poudres, réparation par le métier de la pièce | petit |
| Les gemmes serties (Joaillerie) et la relance de ligne (Enchantement) | moyen |

Ordre recommandé : **une boucle complète sur un seul palier** (palier 10 : Patrouille dans les Fossés gris → vestiges et objets → Tannerie et Forge fabriquent → porté, usé, réparé, vendu ou recyclé), puis on étend aux autres paliers.
