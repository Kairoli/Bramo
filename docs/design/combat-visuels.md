# Les visuels du combat

> **Statut** : fait le 22 octobre 2026, à la demande de Louis (« des animations uniques même si ça prend du temps », « clean les visuels »). Chaque sort a son geste et son effet propres ; rien n'est une simple recoloration. À relire en jeu (salle Combat) et dans les pages de développement `/#arene` (déclencher chaque sort, ralenti, pause) et `/#planche` (tous les sorts d'une classe côte à côte, figés au même instant).

## Comment ça marche

- **Le vrai combat, rejoué.** Le serveur rejoue la rencontre en cours et envoie son déroulé (`CombatView.activity.timeline` : attaques de base, sorts, coups reçus, Ruptures, ennemis vaincus, avec dégâts et PV). La bande de la salle Combat le montre au rythme de la barre de progression : le coup porte à l'instant exact où le moteur l'a compté.
- **Un sort = un geste + un dessin.** Le geste est une animation du personnage jouée une fois par-dessus la respiration (`art/rig/animations/`, 23 gestes). Le dessin est une fonction du temps (`apps/web/src/combat-fx/`) : préparation, lâcher, trajet, arrivée, suite. Une même seconde du combat donne toujours la même image.
- **Les effets qui durent** s'affichent tant qu'ils agissent, dans le style de la classe qui les a posés : bouclier (plaques de forge, voile de feuilles, sphère de runes), brûlure (flammes au pied) ou saignement (gouttes), marque (poinçon en enclume, viseur, œil), ralentissement (chaîne ou givre), étourdissement (étoiles), affaiblissement (chevrons), soins coupés (cœur barré).
- **Lisibilité** : nombres de dégâts (blancs, jaunes en critique, rouges pour les coups reçus), barres de vie du personnage et de l'ennemi, nom du sort à côté du personnage, décor assombri sous la scène.
- **Ennemi provisoire** : une Ombre de la Marée (corps ombré, lueur de contour, yeux, volutes qui ondulent, recule sous les coups). Les ennemis propres à chaque région restent à dessiner.

## Le bestiaire de la route

Chaque zone et chaque gardien a son ennemi dessiné (`apps/web/src/combat-fx/bestiary/`), tiré du lore des régions (`docs/design/contenu/le-monde.md` §1.2). Dessinés en SVG, avec du volume (lumière à gauche, côté personnage et braseros ; ombre derrière ; liseré de lumière), animés au repos, et qui réagissent quand ils frappent et quand ils sont touchés. Les gardiens sont plus grands. Page de développement : `/#bestiaire` (clic : il frappe ; Maj + clic : il encaisse ; `?big` pour les voir en grand).

| Région | Zone 1 | Zone 2 | Gardien |
|---|---|---|---|
| Abords du bourg (le familier qui a mal tourné) | **Lanterne errante** : une lanterne de rue sur trois pattes de fer, une flamme à visage, des phalènes | **Rôdeur des fossés** : une vase grise sortie de la flaque, un godillot et une roue pris dedans, des algues, un grand œil pâle | **Mère Grise** : esprit de lavandière, long visage creusé, mèches grises, qui tord son drap au-dessus du baquet ; sa robe se défait en brume |
| Forges éteintes (le travail sans personne) | **Marteau-pilon** : il frappe seul, ses trois lampes comptent les coups, le troisième fait jaillir les étincelles | **Gardien du verger** : un arbre de verre soufflé, sève qui monte, fruits de verre, éclats qui tombent | **Le Contremaître rouge** : brute voûtée au masque de fer, avant-bras aux veines de braise, fournaise au ventre, presse à la main |
| Lisière des veilleurs (la forêt qui garde) | **Le Peseur** : moine de pierre moussue sous son capuchon, une balance dont un plateau sert de bouclier | **Cerf de braise** : corps de charbon fendu de feu, bois en flammes | **La Matriarche de résine** : reine-phalène dans un cocon d'ambre, ses ailes battent dedans, la sève coule |
| Archives englouties (le savoir noyé) | **Écho des archives** : une cloche de papier, des pages qui tournent, l'onde de l'écho | **Brochet du gué** : nageoires de parchemin, mâchoire de pieux, il jaillit de l'eau | **Le Notaire des marées** : clerc noyé, perruque à bernacles, tricorne, plume géante qui goutte d'encre, registre ouvert |
| Bastion des longues veilles (la forteresse qui ne s'est pas rendue) | **Gardienne au sceau** (elles vont par deux) : statue voilée, un grand sceau rond tenu devant elle | **La Vigie** : une tour qui marche, un œil-lanterne qui guette, une baliste qui arme un trait énorme | **Le Gardien des trois portes** : chevalier dont le corps est une porte cloutée et une herse, trois heurtoirs, un pavois |
| Cicatrice des trois vents (là où la Marée a frappé le plus fort) | **Le Patron d'atelier** : un établi qui marche, mâchoire d'étau, sourcils en clés plates, de mauvaise humeur | **La Rafale** : un masque blanc dans des rubans de vent, des débris qui tournent | **Le Régent des courants** : couronne d'éclats de verre, manteau de vent traversé de courants, ses éclats vivants qui tournent autour de lui |

Reste à faire : les renforts (éclats de verre, apprentis de forge, auxiliaire mal luné, éclats vivants) qui arrivent pendant le combat, et des poses d'attaque plus marquées pour chacun.

## Les icônes

Chaque sort a son icône (`apps/web/src/components/SpellIcon.tsx`) : un médaillon à la couleur de son élément (feu, givre, foudre ; la couleur de la classe pour le physique), un symbole repris de son effet à l'écran (l'enclume qui tombe, le piège à loup, le nœud sans fin…), un cadre doré pour les ultimes. Elles servent dans la barre de sorts de l'arène (avec la recharge en direct) et dans la Préparation. Elles sont dessinées en SVG pour être nettes à toutes les tailles ; des icônes peintes (comme les décors) pourront les remplacer une à une.

