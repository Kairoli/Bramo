# Les événements : système, affichage, visuels

> **Statut** : conçu le 24 octobre 2026 (soir), à la demande de Louis : « comment seront affichés les événements en jeu,
> quels visuels sont nécessaires ; regarde comment font les jeux connus ». **Rien n'est codé**, tout est **proposé par
> Claude**. Ce document range ce qui existe déjà (la Marée du soir, les saisons numérotées, les Routes franches, le Concours
> des Maîtres, le Banquet) dans **une seule machine à événements**, pour ne pas recoder l'affichage à chaque fois.

## 1. Ce que font les jeux d'aujourd'hui

| Jeu | Ce qu'on en garde |
|---|---|
| **Legend of Mushroom, AFK Journey, Genshin Impact** | une grappe d'icônes d'événement sur l'écran d'accueil, chacune avec son **compte à rebours** et une **pastille rouge** quand il y a quelque chose à prendre ; un **menu Événements** avec une carte par événement (grande illustration, minuteur, avancée) ; la page d'un événement en onglets (objectifs, classement, boutique, règles). |
| **World of Warcraft, Destiny** | un **calendrier** dans le jeu, qui montre aussi ce qui vient (on revient le jour J). |
| **Path of Exile, Diablo IV** | la saison change une règle du jeu (mutateur) et le dit partout ; une **piste de récompenses** à paliers. |
| **RuneScape, Old School** | les **week-ends à bonus** (XP d'un métier), annoncés à l'avance, et les événements de fêtes qui **déguisent le monde** (le bourg décoré, des PNJ de saison). |
| **Clash of Clans, Dofus (Kolizéum, défis de guilde)** | l'événement de **clan** de la semaine, avec un classement entre clans. |
| **Guides LiveOps** (Roblox, studios mobiles) | un rythme en trois couches : **grands** événements (4 à 8 semaines), **moyens** (1 à 2 semaines), **courts** (24 à 72 h, le week-end est le meilleur moment) ; **12 à 24 h de respiration** entre deux événements compétitifs ; **annoncer à l'avance** (bandeau, fenêtre à la connexion) pour que les joueurs reviennent le jour J. |

Ce que Bramo garde de ses propres principes : **on ne punit jamais l'absent** (une récompense gagnée et pas réclamée arrive
dans la boîte aux lettres, jamais perdue ; on progresse aussi hors ligne), **le casu suit** (un tryhard 2 à 2,5 fois plus
vite, jamais 10 fois), **personne n'est exclu** (combat, ravitaillement, récolte, logistique : `combat-items.md` §3.3), **le
payant ne vend que du cosmétique**, et **une mutation de saison ne dépasse pas 10 %** [Décidé par Louis pour les saisons].

## 2. Le calendrier proposé

| Rythme | Événement | État |
|---|---|---|
| **Chaque soir** | **La Marée du soir** (20 h, une heure, trois types en rotation) | existe |
| **Chaque semaine** | **Les Routes franches** : la caravane du clan (du lundi au dimanche, classement par taille d'équipe) | conçu (`contenu/le-monde.md`) |
| **Chaque semaine** | **Le Concours des Maîtres** : un métier à l'honneur, une commande à remplir au mieux (quantité et chefs-d'œuvre), score normalisé, poinçon pour les meilleurs | conçu (`le-monde.md`) |
| **Un week-end sur deux** | **Un week-end du bourg** (du vendredi 18 h au dimanche minuit), un seul à la fois, tiré dans une liste : *la Foire* (taxe du marché 3 %, commandes PNJ doublées), *la Fièvre du filon* (+10 % dans deux métiers de récolte), *les Feux de forge* (+10 % dans deux métiers d'artisanat), *la Nuit blanche* (+10 % d'XP de classe), *le Grand Banquet* (repas qui durent deux fois plus) | nouveau |
| **Une fois par mois** | **Le Gardien errant** : un boss du serveur qui reste 48 h, chacun contribue à son rythme (combat, fournitures, matières, livraisons), un seuil proportionnel aux joueurs actifs, des récompenses par palier de contribution | idée de `monde.md` §2, à faire |
| **Dix semaines** | **La saison numérotée** (Saison 1, les Pages du Notaire : quatre actes, feuillets, boutique, trois mutateurs à 10 % au plus) | conçue (`saisons/saison-1.md`) |
| **Fêtes** | **La Veillée des Courges** (Halloween), le Givre (fin décembre)… : une à deux semaines, le bourg décoré, une boutique de cosmétiques | essai d'Halloween dessiné (`eclats.md` §9) |

Règles du calendrier : jamais deux événements **compétitifs** qui se chevauchent sans 12 h de pause ; au plus **deux
bandeaux** en même temps dans la barre du haut (la place est déjà prévue : `Banners events`) ; chaque événement est
**annoncé 48 h avant** (bandeau « dans 2 jours », ligne au calendrier).

## 3. Comment le joueur les voit

### 3.1 La barre du haut : deux bandeaux

