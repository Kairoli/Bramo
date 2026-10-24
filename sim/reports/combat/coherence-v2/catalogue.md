# Catalogue du build (proposition coherence-v2)

> Généré par `pnpm --filter @bramo/sim sim combat-build --step catalogue` depuis `sim/proposals/coherence-v2/`. Ne pas modifier à la main.

## Les huit réserves

| Réserve | Plafond | Ce que c’est |
|---|---|---|
| **Tisons** | 10 | Des braises qui couvent sous la peau de la cible. On les gagne en frappant ce qui brûle ; on les fait éclater d'un coup. |
| **Entailles** | 10 | Chaque critique laisse une marque. On les garde pour la fin, quand la cible vacille. |
| **Frimas** | 10 | Le froid qui s'accumule quand on retient l'ennemi. Il dégèle en dégâts ou en carapace. |
| **Rancœur** | 10 | Chaque coup encaissé, on s'en souvient. On le rend au centuple, ou presque. |
| **Ferveur** | 10 | La chaleur des coups de main donnés. Elle se rend en soins ou en éclats lumineux. |
| **Mesure** | 10 | Le tempo des attaques de base. Un musicien sait quand placer le grand accord. |
| **Échos** | 10 | Ce qui reste d'un sort quand on en enchaîne un autre. À force, ça résonne. |
| **Trophées** | 6 | Une collection de petits souvenirs, un par ennemi vaincu. Ça motive. |

## Gemmes majeures (34)

Une gemme occupe une des quatre places de talent (arme, torse, coiffe, collier). « Remplit » : elle donne des charges ; « dépense » : elle les utilise (seule, elle ne fait rien) ; « amplifie » : plafond ou dégâts ; « relie » : elle convertit une réserve en une autre.

### Tisons

| Gemme | Rôle | Effet |
|---|---|---|
| **L'Allume-Feu** | remplit | Frapper une cible qui brûle donne 1 Tison. Toutes les 8 s, ta prochaine compétence met le feu (0,20 P sur 6 s). |
| **Le Feu aux poudres** | dépense | Une compétence de cooldown de 10 s ou plus fait éclater tes Tisons : 0,19 P chacun sur la cible, 0,08 P sur un voisin (délai 8 s, 3 Tisons au moins). |
| **Le Petit Bois** | amplifie | +5 Tisons au plafond. Tes brûlures et saignements durent 15 % plus longtemps. |
| **Les Cendres tièdes** | relie | Chaque Tison gagné donne aussi une demi-Ferveur. Tes afflictions font 5 % de dégâts en plus. (Le feu de camp qui réchauffe les copains.) |

### Entailles

| Gemme | Rôle | Effet |
|---|---|---|
| **Le Fil du rasoir** | remplit | Un critique donne 2 Entailles ; frapper une cible qui saigne en donne 1 (toutes les 3 s au plus). |
| **Le Coup de grâce** | dépense | Contre une cible sous 40 % de ses PV, ta compétence dépense tes Entailles : 0,19 P chacune (délai 5 s). |
| **Rouge vif** | amplifie | +0,7 point de critique par Entaille. Un critique fait saigner (0,20 P sur 6 s, délai 8 s). |
| **Le Barbier** | relie | Un ennemi vaincu donne 3 Entailles et 1 Trophée : on garde la main pour le suivant. |

### Frimas

| Gemme | Rôle | Effet |
|---|---|---|
| **Le Souffle polaire** | remplit | Une action directe ralentit de 10 % pendant 2 s (délai 6 s). Une action de classe qui contrôle donne 2 Frimas. |
| **Le Dégel brutal** | dépense | À 6 Frimas ou plus, ton prochain contrôle les fait éclater : 0,19 P chacun (délai 6 s). |
| **Cœur de glace** | dépense | Sous 50 % de PV, ton Frimas devient une carapace : 0,25 P de bouclier par Frimas (délai 15 s). |
| **Les Engelures** | amplifie | +8 % de dégâts directs contre une cible ralentie ou étourdie. Tes ralentissements durent 20 % plus longtemps. |

