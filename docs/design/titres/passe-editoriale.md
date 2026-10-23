# Passe éditoriale : titres, surnoms et commandes des maîtres

> **Statut** : passe de Claude du 24 octobre 2026, à la demande de Louis (« corriger les faiblesses, enrichir la variété, compléter les nouveaux métiers, ajouter le palier 90 »). **À relire par Louis.** Données : `data/trials.yaml` (régénéré par [`passe-editoriale.mjs`](passe-editoriale.mjs)), `data/professions.yaml`, `ornement/manifest.json` → `data/ornaments.yaml`. Identifiants, niveaux, quantités et récompenses existants inchangés.

## 1. Ce qui a été fait

- **Relu** les 85 commandes (17 métiers × 20, 40, 60, 80, 99), les 17 surnoms de départ, les répliques des maîtres, les titres de la Marée, les noms des ensembles.
- **Retouché 58 commandes**, presque toujours le seul surnom ; les histoires ne changent que là où elles se répétaient ou contredisaient l'univers. Les titres qui marchaient restent (Désespoir des castors, Fournisseur de siestes, Gribouilleur de runes, La Brume en personne, Fendeur de querelles, Sciure d'or, Fil d'or, Âme des rouages, Pas-perdu des Lointains…).
- **Ajouté le palier 90** pour les 17 métiers : une commande chacun, avec son histoire. `settings.ranks.levels` passe à 20, 40, 60, 80, 90, 99 ; les sept ornements du 90 sortent de la réserve et se débloquent avec elle.
- **Deux surnoms de départ** changés (Agriculture, Exploration) et **Brunhild** devient « Maîtresse » (ses histoires disaient déjà « elle »).

## 2. Ce que l'analyse a trouvé

| Répétition | Avant | Après |
|---|---|---|
| « Chuchoteur de… » | 4 (Minage, Bûcheronnage, Herboristerie, Menuiserie) | 0 |
| « Gardien de… », « Seigneur de… », « Fléau de… » | 3 + 2 + 2 | 0 |
| « Maître de… » | 4 (dont « Maître des récoltes » et « Maître des moissons ») | 1, un jeu de mots (« Maître chanteur des poutres ») |
| « … de légende » | 3 | 1 (« Légende de la jetée ») |
| « … du bourg » | 6 (dont 3 au niveau 99) | 1 (titre de la Marée) |
| « Semeur », « Terreur », « Orfèvre », « Distillateur », « Lieur », « Bâtisseur » | 2 ou 3 chacun | 1 chacun |
| « roi », « rois » | 2 (Forge, Cuisine) alors que Bramo n'a pas de roi (la Joaillerie le dit) | 0 |
| Construction « Nom de Y » | 82 % des titres | 55 % |
| Surnoms seulement au féminin | 3 (Couseuse, Brodeuse, Tisseuse : un joueur recevait « Brodeuse ») | 0 |
| Histoires : « Chez lui/elle, c’est une médaille / un discours » | 5 | 2 |

