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
| `combat-dungeon-party [--seeds n] [--proposal p] [--hp-exponent e]` | **Donjon en groupe** : compositions de 4 (et un DPS seul), PV gardés par membre, aide apportée aux alliés comptée à part ; `--hp-exponent 1.5` fait monter les PV ennemis avec le danger (pente du dossier) et la fureur avec eux ; `reports/combat/donjon-groupe[-p][-pente].md` |
| `combat-tools [--proposal zones-v2] [--tools p] [--overlay p] [--paths a,b] [--shard k/n \| --merge --parts n]` | **Outils de situation** (dossier PvE v2) : mur de chaque voie dans chaque zone, sans outil et avec l'ensemble 4, la gemme et la préparation de chaque famille présente (`proposals/<tools>/tools.yaml`) ; difficulté couplée (dégâts × D, PV × D^1,5), plans du criblage en quatre ouvertures et priorités de cible, graines de criblage, de confirmation et réservées. `--shard k/n` joue une part (par voie) et écrit `tools-part-k.json` ; `--merge` écrit `reports/combat/<p>/outils.md` et `outils.json` (critères d'acceptation, murs, échecs). `--overlay` applique en plus les sorts d'une autre proposition (ex. `zones-v2-repli`) |
| `combat-coherence --step <étape> [--proposal coherence-v1] [--zones zones-v2] [--paths a,b] [--shard k/n \| --merge --parts n]` | **Cohérence du combat** (`docs/design/coherence/coherence.md`) : statistiques réelles de l'équipement (`rules.gearStats`), talents du dossier 1 dans le moteur (`talents.yaml` de la proposition), budget unique (`resolveLoadout`). Étapes, dans l'ordre : `kits` (catalogue brut et converti), `gear` (murs par palier, rareté, orientation, lignes), `budget` (valeur de chaque statistique ; courbe +12 %), `triggers` (talents qui se déclenchent par voie), `sets` puis `pairs` puis `pairwalls` (ensembles seuls, criblage des paires 4+4, murs des meilleures), `gems` puis `quads` puis `quadwalls` (gemmes et nommés seuls, combinaisons de quatre), `tools` (outils de situation contre le généraliste ; `--zones coherence-zones-v1` pour les zones refaites). Mur : 24 graines, difficulté couplée, meilleur des plans de la voie (conseillé, groupe, sûr ; gardés dans `reports/combat/coherence/plans/`). Rapports dans `reports/combat/coherence/` |
| `combat-build --step <étape> [--proposal coherence-v2] [--zones coherence-zones-v2] [--paths a,b] [--random n] [--shard k/n \| --merge --parts n]` | **Le build v2** (`docs/design/coherence/build.md`) : réserves, gemmes, ensembles à deux étages, nommés et lignes de build de la proposition. Étapes : `catalogue` (catalogue lisible), `base` (mur du témoin sans talent), `builds` (8 archétypes, leurs variantes de lignes et `n` builds au hasard par voie : vitesse et part des victoires deux paliers au-dessus du mur du témoin), `buildwalls` (murs complets du témoin, du meilleur, du médian, du meilleur et du moins bon archétype), `situation` (au mur d'une zone ou d'un gardien, le build de farm et ses réponses : ensemble 4, gemme, préparation ; `--zones coherence-zones-v2,coherence-bosses-v1`). Rapports dans `reports/combat/coherence-v2/` (`catalogue.md`, `build.md`, `situation.md`) |
| `combat-weapons [--proposal coherence-v2] [--write]` | **Armes à valeur égale** (`docs/design/coherence/classes.md`) : chaque arme garde ses statistiques secondaires, sa Puissance s'ajuste pour que le kit témoin de sa classe atteigne l'indice de mur médian ; `reports/combat/<p>/armes.md` ; `--write` écrit `proposals/<p>/gear.yaml` (copie de `data/gear.yaml`, armes seules changées). Une proposition peut maintenant remplacer `gear.yaml` |
| `combat-gear-gap [--proposal p]` | **Écart d'équipement** : au mur du donjon (danger ×1,25, pente du dossier, fureur de `fureur-v0` par défaut), chaque composition rejouée avec +5 à +25 % de statistiques ; vérifie qu'un meilleur équipement remplace un rôle absent (principe de Louis, `analyse.md` §9). `reports/combat/ecart-equipement.md` |
| `combat-groups [--seeds n] [--proposal p]` | **Essais de groupe** (1 à 4 combattants, six compositions, trois mises à l'échelle des ennemis) : `reports/combat/groupes.md` et `groupes.json` |
| `combat-dungeon [--seeds n] [--proposal p]` | **Essai de donjon** : six salles enchaînées, PV gardés, part des PV rendue au repos de 15 s ; `reports/combat/donjon.md` et `donjon.json` |
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

**Combat** : un fichier `combat.yaml` modifie `data/combat/` sans le recopier : `rules` (fusionné), `classes.<id>.params` et `paths.<id>.params` (paramètres fusionnés), `spells.<id>` (champs d'un sort), `plans.<id>.levels` (répertoire remplacé), `addPlans` (plans ajoutés). Propositions de soutien en groupe : `soutien-v1`, `soutien-v2` (Puissance de soutien), `soutien-groupe-v1/-v2` (même chose, les plans de groupe étant désormais dans `data/`), `fureur-v0` (fureur par rencontre). Propositions de zones solo : `zones-v0`, `zones-v1`, `zones-v1-defense`, `zones-v1-heavy` (rencontres d'essai des douze zones, voir `docs/design/activites-artisanat/analyse.md` §3.1). Les propositions `combat-plans-v1` et `combat-voies-v1` ont été adoptées le 22 octobre (recopiées dans `data/combat/`) ; leurs rapports restent dans `reports/combat/`.

Fichiers propres au simulateur (pas encore dans le moteur) : `plots.yaml` (parcelles d'Agriculture) et `economy.yaml` (hypothèses économiques, chacune discutable).

## Limites

- Le modèle économique de `economy` est un **bilan de flux moyens**. La commande `market` simule des prix avec des bots, mais ils ne dépensent presque rien (pas de clan, de construction ni de combat) et suivent des règles de prix simples.
- Le combat est dans le moteur pour le kit de classe seul (sorts, mécaniques, passifs de voie), avec des statistiques normalisées : pas encore d'équipement, d'ensembles, de gemmes, de niveau de classe ni de donjon. L'usure et les parcelles ne sont pas encore dans le moteur : elles sont modélisées à part.
- Les joueurs qui partagent leur temps sont calculés à partir du spécialiste (journées découpées en parts égales).
