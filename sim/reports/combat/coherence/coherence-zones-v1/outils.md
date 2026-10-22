# Outils de situation contre un vrai généraliste

> Généré par `pnpm --filter @bramo/sim sim combat-coherence --step tools`. Ne pas modifier à la main.

**Méthode.** Généraliste de chaque voie : sa meilleure paire d’ensembles du dossier (4+4, indice sur les 18 rencontres) et sa meilleure combinaison de quatre gemmes (criblage), statistiques réelles du témoin palier 20 Rare. Candidats dans chaque zone, pour chaque famille présente : **ensemble de situation** à la place du plus faible des deux ensembles (4 pièces contre 4) ; **gemme de situation** à la place de la gemme la moins utile ; **préparation** en plus. Pour comparer à `verification-claude.md`, le témoin nu (ni ensemble ni gemme) et l’ensemble de situation seul. Pour chaque cas, le meilleur des plans de la voie et des priorités de cible utiles ; mur sur 24 graines.

## Généralistes retenus

| Voie | Paire d’ensembles | Gemmes |
|---|---|---|
| Trempe-Rouge | L'Orage contenu + Les Rivets du serment | Cendre vive, Rythme, Assistance fine, Frimas tenace |
| Enclumier | L'Orage contenu + Les Rivets du serment | Assistance fine, Frimas tenace, Patience taillée, Tranchant net |
| Rémouleur | La Vigie sans sommeil + Les Rivets du serment | Cendre vive, Rythme, Garde alternée, Patience taillée |
| Tue-Bête | L'Enclume patiente + Les Pas dans les pas | Cendre vive, Assistance fine, Marque de retour, Abri de cendre |
| Piégeur | L'Enclume patiente + La Vigie sans sommeil | Cendre vive, Rythme, Marque de retour, Grâce oblique |
| Meneur de meute | L'Enclume patiente + Les Pas dans les pas | Cendre vive, Garde alternée, Patience taillée, Dernière étincelle |
| Fulgurant | L'Enclume patiente + La Vigie sans sommeil | Cendre vive, Rythme, Garde alternée, Pouls régulier |
| Sigillaire | L'Enclume patiente + La Phrase inachevée | Cendre vive, Assistance fine, Éclat de passage, Tranchant net |
| Glyphiste | L'Enclume patiente + La Vigie sans sommeil | Cendre vive, Rythme, Assistance fine, Garde alternée |

## Ce que gagne l’outil adapté

Ratio du mur, même voie. **Réel** : contre le généraliste (on retire 4 pièces d’ensemble ou une gemme pour le porter). **Majorant** : ensemble seul contre le témoin nu (mesure de `verification-claude.md`).

Entre parenthèses : en **paliers d’avance** (un palier de la courbe proposée, +12 % de P et de PV, vaut ×1,096 de mur).

| Zone | Famille | Ensemble (réel) médiane | Pire voie | Voies ≥ ×1,25 · ≥ 1 palier | Gemme (réel) médiane | Préparation médiane | Ensemble seul / nu (majorant) |
|---|---|---|---|---|---|---|---|
| La Chaussée des lanternes | interstice | ×1,40 (3,7) | ×1,12 (1,2) Tue-Bête | 7/9 · 9/9 | ×1,29 (2,7) | ×1,12 (1,2) | ×1,44 (4,0) |
| Les Fossés gris | rain | ×1,09 (0,9) | ×1,00 (0,0) Rémouleur | 3/9 · 3/9 | ×1,12 (1,2) | ×1,03 (0,3) | ×1,15 (1,5) |
| La Cour des trois coups | impact | ×1,48 (4,3) | ×1,36 (3,3) Enclumier | 9/9 · 9/9 | ×1,32 (3,0) | ×1,12 (1,2) | ×1,44 (4,0) |
| Les Vergers de verre (refaits) | beat | ×1,25 (2,4) | ×1,18 (1,8) Enclumier | 5/9 · 9/9 | ×1,18 (1,8) | ×1,15 (1,5) | ×1,25 (2,4) |
| Le Cloître des balances (refait) | fracture | ×1,06 (0,6) | ×1,03 (0,3) Trempe-Rouge | 0/9 · 3/9 | ×1,03 (0,3) | ×1,00 (0,0) | ×1,15 (1,5) |
| Les Fours de recuit | breath | ×1,29 (2,7) | ×1,06 (0,6) Glyphiste | 5/9 · 7/9 | ×1,18 (1,8) | ×1,15 (1,5) | ×1,36 (3,3) |
| La Salle des échos | interstice | ×1,44 (4,0) | ×1,25 (2,4) Tue-Bête | 9/9 · 9/9 | ×1,32 (3,0) | ×1,15 (1,5) | ×1,52 (4,6) |
| Le Gué des plaies | rain | ×1,22 (2,1) | ×1,15 (1,5) Trempe-Rouge | 3/9 · 9/9 | ×1,12 (1,2) | ×1,06 (0,6) | ×1,22 (2,1) |
| Le Gué des plaies | impact | ×1,06 (0,6) | ×1,00 (0,0) Tue-Bête | 0/9 · 0/9 | ×1,06 (0,6) | ×1,03 (0,3) | ×1,06 (0,6) |
| La Chambre aux deux sceaux | fracture | ×1,00 (0,0) | ×0,95 (-0,6) Fulgurant | 0/9 · 0/9 | ×1,00 (0,0) | ×1,00 (0,0) | ×1,03 (0,3) |
| Les Terrasses de la vigie | impact | ×1,44 (4,0) | ×1,36 (3,3) Tue-Bête | 9/9 · 9/9 | ×1,32 (3,0) | ×1,22 (2,1) | ×1,48 (4,3) |
| L’Atelier des mauvais jours (refait) | beat | ×1,00 (0,0) | ×1,00 (0,0) Rémouleur | 0/9 · 0/9 | ×1,03 (0,3) | ×1,03 (0,3) | ×1,06 (0,6) |
| Le Belvédère des trois vents | impact | ×1,03 (0,3) | ×1,00 (0,0) Rémouleur | 0/9 · 0/9 | ×1,06 (0,6) | ×1,03 (0,3) | ×1,06 (0,6) |
| Le Belvédère des trois vents | breath | ×1,29 (2,7) | ×1,18 (1,8) Rémouleur | 8/9 · 9/9 | ×1,15 (1,5) | ×1,12 (1,2) | ×1,32 (3,0) |

**Critère 1 du PvE v2 (outil adapté ≥ ×1,25 contre le généraliste, pour chaque voie) : 3 zones sur 12** (cible : au moins 6). Avec la cible proposée ici (≥ 1 palier d’avance, ×1,096) : **7 zones sur 12**.

**Critère 2 (chaque famille première dans au moins deux zones)** — ensemble : interstice 2, rain 2, impact 2, beat 2, fracture 2, breath 2 ; gemme : interstice 2, rain 2, impact 2, beat 2, fracture 2, breath 2.

## Échecs juste au-dessus du mur

- mort:attack : 6776
- mort:aura : 3326
- temps : 3323
- mort:charge : 945

