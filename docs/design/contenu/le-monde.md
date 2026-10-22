# Le monde de Bramo et tout ce qu'on peut y faire

> **Statut** : proposition de Claude du 22 octobre 2026, à la demande de Louis (« imagine-moi un monde, avec son fonctionnement, celui des features, les récompenses, les drops ; que ce soit varié, sans devenir un second travail ; pas que des boss »), **revue avec ses retours du même jour** (marqués [Décidé par Louis]). Le reste n'est pas adopté. Reprend et relie ce qui existe déjà : les régions et gardiens de [`../coherence/build.md`](../coherence/build.md), les donjons, la route et les Routes franches du dossier [`../activites-artisanat/`](../activites-artisanat/Bramo-activites-artisanat.md), les clans à bâtiments ([`../monde.md`](../monde.md)), le marché, la présence (16 h d'autonomie), les saisons. Ce qui n'existe pas encore dans le jeu est signalé ⟦à construire⟧.

## En bref

- **Un monde, une histoire** : Bramo est le dernier bourg avant les Lointains, des terres que la Marée a noyées puis rendues. **Chaque soir à 20 h, la Marée remonte** pour une heure, et tout le serveur y répond.
- **Huit façons de jouer hors du farm de métier**, de la plus personnelle à la plus collective : la Route, les Patrouilles, les Contrats du Panneau, les Éclaireurs, les Profondeurs (donjons), **la Marée du soir**, le Concours des Maîtres, les Routes franches et les rangs de clan.
- **Trois seulement ont un boss** à la fin (la Route, les Profondeurs, et un soir sur trois la Marée). Les autres sont des hordes, des escortes, des voyages, de l'artisanat jugé, une caravane.
- **Le joueur souvent connecté est récompensé** (la Marée en direct, ses choix pendant l'heure), **l'absent n'est jamais puni** (participation engagée à l'avance, coffre de la semaine sur les meilleurs soirs).
- **Chaque activité a son butin propre**, pour qu'aucune ne soit inutile et qu'aucune ne soit obligatoire.

---

## 1. Le monde

### 1.1 L'histoire, en dix lignes

Il y a longtemps, la **Marée** est montée. Pas une marée d'eau : une brume lourde, salée, qui éteint les feux et fait oublier. Les forges se sont tues, les archives ont coulé, les veilleurs ont fermé leurs portes. Quand elle s'est retirée, elle a laissé les **Lointains** : des terres pleines de choses à moitié vivantes, d'outils qui travaillent seuls, de lanternes qui marchent.

**Bramo** est le bourg qui s'est construit au bord, là où la Marée s'arrête. On y vit de ce qu'on récolte, de ce qu'on fabrique, et de ce que les braves rapportent des Lointains. Les **maîtres de métier** y transmettent leur art ; les **clans** y bâtissent leurs halles ; le **Panneau** annonce qui a fait quoi.

Mais la Marée n'est pas partie. **Chaque soir, à la tombée de la nuit, elle remonte** jusqu'aux portes du bourg, et elle ramène des choses avec elle. Et chaque saison, elle monte un peu plus haut et déplace le monde : une mutation, des créatures nouvelles, une route qui change.

### 1.2 La carte

```
                         ┌──────────────────────────┐
                         │  LA CICATRICE DES TROIS  │   renforts · aura
                         │          VENTS           │   Le Régent des courants
                         └────────────┬─────────────┘
          ┌──────────────────┐        │        ┌──────────────────────┐
          │ LES ARCHIVES     │        │        │ LE BASTION DES       │
          │ ENGLOUTIES       ├────────┼────────┤ LONGUES VEILLES      │
          │ fenêtres·érosion │        │        │ gardes · coups lourds│
          │ Le Notaire       │        │        │ Le Gardien des portes│
          └────────┬─────────┘        │        └──────────┬───────────┘
                   │      ┌───────────┴──────────┐        │
                   └──────┤ LA LISIÈRE DES       ├────────┘      paliers 40 et plus :
                          │ VEILLEURS            │               quatre régions côte à côte,
                          │ gardes · aura        │               profondeurs 60 / 80 / 90
                          │ La Matriarche        │
                          └───────────┬──────────┘
                          ┌───────────┴──────────┐
                          │ LES FORGES ÉTEINTES  │   paliers 20 à 39
                          │ coups lourds·renforts│
                          │ Le Contremaître rouge│
                          └───────────┬──────────┘
                          ┌───────────┴──────────┐
                          │ LES ABORDS DU BOURG  │   paliers 1 à 19
                          │ fenêtres · érosion   │
                          │ Mère Grise           │
                          └───────────┬──────────┘
                                 ═════╧═════
                                   BRAMO
               (maîtres, marché, halles de clan, Panneau, la digue)
```

