# Brief pour ChatGPT : icônes et illustrations de Bramo

Louis : ce fichier a deux parties. La **partie 1** est pour toi (quoi joindre, où sont les infos, où déposer les fichiers). La **partie 2** est le prompt à coller tel quel dans ChatGPT, une famille d'images à la fois.

---

## Partie 1 — pour Louis

### Quoi joindre à ChatGPT (références de style)

- Les décors du jeu : `apps/web/public/scenes/town.webp`, `combat.webp`, `clan.webp` (peints, chauds, un peu sombres).
- Une capture du jeu avec le personnage et un combat (accueil, ou salle Combat) : le style des personnages est en aplats vectoriels avec un ombrage doux.
- Pour les icônes de sorts : une capture de la barre de sorts actuelle (salle Combat), pour qu'il voie la taille réelle et le cadre que le jeu ajoute.

### Où sont les infos (si ChatGPT demande des précisions)

| Sujet | Fichier |
|---|---|
| Les 66 sorts : nom, classe, élément, effets | `data/combat/spells.yaml` (le tableau de la partie 2 en est tiré) |
| Les classes et leurs voies | `data/combat/kits.yaml` |
| Ce que fait chaque sort à l'écran (geste, effet) | `docs/design/combat-visuels.md` |
| Le monde, les régions, l'ambiance | `docs/design/contenu/le-monde.md` |
| Les bâtiments du clan | `data/buildings.yaml` |
| Les icônes provisoires actuelles (dessinées en code) | `apps/web/src/components/SpellIcon.tsx` |

### Où déposer les fichiers reçus

Donne-moi les fichiers (ou dépose-les là, je les branche) :

