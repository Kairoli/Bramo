# Simulation de serveur : 100 joueurs, 90 jours, composition « hoard », graine 4

Durée du calcul : 638 s. Extensions : Marée du soir.

## Progression (médianes par façon de jouer)

| Façon de jouer | n | j7 : classe · route · métier · or | j30 : classe · route · métier · or | j60 : classe · route · métier · or | j89 : classe · route · métier · or |
|---|---|---|---|---|---|
| Casu tranquille | 25 | 45 · 59 · 45 · 385 | 61 · 90 · 60 · 769 | 69 · 139 · 67 · 526 | 73 · 149 · 72 · 813 |
| Thésauriseur (ne vend rien) | 36 | 42 · 59 · 35 · 91 | 58 · 100 · 50.5 · 420 | 66 · 139 · 58 · 495 | 71 · 150 · 62 · 206 |
| Onglet oublié (ne touche à rien) | 24 | 43 · 54 · 45 · 298 | 59 · 89 · 60 · 1710 | 66.5 · 107 · 67 · 3523 | 73 · 109 · 72 · 4568 |
| Collectionneur (tous les métiers) | 15 | 45 · 59 · 30 · 227 | 61 · 138 · 46 · 429 | 69 · 154 · 53 · 541 | 74 · 169 · 58 · 371 |

## Jalons (jour médian depuis l’arrivée ; part des joueurs qui y arrivent)