Chaque région a **deux familles de mécaniques** (ce qui oblige à adapter son build), **deux zones de route**, **un donjon**, **un gardien**, un **vestige** (la matière qui sert à fabriquer ses ensembles) et quelques **objets nommés**. Le détail est dans `build.md` §6.1 ; voici ce que chaque région raconte :

| Région | Ce qu'on y trouve | L'ambiance |
|---|---|---|
| **Les Abords du bourg** | lanternes qui ne s'éteignent jamais, linge qui sèche depuis cent ans, fossés gris | le familier qui a mal tourné : on y apprend |
| **Les Forges éteintes** | outils qui frappent seuls, apprentis de suie, vergers de verre soufflé | le travail qui continue sans personne |
| **La Lisière des veilleurs** | arbres à résine, cocons, cerfs de braise, cloîtres aux balances | une forêt qui garde quelque chose |
| **Les Archives englouties** | salles où l'écho répond, encre qui ronge, gué des plaies | le savoir noyé, et ce qui le garde |
| **Le Bastion des longues veilles** | portes scellées, terrasses de guet, serments de pierre | une forteresse qui n'a jamais reçu l'ordre de se rendre |
| **La Cicatrice des trois vents** | éclats de verre vivants, belvédères, ateliers des mauvais jours | là où la Marée a frappé le plus fort |

---

## 2. Les activités, vue d'ensemble

| Activité | Seul ou à plusieurs | Ce qu'on fait | Un boss ? | Préparer | Durée | Rythme |
|---|---|---|---|---|---|---|
| **La Route des Lointains** | seul | avancer d'étape en étape, des épreuves variées | oui, toutes les 10 étapes | 1 min | jusqu'à 16 h en autonomie | quand on veut |
| **Les Patrouilles** | seul | farmer une zone choisie (le cœur du combat) | non | 1 min | jusqu'à 16 h en autonomie | quand on veut |
| **Les Contrats du Panneau** | seul | trois objectifs qui se remplissent en jouant | non | 0 | automatique | 3 par semaine, gardés 2 semaines |
| **Les Éclaireurs** | seul | envoyer un éclaireur du bourg au loin (ton personnage reste libre) | non | 2 min | 2 à 8 h, en parallèle | quand on veut |
| **Les Profondeurs** (donjons) | seul ou 2 à 4 | six salles différentes, une seule préparation | oui, à la fin | 3 min | 12 à 20 min par parcours, en boucle | quand on veut |
| **La Marée du soir** | tout le serveur | horde, escorte ou géant, selon le soir | un soir sur trois | 0 à 2 min | **tous les soirs, 20 h – 21 h** | quotidien, coffre de la semaine sur les 4 meilleurs soirs |
| **Le Concours des Maîtres** | tout le serveur (artisans) | présenter sa plus belle pièce fabriquée | non | quand on fabrique | — | un par mois |
| **Les Routes franches** | clan | une caravane de six étapes | non | 5 min | sur la semaine | une par semaine |
| **Les rangs de clan** | clan | le Renom que tout le clan accumule | — | — | permanent | — |

**Le principe** : les Patrouilles et la Route sont le pain quotidien ; la Marée est **le rendez-vous du soir** ; tout le reste s'ajoute, se garde, et ne se perd pas si on le manque.

---

## 3. Seul

### 3.1 La Route des Lointains : des épreuves, pas une file de boss

La progression personnelle permanente (dossier, §12 à 13) : **douze zones de dix étapes**, puis un nouveau circuit plus dur. Le record et les récompenses de checkpoint sont **par compte**, une fois.

**Ce qui change** : une étape n'est pas toujours « tuer ce qui est devant ». Six types d'étapes, qui demandent chacun autre chose au build :

