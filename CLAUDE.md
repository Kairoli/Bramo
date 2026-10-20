# Bramo — contexte projet

Bramo est un **idle-RPG multijoueur jouable dans le navigateur**, dans l'esprit de SimpleMMO, Melvor Idle et RuneScape : métiers, classes, clans, marché, saisons.

- Game design complet : [`docs/game-design.md`](docs/game-design.md)
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

- Contenu et équilibrage en **YAML** dans `data/` : `settings.yaml` (réglages globaux), `professions.yaml`, `items.yaml`, `recipes/*.yaml`, `classes.yaml`, `cosmetics.yaml`.
- Chargés et **validés au démarrage avec zod** (schémas dans `packages/shared/src/schemas/`), y compris les références croisées (recette → objet, tenue → pièce de `art/`…). Un fichier invalide empêche le démarrage avec un message clair.
- **Aucun chiffre de jeu codé en dur.** Les formules (forme mathématique) sont dans `packages/shared`, leurs paramètres dans `data/`.
- Valeurs provisoires marquées **`# à équilibrer`**.
- `sim/` accueillera le simulateur d'équilibrage (bots casu, régulier, tryhard, marchand) qui lira **les mêmes fichiers et formules**. Vide pour l'instant.

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

### Fait — P1, prototype solo

