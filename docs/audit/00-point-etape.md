# Audit des systèmes : point d'étape après la phase 3

Pour Louis, 24 octobre 2026 (nuit). Ce document dit ce que j'ai compris du jeu en lisant le code, ce qu'on peut vraiment
mesurer, si les outils de simulation disent encore la vérité, et ce que coûteront les phases suivantes. **Aucune
recommandation d'équilibrage ici** : c'est la suite. Rien n'a changé dans le jeu (`data/` et règles intactes).

Toutes les preuves sont dans `sim/reports/audit/` ; l'avancée détaillée dans [`AVANCEMENT.md`](AVANCEMENT.md).

## 1. En bref

- **Le moteur de combat est sain** : un seul moteur, pur et déterministe (même graine, même combat, au caractère près), le même
  pour le serveur et le simulateur, rapide (0,4 ms par rencontre). Les mécaniques sont décrites dans les données, pas codées en
  dur, sauf les classes elles-mêmes (voir §2.6).
- **Le recalage de la Puissance est remesuré** (§6) : il atteint ses buts, de justesse sur un point. Au 89e jour, le casu est à
  l'étape 158 (visé ~150, 170 avant), le tryhard devant (173) ; les systèmes ajoutent +1,0 à +1,3 palier de Force (visé ~1,5) ;
  l'or détruit dépasse l'or créé en fin de période. Mais le tryhard ne va que 1,2 à 1,6 fois plus vite que le casu, sous le
  « 2 à 2,5 » voulu.
- **Trois défauts réels trouvés dans le jeu, en lisant le code** (pas des avis : des faits vérifiés) :
  1. **La Marée du soir utilise les bonus de la route.** Le point fort du Runiste (+8 % de Puissance en Marée) et la recherche
     « Le Savoir de la Marée » (20 niveaux payés en or et en matières) ne s'y appliquent jamais ; le bonus de route du Traqueur,
     lui, s'y applique.
  2. **Le point fort du Forgefeu ne sert nulle part** : il vaut en Lice et en donjon, qui n'existent pas encore. Sur la route,
     seul le Traqueur a un point fort (+8 % de Puissance).
  3. **La bulle des jauges dit qu'aucun objet ne dépense les réserves** : elle ne regarde que les objets nommés et les
     ensembles, pas les gemmes de talent (le commentaire du code dit encore qu'elles « n'existent pas »).
- **Un défaut dans le simulateur de serveur**, corrigé en option : il arrondissait les petites statistiques de la Puissance
  (la régénération de 0,27 % par seconde devenait 0). Au mur, cela fait tomber un build de 50 % à 7-27 % de victoires : le
  simulateur sous-estimait les systèmes devant un mur. J'ai refait la mesure de la Puissance avec et sans la correction : sur
  l'ensemble des 90 jours, la différence reste dans le bruit d'une simulation seule.
- **Les outils d'équilibrage sont en partie périmés** (§4) : ceux du dossier `tempo/` mesurent bien le jeu actuel, avec des
  angles morts que je sais corriger ; les scénarios `sim combat-build`, `combat-coherence`, `combat-tools`, `combat-weapons`
  mesurent d'anciennes versions du jeu.
- **Un premier signal, à confirmer** : sans réponse aux mécaniques (set de départ, ni voie, ni gemme, ni ensemble), les classes sont
  très inégales devant certains gardiens : le Traqueur passe le Notaire des marées au niveau 33, le Forgefeu au niveau 70,
  soit environ deux mois de route d'écart. Dans la simulation de serveur, où les joueurs ont une voie, du butin et des gemmes,
  l'écart change de sens et se resserre : au 89e jour, route médiane Forgefeu 169, Traqueur 159, Runiste 155,5 ; mais au 30e jour,
  chez les casus, le Traqueur mène nettement (109 contre 90 et 93). Ce sera le cœur de la phase 4 : savoir si c'est le build
  qui rattrape (bon signe) ou autre chose. Attention : les outils qui ont réglé le danger des rencontres le 24 octobre jouent
  ce même personnage sans voie (§4).

## 2. Le jeu, vu du code (phase 1)

