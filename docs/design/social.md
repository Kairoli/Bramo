# Le social : amis, messages privés, commandes entre joueurs

**[Demande de Louis, 24 octobre]** « Commence à réfléchir à un système social, d'ajout en amis, de messages privés via le
chat. Le but final : un système de commandes. Je veux aider un membre de mon clan, ou un joueur reconnu pour être haut
niveau, et lui passer une commande avec un prix et un délai (« tu as 2 jours »). Il accepte ou refuse, et livre quand il a
fini. Adapter le choix du délai au temps que prendrait la commande. »

**Les trois étapes codées le 24 octobre** (amis, blocage, messages privés, §2 ; commandes entre joueurs, §3 ; réputation et commandes ouvertes, §4.4). Proposé par Claude ; Louis a tranché les quatre questions le 24 octobre (§4).

**Ce qui change par rapport au 21 octobre** : Louis avait tranché « pas de commandes artisanales à matériaux fournis, ni de
caution ou de délai » (`marche.md` §7), pour le marché. Les **commandes entre joueurs** qu'il demande maintenant ont un
prix et un délai : c'est une décision nouvelle, qui s'ajoute au marché (elle ne le remplace pas). Les matériaux fournis
sont autorisés pour ces commandes (§4).

## 1. Ce qui existe déjà

- La discussion du **serveur** et du **clan** (journal de l'accueil), avec sa modération : 300 caractères, deux secondes
  entre deux messages, dix par minute, liens refusés, signalements, modérateurs qui suppriment ou rendent muet.
- « Masquer un joueur » : seulement dans le navigateur, pas sur le serveur.
- La **page profil** d'un joueur, ouverte depuis n'importe quelle photo ou nom.
- Les **demandes de réparation** (un joueur demande, un artisan clique, il est payé) et la **prime de commande** (vendre
  dans un ordre d'achat qui attendait un objet qu'on sait fabriquer : +20 % de l'XP de la recette).

## 2. Les amis et les messages privés (la base)

**Les amis**
- Depuis la page profil : **« Ajouter en ami »**. L'autre reçoit une demande (journal, notification) et l'accepte ou la
  refuse. 100 amis au plus.
- Une **liste d'amis** (un onglet « Amis » dans le journal de l'accueil) : photo, nom, classe, en ligne ou « vu il y a… »,
  ce qu'il fait (son métier, son étape de route), et trois boutons : Message, Profil, Commander.
- **Bloquer** devient une vraie règle du serveur (il remplace « masquer » du navigateur) : un joueur bloqué ne peut plus
  vous écrire, vous demander en ami ni vous passer de commande, et ses messages publics sont masqués pour vous.

**Les messages privés**
- Un onglet **« Messages »** dans le journal, à côté de Clan et Serveur : une conversation par joueur, la dernière en haut,
  un point pour les non lus (et sur l'onglet, et dans la barre du haut).
- On écrit à quelqu'un depuis sa page profil, la liste d'amis, ou un nom dans la discussion.
- Les mêmes règles que la discussion publique (longueur, cadence, liens, signalement). Un modérateur voit un message privé
  **seulement s'il est signalé**.
- **Qui peut m'écrire** : tout le monde, par défaut [Décidé par Louis]. Un réglage du compte permet seulement à un joueur qui se fait harceler de limiter à ses amis et son clan.
- Historique gardé 90 jours ; compris dans l'export des données du compte (RGPD) et supprimé avec lui.

## 3. Les commandes entre joueurs

### Le parcours

1. **Le client** ouvre la page profil d'un artisan (ou son nom dans le clan, ou un ami) → **« Passer une commande »**.
2. Il choisit **l'objet** (une recette que l'artisan sait faire : métiers et atelier d'équipement ; le jeu montre seulement
   ce que son niveau permet), **la quantité**, **le prix**, **le délai** et un mot (facultatif).
3. **L'or est mis de côté** tout de suite (comme un ordre d'achat) : l'artisan est sûr d'être payé, le client récupère tout
   si la commande n'aboutit pas.
4. **L'artisan** reçoit la commande (journal, notification, onglet « Commandes » du Marché) : **Accepter** ou **Refuser**.
   Sans réponse en 24 h, elle expire et l'or revient.
5. Acceptée, elle apparaît dans la **salle du métier** de l'artisan : « Commande de Lysandre : 50 lingots d'acier, reste
   1 j 14 h », avec **« Fabriquer pour la commande »** (met la recette en file pour la quantité qui manque).
6. **Livrer** : quand l'artisan a les objets dans son sac, il livre en un clic. Les objets passent au client, l'or à
   l'artisan. Une pièce d'équipement livrée garde sa signature (« Fait par … ») et sa chance de chef-d'œuvre.
7. **En retard** : passé le délai, le client peut **annuler** (son or revient en entier) ou **laisser courir** ; l'artisan
   peut encore livrer tant que la commande n'est pas annulée.

### Le délai, adapté à la commande

Le jeu calcule le **temps de fabrication** : la durée de la recette × la quantité, au rendement de l'artisan (ses outils,
ses repas, son clan), plus la fabrication des intermédiaires qu'il n'a pas en stock (comme « Il manque des matières »).
Il propose alors trois délais, jamais en dessous de ce qui est faisable :

