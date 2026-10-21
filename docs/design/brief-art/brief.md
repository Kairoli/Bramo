# Brief pour l'illustrateur (ChatGPT) : pièces d'équipement de Bramo

À coller en entier dans la conversation, avec les fichiers joints : `gabarit_corps.svg`, `gabarit_exemple.svg`, et les SVG d'exemple `plate_helm.svg` et `plate_cuirass.svg` (dossier `art/parts/`).

---

Tu vas dessiner des **pièces d'armure en SVG** pour un jeu web (Bramo). Un développeur (Claude) les intégrera tel quel dans un moteur de personnages à squelette. Les règles ci-dessous sont **techniques et non négociables** : une pièce qui les enfreint ne sera pas utilisable. Le **style visuel** est, lui, à toi : on veut plus riche et plus peint que l'exemple joint.

## 1. Comment fonctionne le moteur (pour comprendre les règles)

Un personnage = un squelette de 21 os, et des **pièces SVG** posées dessus. Chaque pièce est découpée en **calques** ; chaque calque est attaché à un os et suit ses rotations (respiration, poses de classe). Toutes les pièces sont dessinées **dans le même repère**, sur la **pose de repos**, et le moteur les fait bouger. Une pièce n'est donc jamais dessinée dans une pose dynamique : elle est dessinée **à plat sur le gabarit**.

Conséquence : le même dessin doit servir pour toutes les poses. Les zones d'articulation (épaule, coude, hanche, genou) doivent pouvoir plier sans trou visible : fais **déborder** les pièces d'un calque sur l'articulation voisine d'une dizaine de pixels, ou termine-les par des bords naturels (manchette, genouillère, ourlet).

## 2. Fichiers fournis