Le plus important des événements en cours (ou le prochain qui commence dans l'heure) prend un bandeau : **icône, nom, compte
à rebours, une barre d'avancée** (« Digue 64 % », « Caravane 3/5 étapes »), et une **pastille** quand une récompense attend.
Un clic ouvre sa page. C'est ce que fait déjà la Marée.

### 3.2 Le menu Événements

Un bouton **Événements** (étoile, à côté des bandeaux) avec le nombre de pastilles. Il ouvre une grande fenêtre :

- **En cours** : une carte par événement, avec sa **grande illustration** (bandeau 3:1, le même format que les décors des
  métiers), son minuteur, son avancée et un bouton.
- **Bientôt** : les événements des 7 prochains jours, avec leur jour et leur heure.
- **Calendrier** : le mois, une couleur par sorte (Marée, semaine, week-end, saison, fête).

### 3.3 La page d'un événement (un seul modèle pour tous)

En haut, l'illustration et le minuteur ; en dessous, des onglets qui n'apparaissent que s'ils servent :

- **Objectifs** : une **piste de paliers** (une barre avec des coffres) et les tâches (« Livrer 200 lingots de fer »,
  « 30 victoires sur la route ») avec, pour chaque tâche, **où la faire** (le même principe que « Où l'obtenir » : un clic
  mène à la salle). Les tâches comptent aussi ce qui se fait hors ligne.
- **Classement** : personnel, clan, ou par catégorie (comme le classement de la Marée).
- **Boutique** : la monnaie de l'événement (si elle existe) et ce qu'elle achète.
- **Règles** : trois lignes, pas plus (Louis : « trop de texte, les joueurs s'habituent »), le reste dans une bulle « ? ».

### 3.4 Le monde qui change

C'est ce qui fait sentir un événement plus que n'importe quel bandeau :

- **Le bourg se déguise** : un calque transparent posé sur l'illustration du bourg (citrouilles et lanternes pour la Veillée,
  guirlandes et étals pour la Foire, neige pour le Givre) et ses **particules** (le moteur `Scene` sait déjà en faire par
  lieu : feuilles, braises, brume).
- **Un personnage d'événement** au bourg (un forain pour la Foire, Odile la copiste pour la saison), qui ouvre la page de
  l'événement.
- **Le fil du serveur** annonce les grands moments (« la caravane du clan Les Rameurs est arrivée », « le Gardien errant
  est à 50 % »).
- **Le journal** a sa couleur d'événement (le jeton `--event`, déjà dans la palette).

### 3.5 Le début et la fin

- **Au début** : une fenêtre à la connexion (une fois), l'illustration, une phrase, « Voir l'événement ».
- **À la fin** : un récapitulatif (ce que le serveur a fait, ce que le joueur a gagné, sa place), comme celui de la Marée.
  Ce qui n'a pas été réclamé **part dans la boîte aux lettres** ([`admin.md`](admin.md) §2.7).

## 4. Les visuels nécessaires

Par événement :

| Visuel | Format | Usage |
|---|---|---|
| **Illustration** | 3200 × 640 px (3:1), sujet à droite (comme les décors des métiers) ; un recadrage 16:9 pour le téléphone | menu Événements, page de l'événement, fenêtre de début |
| **Icône** | 256 px, fond transparent, lisible à 32 px | bandeau, menu, calendrier |
| **Monnaie** (si elle existe) | 128 px | boutique, gains |
| **Calque du bourg** | 2172 × 724 px, transparent | le bourg déguisé (fêtes, Foire) |
| **Récompenses** | les tenues et pièces en SVG du système de personnages ; les ornements en PNG | boutique, piste de paliers |
| **Ennemi** (si combat) | dessin animé du bestiaire (`combat-fx/bestiary/`) | Gardien errant, Marée exceptionnelle |

Une seule fois pour tous les événements (l'habillage commun) : le cadre des cartes, la piste de paliers et ses **coffres en
trois tailles**, la pastille, la puce de minuteur, le ruban « Nouveau », les quatre couleurs du calendrier. Ils se dessinent en
SVG dans le jeu ; seules les illustrations et les icônes viennent de ChatGPT (projet « Claude », comme les décors).

**Pour lancer le système** : les illustrations de la Marée (elles existent dans `docs/design/maree/`), des Routes franches,
du Concours des Maîtres, des cinq week-ends du bourg, du Gardien errant et de la Saison 1. Le calque d'Halloween est le
premier à faire si on veut l'essayer pour le 31 octobre.

## 5. La machine (pour le code)

- **`data/events.yaml`** : les modèles d'événement : sorte (`daily`, `weekly`, `weekend`, `monthly`, `season`, `holiday`),
  calendrier (jours et heures, fuseau de Paris), mutateurs (catégorie de bonus « Saison », déjà prévue par les plafonds),
  objectifs (types de tâches que le serveur sait compter : objets livrés, recettes faites, victoires, points de Marée, or
  dépensé), paliers et récompenses, monnaie, visuels (illustration, icône, calque, particules).
- **Serveur** : une table des **occurrences** (programmé, en cours, fini ; créée à partir du calendrier, ou par la console
  admin), une table des **contributions** par personnage, la remise des récompenses à son passage (comme le marché), le
  reste dans la boîte aux lettres. Les tâches se comptent **là où le jeu les fait déjà** (`play()`, marché, commandes) : le
  même résultat en ligne et hors ligne.
- **Client** : `Banners` (existe), le menu Événements, **une seule page d'événement** qui lit le modèle, le calque du bourg.
- **Console admin** : programmer, avancer, arrêter, compenser ([`admin.md`](admin.md) §2.6).

**Ordre proposé** : la machine et la page commune, avec un premier week-end du bourg (le plus simple : un mutateur, deux
tâches, une piste) ; puis le Concours des Maîtres et les Routes franches ; puis le Gardien errant ; la saison réutilise tout.

## 6. À trancher par Louis

1. Les **week-ends du bourg** à +10 % (comme les mutateurs de saison) ou un vrai « double XP » de temps en temps (on le voit
   partout, mais il creuse l'écart entre celui qui joue ce week-end et les autres) ?
2. Les **fêtes** (Halloween, Givre) reviennent-elles chaque année, avec des cosmétiques nouveaux à chaque fois, alors que les
   saisons, elles, ne reviennent jamais ?
3. Le **Gardien errant** chaque mois, ou seulement pendant les saisons (une fois par acte) ?