| Type d'étape | Ce qui se passe | Ce qui gagne | Qui brille |
|---|---|---|---|
| **Rencontre** | un groupe ordinaire de la zone | les tuer | tout le monde |
| **Embuscade** | des renforts arrivent par vagues | survivre aux vagues et vaincre le chef | Trophées, Battue, dégâts de zone |
| **Traversée** ⟦à construire⟧ | la zone frappe (érosion, aura, chutes de pierres) ; il n'y a rien à tuer | **tenir 60 s** | soutiens, Ferveur, Rancœur, purifications |
| **Escorte** ⟦à construire⟧ | un colporteur (un allié du jeu, avec ses PV) traverse ; on le protège | qu'il arrive vivant | soutiens, contrôle |
| **Fuyards** ⟦à construire⟧ | des créatures s'enfuient au bout de 25 s | en attraper au moins 4 sur 6 | dégâts rapides, Entailles, Traqueur |
| **Énigme de plan** | une formation qui punit la cible évidente (la Chambre aux deux sceaux) | trouver la bonne cible prioritaire | le joueur qui lit la rencontre |
| **Gardien** (étape 10) | le gardien de la zone, ou une variante | le vaincre | le build qui répond à ses deux familles |

Ainsi, sur dix étapes, il y a **un seul boss**. Les neuf autres sont des problèmes différents. L'écran de l'étape annonce son type et ses familles : on sait quoi préparer.

**Récompenses** : celles du dossier (§13) : un objet Rare à l'étape 10, des titres, des réserves de matières, une gemme, +1 % de Puissance aux étapes 40, 80 et 120 (3 % au plus), des apparences. Rejouer une étape donne de l'XP de classe, jamais deux fois le coffre.

### 3.2 Les Patrouilles : le farm de combat

