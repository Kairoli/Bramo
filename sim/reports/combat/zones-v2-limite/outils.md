# Outils de situation · zones-v2-limite

> Généré par `pnpm --filter @bramo/sim sim combat-tools`. Ne pas modifier à la main.

Diagnostic : zones de renforts et de garde avec une limite de combat de 600 s au lieu de 240 s.

**Méthode.** Difficulté couplée : dégâts ennemis × D, PV (et garde, soins ennemis) × D^1,5, délai de fureur × D^1,5. Mur : plus haut D gagné à 90 % ; grille 1,000 / 1,125 / 1,250 / 1,400 / 1,500 / 1,600 / 1,750 / 2,000 / 2,250 / 2,500 / 2,800 / 3,125 / 3,500 / 4,000 / 4,500 / 5,000 / 6,000, puis encadrement à 3 %. Plans : 5+ finalistes du criblage du kit par voie (répertoire 80), quatre ouvertures chacun (tout à 0 s, ou le sort le plus fort à 4, 8 ou 10 s) et les priorités de cible utiles ; ouverture « séquence ». Choix du réglage sur 4 graines puis 32 graines (2000+) ; mur rejoué sur 64 graines réservées (10000+), descendu de 3 % tant qu'elles ne passent pas à 90 %. Témoin : aucun outil, statistiques normalisées (P 100, PV 2 800 au répertoire 80) ; un outil hors de sa mécanique vaut zéro par construction.

**Ratio** : mur de l’outil / mur du témoin, même voie (multiplicatif : ×2 → ×2,25 = +12,5 %).

## Critères d’acceptation solo

1. **Outil adapté ≥ ×1,25 pour chaque voie : 0 zone sur 12** (critère : au moins 6) — **non tenu**.

| Zone | Famille | Ratio médian (set 4) | Pire voie | Voies ≥ ×1,25 |
|---|---|---|---|---|
| La Chaussée des lanternes | interstice | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |
| Les Fossés gris | rain | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |
| La Cour des trois coups | impact | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |
| Les Vergers de verre | beat | ×1,18 | ×1,11 (Fulgurant) | 2/9 |
| Le Cloître des balances | fracture | ×1,00 | ×1,00 (Trempe-Rouge) | 0/9 |
| Les Fours de recuit | breath | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |
| La Salle des échos | interstice | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |
| Le Gué des plaies | rain, impact | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |
| La Chambre aux deux sceaux | fracture | ×1,00 | ×1,00 (Trempe-Rouge) | 0/9 |
| Les Terrasses de la vigie | impact | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |
| L’Atelier des mauvais jours | beat | ×1,05 | ×1,00 (Enclumier) | 0/9 |
| Le Belvédère des trois vents | impact, breath | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |

2. **Chaque outil premier de sa catégorie dans au moins deux zones** (mur médian des neuf voies, entre outils de même rang ; une zone sans aucun outil de la catégorie qui dépasse le témoin ne compte pour personne).

| Rang | interstice | rain | impact | beat | fracture | breath |
|---|---|---|---|---|---|---|
| set4 | 0 **✗** | 0 **✗** | 0 **✗** | 2 | 0 **✗** | 0 **✗** |
| gem | 0 **✗** | 0 **✗** | 0 **✗** | 2 | 0 **✗** | 0 **✗** |
| prep | 0 **✗** | 0 **✗** | 0 **✗** | 1 **✗** | 0 **✗** | 0 **✗** |

