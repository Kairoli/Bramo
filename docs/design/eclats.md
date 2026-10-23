# Éclats de marée, poussière et retaille

Proposition de Claude du 23 octobre 2026 (soir), **[Recommandé]** sauf mention, à valider par Louis. Rien n'est encore dans le jeu.

**[Décidé par Louis, 23 octobre]** : une poussière qui sert à retailler une ligne, à prix exponentiel ; une boutique de saison pour les éclats.

**Dans le jeu depuis le 23 octobre (soir)** : le démontage (§3) et la retaille (§4), chez l'Affineur, avec les chiffres ci-dessous (`data/gear_crafting.yaml`, `refine.salvage` et `refine.reroll`). La boutique de saison (§5) n'est pas encore faite : Louis a d'abord demandé des essais d'apparences (§7).

## 1. Aujourd'hui

- Un soir de Marée joué rapporte **environ 50 éclats** (`data/combat/tide.yaml`, `shards`). Un habitué qui vient 5 soirs sur 7 en gagne 250 à 360 par semaine, soit environ **16 000 par an**.
- Ils n'achètent qu'une chose : la tenue **Marée haute** de sa classe, **1 200 éclats** (trois tenues en tout).
- Au simulateur (90 jours, `sim/reports/serveur/v15-dump.md`), sur 508 000 éclats gagnés, **241 000 dorment dans les sacs** : une fois la tenue achetée, ils ne servent plus à rien.
- Les éclats sont un objet du sac : **ils se vendent déjà au marché** comme le reste (rien ne l'interdit).
- **Aucun moyen de changer une ligne d'une pièce.** L'Affineur la fait seulement monter vers son maximum (affûtage : or et matière de la pièce, `engine/refine.ts`).
- **Les pièces d'équipement ne se recyclent pas** : le recyclage ne vaut que pour les objets ordinaires (outils : 40 % des matériaux de la recette). Une pièce inutile se garde ou se vend à la vitrine. Avec environ 46 pièces tombées par jour, les sacs se remplissent.
- **La Marée n'est liée à aucune saison** : ses trois types (Débâcle, Lanternes, Géants) tournent chaque soir, toute l'année. Les saisons n'existent pas encore dans le jeu (phase P5 ; `game-design.md` §8.3 recommande quatre événements par an : Givre, Marées, Moisson, Braises, qui reviennent chaque année, sans exclusivité définitive [Décidé]).

## 2. La règle

La Marée a lieu à 20 h. Celui qui ne peut pas venir à cette heure-là (travail de nuit, enfants, autre fuseau) ne doit pas finir plus faible, seulement moins paré. Donc :

- **les éclats restent cosmétiques** (et collectifs : clan, digue du serveur) ;
- **ce qui touche au build passe par la poussière**, que tout le monde obtient en démontant ses pièces, à l'heure qu'il veut ;
- **rien ne dépasse le plafond** : aucune ligne au-delà de son maximum, aucune ligne en plus.

## 3. Démonter une pièce : la poussière de Lointain

Une pièce qu'on ne porte pas se **démonte** chez l'Affineur : elle disparaît et donne de la **poussière de Lointain**.

| Rareté | Poussière (palier 1) |
|---|---|
| Commun | 1 |
| Rare | 3 |
| Épique | 8 |
| Légendaire | 20 |

Multipliée par le palier, comme les prix de l'atelier (×1 au palier 1, ×2 au 40, ×3,5 au 90). Une Épique du palier 40 donne 16 poussières.

- Ne se démontent pas : les pièces portées, celles en vitrine, les pièces de départ. Un chef-d'œuvre ou une pièce affinée donne un peu plus (+50 %), pour ne pas regretter d'en avoir fait.
- **Ni or ni matière en retour** : le démontage ne crée pas d'or, il recycle le butin en temps gagné contre le hasard.
- La poussière se vend au marché : un joueur qui farme beaucoup et ne retaille pas la vend à ceux qui retaillent.
- **Aucun autre usage pour l'instant** (on pourra en ajouter : recettes d'atelier, gemmes).

## 4. La retaille d'une ligne

Chez l'Affineur, comme dans Diablo III (l'enchanteresse) :

