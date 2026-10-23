# Simulation de serveur : 100 joueurs, 90 jours, composition « hoard », graine 11

Durée du calcul : 485 s. Extensions : Marée du soir.

## Progression (médianes par façon de jouer)

| Façon de jouer | n | j7 : classe · route · métier · or | j30 : classe · route · métier · or | j60 : classe · route · métier · or | j89 : classe · route · métier · or |
|---|---|---|---|---|---|
| Collectionneur (tous les métiers) | 26 | 45 · 59 · 25.5 · 1957 | 61 · 140 · 38 · 1954 | 69 · 151 · 44 · 1107 | 73 · 169 · 49 · 2157 |
| Onglet oublié (ne touche à rien) | 21 | 46 · 59 · 44 · 10302 | 61 · 89 · 60 · 17496 | 69 · 109 · 68 · 40458 | 71.5 · 109 · 72 · 48297 |
| Casu tranquille | 14 | 45 · 59 · 43 · 3673 | 61 · 95.5 · 59 · 26671 | 69 · 135 · 67 · 21779 | 73 · 143 · 71 · 1711 |
| Thésauriseur (ne vend rien) | 39 | 42 · 59 · 29 · 905 | 58 · 109 · 41 · 1047 | 66 · 140 · 46 · 1186 | 71 · 149 · 47.5 · 694 |

## Jalons (jour médian depuis l’arrivée ; part des joueurs qui y arrivent)

