# Ornements — dossier de reprise pour Claude

## Ce qui est livré

Louis a demandé une famille évolutive par métier jouable, inspirée du principe des ornements de Dofus et dessinée dans les couleurs de Bramo. Les dessins sont terminés. Utiliser les fichiers livrés pour l'intégration.

- **42 ornements** : 7 métiers × 20/40/60/80/90/99.
- **35 titres officiels actuels** : correspondance exacte avec `data/trials.yaml`, vérifiée lors de la livraison.
- **7 variantes du 90 en réserve** : Louis veut un palier visuel supplémentaire, mais aucun titre ni déblocage au 90 n'existe actuellement dans les données. `enabled: false`, `provisional: true`, `trialId: null`. Garder ces dessins disponibles sans les attribuer automatiquement ni inventer « Expert » ou « Maître ».
- **252 fichiers décompressés** dans [`assets/`](assets/) : 4 PNG transparents + aperçu + JSON pour chaque ornement. Les ZIP d'origine restent disponibles.
- [`manifest.json`](manifest.json) : index complet, clé stable `profession_rank`, titre original, identifiant de fichier, `trialId`, statut, palette, motifs et chemins relatifs à `ornement/`.
- [`Bramo-ornements-tous-metiers.png`](Bramo-ornements-tous-metiers.png) : comparaison 20/60/99. Les six autres planches de famille montrent tous leurs paliers ; celle du Minage est aussi incluse dans son ZIP.
- [`validation.json`](validation.json) : résultat des contrôles des fichiers et empreintes SHA-256.

Les images sont finales : pas de texte, lettre, chiffre ou logo. Le jeu écrit le pseudo et le titre en HTML. Les barres des aperçus sont des repères de texte, à ne pas utiliser comme assets.

## Attribution : suivre le surnom réellement affiché

Lire `packages/shared/src/engine/trials.ts` (`ranksOf`, `shownNickname`, `setNickname`) et `engine/view.ts` (`viewSkill`). Le client reçoit déjà :

```ts
state.skills[profession].shownRank
state.skills[profession].nickname
state.skills[profession].nicknames // rank, nickname, trialId, unlocked
```

1. Prendre le métier dont on affiche le surnom et son `shownRank`.
2. Chercher `manifest.entries[`${profession}_${skill.shownRank}`]`.
3. Afficher seulement si l'entrée existe, `enabled === true`, et si `skill.nicknames` contient ce rang débloqué avec le même `trialId`.
4. Le rang 0, une entrée absente ou verrouillée donnent un affichage de texte sans ornement. Le 90 reste en réserve.
5. Afficher `skill.nickname` comme titre : ne pas recalculer le titre depuis le niveau. Un joueur peut volontairement afficher son surnom 20 après avoir obtenu le 99.

Atteindre le niveau 20 ne suffit pas : il faut avoir réussi la commande du maître. Aucun changement de progression, récompense, migration ou règle de déblocage n'est nécessaire pour brancher les 35 titres existants. Le manifeste est un catalogue d'assets ; il ne constitue jamais une preuve de déblocage.

## Où reprendre dans le client

- `apps/web/src/rooms/ProfessionRoom.tsx` : `NicknamePicker`, surnom du métier et écran de réussite d'épreuve.
- `apps/web/src/rooms/home/CharacterCard.tsx` et `rooms/CharacterRoom.tsx` : identité du personnage et surnom du métier choisi pour cette vue. Garder la logique existante de choix du métier ; ne pas en inventer une globale silencieusement.
- `rooms/Professions.tsx` : grille compacte ; éviter d'y mettre systématiquement les grands cadres.
- `apps/web/src/styles/tokens.css` : palette officielle. Pseudo et titre utilisent Bricolage Grotesque et les jetons existants.

Créer un composant réutilisable de plaque d'identité. Choisir les emplacements de rendu en respectant la contrainte existante : aucun scroll de page à 1440×900 et 1280×720. Ces emplacements sont des pistes d'intégration, pas une nouvelle décision d'interface de Louis.

## Servir les fichiers

Les assets sont rangés dans `ornement/` pour la revue. Pour que Vite les distribue en production, copier **les quatre PNG utiles** de chaque titre officiel vers `apps/web/public/ornaments/assets/<profession>/<rank>/`, puis servir leurs chemins sous `/ornaments/`. Copier ou transformer le manifeste dans le catalogue client. Les aperçus, JSON individuels, ZIP et contrôles n'ont pas besoin d'être chargés par le navigateur du joueur. Une copie reproductible peut devenir un script de préparation d'assets si souhaité.

Exemple pour une entrée du manifeste : le fichier `assets/mining/20/gratteur_de_galeries_left.png` devient l'URL `/ornaments/assets/mining/20/gratteur_de_galeries_left.png`.

## Géométrie : éviter le double raccord

Les PNG sont **déjà en double résolution**. À l'échelle CSS normale :