1. On choisit **une ligne tirée** de la pièce.
2. L'Affineur propose **deux autres lignes** possibles pour cet emplacement, tirées au hasard dans leur plage normale, **plus la ligne actuelle**.
3. On garde celle qu'on veut (garder l'actuelle est permis : on a seulement payé).

Règles :

- **Une seule ligne retaillable par pièce** : après la première retaille, seule cette ligne-là peut encore l'être. On corrige une mauvaise ligne ; on ne fabrique pas une pièce parfaite à coups de poussière.
- **Ne touche pas** : la ligne bonus d'un chef-d'œuvre, les lignes d'un chef-d'œuvre (elles sont le choix de l'artisan), les pièces de départ.
- Une ligne retaillée peut ensuite s'affûter jusqu'à son maximum, comme les autres.

**Prix exponentiel**, ×1,5 à chaque retaille sur la même pièce :

- poussière : 10 (Commun), 20 (Rare), 40 (Épique), 80 (Légendaire) × palier × 1,5^(retailles déjà faites) ;
- or : 400 × palier × rareté × 1,5^(retailles déjà faites), comme l'affûtage (un puits d'or de plus).

Exemple, une Épique du palier 40 (palier ×2, rareté ×1,8) :

| Retaille | Poussière | Or | Pièces Épiques du même palier à démonter |
|---|---|---|---|
| 1ʳᵉ | 80 | 1 440 | 5 |
| 2ᵉ | 120 | 2 160 | 7 à 8 |
| 3ᵉ | 180 | 3 240 | 11 à 12 |
| 5ᵉ | 405 | 7 290 | 25 |
| 8ᵉ | 1 367 | 24 600 | 85 |

Les premières retailles sont abordables ; chercher la ligne parfaite devient vite très cher.

## 5. Les éclats

### A. La boutique de saison (le gros puits)

La boutique de la Marée change **quatre fois par an**, avec les quatre saisons de l'année (Givre en hiver, Marées au printemps, Moisson en été, Braises en automne : les noms des événements de `game-design.md` §8.3). Chaque saison :

| Quoi | Prix |
|---|---|
| La **tenue de la saison**, une par classe | 1 500 |
| Deux **pièces d'apparence à part** (une arme d'apparence, une cape) | 600 chacune |
| Un **ornement de nom** de la saison | 600 |

Soit **3 300 éclats** par saison pour une classe, **13 200 par an** : ce que gagne un habitué. Ce qui part à la fin de la saison **revient l'année suivante** (pas d'exclusivité définitive).

Toujours en vente, hors saison :

- **Marée haute** entière (1 200) ou **pièce par pièce** (250 chacune) ;
- **cadre de portrait** de chaque titre de la Marée (600), une fois le titre obtenu : on paie, mais il faut être venu.

**Pour l'instant**, les saisons n'existent pas : il faut un **calendrier des saisons** dans `data/` (dates de début, nom, contenu de la boutique). Il servira ensuite aux vrais événements de saison (P5), qui pourront aussi changer la Marée elle-même (un quatrième type de Marée propre à la saison, par exemple).

### B. La lanterne du clan (puits collectif)

Un décor dans la place du clan, que les membres paient ensemble en éclats : **5 000** (niveau 1), **15 000** (niveau 2), **40 000** (niveau 3). Elle s'allume au-dessus de la place les soirs de Marée et compte pour le **Renom** du clan comme un niveau de bâtiment. **Aucun boost.**

### C. La lanterne de digue (recette d'artisan)

L'Artificerie fabrique une **lanterne de digue** (20 éclats et un mécanisme). Allumée pendant la Marée, elle ajoute des points **à la digue du serveur**, pas au joueur : elle aide tout le monde à allumer une lanterne de plus. Elle se vend au marché.

## 6. Une question pour Louis : les éclats se vendent-ils ?

Aujourd'hui, oui.

