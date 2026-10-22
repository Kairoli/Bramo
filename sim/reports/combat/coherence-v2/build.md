# Le build, version 2 : diversité, méta et récompense du bon build

> Généré par `pnpm --filter @bramo/sim sim combat-build --step builds`. Ne pas modifier à la main.

**Méthode.** Proposition `coherence-v2` (8 réserves, 34 gemmes, 15 ensembles à deux étages, 12 nommés, lignes de build, outils recalés), zones `coherence-zones-v2`. Statistiques : kit palier 20 Rare mixte, plus les lignes du build (1,5 par pièce au jet moyen). **Vitesse** : temps du témoin sans talent / temps du build au danger 1, chacun avec le plan le plus rapide de la voie et la meilleure priorité de cible (3 graines ; 240 s si moins de deux victoires), moyenne géométrique des 18 rencontres — c’est le rendement de farm. **Mur** : part des combats gagnés **deux paliers au-dessus du mur du témoin** (×1,20, 4 graines) avec le plan qui en gagne le plus, moyenne des 18 rencontres — c’est « franchir le mur plus tôt ». Témoin sans talent : ≈ 0 % par construction.

## Ce que rapporte un build, voie par voie

| Voie | Meilleur build (vitesse · mur) | Médiane des builds au hasard | Dernier | Builds à 10 % du meilleur en vitesse | Meilleur archétype | Moins bon archétype |
|---|---|---|---|---|---|---|
| Trempe-Rouge | +31 % · 11 % (hasard) | +15 % · 6 % | +3 % · 14 % | 61 sur 224 | Entailles +30 % · 13 % | Ferveur +0 % · 32 % |
| Enclumier | +46 % · 61 % (hasard) | +17 % · 6 % | +2 % · 6 % | 15 sur 224 | Tisons +38 % · 35 % | Ferveur +1 % · 24 % |
| Rémouleur | +46 % · 60 % (hasard) | +15 % · 6 % | +3 % · 13 % | 12 sur 224 | Tisons +45 % · 42 % | Ferveur +3 % · 76 % |
| Tue-Bête | +29 % · 4 % (Entailles) | +10 % · 1 % | +3 % · 1 % | 31 sur 224 | Entailles +29 % · 4 % | Frimas +9 % · 0 % |
| Piégeur | +29 % · 4 % (hasard) | +13 % · 0 % | +4 % · 0 % | 44 sur 224 | Entailles +29 % · 3 % | Ferveur +13 % · 13 % |
| Meneur de meute | +33 % · 93 % (Ferveur) | +10 % · 4 % | +2 % · 0 % | 22 sur 224 | Ferveur +33 % · 93 % | Frimas +9 % · 0 % |
| Fulgurant | +28 % · 17 % (Échos) | +6 % · 0 % | +2 % · 0 % | 17 sur 224 | Échos +28 % · 17 % | Ferveur +0 % · 69 % |
| Sigillaire | +39 % · 31 % (Frimas) | +11 % · 0 % | +2 % · 11 % | 16 sur 224 | Frimas +39 % · 31 % | Ferveur +0 % · 86 % |
| Glyphiste | +35 % · 19 % (Échos) | +11 % · 6 % | +4 % · 0 % | 19 sur 224 | Échos +35 % · 19 % | Trophées +12 % · 6 % |

## Les archétypes, voie par voie (vitesse · mur)

