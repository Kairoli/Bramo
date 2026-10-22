# Outils de situation · zones-v2

> Généré par `pnpm --filter @bramo/sim sim combat-tools`. Ne pas modifier à la main.

Rencontres zones-v2 (GPT, sans fureur) ; outils tools.yaml ; moteur du 22 octobre (danger et fureur sur aura et érosion, Repli non actif).

**Méthode.** Difficulté couplée : dégâts ennemis × D, PV (et garde, soins ennemis) × D^1,5, délai de fureur × D^1,5. Mur : plus haut D gagné à 90 % ; grille 1,000 / 1,125 / 1,250 / 1,400 / 1,500 / 1,600 / 1,750 / 2,000 / 2,250 / 2,500 / 2,800 / 3,125 / 3,500 / 4,000 / 4,500 / 5,000 / 6,000, puis encadrement à 3 %. Plans : 5+ finalistes du criblage du kit par voie (répertoire 80), quatre ouvertures chacun (tout à 0 s, ou le sort le plus fort à 4, 8 ou 10 s) et les priorités de cible utiles ; ouverture « séquence ». Choix du réglage sur 4 graines puis 32 graines (2000+) ; mur rejoué sur 64 graines réservées (10000+), descendu de 3 % tant qu'elles ne passent pas à 90 %. Témoin : aucun outil, statistiques normalisées (P 100, PV 2 800 au répertoire 80) ; un outil hors de sa mécanique vaut zéro par construction.

**Ratio** : mur de l’outil / mur du témoin, même voie (multiplicatif : ×2 → ×2,25 = +12,5 %).

## Critères d’acceptation solo

1. **Outil adapté ≥ ×1,25 pour chaque voie : 4 zones sur 12** (critère : au moins 6) — **non tenu**.

| Zone | Famille | Ratio médian (set 4) | Pire voie | Voies ≥ ×1,25 |
|---|---|---|---|---|
| La Chaussée des lanternes | interstice | ×1,29 | ×1,16 (Piégeur) | 6/9 |
| Les Fossés gris | rain | ×1,13 | ×1,09 (Trempe-Rouge) | 3/9 |
| La Cour des trois coups | impact | ×1,45 | ×1,37 (Tue-Bête) | 9/9 |
| Les Vergers de verre | beat | ×1,18 | ×1,11 (Fulgurant) | 0/9 |
| Le Cloître des balances | fracture | ×1,03 | ×1,00 (Fulgurant) | 0/9 |
| Les Fours de recuit | breath | ×1,37 | ×1,26 (Glyphiste) | 9/9 |
| La Salle des échos | interstice | ×1,36 | ×1,21 (Piégeur) | 7/9 |
| Le Gué des plaies | rain, impact | ×1,21 | ×1,15 (Enclumier) | 3/9 |
| La Chambre aux deux sceaux | fracture | ×1,00 | ×0,97 (Trempe-Rouge) | 0/9 |
| Les Terrasses de la vigie | impact | ×1,41 | ×1,31 (Trempe-Rouge) | 9/9 |
| L’Atelier des mauvais jours | beat | ×1,05 | ×0,97 (Fulgurant) | 0/9 |
| Le Belvédère des trois vents | impact, breath | ×1,31 | ×1,25 (Glyphiste) | 9/9 |

2. **Chaque outil premier de sa catégorie dans au moins deux zones** (mur médian des neuf voies, entre outils de même rang ; une zone sans aucun outil de la catégorie qui dépasse le témoin ne compte pour personne).

| Rang | interstice | rain | impact | beat | fracture | breath |
|---|---|---|---|---|---|---|
| set4 | 2 | 2 | 2 | 1 **✗** | 1 **✗** | 2 |
| gem | 2 | 2 | 2 | 1 **✗** | 1 **✗** | 2 |
| prep | 2 | 2 | 2 | 1 **✗** | 0 **✗** | 2 |

3. **Mur ≥ ×1,5 avec le meilleur outil, partout** — **non tenu : 1 cas** : Tue-Bête · La Cour des trois coups (×1,45).

4. **Voie de dégâts la plus rapide de sa classe dans au moins 7 zones** (danger normal, meilleur outil de chaque voie, ≥ 90 % de victoires).

