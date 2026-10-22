# Outils de situation · zones-v2+zones-v2-repli

> Généré par `pnpm --filter @bramo/sim sim combat-tools`. Ne pas modifier à la main.

A/B : Repli couvert en part des PV max (zones-v2-repli) sur les trois voies du Traqueur ; les critères qui comparent les classes ne s'appliquent pas à ce rapport.

**Méthode.** Difficulté couplée : dégâts ennemis × D, PV (et garde, soins ennemis) × D^1,5, délai de fureur × D^1,5. Mur : plus haut D gagné à 90 % ; grille 1,000 / 1,125 / 1,250 / 1,400 / 1,500 / 1,600 / 1,750 / 2,000 / 2,250 / 2,500 / 2,800 / 3,125 / 3,500 / 4,000 / 4,500 / 5,000 / 6,000, puis encadrement à 3 %. Plans : 5+ finalistes du criblage du kit par voie (répertoire 80), quatre ouvertures chacun (tout à 0 s, ou le sort le plus fort à 4, 8 ou 10 s) et les priorités de cible utiles ; ouverture « séquence ». Choix du réglage sur 4 graines puis 32 graines (2000+) ; mur rejoué sur 64 graines réservées (10000+), descendu de 3 % tant qu'elles ne passent pas à 90 %. Témoin : aucun outil, statistiques normalisées (P 100, PV 2 800 au répertoire 80) ; un outil hors de sa mécanique vaut zéro par construction.

**Ratio** : mur de l’outil / mur du témoin, même voie (multiplicatif : ×2 → ×2,25 = +12,5 %).

## Critères d’acceptation solo

1. **Outil adapté ≥ ×1,25 pour chaque voie : 0 zone sur 12** (critère : au moins 6) — **non tenu**.

| Zone | Famille | Ratio médian (set 4) | Pire voie | Voies ≥ ×1,25 |
|---|---|---|---|---|
| La Chaussée des lanternes | interstice | ×0,00 | ×0,00 (Trempe-Rouge) | 3/9 |
| Les Fossés gris | rain | ×0,00 | ×0,00 (Trempe-Rouge) | 3/9 |
| La Cour des trois coups | impact | ×0,00 | ×0,00 (Trempe-Rouge) | 3/9 |
| Les Vergers de verre | beat | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |
| Le Cloître des balances | fracture | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |
| Les Fours de recuit | breath | ×0,00 | ×0,00 (Trempe-Rouge) | 3/9 |
| La Salle des échos | interstice | ×0,00 | ×0,00 (Trempe-Rouge) | 3/9 |
| Le Gué des plaies | rain, impact | ×0,00 | ×0,00 (Trempe-Rouge) | 3/9 |
| La Chambre aux deux sceaux | fracture | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |
| Les Terrasses de la vigie | impact | ×0,00 | ×0,00 (Trempe-Rouge) | 3/9 |
| L’Atelier des mauvais jours | beat | ×0,00 | ×0,00 (Trempe-Rouge) | 0/9 |
| Le Belvédère des trois vents | impact, breath | ×0,00 | ×0,00 (Trempe-Rouge) | 3/9 |

2. **Chaque outil premier de sa catégorie dans au moins deux zones** (mur médian des neuf voies, entre outils de même rang ; une zone sans aucun outil de la catégorie qui dépasse le témoin ne compte pour personne).

| Rang | interstice | rain | impact | beat | fracture | breath |
|---|---|---|---|---|---|---|
| set4 | 0 **✗** | 0 **✗** | 0 **✗** | 0 **✗** | 0 **✗** | 0 **✗** |
| gem | 0 **✗** | 0 **✗** | 0 **✗** | 0 **✗** | 0 **✗** | 0 **✗** |
| prep | 0 **✗** | 0 **✗** | 0 **✗** | 0 **✗** | 0 **✗** | 0 **✗** |