## Les gestes

| Classe | Gestes |
|---|---|
| Forgefeu | abattre le marteau (attaque de base), balayage, frappe montante, garde (marteau dressé, genoux fléchis), poing, lancer, La Grande Trempe |
| Traqueur | tir rapide (attaque de base), tir appuyé, tir en cloche, lancer de piège, sifflet de meute, bond en arrière, La Grande Battue |
| Runiste | rune projetée (attaque de base), trait tracé, bâton frappé au sol, sceau levé, canalisation, La Phrase souveraine |

## Forgefeu — la forge au combat

| Sort | Geste | Signature |
|---|---|---|
| Attaque de base | abattre | le marteau frappe le sol, une faille de feu court jusqu'à l'ennemi et jaillit sous lui en trois langues |
| Frappe d'atelier | balayage | gerbe d'étincelles blanches en éventail, une braise revient au marteau |
| Trempe vive | abattre | les braises tournent autour de la masse, explosion de vapeur sur l'ennemi |
| Éclat du four | frappe montante | un cône de flammes roule sur tous les ennemis, ils s'embrasent |
| Garde rouge | garde | des plaques chauffées au rouge volent se verrouiller autour de lui |
| Coup de travers | balayage | un croissant d'onde de choc, une entaille en X qui rougeoie |
| Refroidissement | garde | une spirale de vapeur fraîche monte autour de lui |
| Poinçon du maître | poing | un poinçon d'acier frappe et laisse la marque du maître (une enclume) |
| Marteau de retour | lancer | un marteau de braise tournoie jusqu'à l'ennemi et revient |
| Grand soufflet | balayage | bourrasque de vent brûlant en volutes, tous les ennemis s'embrasent |
| Rivet de garde | poing | trois rivets clouent l'ennemi, une plaque rivetée se pose devant lui |
| Décrassage | frappe montante | une meule de feu râpe l'ennemi, sa garde tombe en éclats |
| Contrepoids | abattre | une enclume spectrale tombe du ciel, sa silhouette reste en rempart |
| Jet de scories | balayage | gouttes de métal en fusion en cloche, qui coulent sur l'ennemi |
| Deuxième frappe | abattre | deux impacts coup sur coup avec l'image du marteau ; la masse reste chauffée à blanc |
| Reprise au rouge | balayage | la masse rougit à blanc, large arc en fusion sur deux ennemis |
| Faire sonner l'enclume | abattre | une enclume fantôme sonne, ses ondes assomment l'ennemi |
| Coins d'arrêt | abattre | des coins d'acier jaillissent du sol sous l'ennemi |
| Frappe de scellement | abattre | des bandes de métal en fusion s'enroulent autour de l'ennemi |
| Pose de rivets | poing | une rangée de rivets s'allume autour de lui |
| Recuit partagé | garde | lueur ambrée de four bas, braises douces qui soignent |
| Plaque maîtresse | garde | une grande plaque d'acier s'abat dans le sol devant lui |
| **La Grande Trempe** | Grande Trempe | un soleil de forge se forme, rivière de métal, colonnes de feu et de vapeur sous chaque ennemi, grandes plaques |

