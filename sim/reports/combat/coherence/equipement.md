# Courbe d’équipement du catalogue (étape 5a)

> Généré par `pnpm --filter @bramo/sim sim combat-coherence --step gear`. Ne pas modifier à la main.

**Méthode.** Chaque voie joue son plan conseillé du répertoire 80 (le même pour tous les kits : seul l’équipement change), sans talent ni outil. Statistiques : kits du catalogue convertis par `coherence-v1` (témoin palier 20 Rare mixte ≈ P 100, PV 2 800). Rencontres : six profils du banc et douze zones du PvE v2. Difficulté couplée (dégâts × D, PV × D^1,5) ; mur = plus haut D gagné à 90 % sur 24 graines (5000+), encadré à 3 %. Un cran = ×1,25.

## Ce que vaut un palier, une rareté, une orientation

| Passage | Mur (médiane) | Crans | Plus faible | Plus fort |
|---|---|---|---|---|
| Palier 1 → 10 (Commun) | ×1,56 | 2,00 | ×1,44 | ×1,95 |
| Palier 10 → 20 (Commun) | ×1,29 | 1,13 | ×1,25 | ×1,44 |
| Palier 1 → 10 (Rare) | ×1,61 | 2,13 | ×1,52 | ×2,01 |
| Palier 10 → 20 (Rare) | ×1,32 | 1,25 | ×1,22 | ×1,44 |
| Commun → Rare (palier 20) | ×1,23 | 0,94 | ×1,15 | ×1,32 |
| Rare → Épique (palier 20) | ×1,12 | 0,50 | ×1,03 | ×1,18 |
| Épique → Légendaire (palier 20) | ×0,92 | -0,37 | ×0,80 | ×0,97 |
| Rare du palier 10 → Commun du palier 20 | ×1,06 | 0,25 | ×1,00 | ×1,22 |
| Mixte → protecteur (palier 20 Rare) | ×0,92 | -0,37 | ×0,82 | ×0,97 |
| Mixte → offensif (palier 20 Rare) | ×1,03 | 0,13 | ×0,92 | ×1,22 |
| Lignes aléatoires moyennes (palier 20 Rare) | ×1,18 | 0,75 | ×1,03 | ×1,32 |

## Orientation : protecteur ou offensif, selon la rencontre

Ratio du mur protecteur / offensif (palier 20 Rare), médiane des neuf voies. Au-dessus de 1, l’armure protectrice franchit plus haut.

| Rencontre | Protecteur / offensif | Voies où le protecteur gagne |
|---|---|---|
| Cible durable | ×0,95 | 0/9 |
| Groupe compact | ×0,95 | 0/9 |
| Attaque chargée | ×0,95 | 0/9 |
| Usure régulière | ×0,92 | 0/9 |
| Gardes à dissiper | ×0,89 | 0/9 |
| Soin ennemi | ×0,92 | 0/9 |
| La Chaussée des lanternes | ×0,97 | 0/9 |
| Les Fossés gris | ×0,87 | 0/9 |
| La Cour des trois coups | ×0,92 | 0/9 |
| Les Vergers de verre | ×0,82 | 0/9 |
| Le Cloître des balances | ×0,82 | 0/9 |
| Les Fours de recuit | ×0,89 | 0/9 |
| La Salle des échos | ×0,97 | 0/9 |
| Le Gué des plaies | ×0,87 | 0/9 |
| La Chambre aux deux sceaux | ×0,82 | 0/9 |
| Les Terrasses de la vigie | ×0,89 | 0/9 |
| L’Atelier des mauvais jours | ×0,95 | 0/9 |
| Le Belvédère des trois vents | ×0,89 | 0/9 |

## Murs par voie (palier 20 Rare mixte) et par kit (moyenne géométrique sur les 18 rencontres)

| Voie | t1_common | t1_rare | t1_epic | t1_legendary | t10_common | t10_rare | t10_epic | t10_legendary | t20_common | t20_rare | t20_epic | t20_legendary | t20_rare_protective | t20_rare_offensive | t20_rare_rolls |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | ×0,56 | ×0,65 | ×0,71 | ×0,65 | ×0,87 | ×1,03 | ×1,14 | ×1,06 | ×1,12 | ×1,35 | ×1,50 | ×1,41 | ×1,27 | ×1,34 | ×1,62 |
| Enclumier | ×0,55 | ×0,63 | ×0,69 | ×0,64 | ×0,87 | ×1,02 | ×1,13 | ×1,04 | ×1,10 | ×1,32 | ×1,48 | ×1,39 | ×1,25 | ×1,35 | ×1,60 |
| Rémouleur | ×0,53 | ×0,61 | ×0,67 | ×0,61 | ×0,84 | ×1,00 | ×1,11 | ×1,02 | ×1,09 | ×1,31 | ×1,48 | ×1,38 | ×1,23 | ×1,34 | ×1,59 |
| Tue-Bête | ×0,49 | ×0,57 | ×0,63 | ×0,56 | ×0,76 | ×0,92 | ×1,00 | ×0,91 | ×0,98 | ×1,20 | ×1,33 | ×1,21 | ×1,12 | ×1,22 | ×1,41 |
| Piégeur | ×0,50 | ×0,59 | ×0,65 | ×0,58 | ×0,79 | ×0,95 | ×1,04 | ×0,94 | ×1,00 | ×1,23 | ×1,37 | ×1,27 | ×1,15 | ×1,26 | ×1,45 |
| Meneur de meute | ×0,49 | ×0,58 | ×0,64 | ×0,56 | ×0,79 | ×0,98 | ×1,07 | ×0,95 | ×1,05 | ×1,31 | ×1,46 | ×1,30 | ×1,18 | ×1,38 | ×1,53 |
| Fulgurant | ×0,54 | ×0,63 | ×0,68 | ×0,62 | ×0,84 | ×1,03 | ×1,12 | ×1,03 | ×1,09 | ×1,37 | ×1,51 | ×1,40 | ×1,27 | ×1,43 | ×1,63 |
| Sigillaire | ×0,55 | ×0,64 | ×0,69 | ×0,63 | ×0,86 | ×1,05 | ×1,15 | ×1,06 | ×1,10 | ×1,38 | ×1,52 | ×1,43 | ×1,29 | ×1,43 | ×1,63 |
| Glyphiste | ×0,53 | ×0,62 | ×0,68 | ×0,61 | ×0,87 | ×1,06 | ×1,17 | ×1,05 | ×1,14 | ×1,44 | ×1,59 | ×1,45 | ×1,31 | ×1,54 | ×1,71 |

## Échecs juste au-dessus du mur

- mort:attack : 26581
- mort:aura : 6019
- mort:charge : 1847
- temps : 1292

