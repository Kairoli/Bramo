# Bramo

Idle-RPG multijoueur jouable dans le navigateur : métiers, classes, clans, marché et saisons.
Ce dépôt contient le **prototype solo (P1)** : comptes, quatre métiers jouables (Minage, Forge, Herboristerie, Cuisine), activité idle avec file d'actions, gains hors ligne et résumé d'absence.

- Vision, principes et conventions : [`CLAUDE.md`](CLAUDE.md)
- Game design : [`docs/game-design.md`](docs/game-design.md)
- Maquettes : [`docs/maquettes/`](docs/maquettes/)

## Installation

Prérequis : **Node 22 ou plus** et **pnpm** (`corepack enable` suffit).

```bash
pnpm install
pnpm dev
```

Ouvrir ensuite <http://localhost:5173> et créer un compte.

- Le client (Vite) tourne sur le port 5173 et relaie `/api` vers le serveur (port 3001).
- **Aucune base à installer** : sans `DATABASE_URL`, le serveur utilise PGlite, un vrai Postgres embarqué stocké dans `apps/server/.pglite/`. Pour repartir de zéro, arrêter le serveur et supprimer ce dossier.
- Ne jamais ouvrir `apps/server/.pglite/` depuis un autre processus pendant que le serveur tourne : PGlite ne gère qu'un seul processus et la base serait corrompue.

### Avec PostgreSQL (docker compose)

```bash
docker compose up -d
```

Puis copier `.env.example` en `.env` et renseigner :

```
DATABASE_URL=postgres://bramo:bramo@localhost:5432/bramo
```

Les migrations SQL (`apps/server/drizzle/`) s'appliquent au démarrage. La même variable servira pour la base du homeserver ou pour Supabase.

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm dev` | Lance le serveur et le client en mode développement |
| `pnpm test` | Tests vitest (formules, moteur, données, API) |
| `pnpm typecheck` | Vérification TypeScript de tous les paquets |
| `pnpm db:generate` | Génère une migration SQL après une modification de `apps/server/src/db/schema.ts` |

## Organisation

```
apps/server      API Fastify : comptes, sessions, routes de jeu, persistance Drizzle
apps/web         client React + Vite (affichage uniquement)
packages/shared  schémas zod, formules et moteur de progression, purs et testés
data/            tout le contenu et l'équilibrage, en YAML
sim/             simulateur d'équilibrage (à venir)
docs/            game design et maquettes
```

## Modifier le contenu

Tout se passe dans `data/` : réglages globaux (`settings.yaml`), métiers, objets, recettes. Le serveur valide ces fichiers au démarrage et refuse de démarrer avec un message clair si une valeur est invalide ou si une recette référence un objet inconnu. Les valeurs provisoires sont marquées `# à équilibrer`.