| Voie | Tisons | Entailles | Frimas | Rancœur | Ferveur | Mesure | Échos | Trophées |
|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | +29 % · 11 % | +30 % · 13 % | +23 % · 22 % | +20 % · 4 % | +11 % · 85 % | +25 % · 21 % | +22 % · 6 % | +20 % · 6 % |
| Enclumier | +38 % · 35 % | +34 % · 21 % | +36 % · 61 % | +25 % · 18 % | +14 % · 90 % | +29 % · 28 % | +31 % · 17 % | +22 % · 6 % |
| Rémouleur | +45 % · 42 % | +38 % · 33 % | +35 % · 10 % | +26 % · 13 % | +14 % · 92 % | +31 % · 40 % | +32 % · 10 % | +25 % · 6 % |
| Tue-Bête | +23 % · 6 % | +29 % · 4 % | +12 % · 1 % | +27 % · 28 % | +17 % · 58 % | +23 % · 6 % | +22 % · 0 % | +25 % · 10 % |
| Piégeur | +25 % · 1 % | +29 % · 3 % | +28 % · 31 % | +26 % · 19 % | +17 % · 33 % | +28 % · 0 % | +22 % · 0 % | +23 % · 6 % |
| Meneur de meute | +26 % · 18 % | +30 % · 10 % | +15 % · 0 % | +23 % · 33 % | +33 % · 93 % | +29 % · 24 % | +23 % · 0 % | +24 % · 6 % |
| Fulgurant | +23 % · 10 % | +21 % · 6 % | +16 % · 3 % | +21 % · 14 % | +4 % · 89 % | +19 % · 24 % | +28 % · 17 % | +17 % · 6 % |
| Sigillaire | +27 % · 11 % | +31 % · 3 % | +39 % · 31 % | +27 % · 8 % | +8 % · 86 % | +30 % · 31 % | +30 % · 24 % | +26 % · 6 % |
| Glyphiste | +28 % · 18 % | +29 % · 3 % | +25 % · 4 % | +20 % · 24 % | +23 % · 96 % | +27 % · 33 % | +35 % · 19 % | +25 % · 6 % |

## Le meilleur archétype selon la rencontre

Pour chaque rencontre, l’archétype le plus rapide de chaque voie (nombre de voies). Une méta qui change avec la rencontre : c’est ce qu’on cherche.

| Rencontre | Tisons | Entailles | Frimas | Rancœur | Ferveur | Mesure | Échos | Trophées |
|---|---|---|---|---|---|---|---|---|
| Cible durable | 1 | 1 | 2 | 2 | 1 | · | 2 | · |
| Groupe compact | 2 | · | · | 4 | · | · | 1 | 2 |
| Attaque chargée | 3 | 1 | 1 | 1 | 1 | · | 2 | · |
| Usure régulière | 1 | 1 | 3 | 1 | 1 | · | 2 | · |
| Gardes à dissiper | 2 | 2 | 2 | · | 1 | · | 2 | · |
| Soin ennemi | 3 | 2 | 2 | 1 | 1 | · | · | · |
| La Chaussée des lanternes | 5 | 1 | · | · | · | 1 | 2 | · |
| Les Fossés gris | 2 | 3 | 1 | · | 1 | · | 2 | · |
| La Cour des trois coups | 3 | 2 | 1 | · | 1 | · | 2 | · |
| Les Vergers de verre (refaits) | 1 | 5 | 1 | · | · | · | 2 | · |
| Le Cloître des balances (refait, garde 420) | 2 | 3 | 2 | · | 1 | · | 1 | · |
| Les Fours de recuit | 3 | 2 | 1 | · | 1 | · | 2 | · |
| La Salle des échos | 2 | · | · | 2 | 1 | 3 | 1 | · |
| Le Gué des plaies | 3 | 2 | 1 | · | 1 | · | 2 | · |
| La Chambre aux deux sceaux | 2 | 1 | · | 3 | 1 | · | 2 | · |
| Les Terrasses de la vigie | 3 | 1 | 1 | 1 | 1 | · | 2 | · |
| L’Atelier des mauvais jours (refait) | · | · | · | · | · | · | · | 9 |
| Le Belvédère des trois vents | 3 | 2 | 1 | · | 1 | · | 2 | · |

## Ce qui revient dans les meilleurs builds (10 % les plus rapides de chaque voie)