Lu : le moteur (`packages/shared/src/combat/engine.ts`, 1 600 lignes), la conversion de l'équipement (`loadout.ts`), la
progression et la route (`progress.ts`), la Puissance (`power/power.ts`), la Marée (`tide.ts`), toutes les données de combat.
La carte complète, tirée automatiquement des données : `sim/reports/audit/carte.md`.

### 2.1 Les trois classes, leur mécanique

| Classe | Sa mécanique (dans le moteur) | Voies (dégâts / contrôle / soutien) | Armes |
|---|---|---|---|
| Forgefeu | **Braises** (0 à 3) : les Chauffes en donnent, une Trempe les dépense toutes (+0,15 P par Braise) | Trempe-Rouge (attaques de base renforcées après une Trempe), Enclumier (Pression, affaiblit, ralentit), Rémouleur (plaque qui absorbe et riposte) | marteau, épée et bouclier, hache |
| Traqueur | **Angle** : un Repérage ouvre un Angle de 6 s sur la Proie, une Poursuite le consomme (+0,30 P) ; **affût** : les fenêtres fermées le gênent 35 % de moins | Tue-Bête (saignement), Piégeur (Contrepiège), Meneur de meute (ordre aux compagnons : soin et dégâts) | arc long, arbalète, dagues |
| Runiste | **Runes** : chaque sort écrit une forme (Trait, Cercle, Sceau), le suivant la lit (dégâts, ralentissement en zone, bouclier) | Fulgurant (un « Dernier mot » tous les trois sorts), Sigillaire (Scellés au troisième contrôle), Glyphiste (Encre remplie par les boucliers) | bâton, sceptre, grimoire |

Chaque classe a 22 sorts (dont 9 de voie et un ultime au niveau 75) ; 4 places de sort avant le niveau 30, 5 ensuite. Le combat
est entièrement automatique : le joueur choisit ses sorts et leur ordre d'ouverture (un minuteur de 10 s au plus), puis les
sorts partent selon leur recharge.

### 2.2 Les formules, en clair

- **Dégâts infligés** = coefficient du sort × Puissance, moins 10 % de défense ennemie (moins la pénétration), × 1,6 sur un
  critique, + la vulnérabilité de la cible (10 % au plus), moins la réduction d'une fenêtre fermée ; une garde ennemie absorbe
  d'abord.
- **Dégâts reçus** = coup × danger de l'étape × (1 − Défense), moins le meilleur affaiblissement actif, moins les boucliers.
- **Défense, critique, Cadence** : des rendements décroissants (`plafond × score / (score + K)`), plafonnés (équipement) à 45 % de
  réduction, 50 % de critique, 62 % de Cadence. La Cadence accélère les attaques de base et les recharges, pas le délai d'une
  seconde entre deux sorts.
- **La Pression** use la Stabilité d'un ennemi (80 pour un boss, 50 sinon) ; à zéro, **Rupture** : +8 % de dégâts subis
  pendant 6 s, le coup suivant affaibli de 25 %, un ennemi ordinaire étourdi 2 s.
- **Les paliers** : PV et dégâts des ennemis × 0,8 au palier 1, × 1 au palier 20, × 2,2 au palier 90 (+12 % par palier de dix).
  La route monte d'un palier à chaque étape ou presque (120 étapes du palier 1 au palier 90), puis recommence en boucle, une
  fois et demie plus vite.
- **Le plancher** : un personnage n'est jamais plus faible que 75 % d'un équipement Rare de son niveau (100 % au niveau 1).
  Quand le plancher l'emporte, **toutes** les statistiques de l'équipement sont remplacées par lui (seuls les talents comptent
  encore). Mesuré : un équipement complet de son palier dépasse le plancher dès le niveau 10 (de 2 à 35 %), sauf juste avant un
  palier de la courbe (niveaux 9, 19 avec du Commun) ; c'est donc surtout le début de partie et l'équipement en retard qui
  tombent au plancher (`verifier.md` §5).
- **La Force** = 10 000 × (vraie force ÷ force de référence)^7, soit ×1,9 par palier. La vraie force ne voit que les
  statistiques ; chaque talent d'équipement y compte pour 0,15 palier, quel qu'il soit.

### 2.3 Les huit réserves

Des jauges propres à chaque combat (vides au début), remplies, dépensées ou lues par des talents. Le détail exact, talent par
talent : `carte.md` §1.

