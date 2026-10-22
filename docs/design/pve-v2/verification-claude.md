# PvE v2 : ce que donnent les outils de situation dans le moteur

> Rédigé par Claude le 22 octobre 2026, à la suite de la livraison de GPT (`Bramo-PvE-v2.md`, commit `ec9151a`). Rapports bruts, échecs compris : `sim/reports/combat/zones-v2/outils.md` (et `.json`), `sim/reports/combat/zones-v2+zones-v2-repli/outils.md`, `sim/reports/combat/zones-v2-limite/outils.md`.

**Statut : rien n'est adopté.** Le catalogue reste une proposition (`sim/proposals/zones-v2/tools.yaml`). Il est désormais **exécuté** par le moteur du jeu et mesuré. Il tient deux critères d'acceptation sur cinq. Il échoue nettement sur Fracture et Battue, pour une raison de fond que la section 3 explique.

## 1. Ce qui a été ajouté au moteur (inactif par défaut)

Tout suit `design/extensions-moteur.md`. Les combats existants sont identiques : les 140 tests du moteur passent, dont 9 nouveaux tests de conservation.

| Contrat | Implémentation |
|---|---|
| Danger et fureur sur toutes les sources (§5) | `threat()` : danger × fureur, appliqués **une fois** aux coups, charges, érosion et aura. Avant, l'aura ignorait le danger, et l'aura comme l'érosion ignoraient la fureur. |
| Six primitives (§3) | `CombatantSetup.tools` (`toolSchema` : `interstice`, `rain`, `impact`, `beat`, `fracture`, `breath`). Une seule variante active par famille, au rang set4 > gemme > set3 > préparation > set2. Les effets secondaires ne redéclenchent aucune mécanique de classe. |
| Ordres de calcul (§2) | Battue puis fenêtre (avec stockage Interstice, sans sur-dégât) puis garde et Fracture (aucun supplément sur les PV) ; restitution Interstice sans défense, critique ni vulnérabilité, une fois par cycle. Impact s'applique après les affaiblissements et avant les boucliers ; Repli couvert vient après les boucliers ; Reprise est rendue en fin de pas. |
| Priorité de cible (§4) | `targetPriority: chief \| adds_first \| unguarded_first`. Elle est réévaluée à chaque action, jamais sur un renfort à venir. L'Angle reste sur sa Proie. |
| Repli couvert (`traqueur.yaml`) | Champ de sort `selfPool` : réserve personnelle de 12 % des PV max de début de combat. Elle ne profite ni de la Puissance de soutien ni des plafonds de bouclier, et ne protège pas de l'aura ni de l'érosion. Le test vérifie 336 à 2 800 PV et 672 à 5 600 PV. |
| Recherche équipée (`verification.yaml`) | `sim combat-tools` : PV × D^1,5 ; plans du criblage joués en quatre ouvertures (tout à 0 s, ou le sort le plus fort à 4, 8 ou 10 s) et avec chaque priorité utile. Le choix se fait sur 4 graines puis 32 ; le mur retenu est rejoué sur **64 graines réservées**, jamais vues pendant le choix. |

**Écarts au protocole de `verification.yaml`, à garder en tête :**
- **Statistiques réelles (5a) non branchées.** Le témoin est « aucun outil » avec les statistiques normalisées (P 100, PV 2 800). Il n'y a pas encore de set généraliste dans le moteur. Les ratios sont donc des **majorants** : face à un généraliste qui apporterait 0 à 5 %, un outil gagnerait un peu moins.
- 64 graines réservées au lieu de 128. Il n'y a pas de paires 4+4, de nommés, ni de recherche d'ouverture exhaustive (4 variantes par plan).
- Plans : les finalistes du criblage du kit au danger normal. Un plan bon seulement au mur peut manquer ; une variation de ±3 % d'un essai à l'autre est du bruit de cette sélection.
- Les morts par érosion sont comptées « aura » dans les causes (même champ `killedBy`).
- `sim/reports/combat/zones-v2/recherche.md` est l'**ancienne méthode**, gardée en régression comme GPT le demandait : kit seul, dégâts seuls, moteur d'avant la correction (aura sans danger). Les Fours y montrent un mur ≥ ×4 que la correction fait tomber vers ×1,3 à ×1,9.

## 2. Résultats contre les critères d'acceptation solo