| Classe | Zones où le DPS est le plus rapide | Zones perdues (voie plus rapide) |
|---|---|---|
| Le cycle de forge | 10/12 | La Chaussée des lanternes (Enclumier 50,3 s contre 50,8 s) ; La Chambre aux deux sceaux (Rémouleur 49,1 s contre 57,5 s) |
| La poursuite | 10/12 | Le Cloître des balances (Meneur de meute 54,8 s contre 58,3 s) ; La Chambre aux deux sceaux (Meneur de meute 54,3 s contre 55,3 s) |
| La phrase runique | 5/12 **✗** | La Chaussée des lanternes (Glyphiste 37,3 s contre 51,8 s) ; Les Fossés gris (Glyphiste 61,3 s contre 62,3 s) ; Les Vergers de verre (Glyphiste 59,0 s contre 75,5 s) ; Le Cloître des balances (Glyphiste 45,3 s contre 56,0 s) ; Les Fours de recuit (Glyphiste 63,3 s contre 65,0 s) ; La Chambre aux deux sceaux (Glyphiste 47,6 s contre 57,0 s) ; L’Atelier des mauvais jours (Glyphiste 51,3 s contre 64,8 s) |

## Murs par zone

Chaque case : mur (graines réservées : victoires) et ratio au témoin. Ensuite : réglage du meilleur outil (ouverture, priorité).

### La Chaussée des lanternes

