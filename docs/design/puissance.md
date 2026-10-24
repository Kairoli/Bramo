# Le moteur de Puissance : une Force globale, nourrie par tout

> **Statut** : conçu et codé le 24 octobre 2026 (soir), à la demande de Louis : « un moteur qui se base autour d'une puissance
> globale, pas compliqué mais complet, alimentée par plein de choses, comme Legend of Mushroom : la classe (chaque classe a une
> mécanique et est meilleure dans certains contenus), la technologie et ses recherches, les reliques, l'accessoire de dos et ses
> talents, le build, les sorts, les stats (combo, crit, contre-attaque)… un système qui permet d'ajouter des trucs facilement
> dessus » ; puis « dans les gros chiffres : Legend of Mushroom se compte en millions, un compte de 6 mois est facilement à
> 70-80 M ».
>
> **Le socle est codé dans le moteur partagé** (`packages/shared/src/power/power.ts`, `schemas/power.ts`, statistiques
> spéciales dans `combat/engine.ts`, 8 tests dans `test/power.test.ts`). **Rien n'est encore dans le jeu** : `data/power/`
> n'existe pas (le jeu est inchangé), le serveur ne garde pas encore l'avancée des systèmes et l'écran n'existe pas. Les systèmes
> d'exemple sont une proposition : `sim/proposals/puissance-v1/power/`. Mesures : `sim/src/tempo/force.ts`.

## 1. Le principe

