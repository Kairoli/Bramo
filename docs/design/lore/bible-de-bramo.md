# La bible de Bramo

> **Statut** : synthèse de Claude du 24 octobre 2026, à la demande de Louis (« vérifie que le lore est bien développé, suivable et intéressant ; on pourra s'en servir plus tard »). Elle rassemble ce qui était dispersé dans `docs/design/contenu/le-monde.md`, le dossier `coeur-du-jeu`, `combat-visuels.md` (bestiaire) et les données du jeu (`trials.yaml`, `professions.yaml`, `combat/encounters.yaml`, `combat/tide.yaml`, `npc_orders.yaml`). Chaque point est marqué :
> - **[Canon]** : déjà écrit dans le jeu ou décidé par Louis ;
> - **[Proposé]** : ajouté par Claude pour combler un vide, à valider ;
> - **[Secret]** : la vérité derrière le décor, pour ceux qui écrivent, jamais dite telle quelle aux joueurs.

## 0. Le verdict

| Question | Réponse courte |
|---|---|
| **Développé ?** | Oui pour l'**ambiance** : une idée forte et originale (une brume qui éteint les feux et fait oublier), six régions qui racontent chacune quelque chose, dix-sept maîtres attachants, des ennemis qui ne sont pas des monstres génériques (une lanterne à pattes, un notaire noyé, une lavandière de brume). **Non** pour le **fond** : on ne sait ni d'où vient la Marée, ni quand elle est montée, ni ce qu'il y a derrière Bramo, ni ce que veulent les choses des Lointains. |
| **Suivable ?** | **Pas encore.** Le lore était éparpillé dans six documents et les données ; dans le jeu, il n'apparaît que par petites phrases (descriptions des zones, histoires des maîtres). Aucun fil qu'un joueur pourrait suivre, aucune révélation, aucune raison d'avancer « pour savoir ». |
| **Intéressant pour le jeu ?** | **Oui, et c'est sa force** : les mécaniques racontent déjà l'histoire (la Marée remonte chaque soir à 20 h ; elle éteint les feux et les Forgefeux combattent par le feu ; elle fait oublier et les Runistes écrivent ; les outils travaillent seuls et les artisans les apprivoisent). Peu de jeux idle ont un univers aussi lié à leur boucle. Il manque un fil rouge : c'est l'objet des §9 et §10. |

## 1. Le ton [Canon]

- Un MMORPG français à l'ancienne : **fantasy rurale**, humour léger qui naît des situations, expressions désuètes, personnages hauts en couleur (« Désespoir des castors », « Fournisseur de siestes »).
- **Le sérieux est réservé à la Marée** : la brume, l'oubli, les âmes des lanternes, le serment du Bastion. On peut sourire de tout, sauf de ce que la Marée a pris.
- Ce qui n'existe pas à Bramo : **pas de roi** (le bourg n'en a jamais eu), **pas de nains, d'elfes ni de dragons**, **pas de dieux** qui parlent, pas de « Seigneur suprême des flammes éternelles ». L'étrange vient des choses ordinaires qui ont mal tourné.
- Règles d'écriture détaillées (titres, surnoms, progression) : [`../titres/passe-editoriale.md`](../titres/passe-editoriale.md) §3.

## 2. Le monde en une page

Il y a deux générations, la **Grande Marée** est montée. Pas une marée d'eau : une **brume lourde et salée, qui éteint les feux et fait oublier**. Les forges se sont tues, les archives ont coulé, les veilleurs ont fermé leurs portes. Quand elle s'est retirée, elle a laissé les **Lointains** : des terres pleines de choses à moitié vivantes, d'**outils qui travaillent seuls**, de **lanternes qui marchent**.

**Bramo** est le bourg qui s'est bâti au bord, là où la Marée s'arrête, derrière sa **digue**. On y vit de ce qu'on récolte, de ce qu'on fabrique et de ce que les braves rapportent des Lointains. Mais la Marée n'est pas partie : **chaque soir, elle remonte jusqu'à la digue**, et chaque saison un peu plus haut.

## 3. La Marée

### 3.1 Ce que tout le monde sait [Canon]

- **Une brume**, lourde, salée, qui **éteint les feux** et **fait oublier** (des noms, des recettes, des chemins).
- **Elle remonte chaque soir**, de 20 h à 21 h, jusqu'à la digue ; le bourg sonne la cloche à 19 h 45, et tout le serveur la tient.
- **Elle a trois visages**, un par soir, qui tournent :
  - **la Débâcle** : la digue du Fossé gris a cédé, et tout ce que la Marée avait pris descend la rivière ;
  - **la Nuit des Lanternes** : les lanternes de la Chaussée marchent vers le bourg ; **derrière chacune, une âme qui rentre** ;
  - **la Veille des Géants** : un géant sort de la brume (le Porte-Fanal, la Veuve de cuivre, le Grand Arpenteur).