- Les Heures creuses : 138
- Le Sablier fêlé : 135
- Les Habits de pluie : 69
- Le Ciré du Gué : 57
- L'Enclume patiente : 55
- Le Tablier de suie : 54
- Les Fondeurs sourds : 47
- Les Mains de traverse : 44
- L'Allume-Feu : 41
- Le Feu aux poudres : 39
- Les Passeurs de braise : 38
- Le Pied-de-biche : 37
- Retour à l'envoyeur : 34
- Les Veilleurs du sceau : 32
- La Meute du dimanche : 31
- Le Coup de grâce : 29
- Le Petit Bois : 29
- Le Grand Accord : 29
- Le Rythme cardiaque : 29
- Les Cendres tièdes : 28
- Le Point d'orgue : 28
- Les Engelures : 27
- Le Dégel brutal : 27
- La Rancune tenace : 27
- Le Souffle polaire : 27

Meilleur archétype par voie : Entailles 3, Tisons 2, Ferveur 1, Échos 2, Frimas 1.

## La valeur du bon butin

Le meilleur archétype de chaque voie, avec ses lignes : aucune, au hasard, alignées sur lui. Et le témoin sans talent avec des lignes de statistiques.

| Voie | Archétype | Sans ligne | Lignes au hasard | Lignes alignées | Témoin + lignes de statistiques |
|---|---|---|---|---|---|
| Trempe-Rouge | Entailles | +12 % · 0 % | +23 % · 6 % | +30 % · 13 % | +18 % · 8 % |
| Enclumier | Tisons | +29 % · 25 % | +38 % · 36 % | +38 % · 35 % | +21 % · 0 % |
| Rémouleur | Tisons | +31 % · 38 % | +44 % · 42 % | +45 % · 42 % | +23 % · 1 % |
| Tue-Bête | Entailles | +20 % · 3 % | +23 % · 4 % | +29 % · 4 % | +15 % · 1 % |
| Piégeur | Entailles | +19 % · 1 % | +23 % · 1 % | +29 % · 3 % | +15 % · 0 % |
| Meneur de meute | Ferveur | +29 % · 83 % | +32 % · 92 % | +33 % · 93 % | +14 % · 0 % |
| Fulgurant | Échos | +20 % · 3 % | +22 % · 4 % | +28 % · 17 % | +8 % · 0 % |
| Sigillaire | Frimas | +33 % · 15 % | +38 % · 25 % | +39 % · 31 % | +16 % · 0 % |
| Glyphiste | Échos | +28 % · 0 % | +30 % · 7 % | +35 % · 19 % | +13 % · 0 % |

## En paliers d’avance (murs complets)

Mur du build / mur du témoin, moyenne géométrique des 18 rencontres, en paliers (×1,096 chacun).

| Voie | Témoin + lignes de statistiques | Meilleur build | Build médian | Meilleur archétype | Moins bon archétype |
|---|---|---|---|---|---|
| Trempe-Rouge | 1,0 (+9 %) | 1,2 (+11 %) | 0,9 (+8 %) | 1,2 (+12 %) | 2,0 (+20 %) |
| Enclumier | 0,9 (+9 %) | 2,2 (+22 %) | 1,2 (+12 %) | 1,7 (+17 %) | 2,1 (+21 %) |
| Rémouleur | 1,0 (+10 %) | 2,0 (+20 %) | 1,0 (+10 %) | 1,9 (+20 %) | 2,5 (+25 %) |
| Tue-Bête | 0,7 (+7 %) | 1,0 (+10 %) | 0,4 (+4 %) | 1,0 (+10 %) | 0,7 (+7 %) |
| Piégeur | 0,6 (+6 %) | 0,9 (+8 %) | 0,4 (+4 %) | 1,0 (+10 %) | 1,7 (+17 %) |
| Meneur de meute | 0,7 (+7 %) | 2,3 (+23 %) | 0,4 (+4 %) | 2,3 (+23 %) | 0,7 (+7 %) |
| Fulgurant | 0,6 (+6 %) | 1,2 (+12 %) | 0,7 (+7 %) | 1,2 (+12 %) | 2,2 (+22 %) |
| Sigillaire | 0,5 (+5 %) | 1,6 (+16 %) | 0,6 (+5 %) | 1,6 (+16 %) | 2,2 (+22 %) |
| Glyphiste | 0,7 (+7 %) | 1,4 (+13 %) | 0,8 (+8 %) | 1,4 (+13 %) | 1,3 (+13 %) |