3. **Mur ≥ ×1,5 avec le meilleur outil, partout** — **non tenu : 72 cas** : Trempe-Rouge · La Chaussée des lanternes (×-Infinity) ; Trempe-Rouge · Les Fossés gris (×-Infinity) ; Trempe-Rouge · La Cour des trois coups (×-Infinity) ; Trempe-Rouge · Les Fours de recuit (×-Infinity) ; Trempe-Rouge · La Salle des échos (×-Infinity) ; Trempe-Rouge · Le Gué des plaies (×-Infinity) ; Trempe-Rouge · Les Terrasses de la vigie (×-Infinity) ; Trempe-Rouge · Le Belvédère des trois vents (×-Infinity) ; Enclumier · La Chaussée des lanternes (×-Infinity) ; Enclumier · Les Fossés gris (×-Infinity) ; Enclumier · La Cour des trois coups (×-Infinity) ; Enclumier · Les Fours de recuit (×-Infinity) ; Enclumier · La Salle des échos (×-Infinity) ; Enclumier · Le Gué des plaies (×-Infinity) ; Enclumier · Les Terrasses de la vigie (×-Infinity) ; Enclumier · Le Belvédère des trois vents (×-Infinity) ; Rémouleur · La Chaussée des lanternes (×-Infinity) ; Rémouleur · Les Fossés gris (×-Infinity) ; Rémouleur · La Cour des trois coups (×-Infinity) ; Rémouleur · Les Fours de recuit (×-Infinity) ; Rémouleur · La Salle des échos (×-Infinity) ; Rémouleur · Le Gué des plaies (×-Infinity) ; Rémouleur · Les Terrasses de la vigie (×-Infinity) ; Rémouleur · Le Belvédère des trois vents (×-Infinity) ; Tue-Bête · La Chaussée des lanternes (×-Infinity) ; Tue-Bête · Les Fossés gris (×-Infinity) ; Tue-Bête · La Cour des trois coups (×-Infinity) ; Tue-Bête · Les Fours de recuit (×-Infinity) ; Tue-Bête · La Salle des échos (×-Infinity) ; Tue-Bête · Le Gué des plaies (×-Infinity) ; Tue-Bête · Les Terrasses de la vigie (×-Infinity) ; Tue-Bête · Le Belvédère des trois vents (×-Infinity) ; Piégeur · La Chaussée des lanternes (×-Infinity) ; Piégeur · Les Fossés gris (×-Infinity) ; Piégeur · La Cour des trois coups (×-Infinity) ; Piégeur · Les Fours de recuit (×-Infinity) ; Piégeur · La Salle des échos (×-Infinity) ; Piégeur · Le Gué des plaies (×-Infinity) ; Piégeur · Les Terrasses de la vigie (×-Infinity) ; Piégeur · Le Belvédère des trois vents (×-Infinity) ; Meneur de meute · La Chaussée des lanternes (×-Infinity) ; Meneur de meute · Les Fossés gris (×-Infinity) ; Meneur de meute · La Cour des trois coups (×-Infinity) ; Meneur de meute · Les Fours de recuit (×-Infinity) ; Meneur de meute · La Salle des échos (×-Infinity) ; Meneur de meute · Le Gué des plaies (×-Infinity) ; Meneur de meute · Les Terrasses de la vigie (×-Infinity) ; Meneur de meute · Le Belvédère des trois vents (×-Infinity) ; Fulgurant · La Chaussée des lanternes (×-Infinity) ; Fulgurant · Les Fossés gris (×-Infinity) ; Fulgurant · La Cour des trois coups (×-Infinity) ; Fulgurant · Les Fours de recuit (×-Infinity) ; Fulgurant · La Salle des échos (×-Infinity) ; Fulgurant · Le Gué des plaies (×-Infinity) ; Fulgurant · Les Terrasses de la vigie (×-Infinity) ; Fulgurant · Le Belvédère des trois vents (×-Infinity) ; Sigillaire · La Chaussée des lanternes (×-Infinity) ; Sigillaire · Les Fossés gris (×-Infinity) ; Sigillaire · La Cour des trois coups (×-Infinity) ; Sigillaire · Les Fours de recuit (×-Infinity) ; Sigillaire · La Salle des échos (×-Infinity) ; Sigillaire · Le Gué des plaies (×-Infinity) ; Sigillaire · Les Terrasses de la vigie (×-Infinity) ; Sigillaire · Le Belvédère des trois vents (×-Infinity) ; Glyphiste · La Chaussée des lanternes (×-Infinity) ; Glyphiste · Les Fossés gris (×-Infinity) ; Glyphiste · La Cour des trois coups (×-Infinity) ; Glyphiste · Les Fours de recuit (×-Infinity) ; Glyphiste · La Salle des échos (×-Infinity) ; Glyphiste · Le Gué des plaies (×-Infinity) ; Glyphiste · Les Terrasses de la vigie (×-Infinity) ; Glyphiste · Le Belvédère des trois vents (×-Infinity).

