# Bramo — contexte projet

Bramo est un **idle-RPG multijoueur jouable dans le navigateur**, dans l'esprit de SimpleMMO, Melvor Idle et RuneScape : métiers, classes, clans, marché, saisons.

- Game design complet : [`docs/game-design.md`](docs/game-design.md) — chaque point y est marqué **[Décidé]** (choix de Louis), **[Recommandé]** (proposition en attente), **[Ouvert]** ou **[Prototype]** (ce que fait le code). Ne jamais présenter une recommandation comme une décision.
- Conception détaillée : [`docs/design/`](docs/design/) (métiers, progression, présence, économie, classes/événements/clans, rangs) et les **arbitrages en attente** : [`docs/design/arbitrages.md`](docs/design/arbitrages.md)
- Simulateur : [`sim/README.md`](sim/README.md), rapport généré [`sim/reports/rapport.md`](sim/reports/rapport.md)
- Maquettes validées : [`docs/maquettes/`](docs/maquettes/) (1-2 accueil, 3-4 salle Métiers, 5 style du personnage)
- Système des personnages : [`art/README.md`](art/README.md)
- Installation et commandes : [`README.md`](README.md)
- Dépôt : `github.com/Kairoli/Bramo`, branche `main`.

**Ce fichier suffit à reprendre le projet sans autre contexte : le lire en entier avant toute modification.** Le mettre à jour (sections « État » et « À faire ») à la fin de chaque chantier.

---

## 1. Principes non négociables

1. **Personne n'est bloqué, mais personne ne fait tout seul.** Tout peut se monter seul, mais le temps pousse à se spécialiser, à commercer et à rejoindre un clan.
2. **Le jeu reste casu.** Pas de course au niveau max. Un tryhard progresse environ **2 à 2,5 fois** plus vite qu'un casu, jamais 10 fois. Toute nouvelle mécanique doit respecter ce ratio.
3. **On ne punit jamais le joueur absent, on récompense toujours le joueur présent.** Aucune perte, pénalité ou dégradation pendant l'absence.
4. **Le payant ne vend que du confort et du cosmétique**, jamais de statistiques ni de ressources. Les cosmétiques sont le seul revenu du jeu.
5. **Le serveur fait autorité sur tous les calculs** (anti-triche). Le client affiche et envoie des intentions (« lancer telle recette ×100 »). Il ne calcule jamais un gain pris pour vrai.

## 2. Le contenu vit dans les données, pas dans le code

- Contenu et équilibrage en **YAML** dans `data/` : `settings.yaml` (réglages globaux), `npc_orders.yaml` (commandes PNJ), `professions.yaml`, `items.yaml`, `recipes/*.yaml`, `trials.yaml` (commandes des maîtres, rangs), `classes.yaml`, `cosmetics.yaml`.
- Chargés et **validés au démarrage avec zod** (schémas dans `packages/shared/src/schemas/`), y compris les références croisées (recette → objet, tenue → pièce de `art/`…). Un fichier invalide empêche le démarrage avec un message clair.
- **Aucun chiffre de jeu codé en dur.** Les formules (forme mathématique) sont dans `packages/shared`, leurs paramètres dans `data/`.
- Valeurs provisoires marquées **`# à équilibrer`**.
- `sim/` (`@bramo/sim`) : simulateur d'équilibrage qui lit **les mêmes fichiers et le même moteur** (`advance`, `startActivity`). Les propositions de données vivent dans `sim/proposals/<nom>/` (même format que `data/`) tant qu'elles ne sont pas arbitrées. Après tout changement d'équilibrage : `pnpm --filter @bramo/sim sim report` et relire les écarts ; `sim calibrate --write` recalcule XP, durées des repas et valeurs d'une proposition depuis `sim/src/rules.ts`.

## 3. Technique

- **TypeScript partout**, monorepo **pnpm** (Node ≥ 22) :
  - `apps/server` : Node + **Fastify 5**. API, comptes, sessions, calcul de la progression. Lancé avec `tsx`.
  - `apps/web` : **React 19 + Vite 7**. Affichage uniquement.
  - `packages/shared` : types, schémas zod 4, formules et moteur de jeu purs et testés. Importé en source TypeScript (pas de build). Sous-chemin `@bramo/shared/node` pour ce qui lit le disque (chargement de `data/` et `art/`).
- **Base** : PostgreSQL via **Drizzle** (0.44). Rester **compatible Supabase** : Postgres standard, migrations SQL versionnées dans `apps/server/drizzle/`, appliquées au démarrage.
  - Sans `DATABASE_URL` → **PGlite** (Postgres embarqué, dossier `apps/server/.pglite/`). Les tests d'API utilisent PGlite en mémoire.
  - **Cible : PostgreSQL et données sur le homeserver de l'auteur.** Seule `DATABASE_URL` change (`.env` à la racine, voir `.env.example`). `docker-compose.yml` fournit un Postgres 16.
- **Tests** : vitest (`pnpm test`). **Typecheck** : `pnpm typecheck`. **Dev** : `pnpm dev` (client sur 5173, qui relaie `/api` vers le serveur sur 3001).
- **Calcul à la demande** : aucune boucle serveur. La progression se déduit d'horodatages au moment où le joueur interagit.
- **Comptes** : pseudo + mot de passe (scrypt), sessions en base (cookie httpOnly `bramo_session`, jeton stocké haché), un personnage par compte.

## 4. Conventions