| Réserve | Remplie par (nombre de talents) | Dépensée par | Remarque |
|---|---|---|---|
| Tisons | 4 | 1 gemme | on gagne en frappant ce qui brûle |
| Entailles | 7 | 1 gemme | les critiques ; la plus facile à remplir |
| Frimas | 5 | 2 gemmes | les contrôles |
| Rancœur | 5 (dont une relique) | 1 gemme, 1 objet nommé | les coups encaissés |
| Ferveur | 5, plus deux conversions | 2 gemmes | soins et boucliers |
| Mesure | 6 (dont une relique), plus une conversion | 1 gemme | les attaques de base |
| Échos | 6, plus une conversion | 1 gemme | les enchaînements de sorts |
| Trophées | 3 | 1 gemme | les ennemis vaincus (6 au plus) |

Fait de structure : **presque tout ce qui dépense une réserve est une gemme de talent** (une seule exception, le Marteau des
griefs). Les objets nommés et les ensembles remplissent ; les gemmes encaissent. Un build de réserve dépend donc d'abord de la
Joaillerie et du marché des gemmes.

### 2.4 Équipement, talents, les quatre places

- **4 440 modèles d'équipement**, 11 emplacements, 4 raretés, 10 paliers. Statistiques fixes : Puissance, Vitalité, Défense,
  Critique, Cadence. Lignes tirées : 23 sortes (statistiques, modificateurs de talent, plafonds de réserve).
- **Les quatre places de talent majeur** (arme, torse, coiffe, collier) : les objets nommés d'abord, puis les gemmes serties ;
  au-delà de quatre, le reste n'agit pas. Une même gemme n'agit qu'une fois. Les bonus d'ensemble (2, 3 et 4 pièces) ne
  prennent pas de place.
- **46 gemmes de talent**, **12 objets nommés**, **18 ensembles** (15 pour tous, 3 de classe), **18 outils de situation** (le
  4 pièces des ensembles de situation, 6 gemmes, 6 préparations ; un seul par famille agit).
- **120 talents en tout** (avec les talents de la Puissance). 78 changent vraiment le combat (remplir ou dépenser une réserve,
  préparer l'action suivante, rejouer une rune, raccourcir des recharges, poser un état) ; **42 ne sont que des nombres**
  (dégâts en plus, bouclier, soin, modificateur), dont la plupart des bonus à 3 pièces (`carte.md` §3).

### 2.5 La progression et le contenu

- **Niveau de classe** : l'XP ne vient que du combat. Il faut environ 3 h de route pour le niveau 10, 71 h pour le 40, 410 h
  pour le 60, 2 300 h pour le 80 (`verifier.md` §8) : au-delà de 60, dix niveaux demandent plus d'un mois.
- **La route** : 12 zones de 10 étapes, la dixième contre le gardien de la région (6 gardiens, chacun deux fois) ; elle ne finit
  jamais (boucle). Dix mécaniques ennemies : fenêtres, érosion, coups lourds, renforts, garde (dont menaçante et alternée),
  aura, charges, soin ennemi, groupes, fureur.
- **Les autres combats** : patrouilles (une rencontre en boucle), terrain d'entraînement (jusqu'au niveau 40), la Marée du soir
  (un combat « à points », jamais gagné).
- **Le butin** : vestiges, objets classiques, pièces d'ensemble (à partir du palier 40), objets nommés (garantis après ~6 jours
  sur la même rencontre), gemmes de talent (~1 tous les 4 jours) ; trophée garanti à la première victoire sur un gardien. Plus
  l'atelier (fabrication), l'Affineur (rangs, retaille), le marché et la vitrine.
- **La Puissance** : Recherches de la Guilde, Reliques, Lanterne, points forts des classes. Les seules sources de combo,
  contre-attaque, esquive et régénération.

### 2.6 Ce qui existe, ce qui est à moitié fait, ce qui n'existe pas