4. **Voie de dégâts la plus rapide de sa classe dans au moins 7 zones** (danger normal, meilleur outil de chaque voie, ≥ 90 % de victoires).

| Classe | Zones où le DPS est le plus rapide | Zones perdues (voie plus rapide) |
|---|---|---|
| Le cycle de forge | 12/12 | — |
| La poursuite | 11/12 | Le Cloître des balances (Piégeur 60,3 s contre 79,3 s) |
| La phrase runique | 10/12 | Les Vergers de verre (Glyphiste 69,0 s contre 75,5 s) ; Le Cloître des balances (Glyphiste 69,8 s contre 76,8 s) |

## Murs par zone

Chaque case : mur (graines réservées : victoires) et ratio au témoin. Ensuite : réglage du meilleur outil (ouverture, priorité).

### La Chaussée des lanternes

| Voie | aucun | Heures creuses (4) | Opale d’interstice | Tonique de synchronie | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | — | — | — | — | — |
| Piégeur | — | — | — | — | — |
| Meneur de meute | — | — | — | — | — |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### Les Fossés gris

| Voie | aucun | Habits de pluie (4) | Perle de lessive | Rinçage clair | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | — | — | — | — | — |
| Piégeur | — | — | — | — | — |
| Meneur de meute | — | — | — | — | — |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### La Cour des trois coups

| Voie | aucun | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | — | — | — | — | — |
| Piégeur | — | — | — | — | — |
| Meneur de meute | — | — | — | — | — |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### Les Vergers de verre

