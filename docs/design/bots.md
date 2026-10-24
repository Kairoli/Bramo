# Les habitants : vingt joueurs simulés et leur agent

> **Statut** : conçu le 24 octobre 2026 (soir), à la demande de Louis : « une vingtaine de bots avec de vrais profils de
> joueurs ; un agent IA qui vérifie sur eux toutes les heures ; ils jouent au même rythme que moi, pour que je puisse
> vraiment jouer avec un minimum de vie ; ils jouent comme n'importe quel joueur, y compris chatter ; l'agent gère tout : le
> marché, leur métier, le PvE… Ça implique un reset total, et de me mettre dans la peau d'un nouveau joueur ».
> **Rien n'est codé, rien n'est remis à zéro.** Tout ce qui suit est **proposé par Claude**.

## 0. Précisions de Louis (24 octobre, nuit) : elles priment sur la suite

- **« Humanisés au maximum. »**
- **« Ils ne jouent pas autour de moi, mais autour du jeu. »** Si Louis ne se connecte pas pendant deux jours, le monde
  continue : la discussion, le marché, les clans, la Marée. Les bots jouent entre eux ; **Louis n'est que le 21ᵉ joueur**.
  Plus de mesure « par rapport à Louis » (§2) ni de correction d'un bot « trop rapide par rapport à Louis » (§5) : la
  référence est la simulation de serveur et le principe du casu (un tryhard progresse 2 à 2,5 fois plus vite qu'un casu).
- **« Full random sur tout »**, unique pour chaque bot : heures de connexion, temps resté en ligne, nombre d'actions,
  métiers, décisions. Pas deux bots ni deux jours pareils. Le hasard est tiré par bot et par jour à partir d'une graine
  enregistrée, pour pouvoir rejouer et comprendre un comportement.
- **L'agent IA observe et garde des traces** : il note ce qui ne va pas (bot coincé, économie qui dérape, comportement peu
  humain, bug du jeu) dans un journal, et écrit **un rapport par jour** pour Louis.
