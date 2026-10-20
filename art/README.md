# Personnages : gabarit, pièces et animations

Tous les personnages sont assemblés à partir de pièces SVG posées sur un même squelette.
Une nouvelle tenue (le seul revenu du jeu) se fait **sans retoucher les animations**.

- `reference/` : le test de style d'origine (Runiste de face, avant le système). Ne sert plus qu'à titre de référence.
- `rig/humanoid.json` : le gabarit (os, pivots, couleurs du corps, niveaux de détail).
- `rig/animations/*.json` : les animations, en images clés par os.
- `parts/<emplacement>/<id>.svg` + `<id>.json` : les pièces.

Le rendu est fait dans le client par `apps/web/src/rig/Character.tsx`. La page de développement **Atelier** (`/#atelier`, lien « Atelier » dans la barre du haut en mode dev) permet de changer les pièces une à une, d'afficher les os, de couper l'animation et d'éclater les calques.

## Règles de mise en scène

- Toujours à gauche de la scène, en **trois quarts vers la droite**. Le regard, l'arme et les sorts vont vers la droite. **Jamais de miroir.**
- Proportions réalistes (environ 7,5 à 8 têtes).
- L'apparence ne dépend jamais de la classe : la classe se lit à **l'arme** et à **l'effet**, dans sa couleur d'affinité (`--c-glow`).
- Lumière : contour coloré par le sort côté droit (`url(#rig-light)` et traits `--c-glow`), ombre douce côté gauche (`url(#rig-shade)`), visage dans l'ombre de la capuche (`url(#rig-hood)`).

## Le gabarit

Coordonnées absolues de la pose de repos, viewBox `0 0 480 760`, sol à `y = 700`.
« near » = côté proche du spectateur (gauche de l'écran, bras du bâton), « far » = côté vers lequel le personnage regarde (droite, bras du sort).

| Os | Parent | Rôle |
|---|---|---|
| root | — | sol, ombre, effets au sol |
| pelvis | root | bassin (porte le buste et les tissus) |
| torso | pelvis | buste |
| neck, head | torso, neck | cou, tête |
| upperarm/forearm/hand_near | torso… | bras du bâton |
| upperarm/forearm/hand_far | torso… | bras du sort |
| thigh/shin/foot_near, _far | root… | jambes (indépendantes du bassin : les pieds restent au sol quand il respire) |
| cloth_back, cloth_near, cloth_far | pelvis | pans de robe (os de tissu) |
| cape | torso | cape et mantelet |

`rotation` sur un os = pose de référence (setup pose), appliquée avant les animations.

## Les pièces

Un SVG par pièce, dessiné **dans le repère du gabarit** (pose de repos). Chaque `<g id="…">` de premier niveau est un calque. Le manifeste JSON dit, pour chaque calque :

- `bone` : l'os qui le porte ;
- `z` : l'ordre d'empilement global (plus petit = plus loin) ;
- `detail` : niveau minimal d'affichage (1 portrait, 2 scène, 3 combat) ;
- `anchor` (pièce entière) : décalage si la pièce n'est pas dessinée exactement sur la pose de repos ;
- `colorRoles` : rôles de couleur utilisés (documentation).

Repères d'ordre d'empilement :

| z | Contenu |
|---|---|
| 0–2 | ombre au sol, cercle au sol, halo du sort |
| 6–10 | cape (dos), robe (dos) |
| 14–20 | jambe et botte éloignées, puis proches |
| 24–28 | bras du sort (manches, main, gant) |
| 30–32 | pans de robe |
| 34–44 | cou, buste, col, ceinture, épaulière côté sort |
| 52–59 | intérieur de capuche, tête, visage, ombre, yeux |
| 64–71 | arme, bras du bâton (manches, main, gant) |
| 74–80 | mantelet ou étole, épaulière proche, capuche (devant) |
| 90–92 | effet de classe, particules |

### Couleurs

Jamais de couleur de tenue en dur : on passe par des variables.

- Palette de tenue (7 rôles, `data/cosmetics.yaml`) : `--c-coat`, `--c-coat-dark`, `--c-mantle`, `--c-under`, `--c-trim`, `--c-metal`, `--c-beard`.
- Corps et matières (`rig/humanoid.json`) : `--c-skin`, `--c-skin-dark`, `--c-legs`, `--c-legs-dark`, `--c-boots`, `--c-leather`, `--c-wood`, `--c-wood-light`, `--c-shadow`, `--c-stone`.
- Classe : `--c-glow` (couleur d'affinité) et `--c-glow-light`.

Pièges : pas de `--` dans un commentaire XML (le fichier entier serait refusé) ; les ids de dégradés et de filtres s'écrivent `#rig-…` (le moteur les rend uniques par personnage).

### Animations secondaires

Classes CSS utilisables dans les pièces : `fx-pulse` (lueur), `fx-hover` (flotte), `fx-spin`, `fx-spin-back`, `fx-orbit` (rotation sur soi ; pour une orbite, inclure un cercle invisible centré), `fx-rise` (particule qui monte). Elles se coupent avec « réduire les animations ».

## Ajouter une tenue ou une pièce

1. Dessiner la pièce dans `parts/<emplacement>/<id>.svg`, sur la pose de repos, avec les variables de couleur.
2. Écrire `<id>.json` (calques, os, z).
3. La référencer dans une tenue de `data/cosmetics.yaml` (ou comme arme ou effet dans `data/classes.yaml`).
4. Vérifier dans l'Atelier. `pnpm test` valide les manifestes, les os, les calques et les références.

## Vers Rive ou Spine

Le modèle est celui de Spine : os avec pose de référence, emplacements (slots) et ordre d'affichage, pièces attachées à un os, animations en images clés par os. Un export vers Spine (JSON) ou une reprise dans Rive peut se faire pièce par pièce sans changer les données de jeu.
