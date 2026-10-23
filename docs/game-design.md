# Bramo — game design

> Document de référence. Les valeurs qui font foi pour le jeu sont dans `data/` (marquées `# à équilibrer` tant qu'elles sont provisoires).
>
> **Chaque point porte son statut** :
> - **[Décidé]** — choix de Louis, à respecter ;
> - **[Recommandé]** — proposition argumentée et chiffrée, en attente d'arbitrage (liste dans [`design/arbitrages.md`](design/arbitrages.md)) ;
> - **[Ouvert]** — question sans réponse ;
> - **[Prototype]** — ce que fait le code aujourd'hui, en attendant l'arbitrage.
>
> Conception détaillée (21 octobre 2026) : [`design/metiers.md`](design/metiers.md) (écosystème des métiers), [`design/progression.md`](design/progression.md), [`design/presence.md`](design/presence.md) (hors ligne et participation), [`design/economie.md`](design/economie.md), [`design/monde.md`](design/monde.md) (classes, événements, clans), [`design/rangs.md`](design/rangs.md) (surnoms et commandes du maître), [`design/arbitrages.md`](design/arbitrages.md). Les chiffres viennent du simulateur : [`../sim/reports/rapport.md`](../sim/reports/rapport.md).

## 1. Vision [Décidé]

Idle-RPG multijoueur dans le navigateur, dans l'esprit de SimpleMMO, Melvor Idle et RuneScape, sur un **serveur persistant unique**. On monte des métiers, on choisit une classe, on rejoint un clan, on commerce sur un marché, on vit des événements. Cible : plusieurs dizaines, potentiellement plusieurs centaines de joueurs. Une personne qui arrive plusieurs mois après l'ouverture doit pouvoir commencer normalement et trouver sa place.

Le jeu est **casu dans l'ensemble** : on y passe quelques minutes plusieurs fois par jour, et l'absence ne coûte jamais rien.

## 2. Piliers [Décidé]

| Pilier | Ce que ça veut dire concrètement |
|---|---|
| Personne n'est bloqué, personne ne fait tout seul | Tout métier peut se monter seul, mais le temps nécessaire pousse à se spécialiser et à échanger (marché, clan). Tout reste praticable en solo avec suffisamment de temps. |
| Casu d'abord | Écart tryhard / casu visé : **×2 à ×2,5**, jamais ×10. Indicateurs auxquels il s'applique : [`design/presence.md`](design/presence.md) §5 (pas à la richesse du commerce). |
| Récompenser le présent, ne jamais punir l'absent | Aucune perte, pénalité ou dégradation pendant l'absence. L'usure suit les actions réellement réalisées (hors ligne compris) ; un personnage arrêté ne se dégrade pas. |
| Payant = confort et cosmétique | Jamais de statistiques ni de ressources à vendre. |
| Serveur autoritaire | Tous les calculs côté serveur ; le client affiche. |
| Progression permanente | Personnages, métiers, stocks, or et réalisations ne sont jamais remis à zéro. |

## 3. Progression des métiers

### 3.1 Courbe d'XP
- [Décidé] Niveaux 1 à 99. Les rangs sont des **surnoms propres à chaque métier** (§3.2), et non plus des titres génériques.
- [Décidé, 21 octobre] **Courbe de RuneScape conservée** : `XP(L) = floor( Σ_{l=1}^{L-1} floor(l + 300 · 2^(l/7)) / 4 )`, niveau 99 = 13 034 431 XP. **Recettes recalibrées** : XP par heure effective `R(L) = 400 × 2^((L−1)/55)` pour la meilleure récolte d'un palier, artisanat ×1,75. **Pas d'XP doublée en début de métier.** Mesuré pour un spécialiste régulier : 30 en ~1 jour, 60 en ~2 semaines, 85 en ~3,3 mois, 90 en ~5,2 mois, 99 en ~11 mois ([`design/progression.md`](design/progression.md)). Appliqué dans `data/`.
- Avant le 21 octobre (mesuré) : Minage 60 en ~1 jour, 90 en 18 jours avec 2 h de présence par jour. Jugé beaucoup trop rapide.

### 3.2 Rangs : surnoms et commandes du maître [Décidé le 21 octobre, pas encore implémenté]
Détail : [`design/rangs.md`](design/rangs.md). Remplace les titres Novice / Apprenti / Compagnon / Maître / Grand maître et les épreuves des niveaux 30 et 60.
- Les rangs sont des **surnoms amusants propres à chaque métier** (Cuisine, pistes : « Remueur de marmites », « Fournisseur de siestes », « Terreur des buffets », « Celui qui régale les rois »).
- Aux niveaux **20, 40, 60 et 80**, le maître du métier propose une **commande spéciale** ; la réussir accorde le surnom et **débloque la tranche de progression suivante**. Une **commande finale exceptionnelle** au niveau **99**.
- Chaque commande raconte une **petite histoire, idéalement drôle**, qui explique le surnom (« Fournisseur de siestes » : un banquet si copieux que toute une délégation s'endort avant les discours).
- Elle repose sur les **activités automatiques** : récolte ou fabrication spéciale, préparation, livraison. **Aucun mini-jeu manuel obligatoire.**
- Le joueur **affiche le surnom de son choix** parmi ceux qu'il a débloqués.
- Pas de quête journalière ni de chantier commun au serveur : les objectifs collectifs passent par les clans, les boosts par les événements.
- [Prototype, fait le 21 octobre] Commandes, noms et histoires écrits (35 commandes), **XP en attente** : l'XP continue de s'accumuler au-delà du palier et se débloque à la validation (choix de Claude, à valider ; voir `design/rangs.md`).

### 3.3 Maîtrise après 99 *(plus tard)*
Paliers au rendement décroissant, plafonnés à **+10 %** au total.

### 3.4 Objets faits maison *(plus tard)*
Signés par l'artisan. [Décidé par Louis, 21 octobre] **Plus de qualité Normale / Supérieure / Rare** : quatre raretés propres au modèle d'objet, une ligne variable par exemplaire, et un exemplaire **Chef-d'œuvre** (jet maximal, signé) rare. La chance d'en fabriquer monte avec l'écart entre le niveau de l'artisan et celui de la recette. Détail : [`design/combat-items.md`](design/combat-items.md) §5.

## 4. Métiers

- [Décidé] Ouvert à 20–30 métiers **si chacun apporte une activité intéressante et une utilité réelle**. Agriculture et Joaillerie intéressent particulièrement Louis.
- [Recommandé] **17 métiers et 3 extensions, ouverts par phases** ([`design/metiers.md`](design/metiers.md)) :
  - Récolte : Minage, Bûcheronnage, Herboristerie, Pêche, **Agriculture** (parcelles en temps réel), Chasse ;
  - Artisanat : Forge (outils de tous les métiers), Menuiserie (manches, archerie), Cuisine, Alchimie, **Tannerie** (séparée de la Couture), Couture, **Joaillerie**, Enchantement, Artificerie ;
  - Monde : **Construction** (le grand puits : atelier personnel et halle du clan), **Exploration** (cartes de gisement, curiosités, sites) ;
  - Extensions : Élevage, Archéologie, Dressage.
- [Prototype] `data/professions.yaml` liste les 17 métiers proposés ; **6 sont jouables** (Minage, Bûcheronnage, Herboristerie, Forge, Menuiserie, Cuisine), avec un outil par métier (fer d'outil de la Forge + manche de la Menuiserie) et des épreuves 30 et 60 pour chacun (ancienne règle de rangs, à remplacer : §3.2). **La Pêche est jouable depuis le 21 octobre** (7 métiers jouables) : il n'y a plus de marchand PNJ.
- [Décidé] **Usure** : elle suit les heures d'usage réel ; un objet usé se répare et **ne perd jamais de durabilité maximale** (un objet qu'on aime ne se détruit pas). [Prototype] Dans le moteur depuis le 21 octobre : les outils s'usent au temps de travail effectif (40 / 60 / 90 h selon le métal), un outil usé ne donne plus son bonus mais reste dans le sac, réparation chez le PNJ (50 % de la valeur au prorata de l'usure), recyclage à 40 %, garde-manger automatique. Réparation par un artisan (30 % des matériaux, commande) : avec le marché.

## 5. Boucle idle

### 5.1 Une activité à la fois [Décidé]
- Une seule activité de métier en cours (un métier, une recette, une quantité) et une **file d'actions** (longueur 3 en réglage) ; le combat (la route) tourne à côté, en continu (décision de Louis du 22 octobre 2026). Lancer une recette alors qu'une autre tourne : « Lancer à la place de » ou « Ajouter à la file ».
- [Recommandé] Seule exception : les **parcelles d'Agriculture**, qui poussent en temps réel et sont bornées par leur nombre.

### 5.2 Rendement
- [Décidé, 21 octobre] **Rendement unique de 100 %**, en ligne comme hors ligne, pendant **16 h d'autonomie** après la dernière visite. Au-delà, l'activité attend ; rien n'est perdu. Appliqué dans `data/`.
- [Décidé, 21 octobre] **Coups de fouet** à la place de l'énergie quotidienne : ×1,5 pendant 30 min, **deux par jour de jeu**, activés quand le joueur le veut (en ligne comme hors ligne ; un second activé pendant le premier s'y ajoute). Appliqué.
- [Ouvert] Louis envisage un coup de fouet derrière une publicité (retirable avec un abonnement « sans pub », achetable plus tard). À examiner contre le pilier « le payant ne vend que du confort et du cosmétique » : voir [`design/arbitrages.md`](design/arbitrages.md) §2.
- [Recommandé] La participation (commandes, marché, clan, rencontres) est récompensée à part, surtout hors production ([`design/presence.md`](design/presence.md)).
- Avant le 21 octobre : actif 100 %, hors ligne 25 % plafonné à 12 h, énergie ×1,5 sur les 2 premières heures actives ; ×7 de production entre 20 min par jour et un onglet ouvert jour et nuit. Jugé trop favorable à la fenêtre visible.

