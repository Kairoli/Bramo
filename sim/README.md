# Simulateur d'équilibrage (`@bramo/sim`)

Il lit **les mêmes fichiers `data/`** et utilise **le même moteur `@bramo/shared`** que le serveur (`advance`, `startActivity`, courbe d'XP, présence). Rien n'est recopié : si une formule change dans le jeu, le simulateur la suit.

## Commandes

Depuis la racine :

```bash
pnpm --filter @bramo/sim sim report
```

| Commande (`pnpm --filter @bramo/sim sim <commande>`) | Ce qu'elle fait |
|---|---|
| `report` | Tous les rapports ci-dessous dans `sim/reports/rapport.md` |
| `baseline [--proposal p] [--profiles a;b] [--days n]` | Minage seul, sans outil ni repas, meilleur minerai pour l'XP, selon des profils de présence (vrai moteur) |
| `presence` | Heures effectives par jour de chaque profil de présence, pour chaque variante de hors ligne |
| `progression [--proposal p]` | Jours pour atteindre 10…99 : spécialistes, joueurs qui partagent leur temps, forgerons autonomes ou acheteurs |
| `milestones [--proposal p]` | Niveau atteint après 1 semaine, 1, 3, 6 et 12 mois |
| `chains [--proposal p]` | Chaînes d'exemple : temps autonome, répartition par métier, étapes, niveaux requis, parcelles |
| `consumables [--proposal p]` | Rapport bonus / coût de chaque repas |
| `economy [--proposal p]` | Flux de travail et d'or par joueur, variantes, sensibilité, taille du serveur, débouchés du bas niveau |
| `calibrate [--proposal p] [--write]` | Recalcule l'XP des recettes, la durée des repas et la valeur des objets d'une proposition à partir des règles (`src/rules.ts`) |

`pnpm --filter @bramo/sim test` vérifie entre autres que la mesure de référence est reproduite et que la proposition respecte ses règles.

## Organisation

```
src/
  load.ts        données du jeu ou d'une proposition, avec réglages modifiés (validées par buildContent)
  profiles.ts    profils de présence (sessions par jour)
  bot.ts         joue un personnage jour après jour avec le vrai moteur ; politiques de jeu
  chains.ts      coût complet d'un objet : temps par métier, parcelles, or, niveaux, étapes
  economy.ts     bilan de flux : usure, consommables, construction, recyclage, or, taille du serveur
  rules.ts       règles d'équilibrage proposées (XP par heure, durées, rendement des repas, valeur de référence)
  calibrate.ts   réécrit les valeurs dérivées d'une proposition (commentaires YAML conservés)
  scenarios/     un fichier par rapport
proposals/
  boucle-v0/     proposition de données (même format que data/) + plots.yaml et economy.yaml propres au simulateur
reports/         rapports générés (ne pas modifier à la main)
```

## Propositions

Un dossier de `proposals/` remplace tout ou partie de `data/` : `settings.yaml` y est **fusionné** (on n'écrit que ce qui change) ; `professions.yaml`, `items.yaml`, `trials.yaml` et le dossier `recipes/` y **remplacent** ceux de `data/`. Le résultat passe par la même validation que le serveur. Une proposition adoptée se recopie dans `data/`.

Fichiers propres au simulateur (pas encore dans le moteur) : `plots.yaml` (parcelles d'Agriculture) et `economy.yaml` (hypothèses économiques, chacune discutable).

## Limites

- Le modèle économique est un **bilan de flux moyens**, pas une simulation de prix : prochaine étape, des bots qui passent des ordres au marché.
- Le combat, l'usure et les parcelles ne sont pas encore dans le moteur : ils sont modélisés à part.
- Les joueurs qui partagent leur temps sont calculés à partir du spécialiste (journées découpées en parts égales).