| Critère | Résultat |
|---|---|
| 1. ≥ 6 zones où l'outil adapté donne ≥ ×1,25 **pour chaque voie** | **4/12, non tenu** : Trois coups, Fours, Terrasses, Belvédère. Presque tenu : Lanternes (6/9 voies), Échos (7/9). |
| 2. Chaque set et gemme premier de sa catégorie dans ≥ 2 zones | **Non tenu pour Battue (1 zone) et Fracture (1 zone, préparation 0).** Les quatre autres familles le tiennent. |
| 3. Aucune voie sous ×1,5 avec son meilleur outil | **Un seul cas : Tue-Bête, Cour des trois coups (×1,45). Corrigé par Repli couvert (×1,78).** |
| 4. DPS le plus rapide de sa classe dans ≥ 7 zones | Forgefeu 10/12, Traqueur 10/12. **Runiste 5/12** : le Glyphiste est plus rapide que le Fulgurant dans 7 zones. Le défaut vient du kit, pas des zones (il était déjà noté à l'étape 3). |
| 5. Paires, nommés, budgets | Non testé (les ensembles généralistes et les nommés ne sont pas dans le moteur). |

Ratio médian de l'ensemble 4 adapté (mur outil / mur témoin, même voie) :

| Zone | Famille | Médiane | Pire voie |
|---|---|---|---|
| Lanternes | Interstice | ×1,29 | ×1,16 Piégeur |
| Fossés gris | Pluie | ×1,13 | ×1,09 Trempe-Rouge |
| Trois coups | Impact | **×1,45** | ×1,37 Tue-Bête |
| Vergers | Battue | ×1,18 | ×1,11 Fulgurant |
| Cloître | Fracture | **×1,03** | ×1,00 Fulgurant |
| Fours | Reprise | **×1,37** | ×1,26 Glyphiste |
| Échos | Interstice | ×1,36 | ×1,21 Piégeur |
| Gué | Pluie (+ Impact) | ×1,21 | ×1,15 Enclumier |
| Deux sceaux | Fracture | **×1,00** | ×0,97 Trempe-Rouge |
| Terrasses | Impact | **×1,41** | ×1,31 Trempe-Rouge |
| Atelier | Battue | ×1,05 | ×0,97 Fulgurant |
| Belvédère | Reprise (+ Impact) | ×1,31 | ×1,25 Glyphiste |

**Ce qui marche bien :**
- **Les outils défensifs (Impact, Reprise) gagnent un cran franc partout**, pour les neuf voies. Chaque famille est première dans ses zones, au rang set comme au rang gemme. Impact ne fait que +5 à +13 % en appoint dans les zones 8 et 12, comme GPT le visait.
- **Les gemmes valent environ 60 à 75 % du set 4** et les préparations nettement moins : c'est l'échelle voulue.
- **Aucun outil n'est bon partout** : hors de sa mécanique, il vaut zéro, par construction et vérifié par les tests.
- **Le motif voulu par Louis apparaît dans les zones défensives** : un même joueur change d'outil de zone en zone, sans changer de classe ni de voie.

**Ce qui ne marche pas, et ce qui est seulement inégal :**
- **Fracture ne vaut rien** (de −3 à +8 %). C'est la conséquence d'une loi simple, détaillée section 3. Dans les Deux sceaux, la priorité « chef sans garde » contourne déjà la garde alternée ; le Fulgurant et le Sigillaire la dissipent nativement (Cercle révélateur).
- **Battue reste sous le cran** : +11 à +23 % aux Vergers, 0 à +11 % à l'Atelier. Les renforts (4 × 500 PV, ou un auxiliaire de 850 PV) pèsent trop peu face au chef.
- **Pluie dépend de la classe** : +37 à +47 % pour le Traqueur, qui n'a pas de purification avant le niveau 85, mais +9 à +15 % pour le Forgefeu et le Runiste, qui ont Refroidissement et Sceau de répit. GPT l'avait annoncé comme une différence de kits. Avec le critère « pour chaque voie », la zone échoue quand même.

## 3. La loi qui explique Fracture et Battue

Avec la pente couplée (dégâts × D, PV × D^1,5), il faut D^1,5 fois plus de temps pour tuer, et la survie dure environ 1/D fois moins longtemps. Le mur obéit donc à peu près à **D^2,5 ∝ (gain de vitesse) × (réduction des dégâts subis)^-1**. Un cran (×1,25) demande alors **environ +75 % de vitesse, ou environ −43 % de dégâts subis**. GPT donne le même ordre de grandeur (« l'exposition cumulée peut augmenter d'environ 75 % »).

- Impact et Reprise retirent une large part des dégâts réellement subis dans leurs zones (lourds ×6, aura de 23 PV/s) : ils passent le cran.
- Interstice (fenêtres à −80 ou −85 %) rend une grande part des dégâts perdus : il passe presque partout.
- Fracture ×2 n'accélère le Cloître que d'environ 25 % (Trempe-Rouge : 309 s → 226 s à ×1,6). C'est trois fois trop peu pour un cran. De plus, la garde suit les PV (× D^1,5) : vers ×1,8, elle se reforme plus vite (≈ 150 par seconde) que le DPS ne la perce (≈ 100 par seconde). La zone devient une course au DPS.
- **La limite de combat de 240 s devient un mur caché** : 1 444 des défaites juste au-dessus des murs sont des « temps écoulé ». Le diagnostic à 600 s (`zones-v2-limite`) relève les murs du témoin, mais **ne rend pas Fracture utile** : le joueur meurt alors avant la fin, avec ou sans outil.

**Conséquence de conception :** un outil offensif ne peut gagner un cran que si la mécanique qu'il contre représente **la majorité de l'effort** du combat (fenêtre à −80 %), ou si la cible qu'il accélère est **la source des dégâts subis**. Il faut par exemple des renforts qui frappent fort : les tuer plus vite réduit à la fois le temps et les dégâts.

## 4. Repli couvert (A/B, trois voies du Traqueur)

| Voie | Pire mur, sans → avec | Effet |
|---|---|---|
| Tue-Bête | ×1,45 → ×1,64 | +5 à +23 % dans toutes les zones ; le critère 3 est tenu |
| Piégeur | ×1,60 → ×1,50 | +3 à +28 % presque partout. Cloître : −10 %, à recontrôler, car le criblage a changé de plans. |
| Meneur de meute | ×1,57 → ×1,57 | +0 à +17 %, souvent 0 : **il ne devient pas le meilleur partout** |

Repli figure dans 53 des 54 meilleurs réglages du Tue-Bête. Le temps moyen au danger normal ne change presque pas (63,2 → 64,4 s). **Recommandation : adopter ce Repli** (cooldown 18 s, 12 % des PV max pendant 8 s), après la recontrôle du Piégeur au Cloître.

## 5. Ce que je recommande de dire à GPT

1. **Garder** Impact, Reprise et Interstice tels quels ; ils remplissent leur rôle. Interstice : vérifier les deux voies sous ×1,25 (Piégeur, Tue-Bête) après les statistiques réelles.
2. **Refaire Fracture.** Voici trois options, à mesurer :
   - la garde suit le danger D, pas D^1,5, pour qu'elle reste une part fixe de l'effort ;
   - elle couvre une part bien plus grande du combat (par exemple 70 % du temps), et Fracture ×3 ;
   - ou Fracture devient défensive : la garde ennemie renvoie ou renforce des coups, et la briser coupe la menace.

   Dans tous les cas, **retirer les Deux sceaux de Fracture** : la priorité de cible y suffit déjà. Il vaut mieux en faire une zone « priorité ».
3. **Refaire Battue** : des renforts qui sont **la source principale des dégâts** (vagues qui frappent fort, et un auxiliaire qui soigne beaucoup plus que 3 × 600). Cible : au moins 75 % de vitesse ou 40 % de dégâts subis en moins quand on les tue vite.
4. **Pluie** : soit accepter que la zone ne vaille un cran que pour le Traqueur, et ne pas la compter dans le critère des six zones ; soit une érosion plus rapide, que le cooldown des purifications natives ne suffit plus à suivre.
5. **Limite de combat** : avec la pente couplée, elle devient un mur caché. Il faut la décider : fureur seule, ou limite × D^1,5.
6. **Runiste** : le Fulgurant est moins rapide que le Glyphiste dans 7 zones. C'est un chantier du kit (Encre du Glyphiste), à traiter à part.

## 6. Pas encore fait

- Les critères de groupe : les 714 compositions, l'écart d'équipement ≤ 10 % et la non-domination des groupes sans DPS. Seule la régression de l'écart d'équipement a été rejouée après la correction danger/fureur (section 7).
- La variante avec fureur (`zones-v2-fury`), les statistiques réelles des objets, les paires 4+4, les nommés, la route profonde et le rendement horaire.

## 7. Régression des groupes après la correction danger/fureur

`sim combat-gear-gap` (Fonderie, `fureur-v0`, pente du dossier), rejoué avec le moteur corrigé : `ecart-equipement.md` est **identique octet pour octet**. La Fonderie n'a ni aura ni érosion à fort danger, donc les conclusions de groupe de `analyse.md` §3.4 et §9 sont inchangées. Le +15 % demandé par quatre DPS n'est donc toujours pas rapproché du critère de +10 % : c'est à rejouer avec les statistiques réelles et les outils en groupe.