### 5.3 Bonus (plafonnés, dans les réglages)
| Source | [Prototype] | [Recommandé] |
|---|---|---|
| Outil | +30 % | +30 % (bronze +10 % … orichalque +30 %) |
| Repas | +10 % | +10 %, garde-manger automatique [Décidé] |
| Lieu | — | **+25 %** : carte de gisement ou filon de clan (la meilleure) |
| Clan | +10 % | **+10 % toutes sources confondues** (bâtiments, experts), pour tous les membres |
| Saison | +20 % | +20 % (mutation d'événement, pour tous) |

Les « filons de clan à +5 % par membre présent, plafonnés à +40 % » du v1.0 sont remplacés (ils contredisaient le plafond de clan et dépendaient de la présence simultanée) : voir [`design/monde.md`](design/monde.md) §3.

### 5.4 Calcul à la demande [Décidé]
Aucune boucle serveur permanente. À chaque interaction ou connexion, le serveur recalcule la progression à partir des horodatages, applique les rendements et les bonus, puis enregistre le nouvel état.

### 5.5 Résumé d'absence [Décidé]
À la connexion, une popup s'ouvre seule : durée d'absence, XP gagnée, objets produits, niveaux pris, et une phrase d'explication. Le résumé reste ensuite consultable dans le journal.

## 6. Comptes [Décidé]
Pseudo et mot de passe, un personnage par compte.

## 7. Classes *(combat en P4–P5)*

### 7.1 Classes de base [Décidé]
| Classe | Style | Métier principal |
|---|---|---|
| Forgefeu | Mêlée | Forge |
| Traqueur | Tir | Chasse |
| Runiste | Magie | Enchantement |

Chaque classe a **trois voies** (dégâts, contrôle, soutien) qui partagent le même métier principal. Le bonus de métier reste modeste et s'évalue avec les autres sources de puissance. Choix de la classe à la création, changeable à tout moment et gratuitement. Chaque classe a sa **tenue de départ** et sa **pose** ; à terme, chaque voie aura sa pose.

### 7.2 Progression de classe [Décidé par Louis : un niveau par classe ; sens des paliers proposé]
Chaque classe a **son niveau**, gagné **au combat seulement** (les métiers ne font pas monter la classe) ; changer de classe conserve tous les niveaux. Niveau 30 : **voie** = la spécialisation (dégâts, contrôle, soutien) ; le style vient du build et des sorts choisis. Niveau 75 : éveil (ultime), à confirmer. Taux d'XP, rattrapage, plan de combat, non-combattants : [`design/combat-items.md`](design/combat-items.md) §2.

### 7.3 Classes de métier [Décidé]
**Artificier** (Artificerie), **Alchimiste** (Alchimie). [Prototype du v1.0] Déblocage au niveau 40. [Recommandé] Au niveau 60 avec la nouvelle progression.

### 7.4 Affinité et voies [Recommandé]
Affinité plafonnée à **+5 %** (au lieu de +10 %) ; chaque voie a un **consommable ou service signature** fabriqué par son métier principal, aussi achetable. Aucune voie n'exige un second métier à haut niveau ([`design/monde.md`](design/monde.md) §1).

### 7.5 Triangle de combat
Mêlée > Tir > Magie > Mêlée. [Décidé par Louis, 21 octobre] **Abandonné pour les monstres** (il obligerait à changer de classe selon la rencontre) ; réservé à un éventuel PvP.

## 8. Économie et social

### 8.1 Marché (P2) [Décidé]
Marché entre joueurs : ordres d'achat et de vente, **taxe de 5 %**, commandes artisanales. [Décidé le 21 octobre] **Pas de PNJ qui rachète** ; le PNJ ne passe que X commandes par jour, **propres à chaque joueur et adaptées à ses niveaux** (Comptoir de la guilde), et un **Étal de la guilde** vend les objets de palier 1 seulement quand aucun joueur n'en propose. [Prototype] dans le code : [`design/marche.md`](design/marche.md).
- [Recommandé] L'usure renouvelle la demande mais **n'est pas le puits principal** (elle ne retire que quelques pour cent du travail) ; les puits de volume sont la **Construction**, les consommables et le **recyclage** ; le robinet d'or à tenir est le **Comptoir de la guilde** (X commandes PNJ par jour, [Décidé]) ; il n'y a **aucun rachat PNJ** ([`design/economie.md`](design/economie.md), [`design/marche.md`](design/marche.md)).

### 8.2 Clans (P3)
- [Décidé] Axe social important ; fonctionnement à construire. Pas de chantier commun au serveur.
- [Recommandé] Entrepôt à droits par rang, commandes internes sans taxe, projets de halle (champs, ateliers, bonus jusqu'à +10 %), postes d'experts comptés dans le plafond de clan, **Guilde du bourg** pour les joueurs sans clan ([`design/monde.md`](design/monde.md) §3).

### 8.3 Saisons (P5)
- [Décidé] Progression permanente conservée ; contenus qui reviennent en rerun ; pas d'exclusivité définitive.
- [Décidé par Louis le 24 octobre] **Des saisons numérotées qui ne reviennent jamais** (Saison 1, Saison 2…), comme dans les jeux en ligne, mais **chacune un thème et une histoire** : un chapitre de l'histoire de Bramo, qui laisse le monde changé. Ce ne sont pas les saisons de l'année. Modèle et première suite proposée : [`design/lore/bible-de-bramo.md`](design/lore/bible-de-bramo.md) §13.3.
- [Recommandé, à reprendre dans ce cadre] Ressources et recettes thématiques, rencontres asynchrones, ensembles **latéraux** jamais indispensables, jetons conservés d'une saison à l'autre ([`design/monde.md`](design/monde.md) §2). [Remplacé] Quatre événements par an (Givre, Marées, Moisson, Braises) qui reviennent chaque année.
- [Prototype du v1.0, abandonné] Saisons de 6 semaines avec remise à zéro du classement, de la monnaie et des bâtiments de saison.

## 9. Interface [Décidé]

Maquettes de référence : `docs/maquettes/`
- `1-accueil-resume-absence.png` — accueil avec la popup de résumé d'absence
- `2-accueil.png` — accueil
- `3-metiers-grille.png` — salle Métiers, grille
- `4-metiers-forge.png` — salle d'un métier (Forge)
- `5-runiste.png` — test de style du personnage

### 9.1 Règles générales
- Un accueil et cinq salles : **Accueil, Métiers, Personnage, Clan, Marché, Combat** (six onglets en haut). Tout le reste s'ouvre en popup ou en volet.
- **Aucun scroll de page** : cible 1440×900, correct à 1280×720.
- Squelette commun : **bande visuelle du lieu en haut, contenu en bas**.
- Barre du haut : nom du jeu, onglets, puis à droite l'événement en cours, l'or, le bouton **Coup de fouet** (charges du jour, puis jauge du temps restant), la recherche.
- Police unique **Bricolage Grotesque**, palette « Anthracite et cuivre » (voir `CLAUDE.md`).

### 9.2 Accueil
- [Prototype, fait le 21 octobre] Scène du bourg (décor SVG cliquable, autres joueurs actifs en promenade ou au travail) et Panneau du bourg (fil du serveur : arrivées, niveaux 20/40/60/80/99, épreuves, premières fabrications). Direction choisie : **scène du bourg** où passent d'autres joueurs et **Panneau du bourg** centré sur le **fil du serveur** ; pas de bonus du jour ; commandes de PNJ : [Décidé] X par jour au maximum (Comptoir de la guilde, dans la salle Marché). La carte du monde pourra revenir en popup « Voyager » avec l'Exploration.
- **En bas, trois colonnes** : journal et discussion (Tout / Journal / Clan / Serveur) ; le personnage **en entier** au centre, entouré de ses emplacements ; activité en cours (anneau, gains, file) à droite.

### 9.2 bis Salle Personnage
- Trois colonnes : équipement et apparence et sac ; le personnage centré, entouré de ses emplacements ; les caractéristiques.
- Emplacements : Coiffe, Épaules, Haut, Gants, Ceinture, Cape, Bas, Bottes (cosmétiques) ; Arme (de classe) ; Outil et Repas. [Recommandé] Avec le combat : deux emplacements de bijou (anneau, amulette) et un équipement en deux couches (statistiques et usure ; apparence par-dessus).

### 9.3 Salle Métiers
- Grille de tous les métiers, groupés (Récolte, Artisanat, Monde et clan). Les métiers « Bientôt » en pointillés.
- Un clic ouvre la **salle du métier** : la scène et le maître PNJ en haut ; recettes paginées en **2×3** à gauche ; la recette choisie, sa quantité et la file à droite.

### 9.4 Personnages
Toujours à gauche de la scène, de face mais tourné vers la droite, jamais en miroir. Proportions réalistes. 2D vectorielle en pièces (squelette + tenue), ambiance sombre et lumière colorée des sorts.

## 10. Feuille de route

| Phase | Contenu |
|---|---|
| P0 | Chiffrage et simulateur d'équilibrage — **commencé** (`sim/`) |
| P1 | Prototype solo — fait ; présence, progression et boucle à 6 métiers appliquées le 21 octobre ; reste le marché (réparation par un artisan) |
| P2 | Marché et commandes ; Pêche |
| P3 | Clans, Construction, Agriculture |
| P4 | Combat ; Chasse, Tannerie, Couture, Enchantement, Joaillerie, Alchimie |
| P5 | Événements récurrents, Artificerie, Exploration, classes de métier |
| P6 | Arènes PvP et ouverture |

Ordre détaillé : [`design/arbitrages.md`](design/arbitrages.md) §3.

## 11. Questions ouvertes
- Public visé ; nom du jeu.
- Arrivée du PvP (quand, sous quelle forme).
- Longueur de la file pour les abonnés (confort payant).
- Arbitrages en attente : [`design/arbitrages.md`](design/arbitrages.md).