(Ce n'est pas la **Chasse**, qui est un métier de récolte sans combat. Nom à ton goût : Patrouilles, Tournées, Battues…)

C'est l'activité de combat la plus simple : **choisir une zone et une profondeur, et laisser tourner** (jusqu'à 16 h d'autonomie). Le personnage enchaîne les rencontres de la zone.

- **La profondeur** (`build.md` §5) : de 0 à +10, chaque cran est un palier de difficulté de plus et donne un **butin de meilleure qualité** (pas plus abondant). C'est là que le meilleur build est récompensé : il patrouille plus profond.
- **Ce qui tombe** (par rencontre notable, une « unité » de butin, valeurs du dossier §11) :

| Butin | Chance par unité | Pour quoi faire |
|---|---|---|
| Vestiges de la région | 2 garantis | fabriquer les ensembles de la région (soi-même, ou les vendre aux artisans) |
| Objet classique (une pièce d'équipement au hasard) | 20 % | s'équiper, ou revendre au marché |
| Gemme brute | 8 % ⟦à construire⟧ | la faire tailler par un joaillier : c'est l'entrée des talents |
| Cache d'ensemble | 4 % en Patrouille (10 % en donjon) | une pièce d'un ensemble de la région, famille choisie |
| Objet nommé de la zone | 5 %, garanti à la 20ᵉ unité | le talent unique du coin |
| Peaux, os, cornes | ⟦à voir avec la Chasse⟧ | **non** : ce sont les matières du métier de Chasse ; le combat n'en donne pas, pour ne pas lui couper l'herbe sous le pied |

Rareté des objets classiques : 55 % Commun, 30 % Rare, 13 % Épique, 2 % Légendaire, décalés de 2 points vers le haut par cran de profondeur.

### 3.3 Les Contrats du Panneau : des petits objectifs qui se font tout seuls

Chaque lundi, le Panneau du bourg affiche **trois contrats personnels**, tirés selon ce que tu fais d'habitude. Ils se remplissent **pendant que tu joues normalement**, sans rien changer :

> *« Les Lanternes noires de la Chaussée brûlent les cordes à linge de Mère Grise. Ramène-en 40. »*
> *« Le maître forgeron cherche trois pièces de palier 20 pour ses apprentis. »*
> *« On a vu un cerf de braise près du Cloître. Rapporte une preuve (vaincre un gardien de la Lisière). »*

- Un contrat de combat, un de métier, un libre (au choix entre deux).
- **Ils se gardent deux semaines** : si tu rates une semaine, tu en as six la suivante. Tu ne perds rien en étant absent.
- **Récompenses** : des vestiges, une petite réserve de matières (10 min de collecte), et un **jeton de contrat**. Les jetons s'échangent au Panneau contre des apparences, des titres, ou de la **Poudre de relance** (la matière dont les enchanteurs ont besoin pour relancer une ligne d'objet). Ce sont donc les joueurs de combat qui alimentent un métier d'artisan : de l'économie, pas de la puissance gratuite.

### 3.4 Les Éclaireurs : quelqu'un part à ta place

**Le souci de la première version** : une expédition occupait ton personnage 8 h, sans rien pouvoir faire d'autre. Corrigé : **ce n'est plus ton personnage qui part, c'est un éclaireur du bourg**, que tu engages. Ton personnage continue son métier ou sa Patrouille.

- **Un éclaireur à la fois** (un deuxième avec un bâtiment de clan, le Relais des éclaireurs ⟦à construire⟧). Il part 2, 4 ou 8 heures.
- **Il faut le nourrir** : des **vivres** de la Cuisine (plus il en emporte, plus il va loin). C'est ce qui l'empêche d'être un revenu gratuit, et ce qui donne un débouché aux cuisiniers.
- **Sa réussite dépend de toi** : il emporte une **copie de ton build de combat** pour se défendre (trois petites rencontres simulées sur le trajet) ; mieux il s'en sort, moins il perd de vivres.

Ce qu'il rapporte (un but au départ) :

| But | Ce qu'il trouve |
|---|---|
| **Relevés** | une **carte de gisement** : pendant 24 h, une source de récolte riche dans la région (le métier Exploration, `metiers.md`) |
| **Pistes** | une **carte de piste** : ouvre une étape cachée, **les Sentiers perdus**, avec un vestige garanti et une page de bestiaire |
| **Épaves** | des matières rares des Lointains (verre de marée, sel noir) pour les recettes de haut palier |
| **Rumeurs** | un indice sur le nommé de la région (sa garantie avance de 2 unités) |

**[Louis garde les Éclaireurs, et le fait de devoir les nourrir.]** Proposé en plus ([`butin-et-recettes.md`](butin-et-recettes.md) §4.3) : le métier **Exploration** fournit les **itinéraires** qui envoient un éclaireur au-delà des Abords du bourg ; les Éclaireurs font ainsi travailler la Cuisine et l'Exploration.

---

## 4. Les Profondeurs : les donjons

Un donjon par région, **six salles**, une seule préparation, puis tout se résout seul (dossier, §9 ; guérison de 30 % entre les salles, mesurée). Seul ou en escouade de 2 à 4, y compris avec des amis hors ligne qui ont autorisé leur personnage (dossier, §10).

**Ce qui change** : les six salles ne sont pas six combats pareils. Chaque donjon mélange des types de salles :

| Salle | Type | Exemple (la Fonderie sans maître) |
|---|---|---|
| 1 | **Approche** : apprendre la règle du lieu | deux ouvriers de suie aux coups espacés |
| 2 | **Piège** ⟦à construire⟧ : une salle qui frappe, on tient 45 s | le four qui se rallume : chaleur qui monte (aura croissante) |
| 3 | **Rencontre notable** | le Veilleur de four |
| 4 | **Coffre gardé** ⟦à construire⟧ : on ouvre un coffre pendant que la salle se défend ; plus on tient, plus le coffre est gros | le coffre-fort du contremaître, et ses apprentis qui arrivent |
| 5 | **Combinaison** : les deux familles de la région à la fois | la presse qui frappe tous les trois coups, et ses apprentis |
| 6 | **Gardien** | Le Contremaître rouge |

Et un choix avant de partir : **la branche**. *Courte* (salles 1, 5, 6 : pour viser un nommé), *Complète* (les six), ou *Pillage* (la salle 4 doublée, pas de gardien : pour les vestiges). Rien ne se décide en direct.

**Ce qui tombe** :

| Salle | Butin |
|---|---|
| Rencontre notable, combinaison, gardien | 1 unité de butin chacune (comme une Patrouille, mais **cache d'ensemble à 10 %**) |
| Coffre gardé | de 1 à 3 unités de **vestiges seulement**, selon le temps tenu |
| Gardien | son **objet nommé** (5 %, garanti à la 20ᵉ unité sur ce gardien), et sa page de bestiaire |
| Premier parcours complet | une apparence du donjon (une par donjon, six en tout) |

**Exploits du bestiaire** (`build.md` §5) : trois par gardien (vite, profond, sans potion), récompensés en titres, apparences et trophées de salon.

---

## 5. La Marée du soir [Décidé par Louis : tous les jours, à 20 h, pendant une heure ; le type tourne chaque soir]

### 5.1 Le rendez-vous

**Tous les soirs à 20 h** (heure du serveur), la Marée remonte jusqu'à la digue du bourg, **pendant une heure**. La cloche du bourg sonne à 19 h 45 ; le Panneau annonce le type du soir dès le matin.

**Trois Marées tournent, une par soir** :

| Soir | La Marée | Ce que c'est | Qui brille |
|---|---|---|---|
| 1 | **La Débâcle** | la horde : tout ce que la Marée avait pris descend la rivière | les dégâts, surtout de zone |
| 2 | **La Nuit des Lanternes** | l'escorte : des lanternes marchent vers le bourg, il faut les protéger | les soutiens et le contrôle |
| 3 | **La Veille des Géants** | le boss : un géant sort de la brume | les gros dégâts, et ceux qui tiennent |

Puis on recommence. Un soir sur trois seulement est un boss.

### 5.2 Comment on y participe

- **Connecté à 20 h** : un bouton « Rejoindre la digue ». Ton personnage quitte son activité pour l'heure (ou ce qu'il en reste si tu arrives à 20 h 30) et la reprend tout seul à 21 h.
- **Pas connecté** : une case « **Rejoindre la Marée chaque soir** » (ou seulement certains soirs). Ton personnage y va tout seul, avec ton build et tes préférences. **L'absent participe**, il n'est jamais puni.
- **Quatre canaux**, de même valeur (dossier, §15) : **combat**, **récolte** (ce que la digue demande ce soir-là), **fabrication** (sacs de toile, lanternes, balises), **logistique**. Un artisan participe en fabriquant, sans combattre.

### 5.3 Ce que gagne celui qui est là

Le joueur connecté a **une vraie heure de jeu**, sans que l'absent soit puni :

- **Les ordres en direct** ⟦à construire⟧ : toutes les 15 minutes, la Marée change de visage, et le joueur connecté choisit **où envoyer son personnage** (la digue, le pont, le gué ; ou quelle lanterne escorter ; ou quelle jambe du géant viser). Le bon choix pour son build rapporte environ **+15 % de points** sur le quart d'heure. L'absent suit la préférence qu'il a laissée : il marque normalement, sans ce bonus.
- **La Marée se voit** : sur l'écran du bourg, les personnages en train de tenir la digue, la jauge du serveur qui monte, le fil du Panneau en direct (« Pépin a sauvé trois lanternes », « La digue nord tient encore »).
- **Les seuils du serveur se débloquent en direct** : à 25, 50, 75 et 100 % de l'objectif du soir, tout le monde reçoit un petit bonus de plus, et le bourg change (des lanternes s'allument sur la digue).

