# Le build, le butin et le contenu : la refonte

> **Statut** : refonte proposée par Claude le 22 octobre 2026, à la demande de Louis (« fais ce qu'il faut pour que tout fasse sens et soit intéressant ; des talents originaux ; un aspect looter ; tout n'est que prototype »). Fait suite à [`coherence.md`](coherence.md). **Rien n'est adopté** : tout vit dans `sim/proposals/coherence-v2/`, `coherence-zones-v2/` et `coherence-bosses-v1/`, mesuré dans le moteur du jeu. Les choix que j'ai faits à ta place sont listés au §8, à valider.

**En bref** :
- **Le build est une petite machine autour de huit réserves** (Tisons, Entailles, Frimas, Rancœur, Ferveur, Mesure, Échos, Trophées) : des objets les remplissent, d'autres les dépensent, d'autres les relient. Une pièce seule ne fait presque rien, deux qui vont ensemble font beaucoup.
- **34 gemmes, 15 ensembles, 12 objets nommés à surnom**, tous nouveaux ; les ensembles ont **deux étages** (2 et 3 pièces = un style, 4 pièces = la réponse à une mécanique de zone).
- **Mesuré dans le moteur** : six archétypes différents en tête pour neuf voies ; un build pensé va **14 à 27 % plus vite** qu'un build fait au hasard ; au mur, le bon 4 pièces vaut **0,9 à 1,8 palier** ; devant un gardien, on choisit entre garder son style et empiler deux réponses.
- **Le meilleur build ouvre des choses** : profondeur (meilleur butin, pas plus de butin), exploits du bestiaire, nom du build au Panneau du bourg.
- **Le contenu** : six régions à deux familles, six gardiens mesurés, des donjons, trois géants, des Routes franches et des mutations de saison qui tordent les réserves.
- **À toi** : relire les noms (§8, point 3) et trancher les choix du §8.

## 1. Le principe, en simple

**Un build, c'est une petite machine.** Certaines pièces la **remplissent**, d'autres la font **tourner**, d'autres la **vident d'un coup**. Le joueur assemble sa machine avec quatre gemmes, ses ensembles, un objet nommé et les bonnes lignes sur son équipement.

La machine tourne autour de **huit réserves** (des jauges vides au début de chaque combat) :

| Réserve | On la remplit en… | On la vide en… | Le style |
|---|---|---|---|
| **Tisons** | frappant ce qui brûle | faisant éclater la cible (et ses voisins) | le pyromane patient |
| **Entailles** | critiquant, frappant ce qui saigne | achevant une cible sous 40 % de ses PV | le boucher précis |
| **Frimas** | contrôlant (ralentir, étourdir, Rupture) | dégelant d'un coup, ou en carapace | le geôlier |
| **Rancœur** | encaissant des coups | les renvoyant à leur auteur | le vieux bougon |
| **Ferveur** | soignant, protégeant (et un peu en tapant) | lumière qui frappe, ou soin de groupe | le bon samaritain |
| **Mesure** | attaques de base | un grand accord sur une compétence lente | le métronome |
| **Échos** | enchaînant des sorts différents | une résonance qui touche aussi un voisin | le bavard |
| **Trophées** | tuant (renforts surtout) | dégâts qui grandissent, ou empaillés en bouclier | le collectionneur |

Ce qui crée la réflexion (le « theorycraft ») :
- **Une gemme qui dépense ne fait rien seule.** Il faut lui trouver de quoi se remplir : une gemme, un ensemble, un nommé, ou la mécanique de sa classe.
- **Des passerelles relient les réserves** : *Les Cendres tièdes* (chaque Tison donne aussi de la Ferveur), *Le Mauvais Perdant* (Rancœur → Mesure), *Le Petit Arrangement* (Rancœur → Ferveur)… On peut faire un tank qui soigne en encaissant, un pyromane qui protège ses alliés.
- **Les classes ont leurs propres entrées** : un nommé ou un ensemble branche les Braises du Forgefeu sur les Tisons, l'Angle du Traqueur sur les Entailles, les runes répétées du Runiste sur les Échos.
- **Le butin compte** : une ligne « +2 Tisons au plafond » ne vaut rien à un build de Rancœur et beaucoup à un pyromane. Le bon jet dépend de ton build : c'est la chasse au loot.