- **Texte du jeu en français**, **code et identifiants en anglais** (`mining`, `bronze_ingot`). Les libellés français sont dans les données.
- Commits **petits et clairs**, un par étape logique, message à l'impératif en français, signés `Co-Authored-By` si l'assistant les crée.
- Formules = fonctions pures, le temps est toujours passé en paramètre.
- Tout nombre affiché au joueur vient du serveur (le client peut seulement interpoler pour l'animation).
- Fins de ligne LF (`.gitattributes`).

---

## 5. État du projet (à jour au 21 octobre 2026)

### Fait — apparence limitée à la classe, mode Apparence (21 octobre)

- **Décidé par Louis** : l'apparence n'emprunte que les styles de sa classe/voie (un Runiste ne porte plus la tenue du Forgefeu), et le joueur choisit l'**apparence de chaque pièce à la main** sans toucher à son build, via une **bascule Équipement / Apparence à côté du nom** dans la salle Personnage.
- Données : chaque tenue de `data/cosmetics.yaml` a `classes` (et `locked` si elle se débloque plus tard). Moteur : `unlockedOutfits` (tenues de la classe non verrouillées), `lookOptions` (pièces posables par emplacement), `chooseOutfit` (refuse une tenue d'une autre classe, remet les retouches à zéro), `setLook` (une pièce, ou `null` pour revenir à la tenue), `chooseClass` (la tenue ne suit que si elle va à la nouvelle classe). `CharacterState.look`, colonne `look` (migration `0010`), `POST /api/character/look`, `StateView.lookOptions`. Un ancien personnage qui porte une tenue d'une autre classe est affiché avec sa tenue de départ.
- Client : `components/AppearancePicker.tsx`, bascule dans `CharacterRoom.tsx`. Les tenues d'esquisse `sketch_*` (Armure, Forgefeu) sont masquées du choix de tenue mais leurs pièces sont posables pièce par pièce. Le texte « métier lié » est retiré.
- **Limite** : la palette vient de la tenue choisie ; une pièce d'une autre tenue prend la palette de la tenue portée. Quand le moteur d'objets existera, les pièces posables viendront des objets possédés.

### Fait — conception du combat, des classes et de l'équipement (21 octobre)

- **Document de référence : [`docs/design/combat-items.md`](docs/design/combat-items.md)** (issu du travail avec ChatGPT, relu par Louis). Décidé par Louis : niveau par classe (**XP de classe au combat seulement**, les métiers ne la font pas monter ; changer conserve tout ; les **voies sont la spécialisation**, le style vient du build et des sorts) ; combat **entièrement automatique** (la préparation est le jeu) ; raretés Commun/Rare/Épique/Légendaire **sans talent** ; **ligne variable** unique ; **Chef-d'œuvre** = exemplaire signé au jet maximal (remplace les qualités) ; **talents portés par des gemmes** (pierre angulaire des builds, façon *The Division 2*), craftables par les joailliers, achetables, dropables ; **apparence modifiable emplacement par emplacement** ; **l'équipement s'use** ; emplacements à la Dofus ; ensembles 2/3/4 pièces ; paliers 1, 10… 90 ; Chasse = métier de récolte sans combat ; triangle abandonné pour les monstres.
- **Proposé par Claude, à valider** : XP de classe au temps de combat (courbe R(L)), rattrapage +50 % jusqu'à 80 % de la meilleure classe, éveil 75 (ultime, à confirmer), rien dans les métiers ne dépend du niveau de classe + « Terrain d'entraînement » (40 % de l'XP, jusqu'au niveau 40) pour les non-combattants ; 11 emplacements de statistiques (coiffe, torse, gants, jambes, bottes, cape, ceinture, collier, 2 anneaux, arme) + épaulières cosmétiques ; quatre talents majeurs (arme, torse, coiffe, collier) ; langage de talents (déclencheurs, conditions, effets, délais internes, profondeur 1) ; simulation à pas fixes, hors ligne par échantillon ; test automatique de diversité des builds.
- **Recettes recalées sur l'échelle des paliers** : outils de bronze au niveau de Forge 1, fer 10, acier 20 (lingot d'acier 20), réparation par artisan aux mêmes niveaux ; XP recalculée par `sim calibrate`.
- **Validé** : Terrain d'entraînement, éveil au 75. **Événements et boss mondiaux** : jamais fermés aux non-combattants (canaux combat / ravitaillement / récolte / logistique, score normalisé par canal : `combat-items.md` §3.3).
- **Prochaine étape (§10 du document)** : moteur d'objets à exemplaires (identifiant propre), apparence par emplacement, vitrine du marché, catalogue minimal des paliers 1/10/20, gemmes, combat automatique, ensembles.

### Fait — équilibre de l'or (21 octobre)

- **Demande de Louis : « équilibre l'or »**. Mesure : `pnpm --filter @bramo/sim sim balance` (compare des jeux de réglages sur 150 jours ; `GoldVariant` : commandes PNJ, prix des réparations, coûts des bâtiments, or de départ) et `sim market` (tableau de bord). Les bots du simulateur appartiennent à des clans (`clanShare`, `clanWillingness`) et apportent de l'or et des matériaux aux bâtiments ; ils placent des demandes au marché pour les matériaux manquants.
- **Changements de données** : récompenses de `data/npc_orders.yaml` **×0,75** ; matériaux des bâtiments passés en matières premières par milliers (`data/buildings.yaml`) pour absorber le surplus des récolteurs.
- **Constat** : les membres de clan dépensent leur excédent (quelques centaines d'or à la fin), pas les joueurs seuls (près de 20 000 en moyenne à 150 jours). Piste : atelier personnel (métier Construction). Détail et tableau : `docs/design/marche.md` §9. Louis doit valider les chiffres.

### Fait — clans : un clan à construire (21 octobre)

- **Décision de Louis** : pas d'entrepôt (« pas sûr encore ») ; un clan se **construit** avec des **bâtiments qui donnent des boosts**, **construits par les membres**. Détail : `docs/design/monde.md` §3.
- **Données** : `data/buildings.yaml` (mini-village : Halle +1 % tout, puis Forge, Scierie, Champs et jardins, Embarcadère, Pavillon de chasse, Tour des arcanes et Taverne à +2 % par niveau sur un **groupe de métiers** chacun, `boost.professions` ; les 17 métiers sont couverts), `settings.clan` (création 500 or, noms, 30 membres, `minMembersForCost`, `townGuildBonus` 3 %, journal, activité 14 jours), schéma `buildingSchema`, `Content.buildings`.
- **Moteur** : `CharacterState.clanBonuses` (par métier, clé `all` pour toute production ; renseigné par `loadCharacterForUpdate`, jamais enregistré) utilisé par `bonusesFor` ; `clanBonuses`, `memberBonuses` (Guilde du bourg + bâtiments), `buildingNeeds` (coût N × base × membres actifs / référence) dans `engine/commission.ts`. Le plafond `bonusCaps.clan` borne la somme.
- **Serveur** (`apps/server/src/clans.ts`, migrations `0007` à `0009`) : tables `clans`, `clan_members`, `clan_buildings`, `clan_progress`, `clan_log` ; fonder, rejoindre, quitter/dissoudre, exclure, rangs, transfert de direction, `contribute` (apport d'or ou d'objets, montée de niveau automatique, annonce sur le fil du serveur). Routes `/api/clans`, `/api/clan`, `POST /api/clan/create|join|leave|kick|rank|leader|contribute`.
- **Client** (`rooms/ClanRoom.tsx`) : sans clan, fonder ou rejoindre ; dans un clan, onglets Bâtiments (cartes avec barres d'avancement et boutons Apporter), Membres, Journal.
- Tests : 80 dans `packages/shared`, 19 d'API (scénario de clan à trois joueurs avec construction d'un bâtiment).
- **Pas encore fait** : commandes internes, postes d'experts, invitations, chat, métier Construction, décor de la halle. Les coûts sont à équilibrer avec le simulateur (voir plus bas, équilibrage de l'or).

### Fait — choix de tenue (21 octobre)

- Action `chooseOutfit` et `unlockedOutfits` (`engine/actions.ts`), `POST /api/character/outfit`, `StateView.unlockedOutfits`. Sont débloquées **les tenues de départ des trois classes** ; Marée haute (saison) et Grand maître (Enchantement 99) restent verrouillées, avec leur condition affichée. Fenêtre « Changer de tenue » dans la salle Personnage (`OutfitModal`). La tenue est un cosmétique gratuit, avec n'importe quelle classe.
- **L'écran d'équipement (équiper / déséquiper) attend le combat (P4)** : sans armes ni armures, il n'y a rien à équiper (les outils s'utilisent tout seuls). Voir `docs/design/items.md` §3.