Garde-fou : ce bonus de présence reste petit (~15 % sur les quarts d'heure choisis), pour que le joueur toujours là progresse plus vite, mais **jamais plus de 2 à 2,5 fois** un casu.

### 5.4 Les points et les récompenses

- **Les points de Marée** (combat) : tes dégâts totaux de l'heure (ou les lanternes sauvées), **ramenés à ceux d'un build moyen de ton palier**. Un build moyen fait **1 point par minute**, un très bon 1,3 à 1,5. Un joueur de palier 10 et un de palier 80 peuvent faire le même score : on compare ton build à ton palier, pas ta richesse. Autres canaux : 1 point par minute de travail validé.
- **Chaque soir** : des **éclats de marée** selon tes points (environ 1 éclat par point) et ta part des seuils du serveur. Les éclats s'échangent contre les apparences des Marées, des titres et des décorations de halle.
- **Le coffre de la semaine** : le dimanche soir, tes **quatre meilleurs soirs de la semaine** comptent pour un coffre : réserves de matières (jusqu'à 40 min de collecte), une chance de cache d'ensemble, une pièce d'apparence de la saison si tu as dépassé 200 points sur ces quatre soirs. **Quatre soirs sur sept suffisent** pour le coffre plein : celui qui joue tous les soirs a plus d'éclats et de prestige, pas plus de puissance.
- **Les titres** : « A tenu la digue » (10 Débâcles), « Porte-lanterne » (10 Nuits), « A vu un géant » (10 Veilles), et un titre de saison pour le meilleur score de chaque Marée par voie.

### 5.5 Les trois Marées en détail

**La Débâcle** (la horde, au score de dégâts). *La digue du Fossé gris a cédé : tout ce que la Marée avait pris descend la rivière.* Pas de boss : un flot continu, en trois temps qui reviennent tous les quarts d'heure :

| Temps | Ce qui descend | Ce qui marque des points |
|---|---|---|
| **Le flot** | des dizaines de petites choses (anguilles de suie, seaux qui mordent) | les dégâts de zone, Trophées, Battue |
| **L'embâcle** | des troncs et des barques soudés, avec une garde épaisse | Fracture, les grosses frappes, Tisons |
| **Le remous** | l'eau monte : érosion pendant quelques minutes | la Pluie, les purifications ; survivre, c'est continuer à marquer |

Canal métier : **consolider la digue** (pierre, planches, sacs de toile).

**La Nuit des Lanternes** (l'escorte, au score de lanternes). *Les lanternes de la Chaussée se mettent à marcher vers le bourg. Derrière chacune, il y a une âme qui rentre.* Des porteurs de lanterne (des alliés du jeu) traversent ; les créatures de la nuit les visent. Le score : **les lanternes arrivées**, et un peu les dégâts. Ici, les soutiens et le contrôle marquent le plus : un soir sur trois leur appartient. Canal métier : **fabriquer des lanternes** (verre, mèches, huile).

**La Veille des Géants** (le boss). Les géants du dossier (§15 ; `build.md` §6.3), un par soir en rotation : le Porte-Fanal, la Veuve de cuivre, le Grand Arpenteur, chacun à phases. Le score : les dégâts au géant. Canal métier : balises, cordages, relevés.

---

## 6. Le Concours des Maîtres : l'événement des artisans [proposé en événement du serveur, comme suggéré par Louis]

Une fois par mois, les maîtres du bourg organisent un **concours ouvert à tout le serveur**, sur un thème :

> *« Ce mois-ci : une arme de palier 40, pour qui vous voulez. »*
> *« Une pièce d'un ensemble des Forges éteintes. »*
> *« Le plus beau chef-d'œuvre de Couture. »*

- Chaque artisan présente **une pièce fabriquée par lui pendant le mois**. Elle lui est rendue à la fin.
- Le jury (les maîtres PNJ, avec un verdict écrit et un peu moqueur) note : la part des lignes au jet maximal, le chef-d'œuvre, la difficulté de la recette, et l'accord des lignes entre elles (des lignes qui servent un même build valent plus qu'un mélange).
- **Récompenses** : un titre de maître du mois, le nom au Panneau, des éclats, et surtout **le poinçon du concours** sur les trois premières pièces : une marque visible pour toujours, qui suit l'objet s'il est vendu. Une pièce poinçonnée vaudra plus cher au marché.
- **Le lien avec les clans** : chaque membre classé dans la première moitié rapporte du **Renom** à son clan (§7.1). Un clan d'artisans monte donc en rang sans combattre.

C'est **la compétition des artisans**, qui n'ont jamais besoin de combattre pour y briller.

---

## 7. Les clans

Un clan se **construit** (bâtiments à boosts, décision de Louis, `monde.md` §3). Il a un **rang** qui raconte son histoire, et une activité de semaine, la Route franche.

### 7.1 Le Renom et le rang du clan [Louis : « j'adore »]

Le clan gagne du **Renom** par ce que font ses membres. Le Renom **ne baisse jamais** (on ne punit pas l'absence) : c'est l'histoire du clan, écrite sur sa bannière.

| Rang | Renom | Ce qui change (jamais de puissance) |
|---|---|---|
| **Hameau** | 0 | une bannière simple |
| **Village** | 500 | la halle a une enseigne ; le clan apparaît sur la carte du bourg |
| **Bourg franc** | 2 000 | une couleur de bannière au choix ; un emplacement de trophée dans la halle |
| **Comptoir** | 6 000 | une statue de clan sur la place du bourg (au choix parmi six) |
| **Cité franche** | 15 000 | une porte de halle sculptée ; le nom du clan dans le fil du serveur à chaque rang franchi |
| **Ville-lanterne** | 40 000 | une lanterne qui brûle au-dessus de la halle, visible de tout le bourg |

| D'où vient le Renom | Combien |
|---|---|
| Une étape de Route franche livrée | 20 (120 la route entière) |
| Un niveau de bâtiment construit | 10 × le niveau |
| Un membre qui fait au moins 30 points dans une Marée du soir | 1 (au plus 20 par soir) |
| Un membre classé dans la première moitié du Concours des Maîtres | 10 (30 pour un podium) |
| Un membre qui vainc un gardien pour la première fois | 5 |

Le rang permanent récompense **la durée et l'effort commun**, pas la taille : un petit clan fidèle y arrive, plus lentement, et rien ne lui est retiré.

### 7.2 Les Routes franches : la caravane de la semaine [Louis : « super intéressant comme activité »]

Le cœur du clan (dossier, §16) : une caravane de six étapes, préparée ensemble, résolue en différé.

**Une semaine de caravane, concrètement :**
1. **Le lundi, on prépare** (5 minutes chacun) : chaque membre de l'équipe choisit un rôle pour une étape (apporter des planches pour le pont, cuisiner pour le relais, mettre son build de combat pour l'embuscade, repérer le col) ; le chef choisit une consigne (« protéger d'abord la cargaison » ou « tenter l'objectif bonus »).
2. **Pendant la semaine, ça tourne tout seul** : chacun engage ses deux heures de travail en une fois, la caravane avance étape par étape sans que personne ait besoin d'être connecté. Assez de planches : on passe le pont vite ; sinon on passe à gué et on perd des vivres.
3. **Le dimanche, le score** : 1 000 points par étape réussie, plus l'état de la cargaison, plus l'objectif bonus ; le Panneau raconte le voyage et affiche la place du clan.

**Chaque étape est un problème différent**, et pas un boss :

| Étape | Le problème | Qui aide |
|---|---|---|
| Le pont de la Paille courte | consolider ou passer à gué | Menuiserie (planches), Bûcheronnage |
| Le relais des Marmites vides | nourrir le relais ou garder ses vivres | Cuisine, Pêche, Herboristerie |
| Le bois aux Faux Panneaux | une embuscade : renforts | un build qui tient les renforts (escorte) |
| Le col des Trois Cordes | treuil et cordages, ou le chemin long | Couture (cordages), Forge (poulies) |
| L'atelier sans patron | réparer un outil, ou garder des pièces | les artisans de l'équipe |
| La porte du Dernier Péage | une garde à franchir, ou un objectif secondaire | un build contre les gardes |

Chacun choisit son rôle à l'avance (**Récolter, Préparer, Reconnaître, Escorter**) ; les officiers fixent la politique (« protéger d'abord la cargaison »). Chaque inscrit a **six ordres de 20 minutes** sur la semaine (deux heures en tout, engagées en une fois). Récompense personnelle : une petite réserve de matières et des jetons de contrat ; récompense du clan : du Renom.

### 7.3 Le classement des caravanes

Pas une activité de plus : **le score de la caravane, comparé à celui des autres clans**.
- **Chaque dimanche**, le Panneau affiche la place de ta caravane parmi les clans **de même taille d'équipe** (3, 6 ou 12 joueurs) : un petit clan n'est pas comparé à un gros.
- **À la fin de la saison**, on additionne les quatre meilleures semaines sur six (rater deux semaines ne coûte rien) ; les meilleurs clans de chaque taille reçoivent une **bannière d'or, d'argent ou de bronze** pour leur halle, et un titre pour l'équipe. Rien d'autre.

---

## 8. Une saison de six semaines

| Semaine | Ce qui se passe |
|---|---|
| 1 | La Marée monte plus haut : **la mutation de la saison** (elle tord une réserve, `build.md` §6.5) touche aussi la Marée du soir, la route saisonnière s'ouvre, le Concours annonce son thème |
| 1 à 6 | la Marée du soir chaque soir, le coffre chaque dimanche, une Route franche par semaine |
| 4 | résultats du Concours ; nouveau thème |
| 6 | dernière semaine : la Marée du dernier soir est une **Grande Marée** spéciale (les trois Marées à la suite, deux heures, un titre de saison) ; fin du classement des caravanes |

Rien n'est remis à zéro : ni le personnage, ni ses objets, ni ses records permanents, ni le Renom.

---

## 9. Respecter le temps des joueurs

1. **Un seul rendez-vous à heure fixe, la Marée du soir**, et on peut y participer sans être là (engagement à l'avance).
2. **Rien de quotidien n'est obligatoire.** Le coffre de la Marée compte les 4 meilleurs soirs sur 7 ; les contrats se gardent deux semaines ; le classement des caravanes garde 4 semaines sur 6.
3. **Préparer prend 1 à 5 minutes**, le reste se joue en autonomie.
4. **Celui qui est là gagne plus, celui qui est absent ne perd rien** : la présence rapporte des éclats, du prestige et un petit bonus de points ; jamais de pénalité.
5. **Ce qu'on rate revient** : les apparences de Marée s'achètent en éclats, les donjons n'ont pas de verrou quotidien.
6. **Le meilleur build va plus vite, le casu arrive au même endroit.** Toutes les récompenses de base sont accessibles à un build moyen.

### Trois semaines types

| | Le casu (20 min par jour) | Le régulier (1 h par jour) | Le passionné (connecté le soir) |
|---|---|---|---|
| **Combat** | une Patrouille de nuit, la Route quand il passe | Patrouille profonde, donjons en escouade | Patrouille au plus profond, records de donjon |
| **Contrats** | 3 tous les 15 jours (il en garde 6) | 3 par semaine | 3 par semaine |
| **Marée du soir** | engagée automatiquement 4 soirs : coffre plein | 5 à 7 soirs, parfois en direct | tous les soirs en direct : ordres, titres, éclats |
| **Clan** | ses ordres de Route franche | Route franche, Concours | il organise la caravane |
| **Ce qu'il gagne de plus** | — | ~1,5 fois le casu | ~2 à 2,5 fois le casu, surtout en prestige et en apparences |

**À vérifier au simulateur de progression** avant de publier les chiffres.

---

## 10. Où va chaque butin

| Activité | Butin principal | Qui en a besoin |
|---|---|---|
| Patrouilles | vestiges, objets classiques, gemmes brutes, nommé de zone | tout le monde ; les artisans achètent les vestiges, les joailliers les gemmes |
| Route | checkpoints uniques (objet, gemme, +1 % ×3, titres) | le joueur lui-même |
| Contrats | jetons, Poudre de relance, petites réserves | les enchanteurs (Poudre), le joueur |
| Éclaireurs | cartes de gisement, cartes de piste, matières rares | les récolteurs (gisements), les artisans de haut palier, les cuisiniers (vivres) |
| Profondeurs | caches d'ensemble, nommés de gardien, vestiges, apparences | le build ; le marché |
| Marée du soir | éclats, coffre de la semaine (réserves bornées, cache), apparences, titres | tout le monde, sans écart de richesse |
| Concours des Maîtres | poinçon (valeur au marché), titre, Renom | les artisans |
| Routes franches | Renom, réserves, jetons | le clan |

**Aucune activité ne fabrique de l'or neuf** sans fin (règle de l'économie) ; Patrouilles et donjons donnent des objets et des matières, que le marché transforme en or entre joueurs.

---

## 11. Ce qu'il faut construire

| Morceau | Ce que c'est | Taille |
|---|---|---|
| **Modes de rencontre** : survie, escorte, fuyards, coffre gardé | dans le moteur de combat : une condition de victoire autre que « tout tuer », un allié du jeu avec ses PV, des cibles qui partent | moyen ; inactif par défaut, avec tests de conservation |
| **La Marée du soir** | une heure à heure fixe : vagues continues, score au lieu d'une victoire, engagement automatique des absents, reprise de l'activité à 21 h, ordres en direct, jauge du serveur | **gros**, c'est la première entorse au « calcul à la demande » : il faut une tâche du serveur qui ouvre et ferme la Marée |
| **Points de Marée normalisés** | dégâts de référence par minute pour chaque palier (mesurés par le simulateur, rangés dans les données) | petit |
| **Contrats du Panneau** | tirage hebdomadaire, compteurs qui avancent dans `advance`, report sur deux semaines | petit |
| **Éclaireurs** (si gardés) | une activité parallèle bornée, une escorte simulée, des tables de butin | moyen |
| **Donjons** | déjà mesurés au simulateur (`combat-dungeon`) ; reste le jeu réel, les escouades hors ligne | gros |
| **Renom, rangs, bannières** | compteurs de clan, seuils, classement par taille d'équipe | petit à moyen |
| **Concours des Maîtres** | inscription d'une pièce, notation automatique, poinçon sur l'exemplaire | moyen |

Ordre que je recommande : **les Patrouilles avec profondeur et contrats** (le quotidien), puis **la Marée du soir** (le rendez-vous, en commençant par la Débâcle), puis **la Route avec ses types d'étapes**, puis **un donjon**, puis le clan.