| Élément | Fichier source | Affichage CSS |
|---|---|---|
| Gauche / droite | 192 × 256 | image 96 × 128, fenêtre extérieure 64 × 128 |
| Centre | 128 × 256 | tuile 64 × 128 répétée horizontalement |
| Badge | 128 × 128 | 48 × 48, centré en haut, y = 0 |
| Plaque complète | hauteur 256 | hauteur 128 |

Le raccord intérieur de chaque extrémité occupe 64 px source. Il est **dupliqué** dans le centre : ne pas le superposer deux fois en alpha. Dessiner les 128 px extérieurs de la gauche, le centre, puis les 128 px extérieurs de la droite. Le script de référence reproduit exactement les aperçus livrés.

- Largeurs source de contrôle : 384, 640 et 960 ; donc 192, 320 et 480 px CSS.
- Pour une autre largeur, garder `W_source >= 384` et `(W_source - 256) % 64 === 0` (pas CSS de 32 px).
- Centre : période source de 64 px ; il est déjà raccordé. Pas de flou, filtre de recoloration, étirement des extrémités ni redessin de la droite.
- Pseudo : centré à y≈54 px CSS ; titre : y≈90 px CSS. Adapter les zones de texte à la largeur, avec ellipsis et titre complet accessible si besoin.
- Le badge reste séparé du texte. Les cadres sont volontairement sobres au 20, plus riches ensuite ; le 99 porte les plus grands emblèmes et les motifs de prestige.

Structure possible, avec largeur CSS `--plate-width: 320px` :

```html
<div class="ornament" style="--plate-width:320px">
  <div class="ornament-left" aria-hidden="true"><img src="..._left.png" alt=""></div>
  <div class="ornament-center" aria-hidden="true" style="background-image:url('..._center.png')"></div>
  <div class="ornament-right" aria-hidden="true"><img src="..._right.png" alt=""></div>
  <img class="ornament-badge" src="..._badge.png" alt="" aria-hidden="true">
  <span class="ornament-name">Pseudo écrit par le jeu</span>
  <span class="ornament-title">Surnom écrit par le jeu</span>
</div>
```

```css
.ornament { position:relative; width:var(--plate-width); height:128px; isolation:isolate; }
.ornament-left,.ornament-right { position:absolute; top:0; width:64px; height:128px; overflow:hidden; pointer-events:none; }
.ornament-left { left:0; }
.ornament-right { right:0; }
.ornament-left img,.ornament-right img { position:absolute; top:0; width:96px; height:128px; max-width:none; }
.ornament-left img { left:0; }
.ornament-right img { left:-32px; }
.ornament-center { position:absolute; top:0; bottom:0; left:64px; right:64px; background-repeat:repeat-x; background-size:64px 128px; pointer-events:none; }
.ornament-badge { position:absolute; top:0; left:50%; transform:translateX(-50%); width:48px; height:48px; pointer-events:none; }
.ornament-name,.ornament-title { position:absolute; transform:translateY(-50%); text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ornament-name { left:60px; right:60px; top:54px; color:var(--text); }
.ornament-title { left:64px; right:64px; top:90px; color:var(--text-muted); }
```

Cet exemple montre les crops et positions ; définir les tailles de police avec l'interface réelle. Les calques décoratifs doivent rester non interactifs ; le texte HTML porte l'accessibilité. Ne pas cuire de texte dans les PNG.

## Vérification reproductible

Prérequis pour les utilitaires de contrôle : Python 3 + Pillow. Aucun accès réseau ou service d'images n'est nécessaire.

```sh
python3 ornement/tools/verify_assets.py
python3 ornement/tools/render_preview.py mining_99 --width 640 --out /tmp/mining-99.png
```

La seconde commande produit la plaque de référence avec les deux barres factices. `--three-widths` reproduit le PNG d'aperçu 960×768. Le renderer importe `finalize.py`, fourni à côté pour rendre le dossier autonome.

Contrôles d'intégration à faire par Claude : bon titre après choix d'un ancien rang, pas d'ornement avant la remise au maître, rang 0 sans cadre, variantes 90 absentes du catalogue actif, contours propres et texte dégagé aux trois largeurs, fichiers accessibles dans un build Vite, pas de scroll de page. Après branchement du composant : `pnpm typecheck`, `pnpm test`, `pnpm --filter @bramo/web build`, puis contrôle dans le navigateur aux deux tailles cibles.

## Direction artistique à conserver

Fantasy artisanale, peint-vectoriel stylisé : aplats nets, biseaux simples et lumière haut-droite, contour sombre fin `#16130F`, fond de comparaison `#20262a`. Une identité par métier : chêne et jade ; vagues et cordes ; fleurs de givre ; fer forgé et feu ; assemblages et copeaux ; cuivre de cuisine et herbes. Métal, bois et végétal restent lisibles sans texture photographique ni rendu plastique. Ne pas recolorer automatiquement les familles, ne pas ajouter de halo qui se fond dans le fond sombre, et ne pas reprendre de dessins de Dofus.

Les noms des titres et les histoires restent ceux du jeu. Les originaux de génération et les fichiers temporaires de travail ne sont pas nécessaires au rendu et ne sont pas inclus.