- `gabarit_corps.svg` : corps nu sur la pose de repos, grille tous les 40 px (axes à 200), os et leurs pivots étiquetés, sol à y = 700.
- `gabarit_exemple.svg` : le même avec l'armure d'esquisse par-dessus (c'est le niveau de détail à **dépasser**).
- `plate_helm.svg`, `plate_cuirass.svg` : exemples de pièces au bon format (calques, variables de couleur).

## 3. Règles techniques (à respecter à la lettre)

1. **Un fichier SVG par pièce**, `viewBox="0 0 480 760"` exactement, `xmlns="http://www.w3.org/2000/svg"`. Pas de `width`/`height`.
2. **Repère du gabarit.** Coordonnées absolues sur ce canevas 480 × 760. Sol à y = 700. Le personnage fait environ 640 px de haut (7,5 à 8 têtes) : tête de y ≈ 58 à 150, épaules y ≈ 170, bassin y ≈ 320, genoux y ≈ 560, pieds y ≈ 690. **Ne redimensionne ni ne déplace rien** par rapport au gabarit.
3. **Orientation : trois quarts vers la droite.** Le personnage regarde et agit vers la droite. **« near »** = côté proche du spectateur = **gauche de l'écran** (bras en bas à x ≈ 130-170). **« far »** = côté éloigné = **droite de l'écran** (bras vers x ≈ 290-340). **Jamais de miroir.**
4. **Calques = `<g id="…">` de premier niveau**, dont les noms sont imposés (section 5). Pas de `transform` sur ces groupes de premier niveau. Pas d'autres `<g id>` en doublon. Tu peux imbriquer des groupes sans id.
5. **Ordre de dessin** : le moteur trie les calques par profondeur (section 5). Au sein d'un calque, l'ordre est le tien.
6. **Interdits** : `<image>` (aucun bitmap), `<filter>` (flou, ombre portée…), `<script>`, `<foreignObject>`, `<use>`, `xlink:href`, polices, `<text>`. Pas de texte ni de logo.
7. **Commentaires XML** : jamais de `--` à l'intérieur (le fichier entier serait rejeté).
8. **Poids** : pas de plafond strict, mais **sois économe** : chaque forme est un élément du navigateur animé en permanence, et plusieurs personnages sont à l'écran en même temps. Vise quelques centaines de formes par pièce au maximum (le contrôle avertit au-delà de 150 formes ou 60 Ko et n'échoue qu'au-delà de 3 000 formes ou 600 Ko). Arrondis les coordonnées à 1 décimale et fusionne les formes qui ont le même remplissage.
9. **Dégradés** : autorisés, mais leur `id` doit commencer par `rig-` (ex. `rig-metal-sheen`) et ils sont définis dans un `<defs>` du fichier. Deux dégradés existent déjà sans que tu aies à les définir : `url(#rig-shade)` (ombre douce côté gauche) et `url(#rig-light)` (lumière de contour côté droit, couleur du sort).

## 4. Couleurs : le point le plus important

La même pièce doit pouvoir être **recolorée** (bronze, fer, acier, ensembles…) sans être redessinée. **Aucune couleur n'est écrite en dur.** Chaque aplat de matière utilise une de ces variables :

| Variable | Rôle |
|---|---|
| `var(--c-metal)` | le métal principal (plaques) |
| `var(--c-trim)` | galon, bords, rivets, ornements (la couleur « précieuse ») |
| `var(--c-coat)` / `var(--c-coat-dark)` | tissu et rembourrage clair / sombre |
| `var(--c-mantle)` | grand tissu : cape, tabard |
| `var(--c-under)` | vêtement sous l'armure |
| `var(--c-leather)` | cuir : sangles, ceinture, bottes |
| `var(--c-boots)` | bottes |
| `var(--c-beard)` | poils, plumes, cheveux |
| `var(--c-glow)` | **runes, lueurs, effets** (couleur d'affinité de la classe, variable) |

Pour donner du volume, du métal usé, des reflets, des rayures : **ne change jamais la teinte des variables**. Superpose à la place des **formes semi-transparentes noires ou blanches** : `fill="#000" opacity=".3"` pour l'ombre, `fill="#F1F0EC" opacity=".25"` pour la lumière, ou `url(#rig-shade)`. C'est la technique de l'exemple ; pousse-la plus loin (plusieurs niveaux d'ombre, reflets en biseau, éclats clairs sur les arêtes, rayures, usure, rivets, gravures).

Seules couleurs en dur autorisées : `#000`, `#fff`, `#F1F0EC` (ombres et reflets), `#16130F` (contour sombre des pieds), et pour les **braises** `#FF8A3C`, `#FFC15A`, `#FF6A2B`.

## 5. Pièces du lot 1 : famille « Armure » (Forgefeu, guerrier de mêlée)

Chaque ligne : fichier à livrer, puis calques **obligatoires** `id` → os → profondeur `z`, et la zone approximative à couvrir sur le gabarit.

| Fichier | Calques (`id` → os, z) | Zone / consignes |
|---|---|---|
| `armor_helm.svg` | `back` → head, 52 · `front` → head, 60 | Heaume. **Le visage (x 196-250, y 96-150) doit rester dégagé** : il est dessiné par une autre pièce, devant la tienne. Calotte au-dessus des sourcils, jugulaire côté proche (gauche), éventuel nasal. `back` = ce qui est derrière la tête (plumet, nuque). |
| `armor_cuirass.svg` | `sleeve_far_upper` → upperarm_far, 24 · `forearm_far` → forearm_far, 25 · `torso` → torso, 36 · `under` → torso, 38 · `sleeve_near_upper` → upperarm_near, 66 · `forearm_near` → forearm_near, 67 | Plastron x 144-266, y 156-322 ; col/gorgerin dans `under` ; brassard et avant-bras des deux bras. Voir le gabarit : le bras proche pend (épaule 162,186 → poignet 140,370), le bras éloigné est levé (épaule 258,184 → poignet 336,234). |
| `armor_gauntlets.svg` | `far` → hand_far, 28 · `near` → hand_near, 71 | **Manchettes et dos de main seulement** : la forme des doigts dépend de la pose de la classe, ne dessine pas de doigts. Poignet proche ≈ (140,370), poignet éloigné ≈ (336,234). |
| `armor_greaves.svg` | `thigh_far` → thigh_far, 16 · `shin_far` → shin_far, 17 · `thigh_near` → thigh_near, 21 · `shin_near` → shin_near, 22 | Cuissots, genouillères, grèves. Jambe proche x 162-204, jambe éloignée x 212-252, de y 330 à 650. Les jambes doivent **couvrir** les jambes nues du gabarit. |
| `armor_sabatons.svg` | `far` → shin_far, 18 · `near` → shin_near, 23 | Pieds, y 628-695. Bouts pointus vers la droite. |
| `armor_girdle.svg` | `belt` → pelvis, 40 · `tassets` → pelvis, 41 | Ceinturon à y 288-325 sur x 150-262 ; tassettes (plaques pendantes) à y 314-375. |
| `armor_cloak.svg` | `back` → cape, 8 · `front` → cape, 74 | `back` : grand manteau derrière le dos (x 135-250, y 160-440). `front` : agrafe et chaînette sur le devant du torse (y 160-180). |
| `armor_pauldron_near.svg` | `pauldron` → upperarm_near, 75 | Épaulière gauche de l'écran, autour de (160,185). |
| `armor_pauldron_far.svg` | `pauldron` → upperarm_far, 44 | Épaulière droite de l'écran, autour de (270,180). |

Aucune arme dans ce lot.

## 6. Style visuel (ce qu'on veut)

Ambiance sombre et chaude, personnage lisible sur fond sombre, métal usé et rayé, cuir patiné, tissu déchiré, quelques éclats de lumière franche. Rendu **peint en aplats** (pas de contours noirs épais), avec des reflets en biseau et des variations de matière, comme une illustration stylisée. Éclairage : ombre douce à gauche, lumière de contour chaude à droite. Reste dans des proportions réalistes. **Les trois premiers paliers partagent le même dessin** ; seule la palette change, donc **ne dessine pas de motif qui ne marcherait qu'avec une couleur précise**.

## 7. Livraison

1. **D'abord un test** avec seulement `armor_helm.svg` et `armor_cuirass.svg`. On les contrôle (automatiquement) avant que tu fasses le reste. Cela évite de refaire dix pièces si une règle est mal comprise.
2. Ensuite le lot complet, **un fichier par pièce**, avec exactement les noms de la colonne « Fichier ».
3. Avant de livrer, **vérifie toi-même** : (a) `viewBox="0 0 480 760"` ; (b) tous les calques de la section 5 présents, avec ces `id` ; (c) aucune couleur hex en dur hors liste ; (d) pas de `<filter>`, `<image>`, `<use>`, `<text>` ; (e) un nombre de formes raisonnable (voir la règle 8) ; (f) pas de `--` dans un commentaire ; (g) la pièce se superpose correctement au `gabarit_corps.svg` (mets les deux dans le même `viewBox` et compare).
4. Donne le SVG **brut dans un bloc de code**, sans explication au milieu, pour que je puisse le copier tel quel.

## 8. Ce qu'on ne te demande pas

Pas de personnage complet, pas de décor, pas de texte, pas de version PNG, pas d'animation, pas de variantes de rareté pour l'instant (elles viendront dans un second lot, quand le premier est validé).