### Rancœur

| Gemme | Rôle | Effet |
|---|---|---|
| **La Rancune tenace** | remplit | Chaque coup qui te coûte des PV donne 1 Rancœur. Sous 50 % de PV, ça en donne 2. |
| **Retour à l'envoyeur** | dépense | À 8 Rancœur, le coup suivant que tu encaisses la renvoie à son auteur : 0,26 P chacune (délai 8 s). Si un bouclier vient de se briser, pas besoin d'attendre 8 : 3 suffisent. |
| **La Peau de vieux cuir** | amplifie | +5 Rancœur au plafond. Après une compétence de bouclier, protège-toi de 0,04 P par Rancœur (délai 10 s). |
| **Le Mauvais Perdant** | relie | Chaque Rancœur gagnée donne aussi une Mesure : on se venge à coups de poing. Attaques de base +5 %. |

### Ferveur

| Gemme | Rôle | Effet |
|---|---|---|
| **La Main tendue** | remplit | Un soin ou un bouclier de compétence donne 2 Ferveur, et te protège de 0,14 P (délai 10 s). Une attaque de base en donne 1 toutes les 10 s : la ferveur vient aussi en tapant. |
| **La Grâce oblique** | dépense | À 6 Ferveur ou plus, ta prochaine action directe la libère en lumière : 0,28 P par Ferveur (délai 8 s). |
| **L'Auréole de travers** | dépense | Toutes les 12 s, ta Ferveur soigne l'allié le plus mal en point : 0,05 P par Ferveur. |
| **La Bonne Conscience** | amplifie | Soins et boucliers produits +8 %. +3 Ferveur au plafond. |

### Mesure

| Gemme | Rôle | Effet |
|---|---|---|
| **Le Métronome** | remplit | Chaque attaque de base donne 1 Mesure, 2 si tu n'as lancé aucune compétence depuis 2 s. |
| **Le Grand Accord** | dépense | Une compétence de cooldown de 16 s ou plus joue toute ta Mesure : 0,16 P chacune (5 Mesures au moins). |
| **Le Rythme cardiaque** | amplifie | +1,8 % de dégâts d'attaque de base par Mesure. |
| **Le Pas de deux** | relie | Chaque Mesure gagnée donne aussi un demi-Écho. Compétences +3 %. |

### Échos

| Gemme | Rôle | Effet |
|---|---|---|
| **Le Ricochet** | remplit | Deux compétences différentes à moins de 3 s d'intervalle donnent 1 Écho. |
| **Le Point d'orgue** | dépense | À 8 Échos, ta prochaine compétence les fait résonner : 0,14 P chacun sur la cible, 0,06 P sur un voisin (délai 8 s). |
| **Le Perroquet** | remplit | Une compétence qui lit la même rune que la précédente donne 2 Échos ; sinon, toute compétence en donne 1 toutes les 5 s. |
| **La Cacophonie** | amplifie | +4 Échos au plafond ; tes dépenses de réserve font 8 % de plus. |

### Trophées

| Gemme | Rôle | Effet |
|---|---|---|
| **Le Collectionneur** | remplit | Un ennemi vaincu donne 3 Trophées ; une action sur un renfort, 1 toutes les 3 s. Un gros morceau compte aussi : la première fois que ta cible passe sous 75, 50 puis 25 % de ses PV, 1 Trophée (un bout de corne, une écaille…). |
| **La Vitrine** | dépense | +7 % de dégâts directs par Trophée : tant qu'on les regarde, on se sent pousser des ailes. |
| **Le Taxidermiste** | dépense | Toutes les 12 s, empaille tes Trophées en bouclier : 0,35 P chacun ; il en garde la moitié. |

### Utilitaires