- sorts : `apps/web/public/icons/spells/<id>.png` (l'identifiant du tableau, par exemple `fg_workshop.png`) ;
- attaques de base : `apps/web/public/icons/spells/basic_forgefire.png`, `basic_tracker.png`, `basic_runist.png` ;
- états : `apps/web/public/icons/status/<nom>.png` ;
- bâtiments : `apps/web/public/buildings/<id>-<niveau>.png`.

Je vérifie chaque lot dans le jeu (lisibilité à petite taille) avant de le garder.

### Ce que j'ai besoin en visuels (par ordre d'importance)

1. **Les icônes de sorts** (69) : c'est ce qui se voit le plus (barre de sorts, préparation, préréglages).
2. **Les bâtiments du clan** (8, idéalement 3 niveaux chacun) : la salle Clan les montre en tuiles, aujourd'hui avec des pictogrammes provisoires.
3. **Les icônes d'état** (8) : sous les barres de vie en combat.
4. Plus tard, si tu veux : des cadres de blason de clan (le jeu dessine pour l'instant un blason simple tiré du nom du clan).

---

## Partie 2 — le prompt à coller dans ChatGPT

> Tu es illustrateur pour **Bramo**, un jeu web de gestion et de combat automatique dans un monde médiéval-fantastique doux-amer : un bourg d'artisans au bord d'une Marée qui remonte chaque soir et ramène des choses étranges. Le ton est chaleureux, artisanal, un peu mélancolique, jamais sombre ni gore. Je joins des décors du jeu et une capture : **reprends leur style** (peinture numérique propre, formes lisibles, lumière chaude, contours nets, palette sourde avec un accent lumineux).
>
> **Règles communes à toutes les images**
> - PNG, **fond transparent**, carré, aucun texte, aucun chiffre, aucune lettre, aucun cadre (le jeu ajoute le sien).
> - Une seule idée forte par image, une **silhouette lisible en tout petit** : je réduis chaque image et elle doit se comprendre à 40 pixels. Pas de petits détails qui disparaissent, pas de fond chargé.
> - Éclairage venant du haut à gauche, même angle d'une image à l'autre, même épaisseur de contour : la série doit se ressembler.
> - Une image par fichier, nommée exactement comme indiqué.
>
> **Famille A — icônes de sorts (256 × 256 px)**
> - Le symbole tient dans un **cercle de 220 px** centré ; les coins restent vides.
> - Chaque classe a sa matière : **Forgefeu** = forgeron combattant (marteau, enclume, braises, métal rougi, plaques) ; **Traqueur** = chasseur des lisières (arc, flèches, pièges, plumes, compagnons animaux, traces) ; **Runiste** = érudit des runes (runes gravées en traits, cercles et sceaux lumineux, bâton, encre).
> - La couleur de l'élément sert d'accent : **physique** = acier et ivoire ; **feu** = orange braise ; **givre** = bleu pâle glacé ; **foudre** = violet électrique.
> - Les **ultimes** sont plus spectaculaires (plus de lumière, composition plus ample) mais restent sans cadre.
> - Les sorts d'une même voie partagent un motif (même forme de rune, même trempe, même meute) pour qu'on reconnaisse la famille.
> - Fichier : `<id>.png` (colonne id ci-dessous). Plus trois attaques de base : `basic_forgefire.png` (coup de marteau), `basic_tracker.png` (flèche tirée), `basic_runist.png` (trait de rune lancé du bâton).
>
> | id | Nom | Classe · voie | Élément | Effet |
> |---|---|---|---|---|
> | fg_workshop | Frappe d’atelier | Forgefeu | physique | frappe |
> | fg_quench | Trempe vive | Forgefeu | feu | frappe |
> | fg_furnace | Éclat du four | Forgefeu | feu | frappe 3 cibles, brûlure |
> | fg_guard | Garde rouge | Forgefeu | physique | frappe, protection |
> | fg_crosscut | Coup de travers | Forgefeu | physique | frappe, ralentit |
> | fg_cooling | Refroidissement | Forgefeu | physique | frappe, soin, purifie |
> | fg_punch | Poinçon du maître | Forgefeu | physique | frappe, marque |
> | fg_return | Marteau de retour | Forgefeu | physique | frappe |
> | fg_bellows | Grand soufflet | Forgefeu | feu | frappe 3 cibles, brûlure |
> | fg_rivet | Rivet de garde | Forgefeu | physique | frappe, protection, affaiblit |
> | fg_scour | Décrassage | Forgefeu | feu | frappe, coupe les soins, brise une garde |
> | fg_counterweight | Contrepoids | Forgefeu | physique | frappe, protection |
> | fg_slag | Jet de scories | Forgefeu · Trempe-Rouge | feu | frappe, brûlure |
> | fg_second_strike | Deuxième frappe | Forgefeu · Trempe-Rouge | physique | frappe |
> | fg_red_reprise | Reprise au rouge | Forgefeu · Trempe-Rouge | feu | frappe 2 cibles |
> | fg_ring_anvil | Faire sonner l’enclume | Forgefeu · Enclumier | physique | frappe, étourdit |
> | fg_wedges | Coins d’arrêt | Forgefeu · Enclumier | physique | frappe, ralentit |
> | fg_sealing | Frappe de scellement | Forgefeu · Enclumier | physique | frappe, affaiblit |
> | fg_lay_rivets | Pose de rivets | Forgefeu · Rémouleur | physique | frappe, protection |
> | fg_shared_anneal | Recuit partagé | Forgefeu · Rémouleur | feu | frappe, soin |
> | fg_masterplate | Plaque maîtresse | Forgefeu · Rémouleur | physique | frappe, protection, affaiblit |
> | fg_great_temper | La Grande Trempe | Forgefeu | feu | frappe 3 cibles, protection · **ultime** |
> | tr_read | Lecture de piste | Traqueur | physique | frappe, marque |
> | tr_pursuit | Trait de poursuite | Traqueur | physique | frappe |
> | tr_snare | Collet vif | Traqueur | physique | frappe, ralentit |
> | tr_whistle | Sifflet bref | Traqueur | physique | frappe, soin, compagnon |
> | tr_broadside | Tir de travers | Traqueur | physique | frappe 3 cibles |
> | tr_retreat | Repli couvert | Traqueur | physique | frappe, protection, purifie |
> | tr_barbed | Flèche barbelée | Traqueur | physique | frappe, saignement |
> | tr_resin | Piège de résine | Traqueur | physique | frappe, coupe les soins |
> | tr_packbeat | Battement de meute | Traqueur | physique | frappe, soin, compagnon |
> | tr_stare | Regard fixe | Traqueur | foudre | frappe, marque, brise une garde |
> | tr_net | Filet d’orage | Traqueur | foudre | frappe 2 cibles, ralentit |
> | tr_cover | Rappel au couvert | Traqueur | physique | frappe, soin, purifie, compagnon |
> | tr_seam | Tir à la couture | Traqueur · Tue-Bête | physique | frappe |
> | tr_crossbite | Morsure croisée | Traqueur · Tue-Bête | physique | frappe, saignement, compagnon |
> | tr_sidestep | Pas de côté | Traqueur · Tue-Bête | foudre | frappe 2 cibles |
> | tr_iron_teeth | Dents de fer | Traqueur · Piégeur | physique | frappe, étourdit |
> | tr_harass | Flèches de gêne | Traqueur · Piégeur | physique | frappe, affaiblit |
> | tr_leftbehind | Laissé pour compte | Traqueur · Piégeur | foudre | frappe, ralentit, compagnon |
> | tr_packguard | Garde de meute | Traqueur · Meneur de meute | physique | frappe, protection, compagnon |
> | tr_share | Partage de chasse | Traqueur · Meneur de meute | physique | frappe, soin, compagnon |
> | tr_packreturn | Retour de la meute | Traqueur · Meneur de meute | foudre | frappe, soin, purifie, compagnon |
> | tr_grand_hunt | La Grande Battue | Traqueur | physique | frappe 3 cibles, soin, marque · **ultime** |
> | rn_ember | Trait incandescent | Runiste | feu | frappe, brûlure, rune Trait |
> | rn_frost_circle | Cercle de givre | Runiste | givre | frappe 2 cibles, ralentit, rune Cercle |
> | rn_guard | Sceau de garde | Runiste | foudre | frappe, protection, rune Sceau |
> | rn_lightning | Trait fulgurant | Runiste | foudre | frappe, rune Trait |
> | rn_ash_ring | Anneau de cendres | Runiste | feu | frappe 3 cibles, brûlure, rune Cercle |
> | rn_respite | Sceau de répit | Runiste | givre | frappe, soin, purifie, rune Sceau |
> | rn_frost_line | Trait de gel | Runiste | givre | frappe, ralentit, rune Trait |
> | rn_reveal | Cercle révélateur | Runiste | foudre | frappe, marque, brise une garde, rune Cercle |
> | rn_hearth | Sceau du foyer | Runiste | feu | frappe, soin, protection, rune Sceau |
> | rn_divide | Ligne de partage | Runiste | givre | frappe 2 cibles, rune Trait |
> | rn_silence | Anneau de silence | Runiste | givre | frappe, affaiblit, rune Cercle |
> | rn_continuity | Sceau de continuité | Runiste | foudre | frappe, protection, rune Sceau |
> | rn_ardent_erasure | Rature ardente | Runiste · Fulgurant | feu | frappe, brûlure, rune Trait |
> | rn_shards | Trait des éclats | Runiste · Fulgurant | givre | frappe, rune Trait |
> | rn_burst_circle | Cercle de rupture | Runiste · Fulgurant | foudre | frappe 3 cibles, rune Cercle |
> | rn_stop | Sceau d’arrêt | Runiste · Sigillaire | givre | frappe, étourdit, rune Sceau |
> | rn_bind | Cercle de l’entrave | Runiste · Sigillaire | foudre | frappe, ralentit, rune Cercle |
> | rn_interdict | Trait d’interdit | Runiste · Sigillaire | feu | frappe, coupe les soins, rune Trait |
> | rn_resonant_guard | Sceau de résonance | Runiste · Glyphiste | foudre | frappe, protection, rune Sceau |
> | rn_refuge | Cercle du refuge | Runiste · Glyphiste | givre | frappe, soin, rune Cercle |
> | rn_relay | Trait de relève | Runiste · Glyphiste | feu | frappe, protection, rune Trait |
> | rn_sovereign | La Phrase souveraine | Runiste | élément du sort précédent | frappe 3 cibles, soin, protection, rune Cercle · **ultime** |
>
> **Famille B — icônes d'état (128 × 128 px)**
> Même style, encore plus simples (elles s'affichent à 16 px dans un petit rond) : un pictogramme peint, une couleur.
> `burn.png` brûlure (flamme orange) · `bleed.png` saignement (goutte rouge) · `mark.png` marque (cible de chasseur dorée) · `slow.png` ralenti (sablier ou entrave bleu pâle) · `stun.png` étourdi (étoiles jaunes) · `weaken.png` affaibli (lame ébréchée grise) · `antiheal.png` soins coupés (cœur vert barré) · `shield.png` protection (bouclier lumineux bleu).
>
> **Famille C — bâtiments du clan (512 × 512 px)**
> - Vue de trois quarts légèrement plongeante, **le bâtiment seul** sur une petite parcelle de sol (herbe, pavés), centré, sans personnage, fond transparent.
> - Même lumière chaude que les décors ; on doit sentir un village de clan construit à la main.
> - **Trois niveaux par bâtiment** : niveau 1 = modeste, en construction (échafaudage, bâches) ; niveau 2 = achevé et habité ; niveau 3 = agrandi, orné, bannières aux couleurs du clan (en tissu uni, sans motif ni texte). Garde le même cadrage et la même base d'un niveau à l'autre.
> - Fichiers `<id>-1.png`, `<id>-2.png`, `<id>-3.png` :
>   - `hall` — **Halle du clan** : le cœur du village, une grande halle de bois et pierre avec un foyer qui ne s'éteint jamais.
>   - `forge` — **Forge** : fourneaux, enclumes, entrée de galerie de mine ; fumée et braises.
>   - `sawmill` — **Scierie** : scie hydraulique sur un ruisseau, chantier couvert, piles de planches.
>   - `fields` — **Champs et jardins** : parcelles, serre de verre, plates-bandes d'herbes.
>   - `harbor` — **Embarcadère** : ponton de bois, barque amarrée, filets, une carte clouée.
>   - `lodge` — **Pavillon de chasse** : peaux qui sèchent, bois de cerf au fronton, table de couture.
>   - `arcane_tower` — **Tour des arcanes** : tour étroite, alambics et runes lumineuses au sommet, rouages.
>   - `tavern` — **Taverne** : grandes marmites, cheminée fumante, tonneaux, enseigne sans texte.
>
> Commence par **trois icônes de sorts d'essai** (`fg_workshop`, `tr_read`, `rn_ember`) pour qu'on valide le style avant de faire toute la série.
