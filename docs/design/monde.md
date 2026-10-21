# Classes, événements récurrents et clans

> **Statut** : chaque point est marqué **[Décidé]**, **[Recommandé]** ou **[Ouvert]**. Arbitrages regroupés dans [`arbitrages.md`](arbitrages.md).

## 1. Classes, voies et métiers

### Décidé
- **Un métier principal commun aux trois voies d'une classe** : Forgefeu → Forge, Traqueur → Chasse, Runiste → Enchantement, Artificier → Artificerie, Alchimiste → Alchimie.
- Le bonus de métier reste **modeste** et s'évalue avec les autres sources de puissance.
- Les autres métiers enrichissent les builds par leurs objets et consommables, accessibles par le commerce ou la commande. Pas une classe de combat par métier.

### Budget de puissance [Recommandé]

Le v1.0 répartit la puissance en niveau de classe (~40 %), équipement (~35 %) et build (~25 %). Écarts typiques à l'intérieur de l'équipement : un palier d'équipement ≈ +15 %, une qualité (Normale → Supérieure) ≈ +5 %, un enchantement ≈ +5 à 8 %, un repas de combat ≈ +5 %.

Avec l'affinité du v1.0 (+1 % par tranche de 10 niveaux, **jusqu'à +10 %**), ne pas monter son métier coûterait l'équivalent de deux qualités d'équipement : le métier deviendrait obligatoire. **Proposition : plafonner l'affinité à +5 %** (+0,5 % par tranche de 10 niveaux), soit l'équivalent d'une qualité, et mettre l'essentiel de la valeur du métier dans **ce qu'il permet de fabriquer** pour sa voie.

### Le métier principal selon la voie [Recommandé]

Règle : chaque voie a un **consommable ou un service signature** que son métier fabrique. Il est **aussi achetable** ; le faire soi-même donne seulement la qualité « maison » (+durée ou +qualité), jamais un accès exclusif. Aucune voie n'exige un second métier à haut niveau.

