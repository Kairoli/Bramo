# Rangs de métier : surnoms et commandes du maître

> **Statut : [Décidé] le 21 octobre 2026 et [Prototype] depuis le même jour.** Les points marqués *choix de Claude* (XP en attente, quantités, noms et histoires) ont été tranchés par Claude à la demande de Louis (« je te laisse tout faire ») : à relire et à valider. Le code applique cette règle ; `settings.titles` et les anciennes épreuves 30 et 60 n'existent plus.

## 1. Le principe [Décidé]

- Les rangs de métier sont des **surnoms amusants propres à chaque métier**, à la place des titres génériques Apprenti, Compagnon, Maître, etc.
- Aux niveaux **20, 40, 60 et 80**, le maître du métier propose une **commande spéciale**.
- La réussir **accorde le surnom** du palier et **débloque la tranche de progression suivante**.
- Au niveau **99**, une **commande finale exceptionnelle**.
- Chaque commande raconte une **petite histoire, idéalement drôle**, qui explique le surnom obtenu.
- Elle repose sur les **activités automatiques** du jeu : récolte ou fabrication spéciale, préparation et livraison. **Aucun mini-jeu manuel obligatoire.**
- Le joueur peut **afficher n'importe lequel de ses surnoms déjà débloqués**, même après avoir obtenu un rang supérieur.

## 2. Exemple : la Cuisine (pistes, pas une liste définitive)

| Palier | Surnom possible | Histoire possible |
|---|---|---|
| 20 | Remueur de marmites | — |
| 40 | Fournisseur de siestes | Un banquet si copieux que toute une délégation s'endort avant les discours. |
| 60 | Terreur des buffets | — |
| 80 | Celui qui régale les rois | — |
| 99 | *(commande finale, à écrire)* | — |

## 3. Ce qui change par rapport à l'ancienne règle

| | Ancienne règle (remplacée) | Nouvelle règle |
|---|---|---|
| Paliers | 30, 60, 85, 99 | 20, 40, 60, 80, et 99 |
| Rang | Titre générique commun à tous les métiers | Surnom propre au métier, raconté par une commande |
| Sans la commande | Le niveau continue de monter ; seul le titre attend | La commande **débloque la tranche suivante** : la progression du métier attend sa validation |
| Affichage | Le plus haut titre acquis | Au choix, n'importe quel surnom débloqué |
| Nature de l'épreuve | Remettre des objets, chef-d'œuvre pour l'artisanat | Commande racontée : récolte ou fabrication spéciale, préparation, livraison |

Les références aux titres dans les autres documents (Maître 85 pour les postes d'experts du clan, Grand maître 99 pour les trophées) se lisent désormais avec les paliers 80 et 99.

## 4. Ce qui est implémenté

- **Paliers** : `settings.ranks.levels` = 20, 40, 60, 80, 99. Une commande par métier et par palier (`data/trials.yaml`, 35 au total pour les 7 métiers jouables), avec **titre, histoire d'introduction du maître, histoire racontée à la réussite (`outro`) et surnom**.
- **Surnom de départ** par métier (`nickname` dans `professions.yaml`), puis un surnom par commande réussie. Le joueur **affiche celui qu'il veut** parmi les débloqués (`state.shown`, `POST /api/nickname`, sélecteur dans la salle du métier) ; le dernier obtenu s'affiche d'office.
- **Déblocage de la tranche** : le niveau effectif d'un métier est **borné au prochain palier dont la commande n'est pas réussie** (`effectiveLevel`, `skillLevel` dans `engine/trials.ts`). Les recettes, les bonus et les commandes PNJ utilisent ce niveau.
- **XP en attente [choix de Claude]** : l'XP **continue de s'accumuler au-delà du palier**, sans plafond et sans perte ; elle est simplement affichée comme « XP en attente » et **débloquée d'un coup à la validation** (le niveau saute alors jusqu'au palier suivant ou à celui que l'XP permet). Aucun joueur absent ne perd son travail, et personne n'est bloqué : la commande se prépare avec les activités automatiques du jeu.
- **Commandes [choix de Claude]** : des objets à livrer (récolte, ou fabrication de la chaîne du métier), en quantités calculées sur un budget de travail par palier (30 min, 1 h 30, 3 h, 6 h, 12 h) et des récompenses de 300, 800, 1 500, 3 000 et 6 000 or. Pas de chef-d'œuvre spécial pour l'instant (le champ `trial` des recettes reste disponible).
- **Annonces** : la réussite d'une commande s'affiche sur le fil du serveur (« X devient « Cœur de la montagne » en Minage ») ; le niveau 20, 40, 60, 80 et 99 aussi.

### Les surnoms

| Métier (maître) | Départ | 20 | 40 | 60 | 80 | 99 |
|---|---|---|---|---|---|---|
| Minage (Orvald) | Gratte-sol | Gratteur de galeries | Chuchoteur de filons | Fléau des éboulements | Salué par les nains | Cœur de la montagne |
| Bûcheronnage (Aldra) | Ramasseur de brindilles | Collectionneur d'écorce | Fendeur de querelles | Chuchoteur de chênes | Désespoir des castors | La forêt à lui tout seul |
| Herboristerie (Ysolde) | Cueilleur de pissenlits | Cueilleur d'aube | Ami des orties | Chuchoteur de givre | Terreur des plates-bandes | La Brume en personne |
| Pêche (Naël) | Lanceur de lignes | Lanceur patient | Fâcheux des brochets | Veilleur de lanternes | Seigneur des marées | Légende de la jetée |
| Forge (Brunhild) | Souffleur de braises | Tapeur d'enclume | Semeur d'étincelles | Gardien du feu sacré | Forgeron des rois | Enclume vivante |
| Menuiserie (Joris) | Aligneur de planches | Équarrisseur de planches | Ponceur de patience | Chuchoteur de poutres | Charpentier de légende | Sciure d'or |
| Cuisine (Bertin) | Éplucheur de légumes | Remueur de marmites | Fournisseur de siestes | Terreur des buffets | Celui qui régale les rois | Gourmet de légende |

## 5. Reste à faire [Ouvert]

- **Relire les noms et les histoires** (`data/trials.yaml`) : ton, humour, cohérence avec l'univers.
- **Équilibrer** les quantités et les récompenses avec le simulateur (les bots valident aujourd'hui sans délai).
- **Les 10 autres métiers** (Chasse, Tannerie, Couture, Alchimie, etc.) auront leurs commandes à leur ouverture.
- La place de la commande du 99 (cosmétique, trophée) et le rapport avec les postes d'experts du clan (probablement le surnom du palier 80).
- Un écran « Mes surnoms » dans la salle Personnage (aujourd'hui le sélecteur est dans la salle du métier).