3. **Mur ≥ ×1,5 avec le meilleur outil, partout** — **non tenu : 72 cas** : Trempe-Rouge · La Chaussée des lanternes (×-Infinity) ; Trempe-Rouge · Les Fossés gris (×-Infinity) ; Trempe-Rouge · La Cour des trois coups (×-Infinity) ; Trempe-Rouge · Les Vergers de verre (×-Infinity) ; Trempe-Rouge · Le Cloître des balances (×-Infinity) ; Trempe-Rouge · Les Fours de recuit (×-Infinity) ; Trempe-Rouge · La Salle des échos (×-Infinity) ; Trempe-Rouge · Le Gué des plaies (×-Infinity) ; Trempe-Rouge · La Chambre aux deux sceaux (×-Infinity) ; Trempe-Rouge · Les Terrasses de la vigie (×-Infinity) ; Trempe-Rouge · L’Atelier des mauvais jours (×-Infinity) ; Trempe-Rouge · Le Belvédère des trois vents (×-Infinity) ; Enclumier · La Chaussée des lanternes (×-Infinity) ; Enclumier · Les Fossés gris (×-Infinity) ; Enclumier · La Cour des trois coups (×-Infinity) ; Enclumier · Les Vergers de verre (×-Infinity) ; Enclumier · Le Cloître des balances (×-Infinity) ; Enclumier · Les Fours de recuit (×-Infinity) ; Enclumier · La Salle des échos (×-Infinity) ; Enclumier · Le Gué des plaies (×-Infinity) ; Enclumier · La Chambre aux deux sceaux (×-Infinity) ; Enclumier · Les Terrasses de la vigie (×-Infinity) ; Enclumier · L’Atelier des mauvais jours (×-Infinity) ; Enclumier · Le Belvédère des trois vents (×-Infinity) ; Rémouleur · La Chaussée des lanternes (×-Infinity) ; Rémouleur · Les Fossés gris (×-Infinity) ; Rémouleur · La Cour des trois coups (×-Infinity) ; Rémouleur · Les Vergers de verre (×-Infinity) ; Rémouleur · Le Cloître des balances (×-Infinity) ; Rémouleur · Les Fours de recuit (×-Infinity) ; Rémouleur · La Salle des échos (×-Infinity) ; Rémouleur · Le Gué des plaies (×-Infinity) ; Rémouleur · La Chambre aux deux sceaux (×-Infinity) ; Rémouleur · Les Terrasses de la vigie (×-Infinity) ; Rémouleur · L’Atelier des mauvais jours (×-Infinity) ; Rémouleur · Le Belvédère des trois vents (×-Infinity) ; Fulgurant · La Chaussée des lanternes (×-Infinity) ; Fulgurant · Les Fossés gris (×-Infinity) ; Fulgurant · La Cour des trois coups (×-Infinity) ; Fulgurant · Les Vergers de verre (×-Infinity) ; Fulgurant · Le Cloître des balances (×-Infinity) ; Fulgurant · Les Fours de recuit (×-Infinity) ; Fulgurant · La Salle des échos (×-Infinity) ; Fulgurant · Le Gué des plaies (×-Infinity) ; Fulgurant · La Chambre aux deux sceaux (×-Infinity) ; Fulgurant · Les Terrasses de la vigie (×-Infinity) ; Fulgurant · L’Atelier des mauvais jours (×-Infinity) ; Fulgurant · Le Belvédère des trois vents (×-Infinity) ; Sigillaire · La Chaussée des lanternes (×-Infinity) ; Sigillaire · Les Fossés gris (×-Infinity) ; Sigillaire · La Cour des trois coups (×-Infinity) ; Sigillaire · Les Vergers de verre (×-Infinity) ; Sigillaire · Le Cloître des balances (×-Infinity) ; Sigillaire · Les Fours de recuit (×-Infinity) ; Sigillaire · La Salle des échos (×-Infinity) ; Sigillaire · Le Gué des plaies (×-Infinity) ; Sigillaire · La Chambre aux deux sceaux (×-Infinity) ; Sigillaire · Les Terrasses de la vigie (×-Infinity) ; Sigillaire · L’Atelier des mauvais jours (×-Infinity) ; Sigillaire · Le Belvédère des trois vents (×-Infinity) ; Glyphiste · La Chaussée des lanternes (×-Infinity) ; Glyphiste · Les Fossés gris (×-Infinity) ; Glyphiste · La Cour des trois coups (×-Infinity) ; Glyphiste · Les Vergers de verre (×-Infinity) ; Glyphiste · Le Cloître des balances (×-Infinity) ; Glyphiste · Les Fours de recuit (×-Infinity) ; Glyphiste · La Salle des échos (×-Infinity) ; Glyphiste · Le Gué des plaies (×-Infinity) ; Glyphiste · La Chambre aux deux sceaux (×-Infinity) ; Glyphiste · Les Terrasses de la vigie (×-Infinity) ; Glyphiste · L’Atelier des mauvais jours (×-Infinity) ; Glyphiste · Le Belvédère des trois vents (×-Infinity).