## Traqueur — la lisière et la meute

| Sort | Geste | Signature |
|---|---|---|
| Attaque de base | tir rapide | la pointe s'illumine, flèche à sillage de jade, éclats et feuilles |
| Lecture de piste | tir appuyé | des empreintes s'allument jusqu'à l'ennemi |
| Trait de poursuite | tir appuyé | flèche qui ondule comme une bête qui traque |
| Collet vif | lancer | boucle de corde qui se resserre sur les jambes |
| Sifflet bref | sifflet | un loup spectral bondit, mord et revient |
| Tir de travers | tir rapide | trois flèches en éventail |
| Repli couvert | bond en arrière | nuage de feuilles qui forme un couvert |
| Flèche barbelée | tir appuyé | flèche barbelée qui reste plantée et fait saigner |
| Piège de résine | lancer | pot de résine qui éclate en ambre gluant |
| Battement de meute | sifflet | deux loups frappent en rythme, chaque battement soigne |
| Regard fixe | tir appuyé | yeux qui s'allument, fil de foudre qui verrouille, flèche d'orage |
| Filet d'orage | tir en cloche | filet de foudre qui retombe et crépite |
| Rappel au couvert | sifflet | la meute tourne autour de lui dans un tourbillon de feuilles |
| Tir à la couture | tir appuyé | trait d'aiguille qui traverse l'ennemi de part en part |
| Morsure croisée | sifflet | deux loups se croisent en X |
| Pas de côté | bond en arrière | image laissée derrière, flèche d'orage qui se dédouble |
| Dents de fer | lancer | piège à loup qui se referme d'un claquement |
| Flèches de gêne | tir en cloche | pluie de petites flèches |
| Laissé pour compte | sifflet | un loup reste en arrière et hurle, chaînes de foudre |
| Garde de meute | sifflet | un grand loup se poste devant lui |
| Partage de chasse | sifflet | le loup rapporte un orbe de jade qui soigne |
| Retour de la meute | sifflet | trois loups d'orage chargent et rentrent |
| **La Grande Battue** | Grande Battue | long appel, la meute déferle, pluie de flèches, chaque ennemi marqué |

## Runiste — il écrit

| Sort | Geste | Signature |
|---|---|---|
| Attaque de base | rune projetée | la rune se trace dans la main, tournoie, s'imprime en sceau |
| Trait incandescent | trait | comète de feu qui embrase |
| Cercle de givre | bâton | cercle de givre au sol, pics de glace |
| Sceau de garde | sceau | le sceau descend en dôme crépitant |
| Trait fulgurant | canalisation | éclair brisé de la paume à l'ennemi |
| Anneau de cendres | bâton | anneau de feu au sol, cendres brûlantes |
| Sceau de répit | sceau | sceau de neige, flocons qui soignent |
| Trait de gel | trait | ligne de glace hérissée de pics au sol |
| Cercle révélateur | sceau | un œil de lumière balaie l'ennemi |
| Sceau du foyer | sceau | âtre de flammes douces à ses pieds |
| Ligne de partage | trait | ligne de givre horizontale qui coupe les ennemis |
| Anneau de silence | bâton | runes muettes qui tournent autour de la tête de l'ennemi |
| Sceau de continuité | sceau | nœud sans fin qui tourne autour de lui |
| Rature ardente | trait | deux traits de feu barrent l'ennemi d'une croix |
| Trait des éclats | canalisation | rafale d'éclats de glace |
| Cercle de rupture | bâton | cercles sous tous les ennemis, colonnes de foudre |
| Sceau d'arrêt | sceau | le sceau lancé enferme l'ennemi dans la glace |
| Cercle de l'entrave | bâton | chaînes de lumière qui sortent du sol |
| Trait d'interdit | trait | le signe de l'interdit se grave en feu |
| Sceau de résonance | sceau | anneaux qui vibrent comme un gong |
| Cercle du refuge | bâton | cercle et colonnes de lumière froide sous lui |
| Trait de relève | canalisation | rayon de feu qui revient en bouclier |
| **La Phrase souveraine** | Phrase souveraine | une phrase de runes s'écrit dans le ciel, chaque rune tombe et explose |

## Reste à faire

- Les ennemis de chaque région (silhouettes, gestes d'attaque propres) ; les renforts et les gardiens.
- Les voies : une pose par voie (Fulgurant, Sigillaire, Glyphiste…) pour que le personnage change aussi.
- Des sons, si on en veut un jour.
- Relecture image par image avec Louis : tout se règle dans `combat-fx/` (dessins) et `art/rig/animations/` (gestes).