- **Ils se vendent (comme les jetons d'événement de Dofus)** **[Recommandé]** : ceux qui viennent le soir gagnent aussi de l'or, et celui qui ne peut pas venir à 20 h peut s'offrir une apparence. Les titres et les cadres de titre, eux, demandent d'être venu.
- **Ils sont liés au personnage** : seuls ceux qui ont tenu la digue en profitent. Plus « juste », mais les éclats perdent la moitié de leur intérêt pour l'économie.

Comme les éclats ne touchent plus au build, les deux choix sont sains.

## 7. Essais d'apparences de saison (23 octobre, soir)

Louis : « les visuels ne sont pas nos points forts ; tu penses être capable de créer assez de visuels variés, et surtout assez beaux ? Fais des tests, en lien avec des types de saisons. Des pièces, des tenues complètes. »

Quatre tenues d'essai (`sketch_season_*` dans `data/cosmetics.yaml`, jamais proposées au joueur), 15 pièces nouvelles générées par `art/make_seasons.mjs`, planche de développement `/#saisons` (chaque tenue sur les trois classes, puis chaque pièce seule sur la tenue de départ). Images : `docs/design/saisons/`.

| Saison | Tenue | Pièces nouvelles |
|---|---|---|
| Givre | Sentinelle du Givre | capuche fourrée à couronne d'éclats de glace, mantelet de fourrure et cape brodée de flocons à ourlet de glaçons (neige qui tombe), épaulière à éclats, bottes fourrées |
| Moissons | Gardien des Moissons | chapeau de paille à brin de blé et plume de corneille, gerbe de blé dans le dos et foulard (feuilles qui tombent), ceinture de corde à faucille et lanterne-courge qui luit |
| Carnaval des Masques (événement surprise) | Masque du Carnaval | masque à bec, tricorne à trois plumes qui ondulent, pourpoint d'arlequin à manches fendues, cape à losanges et grelots avec collerette (confettis) |
| Marée des Abysses | Héritier des Abysses | couronne de corail aux pointes qui luisent, cape d'algues qui ondulent (bulles), épaulière en nautile, ceinture de filet à étoile de mer |

Ce qu'il a fallu ajouter au moteur des personnages : une tenue peut teinter les jambes, les bottes et le cuir (`palette.legs`, `legsDark`, `boots`, `leather`) ; une pièce peut définir ses propres motifs et dégradés (`id="rig-…"`) ; deux animations de pièce (`fx-fall` : particules qui tombent, `fx-sway` : plumes et algues qui ondulent).

**Retour de Louis (23 octobre)** : « elles sont jolies », mais une seule tenue pour toutes les classes efface les classes : « il faut des skins, mais conserver, ou créer un visuel spécifique pour chaque classe ». D'où **une version par classe de chaque tenue** (`byClass` dans `data/cosmetics.yaml`), avec une **signature de classe** gardée dans toutes les tenues **[Proposé par Claude, à valider]** :

| Classe | Signature | Givre | Moissons | Carnaval | Abysses |
|---|---|---|---|---|---|
| Forgefeu | visage découvert et barbe tressée, avant-bras nus, tablier | chapka de fourrure, col de fourrure | chapeau de paille | tricorne, masque posé sur la barbe, tablier cramoisi | couronne de corail, tablier |
| Runiste | capuche profonde (visage dans l'ombre, yeux qui luisent), robe jusqu'aux pieds | capuche fourrée à couronne de glace, robe à ourlet de fourrure et flocons-runes | capuche de sac d'épouvantail, robe rapiécée | capuche d'arlequin à grelot, robe à losanges | capuche à corail et perles, robe à écailles et algues |
| Traqueur | capuchon court à plume ou à crête, carquois, cape courte | capuchon bordé de fourrure à plume blanche, cape à glaçons | capuchon de jute à plume de faisan | tricorne à plumes, carquois | capuchon à nageoire, cape courte d'algues |

Ce qui fait la saison reste commun aux trois versions (couleurs, matières, particules, ceinture, épaulière, dos). 14 pièces de plus (`classVersions` dans `art/make_seasons.mjs`).

Limites vues sur les essais : le bas du corps reprend le pantalon de piste dans les quatre tenues (il faudrait des jambières propres à chaque saison) ; aucune pose ni animation propre ; les couleurs d'une tenue passent par sept rôles, donc une pièce posée sur une autre tenue prend ses couleurs (une capuche du Givre sur la tenue Braise devient brune).

## 8. Budget d'affichage des apparences (23 octobre, soir)

Louis : « détermine toi-même jusqu'où pousser les détails ; on veut absolument éviter les lags et les chutes d'images ».

**Mesure** (`node art/perf.mjs`, page `/#perf` : 20 personnages animés à la taille du bourg, Edge sans carte graphique, donc un pire cas ; les chiffres comparent les tenues entre elles) :

| Cas | Images par seconde |
|---|---|
| Tenue de départ du Runiste | 18 |
| … sans les lueurs floues | 31 |
| Tenue de piste (esquisse) | 7,5 ; sans les matières (tissage, grain, mailles) : 15,8 |
| Essais de saison | 6 à 14 |
| **Mode foule** (sans lueurs ni matières, repos animé à 20 images par seconde) | **32 pour toutes les tenues, essais compris** |
| Halloween (fausses lueurs) | 17 (comme la tenue de départ) ; 31 à 32 en foule |

**Ce qui coûte** : 1) les lueurs floues (`filter="url(#rig-glow)"`), de loin ; 2) les matières en motif sur de grandes surfaces ; 3) les bords très découpés dessinés plusieurs fois (fourrure festonnée). Le nombre de formes compte peu.