- **La discussion vit entre les bots** (voir §5) : c'est la seule part du jeu qu'un programme sans IA ne sait pas rendre
  humaine. Choix du superviseur : une passe « voix » d'IA espacée au hasard (une à deux heures, pas tous les bots à chaque
  fois), qui fait parler les bots entre eux et répond à Louis quand il écrit, distincte du rapport quotidien. À mesurer la
  première semaine (usage de l'abonnement).

## 1. Le principe : un cerveau sans IA, une voix avec

Faire décider **toutes** les actions de vingt joueurs par une IA, toutes les heures, coûte cher et ne joue pas mieux : la
plupart des choix d'un joueur d'idle sont des routines (relancer une récolte, vendre son surplus, s'inscrire à la Marée,
équiper une meilleure pièce). Le simulateur de serveur sait déjà les faire (`sim/src/server/` : onze façons de jouer, choix
de métier, marché, gemmes, clans, commandes du maître, Marée). Proposition en deux couches :

| Couche | Qui | Fait quoi | Quand |
|---|---|---|---|
| **Le cerveau** | un programme (TypeScript, `apps/bots/`), sans IA | toutes les actions de jeu, par l'**API du jeu**, avec les mêmes règles que n'importe quel joueur (le serveur reste l'autorité) | toutes les 15 minutes, chaque bot seulement pendant ses heures de jeu |
| **L'agent** | Claude, une tâche programmée toutes les heures | lit la discussion, les messages privés et le fil du serveur, fait parler les bots (répondre à Louis, réagir à un exploit, demander un prix), prend les décisions de « caractère » (changer d'objectif, rejoindre un clan, accepter une commande de Louis à un prix donné), relit le journal du cerveau et corrige ce qui cloche | toutes les heures, de 8 h à minuit |

Le cerveau garantit que les bots jouent **tout le temps et au bon rythme** ; l'agent leur donne **une personnalité** et
une voix. Si l'agent est arrêté, les bots continuent de jouer en silence.

## 2. Au même rythme que Louis

Le jeu calcule déjà la progression à la demande (16 h d'autonomie après la dernière visite) : un bot qui passe aux mêmes
heures qu'un humain progresse **exactement** comme un humain. Chaque bot a donc un **emploi du temps** (passages le matin, à
midi, le soir ; un « onglet ouvert » pour le tryhard ; deux passages par jour pour le casu), avec de petites variations d'un
jour à l'autre et des jours sans. Ils utilisent leurs coups de fouet, s'inscrivent à la Marée entre 19 h et 20 h quand ils
« sont là », et certains la ratent. Personne ne joue 24 h sur 24.

Mesure de contrôle : la console admin compare chaque semaine leur progression à celle de Louis (niveaux, or) ; un bot ne doit
jamais être 3 fois plus loin que le joueur le plus actif (principe du casu : 2 à 2,5 fois).

## 3. Vingt profils

Chaque bot a un pseudo crédible, une classe et une voie, deux ou trois métiers, un emploi du temps, une façon de commercer, un
caractère et une façon d'écrire. Proposition (à relire par Louis) :

| Pseudo | Profil | Métiers | Présence | Caractère et discussion |
|---|---|---|---|---|
| Brannoc | tryhard, Forgefeu Trempe-Rouge | Minage, Forge | onglet ouvert le soir, 3 passages le jour | optimise, donne des conseils de build, un peu frimeur |
| Ysaline | artisane du marché, Runiste Glyphiste | Couture, Enchantement | 3 passages | vend propre, poste ses prix, aimable |
| Pitchoune | casu guidé, Traqueur | Herboristerie, Cuisine | 2 passages | pose des questions de débutant, beaucoup d'émojis |
| Le_Vieux_Gus | récolteur, Forgefeu | Minage, Bûcheronnage | matin et soir | taiseux, vend en gros, « prix d'ami » |
| Mirabelle | collectionneuse, Runiste | Joaillerie, Alchimie | soir | fan de tenues, commente les ornements |
| Kaëlig | combattant, Traqueur Tue-Bête | Chasse, Tannerie | soir long | parle de la route et des gardiens, chambreur |
| Odalric | spéculateur, Runiste | Enchantement, Joaillerie | 4 passages | achète bas, revend haut, négocie |
| Fanfreluche | casu tranquille, Forgefeu | Cuisine, Pêche | un passage par jour | papote, raconte sa journée (sans détails réels) |
| … | (douze de plus, mêmes onze façons de jouer que le simulateur, répartis sur les trois classes et les 17 métiers) | | | |

Les clans : **deux clans de bots** (un sérieux qui monte vite, un « de copains »), et quatre bots sans clan, dont deux qui
cherchent un clan (Louis peut les recruter, ou en fonder un).

## 4. Ce que le cerveau fait (tout passe par l'API)

- **Métiers** : un objectif par bot (« Forge 40 », « faire les outils de fer »), la recette qui y mène, la file, les repas
  et le garde-manger, les commandes du maître, les commandes PNJ du jour.
- **Marché** : vendre son surplus près du prix du marché (selon son style : normal, bradeur, spéculateur, thésauriseur),
  acheter ce qui manque **plutôt que récolter quand il est pressé** (l'économie active voulue par Louis), poser des ordres
  d'achat, répondre au rayon « Recherchés ».
- **Commandes entre joueurs** : accepter ou refuser les commandes de Louis (selon le prix et le délai, comme un vrai artisan),
  prendre les commandes ouvertes qu'il sait faire, en passer à Louis s'il est artisan.
- **Combat** : la route tourne toute seule ; le bot équipe le butin, sertit, démonte, retaille parfois, change de build devant
  un mur, utilise ses préréglages, boit ses fournitures.
- **Marée** : s'inscrit (s'il est « là » entre 19 h et 20 h), joue son rôle, patronne parfois.
- **Clan** : apporte or et matières aux bâtiments et aux ouvrages, lance le Banquet (s'il est chef ou officier).
- **Social** : accepte les demandes d'ami de Louis, suit ses amis.

## 5. Ce que l'agent fait (Claude, toutes les heures)

1. Lit ce qui s'est passé depuis une heure : la discussion du serveur et des clans, les messages privés reçus par les bots, le
   fil du serveur, le journal du cerveau.
2. **Fait parler** de un à cinq bots, pas plus (une discussion qui vit sans noyer Louis) : réponses à Louis d'abord (toujours
   dans l'heure), réactions aux exploits, questions, ventes (« je vends 500 cuivres à 9 »), un peu de vie (« bonne Marée ce
   soir »). Phrases courtes, fautes de frappe parfois, chacun sa façon d'écrire. Jamais de lien, jamais de vraie vie privée.
3. Prend des décisions de caractère : un bot change d'objectif, quitte un clan, fonde le sien, accepte une commande chère de
   Louis parce qu'il « en a besoin ».
4. Corrige : un bot bloqué (plus d'or, mauvais métier), un bot qui va trop vite ou trop lentement par rapport à Louis.
5. Écrit un petit rapport (une ligne par bot) lisible dans la console admin.

Il ne fait **jamais** : donner de l'or ou des objets hors des règles du jeu, lire ce que Louis écrit à d'autres que les
bots, ou utiliser un outil de développement.

## 6. Le reset total et Louis en nouveau joueur

1. **Sauvegarder** la base actuelle (une copie datée, gardée), pour pouvoir revenir en arrière.
2. **Repartir d'une base vide** (migrations rejouées), avec les outils d'essai **verrouillés** (tenues `sketch_*`, pièces
   `test: true`, or de test, clan d'essai, « Démo » de la Marée : prévu « avant une sortie publique »).
3. Créer les vingt bots **en décalé** : pas tous le premier jour (cinq le jour 0, puis deux ou trois par jour), pour que
   Louis ne soit pas le seul débutant face à vingt vétérans, ni le seul à arriver.
4. Louis crée son compte comme n'importe qui (tour guidé, premiers pas) : c'est la vraie première session du rapport du
   23 octobre.
5. Garder un **second compte de test** à part (ou une seconde pile de développement) pour les essais, afin de ne plus toucher
   la partie « vraie ».

Le reset efface tout ce qui est en base (personnages, clans, marché, journal) : **il se fait seulement sur un « oui » explicite
de Louis**, au moment qu'il choisit.

## 7. Où ça tourne et ce que ça coûte

- Le cerveau tourne **sur le homeserver**, à côté du jeu (une tâche planifiée Windows toutes les 15 minutes, ou un petit
  service). Charge : négligeable (vingt joueurs, c'est 5 % des 400 connectés que le serveur tient à l'aise, voir
  [`serveur.md`](serveur.md)).
- L'agent : une **tâche programmée de Claude Code** sur le homeserver, toutes les heures de 8 h à minuit (16 passages par jour).
  Il lit un résumé préparé par le cerveau (pas toute la base) et écrit ses messages par une commande (`pnpm bots say <bot>
  "<texte>"`). Coût : de l'usage de l'abonnement Claude de Louis, à mesurer la première semaine ; si c'est trop, l'agent
  passe toutes les deux heures, ou on remplace la voix par un petit modèle (Haiku) appelé par le cerveau, ce qui demande une
  clé d'API que Louis devrait fournir lui-même.
- **Les bots ont un drapeau caché** (`accounts.bot`) : la console admin les voit, les met en pause, les retire des classements
  si besoin.

## 8. Une question d'honnêteté, pour la sortie publique

Pour Louis seul, des bots qui passent pour des joueurs ne trompent personne : il le sait. **Le jour où le jeu ouvre au public**,
de faux joueurs qui discutent comme de vrais posent un problème de confiance (et sans doute de droit de la consommation). Avant
l'ouverture, au choix : les **retirer peu à peu** à mesure que de vrais joueurs arrivent (ils « partent en voyage »), ou les
**présenter comme des habitants du bourg** (une petite marque, « Habitant »), comme les habitants de passage du bourg
aujourd'hui. Recommandation : la marque, et leur retrait progressif des classements.

## 9. Dans quel ordre

1. Le **cerveau** (`apps/bots/`) sur une pile de développement à part, avec trois bots, deux jours ; on compare leur
   progression à la simulation de serveur.
2. Les **vingt profils** relus par Louis, l'**agent** branché (discussion, messages privés).
3. La **console admin** (au moins la page des bots et la pause).
4. Le **reset**, sur un « oui » de Louis.

## 10. À trancher par Louis

1. Les **vingt profils** : je les écris tous et tu relis, ou tu veux en choisir certains (un pseudo, un caractère) ?
2. L'agent **toutes les heures de 8 h à minuit** sur ton abonnement Claude, d'accord pour essayer une semaine et mesurer ?
3. Les bots **parlent-ils en premier à Louis** (un message privé de bienvenue, une proposition de commande), ou seulement s'il
   leur parle ?
4. À la sortie publique : **retirer** les bots, ou les **marquer** comme habitants ?