Autres faiblesses corrigées : « Traqueur de cerfs » (Traqueur est une classe), « Éclaireur des Lointains » (les Éclaireurs sont une activité), « Gratteur de galeries » juste après « Gratte-sol », « Lanceur patient » juste après « Lanceur de lignes », « Pisteur du dimanche » et « Promeneur du dimanche » au départ de deux métiers, des nains dans le Minage (il n'y en a pas dans le monde), « Artificier de la Marée » et « Pyrotechnicien du bourg » qui ne faisaient que redire le métier, « Alchimiste du bourg » au niveau 99.

## 3. Les règles suivies

- **Le surnom vient de l'histoire.** Quand une commande raconte quelque chose, le surnom le reprend : trois heures à reculons donnent « Cueille-à-reculons », le capitaine qui oublie de payer donne « Créancier du Bastion », le jury muet donne « Coupe-sifflet », le maître qui veut « des murs sans histoire » donne, au 90, « Mur sans histoire ».
- **Des formes variées.** Moins de « Nom de Y » ; plus de mots composés (Casse-cailloux, Agace-géants, Nomme-les-pierres), de choses et de phénomènes (Pluie d'étincelles, Corne d'abondance, Rose des vents), d'expressions anciennes (Taiseux, Souvenance, Un an et un jour, Doigts de fée, avoir le Feu sacré), de citations (« Enfin du sérieux »).
- **Des titres pour tous.** Les mots composés et les noms de choses ne changent pas au féminin : ils vont à tous les joueurs. Les noms de métier au masculin restent surtout aux premiers paliers (Liseur de traces, Arpenteur du bois).
- **Chaque métier a son vocabulaire.** Tannerie : l'odeur, la fosse, le cuir bouilli, l'année de tannage. Chasse : les traces, les bergers, l'ours, la brume de la Lisière. Couture : l'ourlet, l'aiguille, la voile, la reprise. Elles ne se marchent plus dessus.
- **La progression.** Au 20, modeste et un peu ridicule (Sourcils roussis, Nez bouché, Ourlet-de-travers) ; au 40, une anecdote locale ; au 60, une vraie réputation ; au 80, une réputation qui dépasse le bourg ; au 90, le mystère des Lointains et de la Marée ; au 99, un titre qu'on a envie de porter (Panacée, Table ouverte, Couronne sans tête, Cent Marées, La Forêt qui marche).
- **Le palier 90 : le lore.** Chaque commande du 90 descend dans ce que la Marée a laissé : les galeries que personne ne se souvient d'avoir creusées, la forge éteinte, les champs salés, l'encre qu'elle n'efface pas, la route qui bouge, la soupe dont la recette a disparu. Le ton reste léger, le fond sérieux.
- **Une traduction anglaise possible.** Des images plutôt que des calembours intraduisibles. Les jeux de mots gardent une idée transposable (« Maître chanteur des poutres » : *Beam Blackmailer* ; « Le Feu sacré » : *The Sacred Fire* ; « Coupe-sifflet » : *Jury Silencer*).

## 4. Le palier 90

- **Commande** : une par métier (`<métier>_90`), entre le 80 et le 99. Les matières du 80 × 1,5 (budget de 9 h, entre 6 h et 12 h), 45 000 or (entre 30 000 et 60 000). Comme les autres, à équilibrer.
- **Ornements** : les sept dessins du 90 (Minage, Bûcheronnage, Pêche, Herboristerie, Forge, Menuiserie, Cuisine) sont rattachés à leur commande (`ornement/manifest.json` : `enabled`, `trialId` ; puis `node ornement/tools/publish.mjs`). Les dix autres métiers n'ont pas encore d'ornements du tout.
- **Jeu** : rien d'autre à brancher, le moteur lit `settings.ranks.levels`. La fenêtre « Ornements et titres » dit maintenant « niveaux 20, 40, 60, 80, 90, 99 ».

## 5. Points à trancher par Louis

- **L'ornement du 80 de Minage** a été dessiné avec des motifs « d'architecture naine » (le titre d'origine était « Salué par les nains »). Le titre devient « Salué par la Taupinière » (les vieux mineurs du bourg) ; le dessin peut rester ou être repris.
- **Deux surnoms de départ** changent : Agriculture « Gratte-sillon » → « Arrache-chiendent » (deux « Gratte- » au départ avec Gratte-sol) ; Exploration « Promeneur du dimanche » → « Plan à l'envers » (deux « du dimanche » avec la Chasse). Les joueurs qui les portaient ne perdent rien : le surnom de départ est recalculé.
- **Les joueurs déjà passés** par une commande voient son nouveau surnom (le surnom est lu dans les données, pas enregistré) : en développement seulement, sans conséquence.

## 6. Tous les changements de titres

| Métier | Palier | Avant | Après | Commande |
|---|---|---|---|---|
| Minage | 20 | Gratteur de galeries | **Casse-cailloux** | « Les cailloux d’Orvald » |
| Minage | 40 | Chuchoteur de filons | **Oreille des filons** | « Le filon qui chuchote » |
| Minage | 60 | Fléau des éboulements | **Étai des galeries** | « L’éboulement de trop » |
| Minage | 80 | Salué par les nains | **Salué par la Taupinière** | « Le salut des nains » → « Les vieux de la Taupinière » |
| Minage | 90 | *nouveau* | **Lampe du fond** | « Les galeries d’avant » |
| Bûcheronnage | 60 | Chuchoteur de chênes | **Beau-parleur des chênes** | « Le murmure des chênes » |
| Bûcheronnage | 90 | *nouveau* | **La Hache tranquille** | « Les arbres qui ont vu la Marée » |
| Bûcheronnage | 99 | La forêt à lui tout seul | **La Forêt qui marche** | « La forêt à lui seul » → « Toute une forêt, ou presque » |
| Pêche | 20 | Lanceur patient | **Taiseux de la baie** | « Le calme de la baie » |
| Pêche | 60 | Veilleur de lanternes | **Noctambule des quais** | « Le veilleur de lanternes » → « Les poissons qui s’allument » |
| Pêche | 80 | Seigneur des marées | **Berger de la houle** | « Les marées capricieuses » |
| Pêche | 90 | *nouveau* | **Silence des grands fonds** | « Ce qui mord sous la brume » |
| Herboristerie | 60 | Chuchoteur de givre | **Cueille-à-reculons** | « La fleur qui refuse » |
| Herboristerie | 90 | *nouveau* | **Rosée des Lointains** | « Les jardins de la brume » |
| Chasse | 20 | Traqueur de cerfs | **Liseur de traces** | « Le garde-manger de Brenna » |
| Chasse | 40 | Fléau des loups | **Sommeil des bergers** | « Les loups de la lande » |
| Chasse | 60 | Chasseur de l’ours | **Patte-d’Ours** | « La bête du col » |
| Chasse | 90 | *nouveau* | **Lit-dans-la-brume** | « Les traces sans bête » |
| Chasse | 99 | Seigneur des battues | **L’Arc de Brenna** | « La dernière battue » |
| Agriculture | 40 | Maître des récoltes | **Récolteur de nuages** | « Le coton du Val » |
| Agriculture | 60 | Semeur de couleurs | **Le Bleu du Val** | « Les teinturiers du Val » |
| Agriculture | 80 | Maître des moissons | **Grenier plein** | « La grande moisson » |
| Agriculture | 90 | *nouveau* | **Blé-sur-sel** | « Les champs salés » |
| Forge | 40 | Semeur d’étincelles | **Pluie d’étincelles** | « La pluie d’étincelles » → « L’épée artistique » |
| Forge | 60 | Gardien du feu sacré | **Le Feu sacré** | « Le feu sacré » → « Le feu qui reconnaît » |
| Forge | 80 | Forgeron des rois | **Créancier du Bastion** | « Le marteau du roi » → « Le marteau du capitaine » |
| Forge | 90 | *nouveau* | **Rallume-forges** | « La forge qui s’était tue » |
| Menuiserie | 60 | Chuchoteur de poutres | **Maître chanteur des poutres** | « Les poutres qui grincent » |
| Menuiserie | 80 | Charpentier de légende | **Mille-Ans** | « Le toit de la guilde » |
| Menuiserie | 90 | *nouveau* | **Niveau à bulle** | « L’escalier qui ne mène nulle part » |
| Tannerie | 20 | Tanneur de la fosse | **Nez bouché** | « Les sacoches du courrier » |
| Tannerie | 40 | Cuirassier des landes | **Cuir-bouilli** | « L'équipée du nord » → « L’équipée du nord » |
| Tannerie | 60 | Sellier du Bastion | **Enfin du sérieux** | « Les selles du Bastion » |
| Tannerie | 80 | Tanneur des cimes | **Increvable** | « Le cuir d’élan » |
| Tannerie | 90 | *nouveau* | **Un an et un jour** | « Les vieilles fosses » |
| Couture | 20 | Couseuse de lin | **Ourlet-de-travers** | « Les robes des novices » |
| Couture | 40 | Tailleur des adeptes | **Doigts de fée** | « La robe d'adepte » → « La robe d’adepte » |
| Couture | 60 | Brodeuse du chapitre | **Aiguille d’argent** | « Les robes du chapitre » |
| Couture | 80 | Tisseuse des voiles | **Voile-Bleue** | « Les voiles bleues » |
| Couture | 90 | *nouveau* | **Reprise invisible** | « Les bannières rapiécées » |
| Cuisine | 60 | Terreur des buffets | **Corne d’abondance** | « Les buffets vides » |
| Cuisine | 80 | Celui qui régale les rois | **Coupe-sifflet** | « La table des rois » → « Le jury du Concours » |
| Cuisine | 90 | *nouveau* | **Goût d’enfance** | « La soupe de grand-mère » |
| Cuisine | 99 | Gourmet de légende | **Table ouverte** | « Le festin du siècle » |
| Alchimie | 20 | Distillateur d'élixirs | **Sourcils roussis** | « Les élixirs de la mine » |
| Alchimie | 40 | Apothicaire du bourg | **Apothicaire de garde** | « La réserve du dispensaire » |
| Alchimie | 80 | Gardien des fioles | **Remède de la digue** | « La pharmacie de la digue » |
| Alchimie | 90 | *nouveau* | **Fume-violet** | « La brume en bouteille » |
| Alchimie | 99 | Alchimiste du bourg | **Panacée** | « L’élixir du bourg » → « Le remède à presque tout » |
| Joaillerie | 40 | Orfèvre des améthystes | **Fait-dire-oui** | « Les fiançailles du bourgmestre » |
| Joaillerie | 80 | Garde du trésor | **Brille-trop** | « Le trésor de la halle » |
| Joaillerie | 90 | *nouveau* | **Nomme-les-pierres** | « Les pierres sans nom » |
| Joaillerie | 99 | Joyau du bourg | **Couronne sans tête** | « La couronne qui n’existe pas » |
| Enchantement | 40 | Lieur de noyaux | **Ouvre-portes** | « Le cœur des runes » |
| Enchantement | 90 | *nouveau* | **L’Encre qui reste** | « L’encre que la Marée n’efface pas » |
| Enchantement | 99 | Mémoire du bourg | **Souvenance** | « Ce que la Marée a pris » |
| Artificerie | 20 | Horloger du beffroi | **Deux minutes d’avance** | « L'horloge du beffroi » → « L’horloge du beffroi » |
| Artificerie | 40 | Artificier de la Marée | **Fusée de garde** | « La nuit des fusées » |
| Artificerie | 60 | Pyrotechnicien du bourg | **Bouquet final** | « Le feu d’artifice de la fête » |
| Artificerie | 80 | Gardien des phares | **Agace-géants** | « Les phares de la digue » |
| Artificerie | 90 | *nouveau* | **Apprivoise-outils** | « Le rabot qui rabote tout seul » |
| Construction | 20 | Bâtisseur du lavoir | **Fil-à-plomb** | « Le mur du lavoir » |
| Construction | 40 | Maître d'œuvre | **Nom sous l’arche** | « La halle neuve » |
| Construction | 80 | Architecte des halles | **Pierre d’angle** | « La halle des clans » |
| Construction | 90 | *nouveau* | **Mur sans histoire** | « Le mur sans histoire » |
| Construction | 99 | Maître de la digue | **Cent Marées** | « La digue de pierre » |
| Exploration | 40 | Éclaireur des Lointains | **Poches pleines** | « Ce que garde la Lisière » |
| Exploration | 80 | Cartographe des Lointains | **Rose des vents** | « La carte des Lointains » |
| Exploration | 90 | *nouveau* | **Boussole têtue** | « La route qui n’était pas là hier » |

Les surnoms de tous les paliers, métier par métier : [`../rangs.md`](../rangs.md#les-surnoms).
