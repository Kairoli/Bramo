# Courbe d’équipement du catalogue (étape 5a)

> Généré par `pnpm --filter @bramo/sim sim combat-coherence --step gear`. Ne pas modifier à la main.

**Méthode.** Chaque voie joue son plan conseillé du répertoire 80 (le même pour tous les kits : seul l’équipement change), sans talent ni outil. Statistiques : kits du catalogue convertis par `coherence-v2` (témoin palier 20 Rare mixte ≈ P 100, PV 2 800). Rencontres : six profils du banc et douze zones du PvE v2. Difficulté couplée (dégâts × D, PV × D^1,5) ; mur = plus haut D gagné à 90 % sur 24 graines (5000+), encadré à 3 %. Un cran = ×1,25.

## Ce que vaut un palier, une rareté, une orientation

| Passage | Mur (médiane) | Crans | Plus faible | Plus fort |
|---|---|---|---|---|
| Palier 1 → 10 (Rare) | ×1,09 | 0,38 | ×1,06 | ×1,12 |
| Palier 10 → 20 (Rare) | ×1,09 | 0,38 | ×1,06 | ×1,12 |
| Palier 20 → 30 (Rare) | ×1,12 | 0,50 | ×1,03 | ×1,22 |
| Palier 30 → 40 (Rare) | ×1,09 | 0,38 | ×1,06 | ×1,12 |
| Palier 40 → 50 (Rare) | ×1,09 | 0,38 | ×1,06 | ×1,12 |
| Palier 50 → 60 (Rare) | ×1,09 | 0,38 | ×1,06 | ×1,12 |
| Palier 60 → 70 (Rare) | ×1,09 | 0,38 | ×1,06 | ×1,12 |
| Palier 70 → 80 (Rare) | ×1,09 | 0,38 | ×1,06 | ×1,12 |
| Palier 80 → 90 (Rare) | ×1,09 | 0,38 | ×1,06 | ×1,12 |
| Commun → Rare (palier 20) | ×1,03 | 0,13 | ×1,00 | ×1,06 |
| Rare → Épique (palier 20) | ×1,03 | 0,13 | ×0,95 | ×1,12 |
| Épique → Légendaire (palier 20) | ×1,03 | 0,13 | ×1,00 | ×1,06 |
| Commun → Rare (palier 60) | ×1,03 | 0,13 | ×1,00 | ×1,06 |
| Rare → Épique (palier 60) | ×1,00 | 0,00 | ×0,92 | ×1,06 |
| Épique → Légendaire (palier 60) | ×1,03 | 0,13 | ×1,00 | ×1,06 |
| Rare du palier 10 → Commun du palier 20 | ×1,06 | 0,25 | ×1,03 | ×1,09 |
| Mixte → protecteur (palier 20 Rare) | ×0,85 | -0,75 | ×0,54 | ×1,03 |
| Mixte → offensif (palier 20 Rare) | ×0,92 | -0,37 | ×0,80 | ×1,09 |
| Lignes aléatoires moyennes (palier 20 Rare) | ×1,03 | 0,13 | ×1,00 | ×1,09 |

## Orientation : protecteur ou offensif, selon la rencontre

Ratio du mur protecteur / offensif (palier 20 Rare), médiane des neuf voies. Au-dessus de 1, l’armure protectrice franchit plus haut.

| Rencontre | Protecteur / offensif | Voies où le protecteur gagne |
|---|---|---|
| Cible durable | ×1,00 | 1/9 |
| Groupe compact | ×1,00 | 2/9 |
| Attaque chargée | ×0,95 | 3/9 |
| Usure régulière | ×0,95 | 0/9 |
| Gardes à dissiper | ×0,92 | 0/9 |
| Soin ennemi | ×0,89 | 0/9 |
| La Chaussée des lanternes | ×0,97 | 2/9 |
| Les Fossés gris | ×0,85 | 0/9 |
| La Cour des trois coups | ×0,97 | 1/9 |
| Les Vergers de verre (refaits) | ×0,78 | 0/9 |
| Le Cloître des balances (refait, garde 420) | ×0,64 | 0/9 |
| Les Fours de recuit | ×0,92 | 0/9 |
| La Salle des échos | ×0,97 | 2/9 |
| Le Gué des plaies | ×0,85 | 0/9 |
| La Chambre aux deux sceaux | ×0,68 | 0/9 |
| Les Terrasses de la vigie | ×1,00 | 1/9 |
| L’Atelier des mauvais jours (refait) | ×1,09 | 7/9 |
| Le Belvédère des trois vents | ×0,89 | 0/9 |

