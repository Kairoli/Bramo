# Personnages : gabarit, pièces et animations

Tous les personnages sont assemblés à partir de pièces SVG posées sur un même squelette.
Une nouvelle tenue (le seul revenu du jeu) se fait **sans retoucher les animations**.

- `reference/` : le test de style d'origine (Runiste de face, avant le système). Ne sert plus qu'à titre de référence.
- `rig/humanoid.json` : le gabarit (os, pivots, couleurs du corps, niveaux de détail).
- `rig/animations/*.json` : les animations, en images clés par os.
- `rig/poses/*.json` : les poses de classe (plus tard, de voie).
- `parts/<emplacement>/<id>.svg` + `<id>.json` : les pièces.

Le rendu est fait dans le client par `apps/web/src/rig/Character.tsx`. La page de développement **Atelier** (`/#atelier`, lien « Atelier » dans la barre du haut en mode dev) permet de changer les pièces une à une, d'afficher les os, de couper l'animation et d'éclater les calques.

## Règles de mise en scène

- Toujours à gauche de la scène, en **trois quarts vers la droite**. Le regard, l'arme et les sorts vont vers la droite. **Jamais de miroir.**
- Proportions réalistes (environ 7,5 à 8 têtes).
- **On voit tout de suite qui joue quoi** : chaque classe a sa **tenue de départ** (`startingOutfit` dans `data/classes.yaml`) et sa **pose**, plus son **arme** et son **effet** dans sa couleur d'affinité (`--c-glow`). À terme, chaque voie aura sa pose.
- Les tenues cosmétiques se portent ensuite par-dessus, avec n'importe quelle classe : elles suivent les os, donc toutes les poses.
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

## Les poses

Une pose (`rig/poses/<id>.json`) ajoute des degrés à la pose de référence de certains os, choisit le **corps de base** (`body`, pour la forme des mains) et son **animation de repos**. La classe pointe vers sa pose (`pose` dans `data/classes.yaml`).

| Pose | Classe | Corps | Animation |
|---|---|---|---|
| `runist` | Runiste | `base` (main du sort ouverte) | `idle` |
| `tracker` | Traqueur : en garde, jambes écartées, arc tendu dans la main éloignée, corde à demi bandée par la main proche, flèche encochée | `base_ranger` (poing sur l'arc, pouce et index sur la corde) | `idle_tracker` |
| `forgefire` | Forgefeu : campé, jambes écartées, poing proche sur la hanche (coude écarté), marteau porté sur l'épaule par la main éloignée, masse dans le dos | `base_grip` (poings) | `idle_forgefire` |

Les pièces restent dessinées sur la pose de repos et suivent leurs os ; une tenue va donc avec toutes les poses. Deux exceptions, propres à une pose :
- un poing qui tient une arme est dessiné **dans la pose** puis ramené dans le repère de repos de son os par la matrice inverse (voir `parts/body/base_grip.svg`) ;
- une arme tenue dans la pose (le marteau du Forgefeu) est portée par l'os de la main qui la tient (`hand_far`), dessinée dans la pose puis ramenée dans le repère de repos par la même matrice inverse que le poing : elle suit le bras. Une arme posée au sol serait portée par l'os `root`.

Pour calculer les pivots d'une pose et la matrice inverse d'un os, reprendre la cinématique de `apps/web/src/rig/skeleton.ts` (`worldMatrices` avec les décalages de la pose).

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

Classes CSS utilisables dans les pièces : `fx-pulse` (lueur), `fx-hover` (flotte), `fx-spin`, `fx-spin-back`, `fx-orbit` (rotation sur soi ; pour une orbite, inclure un cercle invisible centré), `fx-rise` (particule qui monte). Elles se coupent avec « réduire les animations ». Les animations de repos (en images clés) continuent, à 40 % d'amplitude, avec ce réglage : une page web ne peut pas réactiver les effets d'animation de Windows, et un personnage totalement figé fait un jeu mort.

## Jeux de base des trois classes (deuxième passe, 21 octobre)

`art/draw.mjs` (aides de dessin : plaque, cuir, tissu, mailles, rivets, galon) et trois générateurs : `make_plate.mjs` (+ `make_plate_variants.mjs`) pour l'**Armure** du Forgefeu, `make_trail.mjs` pour la **Tenue de piste** du Traqueur (`trail_*`), `make_adept.mjs` pour la **Robe** du Runiste (`adept_*`). Les matières partagées (`rig-sheen`, `rig-fold`, `rig-grain`, `rig-weave`, `rig-mail`) sont définies dans `RigDefs` (`apps/web/src/rig/Character.tsx`) : une pièce les utilise par `url(#rig-…)` sans définir de dégradé. Tenues d'essai `sketch_trail` et `sketch_adept` (masquées du choix de tenue). Coût de rendu : environ le double des tenues de départ actuelles (dix copies : 14 à 16 images par seconde contre 29). Planche : `docs/design/catalogue/esquisses.html`.

## Esquisses d'équipement (famille Armure)

`art/make_plate.mjs` génère les pièces de l'Armure (heaume, plastron, gantelets, jambières, solerets, tabard, ceinturon, épaulière) ; les fichiers générés se retouchent à la main ensuite. Elles introduisent l'emplacement **`legs`** (cuissots et grèves, os `thigh_*` et `shin_*`, z 16-22) pour les jambières. Trois tenues d'essai `sketch_armor_1/10/20` (bronze, fer, acier) dans `data/cosmetics.yaml` : seule la palette change avec le palier. Elles ne sont pas proposées au joueur (le choix de tenue masque les ids en `sketch_`). Planche : `docs/design/catalogue/esquisses.html`.

## Ajouter une tenue ou une pièce

1. Dessiner la pièce dans `parts/<emplacement>/<id>.svg`, sur la pose de repos, avec les variables de couleur.
2. Écrire `<id>.json` (calques, os, z).
3. La référencer dans une tenue de `data/cosmetics.yaml` (ou comme arme ou effet dans `data/classes.yaml`).
4. Vérifier dans l'Atelier, sur chaque classe (donc chaque pose). `pnpm test` valide les manifestes, les os, les calques, les poses et les références.

## Vers Rive ou Spine

Le modèle est celui de Spine : os avec pose de référence, emplacements (slots) et ordre d'affichage, pièces attachées à un os, animations en images clés par os. Un export vers Spine (JSON) ou une reprise dans Rive peut se faire pièce par pièce sans changer les données de jeu.