| État | Quoi |
|---|---|
| **Fait et branché** | les 3 classes et leurs 9 voies ; les 66 sorts ; les 8 réserves ; gemmes, nommés, ensembles, outils de situation ; la route et ses 18 rencontres ; patrouilles, entraînement, Marée du soir ; butin, atelier, Affineur, marché ; la Puissance et la Force |
| **À moitié** | **les éléments** (feu, givre, foudre, physique) : aucun effet en combat, ni résistance ni ligne de dégâts par élément (le moteur les sait, aucune donnée ne s'en sert) ; **les groupes** : le moteur joue de 1 à N combattants, mais aucun contenu de groupe n'existe ; **les points forts de classe** (voir §1) ; la moitié de la « langue des talents » n'est utilisée par aucun talent (réserve propre d'un talent, préparation cumulable, soin sous un seuil…) |
| **N'existe pas** | le **PvP** (aucune ligne de code, sauf le mot « arena » dans une liste) ; les donjons ; les Éclaireurs ; les Routes franches ; les saisons ; une quatrième classe |
| **Écrit mais faux** | la bulle des jauges (voir §1) ; `puissance.md` (Runiste +8 % en Marée : ne s'applique pas) ; l'outil d'audit du contenu (`audit.ts`) : deux fausses alertes (il ne connaît ni le palier 90 ni l'atelier d'équipement) |

**Un point d'architecture, déjà visible** : les trois mécaniques de classe (`heat`, `angle`, `rune`) et les neuf passifs de
voie sont **écrits dans le moteur**, voie par voie (`if (id === 'red_temper') …`). Ajouter un sort, un talent, un ensemble,
une rencontre, une réserve : des données seulement. **Ajouter une classe ou une voie : du code dans le moteur.** C'est à
mesurer en phase 6, pas encore à juger.

### 2.7 Ce qui change le combat, et ce qui n'est qu'un nombre

Changent vraiment ce qui se passe : les mécaniques de classe ; les réserves (on remplit puis on dépense : l'ordre et le
moment comptent) ; les outils de situation (une réponse à une mécanique ennemie) ; les minuteurs d'ouverture ; la priorité de
cible ; les sorts de contrôle face aux coups lourds et aux renforts ; la limite de temps (un build lent perd).
Ne sont que des nombres : la rareté et le palier (des statistiques plus grosses) ; la plupart des lignes tirées ; les bonus à
3 pièces ; les systèmes de la Puissance (sauf les talents des Reliques et de la Lanterne) ; les éléments (rien du tout).

## 3. Ce qu'on peut vraiment tester (phase 2)

| Question de la commande | Testable ? | Comment | Limite |
|---|---|---|---|
| L'intelligence du joueur compte-t-elle (joueurs A à E) ? | **oui** | cinq vraies règles de décision qui choisissent dans le même butin (tiré par le vrai `rollLoot`, mêmes graines), contre les mêmes rencontres | le butin réel d'un joueur dépend aussi du marché ; je le modélise d'abord sans marché, puis avec la simulation de serveur |
| Un build malin rattrape-t-il un écart de puissance (5 % à 100 %) ? | **oui** | écart réglé sur la vraie force et sur la Force affichée | — |
| Les builds existent-ils, y a-t-il une méta dominante ? | **oui, par échantillonnage** | 163 185 combinaisons de 4 gemmes par voie, sans compter ensembles et lignes : impossible à tout essayer ; recherche guidée (paires qui remplissent et dépensent la même réserve) + tirages + amélioration locale, couverture publiée | sur des rencontres de validation à part, pour ne pas suradapter |
| Les réserves : remplissage, dépense, gaspillage, boucles | **oui** | le moteur compte déjà ce qui entre et sort de chaque réserve ; les boucles infinies sont impossibles par construction (un talent n'en déclenche jamais un autre), je le vérifie quand même | — |
| Chaque classe peut-elle progresser ? | **oui** | temps pour franchir les mêmes jalons, par classe, avec des joueurs réels (voie, butin, gemmes) | — |
| Donjons, activités de groupe | **en hypothèse seulement** | le moteur joue en équipe, mais aucun donjon n'existe : tout résultat sera marqué « hypothétique » | — |
| Progression à 1 h, 1 jour, 1 semaine, 1, 3, 6 mois, 1 an | **oui jusqu'à 6 mois ; 1 an en extrapolation** | simulation de serveur sur 180 jours, plusieurs graines | au-delà, la route boucle et le butin reste au palier 90 : je dirai ce qui ne se mesure plus |
| La Force dit-elle la vérité ? | **oui** | Force affichée contre victoires réelles, sur les mêmes personnages | — |
| PvP | **pas fidèlement** | le moteur ne fait combattre que des joueurs contre des rencontres : un joueur ne peut pas être l'ennemi. Deux options, §7 question 2 | — |
| Quatrième classe, nouvelles mécaniques | **oui, en essai isolé** | une classe ou une mécanique d'essai dans une copie du contenu, jamais dans `data/` ; je compterai ce qu'il faut écrire dans le moteur | une nouvelle mécanique de classe demande du code (§2.6) |
| Chiffres au-delà du contenu (palier 200, 500) | **oui** | la courbe des paliers se prolonge d'elle-même ; je regarde débordements, combats trop longs, statistiques qui deviennent inutiles | — |
| Économie : coût réel d'un build | **oui, en partie** | la simulation de serveur a le vrai butin, le marché, l'atelier, la Puissance | le marché simulé reste un modèle (prix, comportements) |

## 4. Les outils de simulation : disent-ils encore la vérité ? (phase 3)

Vérifié contre le vrai moteur (`sim/src/audit/verifier.ts`, rapport `sim/reports/audit/verifier.md`) :

| Outil | Mesure le jeu actuel ? | Ce qui cloche |
|---|---|---|
| Moteur (`fight`) | **oui** | déterministe, vérifié (deux appels identiques, même résultat au caractère près) ; 0,42 ms par rencontre |
| Banc des builds (`tempo/bench.ts`), minuteurs, leviers | **oui, à trois angles morts près** | 1. il ignore les points forts de classe (le Traqueur a +8 % de Puissance de plus dans le jeu qu'au banc) ; 2. les archétypes Ouverture, Endurance, Cadence n'y ont plus leur ensemble (ils ne le trouvent que si on lui redonne l'ancienne proposition) ; 3. ne jamais le lancer avec `TEMPO=vif` : le rythme vif est déjà dans `data/`, il serait appliqué deux fois. Sinon, le témoin du banc et le même équipement en jeu ont exactement les mêmes statistiques |
| Niveau requis (`tempo/needed.ts`), recalage du danger (`tempo/tune.ts`), `wall.ts`, `rythme.ts` | **oui, mais pour un personnage qui n'existe pas** | ils jouent un personnage **sans voie** (jamais choisie), donc sans passif ni sort de voie après le niveau 30. Or ce sont ces outils qui ont réglé le danger et les limites de temps des rencontres du jeu le 24 octobre : le contenu a été calé sur ce personnage-là |
| Simulation de serveur (`server/`) | **oui, avec une correction** | son cache arrondissait les petites statistiques de la Puissance (§1). Corrigé par une option (`CACHE_PARTS=4`) sans changer les anciens rapports. Il garde aussi seulement 6 graines par combat : au mur, le hasard d'un combat y pèse plus que dans le jeu, sans biais mesuré |
| Force (`tempo/force.ts`) | **non** | il lit l'ancienne proposition `puissance-v1`, pas `data/power/` (coûts d'avant le recalage) |
| Scénarios `sim combat-build`, `combat-coherence`, `combat-tools`, `combat-weapons` | **non** | ils lisent par défaut d'anciennes propositions (34 gemmes au lieu de 46, délais d'avant le rythme vif, zones d'avant) ; leurs rapports décrivent l'ancien jeu |
| Audit du contenu (`audit.ts`) | **oui, deux fausses alertes** | voir §2.6 |
| L'unité des rapports (« un palier d'équipement = ×1,096 de mur ») | **oui** | mesuré ×1,087 à ×1,095 selon la voie (médiane des 18 rencontres) : les « paliers d'avance » des rapports sont justes à 10 % près |

**Conclusion de la phase 3** : on peut s'appuyer sur le moteur, le banc (corrigé de ses trois angles morts) et la simulation de
serveur (avec le cache précis). Les anciens rapports de `sim/reports/combat/` (sauf `tempo/`) ne décrivent plus le jeu.

## 5. Ce que coûtera chaque phase

Mesuré sur cette machine (4 cœurs) : 0,42 ms par rencontre ; une simulation de serveur de 120 joueurs sur 90 jours, ~21 min
seule et ~30 min quand deux tournent ensemble.

| Phase | Ce que je ferai | Calcul (temps machine) | Mon temps |
|---|---|---|---|
| 4. Combat, builds, classes, réserves | corriger les angles morts du banc ; joueurs A à E en règles de décision ; écarts de puissance 5 % à 100 % ; recherche de builds (plusieurs centaines de milliers de combats par voie) ; audit des réserves ; classes par activité | ~3 à 5 h, en arrière-plan sur 3 cœurs | une longue séance |
| 5. Progression et temps long | simulation de serveur sur 180 jours (3 graines), murs de progression, Force contre victoires réelles, au-delà du palier 90 | ~3 à 4 h en arrière-plan | une séance |
| 6. Extensibilité et PvP | quatrième classe et cinq mécaniques d'essai (copie du contenu) ; PvP selon votre choix (§7, question 2) | < 1 h ; + 1 séance si on écrit le combat entre joueurs | une séance |
| 7 et 8. Contre-vérification, rapports | essayer de démentir chaque conclusion ; rapport court pour vous, un fichier par analyse | ~1 h | une séance |

## 6. La Puissance après le recalage (ajout n° 5)

Le détail est dans [`docs/design/puissance.md`](../design/puissance.md) §8 (« Remesuré après le recalage »). Deux simulations de
120 joueurs sur 90 jours (graine 11), l'une avec l'ancien cache, l'autre avec le cache précis ; c'est la seconde qui compte.

| | jour 30 | jour 60 | jour 89 |
|---|---|---|---|
| Ce qu'ajoutent les systèmes (paliers de Force), selon la façon de jouer | +0,3 à +0,9 | +0,7 à +1,2 | +0,7 à +1,7 |
| dont casu tranquille / tryhard | +0,6 / +0,9 | +0,9 / +1,2 | +1,0 / +1,3 |
| Route du casu tranquille (étape médiane) | 94 | 148 | **158** (visé ~150 ; 170,5 avant le recalage) |
| Route du tryhard | 143,5 | 159 | **173** (devant) |

- **L'or** : 23,9 M créés, 21,3 M détruits (1,12 sur 90 jours, **0,9 sur les 30 derniers jours**) ; 10,8 M mis dans les
  systèmes, le premier puits du jeu.
- **Le tryhard** ne va que 1,2 à 1,6 fois plus vite que le casu (jours pour atteindre les étapes 120 et 150), sous le principe
  « 2 à 2,5 fois ». À instruire en phase 5.
- **Prudence** : une seule graine ; d'une simulation à l'autre, certaines médianes bougent de 8 à 14 étapes au 30e jour.

## 7. Questions pour Louis

1. **La Marée et le Forgefeu** : la Marée applique aujourd'hui les bonus de la route (le Runiste n'a pas son +8 %, la recherche
   « Savoir de la Marée » ne sert à rien), et le point fort du Forgefeu ne sert nulle part. Je ne touche à rien (audit), mais
   voulez-vous que je le signale comme « à corriger tout de suite » dans le rapport, ou que j'attende la fin ?
2. **Le PvP** : le moteur ne sait pas faire combattre deux joueurs. Pour la partie 8, je peux (a) seulement approcher : faire
   d'un joueur une « rencontre » à ses chiffres (rapide, mais grossier : ses talents et ses réserves disparaissent), ou (b) écrire
   à part, dans le simulateur, un vrai combat entre deux joueurs à partir du moteur (une séance de plus, et ce code serait une
   base pour la future arène). Lequel ?
3. **Le joueur « A » de la commande** (« il prend ce qui a le plus de puissance affichée ») : dans Bramo, une pièce n'affiche
   pas de puissance, seulement sa rareté, son palier et ses statistiques ; la Force est celle du personnage. Je propose deux
   versions : celui qui prend la plus rare et la plus haute (« à l'œil »), et celui qui prend ce qui monte le plus sa Force.
   D'accord ?
4. **Jusqu'où dans le temps** : 6 mois mesurés et 1 an en extrapolation vous suffisent-ils, sachant qu'au-delà de la première
   boucle de la route le butin ne monte plus ?