- **Elle monte un peu plus chaque saison** et déplace le monde : une mutation, des créatures nouvelles, une route qui change.
- **Ce qu'elle prend ne revient pas toujours** : « Tout ne reviendra pas. Essaie quand même » (Ilian).

### 3.2 La Grande Marée [Proposé]

- **Quand** : il y a deux générations, une soixantaine d'années. C'est ce que supposent déjà les histoires du jeu : le plus vieux de la Taupinière n'a pas levé son verre « depuis la Marée », la pioche du père d'Orvald est restée dans les galeries d'avant, la recette de la grand-mère de Bertin a disparu. Les anciens du bourg s'en souviennent enfants ; les maîtres sont nés après.
- **Le vocabulaire** : « **la Grande Marée** » pour la catastrophe, « **la Marée** » ou « la Marée du soir » pour sa remontée quotidienne. Les anciens disent « avant » et « depuis ».

### 3.3 Ce que personne ne sait [Canon : ce sont des mystères, qu'il faut garder]

- D'où elle vient, et pourquoi elle remonte **chaque soir**.
- Ce que deviennent les souvenirs qu'elle prend.
- Qui sont les âmes derrière les lanternes.
- Pourquoi le Bastion tient encore un serment dont personne ne connaît la fin.

Une réponse est proposée au §10, réservée à ceux qui écrivent.

## 4. Les Lointains : six régions [Canon, sauf mention]

Du plus proche au plus lointain. Chaque région a deux zones de route, un gardien, un vestige (la matière de ses ensembles) et une manière de combattre.

