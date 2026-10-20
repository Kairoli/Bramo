# Bramo — contexte projet

Bramo est un **idle-RPG multijoueur jouable dans le navigateur**, dans l'esprit de SimpleMMO, Melvor Idle et RuneScape : métiers, classes, clans, marché, saisons.
Le game design complet est dans [`docs/game-design.md`](docs/game-design.md). Les maquettes validées sont dans [`docs/maquettes/`](docs/maquettes/).
Ce fichier suffit à reprendre le projet sans autre contexte : le lire en entier avant toute modification.

## Principes non négociables

1. **Personne n'est bloqué, mais personne ne fait tout seul.** Tout peut se monter seul, mais le temps pousse à se spécialiser, à commercer et à rejoindre un clan.
2. **Le jeu reste casu.** Ce n'est pas une course au niveau max. Un tryhard progresse environ **2 à 2,5 fois** plus vite qu'un casu, jamais 10 fois. Toute nouvelle mécanique doit respecter ce ratio.
3. **On ne punit jamais le joueur absent, on récompense toujours le joueur présent.** Pas de perte, pas de pénalité, pas de dégradation pendant l'absence. Le présent gagne plus ; l'absent ne perd rien.
4. **Le payant ne vend que du confort et du cosmétique**, jamais de statistiques ni de ressources.
5. **Le serveur fait autorité sur tous les calculs** (anti-triche). Le client ne fait qu'afficher et envoyer des intentions (« lancer telle recette ×100 »). Il ne calcule jamais lui-même un gain ou une progression qui serait pris pour vrai.

## Le contenu vit dans les données, pas dans le code

- Tout le contenu et l'équilibrage sont dans `data/` en **YAML** : métiers, recettes, objets, tables d'XP, classes, réglages globaux (`data/settings.yaml`).
- Le serveur charge et **valide ces fichiers au démarrage avec zod** (schémas dans `packages/shared`). Un fichier invalide empêche le démarrage, avec un message clair.
- **Aucun chiffre de jeu codé en dur** dans le code : taux hors ligne, plafonds, bonus, longueur de file, durées, XP… tout vient des données. Les formules (forme mathématique) vivent dans `packages/shared`, leurs paramètres dans `data/`.
- Les valeurs provisoires sont marquées en commentaire **`# à équilibrer`**.
- `sim/` accueillera plus tard un simulateur d'équilibrage (bots par profil : casu, régulier, tryhard, marchand) qui lira **les mêmes fichiers** et les mêmes formules partagées. Le dossier existe, il n'est pas développé pour l'instant.

## Décisions techniques

