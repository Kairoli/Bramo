# Faire tourner Bramo : un serveur, plusieurs, et ce que tient le homeserver

> **Statut** : analyse et mesures du 24 octobre 2026 (soir), à la demande de Louis : « un seul serveur global ? plusieurs
> serveurs ? un système d'activité cross-serveur ? c'est gérable gratuitement sur mon home serveur ou ça va limiter ? si on
> fait qu'un serveur, stress test à faire ». **Rien n'est déployé ni exposé.** Les mesures viennent d'un vrai test de charge
> (`apps/server/src/scripts/stress/`), décrit au §3.

## 1. Un seul monde, pas plusieurs serveurs

**Recommandation : un seul serveur (un seul monde), au moins jusqu'à plusieurs milliers de joueurs.**

- **L'économie a besoin de monde.** Le marché est le réflexe n° 1 voulu par Louis (« à la Dofus ») : il faut assez de vendeurs
  et d'acheteurs pour chaque objet, à chaque palier, dans 17 métiers. Couper 300 joueurs en trois serveurs de 100, c'est trois
  marchés vides. Dofus ou les MMO à serveurs multiples ont des dizaines de milliers de joueurs par serveur.
- **Le social aussi** : clans de 30, Marée du soir qui devient un boss de serveur (« objectif 85 points par inscrit »), Lice,
  classement : tout est plus vivant quand tout le monde est au même endroit.
- **Le jeu est déjà pensé pour un monde unique** : `game-design.md` (« un serveur persistant unique », « plusieurs dizaines,
  potentiellement plusieurs centaines de joueurs »), la Marée à 20 h à Paris, les premières fabrications « du serveur ».
- **Plusieurs serveurs, quand ?** Seulement pour une autre langue ou un autre fuseau (un monde anglophone dont la Marée tombe
  à 20 h à New York), ou au-delà de ce qu'une machine tient (§4). On ne coupe jamais un monde existant.
- **Le cross-serveur** (Lice entre mondes, classement de la Marée entre mondes, comme la « Cross Arena » de Legend of Mushroom)
  ne sert que s'il y a plusieurs mondes. À garder comme porte ouverte : un joueur, ses Reflets et ses scores ont un identifiant de
  monde ; rien à construire maintenant.

## 2. La machine

