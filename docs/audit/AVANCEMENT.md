# Audit des systèmes : avancement

Commande : [`PROMPT.md`](PROMPT.md) (les « Ajouts du superviseur » priment). Point d'étape pour Louis :
[`00-point-etape.md`](00-point-etape.md). Ce fichier dit où en est l'audit pour qu'un autre agent puisse reprendre sans
recommencer.

- **Branche** : `worktree-agent-aee0bf72032c9ff0f` (worktree `C:\AI_Workspace\Bramo\.claude\worktrees\agent-aee0bf72032c9ff0f`).
- **Partie de** : `main` au commit `990d15b` (« Écrire la commande de l'audit des systèmes… »). Tous les chiffres de l'audit
  valent pour ces données-là.
- **Règles** : rien dans `data/` ni dans les règles du jeu ; outils dans `sim/src/audit/`, preuves dans `sim/reports/audit/`,
  rapports dans `docs/audit/`. Jamais `apps/server/.pglite/`.

## Phases

| Phase | État | Où |
|---|---|---|
| 0. Vérifier le recalage de la Puissance (ajout n° 5) | **fait** | `docs/design/puissance.md` §8 ; `sim/reports/serveur/v3-puissance.md` et `v3-puissance-fin.md` |
| 1. Comprendre le jeu (code et données d'abord) | **fait** | `00-point-etape.md` §2 ; `sim/reports/audit/carte.md` |
| 2. Établir ce qui est testable | **fait** | `00-point-etape.md` §3 et §5 |
| 3. Vérifier les outils de simulation | **fait** | `00-point-etape.md` §4 ; `sim/reports/audit/verifier.md` |
| — Point d'étape avec Louis | **en attente de sa réponse** | `00-point-etape.md` §7 (questions) |
| 4. Combat, builds, classes, réserves | à faire | — |
| 5. Progression et temps long | à faire | — |
| 6. Extensibilité et PvP | à faire | — |
| 7. Contre-vérification des conclusions | à faire | — |
| 8. Rapports finaux (`01-rapport.md` et un fichier par analyse) | à faire | — |

## Commandes lancées (pour les refaire)

Toutes depuis la racine du worktree, Node 24, Windows, 4 cœurs.

| Quoi | Commande | Durée | Résultat |
|---|---|---|---|
| Puissance recalée, méthode d'avant (cache au centième) | `pnpm --filter @bramo/sim exec tsx src/server/run.ts 120 90 real 11 v3-puissance` | 30 min (deux simulations en même temps) | `sim/reports/serveur/v3-puissance.md` (l'ancienne version : `git show 0fd121b:sim/reports/serveur/v3-puissance.md`) |
| Puissance recalée, cache précis (corrigé par l'audit) | `CACHE_PARTS=4 pnpm --filter @bramo/sim exec tsx src/server/run.ts 120 90 real 11 v3-puissance-fin` | 30 min | `sim/reports/serveur/v3-puissance-fin.md` |
| Vérification des outils | `pnpm --filter @bramo/sim exec tsx src/audit/verifier.ts` | ~1 min | `sim/reports/audit/verifier.md` |
| Carte des mécaniques | `pnpm --filter @bramo/sim exec tsx src/audit/carte.ts` | 5 s | `sim/reports/audit/carte.md` |
| Niveau requis par étape (set de départ au plancher) | `pnpm --filter @bramo/sim exec tsx src/tempo/needed.ts` | 18 s | `sim/reports/audit/needed.md` |
| Audit du contenu (outil existant) | `pnpm --filter @bramo/sim exec tsx src/audit.ts` | 5 s | sortie console (deux fausses alertes, voir point d'étape §4) |
| Banc des builds, essai de coût | `PATHS=red_temper SEEDS=2 ARCHS=ouverture,endurance,cadence pnpm --filter @bramo/sim exec tsx src/tempo/bench.ts <nom>` | 8 s pour une voie | non gardé (essai) |

Graines : simulation de serveur 11 ; vérifications : graines 0 à 59 (cache), 1 à 10 (`needed.ts`), 1000 à 1599 (vitesse).

## Changements d'outils faits par l'audit

- `sim/src/server/fightCache.ts` : option `CACHE_PARTS` (décimales gardées pour régénération, combo, contre-attaque,
  esquive ; 2 par défaut, comme avant, pour pouvoir refaire les anciens rapports). Raison : `verifier.md` §2.
- `sim/src/audit/verifier.ts`, `sim/src/audit/carte.ts`, `sim/src/audit/comparer-puissance.ts` : nouveaux (le dernier compare
  des rapports JSON de simulation de serveur : route, Force, « dont systèmes », or).

## À faire ensuite (après la réponse de Louis)

Voir `00-point-etape.md` §5 (ce que coûte chaque phase) et §7 (questions). Premiers chantiers prévus pour la phase 4 :

1. Rendre le banc fidèle au jeu : points forts de classe, ensembles des archétypes Ouverture, Endurance, Cadence (sans
   `TALENTS_ADD`), cache précis par défaut pour les nouvelles mesures.
2. Les cinq joueurs A à E en vraies règles de décision, sur un même butin tiré par le vrai `rollLoot`.
3. Les réserves : remplissage, dépense, gaspillage (plafond atteint), par build et par rencontre, dans le vrai moteur
   (les compteurs `pool:<réserve>` et `spent:<réserve>` existent déjà).