## 2. Ce que porte un personnage

| Place | Combien | Ce que c'est |
|---|---|---|
| **Gemmes majeures** | 4 (arme, torse, coiffe, collier) | talents de build (34) ou réponses de situation (6) ; un **objet nommé** prend aussi une place |
| **Ensembles** | jusqu'à 10 pièces sur 11 emplacements | **deux étages** : 2 et 3 pièces nourrissent un style (une réserve) ; **4 pièces répondent à une mécanique ennemie** (coups lourds, renforts, gardes, fenêtres, érosion, aura), sans effet ailleurs ; 3 ensembles de classe ont un 4 pièces qui tord la classe |
| **Lignes aléatoires** | 0 à 4 par pièce | statistiques ou **lignes de build** (dégâts des afflictions, plafond d'une réserve, dépenses de réserve…) ; plus aucune ligne morte |
| **Préparation** | 1 | la réponse de situation la moins chère, avant le mur |
| **Plan** | 1 | les 5 sorts, l'ouverture, la cible prioritaire : un plan de farm, un plan de mur |

Le **dilemme** qui revient à chaque mur : *porter le 4 pièces de situation* (passer ce mur) **ou** *garder deux 3 pièces de style* (aller plus vite partout ailleurs) ; *mettre la gemme de situation* (garder ses ensembles) **ou** *garder sa quatrième gemme de build*.

Le catalogue complet, lisible, est généré depuis les données : [`sim/reports/combat/coherence-v2/catalogue.md`](../../../sim/reports/combat/coherence-v2/catalogue.md).

## 3. Comment j'ai mesuré, en simple

Tout se joue dans le **vrai moteur de combat** du jeu, avec les mêmes graines pour tous les builds (personne n'a de chance en plus).

- **Le témoin** : un personnage au palier 20, en équipement Rare, **sans aucun talent ni ligne**. C'est la référence « zéro ».
- **La vitesse** : combien de temps il faut pour gagner une rencontre au niveau normal. Un build à « +40 % » gagne ses combats 40 % plus vite que le témoin : c'est **le rendement quand on farme**.
- **Le mur** : on monte la difficulté jusqu'à ce que le build ne gagne plus 9 combats sur 10. Le résultat est en **paliers d'avance** : « +1 palier » veut dire « ce build passe ce mur comme s'il avait un palier d'équipement de plus » (un palier d'équipement = +12 % de Puissance et de PV).
- **Les builds** : pour chacune des 9 voies, les **8 archétypes** (un par réserve, construits comme le ferait un joueur qui a compris le principe) et **200 builds tirés au hasard** (ce que ferait un joueur qui équipe ce qu'il trouve).
- **Les 18 rencontres** : les six profils du banc, les douze zones de la route (dont celles refaites), et à part les **six gardiens** de région.
- **La façon de jouer** : chaque build garde sa meilleure façon de jouer (plan de farm, plan de groupe ou plan sûr, et la bonne cible prioritaire), comme un joueur qui règle son plan.

## 4. Ce que ça donne

Rapports bruts : [`build.md`](../../../sim/reports/combat/coherence-v2/build.md) (vitesse, murs, butin) et [`situation.md`](../../../sim/reports/combat/coherence-v2/situation.md) (au mur, gardiens compris). Chiffres du dernier banc, **avec le Traqueur réparé, les armes égalisées et le catalogue des dix paliers** ([`classes.md`](classes.md), [`../contenu/butin-et-recettes.md`](../contenu/butin-et-recettes.md) §1.3).

### 4.1 Il y a une méta, et elle change selon la voie et la zone

| Voie | Meilleur archétype | Vitesse | Mur (paliers) |
|---|---|---|---|
| Trempe-Rouge | Entailles | +30 % | 1,2 |
| Enclumier | Tisons | +38 % | 1,7 |
| Rémouleur | Tisons | +45 % | 1,9 |
| Tue-Bête | Entailles | +29 % | 1,0 |
| Piégeur | Entailles | +29 % | 1,0 |
| Meneur de meute | Ferveur | +33 % | 2,3 |
| Fulgurant | Échos | +28 % | 1,2 |
| Sigillaire | Frimas | +39 % | 1,6 |
| Glyphiste | Échos | +35 % | 1,4 |

(Vitesse et mur comparés au témoin **de la même voie** : le Tue-Bête gagne moins sur son témoin parce que son témoin est devenu bien plus fort.)

- **Cinq archétypes différents en tête pour neuf voies** (six avant le catalogue des dix paliers). Au premier essai, les Entailles gagnaient partout et les Échos aussi : je les ai recalés, puis relevé les Tisons, les Trophées et toutes les dépenses (trois passes, mesurées à chaque fois).
- **La zone change la réponse.** Dans l'Atelier des mauvais jours, le build Trophées est le plus rapide **pour les neuf voies** ; dans le Groupe compact, Rancœur (4 voies) et Trophées (3) ; ailleurs, trois à cinq archétypes se partagent la tête. C'est le « la zone pousse à adapter le build, jamais la classe ».
- **Pas un seul build gagnant** : par voie, 11 à 30 builds sur 224 sont à 10 % du meilleur. Il y a des façons meilleures que d'autres (la méta), mais plusieurs.

### 4.2 Le bon build est récompensé

| | Vitesse | Mur |
|---|---|---|
| Témoin + lignes de statistiques, sans talent | +8 à +23 % | 0,5 à 1,0 palier |
| **Build tiré au hasard (médiane)** | +6 à +17 % | 0,4 à 1,2 palier |
| **Meilleur build de la voie** | **+28 à +46 %** | **0,9 à 2,3 paliers** |

- **Un build pensé va 14 à 27 % plus vite qu'un build fait au hasard**, et passe les murs environ un demi-palier plus tôt. Équiper « ce qu'on trouve » vaut à peine mieux que rien : le theorycraft compte.
- **Ferveur, le build de mur** : le plus lent à farmer (+0 à +3 %), mais 2,0 à 2,5 paliers au mur (mesuré pour les cinq voies où il est le plus lent). **Sauf pour le Meneur de meute**, où il est à la fois le plus rapide et le plus solide (+33 %, 2,3 paliers) : à corriger (§4.5). On farme avec son build rapide, on change pour passer le mur : c'est un vrai choix, pas un piège.

### 4.3 Le butin compte

- Le même build **sans ligne** puis **avec des lignes alignées** sur lui : +3 à +18 % de vitesse. Avec des lignes au hasard : entre les deux. Une ligne de build (plafond de Tisons, dépenses…) ne vaut rien pour un autre build : **le bon jet dépend de ton build**, et le marché a de quoi vivre (ce qui est mauvais pour moi est bon pour toi).
- Les lignes de statistiques seules valent 0,5 à 1,0 palier pour un kit Rare entier : moins que le build, ce qui est voulu.

### 4.4 Au mur, la réponse de situation

Dans chaque zone, le build de farm de chaque voie prend **le 4 pièces de la famille** (et perd deux de ses petits ensembles de style), ou **la gemme de situation**, ou **la préparation** :

| | Paliers d'avance (médiane des voies, dans sa mécanique) |
|---|---|
| Ensemble 4 pièces | **0,9 à 1,8** (fenêtres 0,9 à 1,5, érosion 1,2 à 1,8, coups lourds 1,2, renforts 1,5, gardes 1,5, aura 1,2 à 1,5) |
| Gemme de situation | 0,3 à 1,2 |
| Préparation | 0,3 à 0,6 |

- L'ordre voulu tient partout : **ensemble > gemme > préparation**. Les deux zones « de plan » répondent autrement, comme prévu : la Chambre aux deux sceaux se gagne par la cible prioritaire (Fracture n'y apporte plus rien), l'Atelier par un build Trophées.
- **Les gardiens mêlent deux familles** : une seule réponse rapporte 0,9 à 1,8 palier, **les deux 4 pièces à la fois 0,9 à 2,4** (mieux pour 4 à 9 voies sur 9), mais il ne reste presque rien du style. Devant un gardien, on choisit : garder son build ou empiler les réponses.
- Les gardiens se battent au même mur que les zones de leur région pour le témoin (D 1,06 à 1,70) : un build moyen les passe, un bon build ou une bonne réponse les passe plus tôt.

### 4.5 Ce qui ne va pas encore

- ~~Le Traqueur et l'érosion~~ **Réparé** ([`classes.md`](classes.md)) : la réponse à l'érosion rapportait 4 paliers au Tue-Bête et au Piégeur ; avec une purification au niveau 20, plus que 0,9 à 1,8, comme les autres.
- **Le Traqueur est maintenant un peu trop fort** (depuis le catalogue des dix paliers, où son arc a gagné de la Puissance avec la règle des armes) : dans les deux zones à fenêtres, ses trois voies vont 30 à 40 % plus vite que les autres, et le **Meneur de meute en Ferveur** est à la fois le plus rapide de sa voie et le plus solide de tous (2,3 paliers ; jusqu'à 3,1 de mur absolu dans la Salle des échos, contre 2,2 pour les autres). **Deux réglages faits dans la proposition, pas encore mesurés** : l'affût de 0,5 à 0,35, et la Main tendue (le producteur de Ferveur) à 2 Ferveur par soin ou bouclier au lieu de 3, et 1 par attaque de base toutes les 10 s au lieu de 6. Les chiffres de ce §4 sont ceux d'avant ; à rejouer au banc.
- **Le Gué des plaies** reste la zone qui dépend le plus de sa réponse (érosion : 1,5 à 2,7 paliers selon la voie) : son érosion est à baisser d'un cran.
- **Les Heures creuses et le Sablier fêlé** reviennent dans beaucoup de meilleurs builds. C'est en partie un effet du banc (ce sont les ensembles « de complément » des archétypes), en partie parce qu'ils nourrissent Mesure et Échos, deux archétypes de tête. À surveiller.
- **La courbe d'équipement** (conversion v2, [`equipement.md`](../../../sim/reports/combat/coherence-v2/coherence-zones-v2/equipement.md)) : **un palier vaut bien ×1,09 de mur** (cible ×1,096) et **protecteur et offensif sont à égalité** (×0,95 et ×0,97 du mixte ; l'Atelier préfère le protecteur pour 6 voies sur 9). **Les raretés restent fausses** : Commun → Rare ×1,25 (2,5 paliers), Rare → Épique ×1,12, Épique → Légendaire ×0,92 (le Légendaire reste sous l'Épique). Ça vient des lignes fixes du catalogue (`data/gear.yaml`), pas de la conversion : c'est le choix 2 de [`coherence.md`](coherence.md) §5 (régénérer le catalogue depuis un budget par rareté, +0,5 palier par rang), toujours à trancher.

## 5. Pourquoi faire un meilleur build : les récompenses

Un meilleur build ne doit pas seulement « aller plus vite ». Il doit **ouvrir des choses**. Cinq récompenses, toutes bornées pour rester casu :

1. **Le rendement** : un build plus rapide fait plus de rencontres à l'heure, donc plus de butin (mesuré au §4).
2. **La profondeur** [Proposé par Claude] : chaque zone et chaque donjon ont des **profondeurs** choisies par le joueur ; chacune est un palier de difficulté de plus (×1,096) et rapporte un **butin de meilleure qualité**, pas plus abondant :

   | Profondeur | Difficulté | Ligne aléatoire en plus | Rare → Épique → Légendaire | Vestiges | Garantie de nommé |
   |---|---|---|---|---|---|
   | 0 | normale | — | table de base (55 / 30 / 13 / 2 %) | ×1 | 1 unité |
   | +1 à +5 | +1 palier chacune | +6 % de chance par profondeur | décalée de 2 points par profondeur vers le haut | +5 % par profondeur | +10 % par profondeur |
   | +6 à +10 | idem | idem | idem | idem | idem, plafond à +100 % |

   Le meilleur build d'une voie passe 1 à 2 paliers de plus que le témoin, et un demi à un palier de plus qu'un build fait au hasard (§4.2) : il farme une à deux profondeurs plus bas, soit **+6 à +12 % de chance de ligne en plus et +2 à +4 points de rareté**, et sa garantie de nommé avance 10 à 20 % plus vite. **Plafond** : profondeur +10, puis seulement des records et des cosmétiques. Le butin d'une profondeur reste celui du palier de la zone : un vieux contenu facile ne donne jamais du butin de haut palier.
3. **Les exploits du bestiaire** : chaque gardien a trois exploits (le vaincre en moins de N s, à profondeur +5, sans boire de potion). Récompenses : un titre, une **apparence d'objet** par emplacement (Louis aime l'apparence pièce par pièce), un **trophée de salon** pour l'atelier ou la halle du clan. Jamais de puissance.
4. **Le Panneau du bourg** : quand un joueur réussit un exploit ou un record de route, le fil du serveur l'annonce avec **le nom de son build** (« Pépin a vaincu la Lavandière en 41 s avec *Le Barbecue du dimanche* »). Les builds se partagent par une fiche : d'autres peuvent la copier. La reconnaissance est la récompense du theorycraft.
5. **La route et la saison** : les records de route permanents donnent les checkpoints (« un peu de tout », [Décidé par Louis]) ; la route saisonnière a son classement, cosmétique.

**Garde-fou casu** : la profondeur augmente la qualité, pas la quantité ; à présence égale, un build optimisé rapporte environ **1,3 à 1,5 fois** le butin d'un build fait au hasard (1,19 à 1,27 de vitesse, §4.2, fois la qualité d'une profondeur de plus). Avec l'écart de présence, il faudra vérifier que le total reste dans le ratio de 2 à 2,5 (`presence.md` §5), au simulateur de progression.

## 6. Le contenu

### 6.1 Une seule géographie

Six régions, chacune avec **deux familles de mécaniques**, **deux zones de la route** et **un gardien** qui mêle les deux. La région fournit le **vestige** des ensembles qui répondent à ses mécaniques, et ses gardiens portent les **objets nommés**.

| Région | Paliers | Familles | Zones de route | Gardien (`coherence-bosses-v1`) | Nommés qu'on y trouve | Vestige |
|---|---|---|---|---|---|---|
| **Les Abords du bourg** | 1-19 | fenêtres, érosion | 1 Chaussée des lanternes, 2 Fossés gris | **Mère Grise, la Lavandière du Puits** : elle essore son linge (on ne l'atteint vraiment que pendant l'essorage) et éclabousse d'eau de lessive | Le Petit Arrangement (Collecteur du bourbier) | Galets du puits |
| **Les Forges éteintes** | 20-39 | coups lourds, renforts | 3 Cour des trois coups, 4 Vergers de verre | **Le Contremaître rouge** : tous les trois coups il frappe comme une presse ; ses apprentis arrivent par deux et cognent dur | Le Marteau des griefs, La Forge portative, La Ponctuelle | Scorie de mémoire |
| **La Lisière des veilleurs** | 40 | gardes, aura | 5 Cloître des balances, 6 Fours de recuit | **La Matriarche de résine** : un cocon qui la rend furieuse tant qu'il tient, une sève qui colle à la peau | L'Arc des Ronceraies (Cerf de braise) | Ambre de veille |
| **Les Archives englouties** | 40 | fenêtres, érosion (plus serré) | 7 Salle des échos, 8 Gué des plaies | **Le Notaire des marées** : il ne signe qu'à marée haute, son encre salée ronge tout | Le Dernier Avertissement, Le Bénéfice du doute | Encre fossile |
| **Le Bastion des longues veilles** | 40 | gardes, coups lourds | 9 Chambre aux deux sceaux (zone de **plan** : la priorité de cible), 10 Terrasses de la vigie | **Le Gardien des trois portes** : trois coups, le troisième enfonce les portes ; derrière son pavois, il frappe deux fois plus fort | Le Sceau qui tient, Le Fil du retour | Éclat de serment |
| **La Cicatrice des trois vents** | 40 | renforts, aura | 11 Atelier des mauvais jours (zone de **plan**), 12 Belvédère des trois vents | **Le Régent des courants** : le vent écorche, chaque rafale apporte trois éclats vivants | Le Mauvais Présage, Le Sac sans fond, Les Heures supplémentaires | Quartz de faille |

Les quatre régions 40+ restent **horizontales** (dossier 1 §8) : on y entre au même palier, leurs profondeurs 60/80/90 renouvellent formations et butin.

### 6.2 Les donjons

Un par région, six salles (dossier 2 §9) : deux d'approche, deux intermédiaires, une **salle de combinaison** (les deux familles à la fois) et le **gardien**. Repos de 30 % entre les salles avec repas et potions (mesuré, `analyse.md` §3.3). **Le donjon est l'endroit où le build est le plus éprouvé** : un seul build pour six salles qui ne demandent pas la même chose. C'est là que les passerelles entre réserves et les ensembles « 3+3+2+2 » (beaucoup de styles, pas de réponse) brillent, et que les 4 pièces de situation se paient.

### 6.3 Les world boss : la Veille des Géants

Fenêtre de 72 h, assauts de 10 min, quatre canaux (combat, récolte, fabrication, logistique) au même plafond (dossier 2 §15, gardé). Chaque géant **change de famille à chaque phase**, donc aucun build ne passe tout l'assaut au mieux : on choisit sa phase, ou on prend un build polyvalent.

| Géant | Phases | Contribution de métiers |
|---|---|---|
| **Le Porte-Fanal** | coups lourds → fenêtres (sa lanterne s'ouvre) → aura de suie | balises (bois, verre, quincaillerie) |
| **La Veuve de cuivre** | renforts articulés → garde menaçante → renforts | cordages, outils de récupération |
| **Le Grand Arpenteur** | marche lourde (coups lourds) → souffle (érosion) → repos (fenêtres larges) | relevés, vivres, passages |

### 6.4 Le clan : les Routes franches

Gardées du dossier 2 §16 : une caravane de six étapes, préparée ensemble, résolue en différé. Ajout : **chaque étape est une famille de mécanique** (un pont à garde, un relais assiégé de renforts, un passage à érosion…), et la caravane emporte **les fiches de build** de ses membres : le clan choisit qui escorte quelle étape. Les artisans fournissent préparations et fournitures. Récompenses : décorations de halle, titres de clan, collection ; jamais de puissance.

### 6.5 Les mutations de saison : elles tordent les réserves

Une mutation change une règle de la route saisonnière (dossier 2 §14). Je propose qu'elle **touche une réserve**, pour secouer la méta à chaque saison sans rien enlever à personne :

| Saison | Règle positive | Contrainte |
|---|---|---|
| **Saison du Givre** | Frimas au plafond ×2 | les ennemis non ralentis frappent un peu plus fort |
| **Les Braises longues** | les Tisons ne se vident qu'à moitié | gardes ennemies plus épaisses |
| **Les Reflets** | la Rancœur se gagne aussi quand un bouclier absorbe | pics annoncés plus fréquents |
| **Le Temps creux** | Mesure +1 par attaque de base | fenêtres plus longues mais plus rares |
| **La Double trace** | chaque renfort tué donne 2 Trophées de plus | renforts plus solides |
| **Les Liens francs** | toutes les conversions entre réserves doublent | moins de PV rendus entre les salles |

## 7. Ce qui reste à faire, et les limites

- **Rien n'est dans `data/`.** Tout se recopie depuis les propositions quand tu valides : `talents.yaml` (nouveau fichier `data/combat/talents.yaml`), `gear_pools.yaml` (remplace les lignes aléatoires), `combat.yaml` (conversion des statistiques et outils), les zones et les gardiens.
- **Le jeu ne lit pas encore les talents** : le moteur les exécute (simulateur et tests), mais l'équipement réel du joueur ne porte ni gemmes ni réserves. Étapes : gemmes serties (Joaillerie), ensembles et lignes de build dans `data/gear.yaml` (le générateur `export_gear.mjs` existe), affichage des réserves dans la salle Combat (des jauges qui se remplissent pendant le combat : c'est aussi ce qui rend le build lisible).
- **Le moteur n'a pas de phases** : les géants de la Veille seront une suite de rencontres, et les donjons une suite de salles (déjà mesurée en `combat-dungeon`).
- **« Une fois par combat »** s'écrit aujourd'hui avec un délai de 999 s (Le Collectionneur) ; un vrai mot `once` serait plus propre.
- **Le Traqueur** : réparé à la demande de Louis (purification au niveau 20, dissipation, sorts de voie relevés, l'affût, armes égalisées), voir [`classes.md`](classes.md).
- **À vérifier avec le simulateur de progression** : le total « vitesse × qualité du butin × présence » dans le ratio casu de 2 à 2,5 (§5).
- **Le groupe** : les réserves sont par personnage ; les passerelles vers la Ferveur (soins de groupe) n'ont été mesurées qu'en solo. À rejouer avec `combat-dungeon-party`.

## 8. Les choix que j'ai faits à ta place (à valider)

Tu m'as dit « fais ce qu'il faut ». Voici ce que j'ai tranché, du plus structurant au plus cosmétique. **Ce sont des propositions, pas des décisions** ; chacune peut se défaire sans casser le reste.

1. **Les huit réserves comme colonne vertébrale du build.** Les talents ne sont plus des bonus isolés : ils remplissent, dépensent, amplifient ou relient une réserve. C'est ce qui fait que deux gemmes valent plus ensemble que séparées, et qu'un mauvais assemblage ne vaut presque rien.
2. **Les ensembles à deux étages**, et la fin des ensembles généralistes : le 2 et le 3 pièces font le style, le 4 pièces répond à une mécanique (et ne fait rien ailleurs). Les trois ensembles de classe tordent la classe à la place.
3. **Le catalogue** : 34 gemmes (dont 3 utilitaires), 15 ensembles, 12 nommés (deux armes par classe, six colliers qui tordent les règles des réserves). Tous les noms, textes et surnoms sont de moi : relis-les en premier, c'est là que la vibe se joue.
4. **Les lignes aléatoires** : chaque emplacement a des lignes de build (plafond d'une réserve, dépenses, afflictions…) et des statistiques ; les statistiques pures ont été baissées pour qu'un kit Rare vaille environ 0,7 palier, et que le build compte plus que le jet brut.
5. **Ferveur est le « build de mur »** : le plus lent à farmer, le plus solide au mur (mesures au §4). J'ai trouvé ça plus intéressant qu'un nerf qui la rendrait inutile ; à toi de dire si ce rôle te va.
6. **La profondeur** pour récompenser le meilleur build : qualité du butin, jamais quantité ; plafond +10.
7. **Les exploits du bestiaire, le nom du build au Panneau, les fiches de build partagées** : la reconnaissance comme récompense du theorycraft, rien qui donne de la puissance.
8. **La géographie** : six régions, leurs noms, leurs deux familles, leurs gardiens (Mère Grise, le Contremaître rouge, la Matriarche de résine, le Notaire des marées, le Gardien des trois portes, le Régent des courants) et où tombent les nommés.
9. **Les mutations de saison qui tordent une réserve**, les **trois géants à phases**, les **Routes franches à étapes de famille** : des pistes de contenu à faire écrire par GPT ([`message-gpt.md`](message-gpt.md)).