- **casual** — route : étape 10 : 0 j (100 %), étape 30 : 2 j (100 %), étape 60 : 12 j (100 %), étape 90 : 28 j (100 %), étape 120 : 49 j (100 %), étape 150 : 56 j (20 %) ; classe : niv 30 : 2 j (100 %), niv 50 : 11 j (100 %), niv 75 : — j (0 %), niv 90 : — j (0 %) ; métier : niv 40 : 5 j (100 %), niv 60 : 30 j (100 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **hoarder** — route : étape 10 : 0 j (100 %), étape 30 : 3 j (100 %), étape 60 : 12 j (100 %), étape 90 : 18 j (97 %), étape 120 : 44 j (97 %), étape 150 : 63 j (47 %) ; classe : niv 30 : 3 j (100 %), niv 50 : 15 j (100 %), niv 75 : — j (0 %), niv 90 : — j (0 %) ; métier : niv 40 : 12.5 j (100 %), niv 60 : 65.5 j (61 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **afk** — route : étape 10 : 0 j (100 %), étape 30 : 2.5 j (100 %), étape 60 : 13.5 j (100 %), étape 90 : 35 j (79 %), étape 120 : 53 j (8 %), étape 150 : — j (0 %) ; classe : niv 30 : 2 j (100 %), niv 50 : 14 j (100 %), niv 75 : 89 j (13 %), niv 90 : — j (0 %) ; métier : niv 40 : 5 j (100 %), niv 60 : 29.5 j (100 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **collector** — route : étape 10 : 0 j (100 %), étape 30 : 2 j (100 %), étape 60 : 9 j (100 %), étape 90 : 18 j (100 %), étape 120 : 28 j (100 %), étape 150 : 52 j (87 %) ; classe : niv 30 : 2 j (100 %), niv 50 : 11 j (100 %), niv 75 : 89 j (7 %), niv 90 : — j (0 %) ; métier : niv 40 : 17 j (100 %), niv 60 : 85.5 j (13 %), niv 80 : — j (0 %), niv 99 : — j (0 %)

## Buts : qui n’avance plus ?

| Façon de jouer | route finie | route bloquée 14 j | plus rien n’avance depuis 14 j |
|---|---|---|---|
| casual | 0 % | 44 % | 0 % |
| hoarder | 0 % | 58 % | 0 % |
| afk | 0 % | 100 % | 0 % |
| collector | 0 % | 60 % | 0 % |

## Or

Robinets : commandes PNJ 475940, commandes du maître 210500 (total 686440, plus 10000 d’or de départ).
Puits : étal de la guilde 27150, taxe du marché 21253, bâtiments de clan 214947, réparations PNJ 38715, taxe de la vitrine 206 (total 302271).
Or par joueur : j0 100 · j7 399 · j14 770 · j21 1116 · j28 1270 · j35 1773 · j42 2079 · j49 2361 · j56 2666 · j63 2945 · j70 3256 · j77 3507 · j84 3752 · j89 3942. Gini 0.7.
Plus riches : collector 49765 (hunting/tanning/exploration/herbalism) ; casual 35486 (woodcutting) ; casual 24233 (woodcutting) ; collector 22344 (mining/jewelcrafting/construction/woodcutting) ; collector 17173 (hunting/artificing/construction/fishing).

## Marché

Indice des prix (100 = prix de référence), par semaine : 100.7 · 95.9 · 92.6 · 82.2 · 84.6 · 80.6 · 81.5 · 78.7 · 78.7 · 82.6 · 86.4 · 81.9 · 81.7.

| Objet | réf. | échangés | prix 1re sem. | prix dernière sem. |
|---|---|---|---|---|
| Bûche de pin | 2 | 47080 | 2 | 2 |
| Baume de parade | 12 | 4342 | 10.5 | 7 |
| Poussière de rune | 2 | 21497 | 2 | 1 |
| Minerai d'argent | 4 | 7361 | 4 | 2 |
| Thym | 3 | 9685 | 3 | 3 |
| Rouages de bronze | 3 | 9500 | 3 | 3 |
| Pierre runique | 3 | 5200 | 3 | 2 |
| Lingot d'argent | 12 | 1146 | 14 | 6 |
| Farine | 7 | 1960 | 8 | 8 |
| Lingot d'or | 19 | 701 | 20.8 | 10 |
| Charbon | 3 | 4388 | 3 | 2 |
| Fleur de givre | 8 | 1540 | 8.1 | 8 |
| Poisson frais | 2 | 5925 | 2 | 2 |
| Bûche de chêne | 3 | 3790 | 3 | 3 |
| Minerai de cuivre | 2 | 4800 | 1 | 1 |

Effondrés (sous 40 % de la référence) : aucun.
Envolés (au-dessus de 250 %) : aucun.

| Façon de jouer | ventes nettes | achats | commandes PNJ | or final |
|---|---|---|---|---|
| casual | 4383 | 997 | 2090 | 1151 |
| hoarder | 0 | 5472 | 6368 | 393 |
| afk | 0 | 0 | 2090 | 3703 |
| collector | 9719 | 9142 | 8805 | 356 |

## Objets sans débouché (produits, presque jamais utilisés)

Hampes de flèche (5760000 produits, 0 utilisés, 0 vendus, 5730000 en stock) ; Pointes de flèche en fer (3288720 produits, 0 utilisés, 0 vendus, 3288720 en stock) ; Venaison (3163149 produits, 152550 utilisés, 2427 vendus, 2890599 en stock) ; Plumes de faisan (2592000 produits, 0 utilisés, 0 vendus, 2492250 en stock) ; Brochet (1450210 produits, 14900 utilisés, 0 vendus, 1396349 en stock) ; Poisson-lanterne (1367428 produits, 7525 utilisés, 0 vendus, 1328106 en stock) ; Peau d'ours (1211503 produits, 10392 utilisés, 1236 vendus, 1109641 en stock) ; Bois de lune (987721 produits, 7155 utilisés, 210 vendus, 946886 en stock) ; Lanières de cuir (799640 produits, 10516 utilisés, 0 vendus, 767488 en stock) ; Fourrure de loup (712362 produits, 20024 utilisés, 1293 vendus, 579919 en stock) ; Fleur de givre (598433 produits, 10689 utilisés, 1540 vendus, 544444 en stock) ; Bûche d'if (528000 produits, 8850 utilisés, 0 vendus, 470281 en stock) ; Éclat de marée (415681 produits, 0 utilisés, 0 vendus, 173112 en stock) ; Poudre de coin (364552 produits, 608 utilisés, 608 vendus, 312922 en stock) ; Minerai de mithril (336960 produits, 4635 utilisés, 210 vendus, 302700 en stock) ; Minerai d'orichalque (256518 produits, 1800 utilisés, 600 vendus, 238918 en stock) ; Pâte de guède (229541 produits, 2241 utilisés, 60 vendus, 181726 en stock) ; Raie des abysses (190426 produits, 385 utilisés, 0 vendus, 161605 en stock) ; Farine (168640 produits, 3985 utilisés, 1960 vendus, 118935 en stock) ; Curiosité de la Lisière (144000 produits, 210 utilisés, 150 vendus, 80950 en stock) ; Baume de parade (143358 produits, 4342 utilisés, 4342 vendus, 119904 en stock) ; Parchemin de glyphe (127718 produits, 0 utilisés, 0 vendus, 127718 en stock) ; Clous et rivets (115200 produits, 0 utilisés, 0 vendus, 115200 en stock) ; Manche de chêne (88596 produits, 2057 utilisés, 1641 vendus, 76539 en stock) ; Minerai d'azurite (85617 produits, 0 utilisés, 0 vendus, 66721 en stock) ; Carte de gisement (82800 produits, 3255 utilisés, 0 vendus, 16360 en stock) ; Carte du Bois des Murmures (82280 produits, 320 utilisés, 120 vendus, 41598 en stock) ; Peau d'élan des neiges (76014 produits, 105 utilisés, 0 vendus, 56553 en stock) ; Huile de battue (52266 produits, 0 utilisés, 0 vendus, 48578 en stock) ; Perles de verre (48052 produits, 2183 utilisés, 833 vendus, 38080 en stock)

Jamais produits : 40 objets (Minerai de sombracier, Astralite, Pioche de bronze, Pioche de fer, Serpe de bronze, Canne de bronze, Marteau de bronze, Scie de bronze, Couteau de bronze, Festin du givre, Pourpoint de cuir, Robe de lin, Rune de garde, Robe d'adepte runée, Noyau runique, Liant de mémoire, Collet à ressort, Mécanisme d'horloge, Lanterne d'artificier, Charpente de chêne, Escalier de bois, Ferme de toit, Relique engloutie, Épieu de bronze, Houe de bronze, Racloir de bronze, Racloir de fer, Ciseaux de bronze, Pilon de fer, Burin de fer, Stylet de bronze, Clé de bronze, Truelle de bronze, Longue-vue de bronze, Opale d'interstice, Perle de lessive, Hématite d'arrêt, Grenat de battue, Œil de faille, Volée de flèches empennées).

## Butin d’équipement

12811 pièces tombées, 1.5 par joueur et par jour ; un joueur en possède 133 (médiane). Raretés : common 5154, epic 1432, rare 2678, legendary 189.

| Ensemble | pièces tombées | joueurs qui en portent 2+ |
|---|---|---|
| Les Heures creuses | 191 | 5 |
| Le Sablier fêlé | 202 | 5 |
| Les Habits de pluie | 202 | 7 |
| Le Ciré du Gué | 174 | 7 |
| L'Enclume patiente | 133 | 3 |
| Les Fondeurs sourds | 127 | 0 |
| Les Passeurs de braise | 108 | 2 |
| La Meute du dimanche | 120 | 2 |
| Les Mains de traverse | 259 | 7 |
| Le Pied-de-biche | 263 | 6 |
| Les Veilleurs du sceau | 227 | 2 |
| Le Tablier de suie | 248 | 5 |
| Le Fer du second feu | 67 | 0 |
| La Battue silencieuse | 110 | 1 |
| La Phrase inachevée | 70 | 0 |

Nommés (tombés / portés) : marteau_des_griefs 1/0, forge_portative 200/1, arc_des_ronceraies 87/6, la_ponctuelle 0/0, dernier_avertissement 156/19, sceau_qui_tient 127/3, benefice_du_doute 55/19, petit_arrangement 102/2, mauvais_presage 67/8, sac_sans_fond 0/0, heures_supplementaires 26/6, yoyo 36/9.
Gemmes serties : aucune.
Atelier et vitrine : 244 pièces fabriquées, 13 vendues à la vitrine (prix médian 269 or), 85 encore en vente. Sources : fabrication 244, coffre de la Marée 271, vitrine (achat) 13.
Fournitures (produites / achetées pour la route / dernier prix) : Potion de soin mineure 4588/0/0, Élixir du mineur 5599/120/0, Tonique de givre 3527/0/0, Philtre des lanternes 14419/32/0, Huile de battue 52266/0/0, Volée de flèches empennées 0/0/0, Rinçage clair 1280/0/0, Baume de parade 143358/4342/7, Poudre de coin 364552/608/12, Tonique de synchronie 22330/0/0, Infusion de reprise 15144/0/0.

## Classes et voies

| Classe | joueurs | part | route médiane | route (méta) | niveau |
|---|---|---|---|---|---|
| forgefire | 38 | 38 % | 144 | 0 | 70 |
| tracker | 28 | 28 % | 149 | 0 | 72 |
| runist | 34 | 34 % | 155 | 0 | 71 |

À façon de jouer égale (casus, sans changement de classe) — route à 7 j / 30 j : forgefire 59 / 89.5 (n 12) ; tracker 59 / 89 (n 5) ; runist 59 / 99.5 (n 8).

| Voie | classe | rôle | joueurs | route médiane |
|---|---|---|---|---|
| Trempe-Rouge | forgefire | damage | 11 | 149 |
| Enclumier | forgefire | control | 9 | 139 |
| Rémouleur | forgefire | support | 18 | 139 |
| Tue-Bête | tracker | damage | 12 | 129 |
| Piégeur | tracker | control | 7 | 149 |
| Meneur de meute | tracker | support | 9 | 149 |
| Fulgurant | runist | damage | 13 | 154 |
| Sigillaire | runist | control | 14 | 155 |
| Glyphiste | runist | support | 7 | 159 |

## Où les joueurs restent bloqués (jours-joueurs à la même étape)

- 15-10 Le Notaire des marées : 960
- 14-10 La Matriarche de résine : 686
- 11-10 Le Régent des courants : 672
- 9-10 Le Gardien des trois portes : 543
- 6-10 La Matriarche de résine : 440
- 7-10 Le Notaire des marées : 393
- 5-10 La Matriarche de résine : 323
- 12-10 Le Régent des courants : 318
- 8-10 Le Notaire des marées : 316
- 10-1 Les Terrasses de la vigie : 292
- 16-10 Le Notaire des marées : 285
- 17-10 Le Gardien des trois portes : 231

## Gardiens : jours passés devant (médiane, 90 % des joueurs), parmi ceux qui l’ont atteint

| Étape | gardien | atteint | passé | jours (médiane) | jours (90 %) |
|---|---|---|---|---|---|
| 1-10 | Mère Grise, la Lavandière du Puits | 100 | 100 | 0 | 0 |
| 2-10 | Mère Grise, la Lavandière du Puits | 100 | 100 | 0 | 0 |
| 3-10 | Le Contremaître rouge | 100 | 100 | 0 | 0 |
| 4-10 | Le Contremaître rouge | 100 | 100 | 0 | 0 |
| 5-10 | La Matriarche de résine | 100 | 100 | 3 | 6 |
| 6-10 | La Matriarche de résine | 100 | 100 | 5 | 7 |
| 7-10 | Le Notaire des marées | 100 | 100 | 2 | 13 |
| 8-10 | Le Notaire des marées | 100 | 97 | 0 | 13 |
| 9-10 | Le Gardien des trois portes | 97 | 94 | 0 | 25 |
| 10-10 | Le Gardien des trois portes | 91 | 90 | 0 | 6 |
| 11-10 | Le Régent des courants | 86 | 79 | 6 | 29 |
| 12-10 | Le Régent des courants | 79 | 77 | 2 | 13 |
| 13-10 | La Matriarche de résine | 77 | 76 | 0 | 5 |
| 14-10 | La Matriarche de résine | 76 | 58 | 5.5 | 26 |
| 15-10 | Le Notaire des marées | 58 | 35 | 13 | 41 |
| 16-10 | Le Notaire des marées | 19 | 12 | 9 | 33 |
| 17-10 | Le Gardien des trois portes | 11 | 3 | 17 | 50 |

## Clans

5 clans ; niveaux de bâtiments construits (sur 24 possibles) : 4 (8 m.), 3 (15 m.), 4 (6 m.), 4 (13 m.), 1 (1 m.).

## Marée du soir

90 soirs, 92.5 participants en moyenne (50 % en direct, 0 % au travail), 3.6 seuils du serveur franchis en moyenne.
Points moyens — en direct / absent : absent 56.5, en direct 89.5 ; par façon de jouer : casual 67, hoarder 85, afk 42.9, collector 101.2.
Par classe : runist 86.4, forgefire 68, tracker 62.9 ; par voie : runist/avant voie 51.9, forgefire/avant voie 45.8, tracker/avant voie 48.2, forgefire/whetter 66.3, tracker/beastslayer 51.5, runist/fulgurant 80.9, runist/sigilbinder 90.2, forgefire/red_temper 73.7, tracker/packleader 76.1, tracker/trapper 67.1, forgefire/anvil 67.2, runist/glyphkeeper 94.
Par Marée et voie : debacle:anvil 63.6, debacle:beastslayer 52.7, debacle:forgefire 48.1, debacle:fulgurant 78.7, debacle:glyphkeeper 90.1, debacle:packleader 68.7, debacle:red_temper 73.9, debacle:runist 45.9, debacle:sigilbinder 88.7, debacle:tracker 42.6, debacle:trapper 56.4, debacle:whetter 61.5, giants:anvil 71.1, giants:beastslayer 51.6, giants:forgefire 44.1, giants:fulgurant 80.9, giants:glyphkeeper 94.5, giants:packleader 79.3, giants:red_temper 73.2, giants:runist 49.7, giants:sigilbinder 91.1, giants:tracker 45.5, giants:trapper 79.8, giants:whetter 67, lanterns:anvil 67, lanterns:beastslayer 50.1, lanterns:forgefire 45.8, lanterns:fulgurant 83.2, lanterns:glyphkeeper 97.5, lanterns:packleader 80.4, lanterns:red_temper 74, lanterns:runist 58.1, lanterns:sigilbinder 90.9, lanterns:tracker 54.7, lanterns:trapper 65.2, lanterns:whetter 70.5.
Éclats : 323 par joueur et par semaine ; 61 tenues Marée haute achetées ; 1124 coffres de la semaine, 271 caches d’équipement.

## Commandes du maître réussies par rang : 20 : 138, 40 : 127, 60 : 45.