| Voie | aucun | Heures creuses (4) | Opale d’interstice | Tonique de synchronie | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×2,00 | ×2,37 (+19 %) | ×2,25 (+13 %) | ×2,12 (+6 %) | Heures creuses (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · chief |
| Enclumier | ×1,78 | ×2,50 (+40 %) | ×2,31 (+30 %) | ×2,00 (+12 %) | Heures creuses (4) : Frappe d’atelier, Garde rouge, Coup de travers, Refroidissement, Rivet de garde · ouverture 0 · chief |
| Rémouleur | ×2,00 | ×2,50 (+25 %) | ×2,25 (+13 %) | ×2,12 (+6 %) | Heures creuses (4) : Garde rouge, Coup de travers, Refroidissement, Pose de rivets, Recuit partagé · ouverture 0 · chief |
| Tue-Bête | ×1,71 | ×2,06 (+20 %) | ×1,97 (+15 %) | ×1,78 (+4 %) | Heures creuses (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,93 | ×2,25 (+16 %) | ×2,18 (+13 %) | ×2,00 (+3 %) | Heures creuses (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · chief |
| Meneur de meute | ×2,00 | ×2,57 (+29 %) | ×2,50 (+25 %) | ×2,18 (+9 %) | Heures creuses (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | ×2,00 | ×2,65 (+32 %) | ×2,44 (+22 %) | ×2,25 (+13 %) | Heures creuses (4) : Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer, La Phrase souveraine · ouverture rn_sovereign@8 · chief |
| Sigillaire | ×2,00 | ×2,65 (+32 %) | ×2,44 (+22 %) | ×2,00 (+0 %) | Heures creuses (4) : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture 0 · chief |
| Glyphiste | ×2,06 | ×2,72 (+32 %) | ×2,50 (+21 %) | ×2,31 (+12 %) | Heures creuses (4) : Trait incandescent, Sceau de garde, Sceau de répit, Sceau du foyer, Sceau de résonance · ouverture 0 · chief |

### Les Fossés gris

| Voie | aucun | Habits de pluie (4) | Perle de lessive | Rinçage clair | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×1,75 | ×1,90 (+9 %) | ×1,90 (+9 %) | ×1,78 (+2 %) | Habits de pluie (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · chief |
| Enclumier | ×1,71 | ×1,90 (+11 %) | ×1,90 (+11 %) | ×1,81 (+6 %) | Habits de pluie (4) : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, La Grande Trempe · ouverture fg_great_temper@8 · chief |
| Rémouleur | ×1,87 | ×2,12 (+13 %) | ×2,12 (+13 %) | ×1,97 (+5 %) | Habits de pluie (4) : Garde rouge, Coup de travers, Refroidissement, Pose de rivets, Recuit partagé · ouverture 0 · chief |
| Tue-Bête | ×1,25 | ×1,71 (+37 %) | ×1,71 (+37 %) | ×1,40 (+12 %) | Habits de pluie (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,25 | ×1,84 (+47 %) | ×1,84 (+47 %) | ×1,42 (+14 %) | Habits de pluie (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · chief |
| Meneur de meute | ×1,71 | ×2,18 (+28 %) | ×2,18 (+28 %) | ×1,84 (+8 %) | Habits de pluie (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | ×1,84 | ×2,12 (+15 %) | ×2,12 (+15 %) | ×1,93 (+5 %) | Habits de pluie (4) : Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer, La Phrase souveraine · ouverture 0 · chief |
| Sigillaire | ×1,87 | ×2,12 (+13 %) | ×2,12 (+13 %) | ×1,97 (+5 %) | Habits de pluie (4) : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture 0 · chief |
| Glyphiste | ×2,06 | ×2,25 (+9 %) | ×2,25 (+9 %) | ×2,06 (+0 %) | Habits de pluie (4) : Trait incandescent, Sceau de garde, Sceau de répit, Sceau du foyer, Sceau de résonance · ouverture 0 · chief |

### La Cour des trois coups

| Voie | aucun | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×1,13 | ×1,64 (+45 %) | ×1,50 (+33 %) | ×1,25 (+11 %) | Enclume patiente (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · chief |
| Enclumier | ×1,13 | ×1,67 (+49 %) | ×1,50 (+33 %) | ×1,42 (+27 %) | Enclume patiente (4) : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, La Grande Trempe · ouverture 0 · chief |
| Rémouleur | ×1,25 | ×1,75 (+40 %) | ×1,60 (+28 %) | ×1,25 (+0 %) | Enclume patiente (4) : Garde rouge, Coup de travers, Refroidissement, Pose de rivets, Recuit partagé · ouverture 0 · chief |
| Tue-Bête | ×1,06 | ×1,45 (+37 %) | ×1,25 (+18 %) | ×1,19 (+12 %) | Enclume patiente (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,13 | ×1,60 (+42 %) | ×1,47 (+31 %) | ×1,29 (+14 %) | Enclume patiente (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · chief |
| Meneur de meute | ×1,13 | ×1,71 (+52 %) | ×1,48 (+32 %) | ×1,29 (+14 %) | Enclume patiente (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture tr_packreturn@8 · chief |
| Fulgurant | ×1,22 | ×1,75 (+44 %) | ×1,52 (+25 %) | ×1,25 (+3 %) | Enclume patiente (4) : Cercle de givre, Sceau de garde, Sceau de répit, Sceau du foyer, Rature ardente · ouverture 0 · chief |
| Sigillaire | ×1,25 | ×1,84 (+47 %) | ×1,60 (+28 %) | ×1,42 (+14 %) | Enclume patiente (4) : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture rn_lightning@4 · chief |
| Glyphiste | ×1,12 | ×1,88 (+67 %) | ×1,67 (+49 %) | ×1,32 (+18 %) | Enclume patiente (4) : Sceau de garde, Sceau de répit, Sceau du foyer, Sceau de résonance, Cercle du refuge · ouverture 0 · chief |

### Les Vergers de verre

| Voie | aucun | Passeurs de braise (4) | Grenat de battue | Huile de battue | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×1,60 | ×1,90 (+19 %) | ×1,87 (+17 %) | ×1,81 (+13 %) | Passeurs de braise (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · adds_first |
| Enclumier | ×1,60 | ×1,97 (+23 %) | ×1,78 (+11 %) | ×1,71 (+7 %) | Passeurs de braise (4) : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, Coins d’arrêt · ouverture fg_workshop@10 · adds_first |
| Rémouleur | ×1,75 | ×2,00 (+14 %) | ×2,00 (+14 %) | ×1,84 (+5 %) | Passeurs de braise (4) : Frappe d’atelier, Coup de travers, Refroidissement, Pose de rivets, Recuit partagé · ouverture 0 · adds_first |
| Tue-Bête | ×1,50 | ×1,67 (+12 %) | ×1,60 (+7 %) | ×1,57 (+5 %) | Passeurs de braise (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · adds_first |
| Piégeur | ×1,55 | ×1,78 (+15 %) | ×1,71 (+10 %) | ×1,67 (+8 %) | Passeurs de braise (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · adds_first |
| Meneur de meute | ×1,75 | ×2,06 (+18 %) | ×2,00 (+14 %) | ×2,00 (+14 %) | Passeurs de braise (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · adds_first |
| Fulgurant | ×1,81 | ×2,00 (+11 %) | ×2,00 (+11 %) | ×1,97 (+9 %) | Passeurs de braise (4) : Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer, La Phrase souveraine · ouverture 0 · adds_first |
| Sigillaire | ×1,75 | ×2,06 (+18 %) | ×2,06 (+18 %) | ×2,00 (+14 %) | Passeurs de braise (4) : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture 0 · adds_first |
| Glyphiste | ×1,78 | ×2,12 (+19 %) | ×2,06 (+16 %) | ×2,00 (+12 %) | Passeurs de braise (4) : Trait fulgurant, Sceau de répit, Sceau du foyer, Sceau de résonance, Cercle du refuge · ouverture 0 · adds_first |

### Le Cloître des balances

| Voie | aucun | Mains de traverse (4) | Œil de faille | Poudre de coin | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×1,57 | ×1,60 (+2 %) | ×1,60 (+2 %) | ×1,57 (+0 %) | Mains de traverse (4) : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · chief |
| Enclumier | ×1,52 | ×1,60 (+5 %) | ×1,55 (+2 %) | ×1,52 (+0 %) | Mains de traverse (4) : Frappe d’atelier, Trempe vive, Garde rouge, Coup de travers, Marteau de retour · ouverture 0 · chief |
| Rémouleur | ×1,57 | ×1,67 (+6 %) | ×1,60 (+2 %) | ×1,57 (+0 %) | Mains de traverse (4) : Frappe d’atelier, Trempe vive, Coup de travers, Marteau de retour, Pose de rivets · ouverture 0 · chief |
| Tue-Bête | ×1,52 | ×1,57 (+3 %) | ×1,50 (-2 %) | ×1,52 (+0 %) | Mains de traverse (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,55 | ×1,67 (+8 %) | ×1,60 (+3 %) | ×1,55 (+0 %) | Mains de traverse (4) : Lecture de piste, Trait de poursuite, Repli couvert, Flèche barbelée, Battement de meute · ouverture 0 · chief |
| Meneur de meute | ×1,48 | ×1,57 (+6 %) | ×1,52 (+3 %) | ×1,52 (+3 %) | Mains de traverse (4) : Lecture de piste, Trait de poursuite, Flèche barbelée, Regard fixe, Garde de meute · ouverture 0 · chief |
| Fulgurant | ×2,00 | ×2,00 (+0 %) | ×2,00 (+0 %) | ×2,00 (+0 %) | aucun : Trait incandescent, Sceau de garde, Cercle révélateur, Sceau du foyer, Rature ardente · ouverture 0 · chief |
| Sigillaire | ×2,06 | ×2,06 (+0 %) | ×2,06 (+0 %) | ×2,06 (+0 %) | aucun : Trait incandescent, Sceau de garde, Trait fulgurant, Cercle révélateur, Sceau du foyer · ouverture rn_lightning@8 · chief |
| Glyphiste | ×1,75 | ×1,78 (+2 %) | ×1,75 (+0 %) | ×1,75 (+0 %) | Mains de traverse (4) : Trait incandescent, Trait fulgurant, Trait de gel, Cercle révélateur, Sceau de résonance · ouverture rn_lightning@8 · chief |

### Les Fours de recuit

| Voie | aucun | Veilleurs du Sceau (4) | Ambre de reprise | Infusion de reprise | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×1,60 | ×2,18 (+37 %) | ×1,90 (+19 %) | ×1,78 (+11 %) | Veilleurs du Sceau (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · chief |
| Enclumier | ×1,57 | ×2,25 (+43 %) | ×1,84 (+17 %) | ×1,78 (+13 %) | Veilleurs du Sceau (4) : Frappe d’atelier, Garde rouge, Coup de travers, Refroidissement, Rivet de garde · ouverture 0 · chief |
| Rémouleur | ×1,71 | ×2,37 (+39 %) | ×2,06 (+20 %) | ×1,93 (+13 %) | Veilleurs du Sceau (4) : Frappe d’atelier, Coup de travers, Refroidissement, Pose de rivets, Recuit partagé · ouverture 0 · chief |
| Tue-Bête | ×1,29 | ×1,71 (+33 %) | ×1,52 (+19 %) | ×1,42 (+11 %) | Veilleurs du Sceau (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,32 | ×1,81 (+37 %) | ×1,60 (+21 %) | ×1,47 (+11 %) | Veilleurs du Sceau (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · chief |
| Meneur de meute | ×1,71 | ×2,37 (+39 %) | ×2,00 (+17 %) | ×1,90 (+11 %) | Veilleurs du Sceau (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | ×1,75 | ×2,25 (+29 %) | ×2,12 (+21 %) | ×2,00 (+14 %) | Veilleurs du Sceau (4) : Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer, La Phrase souveraine · ouverture 0 · chief |
| Sigillaire | ×1,75 | ×2,31 (+32 %) | ×2,12 (+21 %) | ×2,00 (+14 %) | Veilleurs du Sceau (4) : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture 0 · chief |
| Glyphiste | ×1,93 | ×2,44 (+26 %) | ×2,25 (+16 %) | ×2,00 (+3 %) | Veilleurs du Sceau (4) : Trait fulgurant, Sceau de répit, Sceau du foyer, Sceau de résonance, Cercle du refuge · ouverture 0 · chief |

### La Salle des échos

| Voie | aucun | Heures creuses (4) | Opale d’interstice | Tonique de synchronie | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×1,87 | ×2,50 (+34 %) | ×2,37 (+27 %) | ×2,18 (+17 %) | Heures creuses (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture fg_second_strike@4 · chief |
| Enclumier | ×1,81 | ×2,50 (+38 %) | ×2,50 (+38 %) | ×1,97 (+9 %) | Heures creuses (4) : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, La Grande Trempe · ouverture 0 · chief |
| Rémouleur | ×1,84 | ×2,80 (+52 %) | ×2,50 (+36 %) | ×2,25 (+22 %) | Heures creuses (4) : Frappe d’atelier, Refroidissement, Pose de rivets, Recuit partagé, Plaque maîtresse · ouverture 0 · chief |
| Tue-Bête | ×1,75 | ×2,12 (+21 %) | ×2,00 (+14 %) | ×1,84 (+5 %) | Heures creuses (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,97 | ×2,37 (+21 %) | ×2,25 (+14 %) | ×2,06 (+5 %) | Heures creuses (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · chief |
| Meneur de meute | ×1,97 | ×2,72 (+38 %) | ×2,57 (+31 %) | ×2,25 (+14 %) | Heures creuses (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | ×2,00 | ×2,72 (+36 %) | ×2,50 (+25 %) | ×2,31 (+16 %) | Heures creuses (4) : Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer, La Phrase souveraine · ouverture rn_sovereign@8 · chief |
| Sigillaire | ×2,06 | ×2,80 (+36 %) | ×2,57 (+25 %) | ×2,25 (+9 %) | Heures creuses (4) : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture 0 · chief |
| Glyphiste | ×2,12 | ×2,80 (+32 %) | ×2,65 (+25 %) | ×2,25 (+6 %) | Heures creuses (4) : Trait fulgurant, Sceau de répit, Sceau du foyer, Sceau de résonance, Cercle du refuge · ouverture 0 · chief |

### Le Gué des plaies

| Voie | aucun | Habits de pluie (4) | Perle de lessive | Rinçage clair | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Meilleur réglage |
|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | ×1,55 | ×1,78 (+15 %) | ×1,64 (+6 %) | ×1,60 (+3 %) | ×1,64 (+6 %) | ×1,60 (+3 %) | ×1,60 (+3 %) | Habits de pluie (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · chief |
| Enclumier | ×1,52 | ×1,75 (+15 %) | ×1,64 (+7 %) | ×1,60 (+5 %) | ×1,60 (+5 %) | ×1,60 (+5 %) | ×1,60 (+5 %) | Habits de pluie (4) : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, La Grande Trempe · ouverture 0 · chief |
| Rémouleur | ×1,60 | ×1,93 (+21 %) | ×1,78 (+11 %) | ×1,64 (+2 %) | ×1,71 (+7 %) | ×1,71 (+7 %) | ×1,64 (+2 %) | Habits de pluie (4) : Garde rouge, Coup de travers, Refroidissement, Pose de rivets, Recuit partagé · ouverture 0 · chief |
| Tue-Bête | ×1,16 | ×1,60 (+39 %) | ×1,29 (+11 %) | ×1,25 (+8 %) | ×1,25 (+8 %) | ×1,25 (+8 %) | ×1,22 (+5 %) | Habits de pluie (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,25 | ×1,75 (+40 %) | ×1,42 (+14 %) | ×1,29 (+3 %) | ×1,29 (+3 %) | ×1,29 (+3 %) | ×1,29 (+3 %) | Habits de pluie (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · chief |
| Meneur de meute | ×1,55 | ×1,87 (+21 %) | ×1,90 (+23 %) | ×1,64 (+6 %) | ×1,64 (+6 %) | ×1,60 (+3 %) | ×1,60 (+3 %) | Perle de lessive : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture tr_packreturn@8 · chief |
| Fulgurant | ×1,60 | ×1,93 (+21 %) | ×1,75 (+9 %) | ×1,75 (+9 %) | ×1,75 (+9 %) | ×1,75 (+9 %) | ×1,71 (+7 %) | Habits de pluie (4) : Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer, La Phrase souveraine · ouverture 0 · chief |
| Sigillaire | ×1,60 | ×2,00 (+25 %) | ×1,81 (+13 %) | ×1,71 (+7 %) | ×1,78 (+11 %) | ×1,71 (+7 %) | ×1,71 (+7 %) | Habits de pluie (4) : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture rn_lightning@8 · chief |
| Glyphiste | ×1,71 | ×2,06 (+20 %) | ×2,00 (+17 %) | ×1,84 (+8 %) | ×1,93 (+13 %) | ×1,90 (+11 %) | ×1,84 (+8 %) | Habits de pluie (4) : Sceau de garde, Sceau de répit, Sceau du foyer, Sceau de résonance, Cercle du refuge · ouverture 0 · chief |

### La Chambre aux deux sceaux

| Voie | aucun | Mains de traverse (4) | Œil de faille | Poudre de coin | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×2,06 | ×2,00 (-3 %) | ×2,06 (+0 %) | ×2,06 (+0 %) | aucun : Frappe d’atelier, Garde rouge, Coup de travers, Refroidissement, Rivet de garde · ouverture fg_crosscut@10 · unguarded_first |
| Enclumier | ×2,00 | ×2,06 (+3 %) | ×2,00 (+0 %) | ×2,00 (+0 %) | Mains de traverse (4) : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, La Grande Trempe · ouverture 0 · unguarded_first |
| Rémouleur | ×2,00 | ×2,00 (+0 %) | ×2,00 (+0 %) | ×2,00 (+0 %) | Mains de traverse (4) : Frappe d’atelier, Trempe vive, Coup de travers, Marteau de retour, Pose de rivets · ouverture 0 · unguarded_first |
| Tue-Bête | ×1,84 | ×1,87 (+2 %) | ×1,84 (+0 %) | ×1,84 (+0 %) | Mains de traverse (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · unguarded_first |
| Piégeur | ×1,93 | ×1,97 (+2 %) | ×1,93 (+0 %) | ×1,93 (+0 %) | Mains de traverse (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · unguarded_first |
| Meneur de meute | ×2,00 | ×2,00 (+0 %) | ×2,00 (+0 %) | ×2,00 (+0 %) | aucun : Lecture de piste, Trait de poursuite, Flèche barbelée, Garde de meute, Partage de chasse · ouverture tr_pursuit@10 · unguarded_first |
| Fulgurant | ×2,06 | ×2,06 (+0 %) | ×2,06 (+0 %) | ×2,06 (+0 %) | aucun : Trait incandescent, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture rn_lightning@10 · unguarded_first |
| Sigillaire | ×2,12 | ×2,12 (+0 %) | ×2,12 (+0 %) | ×2,12 (+0 %) | aucun : Trait incandescent, Sceau de garde, Trait fulgurant, Cercle révélateur, Sceau du foyer · ouverture 0 · unguarded_first |
| Glyphiste | ×2,18 | ×2,18 (+0 %) | ×2,18 (+0 %) | ×2,18 (+0 %) | aucun : Trait incandescent, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau de résonance · ouverture rn_lightning@10 · unguarded_first |

### Les Terrasses de la vigie

| Voie | aucun | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×1,25 | ×1,64 (+31 %) | ×1,50 (+20 %) | ×1,42 (+14 %) | Enclume patiente (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · chief |
| Enclumier | ×1,25 | ×1,64 (+31 %) | ×1,52 (+22 %) | ×1,42 (+14 %) | Enclume patiente (4) : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, La Grande Trempe · ouverture 0 · chief |
| Rémouleur | ×1,25 | ×1,84 (+47 %) | ×1,64 (+31 %) | ×1,52 (+22 %) | Enclume patiente (4) : Garde rouge, Coup de travers, Refroidissement, Pose de rivets, Recuit partagé · ouverture 0 · chief |
| Tue-Bête | ×1,13 | ×1,55 (+38 %) | ×1,40 (+24 %) | ×1,32 (+18 %) | Enclume patiente (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,29 | ×1,71 (+33 %) | ×1,55 (+20 %) | ×1,42 (+11 %) | Enclume patiente (4) : Lecture de piste, Trait de poursuite, Repli couvert, Battement de meute, Flèches de gêne · ouverture 0 · chief |
| Meneur de meute | ×1,29 | ×1,84 (+43 %) | ×1,64 (+27 %) | ×1,45 (+13 %) | Enclume patiente (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | ×1,25 | ×1,84 (+47 %) | ×1,60 (+28 %) | ×1,52 (+22 %) | Enclume patiente (4) : Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer, La Phrase souveraine · ouverture 0 · chief |
| Sigillaire | ×1,25 | ×1,90 (+52 %) | ×1,64 (+31 %) | ×1,50 (+20 %) | Enclume patiente (4) : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture 0 · chief |
| Glyphiste | ×1,29 | ×1,81 (+41 %) | ×1,60 (+24 %) | ×1,50 (+17 %) | Enclume patiente (4) : Trait incandescent, Sceau de garde, Trait fulgurant, Trait de gel, Sceau de résonance · ouverture 0 · chief |

### L’Atelier des mauvais jours

| Voie | aucun | Passeurs de braise (4) | Grenat de battue | Huile de battue | Meilleur réglage |
|---|---|---|---|---|---|
| Trempe-Rouge | ×2,12 | ×2,25 (+6 %) | ×2,25 (+6 %) | ×2,25 (+6 %) | Passeurs de braise (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · adds_first |
| Enclumier | ×2,25 | ×2,25 (+0 %) | ×2,18 (-3 %) | ×2,31 (+3 %) | Huile de battue : Frappe d’atelier, Garde rouge, Coup de travers, Refroidissement, Rivet de garde · ouverture 0 · adds_first |
| Rémouleur | ×2,31 | ×2,37 (+3 %) | ×2,37 (+3 %) | ×2,31 (+0 %) | Passeurs de braise (4) : Frappe d’atelier, Coup de travers, Refroidissement, Pose de rivets, Recuit partagé · ouverture 0 · adds_first |
| Tue-Bête | ×1,84 | ×1,93 (+5 %) | ×1,90 (+3 %) | ×1,90 (+3 %) | Passeurs de braise (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · adds_first |
| Piégeur | ×2,00 | ×2,12 (+6 %) | ×2,12 (+6 %) | ×2,06 (+3 %) | Passeurs de braise (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · adds_first |
| Meneur de meute | ×2,25 | ×2,37 (+5 %) | ×2,37 (+5 %) | ×2,31 (+3 %) | Passeurs de braise (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · adds_first |
| Fulgurant | ×2,31 | ×2,25 (-3 %) | ×2,25 (-3 %) | ×2,18 (-5 %) | aucun : Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer, Rature ardente · ouverture 0 · adds_first |
| Sigillaire | ×2,25 | ×2,31 (+3 %) | ×2,31 (+3 %) | ×2,25 (+0 %) | Passeurs de braise (4) : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture 0 · adds_first |
| Glyphiste | ×2,25 | ×2,50 (+11 %) | ×2,31 (+3 %) | ×2,31 (+3 %) | Passeurs de braise (4) : Trait incandescent, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau de résonance · ouverture rn_lightning@4 · adds_first |

### Le Belvédère des trois vents

| Voie | aucun | Enclume patiente (4) | Hématite d’arrêt | Baume de parade | Veilleurs du Sceau (4) | Ambre de reprise | Infusion de reprise | Meilleur réglage |
|---|---|---|---|---|---|---|---|---|
| Trempe-Rouge | ×1,42 | ×1,52 (+7 %) | ×1,50 (+5 %) | ×1,50 (+5 %) | ×1,84 (+29 %) | ×1,64 (+15 %) | ×1,57 (+11 %) | Veilleurs du Sceau (4) : Garde rouge, Coup de travers, Refroidissement, Rivet de garde, Deuxième frappe · ouverture 0 · chief |
| Enclumier | ×1,38 | ×1,50 (+8 %) | ×1,47 (+7 %) | ×1,45 (+5 %) | ×1,78 (+29 %) | ×1,60 (+16 %) | ×1,55 (+12 %) | Veilleurs du Sceau (4) : Frappe d’atelier, Garde rouge, Refroidissement, Rivet de garde, La Grande Trempe · ouverture 0 · chief |
| Rémouleur | ×1,52 | ×1,60 (+5 %) | ×1,60 (+5 %) | ×1,57 (+3 %) | ×2,00 (+31 %) | ×1,75 (+15 %) | ×1,64 (+7 %) | Veilleurs du Sceau (4) : Garde rouge, Coup de travers, Refroidissement, Pose de rivets, Recuit partagé · ouverture 0 · chief |
| Tue-Bête | ×1,16 | ×1,25 (+8 %) | ×1,25 (+8 %) | ×1,22 (+5 %) | ×1,55 (+34 %) | ×1,29 (+11 %) | ×1,29 (+11 %) | Veilleurs du Sceau (4) : Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute, Tir à la couture · ouverture 0 · chief |
| Piégeur | ×1,13 | ×1,25 (+11 %) | ×1,25 (+11 %) | ×1,25 (+11 %) | ×1,64 (+45 %) | ×1,42 (+27 %) | ×1,25 (+11 %) | Veilleurs du Sceau (4) : Lecture de piste, Trait de poursuite, Sifflet bref, Repli couvert, Battement de meute · ouverture 0 · chief |
| Meneur de meute | ×1,50 | ×1,60 (+7 %) | ×1,57 (+5 %) | ×1,55 (+3 %) | ×2,00 (+33 %) | ×1,71 (+14 %) | ×1,64 (+9 %) | Veilleurs du Sceau (4) : Trait de poursuite, Repli couvert, Garde de meute, Partage de chasse, Retour de la meute · ouverture 0 · chief |
| Fulgurant | ×1,57 | ×1,64 (+4 %) | ×1,60 (+2 %) | ×1,60 (+2 %) | ×2,00 (+27 %) | ×1,71 (+9 %) | ×1,67 (+6 %) | Veilleurs du Sceau (4) : Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer, La Phrase souveraine · ouverture 0 · chief |
| Sigillaire | ×1,55 | ×1,64 (+6 %) | ×1,64 (+6 %) | ×1,60 (+3 %) | ×2,06 (+33 %) | ×1,78 (+15 %) | ×1,67 (+8 %) | Veilleurs du Sceau (4) : Cercle de givre, Sceau de garde, Trait fulgurant, Sceau de répit, Sceau du foyer · ouverture 0 · chief |
| Glyphiste | ×1,60 | ×1,78 (+11 %) | ×1,71 (+7 %) | ×1,67 (+5 %) | ×2,00 (+25 %) | ×1,90 (+19 %) | ×1,81 (+13 %) | Veilleurs du Sceau (4) : Sceau de garde, Sceau de répit, Sceau du foyer, Sceau de résonance, Cercle du refuge · ouverture 0 · chief |

## Échecs juste au-dessus du mur

Causes des défaites à mur × 1,03 (graines de confirmation), meilleur outil de chaque case.

- mort:attack : 5564
- mort:aura : 3639
- temps : 1444
- mort:charge : 966

