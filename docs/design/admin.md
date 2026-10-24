# La console d'administration

> **Statut** : conçue le 24 octobre 2026 (soir), à la demande de Louis : « un endroit où je peux gérer l'entièreté du jeu
> sans interférer ou toujours passer par toi : faire des annonces pour tout le monde, gérer des trucs ». **Rien n'est codé.**
> Tout ce qui suit est **proposé par Claude**, à valider.
>
> Références regardées : le tableau de bord LiveOps de Metaplay (fiche joueur, sanctions, courrier avec pièces jointes,
> journaux, guildes), le Game Manager de PlayFab (segments de joueurs, communications, rôles et permissions), les panneaux
> d'administration des serveurs communautaires (FiveM, Hytale : surveiller, rendre muet, expulser, bannir). Tous ont la même
> colonne vertébrale : **trouver un joueur, agir sur lui, parler à tout le monde, voir l'état du jeu, et tout garder dans un
> journal**.

## 1. Le principe

- **Dans le jeu, pas à côté** : une page `/#admin` du client (chargée à part, jamais envoyée aux joueurs), utilisable sur
  téléphone (Louis joue et gère souvent à distance). Le serveur a ses routes `/api/admin/*`.
- **Trois rôles** : joueur, **modérateur** (existe déjà : discussion, photos, devises), **administrateur** (Louis). Un
  modérateur voit les signalements et sanctionne ; seul l'administrateur donne de l'or ou des objets, touche aux réglages, aux
  événements et aux bots.
- **Rien sans trace** : chaque action d'un administrateur ou d'un modérateur est écrite dans un **journal d'audit** (qui,
  quoi, sur qui, avant, après, motif). Les actions qui créent quelque chose (or, objets) ou qui sanctionnent demandent un
  **motif écrit**. On peut toujours relire ce qui a été fait et le défaire.
- **Pas de SQL à la main** : la console ne fait que des actions prévues, avec les mêmes règles que le jeu (le serveur reste
  l'autorité). C'est ce qui permet à Louis de tout gérer sans risquer de casser la base.
- **Sécurité** [à décider par Louis] : le compte administrateur a un mot de passe long, se reconnecte pour les actions
  sensibles (re-saisie du mot de passe), et **la console ne répond qu'aux adresses autorisées** (le réseau de la maison, ou
  un accès privé type Tailscale). Si quelqu'un vole la session de Louis depuis l'extérieur, il n'a pas la console.

## 2. Ce qu'on y trouve

### 2.1 Accueil : l'état du jeu en un coup d'œil

- **Maintenant** : joueurs en ligne, actifs sur 24 h et 7 jours, nouveaux comptes du jour, inscrits à la Marée de ce soir.
- **Santé du serveur** : temps de réponse (médiane et 95ᵉ centile), erreurs, processeur, mémoire, taille de la base,
  dernière sauvegarde réussie. Une alerte rouge si quelque chose ne va pas (voir [`serveur.md`](serveur.md)).
- **À traiter** : signalements en attente, joueurs muets qui reviennent, commandes bloquées, erreurs nouvelles.
- **Économie** : or en circulation, or créé et détruit hier (par source), volume du marché, les dix objets les plus échangés.

### 2.2 Annonces : parler à tout le monde

| Forme | Où le joueur la voit | Pour quoi |
|---|---|---|
| **Bandeau** | dans la barre du haut, à côté des bandeaux d'événement (place déjà prévue, `Banners events`) | maintenance à venir, événement qui commence |
| **Message du fil** | le fil du serveur (Panneau, journal) avec une marque « Annonce » | nouvelles, gagnants, remerciements |
| **Fenêtre à la connexion** | une fois par joueur, à sa prochaine visite | grosse mise à jour, notes de version, changement de règle |
| **Notification** | celle du navigateur (déjà là, `Notifier.tsx`) | « la Marée commence », « maintenance dans 10 min » |

