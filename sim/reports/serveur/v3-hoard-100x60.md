# Simulation de serveur : 100 joueurs, 60 jours, composition « hoard », graine 4

Durée du calcul : 203 s. Extensions : Marée du soir.

## Progression (médianes par façon de jouer)

| Façon de jouer | n | j7 : classe · route · métier · or | j30 : classe · route · métier · or | j59 : classe · route · métier · or |
|---|---|---|---|---|
| Casu tranquille | 25 | 45 · 59 · 45 · 516 | 61 · 89 · 60 · 551 | 69 · 119.5 · 67 · 781 |
| Thésauriseur (ne vend rien) | 36 | 42 · 49 · 34 · 98 | 58 · 79 · 49 · 513 | 66 · 120 · 56 · 430 |
| Onglet oublié (ne touche à rien) | 24 | 43.5 · 59 · 45 · 1030 | 59 · 79 · 60 · 1693 | 69 · 89 · 67 · 3640 |
| Collectionneur (tous les métiers) | 15 | 45 · 59 · 30 · 269 | 62 · 79 · 45 · 351 | 69 · 89 · 52 · 440 |

## Jalons (jour médian depuis l’arrivée ; part des joueurs qui y arrivent)

- **casual** — route : étape 10 : 0 j (100 %), étape 30 : 2 j (100 %), étape 60 : 13 j (100 %), étape 90 : 38.5 j (72 %), étape 120 : 56 j (36 %) ; classe : niv 30 : 2 j (100 %), niv 50 : 11 j (100 %), niv 75 : — j (0 %), niv 90 : — j (0 %) ; métier : niv 40 : 5 j (100 %), niv 60 : 30 j (100 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **hoarder** — route : étape 10 : 0 j (100 %), étape 30 : 3 j (100 %), étape 60 : 16 j (100 %), étape 90 : 33 j (64 %), étape 120 : 40.5 j (33 %) ; classe : niv 30 : 3 j (100 %), niv 50 : 15 j (100 %), niv 75 : — j (0 %), niv 90 : — j (0 %) ; métier : niv 40 : 11.5 j (94 %), niv 60 : 53 j (14 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **afk** — route : étape 10 : 0 j (100 %), étape 30 : 2.5 j (100 %), étape 60 : 13 j (100 %), étape 90 : 30 j (17 %), étape 120 : — j (0 %) ; classe : niv 30 : 2 j (100 %), niv 50 : 13.5 j (100 %), niv 75 : — j (0 %), niv 90 : — j (0 %) ; métier : niv 40 : 5 j (100 %), niv 60 : 29.5 j (100 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **collector** — route : étape 10 : 0 j (100 %), étape 30 : 2 j (100 %), étape 60 : 12 j (100 %), étape 90 : — j (0 %), étape 120 : — j (0 %) ; classe : niv 30 : 2 j (100 %), niv 50 : 11 j (100 %), niv 75 : — j (0 %), niv 90 : — j (0 %) ; métier : niv 40 : 18 j (93 %), niv 60 : — j (0 %), niv 80 : — j (0 %), niv 99 : — j (0 %)

## Buts : qui n’avance plus ?

| Façon de jouer | route finie | route bloquée 14 j | plus rien n’avance depuis 14 j |
|---|---|---|---|
| casual | 36 % | 28 % | 0 % |
| hoarder | 33 % | 17 % | 3 % |
| afk | 0 % | 83 % | 0 % |
| collector | 0 % | 40 % | 0 % |

## Or

Robinets : commandes PNJ 289470, commandes du maître 180900 (total 470370, plus 10000 d’or de départ).
Puits : étal de la guilde 27000, taxe du marché 12090, bâtiments de clan 117255, réparations PNJ 22915 (total 179260).
Or par joueur : j0 100 · j7 455 · j14 800 · j21 1098 · j28 1377 · j35 1895 · j42 2271 · j49 2589 · j56 2937 · j59 3011. Gini 0.7.
Plus riches : casual 40909 (woodcutting) ; collector 25904 (hunting/tanning/exploration/herbalism) ; casual 19581 (woodcutting) ; collector 16203 (mining/jewelcrafting/construction/woodcutting) ; collector 14363 (hunting/artificing/construction/fishing).

## Marché

Indice des prix (100 = prix de référence), par semaine : 100.1 · 98.4 · 94.4 · 100.6 · 93.6 · 94.2 · 91.6 · 93.2 · 97.1.

| Objet | réf. | échangés | prix 1re sem. | prix dernière sem. |
|---|---|---|---|---|
| Bûche de pin | 2 | 43887 | 2 | 2 |
| Poussière de rune | 2 | 10192 | 2 | 1 |
| Rouages de bronze | 3 | 6040 | 3 | 3 |
| Fleur de givre | 8 | 1754 | 8 | 8 |
| Charbon | 3 | 4040 | 3 | 3 |
| Bûche de chêne | 3 | 3478 | 3 | 3 |
| Pierre runique | 3 | 3258 | 3 | 3 |
| Farine | 7 | 1356 | 8 | 8 |
| Fourrure de loup | 5 | 1626 | 6 | 6 |
| Manche de pin | 2 | 3420 | 1 | 1 |
| Truite | 3 | 2190 | 3 | 3 |
| Thym | 3 | 2079 | 3 | 3 |
| Minerai d'or | 7 | 810 | 8 | 8 |
| Racine d'ortie | 3 | 1885 | 3 | 3 |
| Manche de chêne | 3 | 1437 | 3 | 2 |

Effondrés (sous 40 % de la référence) : aucun.
Envolés (au-dessus de 250 %) : aucun.

| Façon de jouer | ventes nettes | achats | commandes PNJ | or final |
|---|---|---|---|---|
| casual | 1573 | 0 | 1080 | 873 |
| hoarder | 0 | 3622 | 4410 | 442 |
| afk | 0 | 0 | 1228 | 3093 |
| collector | 4873 | 3806 | 5315 | 379 |

## Objets sans débouché (produits, presque jamais utilisés)

Hampes de flèche (3513600 produits, 0 utilisés, 0 vendus, 3483600 en stock) ; Pointes de flèche en fer (2160000 produits, 0 utilisés, 0 vendus, 2160000 en stock) ; Plumes de faisan (2016000 produits, 0 utilisés, 0 vendus, 1916250 en stock) ; Venaison (1370878 produits, 1560 utilisés, 120 vendus, 1253274 en stock) ; Viande de gibier (1355149 produits, 1620 utilisés, 0 vendus, 1223529 en stock) ; Brochet (1131634 produits, 10800 utilisés, 17 vendus, 1078415 en stock) ; Lanières de cuir (888680 produits, 18940 utilisés, 0 vendus, 849740 en stock) ; Poisson-lanterne (712297 produits, 4785 utilisés, 0 vendus, 668194 en stock) ; Éclat de marée (578119 produits, 0 utilisés, 0 vendus, 331949 en stock) ; Fourrure de loup (572586 produits, 24228 utilisés, 1626 vendus, 450732 en stock) ; Bois de lune (542733 produits, 5355 utilisés, 225 vendus, 497698 en stock) ; Peau d'ours (528775 produits, 3069 utilisés, 453 vendus, 459665 en stock) ; Ressorts de fer (516096 produits, 0 utilisés, 0 vendus, 476096 en stock) ; Lys-lanterne (502689 produits, 14769 utilisés, 165 vendus, 444880 en stock) ; Poudre d'éclat (412329 produits, 234 utilisés, 0 vendus, 372095 en stock) ; Bûche d'if (365873 produits, 6550 utilisés, 0 vendus, 310288 en stock) ; Peau de sanglier (350808 produits, 9419 utilisés, 73 vendus, 256135 en stock) ; Fleur de givre (264000 produits, 4419 utilisés, 1754 vendus, 220306 en stock) ; Minerai de mithril (185286 produits, 3510 utilisés, 165 vendus, 158101 en stock) ; Rouages de bronze (174272 produits, 6840 utilisés, 6040 vendus, 131696 en stock) ; Farine (125440 produits, 2796 utilisés, 1356 vendus, 77694 en stock) ; Minerai d'orichalque (124800 produits, 675 utilisés, 0 vendus, 106025 en stock) ; Carte de gisement (100800 produits, 1375 utilisés, 0 vendus, 32855 en stock) ; Encre runique (78477 produits, 700 utilisés, 0 vendus, 77777 en stock) ; Parchemin de glyphe (74686 produits, 0 utilisés, 0 vendus, 74686 en stock) ; Manche de chêne (57924 produits, 1459 utilisés, 1437 vendus, 46485 en stock) ; Perles de verre (50196 produits, 960 utilisés, 240 vendus, 34460 en stock) ; Curiosité de la Lisière (46080 produits, 0 utilisés, 0 vendus, 6280 en stock) ; Carte du Bois des Murmures (45254 produits, 0 utilisés, 0 vendus, 45382 en stock) ; Pâte de guède (44463 produits, 1545 utilisés, 60 vendus, 36290 en stock)

Jamais produits : 47 objets (Minerai d'azurite, Minerai de sombracier, Astralite, Raie des abysses, Hache de bronze, Hache de fer, Serpe de bronze, Canne de bronze, Marteau de bronze, Scie de bronze, Scie de fer, Couteau de bronze, Festin du givre, Peau d'élan des neiges, Pourpoint de cuir, Capuche de lin, Robe de lin, Rune de garde, Robe d'adepte runée, Noyau runique, Liant de mémoire, Collet à ressort, Mécanisme d'horloge, Lanterne d'artificier, Charpente de chêne, Escalier de bois, Ferme de toit, Pièces anciennes, Relique engloutie, Ragoût du chasseur, Épieu de bronze, Houe de bronze, Racloir de fer, Ciseaux de bronze, Pilon de bronze, Burin de bronze, Stylet de bronze, Clé de bronze, Clé de fer, Truelle de bronze).

## Butin d’équipement

8201 pièces tombées, 1.5 par joueur et par jour ; un joueur en possède 80.5 (médiane). Raretés : common 3542, epic 1017, rare 1944, legendary 137.

| Ensemble | pièces tombées | joueurs qui en portent 2+ |
|---|---|---|
| Les Heures creuses | 124 | 6 |
| Le Sablier fêlé | 119 | 3 |
| Les Habits de pluie | 124 | 3 |
| Le Ciré du Gué | 131 | 6 |
| L'Enclume patiente | 76 | 3 |
| Les Fondeurs sourds | 83 | 2 |
| Les Passeurs de braise | 43 | 1 |
| La Meute du dimanche | 34 | 1 |
| Les Mains de traverse | 110 | 3 |
| Le Pied-de-biche | 106 | 5 |
| Les Veilleurs du sceau | 78 | 3 |
| Le Tablier de suie | 61 | 1 |
| Le Fer du second feu | 2 | 0 |
| La Battue silencieuse | 20 | 3 |
| La Phrase inachevée | 19 | 0 |

Nommés (tombés / portés) : marteau_des_griefs 1/0, forge_portative 0/0, arc_des_ronceraies 26/1, la_ponctuelle 0/0, dernier_avertissement 111/13, sceau_qui_tient 78/4, benefice_du_doute 27/7, petit_arrangement 2/1, mauvais_presage 20/5, sac_sans_fond 74/5, heures_supplementaires 76/12, yoyo 16/1.
Gemmes serties : aucune.

## Classes et voies

| Classe | joueurs | part | route médiane | route (méta) | niveau |
|---|---|---|---|---|---|
| forgefire | 38 | 38 % | 84 | 0 | 65 |
| tracker | 28 | 28 % | 89 | 0 | 67 |
| runist | 34 | 34 % | 99 | 0 | 66 |

À façon de jouer égale (casus, sans changement de classe) — route à 7 j / 30 j : forgefire 59 / 69 (n 12) ; tracker 59 / 89 (n 5) ; runist 59 / 84 (n 8).

| Voie | classe | rôle | joueurs | route médiane |
|---|---|---|---|---|
| Trempe-Rouge | forgefire | damage | 20 | 96 |
| Enclumier | forgefire | control | 11 | 69 |
| Rémouleur | forgefire | support | 7 | 89 |
| Tue-Bête | tracker | damage | 9 | 89 |
| Piégeur | tracker | control | 10 | 89 |
| Meneur de meute | tracker | support | 9 | 89 |
| Fulgurant | runist | damage | 10 | 120 |
| Sigillaire | runist | control | 13 | 99 |
| Glyphiste | runist | support | 11 | 119 |

## Où les joueurs restent bloqués (jours-joueurs à la même étape)

- 7-10 Le Notaire des marées : 1477
- 9-10 Le Gardien des trois portes : 688
- 6-10 La Matriarche de résine : 547
- 8-10 Le Notaire des marées : 497
- 5-10 La Matriarche de résine : 347
- route finie : 268
- 10-10 Le Gardien des trois portes : 243
- 11-10 Le Régent des courants : 144
- 12-10 Le Régent des courants : 85
- 8-8 Le Gué des plaies : 43
- 8-7 Le Gué des plaies : 34
- 8-4 Le Gué des plaies : 29

## Clans

5 clans ; niveaux de bâtiments construits (sur 24 possibles) : 2 (8 m.), 1 (15 m.), 2 (6 m.), 2 (13 m.), 0 (1 m.).

## Marée du soir

60 soirs, 88.8 participants en moyenne (50 % en direct, 0 % au travail), 4 seuils du serveur franchis en moyenne.
Points moyens — en direct / absent : absent 71.6, en direct 85.3 ; par façon de jouer : casual 77, hoarder 90.5, afk 65.6, collector 73.2.
Par classe : runist 90, forgefire 71, tracker 74.4 ; par voie : runist/avant voie 90.1, forgefire/avant voie 79.3, tracker/avant voie 83.5, forgefire/red_temper 71.8, tracker/trapper 75.6, runist/sigilbinder 80.7, runist/fulgurant 92.2, runist/glyphkeeper 97.8, forgefire/whetter 72.7, tracker/packleader 80.5, tracker/beastslayer 65.7, forgefire/anvil 66.7.
Par Marée et voie : debacle:anvil 62.4, debacle:beastslayer 65.4, debacle:forgefire 80.4, debacle:fulgurant 88.5, debacle:glyphkeeper 88.7, debacle:packleader 72.7, debacle:red_temper 72.3, debacle:runist 75.8, debacle:sigilbinder 77.3, debacle:tracker 70.4, debacle:trapper 64.2, debacle:whetter 67.2, giants:anvil 69.9, giants:beastslayer 67.4, giants:forgefire 76.5, giants:fulgurant 93.6, giants:glyphkeeper 100.2, giants:packleader 83, giants:red_temper 71.3, giants:runist 86.4, giants:sigilbinder 82.4, giants:tracker 78.8, giants:trapper 89.4, giants:whetter 73.4, lanterns:anvil 67.8, lanterns:beastslayer 64.4, lanterns:forgefire 81.2, lanterns:fulgurant 94.5, lanterns:glyphkeeper 104.8, lanterns:packleader 86.2, lanterns:red_temper 71.8, lanterns:runist 103.3, lanterns:sigilbinder 82.4, lanterns:tracker 96.5, lanterns:trapper 73.4, lanterns:whetter 77.6.
Éclats : 674 par joueur et par semaine ; 60 tenues Marée haute achetées ; 724 coffres de la semaine, 182 caches d’équipement.

## Commandes du maître réussies par rang : 20 : 131, 40 : 117, 60 : 32.