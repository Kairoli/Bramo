# Rangs de métier : surnoms et commandes du maître

> **Statut : [Décidé] le 21 octobre 2026 et [Prototype] depuis le même jour.** Les points marqués *choix de Claude* (XP en attente, quantités, noms et histoires) ont été tranchés par Claude à la demande de Louis (« je te laisse tout faire ») : à relire et à valider. Le code applique cette règle ; `settings.titles` et les anciennes épreuves 30 et 60 n'existent plus.

> **Précision de Louis (21 octobre, après le premier prototype)** : « rien n'est perdu, c'est seulement pour un titre ». Le niveau **ne bloque donc plus** : la commande ne donne que le **surnom** (et l'or). Le blocage de la tranche reste codé derrière `settings.ranks.gatesLevel` (`false` aujourd'hui) si on veut le rétablir, avec l'XP gardée et créditée à la validation.

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

- **Paliers** : `settings.ranks.levels` = 20, 40, 60, 80, 90, 99 (le 90 ajouté le 24 octobre, avec ses ornements). Une commande par métier et par palier (`data/trials.yaml`, 102 pour les 17 métiers), avec **titre, histoire d'introduction du maître, histoire racontée à la réussite (`outro`) et surnom**.
- **Surnom de départ** par métier (`nickname` dans `professions.yaml`), puis un surnom par commande réussie. Le joueur **affiche celui qu'il veut** parmi les débloqués (`state.shown`, `POST /api/nickname`, sélecteur dans la salle du métier) ; le dernier obtenu s'affiche d'office.
- **Déblocage de la tranche** : le niveau effectif d'un métier est **borné au prochain palier dont la commande n'est pas réussie** (`effectiveLevel`, `skillLevel` dans `engine/trials.ts`). Les recettes, les bonus et les commandes PNJ utilisent ce niveau.
- **XP en attente [choix de Claude]** : l'XP **continue de s'accumuler au-delà du palier**, sans plafond et sans perte ; elle est simplement affichée comme « XP en attente » et **débloquée d'un coup à la validation** (le niveau saute alors jusqu'au palier suivant ou à celui que l'XP permet). Aucun joueur absent ne perd son travail, et personne n'est bloqué : la commande se prépare avec les activités automatiques du jeu.
- **Commandes [choix de Claude]** : des objets à livrer (récolte, ou fabrication de la chaîne du métier), en quantités calculées sur un budget de travail par palier (30 min, 1 h 30, 3 h, 6 h, 9 h, 12 h) et des récompenses de 3 000, 8 000, 15 000, 30 000, 45 000 et 60 000 or. Pas de chef-d'œuvre spécial pour l'instant (le champ `trial` des recettes reste disponible).
- **Annonces** : la réussite d'une commande s'affiche sur le fil du serveur (« X devient « Cœur de la montagne » en Minage ») ; le niveau 20, 40, 60, 80 et 99 aussi.

### Les surnoms

| Métier (maître) | Départ | 20 | 40 | 60 | 80 | 90 | 99 |
|---|---|---|---|---|---|---|---|
| Minage (Orvald) | Gratte-sol | Casse-cailloux | Oreille des filons | Étai des galeries | Salué par la Taupinière | Lampe du fond | Cœur de la montagne |
| Bûcheronnage (Aldra) | Ramasseur de brindilles | Collectionneur d’écorce | Fendeur de querelles | Beau-parleur des chênes | Désespoir des castors | La Hache tranquille | La Forêt qui marche |
| Pêche (Naël) | Lanceur de lignes | Taiseux de la baie | Fâcheux des brochets | Noctambule des quais | Berger de la houle | Silence des grands fonds | Légende de la jetée |
| Herboristerie (Ysolde) | Cueilleur de pissenlits | Cueilleur d’aube | Ami des orties | Cueille-à-reculons | Terreur des plates-bandes | Rosée des Lointains | La Brume en personne |
| Chasse (Brenna) | Pisteur du dimanche | Liseur de traces | Sommeil des bergers | Patte-d’Ours | Pisteur des neiges | Lit-dans-la-brume | L’Arc de Brenna |
| Agriculture (Anselme) | Arrache-chiendent | Semeur des terrasses | Récolteur de nuages | Le Bleu du Val | Grenier plein | Blé-sur-sel | Voix des champs |
| Forge (Brunhild) | Souffleur de braises | Tapeur d’enclume | Pluie d’étincelles | Le Feu sacré | Créancier du Bastion | Rallume-forges | Enclume vivante |
| Menuiserie (Joris) | Aligneur de planches | Équarrisseur de planches | Ponceur de patience | Maître chanteur des poutres | Mille-Ans | Niveau à bulle | Sciure d’or |
| Tannerie (Hugon) | Racleur de peaux | Nez bouché | Cuir-bouilli | Enfin du sérieux | Increvable | Un an et un jour | Main de cuir |
| Couture (Lise) | Enfileur d’aiguilles | Ourlet-de-travers | Doigts de fée | Aiguille d’argent | Voile-Bleue | Reprise invisible | Fil d’or |
| Cuisine (Bertin) | Éplucheur de légumes | Remueur de marmites | Fournisseur de siestes | Corne d’abondance | Coupe-sifflet | Goût d’enfance | Table ouverte |
| Alchimie (Évariste) | Touilleur de chaudrons | Sourcils roussis | Apothicaire de garde | Distillateur de lumière | Remède de la digue | Fume-violet | Panacée |
| Joaillerie (Sidonie) | Polisseur de cailloux | Sertisseur de perles | Fait-dire-oui | Orfèvre du conseil | Brille-trop | Nomme-les-pierres | Couronne sans tête |
| Enchantement (Ilian) | Gribouilleur de runes | Graveur de gardes | Ouvre-portes | Lieur de mémoire | Veilleur des runes | L’Encre qui reste | Souvenance |
| Artificerie (Capucine) | Tourneur de vis | Deux minutes d’avance | Fusée de garde | Bouquet final | Agace-géants | Apprivoise-outils | Âme des rouages |
| Construction (Gautier) | Porteur de moellons | Fil-à-plomb | Nom sous l’arche | Bâtisseur de ponts | Pierre d’angle | Mur sans histoire | Cent Marées |
| Exploration (Ombeline) | Plan à l’envers | Arpenteur du bois | Poches pleines | Plongeur des archives | Rose des vents | Boussole têtue | Pas-perdu des Lointains |

Passe éditoriale du 24 octobre (titres, répétitions, palier 90) : [`titres/passe-editoriale.md`](titres/passe-editoriale.md).

## 5. Reste à faire [Ouvert]

- **Relire les noms et les histoires** (`data/trials.yaml`) : ton, humour, cohérence avec l'univers.
- **Équilibrer** les quantités et les récompenses avec le simulateur (les bots valident aujourd'hui sans délai).
- La place de la commande du 99 (cosmétique, trophée) et le rapport avec les postes d'experts du clan (probablement le surnom du palier 80).
- Un écran « Mes surnoms » dans la salle Personnage (aujourd'hui le sélecteur est dans la salle du métier).