- **TypeScript partout**, monorepo **pnpm** :
  - `apps/server` : Node + Fastify. API, auth, calcul de la progression.
  - `apps/web` : React + Vite. Affichage uniquement.
  - `packages/shared` : types, schémas zod, formules de jeu pures et testées (utilisées par le serveur, le client pour l'affichage prévisionnel, et le simulateur).
- **PostgreSQL** via `docker-compose` en local, ORM **Drizzle**. Rester **compatible Supabase** (Postgres standard, pas d'extension exotique, migrations SQL versionnées dans `apps/server/drizzle/`, appliquées au démarrage).
  - Sans `DATABASE_URL`, le serveur bascule sur **PGlite** (Postgres embarqué, `apps/server/.pglite/`) : aucun prérequis pour développer. Les tests d'API utilisent PGlite en mémoire.
  - **Cible de production** : PostgreSQL et les données hébergés sur le homeserver de l'auteur (à mettre en place plus tard ; seule `DATABASE_URL` changera).
- **Tests : vitest**, en priorité sur les formules (XP, gains hors ligne, énergie, plafonds de bonus).
- `pnpm dev` lance tout en local. Le README explique l'installation.
- **Calcul à la demande** : pas de boucle serveur permanente. La progression se déduit d'horodatages (début de l'activité, dernière visite) au moment où le joueur interagit ou se connecte.
- **Comptes** : pseudo + mot de passe (haché), un personnage par compte.

## Conventions

- **Texte du jeu en français** (UI, noms d'objets, journal). **Code, identifiants, noms de fichiers et de clés en anglais** (`mining`, `bronze_ingot`). Les libellés français sont dans les données (`name: Lingot de bronze`).
- Commits **petits et clairs**, un par étape logique, message à l'impératif.
- Les formules sont des fonctions pures, sans accès base ni horloge implicite (le temps est toujours passé en paramètre).
- Tout montant affiché au joueur vient du serveur.

## Règles de jeu du prototype (P1)

- **Courbe d'XP RuneScape**, niveaux 1 à 99 : `XP(L) = floor( Σ_{l=1}^{L-1} floor(l + 300·2^(l/7)) / 4 )`. Niveau 99 = **13 034 431 XP** (vérifié par un test).
- **Titres de métier** : Novice (1), Apprenti (30), Compagnon (60), Maître (85), Grand maître (99).
- **Une seule activité idle à la fois** (un métier), plus une **file d'actions** (longueur 3, dans les réglages).
- **Gains** : 100 % en actif ; ~25 % hors ligne, plafonné à 12 h d'accumulation ; **énergie quotidienne** à 150 % sur les 2 premières heures actives de la journée.
- **Bonus plafonnés** (réglages) : outil +30 %, potion ou repas +10 %, clan +10 %, saison +20 %.
- **Résumé d'absence** : popup automatique à la connexion (XP, objets produits, niveaux pris), puis consultable dans le journal.
- **Métiers** : 14 dans les données. Jouables en P1 : Minage, Forge, Herboristerie, Cuisine (5 à 6 recettes chacun, chaînes entre eux). Les autres sont marqués « bientôt ».
- Hors P1 : combat et classes, marché, clans, saisons. L'architecture doit pouvoir les accueillir (ex. les bonus clan/saison existent dans le calcul mais valent 0).

## Interface

- **Un accueil et cinq salles** : Accueil, Métiers, Personnage, Clan, Marché, Combat → six onglets dans la barre du haut. Tout le reste s'ouvre **en popup ou en volet, jamais en nouvel écran**.
- **Aucun scroll de page.** Cible 1440×900, doit rester correct à 1280×720. Le scroll interne à un panneau (journal) est permis.
- **Squelette commun** : en haut une bande visuelle (le lieu), en bas le contenu.
- **Une seule police** : Bricolage Grotesque (Google Fonts).
- **Palette « Anthracite et cuivre »**, uniquement via jetons CSS :

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

Le détail écran par écran (accueil, salle Métiers, salle d'un métier) est dans `docs/game-design.md`, section Interface.

## Personnages

- Le personnage est **toujours à gauche de la scène**, en **trois quarts vers la droite** : regard, arme et sorts vont vers la droite. **On ne le retourne jamais en miroir** (sur une carte, on utilise un portrait ou un pion).
- **Proportions réalistes** (7,5 à 8 têtes), pas de grosse tête. Ambiance sombre mais lisible sur l'anthracite grâce à la lumière de contour et aux touches vives.
- **L'apparence ne dépend jamais de la classe.** La classe se lit à l'arme et à l'effet, dans sa couleur d'affinité : magie #B39DF5 ; mêlée #F08A4B et tir #7ED6A2 sont des propositions à valider.
- Les cosmétiques sont le seul revenu : une nouvelle tenue se fait **sans retoucher les animations**.
- Style original (esprit Dofus ou Darkest Dungeon permis, formes copiées interdites).
- **Système** : gabarit à os + pièces SVG par emplacement + animations en images clés, modèle compatible Spine/Rive. Tout est décrit dans [`art/README.md`](art/README.md). Tenues dans `data/cosmetics.yaml`, armes et effets de classe dans `data/classes.yaml`. Rendu : `apps/web/src/rig/Character.tsx`, trois niveaux de détail (portrait ~80 px, scène ~400 px, combat). Page de test : `/#atelier`.
- En P1, tous les personnages s'affichent avec l'apparence par défaut (`cosmetics.yaml > default` : Cendres + Runiste), en attendant le choix de classe et de tenue.

## Architecture du moteur (P1)

- `packages/shared/src/engine/advance.ts` : `advance(state, now, content)` fait avancer un personnage jusqu'à `now` à partir des horodatages (`lastTickAt`, `lastSeenAt`). Fenêtres successives : actif (×énergie tant qu'il en reste, sinon ×1) pendant `activeTimeoutSec` après le dernier signe de vie, puis hors ligne (×0,25) pendant 12 h, puis plus rien. Les bonus plafonnés multiplient la vitesse. Fonction pure, testée.
- `packages/shared/src/engine/actions.ts` : intentions du joueur (lancer, mettre en file, annuler, manger, acheter, vendre), pures, lèvent `GameError` avec un message français affichable.
- `apps/server/src/game.ts` : `play()` est le point d'entrée unique de toute requête de jeu (verrouiller → avancer → action → marquer présent → enregistrer → journal). Le résumé d'absence est renvoyé une seule fois, puis reste dans le journal.
- Côté client, `GET /api/state` sert de signe de vie (toutes les `heartbeatSec` tant que l'onglet est visible). L'anneau de progression est une interpolation d'affichage ; la vérité revient à chaque réponse.
- Le poisson des recettes de Cuisine est vendu par le **marchand du port** (PNJ, prix dans `items.yaml`) tant que la Pêche n'est pas ouverte.

## Arborescence (cible)

```
apps/server     API Fastify, auth, persistance Drizzle, calcul de progression
apps/web        client React/Vite
packages/shared schémas zod, types, formules pures + tests
data/           contenu et équilibrage en YAML
sim/            simulateur d'équilibrage (plus tard)
docs/           game design, maquettes
art/            gabarit, pièces et animations des personnages
```
