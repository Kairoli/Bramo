# Simulation de serveur : 100 joueurs, 90 jours, composition « hoard », graine 4

Durée du calcul : 434 s. Extensions : Marée du soir.

## Progression (médianes par façon de jouer)

| Façon de jouer | n | j7 : classe · route · métier · or | j30 : classe · route · métier · or | j60 : classe · route · métier · or | j89 : classe · route · métier · or |
|---|---|---|---|---|---|
| Casu tranquille | 25 | 45 · 59 · 45 · 434 | 61 · 89 · 60 · 783 | 69 · 119 · 67 · 544 | 74 · 149 · 71.5 · 512 |
| Thésauriseur (ne vend rien) | 36 | 42 · 59 · 35 · 158 | 58 · 89 · 50 · 487 | 66 · 139 · 58 · 479 | 71 · 154 · 62 · 444 |
| Onglet oublié (ne touche à rien) | 24 | 43.5 · 59 · 45 · 1030 | 59 · 79 · 60 · 1693 | 67 · 98 · 67 · 3510 | 73 · 104 · 72 · 4558 |
| Collectionneur (tous les métiers) | 15 | 45 · 59 · 30 · 324 | 61 · 119 · 46 · 352 | 69 · 169 · 53 · 404 | 74 · 179 · 58 · 531 |

## Jalons (jour médian depuis l’arrivée ; part des joueurs qui y arrivent)