| Gemme | Rôle | Effet |
|---|---|---|
| **Le Bastion d'opérette** | utilitaire | Au début du combat, un bouclier de 0,8 P pendant 10 s. Ça ne tient pas longtemps, mais ça fait de l'effet. |
| **La Dernière Étincelle** | utilitaire | Sous 40 % de PV, ta prochaine compétence te protège de 0,55 P pendant 6 s (délai 20 s). |
| **L'Œil du chasseur** | utilitaire | Ta première action marque la cible 8 s (délai 10 s) ; contre une cible marquée, critique +5 points. |

## Ensembles (15)

Deux étages : 2 et 3 pièces nourrissent un style (une réserve) ; 4 pièces répondent à une mécanique ennemie (sans effet ailleurs). Les ensembles de classe ont à la place un 4 pièces qui tord la mécanique de la classe.

| Ensemble | Réponse (4 pièces) | 2 / 3 / 4 pièces | Pièces |
|---|---|---|---|
| **Les Heures creuses** | fenêtres (Interstice) | 2 : attaques de base +1 Mesure.<br>3 : +5 Mesures au plafond.<br>4 : Interstice — stocke une part des dégâts perdus hors fenêtre et la rend à l'ouverture. | Coiffe de la dernière seconde, Manteau des heures creuses, Gants du contretemps, Ceinturon du bon moment |
| **Le Sablier fêlé** | fenêtres (Interstice) | 2 : deux compétences différentes à la suite donnent 1 Écho.<br>3 : +4 Échos au plafond.<br>4 : Interstice. | Chapeau du temps perdu, Tunique à retardement, Mitaines du « tout de suite », Bottes « encore cinq minutes » |
| **Les Habits de pluie** | érosion (Pluie) | 2 : un soin ou un bouclier de compétence donne 1 Ferveur.<br>3 : soins et boucliers +6 %.<br>4 : Pluie — retire des charges d'érosion. | Capuche qui goutte, Ciré du Fossé gris, Gants de lavandière, Bottes en caoutchouc de la Guilde |
| **Le Ciré du Gué** | érosion (Pluie) | 2 : un contrôle donne 1 Frimas.<br>3 : +3 Frimas au plafond ; ralentissements +20 % de durée.<br>4 : Pluie. | Bonnet de pêcheur mouillé, Vareuse du Gué des plaies, Gants de goudron, Waders de la passe |
| **L'Enclume patiente** | coups lourds (Impact) | 2 : chaque coup encaissé donne 1 Rancœur.<br>3 : +4 Rancœur au plafond ; boucliers +6 %.<br>4 : Impact — les coups lourds et les charges frappent beaucoup moins fort. | Heaume « Même pas mal », Plastron de l'enclume, Gantelets de l'apprenti battu, Jambières du tas de ferraille |
| **Les Fondeurs sourds** | coups lourds (Impact) | 2 : une compétence de cooldown de 14 s ou plus allume 2 Tisons.<br>3 : afflictions +6 %.<br>4 : Impact. | Casque bouché à la cire, Tablier des Fondeurs, Gants « Hein ? », Bottes de coulée |
| **Les Passeurs de braise** | renforts (Battue) | 2 : à la mort d'une cible, tes afflictions passent sur un voisin.<br>3 : +4 Tisons au plafond.<br>4 : Battue — dégâts accrus contre les renforts. | Capuche des Passeurs, Pourpoint charbonneux, Gants de relais, Ceinture à mèches |
| **La Meute du dimanche** | renforts (Battue) | 2 : un ennemi vaincu donne 2 Trophées.<br>3 : +2 Trophées au plafond ; +6 % contre les renforts.<br>4 : Battue. | Chapeau de battue à plume, Gilet à poches pleines, Gants de rabatteur, Guêtres du dimanche |
| **Les Mains de traverse** | gardes (Fracture) | 2 : Pression +10 % ; un contrôle donne 1 Frimas.<br>3 : +6 % contre une cible ralentie ou étourdie.<br>4 : Fracture — tes coups percent les gardes deux fois plus vite. | Calotte du crocheteur, Cotte « pas vu, pas pris », Gants de traverse, Ceinture à pinces |
| **Le Pied-de-biche** | gardes (Fracture) | 2 : un critique donne 1 Entaille.<br>3 : critique +3 points.<br>4 : Fracture. | Casque cabossé du cambrioleur, Brigandine à leviers, Gants de serrurier, Bottes à semelles de crowbar |
| **Les Veilleurs du sceau** | aura (Reprise) | 2 : un soin ou un bouclier de compétence donne 1 Ferveur.<br>3 : +4 Ferveur au plafond.<br>4 : Reprise — une part de l'aura encaissée revient en soin. | Capuchon du veilleur, Robe des nuits blanches, Mitaines de la ronde, Lanterne de ceinture |
| **Le Tablier de suie** | aura (Reprise) | 2 : chaque coup encaissé donne 1 Rancœur.<br>3 : Défense +8 % de score.<br>4 : Reprise. | Bandeau noirci, Tablier de suie, Moufles de fournier, Sabots du four |
| **Le Fer du second feu** | classe : forgefire | 2 : les Chauffes allument 1 Tison.<br>3 : +1 Braise au plafond.<br>4 : une Trempe qui dépense 2 Braises ou plus en rend 1 (délai 8 s). | Heaume du second feu, Cuirasse à soufflet, Gantelets de recuit, Grèves de la reprise |
| **La Battue silencieuse** | classe : tracker | 2 : l'Angle mort dure 2 s de plus.<br>3 : un Angle exploité donne 2 Entailles.<br>4 : exploiter un Angle frappe aussi un voisin (0,35 P) ; seul, ta prochaine attaque de base gagne 0,25 P (délai 8 s). | Capuche de feuilles, Veste de l'affût, Gants de silence, Bottes de mousse |
| **La Phrase inachevée** | classe : runist | 2 : changer de forme de rune donne 1 Écho.<br>3 : valeur des runes +10 %.<br>4 : une phrase A–B–A prépare 0,40 P et 0,25 P de bouclier pour le sort suivant (délai 10 s). | Bonnet à points de suspension, Robe du « et ensuite ? », Gants de la virgule, Ceinture du tiret |