**Fait** :
- **Mode foule** dans le bourg et sur la place du clan (`<Character crowd>`, `rig.css`) : sans lueurs ni matières, repos animé à 20 images par seconde. Invisible à la taille d'un doigt ; les tenues de départ y passent de 18 à 32 images par seconde, et une tenue chargée n'y coûte plus rien de plus.
- **Fausses lueurs** : `rig-halo` et `rig-halo-trim` (dégradés circulaires, sans flou) dans le moteur.

**Règles pour une apparence [Proposé par Claude]** (pour les grandes vues : salle Personnage, combat, fiche d'un joueur) :
- au plus 3 vraies lueurs floues par personnage (les yeux, l'orbe de sort) ; tout le reste en fausse lueur ;
- au plus 4 surfaces en matière (tissage, grain, écailles) ;
- une fourrure festonnée n'a pas de touffe plus serrée que tous les 12 px ;
- environ 450 formes au plus ; les particules et les petits détails dans un calque `detail: 2` ;
- vérifier avec `node art/perf.mjs` : une nouvelle tenue ne descend pas sous 80 % de la tenue de départ de sa classe.

**« Réduire les animations »** : quand Windows réduit les animations (c'est le cas sur le PC de Louis), le jeu coupe les effets animés des pièces (lanternes qui tournent, ailes qui battent, flammes qui vacillent) ; seule la respiration du personnage reste. Les pièces animées gardent une pose fixe correcte (chaque lanterne a sa place), mais **un joueur dans ce cas ne voit pas ce qu'il achète**. **Décidé par Louis (23 octobre) : « ralentis »** : les effets des pièces continuent, 2,2 fois plus lents. Avant, ils étaient coupés (`art/shot.mjs` capture avec les animations actives).

## 9. Essai d'Halloween : « La Veillée des Courges » (23 octobre, soir, à voir seulement)

Louis : « fais le truc d'Halloween, je ne veux pas l'implémenter, juste voir les designs ». Tenue `sketch_season_halloween`, planche `/#saisons`, images `docs/design/saisons/halloween-*.png`.

- **Sorts spectraux** : la tenue change la couleur des sorts et des lueurs de classe (`palette.glow`, ici vert).
- **Runiste, Veilleur des Âmes** : capuche et robe en lambeaux cousues de runes spectrales, toile d'araignée, mantelet autour duquel tournent trois lanternes d'âmes ; bâton à lanterne.
- **Forgefeu, Forgeron des Cendres-Mortes** : barbe tressée prise dans les toiles avec une araignée qui monte et descend, tablier calciné à crâne et braises spectrales, corbeau sur l'épaule ; marteau-citrouille qui flambe.
- **Traqueur, Chasseur de Loups** : capuchon en tête de loup (oreilles, mâchoire en visière, crocs), peau de loup aux pattes nouées et queue qui pend ; arc d'os.
- **À la pièce** : tête de citrouille (visage qui vacille), chapeau de sorcière (lune qui pend), corbeau (penche la tête, cligne de l'œil, bouge l'aile), cape chauve-souris (ailes qui battent), brume au sol avec deux petits fantômes.
- **Couleurs propres** : les pièces emblématiques gardent leur couleur sur n'importe quelle tenue (`var(--c-pumpkin, #E8761E)`, corbeau, loup, os) ; le défaut « une pièce prend les couleurs de la tenue » ne les touche plus.
- **Armes d'apparence** : posées par la planche seulement ; le jeu n'a pas encore d'emplacement d'apparence pour l'arme ni pour l'effet.