- **casual** — route : étape 10 : 0 j (100 %), étape 30 : 2 j (100 %), étape 60 : 13 j (100 %), étape 90 : 42 j (96 %), étape 120 : 56 j (76 %), étape 150 : 66.5 j (24 %) ; classe : niv 30 : 2 j (100 %), niv 50 : 11 j (100 %), niv 75 : — j (0 %), niv 90 : — j (0 %) ; métier : niv 40 : 5 j (100 %), niv 60 : 30 j (100 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **hoarder** — route : étape 10 : 0 j (100 %), étape 30 : 3 j (100 %), étape 60 : 12 j (100 %), étape 90 : 37.5 j (94 %), étape 120 : 44 j (75 %), étape 150 : 49 j (39 %) ; classe : niv 30 : 3 j (100 %), niv 50 : 15 j (100 %), niv 75 : 88 j (3 %), niv 90 : — j (0 %) ; métier : niv 40 : 11 j (97 %), niv 60 : 64 j (64 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **afk** — route : étape 10 : 0 j (100 %), étape 30 : 2.5 j (100 %), étape 60 : 13 j (100 %), étape 90 : 60 j (54 %), étape 120 : 60 j (8 %), étape 150 : — j (0 %) ; classe : niv 30 : 2 j (100 %), niv 50 : 13.5 j (100 %), niv 75 : 89 j (4 %), niv 90 : — j (0 %) ; métier : niv 40 : 5 j (100 %), niv 60 : 29.5 j (100 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **collector** — route : étape 10 : 0 j (100 %), étape 30 : 2 j (100 %), étape 60 : 9 j (100 %), étape 90 : 20 j (100 %), étape 120 : 32 j (100 %), étape 150 : 50 j (100 %) ; classe : niv 30 : 2 j (100 %), niv 50 : 11 j (100 %), niv 75 : 88 j (7 %), niv 90 : — j (0 %) ; métier : niv 40 : 16 j (100 %), niv 60 : 87 j (7 %), niv 80 : — j (0 %), niv 99 : — j (0 %)

## Buts : qui n’avance plus ?

| Façon de jouer | route finie | route bloquée 14 j | plus rien n’avance depuis 14 j |
|---|---|---|---|
| casual | 0 % | 44 % | 0 % |
| hoarder | 3 % | 61 % | 0 % |
| afk | 0 % | 100 % | 0 % |
| collector | 20 % | 60 % | 7 % |

## Or

Robinets : commandes PNJ 491875, commandes du maître 211900 (total 703775, plus 10000 d’or de départ).
Puits : étal de la guilde 27150, taxe du marché 19843, bâtiments de clan 200135, réparations PNJ 38598 (total 285726).
Or par joueur : j0 100 · j7 453 · j14 836 · j21 1220 · j28 1488 · j35 1957 · j42 2283 · j49 2667 · j56 2975 · j63 3185 · j70 3490 · j77 3779 · j84 4046 · j89 4280. Gini 0.7.
Plus riches : collector 54414 (hunting/tanning/exploration/herbalism) ; casual 44624 (woodcutting) ; casual 26051 (woodcutting) ; collector 22128 (hunting/artificing/construction/fishing) ; collector 21148 (mining/jewelcrafting/construction/woodcutting).

## Marché

Indice des prix (100 = prix de référence), par semaine : 100.9 · 101.6 · 92.8 · 90 · 85.2 · 87.8 · 88.3 · 84.8 · 87.5 · 83.5 · 81.9 · 79.1 · 73.7.

| Objet | réf. | échangés | prix 1re sem. | prix dernière sem. |
|---|---|---|---|---|
| Bûche de pin | 2 | 52647 | 2 | 2 |
| Baume de parade | 12 | 4048 | 6.4 | 6 |
| Poussière de rune | 2 | 20388 | 2 | 1 |
| Thym | 3 | 11008 | 3 | 3 |
| Rouages de bronze | 3 | 10140 | 3 | 2 |
| Charbon | 3 | 7215 | 3 | 2 |
| Venaison | 3 | 5234 | 3 | 2 |
| Pierre runique | 3 | 3789 | 3 | 3 |
| Rouleau de toile de lin | 68 | 167 | 78 | 41.4 |
| Peau d'ours | 7 | 1452 | 8 | 8 |
| Bûche de chêne | 3 | 3243 | 3 | 3 |
| Manche de pin | 2 | 4639 | 1 | 1 |
| Minerai d'or | 7 | 1322 | 8 | 8 |
| Racine d'ortie | 3 | 3004 | 3 | 3 |
| Farine | 7 | 1284 | 8 | 8 |

Effondrés (sous 40 % de la référence) : aucun.
Envolés (au-dessus de 250 %) : aucun.

| Façon de jouer | ventes nettes | achats | commandes PNJ | or final |
|---|---|---|---|---|
| casual | 3576 | 0 | 1985 | 550 |
| hoarder | 0 | 5803 | 6810 | 462 |
| afk | 0 | 0 | 2073 | 3700 |
| collector | 6440 | 8384 | 9545 | 515 |

## Objets sans débouché (produits, presque jamais utilisés)

Hampes de flèche (6508800 produits, 0 utilisés, 0 vendus, 6478800 en stock) ; Pointes de flèche en fer (4395000 produits, 0 utilisés, 0 vendus, 4395000 en stock) ; Venaison (2936812 produits, 146034 utilisés, 5234 vendus, 2680778 en stock) ; Plumes de faisan (2736000 produits, 0 utilisés, 0 vendus, 2646250 en stock) ; Brochet (1549724 produits, 14700 utilisés, 17 vendus, 1495398 en stock) ; Poisson-lanterne (1286593 produits, 7365 utilisés, 0 vendus, 1248303 en stock) ; Peau d'ours (1194307 produits, 11698 utilisés, 1452 vendus, 1090812 en stock) ; Éclat de marée (1042352 produits, 0 utilisés, 0 vendus, 649565 en stock) ; Bois de lune (917653 produits, 8010 utilisés, 255 vendus, 875963 en stock) ; Fourrure de loup (827897 produits, 27478 utilisés, 925 vendus, 687867 en stock) ; Lanières de cuir (749660 produits, 14256 utilisés, 0 vendus, 715404 en stock) ; Bûche d'if (628662 produits, 9900 utilisés, 0 vendus, 569893 en stock) ; Fleur de givre (590357 produits, 7196 utilisés, 1010 vendus, 539761 en stock) ; Poudre de coin (352812 produits, 528 utilisés, 528 vendus, 301149 en stock) ; Minerai d'orichalque (248781 produits, 2025 utilisés, 500 vendus, 230756 en stock) ; Minerai de mithril (216000 produits, 5400 utilisés, 225 vendus, 182635 en stock) ; Farine (204640 produits, 2964 utilisés, 1284 vendus, 158481 en stock) ; Carte de gisement (194400 produits, 2980 utilisés, 15 vendus, 121870 en stock) ; Raie des abysses (191130 produits, 385 utilisés, 0 vendus, 162309 en stock) ; Baume de parade (131148 produits, 4048 utilisés, 4048 vendus, 101668 en stock) ; Parchemin de glyphe (128423 produits, 0 utilisés, 0 vendus, 128423 en stock) ; Curiosité de la Lisière (112320 produits, 210 utilisés, 60 vendus, 53910 en stock) ; Pâte de guède (79668 produits, 2831 utilisés, 60 vendus, 64979 en stock) ; Minerai d'azurite (73095 produits, 0 utilisés, 0 vendus, 54199 en stock) ; Carte du Bois des Murmures (65824 produits, 320 utilisés, 0 vendus, 8806 en stock) ; Manche de chêne (59516 produits, 620 utilisés, 0 vendus, 58896 en stock) ; Huile de battue (54958 produits, 0 utilisés, 0 vendus, 51553 en stock) ; Peau d'élan des neiges (53160 produits, 140 utilisés, 0 vendus, 36835 en stock) ; Carottes (48000 produits, 1312 utilisés, 1312 vendus, 38400 en stock) ; Encre fossile (44841 produits, 0 utilisés, 0 vendus, 27556 en stock)

Jamais produits : 56 objets (Minerai de sombracier, Astralite, Épée de fer, Pioche de bronze, Pioche de fer, Pioche d'acier, Hache de fer, Serpe de bronze, Serpe de fer, Canne de bronze, Canne de fer, Marteau de bronze, Marteau de fer, Scie de bronze, Scie de fer, Couteau de bronze, Couteau de fer, Festin du givre, Pourpoint de cuir, Capuche de lin, Robe de lin, Rune de garde, Robe d'adepte runée, Noyau runique, Liant de mémoire, Collet à ressort, Mécanisme d'horloge, Lanterne d'artificier, Charpente de chêne, Escalier de bois, Ferme de toit, Relique engloutie, Épieu de bronze, Épieu de fer, Houe de bronze, Houe de fer, Racloir de fer, Ciseaux de fer, Pilon de bronze, Pilon de fer).

## Butin d’équipement

11734 pièces tombées, 1.4 par joueur et par jour ; un joueur en possède 125 (médiane). Raretés : common 5043, epic 1489, rare 2695, legendary 192.

| Ensemble | pièces tombées | joueurs qui en portent 2+ |
|---|---|---|
| Les Heures creuses | 190 | 3 |
| Le Sablier fêlé | 182 | 4 |
| Les Habits de pluie | 195 | 3 |
| Le Ciré du Gué | 183 | 2 |
| L'Enclume patiente | 120 | 3 |
| Les Fondeurs sourds | 156 | 6 |
| Les Passeurs de braise | 68 | 2 |
| La Meute du dimanche | 62 | 3 |
| Les Mains de traverse | 201 | 12 |
| Le Pied-de-biche | 191 | 3 |
| Les Veilleurs du sceau | 115 | 2 |
| Le Tablier de suie | 93 | 3 |
| Le Fer du second feu | 1 | 0 |
| La Battue silencieuse | 2 | 0 |
| La Phrase inachevée | 0 | 0 |

Nommés (tombés / portés) : marteau_des_griefs 1/0, forge_portative 0/0, arc_des_ronceraies 41/2, la_ponctuelle 0/0, dernier_avertissement 185/21, sceau_qui_tient 149/4, benefice_du_doute 52/20, petit_arrangement 2/0, mauvais_presage 47/9, sac_sans_fond 0/0, heures_supplementaires 19/2, yoyo 60/15.
Gemmes serties : aucune.
Fournitures (produites / achetées pour la route / dernier prix) : Potion de soin mineure 1969/0/0, Élixir du mineur 2010/80/0, Tonique de givre 1893/0/0, Philtre des lanternes 10486/16/0, Huile de battue 54958/0/0, Volée de flèches empennées 0/0/0, Rinçage clair 3840/0/0, Baume de parade 131148/4048/6, Poudre de coin 352812/528/12, Tonique de synchronie 17616/0/0, Infusion de reprise 26652/0/0.

## Classes et voies

| Classe | joueurs | part | route médiane | route (méta) | niveau |
|---|---|---|---|---|---|
| forgefire | 38 | 38 % | 139 | 0 | 70 |
| tracker | 28 | 28 % | 119 | 0 | 72 |
| runist | 34 | 34 % | 154 | 0 | 71 |

À façon de jouer égale (casus, sans changement de classe) — route à 7 j / 30 j : forgefire 59 / 69 (n 12) ; tracker 59 / 89 (n 5) ; runist 59 / 84 (n 8).

| Voie | classe | rôle | joueurs | route médiane |
|---|---|---|---|---|
| Trempe-Rouge | forgefire | damage | 20 | 144 |
| Enclumier | forgefire | control | 10 | 124 |
| Rémouleur | forgefire | support | 8 | 114 |
| Tue-Bête | tracker | damage | 9 | 109 |
| Piégeur | tracker | control | 10 | 114 |
| Meneur de meute | tracker | support | 9 | 149 |
| Fulgurant | runist | damage | 9 | 149 |
| Sigillaire | runist | control | 13 | 149 |
| Glyphiste | runist | support | 12 | 170 |

## Où les joueurs restent bloqués (jours-joueurs à la même étape)

- 7-10 Le Notaire des marées : 1269
- 9-10 Le Gardien des trois portes : 833
- 15-10 Le Notaire des marées : 810
- 8-10 Le Notaire des marées : 626
- 10-10 Le Gardien des trois portes : 504
- 6-10 La Matriarche de résine : 467
- 11-10 Le Régent des courants : 430
- 14-10 La Matriarche de résine : 349
- 12-10 Le Régent des courants : 345
- 5-10 La Matriarche de résine : 324
- 16-10 Le Notaire des marées : 298
- 17-10 Le Gardien des trois portes : 244

## Clans

5 clans ; niveaux de bâtiments construits (sur 24 possibles) : 3 (8 m.), 4 (15 m.), 4 (6 m.), 5 (13 m.), 0 (1 m.).

## Marée du soir

90 soirs, 92.5 participants en moyenne (50 % en direct, 0 % au travail), 4 seuils du serveur franchis en moyenne.
Points moyens — en direct / absent : absent 80.7, en direct 109.9 ; par façon de jouer : casual 87.4, hoarder 105.7, afk 71.6, collector 120.3.
Par classe : runist 108.3, forgefire 87.6, tracker 89.2 ; par voie : runist/avant voie 90.1, forgefire/avant voie 79.3, tracker/avant voie 83.5, forgefire/red_temper 91.1, tracker/trapper 83.2, runist/sigilbinder 102, runist/fulgurant 108.3, runist/glyphkeeper 116.1, forgefire/whetter 85.4, tracker/packleader 99.6, tracker/beastslayer 85.4, forgefire/anvil 83.3.
Par Marée et voie : debacle:anvil 79.5, debacle:beastslayer 85, debacle:forgefire 80.4, debacle:fulgurant 105.8, debacle:glyphkeeper 110.7, debacle:packleader 92.5, debacle:red_temper 91.3, debacle:runist 75.8, debacle:sigilbinder 99.1, debacle:tracker 70.4, debacle:trapper 71, debacle:whetter 79.4, giants:anvil 86.5, giants:beastslayer 87, giants:forgefire 76.5, giants:fulgurant 109.1, giants:glyphkeeper 117.6, giants:packleader 102.1, giants:red_temper 90.9, giants:runist 86.4, giants:sigilbinder 103.7, giants:tracker 78.8, giants:trapper 97.6, giants:whetter 86.8, lanterns:anvil 84, lanterns:beastslayer 84.1, lanterns:forgefire 81.2, lanterns:fulgurant 110.2, lanterns:glyphkeeper 120.1, lanterns:packleader 104.4, lanterns:red_temper 91.1, lanterns:runist 103.3, lanterns:sigilbinder 103.3, lanterns:tracker 96.5, lanterns:trapper 81, lanterns:whetter 90.3.
Éclats : 811 par joueur et par semaine ; 85 tenues Marée haute achetées ; 1124 coffres de la semaine, 271 caches d’équipement.

## Commandes du maître réussies par rang : 20 : 138, 40 : 125, 60 : 47.