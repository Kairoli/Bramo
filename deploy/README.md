# Mettre Bramo en ligne

Préparé le 23 octobre 2026, **pas encore lancé** : ouvrir le jeu sur Internet expose une machine, et c'est une décision de
Louis. Ce dossier contient tout le nécessaire, et rien ne tourne tant qu'on ne le lance pas.

## Ce qui tourne

| Service | Rôle |
|---|---|
| `postgres` | La base du jeu. Jamais exposée : seul le serveur du jeu la voit, dans le réseau interne de Docker. |
| `app` | Le serveur du jeu (`NODE_ENV=production` : outils de test désactivés, cookies sécurisés ; `TRUST_PROXY=1` : la vraie adresse des joueurs). |
| `caddy` | Le seul service visible de l'extérieur (ports 80 et 443). Obtient et renouvelle seul le certificat HTTPS, sert le client, transmet `/api` au serveur. |
| `web` | Copie le client construit vers Caddy au démarrage, puis s'arrête. |
| `backup` | Une copie de la base chaque nuit dans `deploy/backups/`, les 14 dernières gardées. |

## Lancer

1. Une machine avec Docker (le homeserver, ou un petit serveur loué) et un nom de domaine qui pointe vers elle.
2. `cp deploy/.env.example deploy/.env`, puis remplir `DOMAIN` et un long `POSTGRES_PASSWORD` aléatoire.
3. Ouvrir les ports 80 et 443 de la box ou du pare-feu vers cette machine (et seulement ceux-là).
4. Depuis la racine du dépôt : `docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build`.
5. Les migrations de la base s'appliquent au démarrage du serveur. Le jeu répond sur `https://<DOMAIN>`.

## Au quotidien

- **Mettre à jour** : `git pull`, puis la même commande qu'au lancement (l'image se reconstruit, la base reste).
- **Donner le rôle de modérateur** : `docker compose -f deploy/docker-compose.prod.yml exec app pnpm --filter @bramo/server role <pseudo> moderator`.
- **Restaurer une sauvegarde** : `docker compose -f deploy/docker-compose.prod.yml exec -T postgres pg_restore -U bramo -d bramo --clean < deploy/backups/<fichier>.dump`.
- **Copier les sauvegardes ailleurs** : une sauvegarde sur la même machine ne protège pas d'une panne de disque ; à recopier
  régulièrement sur un autre support.

## Avant d'ouvrir au public

- Remplir les pages légales (`apps/web/src/components/Legal.tsx`, passages entre crochets) et passer `DRAFT` à `false`.
- Non testé ici : la construction de l'image (Docker n'est pas installé sur la machine de développement). À essayer une
  première fois sur la machine de production avant d'ouvrir les ports.
