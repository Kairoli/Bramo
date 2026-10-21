# Marché entre joueurs et commandes PNJ

> **[Décidé le 21 octobre par Louis]** : pas de PNJ qui rachète tout ; le PNJ ne passe que des **commandes, X par jour** ; tout le reste est **entre joueurs**. **Prototype** : tout ce qui suit est dans le code (`engine/market.ts`, `engine/npc.ts`, `apps/server/src/market.ts`, salle Marché). Les chiffres sont à équilibrer.

## 1. Principe

Le marché est le seul endroit où un objet change de main contre de l'or. Il n'y a ni marchand qui vend, ni marchand qui rachète. Les joueurs sont les fournisseurs et les clients les uns des autres, ce qui sert le pilier « personne ne fait tout seul ». Le PNJ n'intervient que par des commandes limitées dans le temps (§4) et pour les réparations (§5).

## 2. Ordres

- **Ordre limite** : « acheter / vendre N × objet à P or l'unité ». Il s'exécute tout de suite contre les ordres en face qui conviennent, au **prix de l'ordre qui attendait** ; le reste attend dans le livre.
- **Mise de côté** : une vente retire les objets du sac, un achat met de côté `P × N` or (le trop-perçu n'existe pas : on ne paie que ce qui est exécuté). Annuler rend tout.
- **Priorité** : meilleur prix, puis exemplaire le moins usé, puis le plus ancien. Un joueur ne croise jamais ses propres ordres (il doit annuler l'ordre opposé).
- **Taxe** : 5 % du produit de chaque vente (`settings.market.taxShare`), arrondie à l'avantage de la taxe, détruite : c'est le puits d'or du marché.
- **Récupération sans action** : quand un ordre est exécuté pendant l'absence du propriétaire, l'or net (ventes) ou les objets (achats) sont versés **à son prochain passage**, avec une ligne de journal. Rien à « collecter ».
- **Limites** : 20 ordres ouverts par joueur, prix de 1 à 10 000 000 or, quantité par ordre bornée (`settings.market`).
- **Achat direct** : on peut acheter tout ou partie d'une offre précise (boutons « Acheter » et « Tout » du livre).

## 3. Objets durables (outils, plus tard armures)

Chaque exemplaire a sa propre usure (voir [`items.md`](items.md)). Conséquences sur le marché :
- une offre porte **un seul exemplaire** avec son état (« reste 23 h sur 40 h ») ;
- on ne passe **pas d'ordre d'achat** pour un objet durable : l'état compte, on l'achète à l'étal ;
- le vendeur choisit quel exemplaire proposer.

## 4. Commandes PNJ (le Comptoir de la guilde) [Décidé le 21 octobre]

- `settings.npcOrders.perDay` commandes par jour de jeu (3 aujourd'hui), **propres à chaque joueur** : un tirage déterministe (hachage de l'identifiant du personnage et du jour, aucun état serveur) choisit **des métiers au hasard**, puis dans chacun **une commande adaptée au niveau du joueur** (parmi les trois plus hautes qu'il peut honorer). Haut en Minage mais niveau 1 en Pêche : il reçoit une commande de pêche de niveau 1.
- Les commandes sont dans `data/npc_orders.yaml` (33 aujourd'hui : récolte et fabrication, plusieurs niveaux par métier). Chacune se remet **une fois par jour** : des objets contre de l'or, avec une petite réplique du maître du métier.
- Pourquoi par joueur : des commandes identiques pour tous créent un pic de demande sur les mêmes objets le même jour, et laissent les débutants sans commande accessible. Le PNJ n'a pas de stock : une commande n'est jamais « épuisée ».
- C'est un robinet d'or **plafonné par joueur** (3 × ~150 or par jour), pas un débouché. Récompense de récolte = 15 min de travail × 10 or par minute × 2^((L−1)/55). Elles doivent rester **bien en dessous** de ce que rapporte le travail vendu à un autre joueur. À équilibrer.

## 5. Ce que le PNJ fait encore

- **Étal de la guilde** [Décidé le 21 octobre] : vend les objets de **palier 1** (les outils de bronze, 150 or) **seulement tant qu'aucun joueur n'en propose**. Dès qu'une offre existe, l'étal ferme pour cet objet : le PNJ ne fait jamais concurrence aux joueurs. C'est la réponse au serveur peu peuplé. Il ne rachète rien. Champ `stallPrice` des objets.
- **Réparer** un outil usé en or (50 % de la valeur au prorata de l'usure) : puits d'or.
- Rien d'autre : plus d'achat. Le poisson vient de la Pêche.

## 6. Prime de commande et réparation par un artisan [Prototype]

- **Prime de commande** : livrer (en vendant dans un ordre d'achat qui attendait) un objet qu'on sait fabriquer rapporte **+20 % de l'XP de la recette** par unité, plafonné à **100 unités par jour** (`settings.commissions`), et seulement si l'ordre paie au moins la valeur de référence. Le plafond quotidien empêche les échanges de complaisance entre deux comptes de rapporter de l'XP à volonté. Les commandes à matériaux fournis sont **abandonnées** (décision du 21 octobre) : la réparation par un artisan suffit.
- **Réparation par matériaux** (soi-même) : un outil se répare avec ≈ 30 % de ses matériaux principaux (3 lingots du palier, pour un outil dont le fer d'outil en coûte 10), le niveau de Forge de l'outil (5 / 15 / 35) et un peu d'XP (50 % de l'XP de la recette de l'objet). Sans or. Données : `repair` des objets.
- **Réparation par un artisan** : le propriétaire confie l'outil (avec son usure) et une rémunération (mises de côté) ; un forgeron qui a le niveau et les matériaux le répare, touche la rémunération moins la taxe et l'XP ; l'outil revient comme neuf au prochain passage du propriétaire. Le propriétaire peut reprendre sa demande tant qu'elle est ouverte.

## 7. Décisions du 21 octobre (suite) et questions restantes

**Tranché par Louis** :
- **Pas de commandes artisanales à matériaux fournis, ni de caution ou de délai.** Le modèle voulu est celui de la réparation actuelle : un joueur qui n'a pas le niveau de Forge **fait une demande sur le marché** ; l'artisan **clique sur un bouton**, il est payé et l'objet est réparé. La prime de commande reste sur les ordres d'achat.
- **Étal de la guilde** : on garde seulement les outils de bronze (150 or).
- **Objets durables** : achat à l'unité, avec l'état de chaque exemplaire visible. Pas d'ordre d'achat « état minimum ».
- **Frais de dépôt** : non, la limite de 20 ordres suffit pour l'instant.
- **Garde-fou** : le métier de Forge ne doit pas devenir indispensable à tous.

**Demande de la Forge, mesurée** (chaînes du simulateur : pioche de fer = 37 min dont 18 min de Forge ; réparation = 3 lingots) : un joueur qui travaille 16 h par jour use un outil de fer en 60 h. Remplacement à chaque usure : environ **5 min de Forge par joueur et par jour** (0,5 % de sa journée) ; avec la réparation (3 lingots, environ 0,5 min de Forge par réparation) : **0,15 min par joueur et par jour**. Un forgeron à plein temps pourrait donc servir de l'ordre de 200 joueurs en remplaçant, et bien plus en réparant. **La Forge n'est pas surchargée en volume.** Reste une dépendance de principe : tout outil de métier et toute réparation passent par la Forge. Atténuations en place : le PNJ répare toujours contre de l'or, l'Étal de la guilde vend le bronze quand personne n'en vend, et on peut tout faire soi-même (Forge niveau 5 pour un outil de bronze, niveau 15 pour le fer). **À surveiller** : le combat (P4) arrive avec des armes et des pointes de flèche, qui doubleront ou tripleront la demande de Forge ; l'équilibrer alors avec des armures de Tannerie, de Couture et d'Enchantement plutôt que tout en acier.

**Restent à trancher** :
1. **Équilibre de l'or** : 3 commandes × ~150 or par jour et par joueur, 100 or de départ, taxe 5 %, réparations. À simuler avec des bots qui passent des ordres avant d'ouvrir à du public.
2. **Plafond de la prime** : 100 unités par jour et 20 % de l'XP. Trop généreux pour un artisan spécialisé qui sert beaucoup, ou trop faible ?
3. **Qualité des objets, sets, objets signés** : `items.md` §4, à trancher avant le combat.

## 8. Première simulation du marché (21 octobre, `sim market`, 60 joueurs, 120 jours)

Résultats détaillés : `sim/reports/marche.html`. Louis a décidé de **reporter l'équilibrage** : on continue à développer le jeu, puis on refait des simulations avec plus de contenu. À reprendre à ce moment-là :
- **Or** : les commandes PNJ créent ~140 or par joueur et par jour pour ~19 de sorties (taxe, réparations PNJ, étal). Les bots n'ont pas de poste de dépense ; le vrai équilibre dépend des puits à venir (clan, construction, équipement de combat). Ne pas retoucher les récompenses avant d'avoir ces puits.
- **Prix** : les matières premières se vendent à ~40 % de la référence (offre énorme : 16 h d'autonomie à 100 %). Le prix entier minimal (1 or) et la taxe arrondie à l'avantage de la taxe rendent les très petits lots sans valeur : à revoir (vente par lots, taxe minimale).
- **Réparations** : les bots choisissent toujours le PNJ (7 or contre ~15 or de matériaux pour un artisan). La réparation par un artisan n'est donc utilisée que par choix de rôle. À trancher quand on aura une vraie économie : renchérir le PNJ ou assumer l'artisan comme service secondaire.
- **Forge** : 1,9 % du temps de travail, donc pas surchargée (minimum : les artisans simulés récoltent surtout). Le combat ajoutera de la demande.
- **Débuts** : un nouveau joueur a son premier outil en moins d'un jour et 500 or en ~5 jours : le démarrage tient.

## 9. Équilibre de l'or [Demandé par Louis : « équilibre l'or » ; chiffres choisis par Claude, à valider]

Mesuré avec `pnpm --filter @bramo/sim sim balance` (60 joueurs, 150 jours, **moyenne de 3 graines**, 7 joueurs sur 10 en clan ; `sim/reports/equilibre.md`). Or par joueur et par jour sur les 30 derniers jours :

| Réglage | Entrée (PNJ) | Taxe | Clans | Solde | Or d'un membre de clan | Or d'un joueur seul | Niveaux bâtis par clan (sur 24) | 500 or gagnés en |
|---|---|---|---|---|---|---|---|---|
| Commandes PNJ ×1 (avant) | 173 | 15 | 28 | +126 | 4 900 | 47 000 | 14 | 2 jours |
| **Commandes PNJ ×0,75 (choisi)** | **96** | **12** | **39** | **+44** | **165** | **19 700** | **7** | **6,5 jours** |
| Commandes PNJ ×0,6 | 84 | 11 | 27 | +44 | 133 | 16 900 | 5 | 8 jours |
| Choisi + or des bâtiments ×1,5 | 102 | 13 | 57 | +30 | 165 | 17 000 | 6 | 7 jours |

Avant les clans, la simulation donnait +120 or créés par joueur et par jour et 24 000 or par joueur au bout de 120 jours (`sim/reports/marche.html`, première version). Ce que les chiffres disent :
- **Les clans règlent l'or de leurs membres** : ils apportent leur excédent aux bâtiments et finissent avec une centaine d'or. Le rythme est celui d'un objectif long : **le premier niveau de bâtiment vers le jour 19**, 7 niveaux sur 24 au bout de 150 jours (le double sans la baisse des commandes), donc un arbre complet en un an et demi pour un clan moyen. Si c'est trop lent, c'est le coût en or des bâtiments qu'il faut baisser, pas les commandes.
- **Les joueurs sans clan n'ont rien à dépenser** : leur or s'accumule (près de 20 000 à 150 jours dans la simulation, où ils ne font que jouer). C'est le point faible restant. Pistes : un **atelier personnel** avec le métier Construction (puits d'or et de matériaux sans clan), de l'équipement de combat à payer, des services de joueurs. Aucun bonus de PNJ pour les solitaires (ce serait casser « personne ne fait tout seul »).
- **Choix retenu** : récompenses des commandes PNJ **×0,75** (de ~170 à ~100 or par joueur et par jour réellement perçus), bâtiments inchangés. Un nouveau joueur gagne ses 500 premiers or en environ une semaine et son premier outil en quelques jours.
- Les bâtiments demandent des **matières premières par milliers** (pierre, bois, poisson…) : c'est un débouché pour le surplus des récolteurs, dont les prix s'effondraient (40 à 50 % de la référence).
- **Limites** : les bots donnent la moitié de leur excédent au-dessus de 300 or ; de vrais joueurs dépenseraient plus ou moins. Une seule graine est bruitée : toujours comparer des moyennes. À refaire quand le combat et la Construction existeront.