Le homeserver de Louis est un mini-PC : **Intel N100** (4 cœurs, 4 fils, basse consommation), **16 Go** de mémoire (6 Go
libres au moment de la mesure, il fait tourner d'autres services), **SSD de 512 Go** (220 Go libres), Windows 11. Pas de Docker
installé ; Node 24.

## 3. Le test de charge

**L'outil** (`apps/server/src/scripts/stress/`, réutilisable avant chaque ouverture) lance le vrai serveur dans un processus à
part, sur une **base neuve** (jamais celle du développement), et fait jouer des joueurs virtuels par HTTP, au rythme réel du
client sur l'accueil : l'état toutes les 30 s, la discussion toutes les 8 s, le journal, le bourg et les amis toutes les 20 s,
les premiers pas et la Marée toutes les 60 s, et de temps en temps un message, un coup d'œil au marché, une nouvelle récolte.
Il mesure ensuite un **retour en masse après 16 h d'absence** (le serveur rejoue 16 h de métier et de route pour chacun) et
**la Marée** (inscriptions, puis règlement de la soirée).

```bash
pnpm --filter @bramo/server exec tsx src/scripts/stress/stress.ts 800 100,200,400,600,800 60
```

Mesures sur le homeserver, le 24 octobre, avec deux bases : **PGlite** (la base embarquée du développement) et un vrai
**PostgreSQL 17** (installé à part pour le test puis arrêté ; c'est la base prévue en production dans `deploy/`).

### 3.1 Joueurs connectés en même temps

| Connectés | Requêtes/s | PostgreSQL : réponse (médiane / 95 %) | processeur | PGlite : réponse (médiane / 95 %) | processeur |
|---|---|---|---|---|---|
| 100 | 35 | 21 / 38 ms | 16 % | 27 / 77 ms | 40 % |
| 200 | 70 | 19 / 38 ms | 33 % | 59 / 302 ms | 77 % |
| 400 | 140 | 21 / **53 ms** | 62 % | **4,8 s / 5,7 s** (effondré) | 88 % |
| 600 | 210 | 28 / 252 ms | 83 % | | |
| 800 | 238 | **1,9 s / 3,6 s** (saturé) | 105 % | | |

« Processeur » = un cœur du N100 (le serveur Node n'en utilise qu'un). Aucune erreur jusqu'à la saturation.

- **Avec PostgreSQL, 400 joueurs connectés en même temps passent à l'aise**, 600 à la limite, 800 saturent.
- Avec PGlite, la limite est vers 200 : le profil du processeur montre que **64 % du temps** part dans PGlite (il ouvre ses
  fichiers à chaque accès). Le code du jeu lui-même coûte ~3,5 ms par requête. PGlite reste réservé au développement.
- **Ce que ça représente** : dans un jeu idle, on compte d'ordinaire 10 à 20 % des joueurs du jour connectés au même moment, un
  peu plus à l'heure de pointe (ici la Marée de 20 h). **400 connectés ≈ 1 000 à 2 000 joueurs par jour.** Le jeu vise
  « plusieurs dizaines, potentiellement plusieurs centaines » : il y a de la marge.
- **Mémoire** : 320 à 530 Mo pour le serveur, quelques centaines de Mo pour PostgreSQL. Les 16 Go suffisent largement.

### 3.2 Le point faible : le retour en masse

Un joueur qui revient après 16 h fait rejouer au serveur 16 h de métier **et de route** (~700 combats pour un débutant) :
**environ 0,45 s de calcul**, pendant lesquelles le serveur ne répond à personne d'autre (le calcul bloque le seul cœur
utilisé). Un joueur qui revient, ça ne se voit pas ; **800 qui reviennent dans la même minute**, il a fallu 6 minutes pour tous
les servir (médiane d'attente 2 min 40 s), et quelques requêtes ont fini par échouer. C'est exactement ce qui arrivera à
**19 h**, quand tout le monde revient pour s'inscrire à la Marée.

Le règlement de la Marée (à la première visite après 21 h) coûte 2,6 s pour 800 inscrits sur PostgreSQL (4,2 s sur PGlite, en
bloquant tout le serveur) : à sortir lui aussi du fil principal.

### 3.3 La bande passante

Environ **5 Ko/s par joueur connecté** sans compression (dont `/api/state`, **100 Ko toutes les 30 s**, et la discussion,
9 Ko toutes les 8 s) : 400 connectés ≈ 17 Mbit/s bruts, **2 à 4 Mbit/s compressés** (Caddy compresse déjà en zstd/gzip dans
`deploy/`, le JSON se compresse d'ordinaire 5 à 10 fois ; estimation, pas mesuré). Une connexion fibre suffit ; une ADSL serait
juste. Les illustrations (décors des métiers, ~2 Mo) et le client se chargent une fois par visiteur : un cache devant (voir
§5) évite de les servir depuis la maison.

## 4. Ce qu'il faut corriger avant d'ouvrir (dans l'ordre)

1. **Le rattrapage hors du fil principal** : calculer `advance` (et le combat rejoué de la vue) dans un **pool de fils de
   calcul** (worker threads) : le N100 a 4 cœurs, on en utilise un. Gain attendu : ×3 sur les retours en masse, et plus aucun
   blocage des autres joueurs pendant un rattrapage. C'est le changement le plus important.
2. **Alléger `/api/state`** : 100 Ko toutes les 30 s, et le serveur **rejoue le combat en cours à chaque appel** pour l'écran.
   Envoyer le déroulé du combat seulement quand il change, et le reste seulement s'il a changé (ETag).
3. **Moins d'interrogations** : la discussion toutes les 8 s fait 37 % des requêtes. Un seul canal poussé par le serveur
   (Server-Sent Events) pour la discussion, le fil, les messages privés et les notifications ; ou au moins une requête groupée.
4. **Le règlement de la Marée en tâche de fond**, découpé, pas pendant la requête d'un joueur.
5. **Refaire ce test sur la configuration de production** (Docker, PostgreSQL, Caddy) avant d'ouvrir, depuis l'extérieur,
   avec le scénario « 19 h ».

Avec 1 à 3, on peut viser **800 à 1 000 connectés** sur le même N100 (estimation, à mesurer).

## 5. Le homeserver : gratuit, avec quelques limites

**Oui, Bramo peut tourner gratuitement chez Louis** pour des centaines de joueurs. Ce qui limite, ce n'est pas la machine :

| Limite | Ce que ça veut dire | Réponse |
|---|---|---|
| **La connexion de la maison** | il faut assez de débit montant (fibre : oui) et une adresse joignable | à vérifier : débit montant, adresse fixe ou non |
| **Exposer la maison** | ouvrir les ports 80 et 443 de la box rend la machine visible d'Internet ; le homeserver fait tourner d'autres services (HomeServer, la mémoire, le tableau de bord) | **Cloudflare Tunnel** (gratuit) : aucun port ouvert, l'adresse de la maison reste cachée, les fichiers statiques sont mis en cache chez Cloudflare. Et isoler le jeu (conteneurs, base séparée, compte Windows sans droits) |
| **Les pannes** | coupure de courant, de box, redémarrage de Windows pour une mise à jour | dans un idle, une coupure ne coûte rien aux joueurs (la progression se calcule au retour, 16 h d'autonomie) ; mode maintenance et annonce depuis la console admin ; redémarrage automatique des services |
| **Les sauvegardes** | une sauvegarde sur le même disque ne protège pas d'une panne de disque | copie automatique hors de la machine (un disque externe, un stockage en ligne gratuit) ; tester une restauration |
| **Windows** | Docker n'est pas installé ; Docker Desktop demande WSL2 | soit Docker Desktop, soit Node et PostgreSQL installés comme services Windows |

**Coût** : l'électricité d'un N100 (6 à 15 W, de l'ordre de 1 à 2 € par mois), un nom de domaine (~10 € par an). Le jour où ça ne
suffit plus, un petit serveur loué coûte quelques euros par mois et se lance avec le même `deploy/` (seule `DATABASE_URL`
change). **Exposer la machine sur Internet reste une décision de Louis**, à prendre explicitement.

## 6. Et les bots ?

Vingt joueurs simulés ([`bots.md`](bots.md)), c'est 5 % de 400 connectés : rien à prévoir.

## 7. À trancher par Louis

1. **Un seul monde** (recommandé), d'accord ?
2. Le **débit montant** de ta connexion, et l'adresse de la maison : fixe ou non ?
3. **Cloudflare Tunnel** (aucun port ouvert) plutôt qu'ouvrir les ports de la box ?
4. Docker Desktop sur le homeserver, ou des services Windows ?
