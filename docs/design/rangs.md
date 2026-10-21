# Rangs de métier : surnoms et commandes du maître

> **Statut : [Décidé] le 21 octobre 2026, pas encore implémenté.** Ce document **remplace** les titres classiques (Novice, Apprenti 30, Compagnon 60, Maître 85, Grand maître 99) et les épreuves des maîtres aux niveaux 30 et 60. Le code actuel (`data/trials.yaml`, `engine/trials.ts`, `settings.titles`) applique encore l'ancienne règle : voir `CLAUDE.md`, état du projet.

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

## 4. Reste à concevoir [Ouvert]

- **Les commandes** de chaque métier et palier : ce qu'on récolte ou fabrique, en quelle quantité, la recette spéciale éventuelle, la livraison.
- **Les noms définitifs** des surnoms, métier par métier, et leurs histoires.
- **L'XP en attente de validation du palier** : ce que devient l'XP gagnée quand la tranche suivante n'est pas encore débloquée (accumulée puis créditée à la validation, plafonnée, convertie, ou autre). À trancher en gardant à l'esprit les piliers « personne n'est bloqué » et « on ne punit jamais l'absent » : un joueur parti plusieurs jours ne doit pas découvrir que son travail a été perdu.
- La place de la commande du niveau 99 (surnom ultime, cosmétique, annonce sur le fil du serveur).
- Le rapport avec les postes d'experts du clan (aujourd'hui pensés pour le niveau 85 → probablement le surnom du palier 80).