- **collector** — route : étape 10 : 0 j (100 %), étape 30 : 2 j (100 %), étape 60 : 8 j (100 %), étape 90 : 14 j (100 %), étape 120 : 26 j (100 %), étape 150 : 57 j (81 %) ; classe : niv 30 : 2 j (100 %), niv 50 : 11 j (100 %), niv 75 : — j (0 %), niv 90 : — j (0 %) ; métier : niv 40 : 37.5 j (92 %), niv 60 : 82 j (8 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **afk** — route : étape 10 : 0 j (100 %), étape 30 : 2 j (100 %), étape 60 : 12 j (100 %), étape 90 : 41 j (100 %), étape 120 : 60 j (14 %), étape 150 : — j (0 %) ; classe : niv 30 : 1 j (100 %), niv 50 : 11 j (100 %), niv 75 : — j (0 %), niv 90 : — j (0 %) ; métier : niv 40 : 5 j (100 %), niv 60 : 30 j (100 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **casual** — route : étape 10 : 0 j (100 %), étape 30 : 2 j (100 %), étape 60 : 12.5 j (100 %), étape 90 : 28 j (100 %), étape 120 : 49 j (93 %), étape 150 : — j (0 %) ; classe : niv 30 : 2 j (100 %), niv 50 : 11 j (100 %), niv 75 : — j (0 %), niv 90 : — j (0 %) ; métier : niv 40 : 5.5 j (100 %), niv 60 : 32 j (100 %), niv 80 : — j (0 %), niv 99 : — j (0 %)
- **hoarder** — route : étape 10 : 0 j (100 %), étape 30 : 3 j (100 %), étape 60 : 12 j (100 %), étape 90 : 21 j (100 %), étape 120 : 44 j (100 %), étape 150 : 66 j (23 %) ; classe : niv 30 : 3 j (100 %), niv 50 : 15 j (100 %), niv 75 : — j (0 %), niv 90 : — j (0 %) ; métier : niv 40 : 22 j (85 %), niv 60 : 77.5 j (5 %), niv 80 : — j (0 %), niv 99 : — j (0 %)

## Buts : qui n’avance plus ?

| Façon de jouer | premier cycle fini | route bloquée 14 j | plus rien n’avance depuis 14 j |
|---|---|---|---|
| collector | 100 % | 0 % | 4 % |
| afk | 14 % | 86 % | 0 % |
| casual | 93 % | 7 % | 0 % |
| hoarder | 100 % | 0 % | 8 % |

## Or

Robinets : commandes PNJ 11254340, commandes du maître 1957000 (total 13211340, plus 100000 d’or de départ).
Puits : étal de la guilde 246000, taxe du marché 991171, réparations PNJ 275233, bâtiments de clan 6877546, ouvrages du clan 248553, taxe de la vitrine 2742, mécène de la Marée 838000, Affineur (rangs) 7560 (total 9486805). Sur les 30 derniers jours, or créé / détruit : 1.3.
Or par joueur : j0 1000 · j7 4216 · j14 9028 · j21 13976 · j28 16713 · j35 21962 · j42 25502 · j49 27281 · j56 28490 · j63 29681 · j70 32641 · j77 33854 · j84 36384 · j89 38245. Gini 0.8.
Puits voulus : 34 Marées offertes par des mécènes, 12 ouvrages de clan achevés (niveaux des clans : 2, 2, 2, 2, 2, 2), 12 banquets lancés, 1 rangs d’affinage achetés (au plus +1).
Plus riches : casual 1002912 (herbalism) ; casual 521446 (fishing) ; casual 206784 (agriculture) ; casual 204403 (agriculture) ; casual 149488 (agriculture).

## Marché

Indice des prix (100 = prix de référence), par semaine : 107.1 · 91.8 · 94.6 · 82 · 81.3 · 84.7 · 74.2 · 78.2 · 74.3 · 69.1 · 68.1 · 65.4 · 69.1.

Activité d'achat (30 derniers jours) : 61 % des joueurs achètent chaque jour, 1.6 achats et 69 unités (1766 or) par joueur et par jour, 14.1 achats en gros (100 unités et plus) par jour ; 11 % des joueurs-jours renoncent à un achat faute d'or. Par semaine (acheteurs du jour, unités) : 34 % / 13 · 61 % / 113 · 61 % / 110 · 63 % / 132 · 62 % / 106 · 64 % / 91 · 64 % / 105 · 64 % / 72 · 64 % / 71 · 63 % / 69 · 59 % / 76 · 60 % / 69 · 62 % / 60.

| Objet | réf. | échangés | prix 1re sem. | prix dernière sem. |
|---|---|---|---|---|
| Bûche de pin | 20 | 70118 | 18.6 | 19 |
| Poisson frais | 20 | 68047 | 21 | 14.7 |
| Charbon | 34 | 37693 | 30.8 | 17 |
| Thym | 26 | 48594 | 22.5 | 13 |
| Bûche de chêne | 26 | 37861 | 30 | 22.8 |
| Baume de parade | 117 | 6829 | 116.1 | 59 |
| Bûche d'if | 43 | 18436 | 39.8 | 25 |
| Moellons taillés | 105 | 6857 | 121 | 53 |
| Sauge pourpre | 43 | 16724 | 24.8 | 25 |
| Farine | 75 | 8945 | 77.4 | 43 |
| Huile de battue | 69 | 9667 | 79 | 35 |
| Fioles | 19 | 34727 | 22 | 11.8 |
| Planche de chêne | 45 | 14251 | 52 | 28.2 |
| Pierre runique | 32 | 18621 | 36.8 | 21.6 |
| Fleur de givre | 84 | 6674 | 87 | 42 |

Effondrés (sous 40 % de la référence) : aucun.
Envolés (au-dessus de 250 %) : aucun.

| Façon de jouer | ventes nettes | achats | commandes PNJ | or final |
|---|---|---|---|---|
| collector | 326364 | 339547 | 185200 | 1825 |
| afk | 0 | 0 | 25620 | 44676 |
| casual | 433833 | 131366 | 30700 | 5489 |
| hoarder | 0 | 154166 | 155460 | 948 |

## Objets sans débouché (produits, presque jamais utilisés)

Hampes de flèche (990780 produits, 840 utilisés, 0 vendus, 977000 en stock) ; Brochet (685817 produits, 8600 utilisés, 17 vendus, 657458 en stock) ; Poisson-lanterne (648371 produits, 3075 utilisés, 0 vendus, 622926 en stock) ; Curiosité de la Lisière (519347 produits, 1020 utilisés, 180 vendus, 494927 en stock) ; Truite (489612 produits, 13946 utilisés, 4474 vendus, 397781 en stock) ; Éclat de marée (475842 produits, 0 utilisés, 0 vendus, 371282 en stock) ; Carte de gisement (428400 produits, 6070 utilisés, 0 vendus, 353590 en stock) ; Relique engloutie (410400 produits, 1280 utilisés, 0 vendus, 383620 en stock) ; Peau de cerf (336557 produits, 13225 utilisés, 2458 vendus, 264284 en stock) ; Pièces anciennes (336000 produits, 1600 utilisés, 800 vendus, 294400 en stock) ; Pâte de guède (316647 produits, 14023 utilisés, 2804 vendus, 260766 en stock) ; Peau d'ours (289718 produits, 4134 utilisés, 0 vendus, 289944 en stock) ; Minerai d'argent (240000 produits, 7500 utilisés, 252 vendus, 193879 en stock) ; Fleur de givre (233605 produits, 7707 utilisés, 6674 vendus, 218098 en stock) ; Plumes de faisan (216000 produits, 840 utilisés, 840 vendus, 205160 en stock) ; Minerai d'orichalque (199200 produits, 900 utilisés, 0 vendus, 183525 en stock) ; Minerai d'or (197648 produits, 1900 utilisés, 40 vendus, 178255 en stock) ; Carte du Bois des Murmures (189244 produits, 640 utilisés, 280 vendus, 140356 en stock) ; Pointes de flèche en fer (144240 produits, 840 utilisés, 0 vendus, 143400 en stock) ; Bûche de cèdre (110400 produits, 0 utilisés, 0 vendus, 99100 en stock) ; Parchemin de glyphe (53061 produits, 2375 utilisés, 1028 vendus, 38661 en stock) ; Minerai d'azurite (51680 produits, 0 utilisés, 0 vendus, 42324 en stock) ; Planche de bois de lune (49444 produits, 475 utilisés, 634 vendus, 38969 en stock) ; Raie des abysses (48730 produits, 70 utilisés, 0 vendus, 34782 en stock) ; Améthyste brute (48000 produits, 0 utilisés, 0 vendus, 38680 en stock) ; Planche d'if (46872 produits, 678 utilisés, 476 vendus, 28618 en stock) ; Poudre de coin (38642 produits, 1928 utilisés, 1928 vendus, 13629 en stock) ; Tonique de synchronie (33238 produits, 0 utilisés, 0 vendus, 18083 en stock) ; Bûche d'ébène (28795 produits, 0 utilisés, 0 vendus, 19255 en stock) ; Planche de frêne (26106 produits, 107 utilisés, 263 vendus, 18815 en stock)

Matières premières passées par le marché (en valeur de référence) : 392962774 produites, 132377642 utilisées, 13386514 vendues.

Jamais produits : 44 objets (Minerai de sombracier, Astralite, Canne de fer, Marteau de fer, Scie de bronze, Scie de fer, Couteau de bronze, Soupe aux lys-lanternes, Festin du givre, Capuche de lin, Fil de cuivre, Bague de cuivre, Perles de verre, Lingot d'argent, Anneau d'argent, Améthyste taillée, Bague aux deux améthystes, Lingot d'or, Chaîne d'or, Robe d'adepte runée, Noyau runique, Épieu de fer, Ciseaux de fer, Pilon de fer, Burin de fer, Longue-vue de bronze, Opale d'interstice, Perle de lessive, Hématite d'arrêt, Grenat de battue, Œil de faille, Ambre de reprise, Lingot de mithril renforcé, Lingot d'orichalque, Lingot d'azurite, Lingot de sombracier, Lingot d'astralite, Bois d'ombre, Bois d'aurore, Planche de cèdre).

## Butin d’équipement

12394 pièces tombées, 1.5 par joueur et par jour ; un joueur en possède 132 (médiane). Raretés : epic 1405, common 4908, rare 2602, legendary 186.

| Ensemble | pièces tombées | joueurs qui en portent 2+ |
|---|---|---|
| Les Heures creuses | 141 | 3 |
| Le Sablier fêlé | 128 | 2 |
| Les Habits de pluie | 139 | 1 |
| Le Ciré du Gué | 181 | 3 |
| L'Enclume patiente | 173 | 3 |
| Les Fondeurs sourds | 189 | 2 |
| Les Passeurs de braise | 172 | 3 |
| La Meute du dimanche | 203 | 9 |
| Les Mains de traverse | 220 | 6 |
| Le Pied-de-biche | 218 | 4 |
| Les Veilleurs du sceau | 244 | 4 |
| Le Tablier de suie | 228 | 3 |
| Le Fer du second feu | 60 | 0 |
| La Battue silencieuse | 126 | 0 |
| La Phrase inachevée | 43 | 0 |

Nommés (tombés / portés) : marteau_des_griefs 64/10, forge_portative 200/0, arc_des_ronceraies 55/3, la_ponctuelle 11/1, dernier_avertissement 27/0, sceau_qui_tient 75/3, benefice_du_doute 29/2, petit_arrangement 232/68, mauvais_presage 72/6, sac_sans_fond 0/0, heures_supplementaires 36/0, yoyo 27/7.
Gemmes serties : aucune.
Atelier et vitrine : 154 pièces fabriquées, 15 vendues à la vitrine (prix médian 3085 or), 10 encore en vente. Sources : fabrication 154, vitrine (achat) 15, coffre de la Marée 279.
Fournitures (produites / achetées pour la route / dernier prix) : Potion de soin mineure 8055/2776/164.7, Élixir du mineur 7661/945/325, Tonique de givre 3336/47/536, Philtre des lanternes 7282/543/350.5, Huile de battue 34478/9667/35, Volée de flèches empennées 56/0/0, Rinçage clair 9076/1376/58, Baume de parade 59796/6829/59, Poudre de coin 38642/1928/60, Tonique de synchronie 33238/0/0, Infusion de reprise 4414/0/0.

## Classes et voies

| Classe | joueurs | part | route médiane | route (méta) | niveau |
|---|---|---|---|---|---|
| forgefire | 31 | 31 % | 143 | 0 | 70 |
| tracker | 40 | 40 % | 144 | 0 | 72 |
| runist | 29 | 29 % | 149 | 0 | 72 |

À façon de jouer égale (casus seuls, sans changement de classe) — route à 7 j / 30 j : forgefire 49 / 99 (n 3) ; tracker 59 / 99 (n 7) ; runist 59 / 90.5 (n 4).

| Voie | classe | rôle | joueurs | route médiane |
|---|---|---|---|---|
| Trempe-Rouge | forgefire | damage | 10 | 159 |
| Enclumier | forgefire | control | 11 | 139 |
| Rémouleur | forgefire | support | 10 | 141.5 |
| Tue-Bête | tracker | damage | 14 | 142 |
| Piégeur | tracker | control | 14 | 143 |
| Meneur de meute | tracker | support | 12 | 146 |
| Fulgurant | runist | damage | 9 | 146 |
| Sigillaire | runist | control | 11 | 149 |
| Glyphiste | runist | support | 9 | 149 |

## Où les joueurs restent bloqués (jours-joueurs à la même étape)

- 11-10 Le Régent des courants : 655
- 12-10 Le Régent des courants : 527
- 14-10 Mère Grise, la Lavandière du Puits : 513
- 15-1 La Cour des trois coups : 438
- 6-10 La Matriarche de résine : 437
- 15-10 Le Contremaître rouge : 427
- 9-10 Le Gardien des trois portes : 385
- 5-10 La Matriarche de résine : 306
- 10-1 Les Terrasses de la vigie : 270
- 7-10 Le Notaire des marées : 240
- 8-10 Le Notaire des marées : 226
- 16-10 Le Contremaître rouge : 215

## Gardiens : jours passés devant (médiane, 90 % des joueurs), parmi ceux qui l’ont atteint

| Étape | gardien | atteint | passé | jours (médiane) | jours (90 %) |
|---|---|---|---|---|---|
| 1-10 | Mère Grise, la Lavandière du Puits | 100 | 100 | 0 | 0 |
| 2-10 | Mère Grise, la Lavandière du Puits | 100 | 100 | 0 | 0 |
| 3-10 | Le Contremaître rouge | 100 | 100 | 0 | 0 |
| 4-10 | Le Contremaître rouge | 100 | 100 | 0 | 0 |
| 5-10 | La Matriarche de résine | 100 | 100 | 3 | 5 |
| 6-10 | La Matriarche de résine | 100 | 100 | 5 | 7 |
| 7-10 | Le Notaire des marées | 100 | 100 | 0 | 9 |
| 8-10 | Le Notaire des marées | 100 | 100 | 0 | 8 |
| 9-10 | Le Gardien des trois portes | 100 | 100 | 1 | 13 |
| 10-10 | Le Gardien des trois portes | 95 | 94 | 0 | 2 |
| 11-10 | Le Régent des courants | 92 | 84 | 5 | 20 |
| 12-10 | Le Régent des courants | 84 | 81 | 3 | 17 |
| 13-10 | Mère Grise, la Lavandière du Puits | 81 | 80 | 0 | 6 |
| 14-10 | Mère Grise, la Lavandière du Puits | 78 | 66 | 1 | 20 |
| 15-10 | Le Contremaître rouge | 41 | 30 | 5 | 32 |
| 16-10 | Le Contremaître rouge | 23 | 14 | 3 | 25 |
| 17-10 | La Matriarche de résine | 14 | 9 | 6 | 31 |
| 18-10 | La Matriarche de résine | 6 | 1 | 5 | 33 |
| 19-10 | Le Notaire des marées | 1 | 0 | 5 | 5 |

## Clans

6 clans ; niveaux de bâtiments construits (sur 24 possibles) : 10 (9 m.), 13 (11 m.), 12 (9 m.), 8 (7 m.), 12 (11 m.), 2 (4 m.).
Renom : 1590 (Village, 9 m.), 1992 (Village, 11 m.), 1682 (Village, 9 m.), 1255 (Village, 7 m.), 1931 (Village, 11 m.), 697 (Village, 4 m.).

## Marée du soir

90 soirs, 93.6 participants en moyenne (60 % en direct, 0 % au travail), 3.7 seuils du serveur franchis en moyenne.
Points moyens — en direct / absent : en direct 94.6, absent 56 ; par façon de jouer : collector 106, afk 44.7, casual 64.7, hoarder 87.8.
Par classe : forgefire 80.7, runist 86.1, tracker 75.8 ; par voie : forgefire/avant voie 46.7, runist/avant voie 50.9, tracker/avant voie 47.9, forgefire/red_temper 88.1, tracker/trapper 71.3, tracker/beastslayer 70.8, runist/glyphkeeper 99.8, runist/sigilbinder 84.6, runist/fulgurant 78.3, forgefire/anvil 71, forgefire/whetter 87.3, tracker/packleader 89.
Par Marée et voie : debacle:anvil 67.6, debacle:beastslayer 71.9, debacle:forgefire 48, debacle:fulgurant 77.7, debacle:glyphkeeper 92, debacle:packleader 82.1, debacle:red_temper 88.6, debacle:runist 46.6, debacle:sigilbinder 85.3, debacle:tracker 43.2, debacle:trapper 59.4, debacle:whetter 81.5, giants:anvil 74.2, giants:beastslayer 71.3, giants:forgefire 45.6, giants:fulgurant 76.7, giants:glyphkeeper 101.6, giants:packleader 91.3, giants:red_temper 87.8, giants:runist 49.6, giants:sigilbinder 83.6, giants:tracker 45.5, giants:trapper 86, giants:whetter 88.5, lanterns:anvil 71.3, lanterns:beastslayer 69.1, lanterns:forgefire 47, lanterns:fulgurant 80.3, lanterns:glyphkeeper 106.1, lanterns:packleader 93.7, lanterns:red_temper 88, lanterns:runist 54.1, lanterns:sigilbinder 84.9, lanterns:tracker 53.7, lanterns:trapper 68.8, lanterns:whetter 92.
Éclats : 370 par joueur et par semaine ; 100 tenues Marée haute achetées ; 1135 coffres de la semaine, 279 caches d’équipement.

## Commandes du maître réussies par rang : 20 : 174, 40 : 110, 60 : 37.