| Voie | aucun | Passeurs de braise (4) | Grenat de battue | Huile de battue | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×1,60 | ×1,90 (+19 %) | ×1,87 (+17 %) | ×1,81 (+13 %) | Passeurs de braise (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · adds_first |
| Enclumier | ×1,60 | ×1,97 (+23 %) | ×1,78 (+11 %) | ×1,71 (+7 %) | Passeurs de braise (4) : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, Coins d’arrêt · ouverture fg_workshop@10 · adds_first |
| Rémouleur | ×1,75 | ×2,06 (+18 %) | ×1,94 (+11 %) | ×1,97 (+12 %) | Passeurs de braise (4) : Garde rouge, Coup de travers, Refroidissement, Pose de rivets, Recuit partagé · ouverture 0 · adds_first |
| Tue-Bête | ×1,50 | ×1,67 (+12 %) | ×1,60 (+7 %) | ×1,57 (+5 %) | Passeurs de braise (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · adds_first |
| Piégeur | ×1,55 | ×1,78 (+15 %) | ×1,71 (+10 %) | ×1,67 (+8 %) | Passeurs de braise (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · adds_first |
| Meneur de meute | ×1,75 | ×2,06 (+18 %) | ×2,00 (+14 %) | ×2,00 (+14 %) | Passeurs de braise (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · adds_first |
| Fulgurant | ×1,81 | ×2,00 (+11 %) | ×2,06 (+14 %) | ×1,97 (+9 %) | Grenat de battue : Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer, La Phrase souveraine · ouverture rn_sovereign@10 · adds_first |
| Sigillaire | ×1,75 | ×2,25 (+29 %) | ×2,06 (+18 %) | ×2,00 (+14 %) | Passeurs de braise (4) : Cercle de givre, Sceau de garde, Sceau de répit, Sceau du foyer, La Phrase souveraine · ouverture rn_sovereign@10 · adds_first |
| Glyphiste | ×1,75 | ×2,24 (+28 %) | ×2,06 (+18 %) | ×1,97 (+12 %) | Passeurs de braise (4) : Trait incandescent, Sceau de garde, Sceau de répit, Sceau du foyer, Sceau de résonance · ouverture rn_ember@10 · adds_first |

### Le Cloître des balances

| Voie | aucun | Mains de traverse (4) | Œil de faille | Poudre de coin | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×1,81 | ×1,81 (+0 %) | ×1,81 (+0 %) | ×1,81 (+0 %) | aucun : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture fg_second_strike@4 · chief |
| Enclumier | ×1,81 | ×1,81 (+0 %) | ×1,81 (+0 %) | ×1,81 (+0 %) | aucun : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, La Grande Trempe · ouverture 0 · chief |
| Rémouleur | ×2,25 | ×2,25 (+0 %) | ×2,25 (+0 %) | ×2,25 (+0 %) | aucun : Frappe d’atelier, Refroidissement, Pose de rivets, Recuit partagé, Plaque maîtresse · ouverture 0 · chief |
| Tue-Bête | ×1,55 | ×1,60 (+3 %) | ×1,60 (+3 %) | ×1,55 (+0 %) | Mains de traverse (4) : Sifflet bref, Repli couvert, Battement de meute, Filet d’orage, La Grande Battue · ouverture 0 · chief |
| Piégeur | ×1,67 | ×1,67 (+0 %) | ×1,67 (+0 %) | ×1,67 (+0 %) | aucun : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · chief |
| Meneur de meute | ×2,25 | ×2,25 (+0 %) | ×2,25 (+0 %) | ×2,25 (+0 %) | aucun : Repli couvert, Battement de meute, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | ×2,18 | ×2,18 (+0 %) | ×2,18 (+0 %) | ×2,18 (+0 %) | aucun : Cercle de givre, Sceau de garde, Sceau de répit, Sceau du foyer, Rature ardente · ouverture 0 · chief |
| Sigillaire | ×2,31 | ×2,31 (+0 %) | ×2,31 (+0 %) | ×2,31 (+0 %) | aucun : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture 0 · chief |
| Glyphiste | ×2,44 | ×2,44 (+0 %) | ×2,44 (+0 %) | ×2,44 (+0 %) | aucun : Trait incandescent, Sceau de garde, Sceau de répit, Sceau du foyer, Sceau de résonance · ouverture rn_ember@4 · chief |

### Les Fours de recuit

| Voie | aucun | Veilleurs du Sceau (4) | Ambre de reprise | Infusion de reprise | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | — | — | — | — | — |
| Piégeur | — | — | — | — | — |
| Meneur de meute | — | — | — | — | — |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### La Salle des échos

| Voie | aucun | Heures creuses (4) | Opale d’interstice | Tonique de synchronie | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | — | — | — | — | — |
| Piégeur | — | — | — | — | — |
| Meneur de meute | — | — | — | — | — |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### Le Gué des plaies

| Voie | aucun | Habits de pluie (4) | Perle de lessive | Rinçage clair | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Meilleur réglage |
|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — | — | — | — |
| Enclumier | — | — | — | — | — | — | — | — |
| Rémouleur | — | — | — | — | — | — | — | — |
| Tue-Bête | — | — | — | — | — | — | — | — |
| Piégeur | — | — | — | — | — | — | — | — |
| Meneur de meute | — | — | — | — | — | — | — | — |
| Fulgurant | — | — | — | — | — | — | — | — |
| Sigillaire | — | — | — | — | — | — | — | — |
| Glyphiste | — | — | — | — | — | — | — | — |

### La Chambre aux deux sceaux

| Voie | aucun | Mains de traverse (4) | Œil de faille | Poudre de coin | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×2,12 | ×2,12 (+0 %) | ×2,12 (+0 %) | ×2,12 (+0 %) | aucun : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · unguarded_first |
| Enclumier | ×2,31 | ×2,31 (+0 %) | ×2,31 (+0 %) | ×2,31 (+0 %) | aucun : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, Coins d’arrêt · ouverture 0 · chief |
| Rémouleur | ×2,50 | ×2,50 (+0 %) | ×2,50 (+0 %) | ×2,50 (+0 %) | aucun : Coup de travers, Refroidissement, Pose de rivets, Recuit partagé, Plaque maîtresse · ouverture fg_crosscut@4 · unguarded_first |
| Tue-Bête | ×1,84 | ×1,87 (+2 %) | ×1,84 (+0 %) | ×1,84 (+0 %) | Mains de traverse (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · unguarded_first |
| Piégeur | ×2,06 | ×2,06 (+0 %) | ×2,06 (+0 %) | ×2,06 (+0 %) | aucun : Sifflet bref, Repli couvert, Battement de meute, Filet d’orage, La Grande Battue · ouverture 0 · chief |
| Meneur de meute | ×2,44 | ×2,44 (+0 %) | ×2,44 (+0 %) | ×2,44 (+0 %) | aucun : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture tr_packreturn@8 · chief |
| Fulgurant | ×2,44 | ×2,44 (+0 %) | ×2,44 (+0 %) | ×2,44 (+0 %) | aucun : Cercle de givre, Sceau de garde, Sceau de répit, Sceau du foyer, Rature ardente · ouverture 0 · unguarded_first |
| Sigillaire | ×2,57 | ×2,57 (+0 %) | ×2,57 (+0 %) | ×2,57 (+0 %) | aucun : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture 0 · unguarded_first |
| Glyphiste | ×2,72 | ×2,72 (+0 %) | ×2,72 (+0 %) | ×2,72 (+0 %) | aucun : Sceau de garde, Sceau de répit, Sceau du foyer, Sceau de résonance, Cercle du refuge · ouverture 0 · unguarded_first |

### Les Terrasses de la vigie

| Voie | aucun | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | — | — | — | — | — |
| Piégeur | — | — | — | — | — |
| Meneur de meute | — | — | — | — | — |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### L’Atelier des mauvais jours

| Voie | aucun | Passeurs de braise (4) | Grenat de battue | Huile de battue | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×2,12 | ×2,25 (+6 %) | ×2,25 (+6 %) | ×2,25 (+6 %) | Passeurs de braise (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · adds_first |
| Enclumier | ×2,25 | ×2,25 (+0 %) | ×2,25 (+0 %) | ×2,25 (+0 %) | aucun : Frappe d’atelier, Garde rouge, Coup de travers, Refroidissement, Rivet de garde · ouverture 0 · adds_first |
| Rémouleur | ×2,50 | ×2,65 (+6 %) | ×2,57 (+3 %) | ×2,57 (+3 %) | Passeurs de braise (4) : Garde rouge, Coup de travers, Refroidissement, Pose de rivets, Recuit partagé · ouverture 0 · adds_first |
| Tue-Bête | ×1,84 | ×1,93 (+5 %) | ×1,90 (+3 %) | ×1,90 (+3 %) | Passeurs de braise (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · adds_first |
| Piégeur | ×2,00 | ×2,12 (+6 %) | ×2,12 (+6 %) | ×2,06 (+3 %) | Passeurs de braise (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · adds_first |
| Meneur de meute | ×2,44 | ×2,50 (+3 %) | ×2,50 (+3 %) | ×2,44 (+0 %) | Passeurs de braise (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · adds_first |
| Fulgurant | ×2,50 | ×2,50 (+0 %) | ×2,50 (+0 %) | ×2,50 (+0 %) | aucun : Cercle de givre, Sceau de garde, Sceau de répit, Sceau du foyer, Rature ardente · ouverture 0 · adds_first |
| Sigillaire | ×2,65 | ×2,88 (+9 %) | ×2,88 (+9 %) | ×2,80 (+6 %) | Passeurs de braise (4) : Cercle de givre, Sceau de garde, Sceau de répit, Sceau du foyer, La Phrase souveraine · ouverture rn_sovereign@8 · adds_first |
| Glyphiste | ×2,88 | ×2,96 (+3 %) | ×2,96 (+3 %) | ×2,96 (+3 %) | Passeurs de braise (4) : Sceau de garde, Sceau de répit, Sceau du foyer, Sceau de résonance, Cercle du refuge · ouverture 0 · adds_first |

### Le Belvédère des trois vents

| Voie | aucun | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Veilleurs du Sceau (4) | Ambre de reprise | Infusion de reprise | Meilleur réglage |
|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — | — | — | — |
| Enclumier | — | — | — | — | — | — | — | — |
| Rémouleur | — | — | — | — | — | — | — | — |
| Tue-Bête | — | — | — | — | — | — | — | — |
| Piégeur | — | — | — | — | — | — | — | — |
| Meneur de meute | — | — | — | — | — | — | — | — |
| Fulgurant | — | — | — | — | — | — | — | — |
| Sigillaire | — | — | — | — | — | — | — | — |
| Glyphiste | — | — | — | — | — | — | — | — |

## Échecs juste au-dessus du mur

Causes des défaites à mur × 1,03 (graines de confirmation), meilleur outil de chaque case.

- mort:attack : 3470
- temps : 8