| Classe (métier) | Dégâts | Contrôle | Soutien |
|---|---|---|---|
| Forgefeu (Forge) | Trempe-Rouge : **pierres d'affûtage** (bonus de dégâts pour N combats) | Enclumier : **fers de garde** (étourdissement renforcé) | Rémouleur : **kits de réparation** ; répare l'équipement du groupe en combat (−20 % d'usure pour les alliés) |
| Traqueur (Chasse) | Tue-Bête : **appâts et venins de chasse** pour les flèches | Piégeur : **collets** (les pièges complexes restent à l'Artificerie) | Meneur de meute : **viande séchée** qui nourrit le compagnon |
| Runiste (Enchantement) | Fulgurant : **runes de foudre** consommables | Sigillaire : **sceaux** posés sur l'ennemi | Glyphiste : **glyphes de garde** posés sur les alliés |
| Artificier (Artificerie) | Pétardier : **bombes** | Fumiste : **fumigènes** | Horloger : **automates** de soutien |
| Alchimiste (Alchimie) | Transmutateur : **fioles acides** | Fiévreux : **poisons** | Élixirier : **potions de soin améliorées** |

Passif au rang du niveau 80 du métier principal ([`rangs.md`](rangs.md)) : **qualitatif**, lié au métier (ex. Rémouleur : les objets qu'il répare perdent 10 % de durabilité maximale au lieu de 15 %). Pas de pourcentage de dégâts en plus.

### [Ouvert]
- Changer de voie reste gratuit en ville (v1.0) : à confirmer avec les consommables signature (on garde ses stocks).
- Niveau de déblocage des classes de métier : 40 (v1.0), à relever avec la nouvelle progression : Alchimie 40 prendrait ~2 jours en achetant ses herbes, ~4 jours en les cueillant. **Recommandation : 60** (2 à 3 semaines), pour que la classe de métier reste un objectif du premier mois.

## 2. Saisons → événements récurrents

### Décidé
- **Progression permanente conservée** : personnages, métiers, stocks, or, réalisations. Les remises à zéro du v1.0 (classement, monnaie, bâtiments de saison) sont **à revoir dans ce sens**.
- Les contenus peuvent revenir en rerun ; pas d'exclusivité définitive.

### Proposition [Recommandé]

**Calendrier** : quatre événements par an (Givre, Marées, Moisson, Braises), **4 semaines** chacun, revenant chaque année, séparés par 8 semaines sans événement majeur (rencontres de 48 h seulement). Le rythme laisse respirer un petit serveur.

**Pendant l'événement** :
- **Ressources d'événement** récoltées par les métiers existants dans un lieu temporaire (fleur de givre éternelle en Herboristerie, glace runique en Minage…). Aucun nouveau métier.
- **Recettes d'événement**, apprises une fois pour toutes.
- **Rencontres** asynchrones de 48 h (contributions, seuil proportionnel aux joueurs actifs) et un **gardien d'événement** à affronter en combat idle, avec contribution cumulée sur la semaine.
- **Mutation** : +20 % de vitesse dans un ou deux métiers thématiques (catégorie de bonus « Saison », déjà prévue). Elle vaut pour tous, donc elle ne creuse pas l'écart entre joueurs.
- **Cosmétiques** et **ensemble thématique** (voir ci-dessous).
- **Jetons d'événement** gagnés par participation, dépensés à la boutique de l'événement.

**Après l'événement** :
- Les ressources et objets restent utilisables et échangeables. Les recettes restent connues ; seules leurs ressources propres ne se récoltent plus.
- Les **jetons ne disparaissent pas** : ils attendent le rerun suivant. Une partie peut se convertir en **Souvenirs**, une monnaie permanente pour les cosmétiques des événements passés.
- Le lieu ferme ; l'Exploration peut y trouver hors saison de petites quantités de ses ressources (curiosités), à un rythme bien plus lent.

**Ensemble thématique et builds** :
- Un ensemble d'événement est **latéral** : même budget de puissance que l'équipement de son palier, avec un bonus d'ensemble **de situation** (résistance au froid contre le gardien du Givre, durée des repas, rendement d'un métier thématique).
- Il ne peut jamais être indispensable à un build. S'il le devient (constaté au simulateur de combat), on ajoute un équivalent permanent au contenu de base.
- Ses pièces restent fabricables toute l'année avec les matériaux d'événement en stock ou trouvés par l'Exploration. Chaque rerun ajoute une pièce ou une variante, sans rendre les anciennes inutiles.

**Exemple : le Givre** — Herboristerie et Minage mis en avant (+20 %) ; ressources : fleur de givre éternelle, glace runique ; recettes : Festin du solstice (Cuisine), Rune de glace (Enchantement), Manteau de givre (Couture, ensemble de magie) ; gardien : la Wyverne des cimes ; cosmétiques : tenue « Givre » et effet de flocons.

### [Ouvert]
- Ligues ou classements d'événement : seulement des classements **de contribution**, sans récompense de puissance ? Recommandation : oui, récompenses cosmétiques.
- Taux de conversion jetons → Souvenirs.

## 3. Clans

### Décidé
- Les clans sont un axe social important ; leur fonctionnement est un chantier ouvert.
- Pas de chantier commun au serveur : les objectifs collectifs passent par les clans.

### Clarification des plafonds de bonus [Recommandé]

Le v1.0 annonce à la fois des « filons de clan à +5 % par membre présent, plafonnés à +40 % » et un « bonus de clan plafonné à +10 % ». Les deux ne tiennent pas ensemble, et le premier dépend de la présence simultanée. Proposition :

| Catégorie | Plafond | Sources | Règle |
|---|---|---|---|
| Outil | +30 % | Meilleur outil du métier | Inchangée |
| Repas | +10 % | Un repas actif | Garde-manger automatique |
| **Lieu** | **+25 %** | Carte de gisement (Exploration), **filon de clan** | On prend la meilleure source, pas la somme |
| **Clan** | **+10 %**, toutes sources confondues | Bâtiments de la halle, postes d'experts | Pour tous les membres, actifs ou non |
| Saison | +20 % | Mutation d'événement | Pour tous |

- Le **filon de clan** devient une **expédition de clan** : les membres livrent des provisions et des outils au projet ; quand il est complet, un filon riche s'ouvre **pour tous les membres pendant 48 h**, qu'ils soient connectés ou non. Il entre dans la catégorie « Lieu », pas « Clan ».
- Cumul maximal : 1 + 0,30 + 0,10 + 0,25 + 0,10 + 0,20 = **×1,95**. Un casu avec outil et clan a ×1,4. L'écart de bonus reste donc sous ×1,4, et l'écart total de progression simulé reste sous ×2 (voir `presence.md`).

### Usages concrets [Recommandé]

- **Entrepôt** : stock commun avec des droits par rang (déposer pour tous, retirer selon le rang, plafond de retrait par semaine pour les nouveaux), journal des mouvements, **réserves de projet** (ce qui est déposé pour un chantier ne peut plus en sortir).
- **Commandes internes** : sans taxe, affichées au tableau du clan, honorées en différé ; elles alimentent le classement interne de contribution.
- **Projets** (Construction) : bâtiments de la halle, chacun avec une fonction :
  - Entrepôt agrandi (capacité) ; **champs du clan** (parcelles d'Agriculture en plus pour chaque membre) ; **ateliers** (postes qui ouvrent des recettes) ; **bonus de clan** par niveaux, +2 % par niveau jusqu'à +10 % ; bannières et décor (cosmétique).
  - Le coût d'un projet est proportionnel au nombre de membres **actifs sur 14 jours**, avec un minimum de 3 : un petit clan bâtit aussi vite par tête qu'un grand.
- **Postes d'experts** : un membre qui a le surnom du niveau 80 d'un métier ([`rangs.md`](rangs.md)) peut occuper le poste correspondant. Effet : il peut accepter les **commandes d'expert** du clan (recettes de qualité) et donne +2 % dans ce métier aux membres, **compté dans le plafond Clan de +10 %**. Avec le surnom du niveau 60, un poste d'« adjoint » existe, sans bonus mais avec les commandes, pour que les clans jeunes aient aussi des rôles.

### Un clan à construire [Décidé par Louis le 21 octobre, prototype]

Louis : « un clan à construire, avec des bâtiments qui donnent des boosts, constructibles par les membres ». **L'entrepôt commun est retiré** (« pas sûr encore »). Dans le code (`apps/server/src/clans.ts`, `data/buildings.yaml`, salle Clan) :
- **Fonder** un clan (500 or, nom unique de 3 à 24 caractères), **rejoindre** un clan ouvert (30 membres au plus), **quitter**. Rangs **chef, officier, membre** (nommer, rétrograder, passer la main, exclure ; le chef ne part qu'après avoir transféré la direction, ou dissout un clan où il est seul).
- **Un mini-village de huit bâtiments** à trois niveaux (Louis : « des bâtiments plus globaux, un mini-village : une forge, un champ… », car le jeu compte 17 métiers) : la **Halle** (+1 % de toute production par niveau) et sept bâtiments qui accélèrent chacun **un groupe de métiers voisins** de +2 % par niveau : **Forge** (Minage, Forge, Joaillerie), **Scierie** (Bûcheronnage, Menuiserie, Construction), **Champs et jardins** (Agriculture, Herboristerie), **Embarcadère** (Pêche, Exploration), **Pavillon de chasse** (Chasse, Tannerie, Couture), **Tour des arcanes** (Alchimie, Enchantement, Artificerie) et **Taverne** (Cuisine). Les 17 métiers sont couverts, y compris les 10 pas encore jouables. Tout est dans `data/buildings.yaml` (`boost.professions`) : ajouter un bâtiment ou un métier à un groupe, c'est éditer une ligne.
- **Construits par les membres** : chacun apporte de l'**or** et des **matériaux** (objets) au prochain niveau ; l'apport est plafonné à ce qu'il manque ; quand tout est réuni, le bâtiment monte pour tous. Coût du niveau N = base × N, proportionnel au **nombre de membres actifs sur 14 jours** (au moins 3 : un petit clan bâtit aussi vite par tête qu'un grand). L'or est détruit : c'est un puits d'or, et les matériaux sont un débouché pour les métiers.
- **Bonus** : la **Guilde du bourg** (+3 % de toute production, pour tout le monde) plus les bâtiments du clan, le tout **plafonné à +10 %** (`bonusCaps.clan`). Un absent garde son bonus. Un clan maximal (halle 3 % + le bâtiment du groupe à 6 %) atteint le plafond de 10 % pour ces métiers.
- Journal du clan (apports, niveaux atteints, arrivées) et annonce sur le fil du serveur quand un bâtiment est achevé.
- **Pas encore fait** : commandes internes, postes d'experts (surnom du palier 80, [`rangs.md`](rangs.md)), halle visible et décor, invitations, chat de clan, **le métier Construction** (les bâtiments se financent aujourd'hui par des apports, pas par un métier), bâtiments au-delà des métiers de récolte et de fabrication, rôle de l'entrepôt (à rediscuter).

### Petites communautés, nouveaux et occasionnels [Recommandé]

- **La Guilde du bourg** : un clan PNJ que tout joueur sans clan rejoint d'office (entrepôt modeste, commandes internes, bonus de clan +3 %). Personne ne joue seul faute d'avoir trouvé un clan, et le recrutement s'y fait naturellement.
- **Nouveaux membres** : bonus de clan immédiat ; période d'essai de 7 jours avec retrait limité de l'entrepôt.
- **Occasionnels** : aucune contribution minimale ; aucun bonus n'est retiré à un absent ; les contributions sont comptées par semaine, pour des classements internes, pas pour des droits.
- **Taille** : de 3 à 30 membres. Sur un serveur de 20 à 50 joueurs, il y aura deux à cinq clans ; les alliances (commandes ouvertes entre deux clans) sont une extension possible.

### [Ouvert]
- Entretien de la halle en or : proportionnel à l'usage (stockage occupé, ateliers utilisés), jamais à l'absence. Montant à régler au simulateur.
- Ligues de clans par divisions (v1.0) : à reporter après le combat, et à réserver à des récompenses cosmétiques.