| Choix | Délai proposé | Pour quoi |
|---|---|---|
| **Pressé** | 1,5 × le temps de fabrication, au moins 4 h | le client est pressé ; il le paie (prix conseillé plus haut) |
| **Normal** | 3 × le temps de fabrication, au moins 24 h | l'artisan le glisse entre ses activités |
| **Tranquille** | 7 jours | sans urgence |

Le calcul tient compte du jeu idle : l'artisan ne travaille que pendant son autonomie (16 h après sa dernière visite) ; un
délai ne descend donc jamais sous 4 h, même pour trois lingots.

### Le prix

- Un **prix conseillé** à côté du champ : la valeur des matières (prix du marché, sinon référence) plus le temps de
  l'artisan (la règle de l'or par heure de travail, `sim/src/rules.ts`), plus une prime selon le délai.
- **Une taxe de 5 %** sur le prix, détruite, comme au marché (un puits d'or, et un frein au passage d'or entre comptes).
- **Un plafond** : au plus 3 fois le prix conseillé. Sans lui, une commande serait un moyen de donner de l'or à un second
  compte (`rapport-23-octobre` : multi-comptes).
- La **prime de commande** (+20 % de l'XP de la recette) s'applique à la livraison : un artisan gagne plus à faire une
  commande qu'à fabriquer pour lui.

### La réputation

- Sur la page profil d'un artisan : **commandes livrées**, **part livrée à temps**, et ses trois objets les plus commandés.
  Un joueur « reconnu pour être haut niveau » se voit, sans classement à part.
- Après une livraison, le client peut laisser **un pouce** (rien de négatif à écrire : pas de harcèlement possible).

### Les garde-fous

- Au plus **5 commandes en attente** par client, et **10 acceptées** par artisan.
- On ne commande pas à quelqu'un qui vous a bloqué ; on peut **désactiver les commandes** dans son compte.
- Les commandes passent par le serveur comme le marché (le client n'envoie que des intentions).

## 4. Décisions de Louis (24 octobre)

1. **Matériaux fournis** **[Décidé : oui]** : le client peut fournir les matériaux, en plus ou à la place d'une partie du
   prix (« au lieu de payer, pourquoi pas »). Ils passent de côté avec l'or et reviennent au client si la commande
   n'aboutit pas. Le prix conseillé baisse d'autant (seul le temps de l'artisan reste à payer).
2. **Messages privés ouverts à tous** **[Décidé : oui]**. Par défaut, n'importe qui peut écrire à n'importe qui. Le réglage
   « qui peut m'écrire » n'est qu'une porte de sortie pour un joueur qui se fait harceler : il peut, s'il le veut, limiter
   aux amis et au clan. Personne n'a à y toucher.
3. **La taxe de 5 % et le plafond** **[Décidé : on garde les deux]** :
   - la **taxe** détruit un peu d'or à chaque commande, comme celle du marché (l'or doit sortir du jeu quelque part, sinon
     les prix montent) ;
   - le **plafond** empêche une commande de servir de cadeau d'or déguisé : sans lui, un joueur commande trois lingots à
     son second compte pour 100 000 or, et l'or change de main sans rien en échange (multi-comptes, et vente d'or contre de
     l'argent réel). Avec les matériaux fournis, le plafond porte sur le prix payé en or.
   5 % de taxe et un plafond de 3 fois le prix conseillé.
4. **Commandes ouvertes** **[Décidé : oui, « comme tu le sens »]** : une commande sans artisan désigné, au clan ou à tout le
   serveur, sur un « Panneau des commandes » ; le premier artisan qui l'accepte la prend. En troisième étape.
   **Codé le 24 octobre** (choix de Claude) : le client choisit « Mon clan » ou « Tout le serveur » et cherche parmi
   tout ce qui se fabrique (tous niveaux) ; le devis ne connaît pas l'artisan (temps des intermédiaires compté). Or et
   matériaux mis de côté comme une commande ordinaire ; une ligne au journal du clan pour une commande du clan. Elle reste
   **72 h** sur le panneau (`settings.orders.openHours`), puis expire (tout revient au client) ; le client l'annule tant
   que personne ne l'a prise. **Prendre** : il faut le niveau du métier et une place (10 commandes acceptées au plus) ;
   ni un joueur bloqué, ni hors du clan pour une commande du clan ; la première qui la prend l'a (l'autre reçoit « un
   autre artisan vient de la prendre ») ; elle devient une commande acceptée : matériaux reçus, le délai part à cet
   instant. Le panneau montre d'abord celles qu'on peut prendre (« À mon niveau » pour ne voir qu'elles), et la salle du
   métier signale celles qu'on peut prendre dans ce métier.

## 5. L'ordre de travail proposé

1. **Amis, blocage, messages privés** (tables `friendships`, `blocks`, `private_messages` ; onglets Amis et Messages ;
   boutons de la page profil ; règles et modération de `chat.ts` réutilisées).
2. **Commandes entre joueurs** (table `artisan_orders` : client, artisan, recette, quantité, prix, matériaux, délai,
   statut, dates ; or et matériaux mis de côté ; calcul du délai et du prix conseillé dans `packages/shared` ; onglet
   « Commandes » du Marché, encart dans la salle du métier, bouton de la page profil ; simulateur : des clients et des
   artisans parmi les bots, pour mesurer les prix et les délais).
3. **Réputation et commandes ouvertes.** Faites le 24 octobre.