**Moteur de jeu** (`packages/shared`, 44 tests)
- Courbe d'XP RuneScape 1–99 (test : niveau 99 = 13 034 431 XP), titres Novice / Apprenti (30) / Compagnon (60) / Maître (85) / Grand maître (99).
- `engine/advance.ts` : `advance(state, now, content)` fait avancer un personnage à partir de `lastTickAt` et `lastSeenAt`. Fenêtres successives : actif pendant `activeTimeoutSec` après le dernier signe de vie (×1,5 tant qu'il reste de l'énergie quotidienne, sinon ×1), puis hors ligne ×0,25 pendant 12 h, puis plus rien (rien n'est perdu). Les bonus plafonnés (outil 30 %, repas 10 %, clan 10 %, saison 20 % ; clan et saison valent 0 en P1) multiplient la vitesse. L'énergie ne se consomme que si une activité tourne. Calculer en une fois ou en plusieurs fois donne le même résultat (testé).
- `engine/actions.ts` : lancer (remplacer ou mettre en file, file de 3), annuler, manger un repas (un seul bonus actif), acheter et vendre au marchand PNJ. Erreurs = `GameError` avec message français.
- `engine/view.ts` : ce que le client reçoit (niveaux, titres, rendement détaillé, énergie).

**Données** (`data/`)
- 14 métiers (Récolte : Minage, Bûcheronnage, Pêche, Herboristerie, Chasse ; Artisanat : Forge, Menuiserie, Cuisine, Alchimie, Couture, Artificerie, Enchantement ; Monde et clan : Construction, Exploration). **Jouables : Minage, Forge, Herboristerie, Cuisine**, 6 recettes chacun. Les autres sont `status: soon`.
- Chaînes : minerai → lingot → lame ou pioche (les pioches donnent le bonus d'outil du Minage) ; herbes + poisson → repas (bonus temporaire).
- Le poisson est vendu par le **marchand du port** (PNJ) tant que la Pêche n'existe pas ; le marchand rachète tout à la valeur de l'objet.
- 3 classes visuelles (`classes.yaml`) : Runiste (complet), Forgefeu et Traqueur (couleurs proposées, sans arme ni effet).
- 3 tenues (`cosmetics.yaml`) : Cendres (départ), Marée haute (saison), Grand maître (Enchantement 99, change la silhouette).

**Serveur** (`apps/server`, 8 tests d'API)
- Routes : `POST /api/auth/register|login|logout`, `GET /api/content` (public), `GET /api/state` (sert aussi de signe de vie), `POST /api/activity/start|cancel`, `POST /api/items/eat`, `POST /api/shop/buy|sell`, `GET /api/journal`.
- `game.ts > play()` : point d'entrée unique de toute requête de jeu (verrouiller la ligne → avancer → action → marquer présent → enregistrer → journal). Le **résumé d'absence** est renvoyé une seule fois (absence ≥ 5 min avec du travail effectué), puis reste dans le journal.
- Tables : `accounts`, `sessions`, `characters` (activité, file, énergie, repas en jsonb), `character_skills`, `character_items`, `journal`.

**Client** (`apps/web`)
- Connexion / création de compte. Barre du haut (6 onglets, or, jauge d'énergie, lien « Atelier » en dev).
- **Accueil** : carte du monde (lieux cliquables + volet d'infos ; provisoire, à repenser) ; en bas, journal à gauche (seul l'onglet Journal fonctionne), **personnage en entier au centre** entouré de ses emplacements, **activité en cours à droite** (anneau, XP/h, rendement, file).
- **Salle Métiers** : grille groupée, « Bientôt » en pointillés, maîtres PNJ ; **salle d'un métier** : scène avec le personnage et le maître, recettes 2×3 paginées avec filtres et recettes verrouillées, détail (niveau, temps, XP, ingrédients, quantité −/+/Max, Lancer / Lancer à la place de / Ajouter à la file), file.
- **Salle Personnage** (trois colonnes) : équipement détaillé et sac (Manger, marchand) · personnage centré entouré de ses emplacements · caractéristiques (progression, rendement et bonus plafonnés, énergie, 14 métiers, bloc Combat grisé).
- Clan, Marché, Combat : pages « Bientôt » (le Marché ouvre le marchand du port).
- Popups : résumé d'absence (auto à la connexion, « Revoir » dans le journal), marchand.
- Aucun scroll de page, vérifié à 1440×900 et 1280×720.

**Personnages** (`art/`, `apps/web/src/rig/`)
- Gabarit humanoïde à 21 os (trois quarts vers la droite, pose de référence, os de tissu pour robe et cape), animation de repos 3,2 s en images clés, 16 pièces SVG à variables de couleur sur 13 emplacements.
- Moteur de rendu React : cinématique directe, calques triés par profondeur, animation sans re-rendu React, 3 niveaux de détail (portrait, scène, combat), mise en valeur d'une pièce au survol de son emplacement.
- `PaperDoll` (`components/equipment.tsx`) : personnage + emplacements (8 cosmétiques en miniature, arme de classe, outil = meilleure pioche du sac, repas actif).
- Page **Atelier** (`/#atelier`, hors connexion) : tenues, pièces une à une, os, animation, vue éclatée.

### Pas encore fait / limites connues

- **Pas de déploiement** : le serveur tourne avec `tsx`, il n'y a ni build de production du serveur, ni service des fichiers statiques du client, ni reverse proxy, ni HTTPS. `secureCookies` s'active avec `NODE_ENV=production`.
- Pas de limite de tentatives de connexion, pas de changement de mot de passe, pas de suppression de compte.
- Chiffres non équilibrés (`# à équilibrer`), simulateur absent.
- Une seule animation (repos). Marée haute ne change que les couleurs. Forgefeu et Traqueur n'ont ni arme ni effet.
- Tout le monde s'affiche avec l'apparence par défaut (Cendres + Runiste) : l'apparence n'est pas stockée par personnage.
- Pas de vrai système d'équipement : les emplacements montrent la tenue, l'arme de classe en aperçu, la meilleure pioche et le repas actif.
- Les onglets Tout / Clan / Serveur du journal et la discussion sont désactivés.
- Bandeaux des salles : textes provisoires « [Illustration animée : …] » à la place des scènes.

---

## 6. À faire

### Prochaines étapes (ordre proposé)

1. **Mise en service sur le homeserver** : Postgres (docker compose), `.env` avec `DATABASE_URL`, build du client (`pnpm --filter @bramo/web build`), le serveur Fastify sert `apps/web/dist` (ou un reverse proxy devant), HTTPS, `NODE_ENV=production`, service systemd ou conteneur, sauvegardes de la base. Limite de tentatives de connexion.
2. **Carte du monde à repenser** (décision de l'auteur en attente). Pistes proposées :
   - le pion du joueur au lieu de son activité, qui se déplace quand la file enchaîne ;
   - un bonus du jour par lieu (« Filon riche aux Mines : fer +15 % jusqu'à minuit »), réglé côté serveur ;
   - les régions découvertes par le métier d'Exploration (brouillard), ce qui tient avec 14 métiers ;
   - plus tard : événements, clans et saisons dessus.
   Recommandation : pion + bonus du jour d'abord.
3. **Animation et vie de l'interface** (choix de l'auteur en attente) : « +1 objet » flottant à chaque fabrication, pulsation de l'anneau, célébration de montée de niveau, scènes animées dans les bandeaux (forge, mines, eau), carte teintée selon l'heure, entrées du journal qui glissent.
4. **Personnages** : Forgefeu et Traqueur sur le même gabarit (valider les couleurs cuivre #F08A4B et jade #7ED6A2), animations « travail » par famille de métier, une tenue Marée haute qui change aussi de forme.
5. **P0 — chiffrage et simulateur** dans `sim/` : bots par profil sur les mêmes formules, vérifier le ratio tryhard / casu (2 à 2,5).

### Feuille de route

| Phase | Contenu | État |
|---|---|---|
| P0 | Chiffrage et simulateur | à faire |
| P1 | Prototype solo | **fait** (reste : mise en service, carte, animations) |
| P2 | Marché (ordres achat/vente, taxe 5 %) et commandes ; usure des objets comme puits | à faire |
| P3 | Clans : entrepôt, commandes internes, postes d'experts, projets de construction | à faire |
| P4 | Combat et classes (Forgefeu mêlée, Traqueur tir, Runiste magie ; triangle mêlée > tir > magie > mêlée ; voies dégâts/contrôle/soutien) ; vrai système d'équipement | à faire |
| P5 | Saisons (6 semaines, une mutation chacune) et classes de métier (Artificier, Alchimiste au niveau 40 du métier) | à faire |
| P6 | Arènes PvP et ouverture | à faire |

### Décisions en attente de l'auteur

- Direction de la carte du monde et animations prioritaires (voir ci-dessus).
- **Équipement en deux couches** (proposé) : l'équipement porte les statistiques, s'use et passe par le marché ; l'apparence (tenue cosmétique) le recouvre visuellement. L'emplacement affiche l'apparence, l'infobulle les deux.
- Couleurs d'affinité mêlée et tir.
- Questions ouvertes du game design : public visé, arrivée du PvP, durée exacte des saisons, longueur de la file pour les abonnés.

---

## 7. Règles de jeu (P1)

- XP : `XP(L) = floor( Σ_{l=1}^{L-1} floor(l + 300·2^(l/7)) / 4 )`, niveaux 1 à 99.
- Une seule activité à la fois + file de 3 (`settings.activity.queueLength`).
- Gains : 100 % en actif, 25 % hors ligne plafonné à 12 h, énergie quotidienne ×1,5 sur les 2 premières heures actives (le jour bascule à 4 h UTC).
- Bonus plafonnés : outil +30 %, repas +10 %, clan +10 %, saison +20 %.
- Résumé d'absence à la connexion, puis dans le journal.
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
- **L'apparence ne dépend jamais de la classe** : la classe se lit à l'arme et à l'effet, dans sa couleur d'affinité (`--c-glow`).
- Une nouvelle tenue se fait **sans retoucher les animations**. Style original.
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
  components/       TopBar, popups, QueueChips, equipment (PaperDoll), ui
  rig/              moteur des personnages (assets, skeleton, Character)
  styles/           tokens.css, global.css, rooms.css
packages/shared/src/
  schemas/          zod : contenu (content.ts) et personnages (art.ts)
  formulas/         xp.ts, rates.ts (présence, énergie, bonus)
  engine/           advance, actions, view, state
  node/             loadContent(dataDir, artDir), loadArt
data/               contenu et équilibrage (YAML)
art/                gabarit, animations, pièces des personnages
docs/               game design et maquettes
sim/                simulateur (à venir)
```

## 11. Pièges connus

- **PGlite ne supporte qu'un seul processus** : ne jamais ouvrir `apps/server/.pglite/` (script, autre serveur) pendant que le serveur tourne, la base serait corrompue. Arrêter aussi les processus enfants de `pnpm dev` (le serveur `tsx` peut survivre à l'arrêt de pnpm). Pour repartir de zéro : arrêter le serveur, supprimer le dossier.
- **SVG des pièces** : pas de `--` dans un commentaire XML (le navigateur refuse tout le fichier ; `pnpm test` le détecte). Ids de dégradés et filtres en `#rig-…`.
- Les pièces sont lues depuis `art/` par Vite (`server.fs.allow: ['../..']` dans `apps/web/vite.config.ts`).
- Le résumé d'absence n'est envoyé qu'une fois : le client garde le premier si deux réponses se croisent (StrictMode).
- pnpm récent bloque les scripts d'installation (esbuild) : ça fonctionne sans, `pnpm approve-builds` si besoin.
