# Message pour GPT : revoir les zones et le PvE solo

> À copier tel quel. Rédigé par Claude le 22 octobre 2026 pour Louis.

---

Bonjour. Claude a joué ton dossier « Activités et artisanat » dans le **moteur de combat TypeScript du jeu** (le même que le serveur), pas dans un banc à part. Le moteur reproduit le banc Python du premier dossier à 0,5 % près, donc les résultats sont comparables. Lis d'abord, sur `main` : `docs/design/activites-artisanat/analyse.md` (§3 et §9 surtout) et les rapports bruts de `sim/reports/combat/` (zones, groupes, donjon, écart d'équipement), échecs compris.

L'économie, l'artisanat, les donjons sans quota, les escouades, la route permanente et la branche saisonnière sont retenus presque tels quels. Ce qui ne tient pas, ce sont **les zones solo et la façon dont elles font varier les builds**. Je te demande de les refaire avec les contraintes ci-dessous.

## Décisions de Louis à respecter

1. **Aucune composition imposée, jamais.** Toute composition de 1 à 4 joueurs, et chaque build solo, doit pouvoir progresser. La complémentarité et un bon build font franchir les murs **plus tôt**, sans jamais être obligatoires. « La difficulté surmontée par un bon build procure tout le plaisir du jeu. »
2. **Les zones poussent à adapter son build, pas sa classe** : ensemble, gemmes, consommables, plan, voie. Changer de voie est gratuit et garde le niveau de la classe ; on ne demande jamais de monter une autre classe.
3. Rappels déjà décidés : combat entièrement automatique (minuteur d'ouverture de 10 s au plus, puis cooldowns) ; résistances et faiblesses élémentaires ennemies reportées ; ralentissement sur la cadence des attaques ordinaires seulement ; pas de bonus économique illimité pour les combattants ; nommés non fabricables en V1 (butin, garantie, marché) ; métaux : ta proposition (argent et or à la Joaillerie).

## Ce que les essais ont montré

1. **Tes douze zones ne font pas alterner les builds.** Chiffrées en rencontres et jouées par toutes les combinaisons de 5 sorts de chaque voie (danger ×1 à ×4), elles donnent 0,5 à 2 crans d'écart entre voies, sans le motif « DPS ici, soutien là, contrôle là-bas » annoncé. Exemple : dans la Chambre aux deux sceaux, annoncée DPS, Trempe-Rouge et Tue-Bête ont les murs les plus bas. Des « réponses par rôle » ne suffisent pas, parce que les voies d'une même classe partagent l'essentiel de leurs sorts.
2. **Tes zones ne sont reliées à aucun ensemble ni gemme.** Or c'était le levier voulu par Louis. Et le banc de ton premier dossier montre que des **ensembles génériques ne peuvent pas jouer ce rôle** : sur 2 457 paires 4+4, la paire médiane n'est que 5,7 % plus lente que la meilleure (13 % au pire), et la Vigie revient dans presque toutes les meilleures paires, quel que soit le rôle.
3. **Les outils défensifs pèsent trop peu** : une protection ou un soin vaut 0,2 à 1,5 P, soit 1 à 5 % des PV (P = 100, 2 800 PV). Une réponse défensive change rarement l'issue.
4. **Le contrôle ne vise pas le danger** : la Rupture affaiblit « la prochaine attaque », presque toujours un coup ordinaire, pas la charge. Un plan de contrôle ne provoque qu'une à deux Ruptures par combat de boss.
5. **Le Traqueur est la classe la plus fragile** dans toutes les zones et tous les donjons (Tue-Bête surtout).
6. **Donjons** : 20 % de PV rendus entre deux salles est trop dur, même avec 6 potions ; **30 % avec une préparation** (repas, potions) fait passer toutes les voies. Les soutiens doivent jouer un **plan de groupe** (soins, protections) : avec, ils couvrent 51 à 76 % des dégâts de l'équipe, et la composition complète franchit ce que les groupes de dégâts ne franchissent pas.
7. **Faille trouvée** : si la difficulté ne monte que les dégâts, un groupe sans aucun DPS devient le plus sûr de tous et franchit tous les murs en prenant son temps. Corrigé en faisant monter **PV et dégâts ensemble** (ta pente : PV ≈ dégâts^1,5) et avec une **fureur** par rencontre (passé 1,1 fois le temps d'un groupe équilibré à cette profondeur, +10 % de dégâts ennemis par seconde). Mesure obtenue : au mur, la composition complète passe ; les autres passent avec **+5 à +15 % de statistiques**, soit un demi à un palier et demi d'équipement. C'est la balance visée.

## Ce que je te demande

**A. Refaire les douze zones autour de réponses d'équipement de situation.** Pour chaque zone, deux ou trois réponses viables, dont au moins une par l'équipement, une gemme ou un consommable accessibles à toutes les voies, et une par le plan. Jamais un élément requis, jamais une classe. Chaque zone doit avoir un « bon outil » qui fait gagner **environ un cran de difficulté** (≈ +25 % de danger) sur un build générique, et ce bon outil doit changer d'une zone à l'autre. Le joueur bloqué farme ou fait fabriquer l'outil adapté, puis repasse à son build habituel deux zones plus loin.

**B. Proposer un catalogue d'ensembles et de gemmes de situation**, reliés à ces zones et à leurs régions sources. Effets **forts contre une mécanique précise, faibles ailleurs**, sans ensemble générique qui convienne partout. Exemples de familles : prochaine attaque chargée réduite de moitié ; dégâts doublés contre les gardes ; dégâts accrus contre les renforts ; érosion purifiée ; PV rendus au repos de donjon ; Pression bien plus forte contre un boss qui prépare un coup. Chiffrer les effets défensifs **en part des PV maximum**, pas en P. Chaque effet structuré : déclencheur, condition, effet, délai interne, plafond, règle de cumul. Garde des sets « généralistes » s'il le faut, mais plus faibles que l'outil adapté dans sa zone.

**C. Exprimer chaque zone directement dans le format de rencontre du moteur** (YAML), pour qu'on la joue sans traduction. Champs disponibles :
- `enemies`, `hp`, `attack: {damage, period, heavyEvery, heavyMultiplier}` (un coup sur N est lourd) ;
- `adds: [{name, count, hp, attack, arrive}]` (renforts à heure fixe ; vaincre le chef termine la rencontre) ;
- `charge: {period, damage}` ; `guard: {period, amount, duration, on: all | alternate, boostedByAdds}` ;
- `regen: {period, amount, uses, requiresAdds}` (soin limité, éventuellement porté par un auxiliaire) ;
- `aura: {damage}` ; `erosion: {period, damage, maxStacks}` (une purification la retire) ;
- `windows: {period, open, closedReduction}` (fenêtres de vulnérabilité) ; `enrage: {after, perSecond}` (fureur).
Base : P = 100, 2 800 PV, rencontres de 40 à 80 s pour un plan de référence. Exemple complet : `sim/proposals/zones-v1/combat.yaml`. Si une mécanique te manque, décris-la précisément (déclencheur, effet, horaire) : on l'ajoutera au moteur.

**D. Revoir la pente de la route** : PV et dégâts montent ensemble, la fureur suit la profondeur, et le premier circuit se cale sur la vraie courbe d'équipement (un palier ≈ +10 %).

**E. Donner au Traqueur un outil de survie de classe** (Repli couvert, Garde de meute ou un nouveau sort commun), sans le rendre aussi sûr qu'un soutien.

**F. Livrer le tableau d'affinité attendu** (quel outil gagne combien dans quelle zone), pour qu'on le vérifie avec `sim combat-search`. Critères d'acceptation :
- dans au moins la moitié des zones, l'outil adapté donne au moins un cran sur un build générique de la même voie ;
- chaque ensemble ou gemme de situation est le meilleur dans au moins deux zones ;
- aucune voie ne reste sous ×1,5 dans une zone avec son meilleur outil ;
- le DPS reste le plus rapide de sa classe dans la majorité des zones ;
- en groupe, les quatre critères du principe de Louis (`analyse.md` §9) restent tenus.

Ne fais pas de banc Python séparé comme source de vérité : livre des données au format du jeu, nous les jouons dans le moteur et nous te renvoyons les résultats, échecs compris.
