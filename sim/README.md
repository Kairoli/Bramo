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
| `market [--players n] [--days n] [--seed n]` | **Simulation du marché** : des bots (récolteurs, artisans, présences variées) jouent avec le vrai moteur et le marché du jeu ; écrit `reports/marche.html` (tableau de bord visuel) et `marche.json` |
| `combat [--seeds n] [--proposal p]` | Avec `--proposal`, le rapport va dans `reports/combat/<p>/` et commence par un tableau **avant / après** (données actuelles contre la proposition, mêmes graines). |
| `combat [--seeds n]` | **Banc de combat sur le moteur réel** (`fight` de `@bramo/shared`, données `data/combat/`) : les plans d'exemple × six profils de rencontre × graines, deux règles d'ouverture, danger ×1 / ×1,5 / ×2, tolérance des horaires. Écrit `reports/combat/rapport.md`, `resume.json` (une ligne par cas) et `combats.json` (une ligne par combat, échecs compris). Compare au banc Python du dossier (`reference/banc-coeur-v0.2.json`) |
| `combat-search [--levels 40,80] [--proposal p] [--write p]` | **Recherche de plans** : toutes les combinaisons de sorts de chaque voie, rejouées aux dangers ×1 à ×4 ; écrit `reports/combat/[p/]recherche.md` et `recherche.json` (meilleur plan, écart au DPS, **murs**). `--write p` ajoute à la proposition `p` un plan conseillé par voie (`addPlans` de son `combat.yaml`) |
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
  market/        marché en mémoire (exchange.ts, mêmes règles que le serveur), bots et boucle des jours (world.ts), page HTML (dashboard.ts)
  scenarios/     un fichier par rapport
proposals/
  boucle-v0/     proposition de données (même format que data/) + plots.yaml et economy.yaml propres au simulateur
reports/         rapports générés (ne pas modifier à la main)
```

## Propositions

Un dossier de `proposals/` remplace tout ou partie de `data/` : `settings.yaml` y est **fusionné** (on n'écrit que ce qui change) ; `professions.yaml`, `items.yaml`, `trials.yaml` et le dossier `recipes/` y **remplacent** ceux de `data/`. Le résultat passe par la même validation que le serveur. Une proposition adoptée se recopie dans `data/`.

**Combat** : un fichier `combat.yaml` modifie `data/combat/` sans le recopier : `rules` (fusionné), `classes.<id>.params` et `paths.<id>.params` (paramètres fusionnés), `spells.<id>` (champs d'un sort), `plans.<id>.levels` (répertoire remplacé), `addPlans` (plans ajoutés). Propositions : `combat-plans-v1` (plans conseillés seuls), `combat-voies-v1` (équilibrage des voies, voir `docs/design/coeur-du-jeu/integration.md`).

Fichiers propres au simulateur (pas encore dans le moteur) : `plots.yaml` (parcelles d'Agriculture) et `economy.yaml` (hypothèses économiques, chacune discutable).

## Limites

- Le modèle économique de `economy` est un **bilan de flux moyens**. La commande `market` simule des prix avec des bots, mais ils ne dépensent presque rien (pas de clan, de construction ni de combat) et suivent des règles de prix simples.
- Le combat est dans le moteur pour le kit de classe seul (sorts, mécaniques, passifs de voie), avec des statistiques normalisées : pas encore d'équipement, d'ensembles, de gemmes, de niveau de classe ni de donjon. L'usure et les parcelles ne sont pas encore dans le moteur : elles sont modélisées à part.
- Les joueurs qui partagent leur temps sont calculés à partir du spécialiste (journées découpées en parts égales).
