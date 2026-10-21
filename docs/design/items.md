# Modèle des objets : exemplaires, paliers, équipement

> **Remplacé en grande partie par [`combat-items.md`](combat-items.md)** (21 octobre 2026) pour tout ce qui touche à l'équipement, aux raretés, à la qualité, aux gemmes et aux ensembles. Ce document garde le modèle technique des exemplaires et de l'usure.
>
> **[Prototype]** pour les exemplaires et l'usure des outils ; le reste est **[Recommandé]** et prépare le combat (P4). Rien ci-dessous n'est décidé par Louis, sauf la **durabilité maximale qui ne baisse jamais** et l'**équipement qui s'use sans disparaître**.

## 1. Deux sortes d'objets

- **Empilables** (matières, repas, composants) : un compte par type dans le sac (`inventory[itemId]`). Aucun état propre.
- **Durables** (outils aujourd'hui, armes et armures plus tard) : le compte reste dans `inventory`, mais **chaque exemplaire a sa propre usure**, en ms de travail effectif (`state.wear[itemId]`, liste du plus usé au moins usé, les exemplaires neufs n'y figurent pas ; `engine/gear.ts`). Ça permet à une pioche à moitié usée de **rester à moitié usée quand elle change de main** (marché).
- On finit l'exemplaire le plus usé avant d'entamer le suivant ; un exemplaire usé ne donne plus son bonus mais reste dans le sac (jamais détruit). Réparer remet l'exemplaire le plus usé à neuf ; recycler jette les plus usés d'abord.

- **Réparation** (données `repair` de l'objet) : métier et niveau requis, matériaux consommés (≈ 30 % des matériaux principaux), faite par soi-même, par un artisan (demande avec rémunération) ou par le PNJ (en or). Le maximum de durabilité ne baisse jamais.
- **Étal de la guilde** (`stallPrice`) : les objets de palier 1 se vendent aussi au PNJ, mais seulement quand aucun joueur n'en propose.

## 2. Ce qui viendra (recommandations)

- **Paliers** : bronze, fer, acier, mithril, orichalque, azurite, sombracier, astralite (un par tranche de niveaux de Minage/Forge). Chaque palier = +bonus plafonné, +durabilité.
- **Qualité** (v1.0) : un exemplaire fabriqué avec des matériaux soignés ou par un artisan expérimenté peut être « bon » ou « excellent » (+durabilité, +bonus). Il faudra alors **une qualité par exemplaire** à côté de l'usure : la structure `wear[itemId]` deviendra une liste d'exemplaires `{wear, quality, maker}`.
- **Signature** : le nom de l'artisan sur l'objet, pour la réputation.
- **Emplacements d'équipement** : coiffe, épaules, haut, gants, ceinture, cape, bas, bottes (cosmétiques aujourd'hui), arme, outil, repas, plus deux bijoux avec le combat.
- **Deux couches** (proposé dans le game design) : l'**équipement** porte les statistiques, s'use et passe par le marché ; l'**apparence** (tenue cosmétique) le recouvre. L'emplacement affiche l'apparence, l'infobulle les deux.
- **Ensembles (gearsets)** : bonus de set à partir de 3 et 5 pièces d'une même famille, **plafonnés** avec les autres bonus (le tryhard reste à ×2–2,5 d'un casu). Ensembles d'événement (saisons) : cosmétiques + variantes de stats, jamais des statistiques exclusives.
- **Armures par style** (mêlée, tir, magie) : le triangle mêlée > tir > magie > mêlée se lit sur l'équipement.

## 3. Quand s'y mettre

- **Maintenant** (fait) : exemplaires et usure des outils, parce que le marché en dépend.
- **Avec le combat (P4)** : armes, armures, paliers et sets. Hors combat, aucun joueur n'a besoin d'une armure : le marché n'aurait pas de clients.
- **Avant le combat** (à faire) : un écran d'**équipement** (équiper/déséquiper) et le choix d'une **tenue**, pour que le sac et l'équipement cessent d'être un seul inventaire.

## 4. Questions pour Louis

1. **Qualité des objets** : oui dès la v1 du combat, ou plus tard ?
2. **Sets** : bonus à 3 et 5 pièces, ou un bonus unique à la pièce complète ?
3. **Objets liés** : un objet signé peut-il être vendu, ou est-il lié au personnage (cosmétiques seulement) ?