Chaque annonce a un **début et une fin** (programmable : « demain 18 h »), un **public** (tout le monde, un clan, les
nouveaux, ceux qui n'ont pas joué depuis 7 jours), un **aperçu** avant d'envoyer, et peut être retirée. Les **notes de
version** (ce qui a changé) s'écrivent ici aussi et restent consultables par les joueurs (« Quoi de neuf »).

**Mode maintenance** : un compte à rebours annoncé à tous (« maintenance dans 15 min »), puis le jeu refuse les actions avec
un message propre, puis rouvre. Personne ne perd rien : la progression hors ligne continue de compter (elle se calcule au
retour).

### 2.3 Joueurs

- **Recherche** par pseudo, identifiant, clan, adresse ; la **fiche** : profil, niveaux, or, sac, équipement, ordres du
  marché, commandes, clan, amis, sanctions passées, dernières connexions, **comptes liés** (même adresse, même appareil :
  utile contre les multi-comptes, sans conclure tout seul, puisqu'un foyer partage la même adresse).
- **Son journal** : tout ce qui s'est passé pour lui (le journal du jeu, ses achats et ventes, ses commandes), pour répondre
  à « j'ai perdu mon or ! ».
- **Sanctions** : avertir (message privé du jeu), rendre muet (existe), suspendre (n heures ou jours), bannir ; chaque
  sanction avec son motif, sa durée et qui l'a donnée. Retirer une photo, une devise, **renommer** un pseudo injurieux.
- **Réparer** : rendre de l'or ou un objet perdu par un bug, débloquer une commande coincée, rendre un outil, rembourser une
  Marée ratée à cause d'une panne. Toujours avec un motif ; c'est l'action la plus surveillée du journal d'audit.

### 2.4 Modération

Une file unique de **signalements** (messages publics, messages privés, photos, devises, pseudos), du plus signalé au moins
signalé, avec le contexte (les messages autour), et des boutons : garder, masquer, sanctionner. Le jeu masque déjà tout seul
après trois signalements ; la file sert à confirmer ou à rétablir.

### 2.5 Économie

- **Or créé et détruit par jour, par source** : Comptoir, commandes PNJ, commandes de maître, vente au marché (taxe
  détruite), bâtiments, Mécène, Affineur… La courbe dit tout de suite si l'or gonfle.
- **Prix** : un indice des prix (panier de matières), la courbe de chaque objet (existe déjà côté joueur).
- **Fortunes** : les plus riches, ceux dont l'or a bondi en un jour.
- **Échanges suspects** : un objet vendu dix fois sa valeur entre deux comptes liés (cadeau d'or déguisé), une commande au
  plafond entre deux comptes de la même adresse. La console signale, Louis décide.

Il faut pour cela un **registre de l'or** côté serveur (chaque gain et chaque dépense, par source), qui n'existe pas encore :
c'est la première brique de cette page.

### 2.6 Événements

Le calendrier des événements (voir [`evenements.md`](evenements.md)) : ce qui tourne, ce qui vient, ce qui est fini, avec
leurs chiffres (participants, contributions). Lancer un événement **à partir d'un modèle** (« week-end XP ×1,5 en Minage »,
« Concours des Maîtres », « Marée exceptionnelle »), le programmer, l'arrêter. La Marée du soir a ses propres boutons :
annuler ce soir (en cas de panne, avec compensation), forcer le type du soir.

### 2.7 Courrier et cadeaux

Une **boîte aux lettres** dans le jeu (nouvelle : elle n'existe pas encore) : un message de l'équipe avec, en pièce jointe,
de l'or, des objets ou des éclats, à un joueur, un clan ou tout le monde (compensation après une panne, récompenses d'un
concours, cadeau de lancement). Le joueur la reçoit à son passage, comme les ventes du marché. **Jamais de statistiques ni de
puissance** (principe 4) : de l'or, des matières, des cosmétiques.

### 2.8 Réglages en direct

Quelques réglages **choisis à l'avance** se changent sans redémarrer ni passer par le code : multiplicateur d'XP d'un
week-end, taxe du marché, nombre de commandes PNJ par jour, ouverture des inscriptions de comptes, mode maintenance. Chaque
changement est daté, motivé et réversible en un clic. Le reste du contenu reste dans `data/` (versionné, testé) : changer
une recette ou une zone passe par une mise à jour, pas par la console, pour ne jamais casser l'équilibre sans simulation.

### 2.9 Bots

La page des joueurs simulés ([`bots.md`](bots.md)) : la liste, ce que chacun fait, le dernier passage de l'agent, son
journal, et les boutons **mettre en pause / reprendre** (tous ou un seul) et « retirer du classement ».

### 2.10 Serveur

Version déployée, temps depuis le dernier démarrage, sauvegardes (dernière, taille, test de restauration), erreurs récentes
(regroupées par type), et les seuils d'alerte. Pas de bouton « redémarrer » ni « restaurer » dans la console : ce sont des
opérations sur la machine, faites à part et volontairement.

## 3. Ce qu'il faut ajouter au serveur

| Brique | Pour quoi |
|---|---|
| `accounts.role` gagne `admin` | les routes `/api/admin/*` le vérifient |
| table `admin_actions` (journal d'audit) | toute action de la console |
| table `announcements` (texte, forme, public, début, fin) | bandeaux, fil, fenêtre à la connexion, notes de version |
| table `sanctions` (type, durée, motif, auteur) | suspendre et bannir (le muet existe déjà sur `accounts`) |
| table `gold_ledger` (personnage, montant, source, date) | page Économie ; écrite là où l'or bouge déjà (`play()`, marché, commandes) |
| table `mail` (destinataire ou public, texte, pièces jointes, lu, reçu) | courrier et compensations |
| table `live_settings` (clé, valeur, auteur, date) | réglages en direct, lus par-dessus `settings.yaml` |
| mesures du serveur (temps de réponse, erreurs) | page Accueil et alertes |

## 4. Dans quel ordre

1. **Le socle** (environ une journée de travail) : rôle administrateur, journal d'audit, page d'accueil (joueurs en ligne,
   santé), **annonces** (bandeau, fil, fenêtre à la connexion), recherche et fiche d'un joueur, sanctions, file de
   signalements. Avec ça, Louis gère l'ouverture seul.
2. **Avant la sortie publique** : registre de l'or et page Économie, courrier et compensations, mode maintenance.
3. **Avec les événements et les bots** : calendrier, modèles d'événements, réglages en direct, page des bots.

## 5. À trancher par Louis

1. La console **seulement depuis la maison** (et un accès privé), ou aussi depuis n'importe où avec une seconde vérification ?
2. Des **modérateurs** autres que Louis au lancement (des joueurs de confiance) ? Ils ne verraient que la modération.
3. La **boîte aux lettres** : aussi entre joueurs (envoyer un objet à un ami), ou seulement de l'équipe vers les joueurs ?