## Murs par voie (palier 20 Rare mixte) et par kit (moyenne géométrique sur les 18 rencontres)

| Voie | t1_rare | t10_rare | t20_rare | t30_rare | t40_rare | t50_rare | t60_rare | t70_rare | t80_rare | t90_rare | t20_common | t20_epic | t20_legendary | t60_common | t60_epic | t60_legendary | t20_rare_protective | t20_rare_offensive | t20_rare_rolls |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | ×1,07 | ×1,17 | ×1,29 | ×1,45 | ×1,58 | ×1,73 | ×1,91 | ×2,08 | ×2,29 | ×2,48 | ×1,24 | ×1,34 | ×1,38 | ×1,85 | ×1,89 | ×1,94 | ×1,07 | ×1,15 | ×1,33 |
| Enclumier | ×1,05 | ×1,15 | ×1,26 | ×1,43 | ×1,57 | ×1,73 | ×1,87 | ×2,06 | ×2,26 | ×2,47 | ×1,22 | ×1,32 | ×1,36 | ×1,82 | ×1,86 | ×1,91 | ×1,04 | ×1,14 | ×1,32 |
| Rémouleur | ×1,04 | ×1,14 | ×1,24 | ×1,43 | ×1,56 | ×1,72 | ×1,88 | ×2,06 | ×2,26 | ×2,46 | ×1,20 | ×1,32 | ×1,36 | ×1,82 | ×1,86 | ×1,92 | ×0,99 | ×1,14 | ×1,31 |
| Tue-Bête | ×1,06 | ×1,16 | ×1,27 | ×1,34 | ×1,47 | ×1,61 | ×1,76 | ×1,92 | ×2,11 | ×2,31 | ×1,24 | ×1,26 | ×1,30 | ×1,71 | ×1,79 | ×1,84 | ×1,13 | ×1,16 | ×1,30 |
| Piégeur | ×1,08 | ×1,19 | ×1,30 | ×1,37 | ×1,50 | ×1,63 | ×1,79 | ×1,96 | ×2,16 | ×2,36 | ×1,26 | ×1,30 | ×1,35 | ×1,74 | ×1,83 | ×1,88 | ×1,16 | ×1,17 | ×1,33 |
| Meneur de meute | ×1,14 | ×1,25 | ×1,36 | ×1,44 | ×1,57 | ×1,73 | ×1,91 | ×2,09 | ×2,30 | ×2,51 | ×1,32 | ×1,36 | ×1,41 | ×1,85 | ×1,94 | ×1,99 | ×1,16 | ×1,27 | ×1,39 |
| Fulgurant | ×1,08 | ×1,18 | ×1,30 | ×1,44 | ×1,57 | ×1,72 | ×1,88 | ×2,05 | ×2,25 | ×2,46 | ×1,26 | ×1,36 | ×1,41 | ×1,81 | ×1,91 | ×1,97 | ×1,07 | ×1,24 | ×1,33 |
| Sigillaire | ×1,09 | ×1,20 | ×1,31 | ×1,46 | ×1,58 | ×1,73 | ×1,90 | ×2,07 | ×2,27 | ×2,48 | ×1,27 | ×1,35 | ×1,40 | ×1,84 | ×1,91 | ×1,97 | ×1,06 | ×1,25 | ×1,33 |
| Glyphiste | ×1,12 | ×1,23 | ×1,35 | ×1,50 | ×1,64 | ×1,80 | ×1,97 | ×2,17 | ×2,37 | ×2,61 | ×1,31 | ×1,43 | ×1,48 | ×1,91 | ×2,03 | ×2,08 | ×1,04 | ×1,33 | ×1,38 |

## Échecs juste au-dessus du mur

- mort:attack : 31554
- mort:aura : 6856
- mort:charge : 2349
- temps : 610