### Fait — rangs de métier : surnoms et commandes du maître (21 octobre)

- Remplace les titres génériques et les épreuves 30/60. `settings.ranks.levels` = 20/40/60/80/99 ; chaque profession a un `nickname` de départ ; `data/trials.yaml` (35 commandes générées puis relues : `profession`, `rank`, `name`, `nickname`, `intro`, `outro`, `tasks`, `reward`). Les chefs-d'œuvre et leurs objets ont été supprimés des données (le champ `trial` des recettes subsiste).
- Moteur (`engine/trials.ts`) : `effectiveLevel`, `skillLevel`, `heldXp`, `nextTrial`, `ranksOf`, `shownNickname`, `setNickname`, `completeTrial` (met aussi à jour `state.shown`). `advance`, `startActivity`, commandes PNJ et prime utilisent `skillLevel`. `SkillView` : `level` effectif, `heldXp`, `nickname`, `nicknames[]`, `shownRank`, `next` (prochaine commande, `reached`).
- Serveur : colonne `shown` (migration `0006_rangs`), `POST /api/nickname`, journal et fil du serveur (« X devient « … » en … »). Client : salle du métier (surnom au choix, XP en attente, histoire racontée à la réussite), grille des métiers, accueil.
- Les bots du simulateur valident les commandes sans délai (hypothèse écrite dans les limites du tableau de bord). Tests : 74 dans `packages/shared`, 18 d'API. Les personnages créés avant ce changement sont bornés au palier 20 jusqu'à la commande (XP gardée).
- **Pas encore fait** : relecture des noms et histoires par Louis, équilibrage des quantités et des récompenses, commandes des 10 autres métiers, écran « Mes surnoms » dans la salle Personnage.

### Fait — accueil du bourg (21 octobre)