| Région | Ce qu'elle raconte | Ses gardiens et créatures | Vestige |
|---|---|---|---|
| **Les Abords du bourg** | le familier qui a mal tourné : lanternes qui ne s'éteignent jamais, linge qui sèche depuis la Grande Marée, fossés gris qui rongent | la Lanterne errante (trois pattes de fer, flamme à visage), le Rôdeur des fossés, **Mère Grise, la Lavandière du Puits** (un esprit de lavandière qui tord son drap au-dessus du baquet ; sa robe se défait en brume) | Galets du puits |
| **Les Forges éteintes** | le travail qui continue sans personne : une fonderie désertée où le métal travaille encore | le Marteau-pilon (trois coups, le troisième pour tout casser), le Gardien du verger de verre soufflé, **le Contremaître rouge** (masque de fer, veines de braise, presse à la main) | Scorie de mémoire |
| **La Lisière des veilleurs** | une forêt qui garde quelque chose : chemins effacés, balises, cloîtres aux balances | le Peseur (moine de pierre moussue), le Cerf de braise, **la Matriarche de résine** (une reine-phalène dans un cocon d'ambre) | Ambre de veille |
| **Les Archives englouties** | le savoir noyé, et ce qui le garde : salles où l'écho répond, livres lestés de plomb, encre qui ronge | l'Écho des archives, le Brochet du gué, **le Notaire des marées** (clerc noyé, perruque à bernacles, il ne signe qu'à marée haute) | Encre fossile |
| **Le Bastion des longues veilles** | une forteresse qui n'a jamais reçu l'ordre de se rendre : une garnison de pierre tient encore un serment dont personne ne connaît la fin | les Gardiennes au sceau (elles vont par deux), la Vigie (une tour qui marche), **le Gardien des trois portes** | Éclat de serment |
| **La Cicatrice des trois vents** | là où la Grande Marée a frappé le plus fort : un plateau fissuré, des éclats de verre vivants | le Patron d'atelier (un établi mal luné), la Rafale, **le Régent des courants** (couronne d'éclats, manteau de vent) | Quartz de faille |

**Le Bastion est vide de vivants [Canon, précisé le 24 octobre]** : ses défenseurs sont des statues et des gardiens de pierre. Il n'y a ni capitaine ni cavaliers au Bastion ; ceux du bourg appartiennent à la **garde du bourg**.

## 5. Bramo, le bourg

### 5.1 Les lieux

| Lieu | Ce qu'on en sait | Statut |
|---|---|---|
| **La digue** | ce qui sépare le bourg de la Marée ; on la tient chaque soir, on la répare, on y allume des lanternes | Canon |
| **La halle** et **le Panneau** | la halle du bourg (refaite par Gautier), le Panneau qui annonce qui a fait quoi, les contrats, le type de Marée du soir | Canon |
| **Le beffroi** | son horloge sonne quand elle veut, puis avec deux minutes d'avance (Capucine) ; sa cloche annonce la Marée | Canon |
| **Le lavoir du Puits** | le vieux lavoir, au bout des Abords ; on dit que Mère Grise y lavait avant la Grande Marée | Canon / Proposé |
| **La Taupinière** | la taverne des vieux mineurs, où l'on ne salue personne | Canon (24 octobre) |
| **La jetée** et le port | Naël, sa plaque de travers, les voiles bleues des marins | Canon |
| **Le Cercle des runes** | l'école des runistes : novices, adeptes, épreuve des runes ; ses murs s'effacent | Canon |
| **Le dispensaire** | les blessés de la Marée, les fioles d'Évariste | Canon |
| **Les fosses de Hugon** | la tannerie ; les vieilles fosses, fermées depuis la Grande Marée | Canon |
| **Le Val** | les champs, le coton, la guède, la fête des moissons ; les champs du bas, salés par la Grande Marée | Canon |
| **Le Bois des Murmures** | le bois où l'on se perdait avant les cartes d'Ombeline | Canon |
| **Le Fossé gris** | le fossé et sa digue ; son pont a été mangé, puis refait en pierre | Canon |
| **La vieille tour** | son escalier montait vers le ciel et s'arrêtait ; il mène maintenant à une terrasse sur les Lointains | Canon (24 octobre) |

### 5.2 Qui décide, qui protège

- **Le bourgmestre et le conseil du bourg** : ils aiment les chaînes d'or « comme les grandes villes » et se sentent importants [Canon].
- **La garde du bourg** et **son capitaine** : des lames, des selles, un marteau jamais payé [Canon].
- **Les maîtres de métier** : ils transmettent leur art et donnent les commandes des rangs [Canon].
- **La Guilde du bourg** : tous les métiers ensemble ; elle donne un petit bonus à qui n'a pas de clan [Canon].
- **Les clans** : ils bâtissent leur halle et leur village, gagnent du Renom, de Hameau à Ville-lanterne (une lanterne qui brûle au-dessus de la halle) [Canon].
- **Le Concours des Maîtres** : une fois par mois, les maîtres jugent les plus belles pièces ; un poinçon pour toujours [Canon, à construire].

### 5.3 L'Arrière-pays [Proposé]

Derrière Bramo, loin de la Marée, il y a **l'Arrière-pays** : des bourgs plus grands, les « grandes villes » que le conseil envie, d'où viennent les caravanes et où partent les cuirs de Hugon. On n'y joue pas ; il sert de contraste (là-bas, on a oublié la Marée ; à Bramo, on ne peut pas) et de prétexte aux caravanes (Routes franches), aux commandes et aux visiteurs.

## 6. Les gens

### 6.1 Les dix-sept maîtres [Canon]

| Maître | Métier | En une ligne |
|---|---|---|
| Orvald | Minage | bourru, avare de mots ; son estime tient dans un casier gravé ; il a retrouvé la pioche de son père |
| Aldra | Bûcheronnage | pratique, pince-sans-rire ; garde l'écorce, « les tanneurs paient » |
| Naël | Pêche | taiseux ; « pas mal » est un discours ; la mer ne se presse pas |
| Ysolde | Herboristerie | se lève à l'aube, renifle tout ; soupçonne des pactes avec les orties |
| Brenna | Chasse | lit les traces, siffle faux ; « les traces ne mentent jamais, les chasseurs si » |
| Anselme | Agriculture | pleure facilement (« c'est la farine ») ; la terre rend ce qu'on lui donne, moins les années de grêle |
| Brunhild | Forge | fière, frappe les lingots du poing ; veut entendre sonner l'enclume des Forges éteintes |
| Joris | Menuiserie | maniaque du droit ; son niveau à bulle est sa conscience |
| Hugon | Tannerie | « le bon cuir sent mauvais avant de sentir bon » ; garde toujours une pièce « pour vérifier les coutures » |
| Lise | Couture | corrige un ourlet par principe ; compte les coutures depuis sa fenêtre |
| Bertin | Cuisine | gourmand qui ne loue jamais (« ce n'est pas dégoûtant ») ; cherche le goût de la soupe de sa grand-mère |
| Évariste | Alchimie | classe les fioles par couleur, puis par odeur, puis abandonne ; a mis de la brume en bouteille |
| Sidonie | Joaillerie | garde une bague « pour l'étalage » ; écrit à l'encre rouge les choses vraies |
| Ilian | Enchantement | précis jusqu'à l'angoisse ; cherche l'encre que la Marée n'efface pas |
| Capucine | Artificerie | tout ce qui tourne peut tourner mieux ; a apprivoisé Gaspard, le rabot des Lointains |
| Gautier | Construction | rêve d'un mur sans histoire ; grave les noms là où personne ne les voit |
| Ombeline | Exploration | aime se perdre ; garde un coin blanc sur la carte pour toi |

### 6.2 Figures du bourg [Canon]

Le plus vieux de la Taupinière ; le courrier qui perd son chapeau ; le bourgmestre et sa fiancée ; les novices du Cercle ; les veilleurs de la digue ; les bergers de la lande ; **Gaspard**, le rabot apprivoisé. À réutiliser : un monde se tient par ses personnages qui reviennent.

## 7. Les trois classes face à la Marée [Proposé : un fil thématique]

Les trois classes existent déjà (Runiste, Forgefeu, Traqueur). Le lore peut leur donner une raison d'être, qui colle à leurs mécaniques :

| Classe | Ce que la Marée fait | Ce que la classe lui oppose | Déjà dans le jeu |
|---|---|---|---|
| **Forgefeu** | elle **éteint les feux** | il **garde le feu** : il chauffe, trempe, frappe avec un métal chauffé à blanc | les Braises, la Trempe ; Brunhild et les Forges éteintes |
| **Runiste** | elle **fait oublier** | il **écrit** : une rune lue, une rune écrite, une phrase qui reste | la phrase runique (Trait, Cercle, Sceau) ; le Cercle des runes ; « l'encre qui reste » |
| **Traqueur** | elle **déplace les routes et emporte** | il **retrouve** : il lit les traces, repère, poursuit | la Proie et l'Angle mort ; Brenna, les traces sans bête |

Conséquence pour l'écriture : chaque classe a une phrase de bienvenue qui dit cela, et ses ultimes portent ce sens (La Grande Trempe rallume, La Phrase souveraine fixe, La Grande Battue ramène).

## 8. Les grands motifs [Canon, rassemblés]

- **Le feu contre la brume** : les forges éteintes, les lanternes qui ne s'éteignent jamais, la digue qu'on éclaire.
- **La mémoire et l'oubli** : les archives noyées, le Notaire, les liants de mémoire, la soupe sans recette, la chanson oubliée qui revient.
- **Le travail sans personne** : le marteau qui frappe seul, l'établi mal luné, le rabot de Gaspard. Les Lointains se souviennent de leurs gestes, pas de ceux qui les faisaient.
- **Les serments** : le Bastion, ses gardiennes au sceau, ses trois portes.
- **Le sel** : la brume est salée, l'encre du Notaire aussi, les champs du bas sont salés.
- **Les lanternes** : âmes qui rentrent, phares de la digue, Ville-lanterne. **À doser** : le mot est déjà partout (poissons, lys, potions, Marée) ; le réserver désormais à ce qui a du sens.

## 9. Rendre le lore suivable [Proposé]

Le joueur d'un jeu idle ne lit pas de longs textes ; il faut que l'histoire **vienne à lui, par petits morceaux, en jouant**.

1. **Le Registre du Notaire, un fil rouge.** Le Notaire des marées tient le registre de tout ce que la Marée a pris. **Chaque gardien vaincu pour la première fois rend une page** (douze zones, douze pages ; une de plus par saison). Une page = trois ou quatre phrases, une trouvaille, un nom. Réunies, elles racontent la Grande Marée. Un **Carnet** dans la salle Personnage les garde.
2. **Le Panneau raconte le monde.** Des annonces courtes mêlées au fil du serveur : « On a revu Mère Grise au lavoir », « La Vigie a fait un pas cette nuit ». Une ligne, jamais plus.
3. **Les maîtres font le lien.** Leurs commandes du 90 parlent déjà de la Grande Marée ; un maître peut citer une page du Registre que le joueur vient de trouver.
4. **Les saisons font avancer l'histoire.** Chaque saison, la Marée monte plus haut et ajoute une page, une créature, un lieu ; la Grande Marée de fin de saison en est le point d'orgue.
5. **Ne jamais tout dire.** Une révélation par saison au plus ; les grandes questions (§3.3) restent ouvertes longtemps.

Ce que le jeu montre déjà : la description de chaque zone (Combat), les histoires des maîtres (salle du métier), les visages de la Marée (sa fenêtre), les titres. Ce qui manque pour le §9 : le Carnet, les pages, des annonces de lore sur le Panneau.

## 10. La vérité derrière la Marée [Secret, proposé, à valider par Louis]

Une proposition, qui répond aux quatre mystères sans tuer la poésie :

- **La Grande Marée est un oubli voulu.** Il y a deux générations, les gens des Lointains ont prêté **un serment** : oublier une perte trop lourde (une ville, une guerre, un enfant, on ne sait pas). Ce serment a pris corps : la brume. Elle efface depuis ce qui ressemble à ce qu'on a voulu oublier.
- **Le Bastion des longues veilles garde la fin du serment** : la dernière phrase, celle qui permettrait de l'achever. Ses gardiennes au sceau sont les témoins, devenus pierre à force d'attendre.
- **Le Notaire des marées tient le registre de tout ce qui a été pris** : il ne signe qu'à marée haute, parce que c'est là qu'il reçoit. Son registre est le fil rouge (§9).
- **Les lanternes sont les souvenirs qui rentrent** : chaque soir, quelques-uns reviennent vers ceux qui pensent encore à eux. C'est pour cela qu'il faut les protéger.
- **La Marée remonte chaque soir** parce que le serment n'est pas fini : chaque nuit, elle cherche la dernière phrase.
- **Les outils qui travaillent seuls** se souviennent de leurs gestes, pas de ceux qui les faisaient : la brume a pris les gens, pas le travail.
- **La Cicatrice des trois vents** est l'endroit où le serment a été prononcé ; le Régent des courants en porte la couronne.

Pourquoi elle fonctionne pour le jeu : elle rend les trois classes nécessaires (§7 : rallumer, écrire, retrouver), elle donne un but à long terme sans boss final (finir le serment, ou choisir de ne pas le faire), et elle laisse de la place aux saisons. **Alternatives possibles** si Louis préfère : la Marée comme un être (une mer qui rêve), ou comme une erreur des runistes d'autrefois (une rune d'oubli mal tracée, ce qui donnerait au Cercle un passé coupable).

## 11. Incohérences relevées

| Incohérence | Où | Ce qui a été fait |
|---|---|---|
| Un « capitaine » et des « cavaliers » au Bastion, alors que c'est une forteresse abandonnée des Lointains | commandes Forge 80, Tannerie 60 | **Corrigé** : la garde du bourg et son capitaine (« Créancier du capitaine », « Les selles de la garde ») |
| Le « chapitre des runistes » à côté du « Cercle des runes » | commande Couture 60 | **Corrigé** : le Cercle partout |
| Brunhild appelée « Maître » alors que ses histoires disent « elle » | maîtres, commandes PNJ | **Corrigé** (passe éditoriale) : Maîtresse Brunhild |
| Des rois et des nains, absents du monde | commandes Forge 80, Cuisine 80, Minage 80 | **Corrigé** (passe éditoriale) |
| La Veille des Géants montre aujourd'hui **le Gardien des trois portes** en géant, alors que le lore nomme trois géants (le Porte-Fanal, la Veuve de cuivre, le Grand Arpenteur) | fenêtre de la Marée en direct | **À faire** : dessiner les trois géants, ou décider que le Gardien en est un |
| « Linge qui sèche depuis cent ans » quand la Grande Marée date de deux générations | `le-monde.md` §1.2 | Lu comme une exagération des gens du bourg ; à reformuler si on fixe la date (§3.2) |
| Le mot « lanterne » partout (poissons, lys, potion, soupe, Marée, phares, Ville-lanterne) | données | **À doser** pour les futurs objets (§8) |
| « Village » pour l'ensemble des bâtiments d'un clan, alors que Bramo est un bourg | `buildings.yaml` | Acceptable (c'est le village du clan, dans le bourg) ; à garder distinct |

## 12. Glossaire

| Mot | Sens |
|---|---|
| **La Grande Marée** | la catastrophe, il y a deux générations [Proposé] |
| **La Marée** (du soir) | la brume qui remonte chaque soir jusqu'à la digue [Canon] |
| **Les Lointains** | les terres laissées par la Grande Marée [Canon] |
| **La digue** | la limite du bourg, qu'on tient chaque soir [Canon] |
| **Vestige** | la matière propre à une région, qui sert à ses ensembles et à ses gemmes [Canon] |
| **Éclats de marée** | ce que rapporte la Marée du soir ; ils achètent des apparences [Canon] |
| **Le Panneau** | le tableau du bourg : nouvelles, contrats, fil du serveur [Canon] |
| **Le Renom** | l'histoire d'un clan, qui ne baisse jamais [Canon] |
| **L'Arrière-pays** | ce qu'il y a derrière Bramo, loin de la Marée [Proposé] |
| **Le Registre** | le registre du Notaire, fil rouge du lore [Proposé] |