## Objets nommés (12)

Légendaires, non fabricables (butin, garantie, marché). Un nommé occupe une place de talent ; il tord une règle.

| Objet | Surnom | Classe | Où le trouver | Effet |
|---|---|---|---|---|
| **Le Marteau des griefs** | « Tonton Rancune » | forgefire | Le Veilleur de four (Forges éteintes) | Tes Trempes rendent la Rancœur : 0,22 P chacune. +5 Rancœur au plafond. Les coups reçus en donnent comme d'habitude, pas la peine de les chercher. |
| **La Forge portative** | « La Bouilloire » | forgefire | Le Contremaître rouge (Forges éteintes) | +1 Braise au plafond (4 au lieu de 3). Une Trempe qui dépense 4 Braises allume 3 Tisons. |
| **L'Arc des Ronceraies** | « Ronchon » | tracker | Le Cerf de braise (Lisière des veilleurs) | Exploiter un Angle donne 3 Entailles. L'Angle mort dure 2 s de plus. |
| **La Ponctuelle** | « L'Horloge » | tracker | La Cloche de fer (Forges éteintes) | Chaque Repérage donne 2 Mesures. Attaques de base +10 %. L'arbalète ne rate jamais un train. |
| **Le Dernier Avertissement** | « Le Rabâcheur » | runist | Le Témoin sous l'eau (Archives englouties) | La même compétence deux fois en 14 s : 3 Échos, et ton prochain sort rejoue la rune qu'il lit (délai 10 s). |
| **Le Sceau qui tient** | « La Nounou » | runist | L'Intendant de verre (Bastion des longues veilles) | Un bouclier de compétence qui expire avec un reste donne 3 Ferveur et soigne de 0,20 P. |
| **Le Bénéfice du doute** | « Peut-être » | collier, toutes classes | Le Chantre muet (Archives englouties) | Un contrôle donne 2 Frimas et te protège de 0,25 P (délai 8 s). |
| **Le Petit Arrangement** | « Entre nous » | collier, toutes classes | Le Collecteur du bourbier (Abords du bourg) | Chaque fois que tu gagnes de la Rancœur, tu gagnes autant de Ferveur. Il en faut une autre source : ce collier n'en crée pas. |
| **Le Mauvais Présage** | « Le Corbeau » | collier, toutes classes | La Sentinelle fendue (Cicatrice des trois vents) | Une Rupture que tu provoques donne 4 Entailles et 4 Frimas. |
| **Le Sac sans fond** | « Le Grenier » | collier, toutes classes | Le Régent des courants (Cicatrice des trois vents) | +4 au plafond de toutes tes réserves (+2 Trophées). On ne jette rien, ça peut servir. |
| **Les Heures supplémentaires** | « L'Insomniaque » | collier, toutes classes | Le Héraut des trois vents (Cicatrice des trois vents) | Tes dépenses ne vident que la moitié de la réserve. Le reste, c'est pour demain… enfin, pour le coup d'après. |
| **Le Fil du retour** | « Le Yo-yo » | collier, toutes classes | Le Porte-serment de la meute (Bastion des longues veilles) | Un ennemi vaincu te soigne de 0,40 P et donne 3 Échos. Ça repart toujours. |

