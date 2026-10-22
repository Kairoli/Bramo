# Cohérence du combat et du contenu

> **Statut** : diagnostic, architecture et mesures de Claude, 22 octobre 2026, sur `main` à `9fbf40d` (plus ce chantier). Marques du projet : **[Décidé par Louis]**, **[Proposé par Claude]**, **[Ouvert]**. Rien n'est adopté : `data/` n'a pas changé. Toutes les mesures viennent du **moteur du jeu** (`fight`, `packages/shared/src/combat/engine.ts`), mêmes graines pour tous les cas comparés ; les rapports bruts, échecs compris, sont dans [`sim/reports/combat/coherence/`](../../../sim/reports/combat/coherence/).

## 0. En une page

**La question** : comment un joueur comprend un mur, choisit un build, obtient les pièces, franchit le mur, et pourquoi ce choix reste intéressant ensuite. **La réponse mesurée aujourd'hui** : le palier du catalogue écrase tout le reste ; deux outils défensifs valent autant qu'un palier du catalogue (et quarante niveaux avec une courbe à +12 %) ; deux autres ne servent à rien ; le build (ensembles généralistes et gemmes) pèse à peine un palier à +12 %, avec un élément qui s'impose dans chaque couche.

**Ce que disent les mesures** (moteur du jeu, statistiques réelles de l'équipement, 18 rencontres, 9 voies, échecs gardés) :
1. **Un palier du catalogue vaut 1 à 2 crans** de mur (Puissance ×2,7 puis ×1,7) alors que §5.5 dit « +10 % » et que la route monte de 0,36 cran par zone. Le Légendaire est plus faible que l'Épique ; **l'armure protectrice perd dans les 18 rencontres** ; quatre lignes aléatoires n'ont aucun effet en combat.
2. **Les ensembles généralistes ne font pas franchir de murs** : 0 à 5 % chacun, +6 à +10 % pour la meilleure paire 4+4 ; **l'Enclume patiente est dans la meilleure paire de 6 voies sur 9** (la Vigie dans 4) ; trois ensembles ne font rien. Ils font doublon avec les gemmes.
3. **Les gemmes et les nommés valent 0 à 4 % chacun**, quatre gemmes +5 à +7 % de mur et +3 à +11 % de vitesse ; **Cendre vive** est dans la meilleure combinaison de 8 voies sur 9. Avec les plans conseillés, un tiers des talents ne se déclenchent jamais.
4. **Le plan sûr au lieu du plan conseillé vaut +7 à +25 % de mur** : plus que tout le build.
5. **Outils de situation contre un vrai généraliste** : Impact et Interstice ×1,40 à ×1,48, Reprise ×1,29, Pluie ×1,09 à ×1,22, **Battue et Fracture ~×1,0**. Refaites par le contenu (renforts qui portent les coups ; garde menaçante que le DPS perce presque), **Battue passe à ×1,25 et Fracture à ×1,15**, pour les neuf voies. Avec les outils, 24 % des défaites au-dessus du mur sont des « temps écoulé ».
6. **À budget égal, aucune rencontre ne récompense les PV plus que la Puissance**, et **un palier à +12 % vaut ×1,096 de mur** : un cran (×1,25) vaut 2,5 paliers.

**L'architecture proposée** (§3) : **une couche, un rôle** — le **palier** fait la progression et sert d'**unité de compte** ; les **ensembles sont des réponses de situation** (six familles, une à deux régions chacune, 2/3/4 qui renforcent un même effet) ; les **gemmes font le build** (style, vitesse), les nommés en sont les trophées ; la **préparation** est la première réponse, avant le mur ; le **plan** a deux versions, farm et mur. Aucune source ne vaut plus de 1,5 palier ; tout le build tient dans un palier. Une seule géographie : six régions, deux familles et deux zones de route chacune. Les ensembles généralistes, les 7 ensembles de `data/gear_sets.yaml`, les statistiques mortes et les fragments d'ensemble disparaissent.

**Ce que Louis doit trancher** (§5) : la courbe de palier (+12 % recommandé), le rôle des ensembles (situation seulement, recommandé), les gemmes de situation dans les quatre majeures (oui), l'orientation à valeur égale, les statistiques mortes (retirées), la limite de combat (la fureur seule), deux plans conseillés, Fracture et Battue par le contenu, le calendrier des ensembles par région.

## 1. Ce qui a été construit pour mesurer

Tout est **inactif par défaut** : sans les nouveaux champs, les combats sont identiques au bit près (tests de conservation ; les 140 tests d'avant passent sans changement, plus 8 nouveaux dans `packages/shared` et 2 dans le simulateur, qui retrouve toujours le banc Python à 0,5 % près).

| Pièce | Où | Rôle |
|---|---|---|
| **Conversion des statistiques** (étape 5a) | `rules.gearStats` (schéma `gearStatsSchema`), `statsFromGear` dans `combat/loadout.ts` | Lignes fixes et aléatoires de l'équipement → P, PV, réduction, Critique, Cadence, pénétration, dégâts par élément, bouclier de départ. Puissance et PV linéaires ; Défense, Cadence, Critique à rendement décroissant `plafond × score / (score + K)`, K selon le palier du porteur. Sans `gearStats`, les statistiques de référence (le jeu actuel). |
| **Langue commune des talents** | `talentSchema`, `talentCatalogSchema` ; interpréteur dans `engine.ts` | « Quand [événement], si [conditions], alors [action] » avec délai interne, compteurs, seuils, préparations, réserves ; 22 déclencheurs, conditions d'état de cible, de compétence, de motif de runes ; profondeur 1 (un effet de talent ne déclenche jamais un talent), dégâts sans critique ni outil de situation, boucliers et soins secondaires. Exprime **les 18 gemmes, les 18 ensembles et 12 nommés** du dossier 1 sans code propre à chacun. |
| **Budget unique** | `resolveLoadout` (`combat/loadout.ts`) | Quatre majeures (gemmes, nommés, gemmes de situation), une gemme n'agit qu'une fois, pièces d'ensemble plafonnées, paliers 2/3/4 cumulés pour un ensemble de build, rang `set2/3/4` pour un ensemble de situation, une préparation. |
| **Garde menaçante** | `guard.empower`, `guard.scale` | Pour refaire Fracture (§4.4) : tant que la garde tient, son porteur frappe plus fort ; la garde peut suivre le danger D au lieu de D^1,5. |
| **Laboratoire** | `sim/src/coherence/`, `sim combat-coherence --step …` | Kits du catalogue, murs à graines fixes (24 graines, encadrement à 3 %), choix du plan par voie (conseillé, de groupe, le plus sûr), criblage des combinaisons, parts sur 4 cœurs. |
| **Proposition** | `sim/proposals/coherence-v1/` (conversion, catalogue des talents), `coherence-zones-v1/` (trois zones refaites) | Données lues par le simulateur seulement. |

**Méthode commune.** Difficulté couplée du PvE v2 : dégâts ennemis × D, PV, garde et soins ennemis × D^1,5. Le **mur** d'un équipement est le plus haut D gagné à 90 % sur 24 graines (5000 et suivantes), encadré à 3 % ; un **cran** = ×1,25. Rencontres : les six profils du banc et les douze zones du PvE v2 (18 en tout). Répertoire de sorts 80 partout, pour isoler l'équipement. Le **témoin** est le kit « palier 20, Rare, mixte » de la classe, converti (≈ P 100, PV 2 800, 25 % de réduction : les statistiques de référence d'avant). Chaque cas garde ses causes de défaite juste au-dessus du mur.

## 2. Diagnostic, système par système

Pour chacun : son rôle, ce qui fait doublon, ce qui se contredit d'un dossier à l'autre, ce qui n'a pas de raison d'exister. Les chiffres sont mesurés (rapports entre crochets).

### 2.1 Classes, voies et sorts — l'identité

**Rôle.** La façon de faire des dégâts : Braises, Angle, phrase runique ; la voie spécialise. C'est la couche qui doit rester la plus visible (dossier 1 §21 : « s'ils ne parlent que du bonus quatre pièces et jamais de Braises, Proie ou runes, l'équipement a pris trop de place »).

- **Les voies d'une même classe partagent l'essentiel de leurs sorts** (à terme 12 sorts communs et l'ultime, contre 3 de voie) ; les meilleurs plans d'Enclumier et de Rémouleur ne contiennent aucun sort de leur voie (étape 3). La voie se résume souvent à un passif.
- **Le plan pèse plus que tout l'équipement de build.** Au mur, le plan **le plus sûr** du criblage est retenu dans 72 % des cases (le conseillé dans 19 %, le plan de groupe dans 9 %), et il vaut **+7 à +25 % de mur** selon la voie (médiane ≈ +14 %, jusqu'à +65 % pour le Rémouleur), +22 à +36 % dans les zones d'érosion et d'aura, où un sort de purification ou de soin change tout ; ~0 % dans les zones à renforts ou à garde [`ensembles.md`, plans retenus ; comparaison au plan conseillé seul de `equipement.md`]. Les plans conseillés actuels sont faits pour la **vitesse en solo** : bons pour farmer, mauvais pour franchir un mur.
- **Classes inégales, à équipement égal** : avec le même kit (palier 20 Rare), le Tue-Bête et le Piégeur franchissent 6 à 17 % moins haut que les autres voies (×1,20 et ×1,23, contre ×1,31 à ×1,44 ; ≈ −0,5 cran), le Glyphiste le plus haut (×1,44) [`equipement.md`]. Le Repli couvert du PvE v2 corrige une partie de l'écart (`verification-claude.md` §4).
- **Fulgurant plus lent que Glyphiste dans 7 zones sur 12** (`verification-claude.md`) : l'Encre convertit les dégâts absorbés en dégâts infligés, donc **le Glyphiste accélère quand l'ennemi frappe plus fort**. C'est un couplage de structure (offense indexée sur le danger), pas un réglage de zone.

### 2.2 Statistiques et équipement — la progression verticale

**Rôle.** Ce qui fait franchir la route profonde avec le temps : palier, rareté, jets, chef-d'œuvre (« les murs se franchissent par le niveau, l'équipement et le build », [Décidé par Louis]).

**Trois courbes de palier différentes, et aucune n'est celle de la route** [`kits.md`, `equipement.md`, `budget.md`] :

| Source | Palier 1 → 10 | Palier 10 → 20 |
|---|---|---|
| `combat-items.md` §5.5 (rubrique décidée par Louis) | « un palier ≈ +10 % de statistiques, une rareté ≈ +5 %, la ligne variable ±3 % » | idem |
| Lignes fixes du catalogue (`gear.yaml`) | Puissance ×2,7 | ×1,7 |
| Lignes aléatoires (`gear_pools.yaml`, `tierScale`) | ×1,45 | ×1,31 |
| **Mur mesuré** (kits du catalogue convertis) | **×1,56 à ×1,61 (2 crans)** | **×1,29 à ×1,32 (1,1 à 1,25 cran)** |
| Route profonde du PvE v2 (`D(s) = 1,008^s`) | une zone de dix nœuds = ×1,083 (0,36 cran) | idem |
| Courbe proposée (+12 % de P et de PV par palier) | **+9 à +10 % de mur, 0,38 à 0,44 cran** | idem |

Ce que le catalogue donne d'autre (mur médian des neuf voies sur les 18 rencontres) :

| Passage | Mur | Crans | Cible (§5.5, si « +5 % par rareté ») |
|---|---|---|---|
| Commun → Rare (palier 20) | ×1,23 | 0,94 | ≈ 0,2 |
| Rare → Épique | ×1,12 | 0,50 | ≈ 0,2 |
| **Épique → Légendaire** | **×0,92** | **−0,37** | ≥ 0 |
| Rare du palier 10 → Commun du palier 20 | ×1,06 | 0,25 | ≈ 0 (« une pièce Rare du palier précédent vaut un Commun du suivant ») |
| Lignes aléatoires au jet moyen (palier 20 Rare) | ×1,18 | 0,75 | ≈ 0,1 (« ligne variable ±3 % ») |
| Mixte → **tout protecteur** | ×0,92 | −0,37 | ≈ 0 |
| Mixte → tout offensif | ×1,03 | +0,13 | ≈ 0 |

- **Le Légendaire est plus faible que l'Épique** : ses lignes fixes sont moindres (un seul modèle par emplacement, sans orientation, des emplacements manquants au palier 1) et sa valeur repose sur 3-4 lignes aléatoires, dont près d'un quart sont mortes (ci-dessous).
- **L'armure protectrice perd partout** : pour les **9 voies dans les 18 rencontres**, le kit protecteur franchit moins haut que l'offensif (×0,82 à ×0,97). Cause : la Puissance est linéaire, la Défense à rendement décroissant, et le catalogue échange ~1 point de Puissance contre ~1,5 de Défense. Mesure synthétique [`budget.md`] : à budget égal, +30 % de Puissance donne +12 % de mur, +30 % de PV +9 à +12 %, et une réduction équivalente seulement +9 % — **+3 % dans les zones d'aura et d'érosion**, que la réduction ne touche pas. **Aucune rencontre ne fait gagner les PV sur la Puissance** (0/9 voies dans les 18 rencontres) : l'orientation n'est pas un levier de situation, elle ne peut être qu'un choix d'équilibre à valeur égale.
- **Statistiques et lignes sans effet en combat** : Ténacité (aucun ennemi ne contrôle le joueur), Résistance au ralentissement (aucun ennemi ne le ralentit), Régénération (ni période ni base), « Dégâts de l'élément de l'arme » (l'élément vient des sorts, [Décidé par Louis]). Ce sont 4 des 15 libellés de lignes et **14 des 60 lignes possibles** des groupes d'emplacement (la moitié au torse et aux jambes) : près d'un jet sur quatre ne fait rien.
- **La Cadence est inégale entre classes** : le Forgefeu en a dès le Rare, le Traqueur et le Runiste seulement à partir de l'Épique (deux fois moins), alors que toutes les rencontres ont été réglées avec 12 % (la conversion proposée donne cette base à tous).
- Les lignes aléatoires sont identifiées par leur **libellé français** : migration nécessaire vers des identifiants (déjà relevé, `integration.md` §2).

### 2.3 Ensembles — trois couches qui ne s'emboîtent pas

**Rôle voulu par Louis** : les ensembles de 2/3/4 pièces font alterner les builds selon les zones [Décidé par Louis]. Trois catalogues prétendent le remplir :

| Couche | Taille | Effets | Dans le moteur |
|---|---|---|---|
| `data/gear_sets.yaml` | 7, une classe chacun | texte illustratif, chiffres différents du dossier 1 pour les mêmes noms (Cendres, Enclume, Empreinte, Ronces, Orage, Sceau) | jamais exécutés |
| Dossier 1 §11 (« généralistes » et de classe) | 12 communs + 6 de classe | déclencheurs de 0,15 à 0,55 P, modificateurs de 4 à 10 % | **exécutés ici** (`coherence-v1/talents.yaml`) |
| PvE v2 (« situation ») | 6 familles | effet fort contre une mécanique, nul ailleurs | exécutés (`zones-v2/tools.yaml`) |

Cinq noms servent à deux effets différents (Enclume patiente, Passeurs de braise, Mains de traverse, Heures creuses, Veilleurs du sceau) ; GPT demande que la version de situation remplace l'ancienne (PvE v2 §5).

**Mesure des ensembles du dossier 1, avec les statistiques réelles et le meilleur plan** [`ensembles.md`] : un ensemble à 4 pièces **ajoute 0 à 5 % au mur** (médiane 0 à 3 % selon l'ensemble, au plus 0,2 cran) ; **Cendres, Passeurs de braise et Dernière empreinte n'ajoutent rien** (0 %), Autre revers et Veilleurs ~1 %. Les plus forts : Enclume patiente (+3 à +4 %, premier ou ex æquo dans 104 cases voie × rencontre sur 162), Vigie (+2 à +4 %, 72), Orage (+1 à +5 %, 58), Rivets (+3 à +4 %). En vitesse au danger normal, ils valent **+0 à +15 %** (Orage +3 à +15 %, Mains de traverse 0 à +14 %, Vigie +5 à +9 %).

Les **91 paires 4+4** par voie : la **meilleure vaut +6 à +10 % de mur** (≈ 0,3 cran), la médiane +2 à +4 %, la dernière +0 à +1 % ; meilleure / médiane : +3 à +6 %. Après murs complets, **l'Enclume patiente est dans la meilleure paire de 6 voies sur 9** (avec la Vigie pour le Piégeur, le Fulgurant et le Glyphiste ; avec Pas dans les pas pour le Tue-Bête et le Meneur ; avec la Phrase inachevée pour le Sigillaire), Orage + Rivets pour Trempe-Rouge et Enclumier, Vigie + Rivets pour le Rémouleur ; l'Enclume est dans 45 des 90 « dix meilleures » du criblage ; seuls 1 à 9 assemblages par voie restent à 90 % du meilleur. La domination annoncée par le dossier 1 (la Vigie) se confirme, l'Enclume plus encore. **Aucune paire ne fait gagner un seul combat un cran au-dessus du mur du témoin** (91 paires × 9 voies × 18 rencontres × 8 graines à mur × 1,25 : 0 victoire). Pour comparaison, un ensemble de situation à 4 pièces vaut +13 à +45 % de mur dans sa mécanique (majorant de `verification-claude.md`).

Lecture : **les ensembles généralistes ne sont pas un levier de mur** (ils pèsent dix fois moins que les ensembles de situation, et moins que le choix du plan) ; ils sont un **léger levier de vitesse**, comme les gemmes. Ils font doublon avec elles (même langue, même ordre de grandeur), et trois d'entre eux n'ont pas de raison d'exister en solo.

### 2.4 Gemmes majeures — deux rôles concurrents

**Rôle décidé** : les talents sont portés par les gemmes, « pierre angulaire des builds » [Décidé par Louis]. Le PvE v2 y ajoute **six gemmes de situation** dans les mêmes quatre places. Ce sont deux rôles différents dans un même budget : c'est voulu (au mur, on échange de la vitesse contre une réponse), à condition que chacun soit lisible.

**Mesure des 18 gemmes du dossier 1** [`gemmes.md`] :
- **Seule, une gemme ajoute 0 à 4 % au mur** (médiane 0 à 2 % ; Assistance fine et Garde alternée en tête, Œil du chasseur et Bastion à 0 partout) et 0 à 8 % de vitesse.
- **Quatre gemmes** (370 combinaisons par voie, dont les 70 des huit meilleures gemmes seules) : la meilleure vaut **+5 à +7 % de mur** et +3 à +11 % de vitesse ; la médiane +3 à +5 % ; meilleure / médiane **+1 à +3 %** ; 17 à 77 combinaisons à 90 % du meilleur score. La dispersion est bonne, l'enjeu faible.
- **Cendre vive s'impose** : elle est dans la meilleure combinaison de **8 voies sur 9** et dans 68 des 90 « dix meilleures », alors que seule elle ne vaut que +1 %. C'est le seul talent qui part sur n'importe quelle action directe (une brûlure toutes les 8 s) : il nourrit les autres sans rien demander au plan. Rythme (38) et Assistance fine (46) suivent.
- **Avec les plans conseillés, un tiers des talents ne se déclenchent jamais pour 6 à 8 voies** (Garde alternée, Grâce oblique, Fil du retour, Relais…) [`declenchements.md`] : leur valeur dépend d'un plan qui soigne ou protège. Un éditeur de build doit le dire avant le combat (dossier 1 §14 le prévoyait).

### 2.5 Objets nommés

**Rôle décidé** : capacités uniques traitées comme des talents (une place de majeure), non fabricables en V1 [Décidé par Louis].

- **Seul, un nommé vaut 0 à 3 % de mur** [`gemmes.md`], comme une gemme : La Rancune, Murmure-d'épine, Le Mauvais Présage, Le Sceau qui tient ~0 ; Les Bonnes Manières, Le Bénéfice du doute, Le Petit Arrangement +2 à +3 %. Rien ne les distingue en puissance d'une gemme, ce qui est sain (un nommé ne doit pas être un « talent gratuit »), mais leur identité doit venir de leur lien à la mécanique de classe (Braises, Angle, runes) : c'est le cas des armes de classe, moins des six colliers universels, qui font doublon avec les gemmes.
- 24 nommés (dossier 1) pour une V1 où les ensembles, les gemmes et les zones se cherchent encore : beaucoup de contenu à faire vivre pour un effet de quelques pour cent.

### 2.6 Outils de situation — le levier de mur

**Rôle.** Répondre à une mécanique : un effet fort contre elle, nul ailleurs (PvE v2). Mesuré (`verification-claude.md`, contre un témoin sans rien) : Impact et Reprise gagnent un cran franc partout, Interstice presque partout, Pluie surtout pour le Traqueur, **Fracture ~0 et Battue +5 à +20 %**. La loi : avec PV × D^1,5 et dégâts × D, un cran demande ≈ +75 % de vitesse ou ≈ −43 % de dégâts subis ; un outil offensif ne passe le cran que si ce qu'il contre est la **source des dégâts** ou la **majorité de l'effort**. Ce chantier remesure ces outils contre un vrai généraliste (§4.3) et refait Fracture et Battue par le contenu (§4.4).

- **Contradiction de calendrier** : les ensembles sont prévus « à partir de 40 » (dossiers 1 et 2) ou « 20 comme première piste » (`combat-items.md` §7), alors que le premier circuit de la route (12 zones) couvre toute la montée de niveau. Avant 40, une zone qui demande un ensemble de situation n'aurait pas de réponse d'ensemble.
- **Doublon voulu, à garder** : ensemble 4 > gemme > ensemble 3 > préparation > ensemble 2 d'une même famille, une seule variante active. C'est une échelle de coût (8 emplacements, une majeure, un consommable), pas une redondance.

### 2.7 Butin, recettes et artisanat — l'obtention

**Rôle.** Relier le combat, les métiers et le marché ; le dossier 2 est le plus complet et le plus récent sur ce point.

| Sujet | Dossier 1 | Dossier 2 | PvE v2 | Verdict |
|---|---|---|---|---|
| Ensembles | caches de set (1/h dès 40), 6 fragments = une pièce choisie | tout fabricable dès 40 (patron + **vestige régional** + liant), caches 10 % par unité | premier patron accessible **avant** sa zone, par commande de préparation et ressources ordinaires | **dossier 2 + PvE v2** ; les fragments d'ensemble du dossier 1 disparaissent (les vestiges font ce travail) |
| Nommés | 5 % ciblé, 20 fragments **échangeables** pour sa part spéciale | 5 % par unité, **garantie au 20ᵉ**, compteur personnel, non fabricable | non fabricables | **dossier 2** [nommés non fabricables en V1 : Décidé par Louis] |
| Recyclage | poudres et fragments d'atelier | poudres (1 à 4 selon rareté et emplacement), aucun vestige rendu | — | conforme [Décidé par Louis] |
| Régions | 6 régions, 18 adversaires, 6 donjons | mêmes 6 régions, 4 vestiges + quartz de faille | « régions » = les 12 zones de la route | **trois géographies** (§3.5) |
| Or | aucun ajouté par le butin | aucun | — | conforme |

- **Le butin du dossier 2 cible des ensembles généralistes** (« Scorie de mémoire → Cendres, Enclume, Passeurs, Recuit »). Si les ensembles deviennent des réponses de situation (§3), la carte des vestiges doit suivre les familles.
- **Unité de référence de 6 min contre limite de combat de 240 s** (`analyse.md` §2) : à écrire comme un poids de récompense, jamais comme une durée.

### 2.8 Zones, route, donjons, boss, saisons — la place de chaque contenu

| Contenu | Rôle (dossier 2, retenu) | Ce qui manque |
|---|---|---|
| Zones de région | XP de classe, classiques, vestiges | leur lien aux familles de situation |
| Donjons (6 salles, 1 à 4, sans quota) | farm mêlé, trophées nommés, ensembles | repos 30 % avec préparation (mesuré) ; les familles de la région |
| Route permanente (12 × 10) | mesurer son personnage, checkpoints uniques | **calage sur la vraie courbe d'équipement** (§4.1) ; plan conseillé « de mur » |
| Route saisonnière (mutation) | expérimenter, collection | rien de bloquant |
| World boss (72 h, assauts de 10 min) | rendez-vous, quatre canaux | rien de bloquant (contributions déjà comptées par le moteur) |
| Routes franches (clan) | logistique | reporté (dossier 2, `analyse.md`) |

- **Trois géographies non reliées** : 6 régions de 3 adversaires (dossiers 1 et 2), 12 zones mécaniques de la route (dossier 2, PvE v2), et les « régions sources » du PvE v2 qui sont ces 12 zones. Une famille de situation doit savoir **où elle se farme**.
- **La limite de 240 s devient un mur caché** avec la pente couplée (1 444 défaites « temps écoulé » juste au-dessus des murs, `verification-claude.md`) ; dans ce chantier, 1 292 des 35 739 défaites juste au-dessus des murs du banc d'équipement sont des « temps » (4 %), le reste des morts.

### 2.9 Économie du combat

Conforme aux décisions : pas d'or neuf dans le butin, pas de rachat PNJ, vestiges et poudres échangeables, recyclage en poudres, réparation par le métier de la pièce, aucun bonus économique illimité. Un point de cohérence : **le soutien économise ses consommables** en donjon (`analyse.md` §3.3) — c'est une niche réelle, et un débouché régulier pour la Cuisine et l'Alchimie. Les préparations de situation (une par parcours) en ajoutent un second ; leur coût horaire reste à mesurer avec le marché.

### 2.10 Récapitulatif : doublons, contradictions, éléments sans raison d'exister

| Type | Élément | Mesure ou texte |
|---|---|---|
| Doublon | Ensembles généralistes du dossier 1 ↔ gemmes de build | même langue, même ordre de grandeur (0 à 5 % de mur, 0 à 15 % de vitesse) |
| Doublon | `data/gear_sets.yaml` ↔ ensembles du dossier 1 ↔ ensembles de situation | 7 + 18 + 6 catalogues, 5 noms à deux effets |
| Doublon | Fragments d'ensemble (d1) ↔ vestiges (d2) | deux monnaies pour la même pièce |
| Contradiction | Courbe de palier : +10 % (§5.5) ↔ catalogue (×2,7 puis ×1,7) ↔ lignes (×1,45 / ×1,31) ↔ route (0,36 cran par zone) | §2.2 |
| Contradiction | Rareté : +5 % (§5.5) ↔ catalogue (+0,9 cran Commun → Rare) ; Légendaire < Épique | §2.2 |
| Contradiction | Ensembles à partir de 40 (d1, d2) ↔ 20 (`combat-items.md`) ↔ zones de la route avant 40 | §2.6 |
| Contradiction | Butin des régions ciblé sur des ensembles généralistes ↔ ensembles de situation | §2.7 |
| Contradiction | 6 régions ↔ 12 zones ↔ « régions » du PvE v2 | §2.8 |
| Sans raison d'exister | Ténacité, Résistance au ralentissement, Régénération, « élément de l'arme » | aucun effet en combat |
| Sans raison d'exister | Cendres persistantes, Passeurs de braise, Dernière empreinte (4 pièces) | 0 % de mur, ≤ 5 % de vitesse |
| Sans raison d'exister | L'orientation protectrice telle que convertie | perd dans 18 rencontres sur 18 |
| Sans raison d'exister (avec les plans conseillés) | un tiers des talents (Garde alternée, Relais, Fil du retour, Enclume 4…) ne se déclenchent jamais pour 6 à 8 voies : ils demandent un soin ou un bouclier que le plan rapide n'a pas | [`declenchements.md`] |

## 3. Architecture unifiée [Proposé par Claude]

### 3.1 Une couche, un rôle

Le principe : **chaque couche répond à une seule question du joueur**, et son effet se mesure dans une seule unité.

| Couche | La question du joueur | Ce qu'elle fait gagner (cible) | Ce qu'elle coûte | D'où elle vient |
|---|---|---|---|---|
| **Niveau de classe** | « qu'est-ce que je peux jouer ? » | sorts, voie (30), ultime (75), palier d'équipement portable ; aucune statistique directe | temps de combat | combat seulement [Décidé par Louis] |
| **Palier d'équipement** | « jusqu'où je vais sur la route ? » | **+12 % de Puissance et de PV : 1 palier = ×1,096 de mur ≈ une zone de route** ; c'est l'unité de compte de tout le reste | usure, réparation | craft (patrons du dossier 2), butin, marché |
| **Rareté, jets, chef-d'œuvre** | « ma pièce est-elle bonne ? » | +5 % par rang, monotone (≈ 0,5 palier par rang) ; jets ≤ 0,7 palier ; chef-d'œuvre ≈ 0,3 palier | prix, chance | craft, butin, marché |
| **Ensemble de situation** (2/3/4) | « comment je passe **ce** mur ? » | 4 pièces ≈ **1 à 1,5 palier dans sa mécanique** (×1,10 à ×1,15), 0 ailleurs | 4 emplacements ; une ligne aléatoire de moins qu'une pièce classique | patron dès le palier de sa première région (matières ordinaires + vestige de cette région) ; donjon de la région |
| **Gemme de situation** | « … sans démonter mes ensembles ? » | ≈ 60 à 80 % de l'ensemble 4 (mesuré : 60 à 100 %) | une place de majeure, prise à un talent de build | Joaillerie, matières ordinaires |
| **Préparation** | « … avant d'avoir l'ensemble ? » | ≈ 0,4 à 0,6 palier dans sa mécanique | un consommable par parcours | Alchimie, Cuisine, matières ordinaires |
| **Gemmes de build** (4 majeures) | « comment j'aime jouer, et à quelle vitesse je farme ? » | **+10 à +25 % de vitesse**, ≤ 0,5 palier de mur ; plusieurs combinaisons proches du meilleur | une place chacune | Joaillerie (20+), marché, butin |
| **Nommé** | « j'ai un trophée » | une gemme de build unique, souvent liée à la mécanique de classe | une place de majeure | butin + garantie, marché [Décidé par Louis] |
| **Plan** | « dans quel ordre, sur qui ? » | **plan de farm** (vitesse) et **plan de mur** (sûreté : jusqu'à +25 % de mur, mesuré) | rien | gratuit, deux plans conseillés |
| Potions, repas | « je tiens le donjon ? » | repos 30 % + repas + 3 potions : les 9 voies passent (mesuré) | consommables | Cuisine, Alchimie |

**Ce qui disparaît** (justifié au §2) : les **ensembles généralistes** du dossier 1 comme couche à part (leurs meilleurs effets deviennent des gemmes de build : Enclume 4, Vigie 4, Orage 4 ; les six ensembles de classe deviennent des nommés ou des gemmes de classe) ; les **7 ensembles de `data/gear_sets.yaml`** ; les **4 statistiques et lignes mortes** ; les **fragments d'ensemble** (les vestiges suffisent) ; le Légendaire « plus faible que l'Épique ».

**Pourquoi ce choix reste intéressant ensuite.** Le cycle voulu (PvE v2 §10) devient mesurable : *je comprends le mur* (la zone annonce sa mécanique, la cause de défaite le confirme) → *je choisis une réponse* (préparation, gemme ou ensemble de la famille, plan de mur) → *je l'obtiens* (préparation et gemme en matières ordinaires, ensemble par le vestige de la région ou le marché) → *je passe plus tôt* → *je garde la réponse* : la même famille revient dans une autre zone, un donjon, une mutation. Entre deux murs, je reviens à mes gemmes de build et à mon plan de farm, qui font ma vitesse. Le **build reste la vitesse**, la **situation reste le mur**, le **palier reste la progression** : aucune couche ne fait le travail d'une autre.

### 3.2 Budget de puissance, en paliers d'avance

Un palier (×1,096 de mur) est l'unité de compte : **aucune source ne vaut plus de 1,5 palier dans sa mécanique, et le total du build tient dans un palier**. Ainsi un bon build, une bonne réponse ou un bon plan font franchir un mur **un à deux paliers plus tôt**, jamais vingt niveaux plus tôt, et rien n'est obligatoire : le niveau finit toujours par passer.

| Source | Mesuré aujourd'hui (paliers) | Cible proposée (paliers) | Raison |
|---|---|---|---|
| Un palier d'équipement | 2,8 à 4,8 (catalogue) | **1** (+12 % de P et de PV) | une zone de route par palier ; §5.5 de Louis (+10 %) à 2 points près |
| Rareté, par rang | +2,3 / +1,2 / **−0,9** | +0,5, monotone | §5.5 (« une rareté ≈ +5 % ») |
| Lignes aléatoires (jet moyen) | 1,8 | ≤ 0,7 | §5.5 (« la ligne variable ±3 % ») ; aucune ligne morte |
| Orientation protectrice / offensive | −0,9 / +0,3 | 0, au choix | aucune zone ne la récompense (`budget.md`) |
| Ensemble de situation 4, dans sa mécanique | 3,7 à 4,3 (Impact, Interstice) ; 2,7 (Reprise) ; 0,9 à 2,1 (Pluie) ; 0 à 1,2 (Battue) ; 0 à 0,6 (Fracture) — refaits : Battue 2,4, Fracture 1,5 | **1 à 1,5** pour chaque voie | §3.1 ; §4.3 et §4.4 |
| Gemme de situation / préparation | 0,3 à 3 / 0 à 2,1 | 0,6 à 1,2 / 0,4 à 0,6 | échelle du PvE v2 |
| Paire d'ensembles généralistes | 0,6 à 1,0 (et +4 à +16 % de vitesse) | supprimée (→ gemmes) | doublon des gemmes |
| Quatre gemmes de build | 0,5 à 0,7 (et +3 à +11 % de vitesse) | ≤ 0,5 de mur, **+10 à +25 % de vitesse** | le build fait la vitesse |
| Plan de mur au lieu du plan de farm | 0,7 à 2,4 | gardé tel quel | une réponse gratuite, qui s'apprend |
| Complémentarité d'un groupe | « +10 à +15 % de statistiques » (`analyse.md` §9) | ≤ 1 | principe de Louis |

### 3.3 Un budget de talents unique et lisible

- **Quatre majeures** (arme, torse, coiffe, collier) : gemme de build, gemme de situation ou nommé, **une place chacun** ; une même gemme n'agit qu'une fois (`resolveLoadout`). L'écran les montre en quatre cartes.
- **Mineures** : des statistiques seules, sur les autres pièces Rares et au-delà ; jamais de déclencheur.
- **Ensembles** : deux ensembles de 4 au plus (8 des 11 emplacements) ; d'une même famille, une seule variante agit (ensemble 4 > gemme > ensemble 3 > préparation > ensemble 2), délais partagés.
- **Une préparation** de situation, plus les potions et le repas.
- Le build s'affiche en une ligne : *4 talents · 2 réponses · 1 préparation · plan de farm / plan de mur*.

### 3.4 La boucle d'obtention

| Étape | Qui | Ce qui circule | Règle |
|---|---|---|---|
| Récolte | récolteurs | matières ordinaires du palier | jamais rendues par le combat (`analyse.md`, dossier 2 §11) |
| Craft | artisans | classiques et pièces d'ensemble de situation (patrons du dossier 2), gemmes (Joaillerie), préparations (Alchimie, Cuisine) | le **premier outil de chaque famille** (préparation, gemme) ne demande **que des matières ordinaires** : jamais enfermé derrière son propre mur (PvE v2 §5) ; l'ensemble demande en plus le **vestige de la région** de la mécanique |
| Marché | tous | exemplaires, gemmes, vestiges, poudres | taxe 5 %, pas de rachat PNJ [Décidé par Louis] |
| Drop | combattants | vestiges (garantis), classiques (20 %/unité), caches d'ensemble de situation (10 %/unité), **nommés** (5 % + garantie au 20ᵉ) | budget en unités de référence, poids = temps de référence / 360 s |
| Recyclage | tous | poudres et fragments d'atelier | [Décidé par Louis] ; aucun vestige rendu |

### 3.5 La place de chaque contenu, et une seule géographie

**Six régions, deux familles chacune, douze zones de route.** La route du PvE v2 enchaîne ses familles dans cet ordre : Interstice, Pluie, Impact, Battue, Fracture, Reprise, puis de nouveau Interstice, Pluie, Fracture, Impact, Battue, Reprise (`route.yaml`). En donnant **deux zones consécutives à chaque région**, chaque famille vit dans **deux régions** (une tôt, une tard) et chaque région fournit le **vestige** des deux ensembles qui répondent à ses mécaniques. Les adversaires du dossier 1 sont à réaccorder à ces familles (GPT) :

| Région (dossier 1) | Zones de route | Familles : on y farme leur vestige | Adversaires du dossier 1 qui s'y prêtent déjà |
|---|---|---|---|
| Les Abords du bourg (1-19) | 1 Lanternes, 2 Fossés | Interstice, Pluie | — (région d'apprentissage, à réécrire) |
| Les Forges éteintes (20-39) | 3 Trois coups, 4 Vergers | Impact, Battue | La Cloche de fer (frappe annoncée) |
| La Lisière des veilleurs (40) | 5 Cloître, 6 Fours | Fracture, Reprise | La Matriarche de résine (cocon) |
| Les Archives englouties (40) | 7 Échos, 8 Gué | Interstice, Pluie | Le Témoin sous l'eau (rythme), l'intention « dégâts périodiques » de la région |
| Le Bastion des longues veilles (40) | 9 Deux sceaux, 10 Terrasses | Fracture, Impact | Le Gardien des trois portes, le Porte-serment (gardes) |
| La Cicatrice des trois vents (40) | 11 Atelier, 12 Belvédère | Battue, Reprise | Le Régent des courants (combinaisons) |

Conséquence pour le calendrier (§2.6) : les ensembles de situation d'une famille existent **dès le palier de sa première région** (Interstice et Pluie au palier 10, Impact et Battue au palier 20, Fracture et Reprise au palier 40), et la préparation et la gemme de chaque famille sont accessibles avant sa première zone.

- **Route permanente** : elle **mesure** le personnage ; ses checkpoints sont uniques (« un peu de tout », [Décidé par Louis]) ; son premier circuit est calé sur la courbe de palier (§4.1). On n'y farme pas.
- **Régions et donjons** : on y **farme** : vestiges, classiques, caches, trophées nommés. Le donjon d'une région combine ses deux familles et son gardien.
- **Mutations de saison** : une règle sur la route saisonnière, qui peut associer deux familles ; récompenses de collection.
- **World boss** : assauts de 10 min ; ses phases tirent leurs mécaniques des six familles ; quatre canaux de contribution.
- **Avant le palier 40**, les zones de la route ne demandent que des réponses accessibles : plan, préparation, gemme de situation (Joaillerie 20), et les ensembles des familles des deux premières régions.

### 3.6 Invariants testables

| # | Invariant | Mesure | Aujourd'hui |
|---|---|---|---|
| I1 | Un palier vaut 0,3 à 0,5 cran ; rareté monotone, Légendaire ≥ Épique | `--step gear` | **non tenu** (1,1 à 2 crans ; Légendaire −0,37) |
| I2 | Aucune ligne aléatoire sans effet en combat | `deadLines` | **non tenu** (4 libellés) |
| I3 | Orientations à valeur égale : protecteur / offensif dans ×0,95-×1,05 | `--step gear`, `--step budget` | **non tenu** (×0,82 à ×0,97) |
| I4 | Chaque famille de situation : son ensemble 4 vaut ≥ 1 palier contre le généraliste **pour chaque voie** dans au moins une de ses zones, et ≤ 1,5 palier partout | `--step tools` | ≥ 1 palier : **tenu pour les six familles** avec les zones refaites (§4.4) ; ≤ 1,5 : **non tenu** (Impact, Interstice ≈ 4 ; Reprise 2,7 ; Battue refaite 2,4). Critère du PvE v2 (×1,25 dans 6 zones pour chaque voie) : 3 zones sur 12 |
| I5 | Aucun élément de build (gemme, ensemble) dans la meilleure combinaison de plus de la moitié des voies | `--step quads`, `--step pairs`, `--step pairwalls` | **non tenu** : Cendre vive 8 voies sur 9 ; l'Enclume dans 6 des 9 généralistes (avec la Vigie dans 4) |
| I6 | Meilleure combinaison de build / médiane : +5 à +15 % de vitesse ou de mur, et au moins trois combinaisons à 90 % du meilleur score, pour chaque voie | idem | gemmes : écart de mur +1 à +3 % (trop plat), 17 à 77 combinaisons proches (tenu) ; paires : +3 à +6 %, mais 1 à 9 combinaisons proches (Tue-Bête 1, Sigillaire et Glyphiste 2 : non tenu) |
| I7 | Un talent porté se déclenche dans au moins une rencontre pour chaque voie qui peut le porter, avec au moins un plan de la voie | `--step triggers` | **non tenu** avec les plans conseillés (§2.10) |
| I8 | DPS le plus rapide de sa classe dans au moins 7 zones | `combat-tools` | Runiste 5/12 (`verification-claude.md`) |
| I9 | Principes de groupe de Louis (`analyse.md` §9) | `combat-gear-gap` | 4 DPS : +15 % au lieu de +10 % |

## 4. Propositions mesurées

### 4.0 Ce que pèse chaque couche aujourd'hui (synthèse des mesures)

En paliers d'avance (×1,096 de mur chacun) et en vitesse au danger normal, médianes des neuf voies :

| Couche | Mur | Paliers | Vitesse |
|---|---|---|---|
| Un palier du catalogue (1 → 10, 10 → 20) | ×1,56 · ×1,29 | 4,8 · 2,8 | — |
| Ensemble de situation 4 (Impact, Interstice) contre le généraliste | ×1,40 à ×1,48 | 3,7 à 4,3 | — |
| Ensemble de situation 4 (Reprise ; Pluie) | ×1,29 ; ×1,09 à ×1,22 | 2,7 ; 0,9 à 2,1 | — |
| Ensemble de situation 4 (Battue ; Fracture) | ×1,00 à ×1,12 ; ×1,00 à ×1,06 | 0 à 1,2 ; 0 à 0,6 | — |
| Plan de mur au lieu du plan conseillé | ×1,07 à ×1,25 | 0,7 à 2,4 | — |
| Généraliste complet (meilleure paire + quatre gemmes), douze zones | ×1,11 à ×1,16 | 1,2 à 1,7 | — |
| Meilleure paire d'ensembles généralistes | ×1,06 à ×1,10 | 0,6 à 1,0 | +4 à +16 % |
| Meilleures quatre gemmes | ×1,05 à ×1,07 | 0,5 à 0,7 | +3 à +11 % |
| Une gemme ou un nommé seul | ×1,00 à ×1,04 | 0 à 0,4 | 0 à +8 % |

**Le déséquilibre se lit d'un coup d'œil** : le palier du catalogue et deux outils défensifs valent 3 à 5 paliers ; tout le build (ensembles généralistes et gemmes) en vaut à peine 1 ; deux outils (Fracture, Battue) ne valent rien. Le build ne peut pas être « la pierre angulaire » si un palier pèse cinq fois plus que lui ; et si l'on compresse la courbe sans toucher aux outils, un outil défensif remplacerait quarante niveaux d'équipement : il ne serait plus une option.

### 4.1 La courbe de palier et le calage de la route

**Mesure** [`budget.md`] : un palier à +12 % de Puissance et de PV donne **+9 à +10 % de mur dans les 18 rencontres et pour les 9 voies** (0,38 à 0,44 cran ; deux paliers +18 %). La loi `mur ∝ (Puissance × PV)^0,4` tient à quelques pour cent près, sauf la réduction de dégâts, qui ne protège pas de l'aura ni de l'érosion (+3 % au lieu de +9 %).

**Calage** [Proposé par Claude] : la route monte de `1,008^10 = ×1,083` par zone, un palier de ×1,096 ; le kit Rare d'un palier franchit donc environ **11,5 nœuds plus loin** que celui du palier précédent :

`nœud(palier k) ≈ nœud(palier 1) + 11,5 × k` (k = 0 pour le palier 1, 9 pour le palier 90)

Le premier circuit (120 nœuds, D × 2,6) couvre ainsi la montée du palier 1 au palier 90 (≈ 104 nœuds), le reste (rareté, jets, situation, build, plan) faisant les 16 derniers. Ce n'est pas encore une durée en jours : il faut la vitesse d'obtention des paliers (dossier 2).

**Unité commune : le palier d'avance.** Puisqu'un palier vaut ×1,096, tous les bonus se comparent en paliers. **Un cran (×1,25) vaut 2,5 paliers** : un outil de situation à ×1,25 (cible du PvE v2) remplacerait 25 niveaux d'équipement, ce qui rend le mur presque obligatoire à franchir avec lui. Je propose les cibles du §3.2 en paliers : ensemble de situation ≈ 1 palier dans sa mécanique, gemme ≈ 0,6 à 0,75, préparation ≈ 0,4, quatre gemmes de build ≤ 0,5 de mur, complémentarité d'un groupe ≤ 1 (principe de Louis, `analyse.md` §9).

**Les deux choix vont ensemble.** Avec la courbe du catalogue (un palier = 3 à 5 paliers « proposés »), un outil à ×1,25-×1,45 ne vaut qu'un palier réel et le critère du PvE v2 est cohérent ; avec la courbe compressée (+12 %), il faut des outils à ×1,10-×1,15. On ne peut pas garder la courbe compressée **et** les outils à ×1,4 : le mur deviendrait une serrure à une seule clé.

### 4.2 Le build : ensembles généralistes et gemmes

Mesures du §2.3 et du §2.4, avec les statistiques réelles et le meilleur des plans de chaque voie :

| | Ensembles généralistes (paire 4+4) | Quatre gemmes |
|---|---|---|
| Meilleure / aucune | +6 à +10 % de mur, +4 à +16 % de vitesse | +5 à +7 % de mur, +3 à +11 % de vitesse |
| Médiane / aucune | +2 à +4 % | +3 à +5 % |
| Meilleure / médiane | +3 à +6 % | +1 à +3 % |
| Combinaisons à 90 % du meilleur score | 1 à 9 sur 91 | 17 à 77 sur 370 |
| Élément qui s'impose | l'Enclume patiente (meilleure paire de 6 voies sur 9) | Cendre vive (8 voies sur 9) |

**Lecture.** Les deux couches font la même chose (des déclencheurs de 0,15 à 0,55 P), pèsent le même poids, et ont chacune un élément universel qui s'impose. La couche des gemmes a la bonne dispersion (beaucoup de combinaisons proches) ; celle des ensembles généralistes non (une ou deux paires dominent). **Recommandation** : ne garder qu'une couche de build, les gemmes, et y verser les effets d'ensemble qui ont une identité (Enclume 4, Vigie 4, Orage 4, et un par classe), en bornant les talents universels comme Cendre vive (délai plus long, ou une condition : « sur une compétence »). Cible : quatre gemmes = +10 à +25 % de vitesse, ≤ 0,5 palier de mur (§3.2).

### 4.3 Les outils de situation contre un vrai généraliste

Témoin : la meilleure paire d'ensembles et les meilleures gemmes de la voie. L'outil prend **la place** de 4 pièces d'ensemble (ensemble de situation) ou d'une gemme (gemme de situation) ; la préparation s'ajoute [`outils.md`] :

| Famille (zones) | Ensemble 4 (médiane) | Pire voie | Gemme | Préparation | Majorant (contre le témoin nu) |
|---|---|---|---|---|---|
| Interstice (Lanternes, Échos) | ×1,40 · ×1,44 | ×1,12 · ×1,25 (Tue-Bête) | ×1,29 · ×1,32 | ×1,12 · ×1,15 | ×1,44 · ×1,52 |
| Pluie (Fossés, Gué) | ×1,09 · ×1,22 | ×1,00 (Rémouleur) · ×1,15 | ×1,12 · ×1,12 | ×1,03 · ×1,06 | ×1,15 · ×1,22 |
| Impact (Trois coups, Terrasses ; appoint Gué, Belvédère) | ×1,48 · ×1,44 ; ×1,06 · ×1,03 | ×1,36 | ×1,32 | ×1,12 · ×1,22 | ×1,44 · ×1,48 |
| Battue (Vergers, Atelier) | ×1,12 · ×1,00 | ×1,06 · ×0,97 | ×1,15 · ×1,03 | ×1,09 · ×1,03 | ×1,15 · ×1,03 |
| Fracture (Cloître, Deux sceaux) | ×1,06 · ×1,00 | ×1,03 · ×0,95 | ×1,03 · ×1,00 | ×1,00 | ×1,12 · ×1,03 |
| Reprise (Fours, Belvédère) | ×1,29 · ×1,29 | ×1,06 (Glyphiste) · ×1,18 | ×1,18 · ×1,15 | ×1,15 · ×1,12 | ×1,36 · ×1,32 |

- **Les mesures « majorant » de `verification-claude.md` tiennent** : contre un vrai généraliste, l'outil perd 0 à 0,1 de ratio, parce que le généraliste complet (paire d'ensembles et quatre gemmes) ne vaut que **+11 à +16 %** de mur contre le témoin nu sur les douze zones (1,2 à 1,7 palier). Critère du PvE v2 (×1,25 pour chaque voie) : **3 zones sur 12** ; avec la cible « ≥ 1 palier » : **6 sur 12**.
- **Échelle gemme / ensemble / préparation** : la préparation vaut 30 à 55 % de l'ensemble (en logarithme du ratio) ; la gemme 60 à 80 % en général, mais **elle bat l'ensemble** aux Fossés (Pluie) et aux Vergers (Battue), où retirer un ensemble généraliste coûte plus que retirer une gemme.
- **La limite de 240 s mord** : 3 647 des 14 997 défaites juste au-dessus des murs sont des « temps écoulé » (24 %, contre 4 % sans outil) : plus l'outil fait monter le mur, plus le combat dure, et la limite devient le vrai mur (choix 6 du §5).

### 4.4 Fracture et Battue refaites par le contenu

La loi du §2.6 dit quoi faire : un outil offensif ne gagne que si ce qu'il contre est **la source du danger**, et s'il fait **basculer** quelque chose (une garde percée ou non, un renfort mort ou vivant). Essais dans `sim/proposals/coherence-zones-v1/` et `coherence-zones-v2/` (seules ces zones changent ; mêmes généralistes, mêmes graines) [`coherence-zones-v1/outils.md`, `coherence-zones-v2/tools.json` (Cloître seul, joué avec `--encounters z05`)] :

| Zone | Avant (zones-v2) | Changement | Ensemble 4 (médiane, pire) | Gemme | Préparation |
|---|---|---|---|---|---|
| Vergers de verre (Battue) | ×1,12 (×1,06) | trois vagues de trois renforts qui portent l'essentiel des coups (70 toutes les 2,5 s chacun), chef faible (30) | **×1,25 (×1,18)** : 9 voies ≥ 1 palier | ×1,18 | ×1,15 |
| Cloître des balances (Fracture), 1ᵉʳ essai | ×1,06 (×1,03) | garde menaçante (coups ×2 tant qu'elle tient), garde qui suit D, 900 | ×1,06 (×1,03) : **échec** — la garde ne se perce jamais, même avec Fracture (≈ 10 s pour 9 s de garde) | ×1,03 | ×1,00 |
| Cloître, 2ᵉ essai | — | même chose, garde à **420** : le DPS normal la perce presque, Fracture nettement | **×1,15 (×1,12)** : 9 voies ≥ 1 palier | ×1,12 | ×1,09 |
| Atelier des mauvais jours (Battue) | ×1,00 (×0,97) | l'auxiliaire soigne 5 × 700 et frappe | ×1,00 : **échec** — la **priorité « renforts d'abord »** fait déjà tout (0/8 → 8/8 victoires à D 1,5 sur la sonde du Tue-Bête ; Battue n'y ajoute que ~10 % de vitesse) | ×1,03 | ×1,03 |

**Règles de conception qui en sortent** [Proposé par Claude] :
1. **Une garde de Fracture** doit être **menaçante** (son porteur frappe plus fort tant qu'elle tient) et **presque percée par le DPS normal** dans sa durée, à tous les dangers (elle suit D, pas D^1,5) : Fracture fait alors la différence entre « percée » et « tenue ».
2. **Des renforts de Battue** doivent **porter les dégâts** : les tuer vite retire la menace, pas seulement du temps.
3. **Une zone où la bonne priorité de cible suffit** (Atelier, Deux sceaux) est une **zone de plan** : elle enseigne la priorité. On ne la compte pas pour un outil d'équipement.
4. **Les outils défensifs actuels sont trop forts pour la courbe compressée** (Impact, Interstice ×1,40 à ×1,48 = 4 paliers) : à ramener vers ×1,10 à ×1,15 si Louis retient la courbe à +12 % (§5, choix 1).

Avec ces deux zones refaites (Vergers, Cloître 420) et les deux zones de plan retirées du compte, **chaque famille a au moins une zone où son ensemble vaut ≥ 1 palier pour les neuf voies**, et Battue comme Fracture tombent dans la bonne échelle (ensemble ≈ 1,5 palier, gemme ≈ 1,2, préparation ≈ 0,9).

### 4.5 Ce qui n'est pas encore mesuré

- Les **gemmes de build issues des ensembles** (Enclume 4, Vigie 4, Orage 4 en gemmes) : à rejouer quand GPT aura proposé le catalogue (risque : l'Enclume ou la Vigie en gemme deviendrait la nouvelle Cendre vive).
- La **courbe compressée appliquée au catalogue** (lignes fixes régénérées) et les outils recalés à ×1,10-×1,15 : la mesure synthétique du §4.1 dit ce qu'elle donnera, pas le catalogue réel.
- Les **groupes** avec statistiques et talents réels (`combat-gear-gap` : 4 DPS demandaient +15 % au lieu de +10 %), les donjons à salles réelles, le **rendement horaire** (échecs, repos, consommables).
- Les **plans d'ouverture** au-delà de « tout à 0 s » pour les combinaisons de talents ; la recherche de plans complète (`combat-search`) avec talents.

## 5. Ce que Louis doit trancher

Chaque choix : les options, ma recommandation, et ce que la mesure dit.

1. **La courbe de palier.**
   - (a) **+10 à +12 % de Puissance et de PV par palier** (§5.5 de `combat-items.md`, à 2 points près) : un palier ≈ 0,4 cran ≈ une zone de route ; un vieil équipement reste utile ; la route se cale d'elle-même.
   - (b) La courbe du catalogue actuel (×2,7 puis ×1,7) : 1 à 2 crans par palier ; la route serait finie vers le palier 30 et les gemmes, ensembles et plans ne compteraient presque plus face au palier.
   - **Recommandation : (a)**, en régénérant les lignes fixes du catalogue depuis un budget par palier (le générateur `export_gear.mjs` existe), avec une rareté à +5 % par rang et un Légendaire au moins égal à l'Épique.
2. **Le rôle des ensembles.**
   - (a) **Ensembles = réponses de situation seulement** (six familles, bonus 2/3/4 qui renforcent un même effet) ; les meilleurs effets des ensembles généralistes deviennent des gemmes de build ; les ensembles de classe deviennent des nommés ou des gemmes de classe.
   - (b) Garder en plus une poignée d'ensembles de build (les six de classe, par exemple), sachant qu'ils valent 1 à 4 % de mur et 0 à 12 % de vitesse.
   - **Recommandation : (a)**. Ta décision « ensembles 2/3/4 » et ton levier « les zones font changer l'ensemble de 4 » sont tenus ; le doublon avec les gemmes disparaît ; l'Enclume patiente ne peut plus être l'uniforme de 6 voies sur 9.
3. **Les gemmes de situation dans les quatre majeures** (proposition du PvE v2).
   - (a) **Oui** : au mur, on remplace un talent de build par la gemme de situation ; le coût est réel (de la vitesse) et lisible.
   - (b) Un emplacement à part pour la situation.
   - **Recommandation : (a)** : un seul budget, quatre cartes.
4. **L'orientation protectrice ou offensive de l'équipement.** Aucune zone ne récompense les PV plus que la Puissance (`budget.md`) ; telle que convertie, l'armure protectrice perd partout.
   - (a) **Même valeur pour les deux** (une ligne protectrice donne autant de PV qu'une ligne offensive donne de Puissance, à budget égal), la Défense en réduction restant un petit complément ; le choix devient un goût et un rôle de groupe (tenir les coups pour les autres).
   - (b) Supprimer l'orientation (une seule version par modèle).
   - **Recommandation : (a)**.
5. **Les statistiques mortes** : Ténacité, Résistance au ralentissement, Régénération, « élément de l'arme ». **Recommandation : les retirer des lignes aléatoires** (et des lignes fixes pour la Ténacité), et les rendre seulement si un ennemi contrôle un jour le joueur (PvP).
6. **La limite de 240 s.** **Recommandation : la fureur seule fixe la fin d'un combat** (limite technique très haute, par exemple 600 s), pour qu'un temps écoulé ne soit plus un mur caché ; la fureur suit déjà le danger.
7. **Deux plans conseillés.** **Recommandation : un plan de farm (le plus rapide) et un plan de mur (le plus sûr du criblage)**, proposés selon la situation ; au mur, le plan sûr vaut +7 à +25 %.
8. **Fracture et Battue** : les refaire par le contenu (§4.4) plutôt que par des coefficients d'outil. **Recommandation : oui**, et confier les chiffres à GPT.
9. **Le calendrier des ensembles** : une famille dès le palier de sa première région (10, 20 ou 40) plutôt que tous « à 40 ». **Recommandation : oui** (§3.5).

## 6. Ordre de travail proposé

| Étape | Contenu | Condition pour continuer |
|---|---|---|
| 1 | Louis tranche §5 | — |
| 2 | Courbe de palier : budget par palier et rareté, régénération des lignes fixes du catalogue, lignes aléatoires à identifiants stables et sans ligne morte, conversion `gearStats` dans `data/combat/rules.yaml` | I1, I2, I3 tenus (`--step gear`, `--step budget`) |
| 3 | GPT : Fracture et Battue refaites, zones réaccordées aux régions (§3.5), gemmes de build tirées des ensembles généralistes | I4 tenu sur les douze zones contre le généraliste |
| 4 | Catalogue des talents de build réduit et recalé (vitesse +10 à +25 %, dispersion) | I5, I6, I7 |
| 5 | Route profonde calée (§4.1), checkpoints ; puis Fonderie et donjons (repos 30 %) | I8, I9 ; rendement horaire |

## 7. Fichiers

| Fichier | Contenu |
|---|---|
| `sim/reports/combat/coherence/kits.md` | statistiques brutes et converties de chaque kit du catalogue |
| `…/equipement.md` (`gear.json`) | murs par palier, rareté, orientation, lignes |
| `…/budget.md` | valeur de chaque statistique selon la rencontre ; courbe à +12 % |
| `…/declenchements.md` | talents qui se déclenchent ou non, par voie |
| `…/ensembles.md` (`sets.json`, `pairs.json`, `pairwalls.json`) | ensembles seuls, criblage et murs des paires |
| `…/gemmes.md` (`gems.json`, `quads.json`, `quadwalls.json`) | gemmes et nommés seuls, combinaisons de quatre |
| `…/outils.md` (`tools.json`), `…/coherence-zones-v1/outils.md`, `…/coherence-zones-v2/tools.json` | outils de situation contre le généraliste ; zones refaites ; Cloître à garde 420 |
| `sim/src/coherence/probe.ts` | sonde d'une zone (compteurs moyens avec et sans outil), pour diagnostiquer un échec |
| `…/plans/<voie>.json` | plans essayés par voie (conseillé, groupe, sûr) |
| [`message-gpt.md`](message-gpt.md) | ce qui revient à GPT |

Reproduire : `pnpm --filter @bramo/sim sim combat-coherence --step <kits|gear|budget|triggers|sets|pairs|pairwalls|gems|quads|quadwalls|tools> [--shard k/n | --merge --parts n] [--zones coherence-zones-v1]`, dans cet ordre (les criblages lisent les murs des étapes précédentes).