Tout ce qui rend un personnage plus fort passe par **un seul tuyau** et se résume en **un seul nombre**, la **Force** (nom
proposé : « Puissance » est déjà le nom de la statistique d'attaque).

| Source | Ce qu'elle apporte | État |
|---|---|---|
| **La classe** | mécanique (Braises, Angle, runes), voie, sorts, niveau | existe |
| **Les points forts de la classe** | un bonus selon le contenu : le Traqueur en PvE, le Forgefeu dans la Lice et en donjon, le Runiste en Marée | **nouveau** (système inné) |
| **L'équipement** | palier, rareté, lignes, chef-d'œuvre, Affineur | existe |
| **Le build** | gemmes, ensembles, objets nommés, réserves, plan et minuteurs | existe (et [`build-v3.md`](coherence/build-v3.md)) |
| **Les Recherches de la Guilde** (la technologie) | un arbre en trois branches, payé en or et en matières des métiers, avec un minuteur | **nouveau** |
| **Les Reliques** | des objets que la Marée a gardés, trouvés puis restaurés ; une statistique et un talent | **nouveau** |
| **La Lanterne** (l'accessoire de dos) | elle monte de niveau ; tous les 10 niveaux, un talent de lanterne au choix | **nouveau** |
| **Les statistiques spéciales** | combo, contre-attaque, esquive, régénération (plus le critique, la Cadence, qui existent) | **nouveau** dans le moteur de combat |
| Plus tard | compagnons, saisons, clan, Lice… | un fichier de plus chacun |

## 2. Un seul format pour tous les systèmes

Chaque système est un fichier de `data/power/` : **une liste de nœuds à niveaux**. Un nœud a :

- un **maximum** de niveaux, des **prérequis** (« Le Coup franc demande Le Fil de la lame niveau 3 »), éventuellement des
  **classes** et un **groupe de choix** (un seul des deux talents de lanterne du niveau 10) ;
- un **coût par niveau** qui grandit (or, objets du sac) et, s'il le faut, un **temps** (une recherche tourne pendant qu'on joue,
  ou pas ; un nombre de recherches en même temps par système) ;
- ce qu'il rapporte **par niveau** : des statistiques en points (`flat`) ou en pourcentage (`pct`), partout ou **seulement dans
  certains contenus** (route, patrouille, Marée, Lice, donjon) ;
- des **talents** débloqués à un niveau, **dans le même langage que les gemmes** (déclencheurs, réserves, effets) : une relique
  peut remplir la Rancœur, une lanterne frapper toutes les 8 s.

Quatre sortes, qui ne changent que l'affichage et deux règles : `research` (arbre à minuteurs), `collection` (objets trouvés
puis montés), `companion` (un objet porté qui monte), `innate` (actif d'office, rien à payer : les points forts des classes).

**Ajouter un système** (des compagnons, une constellation, un arbre de clan) = écrire un fichier comme celui-ci, sans code :

```yaml
id: compagnons
name: Les Compagnons
kind: collection
unlock: {classLevel: 20}
nodes:
  - {id: corbeau, name: Le Corbeau, maxLevel: 10, cost: {gold: {base: 2000, growth: 1.3}}, perLevel: [{stat: critChance, flat: 0.003}]}
```

Le chargement vérifie tout au démarrage (objets des coûts, prérequis, classes, talents), comme le reste de `data/`.

**Dans le moteur** : `combatantOf` (le combattant qui entre dans une rencontre) ajoute les systèmes à la classe, à l'équipement et
aux fournitures ; les `pct` de toutes les sources s'additionnent puis multiplient une fois, les parts (critique, combo…) sont
plafonnées (`data/power/config.yaml`). `upgradeNode` monte un nœud (paie, vérifie prérequis, choix, place, ouverture),
`settlePower` termine les recherches arrivées au bout, `characterForce` donne la Force.

## 3. Les statistiques spéciales

| Statistique | Effet | Pour quel build |
|---|---|---|
| **Combo** | une attaque de base frappe une seconde fois, aussitôt | Cadence, Mesure, Entailles (chaque coup déclenche les talents) |
| **Contre-attaque** | une attaque ordinaire qui touche peut être rendue par une attaque de base | Rancœur, tank, Forgefeu |
| **Esquive** | une attaque ordinaire (ni lourde, ni chargée) manque | survie contre les zones à coups ordinaires |
| **Régénération** | une part des PV rendue chaque seconde | Endurance, gardiens longs |

Elles valent 0 par défaut et **ne tirent aucun dé tant qu'elles valent 0** : les combats d'aujourd'hui sont identiques (testé).
Elles ont un sens en PvP aussi ([`pvp.md`](pvp.md)) ; leurs résistances (anti-combo…) pourront s'y ajouter.

## 4. La Force : des millions, mais honnêtes

**Force = 10 000 × (vraie force ÷ force de référence)^7.** La vraie force, c'est la moyenne de l'attaque (Puissance, critique,
Cadence, combo, contre-attaque) et de la survie (PV, Défense, esquive, régénération), la même échelle que le mur : un palier
d'équipement de plus = ×1,096. L'exposant 7 transforme chaque palier en **×1,9 de Force** : de gros chiffres qui grandissent
vite, comme dans Legend of Mushroom. Les talents de l'équipement comptent pour 0,15 palier chacun, ceux des systèmes pour ce que
leur nœud déclare (la formule ne les voit pas ; le mannequin donnera un jour la vraie valeur).

Un joueur actif (Forgefeu, la route ~20 h par jour, un équipement Rare de son niveau, les systèmes de la proposition) :

| Phase | Niveau | Force sans les systèmes | **Force** | Ce que rapportent les systèmes |
|---|---|---|---|---|
| Premier jour | 27 | 17 425 | **17 425** | — |
| Une semaine | 48 | 101 486 | **134 450** | +0,4 palier |
| Un mois | 65 | 522 085 | **1,09 million** | +1,1 palier |
| Trois mois | 78 | 2,15 millions | **11,9 millions** | +2,7 paliers |
| Six mois | 86 | 5,4 millions | **77,3 millions** | +4,1 paliers |

**La Force suit le vrai mur** : sur le banc des builds (trois voies, trois murs), le gain de mur mesuré des systèmes à six mois
est de +3,4 à +3,8 paliers, la Force en annonce +4,1 à +4,5 ; écart moyen **0,4 palier** sur toutes les phases (elle reste un peu
optimiste en fin de partie, à recaler quand le jeu aura de vraies données).

**L'ordre de grandeur des systèmes** : à six mois, environ **3,5 paliers** de vrai mur, quand toute la courbe d'équipement du
jeu en fait 11 et un bon build 1 à 2,5. Ils complètent, ils n'écrasent pas. Une première version deux fois plus forte faisait
+6,5 paliers : divisée par deux.

## 5. Les systèmes proposés (`sim/proposals/puissance-v1/power/`)

**Les Recherches de la Guilde** (ouvertes au niveau 5) : le cabinet des savants de la halle, une recherche à la fois. Trois
branches : le fer (Puissance, critique, combo, dégâts critiques), le cuir (PV, contre-attaque, esquive, régénération), la
lanterne (savoir de la Marée : +Puissance et PV en Marée seulement ; Cadence). Chaque niveau coûte de l'or **et des matières des
métiers** (lingots, cuirs, planches, toiles, herbes, rouages, ragoûts) : un débouché permanent pour les artisans et les
récolteurs, en plein dans l'économie active voulue. Temps : 20 min au premier niveau, des heures puis des jours ensuite ; tout
l'arbre en 4 à 6 mois (1 100 h de recherche pour l'état « six mois », un quart du temps).