## Lignes aléatoires par emplacement

Plage au palier 1 (× 1,12 par palier). Les plafonds de réserve sont en charges.

- **Coiffe** : Critique 1-1 · Défense 0-1 · Vitalité 1-2 · Durée des afflictions 3-6 · Pression 3-6 · Échos au plafond 1-2 · Frimas au plafond 1-2 · Compétences 1-1
- **Torse** : Vitalité 1-2 · Défense 0-1 · Puissance des boucliers 2-4 · Puissance des soins 2-4 · Rancœur au plafond 1-2 · Ferveur au plafond 1-2 · Durée des ralentissements 4-8 · Puissance 1-1
- **Gants** : Cadence 1-1 · Critique 1-1 · Dégâts critiques 1-2 · Attaques de base 1-2 · Entailles au plafond 1-2 · Mesure au plafond 1-2 · Compétences 1-1 · Dégâts des afflictions 2-4
- **Jambes** : Vitalité 1-2 · Défense 0-1 · Rancœur au plafond 1-2 · Frimas au plafond 1-2 · Puissance des boucliers 2-4 · Durée des afflictions 3-6 · Pression 3-6 · Puissance 1-1
- **Bottes** : Cadence 1-1 · Vitalité 1-2 · Mesure au plafond 1-2 · Durée des ralentissements 4-8 · Attaques de base 1-2 · Trophées au plafond 1-1 · Critique 0-1 · Échos au plafond 1-2
- **Cape** : Défense 0-1 · Puissance des soins 2-4 · Ferveur au plafond 1-2 · Durée des afflictions 3-6 · Tisons au plafond 1-2 · Dépenses de réserve 2-4 · Vitalité 1-2 · Pression 3-6
- **Ceinture** : Vitalité 1-2 · Cadence 1-1 · Tisons au plafond 1-2 · Trophées au plafond 1-1 · Puissance des boucliers 2-4 · Dépenses de réserve 2-4 · Défense 0-1 · Attaques de base 1-2
- **Collier** : Critique 1-1 · Dégâts critiques 1-2 · Dépenses de réserve 2-4 · Échos au plafond 1-2 · Entailles au plafond 1-2 · Puissance des soins 2-4 · Puissance 1-1 · Compétences 1-1
- **Anneau** : Critique 1-1 · Cadence 1-1 · Puissance 1-1 · Dégâts des afflictions 2-4 · Dépenses de réserve 2-4 · Entailles au plafond 1-2 · Tisons au plafond 1-2 · Mesure au plafond 1-2
- **Arme** : Puissance 1-2 · Dégâts critiques 1-2 · Cadence 1-1 · Compétences 1-2 · Attaques de base 1-2 · Dégâts des afflictions 2-4 · Dépenses de réserve 2-4 · Critique 1-1