- **Scène du bourg** (`rooms/home/Town.tsx`) remplace la carte du monde : décor SVG (mines, bois, jardins, forge qui rougeoie, menuiserie, halle de la guilde, cuisines, port ; chaque lieu cliquable ouvre la salle du métier) et **les autres joueurs récemment actifs** (`settings.town.activeWindowMin`, 15 min), avec leur classe et leur tenue : au travail devant le lieu de leur activité, en promenade sinon (toujours vers la droite, pas de miroir) ; une carte au survol (titre, niveau, ce qu'ils font). `prefers-reduced-motion` : tout reste immobile.
- **Panneau du bourg** : fil du serveur (annonces publiques) ; filtre « mes annonces », lien vers le Marché.
- **Serveur** (`apps/server/src/town.ts`) : tables `server_events` et `server_firsts` (migration `0005_town`), `GET /api/town` (`TownView` : joueurs actifs, total, fil). Événements : arrivée d'un joueur, niveau de métier annoncé (`settings.town.milestoneLevels`, 20/40/60/80/99), épreuve de maître réussie, première fabrication d'un objet sur le serveur. `play()` collecte les annonces (`ActionResult.serverEvents` pour une action) et les enregistre dans la transaction.
- Tests : 18 d'API (dont le bourg). Vérifié dans le navigateur à 800×500 et 1440×900, sans scroll de page.
- **Pas encore fait** : onglets Tout / Clan / Serveur du journal (le fil est dans le Panneau), discussion, commandes PNJ affichées sur le Panneau (elles sont dans la salle Marché), mini-annonces de saison. La carte du monde pourra revenir en popup « Voyager » avec l'Exploration.

### Fait — marché entre joueurs, commandes PNJ, Pêche, exemplaires (21 octobre)

- **Décision de Louis** : **aucun PNJ qui rachète** ; le PNJ ne passe que X commandes par jour ; tout le reste est entre joueurs. Le marchand du port est supprimé (engine, routes, `ShopModal`, `shopPrice`). Conception : [`docs/design/marche.md`](docs/design/marche.md) (avec les questions pour Louis) et [`docs/design/items.md`](docs/design/items.md).
- **Exemplaires** (`engine/gear.ts`) : `state.wear[itemId]` = usure de chaque exemplaire usé, du plus usé au moins usé ; on finit le plus usé d'abord. Réparer remet le plus usé à neuf, recycler jette les plus usés. Vue : `durability[itemId] = { totalMs, copies[], repairCost }`.
- **Marché** (`engine/market.ts` pur : `match`, `netProceeds`, `validateOrder` ; `apps/server/src/market.ts` : `placeOrder`, `fillOrder`, `cancelOrder`, `claimOrders`, lectures). Table `market_orders` (migration `0003_market_npc`). Ordres limites croisés au prix de l'ordre en attente, or/objets mis de côté, taxe 5 % détruite, produits versés au prochain passage du propriétaire (`play()` appelle `claimOrders` avant l'action ; `Action` reçoit `{ tx, characterId }` et peut être asynchrone). Objets durables : offres à l'unité, pas d'ordre d'achat. Routes : `POST /api/market/order|fill|cancel`, `GET /api/market`, `/api/market/item/:id`, `/api/market/mine`.
- **Commandes PNJ** (`engine/npc.ts`, `data/npc_orders.yaml` : 33 commandes avec `profession` et `level`, `settings.npcOrders.perDay`) : **propres à chaque joueur** (`state.seed` = id du personnage, haché avec le jour) : des métiers jouables au hasard, et dans chacun une commande adaptée à son niveau (parmi les 3 plus hautes accessibles) ; une fois par jour chacune ; `state.npc`, `POST /api/npc/complete`, `StateView.npcOrders`.
- **Étal de la guilde** (`item.stallPrice`, outils de bronze à 150 or ; `buyFromStall`, `POST /api/stall/buy`) : vend du neuf seulement s'il n'y a aucune offre de joueur pour l'objet.
- **Prime de commande** (`engine/commission.ts`, `settings.commissions`) : vendre dans un ordre d'achat qui attendait un objet qu'on sait fabriquer donne +20 % de l'XP de la recette, 100 unités par jour (`state.prime`).
- **Réparation** par matériaux (`item.repair`, `repairWithMaterials`, `POST /api/items/repair-self`) et **par un artisan** (table `repair_requests`, `apps/server/src/repairs.ts` : `requestRepair`, `takeRepair`, `cancelRepair`, `claimRepairs`, `POST /api/repairs/request|take|cancel`, `GET /api/repairs`) ; migration `0004_repair_prime`. Salle Marché : onglet **Artisans**.
- **Pêche jouable** : 5 poissons (frais, truite, brochet, poisson-lanterne, raie), cannes de bronze et de fer (recettes de Forge), maître Naël, épreuves 30 et 60. `sim calibrate --data --write` a recalculé les repas et les valeurs.
- **Client** : salle **Marché** (`rooms/MarketRoom.tsx`) : livre d'ordres par objet, achat direct, formulaire d'ordre avec taxe affichée, `Mes ordres`, `Comptoir de la guilde` ; le sac propose « Vendre » (ouvre le Marché sur l'objet) ; une recette à ingrédient manquant renvoie au Marché.
- Tests : 79 dans `packages/shared`, 17 d'API (scénarios à deux joueurs : marché, étal, réparation par un artisan, prime), 10 du simulateur. Vérifié dans le navigateur : livre, achat, onglets Comptoir et Artisans.
- **Simulation du marché** (`pnpm --filter @bramo/sim sim market`, `sim/src/market/` : échangeur en mémoire aux règles du serveur, bots, tableau de bord `sim/reports/marche.html`) : première passe le 21 octobre, résultats et points à reprendre dans `docs/design/marche.md` §8. **Louis reporte l'équilibrage** (or, prix, réparations) à plus tard.
- **Décidé : pas de commandes à matériaux fournis, pas de frais de dépôt** (`docs/design/marche.md` §7, avec la mesure de la demande de Forge). **Pas encore fait** : simulateur avec ordres de marché, équilibrage des commandes PNJ, de l'étal et de la prime.

### Fait — usure, réparation, recyclage et garde-manger (21 octobre)

- **Usure** : `item.tool.durabilityHours` (data/items.yaml : bronze 40 h, fer 60 h, acier 90 h). `CharacterState.wear[itemId]` compte les ms de travail effectif ; `advance` coupe ses segments au moment où l'outil se termine pour que le rendement change à l'instant exact (résultat identique en une ou plusieurs étapes). `activeTool` ignore un outil usé ; il reste dans le sac, le maximum ne baisse jamais.
- **Réparation** (`repairItem`, `POST /api/shop/repair`) : PNJ (l'exemplaire le plus usé), `settings.wear.repairGoldShare` × valeur × part d'usure ; remet l'usure à 0. **Recyclage** (`recycleItem`, `POST /api/items/recycle`) : `settings.wear.recycleShare` des intrants de la recette qui fabrique l'objet, arrondi vers le bas (les outils à 1 intrant ne rendent rien, donc non recyclables). **Garde-manger** (`state.pantry`, `POST /api/pantry/stock|unstock`) : `advance` mange le repas au meilleur bonus quand le précédent expire, seulement si une activité peut tourner.
- Migration `0002_wear_pantry` (colonnes `wear` et `pantry`). Vue : `durability`, `recycle`, `pantry`. Interface : sac de la salle Personnage (reste X h, Réparer, Recycler, Garde-manger).
- **Pas encore fait** : réparation par un artisan (marché), outils d'apprenti, usure des armures (combat), usure dans le simulateur (les bots ignorent encore l'usure et le garde-manger), équilibrage des durées et des prix (`# à équilibrer`).

### Fait — premières décisions appliquées : présence, progression, boucle à 6 métiers (21 octobre)

- **Décisions de Louis** (arbitrages 1, 2, 4, 11, 12) : rendement unique 100 % et 16 h d'autonomie ; l'énergie quotidienne devient **deux coups de fouet de 30 min (×1,5) par jour, activés quand on veut** (en ligne comme hors ligne, un second s'ajoute au premier) ; courbe RuneScape avec les taux recalibrés, **sans XP doublée en début de métier** ; repas à ~2 fois leur coût et garde-manger ; usure **sans perte de durabilité maximale**. Idée de Louis à examiner : un coup de fouet derrière une publicité (`arbitrages.md` §2).
- **`data/`** reprend `sim/proposals/boucle-v0` pour les 6 métiers jouables (Minage, Bûcheronnage, Herboristerie, Forge, Menuiserie, Cuisine) : 17 métiers listés, recettes `recipes/gathering.yaml` et `recipes/crafting.yaml`, un outil par métier (fer d'outil + manche), épreuves 30 et 60 pour les six. XP, durée des repas et valeurs se recalculent avec `pnpm --filter @bramo/sim sim calibrate --data --write` (ne modifier que durées et quantités).
- **Moteur** : `EnergyState` = `{ dayKey, used, activeUntil }` (l'ancien format est relu par `readEnergy`) ; `presenceAt` applique le coup de fouet jusqu'à `activeUntil`, quelle que soit la présence ; action `activateEnergy`. L'apprentissage optionnel du chantier précédent est retiré.
- **Serveur / client** : route `POST /api/energy/activate` ; bouton « Coup de fouet » (pastilles des charges, puis jauge du temps restant) dans la barre du haut et la salle Personnage ; XP des recettes affichée au dixième ; grille des métiers sur 9 colonnes (17 métiers, sans scroll à 1280×720).
- Tests : 53 dans `packages/shared`, 11 d'API, 10 du simulateur. Vérifié dans le navigateur à 1440×900 et 1280×720 (accueil, Métiers, Menuiserie, Forge, Personnage, activation d'un coup de fouet).
- **Pas encore fait** : usure, réparation, recyclage et garde-manger dans le moteur ; outils d'apprenti (sans outil, on travaille sans bonus). Les personnages déjà créés gardent leurs anciens objets disparus des données (ignorés à l'affichage).

### Fait — refonte de la conception et simulateur (21 octobre)

- **Conception** (`docs/design/`, tout en **[Recommandé]** sauf mention) : écosystème de 17 métiers + 3 extensions ouverts par phases (Agriculture à parcelles en temps réel, Tannerie séparée de la Couture, Joaillerie, Construction comme métier-puits, Exploration qui produit des cartes de gisement), chaînes chiffrées, progression recalibrée, présence (rendement unique 100 % + autonomie 16 h, participation récompensée à part), économie (surplus structurel, puits, robinet d'or du PNJ), classes et voies, événements récurrents sans remise à zéro, clans et plafonds de bonus. `docs/game-design.md` réécrit avec les statuts.
- **Constats mesurés** : Minage 60 en ~1 jour et 90 en 18 jours confirmés ; ×7,04 de production entre 20 min/jour et un onglet ouvert jour et nuit ; Festin du givre à 360 h de bonus par heure de cuisson ; dans le prototype, seuls ~5 % du travail ont un usage réel et le rachat PNJ crée ~1 500 or par joueur et par jour.
- **Simulateur** `sim/` (9 tests) : bots joués par le vrai moteur selon des profils de présence, coût complet des chaînes, rapport des repas, bilan économique (variantes, sensibilité, 20/50/200 joueurs), recalibrage automatique d'une proposition. Proposition **`sim/proposals/boucle-v0/`** : la boucle de test à 6 métiers jouables (Minage, Bûcheronnage, Herboristerie, Forge, Menuiserie, Cuisine) et les recettes des chaînes d'exemple des autres métiers.
- **Moteur** : `readRawContent` dans `@bramo/shared/node`.

### Fait — le Traqueur (21 octobre)

- Tenue **Lisière** (capuchon à plume, visage à barbe de trois jours, pourpoint avec carquois dans le dos, ceinture, brassards lacés, bottes souples, cape courte déchiquetée), pose `tracker` (en garde, jambes écartées, arc tendu dans la main éloignée, corde à demi bandée, flèche encochée), corps `base_ranger`, arc `ranger_bow`, effet Pousses de jade (pousses au sol, feuilles, pointe de flèche qui luit), animation `idle_tracker`.
- Pose du Forgefeu refaite (une main sur la hanche, marteau sur l'épaule) et animations de repos plus marquées. Avec « réduire les animations » le repos continue à 40 % d'amplitude (`gain` dans `Character.tsx`) : une page web ne peut pas réactiver les effets d'animation de Windows.

### Fait — classes choisies et épreuves des maîtres (21 octobre)

- **Classe dès la création** : un personnage sans classe voit l'écran « Choisissez votre classe » (trois cartes avec la classe dans sa tenue et sa pose) avant d'entrer. Il en change **à tout moment, gratuitement** (salle Personnage → « Changer de classe »). Route `POST /api/character/class`, action `chooseClass`.
- **Apparence par personnage** : colonnes `class_id`, `outfit` (null = tenue de départ de la classe) et `trials` sur `characters` (migration `0001`). `StateView.appearance` donne classe et tenue ; tout le jeu affiche le vrai personnage (`useGame().look`).
- **Tenue de départ et pose par classe** (`startingOutfit`, `pose` dans `classes.yaml`, poses dans `art/rig/poses/`). Le moteur applique les décalages de la pose puis son animation de repos.
- **Forgefeu complet** : tenue Braise (bandeau, barbe tressée, tunique retroussée, tablier de cuir, ceinture à outils, manchettes, bottes ferrées, épaulière rivetée), corps `base_grip` (poings), pose « une main sur la hanche, l'autre tient le marteau de forge sur l'épaule », effet Braises de forge (sol qui se fend, braises autour du marteau, poing de la hanche qui rougeoie), animation `idle_forgefire`.
- **Épreuves des maîtres** (`data/trials.yaml`, `engine/trials.ts`) : Apprenti (30) et Compagnon (60) pour Minage, Herboristerie, Forge et Cuisine. Le titre d'un palier qui a une épreuve n'est acquis qu'après elle ; le niveau monte sans. Les métiers d'artisanat demandent un **chef-d'œuvre** (recette `trial:` visible seulement pendant l'épreuve, onglet « Épreuve »). Route `POST /api/trials/complete`. Journal : « Maître X vous attend » à l'ouverture, ligne « Épreuve » à la réussite.
- **Interface des épreuves** : dans la scène de chaque métier, la carte du maître montre l'épreuve à passer (objets cochés, compteurs, liens « Fabriquer » / « Récolter », bouton « Remettre au maître »), la prochaine épreuve verrouillée (barre de niveau) ou « toutes réussies ». Salle Métiers : badge « Épreuve » et « Vous attend » sur les maîtres.
- Tests : 51 dans `packages/shared`, 10 d'API. Vérifié dans le navigateur à 1440×900 et 1280×720, sans scroll, de la création du compte à la réussite d'une épreuve.

### Fait — P1, prototype solo

**Moteur de jeu** (`packages/shared`, 44 tests)
- Courbe d'XP RuneScape 1–99 (test : niveau 99 = 13 034 431 XP), surnoms de métier aux paliers 20/40/60/80/99 (voir Rangs plus bas).
- `engine/advance.ts` : `advance(state, now, content)` fait avancer un personnage à partir de `lastTickAt` et `lastSeenAt`. Fenêtres successives : actif pendant `activeTimeoutSec` après le dernier signe de vie, puis hors ligne pendant l'autonomie (`offlineCapHours`), puis plus rien (rien n'est perdu) ; les taux viennent de `settings.rates` (100 % et 16 h depuis le 21 octobre), ×1,5 pendant un coup de fouet. Les bonus plafonnés (outil 30 %, repas 10 %, clan 10 %, saison 20 % ; clan et saison valent 0 en P1) multiplient la vitesse. Calculer en une fois ou en plusieurs fois donne le même résultat (testé).
- `engine/actions.ts` : lancer (remplacer ou mettre en file, file de 3), annuler, manger un repas (un seul bonus actif), manger, réparer, recycler, garde-manger, commandes PNJ (le marché, lui, est côté serveur). Erreurs = `GameError` avec message français.
- `engine/view.ts` : ce que le client reçoit (niveaux effectifs, XP en attente, surnoms, prochaine commande, rendement détaillé, coups de fouet).

**Données** (`data/`)
- 17 métiers (voir `docs/design/metiers.md`). **Jouables depuis le 21 octobre : Minage, Bûcheronnage, Herboristerie, Pêche, Forge, Menuiserie, Cuisine.** Les autres sont `status: soon`.
- Chaînes : minerai → lingot → fer d'outil + manche → outil de chaque métier ; bois → planches, manches, hampes, douelles ; herbes + poisson → repas longs (rendement ~2 fois leur coût).
- Le poisson vient de la **Pêche**. Plus de marchand PNJ (voir le chantier marché).
- 3 classes (`classes.yaml`) : Runiste, Forgefeu et Traqueur complets (tenue de départ, pose, arme, effet, animation de repos).
- 5 tenues (`cosmetics.yaml`) : Cendres (départ du Runiste), Braise (départ du Forgefeu), Lisière (départ du Traqueur), Marée haute (saison), Grand maître (Enchantement 99, change la silhouette).

**Serveur** (`apps/server`, 8 tests d'API)
- Routes : `POST /api/auth/register|login|logout`, `GET /api/content` (public), `GET /api/state` (sert aussi de signe de vie), `POST /api/activity/start|cancel`, `POST /api/energy/activate`, `POST /api/items/eat`, `POST /api/shop/buy|sell`, `POST /api/character/class`, `POST /api/trials/complete`, `GET /api/journal`.
- `game.ts > play()` : point d'entrée unique de toute requête de jeu (verrouiller la ligne → avancer → action → marquer présent → enregistrer → journal). Le **résumé d'absence** est renvoyé une seule fois (absence ≥ 5 min avec du travail effectué), puis reste dans le journal.
- Tables : `accounts`, `sessions`, `characters` (activité, file, énergie, repas en jsonb), `character_skills`, `character_items`, `journal`.

**Client** (`apps/web`)
- Connexion / création de compte. Barre du haut (6 onglets, or, bouton Coup de fouet, lien « Atelier » en dev).
- **Accueil** : carte du monde (lieux cliquables + volet d'infos ; provisoire, à repenser) ; en bas, journal à gauche (seul l'onglet Journal fonctionne), **personnage en entier au centre** entouré de ses emplacements, **activité en cours à droite** (anneau, XP/h, rendement, file).
- **Salle Métiers** : grille groupée, « Bientôt » en pointillés, maîtres PNJ ; **salle d'un métier** : scène avec le personnage et le maître, recettes 2×3 paginées avec filtres et recettes verrouillées, détail (niveau, temps, XP, ingrédients, quantité −/+/Max, Lancer / Lancer à la place de / Ajouter à la file), file.
- **Salle Personnage** (trois colonnes) : équipement détaillé et sac (Manger, Garde-manger, Réparer, Recycler, Vendre) · personnage centré entouré de ses emplacements · caractéristiques (progression, rendement et bonus plafonnés, coups de fouet, 17 métiers, bloc Combat grisé).
- Clan, Combat : pages « Bientôt ». **Marché** : salle complète (livre d'ordres, mes ordres, Comptoir de la guilde).
- Popups : résumé d'absence (auto à la connexion, « Revoir » dans le journal).
- Aucun scroll de page, vérifié à 1440×900 et 1280×720.

**Personnages** (`art/`, `apps/web/src/rig/`)
- Gabarit humanoïde à 21 os (trois quarts vers la droite, pose de référence, os de tissu pour robe et cape), animation de repos 3,2 s en images clés, 16 pièces SVG à variables de couleur sur 13 emplacements.
- Moteur de rendu React : cinématique directe, calques triés par profondeur, animation sans re-rendu React, 3 niveaux de détail (portrait, scène, combat), mise en valeur d'une pièce au survol de son emplacement.
- `PaperDoll` (`components/equipment.tsx`) : personnage + emplacements (8 cosmétiques en miniature, arme de classe, outil = meilleure pioche du sac, repas actif).
- Page **Atelier** (`/#atelier`, hors connexion) : tenues, pièces une à une, os, animation, vue éclatée.

### Pas encore fait / limites connues

- **Pas de déploiement** : le serveur tourne avec `tsx`, il n'y a ni build de production du serveur, ni service des fichiers statiques du client, ni reverse proxy, ni HTTPS. `secureCookies` s'active avec `NODE_ENV=production`.
- Pas de limite de tentatives de connexion, pas de changement de mot de passe, pas de suppression de compte.
- Chiffres de `data/` encore provisoires (`# à équilibrer`), mais suivant des règles vérifiées par le simulateur. Le simulateur ne fait pas encore de prix de marché (bilan de flux seulement).
- Animations de repos seulement (une par pose). Marée haute ne change que les couleurs. Une seule pose par classe (pas encore par voie).
- Les niveaux de classe n'existent pas encore (combat en P4).
- L'écran de choix de classe est un contrôle du client : le serveur accepte les actions de jeu d'un personnage sans classe.
- Pas de vrai système d'équipement : les emplacements montrent la tenue, l'arme de classe en aperçu, la meilleure pioche et le repas actif.
- Les onglets Tout / Clan / Serveur du journal et la discussion sont désactivés.
- Bandeaux des salles : textes provisoires « [Illustration animée : …] » à la place des scènes.

---

## 6. À faire

### Prochaines étapes (ordre proposé)

0. **Suite de `docs/design/arbitrages.md` §3** (étapes 1 à 4 faites pour l'essentiel ; reste les outils d'apprenti, les commandes artisanales et le simulateur de marché) : (5) clans, Construction, Agriculture, (6) combat et métiers d'équipement, (7) premier événement.
1. **Mise en service sur le homeserver** : Postgres (docker compose), `.env` avec `DATABASE_URL`, build du client (`pnpm --filter @bramo/web build`), le serveur Fastify sert `apps/web/dist` (ou un reverse proxy devant), HTTPS, `NODE_ENV=production`, service systemd ou conteneur, sauvegardes de la base. Limite de tentatives de connexion.
2. ~~Accueil à refaire~~ **Fait le 21 octobre** (scène du bourg et fil du serveur). Reste : annonces de saison, discussion, popup « Voyager ».
3. **Animation et vie de l'interface** (choix de l'auteur en attente) : « +1 objet » flottant à chaque fabrication, pulsation de l'anneau, célébration de montée de niveau et d'épreuve réussie, scènes animées dans les bandeaux (forge, mines, eau), entrées du journal qui glissent.
4. **Personnages** : **une pose par voie** à terme, écran de choix de tenue, animations « travail » par famille de métier, une tenue Marée haute qui change aussi de forme. Couleurs cuivre #F08A4B (mêlée) et jade #7ED6A2 (tir) toujours à valider.
5. ~~Rangs~~ **Faits le 21 octobre** (voir l'état du projet). Reste : relire les noms et histoires, équilibrer, les 10 autres métiers.
6. **Simulateur, suite** : bots qui passent des ordres au marché (prix, liquidité à 20 et 50 joueurs), usure et parcelles dans le moteur pour ne plus les modéliser à part, combat en P4.

### Feuille de route

| Phase | Contenu | État |
|---|---|---|
| P0 | Chiffrage et simulateur | **commencé** (conception chiffrée, `sim/`, proposition `boucle-v0`) |
| P1 | Prototype solo | **fait** (reste : mise en service, animations) |
| P2 | Marché (ordres achat/vente, taxe 5 %), commandes PNJ, usure | **fait en prototype** (reste : simulateur de marché, équilibrage) |
| P3 | Clans : bâtiments à boosts construits par les membres (pas d'entrepôt), commandes internes, postes d'experts | **commencé** (fonder, rangs, bâtiments) ; reste commandes internes, postes d'experts, Construction |
| P4 | Combat et classes (Forgefeu mêlée, Traqueur tir, Runiste magie ; voies = spécialisations ; combat automatique ; triangle abandonné) ; vrai système d'équipement | à faire |
| P5 | Saisons (6 semaines, une mutation chacune) et classes de métier (Artificier, Alchimiste au niveau 40 du métier) | à faire |
| P6 | Arènes PvP et ouverture | à faire |

### Décisions en attente de l'auteur

- **Les 12 arbitrages de conception restants** (les n° 1, 2, 4, 11 et 12 sont tranchés) : `docs/design/arbitrages.md` (hors ligne, énergie, progression, liste des métiers, Agriculture en parallèle, Construction, Exploration, plafonds de bonus, PNJ, repas, usure, affinité, événements, classes de métier, Guilde du bourg, file).
- Animations prioritaires. Questions du marché et des objets : `docs/design/marche.md` §6 et `docs/design/items.md` §4 (serveur peu peuplé, or de départ, qualité, sets).
- **Équipement en deux couches** (proposé) : l'équipement porte les statistiques, s'use et passe par le marché ; l'apparence (tenue cosmétique) le recouvre visuellement. L'emplacement affiche l'apparence, l'infobulle les deux.
- Couleurs d'affinité mêlée et tir.
- Questions ouvertes du game design : public visé, arrivée du PvP, durée exacte des saisons, longueur de la file pour les abonnés.

---

## 7. Règles de jeu (P1)

- XP : `XP(L) = floor( Σ_{l=1}^{L-1} floor(l + 300·2^(l/7)) / 4 )`, niveaux 1 à 99.
- Une seule activité à la fois + file de 3 (`settings.activity.queueLength`).
- Gains : 100 % en ligne comme hors ligne pendant 16 h d'autonomie après la dernière visite. Coups de fouet : ×1,5 pendant 30 min, 2 par jour de jeu (bascule à 4 h UTC), activés par le joueur, un second s'ajoute au premier.
- Bonus plafonnés : outil +30 %, repas +10 %, clan +10 %, saison +20 %.
- Résumé d'absence à la connexion, puis dans le journal.
- Classe choisie avant d'entrer, changeable à tout moment et gratuitement.
- **Rangs : le niveau ne bloque plus (précision de Louis : « seulement pour un titre »)**, `settings.ranks.gatesLevel: false` ; le blocage décrit ci-dessous reste disponible en mettant `true`.
- **Rangs [Décidé et implémenté le 21 octobre]** : des **surnoms propres à chaque métier** (35 commandes dans `data/trials.yaml`, `design/rangs.md` avec la table). Aux niveaux 20, 40, 60, 80 et 99, le maître propose une commande (objets à livrer, histoire d'introduction et histoire racontée à la réussite) ; la réussir accorde le surnom et **débloque la tranche suivante** : le niveau effectif est **borné au prochain palier non validé** (`effectiveLevel`/`skillLevel`), l'XP continue de s'accumuler (« XP en attente », créditée à la validation, rien n'est perdu). Le joueur affiche le surnom débloqué de son choix (`state.shown`).
- XP des recettes (règle du simulateur, `sim/src/rules.ts`) : récolte `R(L) = 400 × 2^((L−1)/55)` XP par heure effective, durée 12 s + 2 s par dizaine de niveaux ; artisanat ×1,75. Pas d'XP doublée en début de métier (décision).
- Plus tard (dans le game design) : maîtrise après 99 (paliers décroissants, +10 % max), affinité de métier (+1 % par tranche de 10 niveaux du métier lié, +10 % max), objets faits maison signés et de meilleure qualité, progression de classe (voie 30, spécialisation 60, éveil 75).

## 8. Interface

- **Un accueil et cinq salles** : Accueil, Métiers, Personnage, Clan, Marché, Combat (six onglets). Tout le reste s'ouvre **en popup ou en volet, jamais en nouvel écran**.
- **Aucun scroll de page.** Cible 1440×900, correct à 1280×720. Scroll interne à un panneau permis. Vérifier après chaque changement de mise en page (les deux tailles, toutes les salles).
- **Squelette commun** : bande visuelle du lieu en haut, contenu en bas. Exception : la salle Personnage (trois colonnes).
- **Le personnage se montre toujours en entier, entouré de ce qu'il porte** (`PaperDoll`) : au centre de l'accueil (colonnes latérales de même largeur pour qu'il soit au centre de l'écran), au centre de la salle Personnage. Pas de tête dans un rond.
- **Une seule police** : Bricolage Grotesque. **Palette « Anthracite et cuivre »**, uniquement via les jetons de `apps/web/src/styles/tokens.css` :

| Jeton | Rôle | Couleur |
|---|---|---|
| `--bg` | fond | #20262A |
| `--panel` | panneaux | #2A3135 |
| `--border` | bordures | #3C464A |
| `--sunken` | creux | #1A1F22 |
| `--text` | texte | #F1F0EC |
| `--text-muted` | texte secondaire | #A9B3B5 |
| `--action` | action (cuivre) | #F08A4B |
| `--event` | événement | #4CC9D6 |
| `--clan` | clan | #E3C770 |
| `--magic` | magie | #B39DF5 |
| `--good` | bon | #7ED6A2 |
| `--alert` | alerte | #FF7C7C |
| `--market` | marché | #8DB4E2 |

Détail écran par écran : `docs/game-design.md`, section Interface.

## 9. Personnages

- **Trois quarts vers la droite** : regard, arme et sorts vont vers la droite. **Jamais de miroir** (sur une carte : portrait ou pion). Dans les scènes, le personnage est à gauche.
- **Proportions réalistes** (7,5 à 8 têtes). Ambiance sombre, lisible grâce à la lumière de contour (couleur du sort) et aux touches vives.
- **On voit tout de suite qui joue quoi** : chaque classe a sa **tenue de départ** et sa **pose** (à terme, chaque voie aura sa pose), plus son arme et son effet dans sa couleur d'affinité (`--c-glow`). Les tenues cosmétiques se changent ensuite librement, avec n'importe quelle classe.
- Une nouvelle tenue se fait **sans retoucher les animations ni les poses** (les pièces suivent les os). Style original.
- Système complet, conventions de dessin, ordre d'empilement et pièges : [`art/README.md`](art/README.md).

## 10. Où trouver quoi

```
apps/server/src/
  index.ts          démarrage (chargement data/ + art/, base, écoute)
  app.ts            routes Fastify
  game.ts           play() : point d'entrée de toute requête de jeu
  characters.ts     lecture/écriture d'un personnage (verrou de ligne)
  journal.ts        textes du journal et résumé d'absence
  auth.ts           mots de passe et sessions
  db/               schéma Drizzle et connexion (Postgres ou PGlite)
apps/server/drizzle/  migrations SQL (pnpm db:generate après un changement de schéma)
apps/web/src/
  main.tsx          routes (jeu, connexion, #atelier)
  game/             GameContext (état, signe de vie, actions), useLive (interpolation)
  rooms/            salles (Home + home/, Professions, ProfessionRoom, CharacterRoom, SoonRoom, Atelier)
  components/       TopBar, popups, QueueChips, equipment (PaperDoll), ClassChoice, ui
  rig/              moteur des personnages (assets, skeleton, Character)
  styles/           tokens.css, global.css, rooms.css
packages/shared/src/
  schemas/          zod : contenu (content.ts) et personnages (art.ts)
  formulas/         xp.ts, rates.ts (présence, énergie, bonus)
  engine/           advance, actions, trials, view, state
  node/             loadContent(dataDir, artDir), loadArt
data/               contenu et équilibrage (YAML)
art/                gabarit, animations, poses, pièces des personnages
docs/               game design, conception détaillée (design/) et maquettes
sim/                simulateur : src/ (bot, chains, economy, rules, calibrate, scenarios), proposals/, reports/
```

## 11. Pièges connus

- **PGlite ne supporte qu'un seul processus** : ne jamais ouvrir `apps/server/.pglite/` (script, autre serveur) pendant que le serveur tourne, la base serait corrompue. Arrêter aussi les processus enfants de `pnpm dev` (le serveur `tsx` peut survivre à l'arrêt de pnpm). Pour repartir de zéro : arrêter le serveur, supprimer le dossier.
- **SVG des pièces** : pas de `--` dans un commentaire XML (le navigateur refuse tout le fichier ; `pnpm test` le détecte). Ids de dégradés et filtres en `#rig-…`.
- Les pièces sont lues depuis `art/` par Vite (`server.fs.allow: ['../..']` dans `apps/web/vite.config.ts`).
- Le résumé d'absence n'est envoyé qu'une fois : le client garde le premier si deux réponses se croisent (StrictMode).
- pnpm récent bloque les scripts d'installation (esbuild) : ça fonctionne sans, `pnpm approve-builds` si besoin. `pnpm install` peut alors finir en erreur `ERR_PNPM_IGNORED_BUILDS` alors que les paquets sont bien installés.
- **Aperçu du navigateur de Claude** : il impose `PORT=5173` aux processus qu'il lance, et le serveur lit `PORT` : il prend alors le port de Vite. Lancer le client seul dans l'aperçu (`pnpm --filter @bramo/web dev`) et le serveur à part (`pnpm --filter @bramo/server start`, sans `PORT`).
- `tsx watch` ne surveille pas `data/` ni `art/` : après un changement de YAML ou de pièce, redémarrer le serveur (ou toucher un fichier de `packages/shared`).