4. **Voie de dégâts la plus rapide de sa classe dans au moins 7 zones** (danger normal, meilleur outil de chaque voie, ≥ 90 % de victoires).

| Classe | Zones où le DPS est le plus rapide | Zones perdues (voie plus rapide) |
|---|---|---|
| Le cycle de forge | 12/12 | — |
| La poursuite | 10/12 | Les Fours de recuit (Piégeur 49,8 s contre 55,3 s) ; La Chambre aux deux sceaux (Meneur de meute 54,3 s contre 57,3 s) |
| La phrase runique | 12/12 | — |

## Murs par zone

Chaque case : mur (graines réservées : victoires) et ratio au témoin. Ensuite : réglage du meilleur outil (ouverture, priorité).

### La Chaussée des lanternes

| Voie | aucun | Heures creuses (4) | Opale d’interstice | Tonique de synchronie | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | ×1,97 | ×2,50 (+27 %) | ×2,44 (+24 %) | ×2,18 (+11 %) | Heures creuses (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture tr_seam@4 · chief |
| Piégeur | ×1,81 | ×2,88 (+59 %) | ×2,50 (+38 %) | ×2,06 (+14 %) | Heures creuses (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · chief |
| Meneur de meute | ×2,00 | ×2,72 (+36 %) | ×2,50 (+25 %) | ×2,18 (+9 %) | Heures creuses (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### Les Fossés gris

| Voie | aucun | Habits de pluie (4) | Perle de lessive | Rinçage clair | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | ×1,29 | ×2,06 (+60 %) | ×2,06 (+60 %) | ×1,42 (+11 %) | Habits de pluie (4) : Trait de poursuite, Collet vif, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · chief |
| Piégeur | ×1,25 | ×2,06 (+65 %) | ×2,06 (+65 %) | ×1,42 (+14 %) | Habits de pluie (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Filet d’orage · ouverture 0 · chief |
| Meneur de meute | ×1,78 | ×2,37 (+33 %) | ×2,37 (+33 %) | ×1,84 (+3 %) | Habits de pluie (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### La Cour des trois coups

| Voie | aucun | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | ×1,19 | ×1,78 (+50 %) | ×1,57 (+33 %) | ×1,29 (+8 %) | Enclume patiente (4) : Trait de poursuite, Collet vif, Sifflet bref, Repli couvert, Battement de meute · ouverture tr_pursuit@4 · chief |
| Piégeur | ×1,32 | ×1,90 (+44 %) | ×1,75 (+32 %) | ×1,47 (+11 %) | Enclume patiente (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Filet d’orage · ouverture 0 · chief |
| Meneur de meute | ×1,32 | ×2,00 (+51 %) | ×1,75 (+32 %) | ×1,38 (+5 %) | Enclume patiente (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### Les Vergers de verre

| Voie | aucun | Passeurs de braise (4) | Grenat de battue | Huile de battue | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | ×1,64 | ×1,97 (+20 %) | ×1,84 (+12 %) | ×1,81 (+11 %) | Passeurs de braise (4) : Collet vif, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture tr_seam@4 · adds_first |
| Piégeur | ×1,75 | ×2,06 (+18 %) | ×2,00 (+14 %) | ×1,90 (+9 %) | Passeurs de braise (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Filet d’orage · ouverture tr_pursuit@8 · adds_first |
| Meneur de meute | ×1,87 | ×2,12 (+13 %) | ×2,06 (+10 %) | ×2,06 (+10 %) | Passeurs de braise (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · adds_first |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### Le Cloître des balances

| Voie | aucun | Mains de traverse (4) | Œil de faille | Poudre de coin | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | ×1,55 | ×1,64 (+6 %) | ×1,57 (+2 %) | ×1,55 (+0 %) | Mains de traverse (4) : Lecture de piste, Trait de poursuite, Repli couvert, Flèche barbelée, Tir à la couture · ouverture tr_seam@4 · chief |
| Piégeur | ×1,47 | ×1,47 (+0 %) | ×1,50 (+2 %) | ×1,47 (+0 %) | Œil de faille : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture tr_pursuit@4 · chief |
| Meneur de meute | ×1,48 | ×1,57 (+6 %) | ×1,52 (+3 %) | ×1,52 (+3 %) | Mains de traverse (4) : Lecture de piste, Trait de poursuite, Flèche barbelée, Regard fixe, Garde de meute · ouverture 0 · chief |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### Les Fours de recuit

| Voie | aucun | Veilleurs du Sceau (4) | Ambre de reprise | Infusion de reprise | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | ×1,32 | ×1,84 (+39 %) | ×1,57 (+19 %) | ×1,47 (+11 %) | Veilleurs du Sceau (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,29 | ×1,87 (+45 %) | ×1,64 (+27 %) | ×1,50 (+17 %) | Veilleurs du Sceau (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Filet d’orage · ouverture 0 · chief |
| Meneur de meute | ×1,71 | ×2,37 (+39 %) | ×2,06 (+20 %) | ×1,97 (+15 %) | Veilleurs du Sceau (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### La Salle des échos

| Voie | aucun | Heures creuses (4) | Opale d’interstice | Tonique de synchronie | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | ×1,97 | ×2,57 (+31 %) | ×2,50 (+27 %) | ×2,25 (+14 %) | Heures creuses (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,75 | ×2,88 (+64 %) | ×2,57 (+47 %) | ×2,25 (+29 %) | Heures creuses (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Filet d’orage · ouverture 0 · chief |
| Meneur de meute | ×1,97 | ×2,88 (+46 %) | ×2,57 (+31 %) | ×2,25 (+14 %) | Heures creuses (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### Le Gué des plaies

| Voie | aucun | Habits de pluie (4) | Perle de lessive | Rinçage clair | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Meilleur réglage |
|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — | — | — | — |
| Enclumier | — | — | — | — | — | — | — | — |
| Rémouleur | — | — | — | — | — | — | — | — |
| Tue-Bête | ×1,29 | ×1,84 (+43 %) | ×1,50 (+17 %) | ×1,42 (+11 %) | ×1,29 (+0 %) | ×1,29 (+0 %) | ×1,29 (+0 %) | Habits de pluie (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,25 | ×2,00 (+60 %) | ×1,52 (+22 %) | ×1,40 (+12 %) | ×1,29 (+3 %) | ×1,29 (+3 %) | ×1,29 (+3 %) | Habits de pluie (4) : Trait de poursuite, Collet vif, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · chief |
| Meneur de meute | ×1,57 | ×2,12 (+35 %) | ×2,06 (+31 %) | ×1,67 (+6 %) | ×1,64 (+4 %) | ×1,64 (+4 %) | ×1,59 (+1 %) | Habits de pluie (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture tr_packreturn@8 · chief |
| Fulgurant | — | — | — | — | — | — | — | — |
| Sigillaire | — | — | — | — | — | — | — | — |
| Glyphiste | — | — | — | — | — | — | — | — |

### La Chambre aux deux sceaux

| Voie | aucun | Mains de traverse (4) | Œil de faille | Poudre de coin | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | ×1,97 | ×1,97 (+0 %) | ×1,97 (+0 %) | ×1,97 (+0 %) | aucun : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · unguarded_first |
| Piégeur | ×2,00 | ×2,00 (+0 %) | ×2,00 (+0 %) | ×2,00 (+0 %) | aucun : Trait de poursuite, Sifflet bref, Repli couvert, Flèche barbelée, Battement de meute · ouverture tr_pursuit@8 · unguarded_first |
| Meneur de meute | ×2,00 | ×2,00 (+0 %) | ×2,00 (+0 %) | ×2,00 (+0 %) | aucun : Lecture de piste, Trait de poursuite, Flèche barbelée, Garde de meute, Partage de chasse · ouverture tr_pursuit@10 · unguarded_first |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### Les Terrasses de la vigie

| Voie | aucun | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | ×1,13 | ×1,64 (+45 %) | ×1,45 (+29 %) | ×1,36 (+21 %) | Enclume patiente (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,29 | ×1,78 (+38 %) | ×1,64 (+27 %) | ×1,42 (+11 %) | Enclume patiente (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Filet d’orage · ouverture 0 · chief |
| Meneur de meute | ×1,29 | ×1,87 (+45 %) | ×1,64 (+27 %) | ×1,45 (+13 %) | Enclume patiente (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### L’Atelier des mauvais jours

| Voie | aucun | Passeurs de braise (4) | Grenat de battue | Huile de battue | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — |
| Enclumier | — | — | — | — | — |
| Rémouleur | — | — | — | — | — |
| Tue-Bête | ×2,25 | ×2,31 (+3 %) | ×2,31 (+3 %) | ×2,31 (+3 %) | Passeurs de braise (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · adds_first |
| Piégeur | ×2,25 | ×2,31 (+3 %) | ×2,31 (+3 %) | ×2,25 (+0 %) | Passeurs de braise (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Filet d’orage · ouverture 0 · adds_first |
| Meneur de meute | ×2,25 | ×2,37 (+5 %) | ×2,31 (+3 %) | ×2,31 (+3 %) | Passeurs de braise (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · adds_first |
| Fulgurant | — | — | — | — | — |
| Sigillaire | — | — | — | — | — |
| Glyphiste | — | — | — | — | — |

### Le Belvédère des trois vents

| Voie | aucun | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Veilleurs du Sceau (4) | Ambre de reprise | Infusion de reprise | Meilleur réglage |
|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | — | — | — | — | — | — | — | — |
| Enclumier | — | — | — | — | — | — | — | — |
| Rémouleur | — | — | — | — | — | — | — | — |
| Tue-Bête | ×1,25 | ×1,25 (-0 %) | ×1,25 (+0 %) | ×1,25 (+0 %) | ×1,67 (+34 %) | ×1,47 (+18 %) | ×1,42 (+14 %) | Veilleurs du Sceau (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture tr_seam@4 · chief |
| Piégeur | ×1,25 | ×1,29 (+3 %) | ×1,29 (+3 %) | ×1,29 (+3 %) | ×1,75 (+40 %) | ×1,52 (+22 %) | ×1,42 (+14 %) | Veilleurs du Sceau (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Filet d’orage · ouverture 0 · chief |
| Meneur de meute | ×1,52 | ×1,64 (+7 %) | ×1,60 (+5 %) | ×1,57 (+3 %) | ×2,06 (+35 %) | ×1,84 (+21 %) | ×1,81 (+19 %) | Veilleurs du Sceau (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | — | — | — | — | — | — | — | — |
| Sigillaire | — | — | — | — | — | — | — | — |
| Glyphiste | — | — | — | — | — | — | — | — |

## Échecs juste au-dessus du mur

Causes des défaites à mur × 1,03 (graines de confirmation), meilleur outil de chaque case.

- mort:attack : 1365
- mort:aura : 1256
- temps : 801
- mort:charge : 248