**Les Reliques** (niveau 15) : six objets que la Marée a gardés (la Cloche du puits, la Boussole noyée, l'Horloge arrêtée, le
Miroir de vase, la Lanterne du passeur, le Sceau brisé), restaurés avec des **reliques englouties** (une trouvaille de
l'Exploration, qui en trouve un vrai usage) et d'autres curiosités. Chacune : une statistique par niveau, et au niveau 5 un talent
(un coup encaissé qui donne de la Rancœur, la première compétence +30 %, les attaques de base qui raccourcissent les
recharges…) : elles nourrissent les builds.

**La Lanterne** (niveau 10) : la lanterne au dos de chaque personnage (le motif du monde contre la Marée). Elle monte jusqu'au
niveau 50 (lys-lanterne, perles de verre, or) ; aux niveaux 10, 20 et 30, **un choix entre deux talents** (régénération ou
combo ; esquive ou critique ; le Fanal qui frappe toutes les 8 s, ou la Veilleuse qui soigne une fois sous 40 %). Son apparence
est un emplacement cosmétique : une **boutique d'apparences de lanterne** est possible (jamais de niveau ni de statistique).

**Les points forts des classes** (d'office) : Traqueur +8 % de Puissance sur la route et en patrouille (« l'archer meilleur en
PvE »), Forgefeu +8 % de PV dans la Lice et en donjon, Runiste +8 % de Puissance en Marée.

## 6. Ce qu'il reste à faire pour le voir en jeu

1. **Serveur** : garder l'avancée (`characters.power`, une migration), terminer les recherches à chaque passage (`settlePower`
   dans `play()`), une route `POST /api/power/upgrade`, la vue des systèmes et la Force dans `/api/state`.
2. **Écran** : la Force en gros dans la barre du haut et sur la page profil (avec sa flèche quand elle monte) ; une salle ou un
   onglet **Puissance** avec un onglet par système (l'arbre des recherches avec son minuteur, la vitrine des reliques, la
   lanterne et ses choix) ; « +12 400 de Force » à chaque amélioration.
3. **Contenu** : les reliques englouties dans le butin des gardiens et de la Marée, les lignes de combo, contre-attaque, esquive
   et régénération dans les lignes d'équipement, le classement de la Force.
4. **Équilibrage** : les systèmes dans la simulation de serveur (or et matières dépensés, écart casu / tryhard sur six mois).

## 7. À trancher par Louis

1. Le nom du grand nombre : **Force** (proposé), ou un autre ?
2. Les **trois systèmes** (Recherches de la Guilde, Reliques, Lanterne) et les **points forts des classes** : d'accord sur la
   liste et l'esprit ?
3. Les **recherches à minuteur** (elles tournent pendant qu'on est absent, comme tout dans Bramo), ou instantanées ?
4. On passe au serveur et à l'écran (§6) ?
