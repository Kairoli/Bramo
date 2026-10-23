# Simulation d'un vrai serveur : ce qu'elle a trouvé, ce qui a changé

Nuit du 23 octobre 2026. Louis a donné carte blanche : simuler un vrai serveur (population, clans, world boss, tout le
contenu), des joueurs très différents ou tous méta, trouver les failles, ajouter ce qui manque, resimuler. **Tout ce qui
est ici est proposé par Claude** et reste à valider par Louis. Les chiffres viennent du simulateur, qui joue le vrai moteur
du jeu ; rien ne remplacera de vrais joueurs, mais les gros problèmes bêtes se voient.

## 1. Le simulateur

`sim/src/server/` (lancer : `pnpm --filter @bramo/sim exec tsx src/server/run.ts <joueurs> <jours> <composition> <graine> [nom]` ;
rapports dans `sim/reports/serveur/`).

- **Le vrai moteur** : `advance` (métiers, coups de fouet, garde-manger, usure des outils, combat de la route qui tourne à
  côté, butin), les commandes PNJ et du maître, les gemmes, les fournitures, l'atelier, la Marée du soir. Les rencontres
  passent par un cache (`fightCache.ts`) : des centaines de joueurs rejouent les mêmes combats.
- **Le marché aux règles du serveur** (`sim/src/market/exchange.ts`) : ordres limites, taxe de 5 %, objets durables à l'unité ;
  la vitrine de l'équipement en plus.
- **Onze façons de jouer** (`personas.ts`) : tryhard méta (onglet ouvert, choisit tout au calcul, deux coups de fouet),
  casu qui suit les guides, casu tranquille, artisan du marché, récolteur pur, bradeur pressé (vend 30 % sous le marché),
  spéculateur (achète ce qui est bradé, revend plus haut), thésauriseur (ne vend rien), combattant avant tout,
  collectionneur (quatre métiers), onglet oublié (ne touche à rien). Chacune a sa présence (six profils, de 20 minutes le
  soir à l'onglet ouvert jour et nuit), ses métiers, son clan, sa façon de choisir classe, voie, équipement et gemmes.
- **Quatre serveurs** : `real` (beaucoup de casus, quelques tryhards et marchands), `meta` (tout le monde joue la méta),
  `dump` (40 % de bradeurs), `hoard` (thésauriseurs, collectionneurs, onglets oubliés).
- **La méta émerge** : les joueurs « méta » prennent la classe et la voie qui avancent le mieux sur le serveur, et en changent
  si une autre fait nettement mieux.

## 2. Les failles trouvées (règles d'origine, 100 joueurs, 60 jours)

| Faille | Mesure | Correction |
|---|---|---|
| **Le butin noyait tout** | 46 pièces par joueur et par jour, 2 400 pièces en 60 jours, un objet « nommé » toutes les deux heures (38 000 Sacs sans fond) | taux divisés par 10, nommés par 50 (garantie à ~6 jours de la même rencontre) : ~2 pièces par jour |
| **La route se finissait en deux semaines** | toute la route (120 étapes) finie au jour 14 par les casus, plus rien à faire en combat ensuite | butin et plancher corrigés ; **Au-delà des Lointains** (douze chapitres de plus, sans fin pratique) |
| **L'équipement ne servait à rien** | le plancher (un équipement Rare complet de son niveau) battait tout le butin : tout le monde avait exactement la même force | plancher à 75 %, qui descend de 100 % au niveau 1 à 75 % au niveau 40 sans jamais rendre plus faible |
| **Un tryhard allait aussi vite qu'un casu** | même force pour tous, et la route tourne 16 à 24 h par jour pour chacun | l'équipement compte ; la Marée du soir récompense la présence (+15 %) |
| **Le premier gardien était un mur binaire** | 0/10 jusqu'au niveau 9, 10/10 au niveau 10 (le plancher montait par paliers de 10 niveaux) | plancher interpolé niveau par niveau (déjà fait plus tôt dans la nuit) |
| **Les ensembles de classe ne tombaient jamais** | 0 à 2 pièces en 90 jours : seuls les gardiens les font tomber, et la route ne les bat qu'une fois | **trophée garanti** à la première victoire contre un gardien (une pièce de ses ensembles, sinon son nommé) |
| **Murs de plusieurs semaines** | Notaire des marées, Gardien des trois portes : jusqu'à 2 900 jours-joueurs bloqués | −10 % sur ces deux gardiens ; avec un équipement Rare de son niveau, chaque gardien se passe à son palier |
| **Débutant bloqué dès la première étape** | (avec le plancher à 75 % d'emblée) Forgefeu et Runiste niveau 1 perdaient l'étape 1-1 | la rampe du plancher (100 % au niveau 1) |
| **Les métiers ne servaient pas le combat** | aucune recette d'équipement ; minerais du Minage au-delà du niveau 20 sans aucun usage ; Forge sans recette après 20 | **atelier d'équipement** et **vitrine** ; lingots, bois nobles et planches des hauts paliers |
| **Des objets sans débouché** | hampes de flèche (14 millions produits, 0 utilisé), plumes, pointes, ressorts, venaison, potions, cartes… | **fournitures de combat** (potions, préparations faites de ces restes) ; 4 commandes du Comptoir pour les derniers |
| **Gemmes presque jamais serties** | 5 en 60 jours (et trop puissantes : la Perle faisait passer la Mère Grise à n'importe quel niveau) | gemmes à 20 vestiges, Perle affaiblie (plus tôt dans la nuit) ; elles servent devant les murs |
| **Pas de « world boss »** | — | **la Marée du soir**, telle que décidée par Louis (20 h, une heure, trois Marées en rotation) |
| **Les clans n'avaient plus de but après leurs bâtiments** | 24 niveaux de bâtiments au plus | **le Renom** (bâtiments, Marée, gardiens vaincus), qui ne baisse jamais |
| **Commandes de maître manquantes** | 10 métiers sans commandes 60, 80 et 99 | les 30 commandes, écrites dans le ton des maîtres (à relire) |

## 3. Ce qui a été ajouté au jeu

- **La Marée du soir** (`combat/tide.ts`, `data/combat/tide.yaml`, `apps/server/src/tide.ts`, `components/Tide.tsx`).
  Tous les soirs à 20 h (Paris), une heure, trois Marées qui tournent : la Débâcle (horde, les dégâts de zone), la Nuit
  des Lanternes (escorte : soins, protections et affaiblissements comptent double), la Veille des Géants (le boss). Chaque
  participant marque des points : sa contribution face à la Marée, ramenée à un build moyen de son niveau (un build moyen
  fait 60 points) ; ou le canal travail (livrer ce que la digue demande ce soir-là). Les absents y vont seuls (case cochée
  par défaut) ; le joueur connecté marque 15 % de plus. Le serveur additionne les points : quatre lanternes s'allument aux
  seuils de son objectif, chacune donne des éclats à tout le monde. Le coffre de la semaine compte les quatre meilleurs
  soirs (matières, une chance de cache d'équipement épique, des éclats). Les éclats achètent une tenue Marée haute (une par
  classe, 1 200 éclats ≈ trois semaines). Titres après dix soirs d'une Marée. Le fil du serveur raconte chaque soir.
- **Les fournitures de combat** (`combat/supplies.ts`, tuile « Fournitures » de la salle Combat) : des potions bues toutes
  seules sous 40 % des PV (deux au plus par rencontre), des préparations qui donnent un outil de situation pendant une heure
  de combat (huile de battue, rinçage clair, baume de parade, poudre de coin, tonique de synchronie, infusion de reprise,
  volée de flèches). Elles se fabriquent en Alchimie, Artificerie, Tannerie, Cuisine et Menuiserie.
- **L'atelier d'équipement** (`engine/gearCraft.ts`, `data/gear_crafting.yaml`, bouton dans la Forge, la Tannerie, la
  Couture, la Joaillerie, la Menuiserie et l'Enchantement) : chaque modèle fabricable a sa recette (métier de sa famille,
  matière de son palier, matière d'appoint, quantités selon l'emplacement, le palier et la rareté) ; niveau requis = palier ;
  lignes tirées à la fabrication, chef-d'œuvre signé qui devient plus probable quand on dépasse la recette.
- **La vitrine du marché** (`apps/server/src/vitrine.ts`, onglet « Vitrine ») : vendre une pièce depuis sa fiche, l'acheter
  au marché ; l'or du vendeur arrive à sa visite, taxe déduite ; le set de départ ne se vend pas.
- **Au-delà des Lointains** : douze chapitres après la route, qui reprennent les régions hautes au-delà du palier 90.
- **Le trophée des gardiens**, **le Renom des clans**, **les matières des hauts paliers** (sept lingots, cinq bois nobles,
  huit planches, le cuir d'élan), **les commandes de maître 60/80/99** des dix derniers métiers.
- **Moteur plus rapide** : une absence de 16 h jouait ~1 000 rencontres en refaisant tout à chaque fois (butin parmi 4 152
  modèles, équipement, plan) ; c'est indexé et gardé en mémoire (×8 au simulateur, autant au serveur).

## 4. Résultats après corrections

Série finale (graine 11, serveur `real`, 120 joueurs, 90 jours : `sim/reports/serveur/v6-real-120x90.md` ; pires cas
`v5-meta-100x90`, `v5-dump-100x90`, `v5-hoard-100x90`).

| | Avant (règles d'origine) | Après |
|---|---|---|
| Pièces d'équipement par joueur et par jour | 46 | 1,7 |
| Route principale (120 étapes) finie, casu tranquille | jour 14 | jour 45 (tryhard 31, casu guidé 24, combattant 20, bradeur 63 ; l'onglet oublié n'y arrive pas) |
| Tryhard face au casu | même vitesse | 1,45 fois plus vite sur la route, 2,3 fois pour le combattant (principe : jamais plus de 2 à 2,5) |
| Joueurs dont plus rien n'avance depuis 14 jours (jour 90) | — | 0 à 6 % selon la façon de jouer |
| Gardiens de la route | murs binaires, jusqu'à 2 900 jours-joueurs bloqués | médiane 0 à 6 jours, 90 % des joueurs en moins de deux semaines ; les vrais murs sont dans l'Au-delà (21 jours de médiane au chapitre 17) |
| Ensembles | 4 ensembles portés, les ensembles de classe jamais tombés | les 15 tombent ; 14 joueurs portent les Veilleurs du sceau, seule la Phrase inachevée n'est portée par personne |
| Gemmes serties | 5 (100 joueurs, 60 jours) | 79 (120 joueurs, 90 jours), surtout Hématite d'arrêt et Opale d'interstice |
| Équipement fabriqué | aucun | 621 pièces, 147 vendues à la vitrine (prix médian 302 or) |
| Fournitures | aucune utilité | ~25 000 préparations et potions emportées sur la route (Baume de parade, Huile de battue en tête) |
| Marée du soir | — | 113 participants par soir (60 % en direct), 3,7 lanternes sur 4 en moyenne, 359 éclats par joueur et par semaine, 112 tenues achetées en 90 jours |
| Renom des clans | — | 1 100 à 2 600 en 90 jours (Village à Bourg franc) |
| Commandes du maître réussies | — | 149 au rang 20, 115 au 40, 46 au 60 ; personne n'atteint 80 en 90 jours (des buts de long terme) |

**Classes et voies.** À façon de jouer égale (casus), la route au jour 30 : Runiste 119, Forgefeu 109, Traqueur 93. En fin
de partie, le Runiste reste devant (médiane 159 contre 149-150), surtout le Fulgurant (169) ; l'Enclumier et le Sigillaire
sont les voies les plus lentes. À la Marée : Runiste 92 points, Forgefeu 84, Traqueur 70. Sur un serveur 100 % méta, tout le
monde finit en voie de dégâts (la méta suit ce qui marche et n'essaie rien d'autre), alors que contrôle et soutien font
presque aussi bien ailleurs.

## 5. Ce qui reste fragile

- **L'or s'accumule.** Les robinets (commandes PNJ 82 %, maîtres 18 %) font environ deux fois les puits (bâtiments de clan,
  taxe du marché, réparations, étal) : ~4 900 or par joueur au jour 90, et ça monte en ligne droite. La richesse est très
  concentrée (Gini 0,9) : les plus riches sont des mineurs (la pierre des bâtiments de clan se vend, les commandes PNJ
  paient) ; les joueurs actifs, eux, dépensent tout.
- **Les matières premières valent 1 or.** Chaque joueur récolte des milliers d'unités par jour, bien plus que ce que les
  recettes, les clans et la Marée consomment ; sur un serveur de bradeurs, les prix restent à 45 % de la référence. Les
  objets fabriqués (repas, potions, préparations) gardent leur valeur.
- **La vitrine vend peu** : les acheteurs ont peu d'or et les artisans fixent des prix autour de 300 or. À regarder avec de
  vrais joueurs.
- **Le Traqueur est un peu derrière** (route et Marée), le Runiste un peu devant.
- **Les éclats de marée se vendent au marché** : le simulateur montre que bradeurs et spéculateurs les revendent.
- **Les limites du simulateur** : ses joueurs ne fabriquent pas leurs outils (ils les achètent à l'étal), ne font pas de
  patrouilles, ne fabriquent pas la Volée de flèches (plumes, hampes et pointes restent donc en stock dans la simulation,
  alors que la recette existe) ; ce ne sont pas de vrais humains (horaires, lassitude, entraide).
- **Contenu encore à écrire** : des recettes au-delà du niveau 60 pour l'Agriculture, la Couture, l'Alchimie, la
  Joaillerie, l'Enchantement, l'Artificerie et la Construction ; les matières hautes de la Tannerie, de la Couture et de la
  Joaillerie pour l'atelier ; les Routes franches, le Concours des Maîtres, les Profondeurs, les Éclaireurs, les saisons ;
  l'usure de l'équipement en combat ; la fabrication des pièces d'ensemble.

## 6. Questions pour Louis

1. Valider les taux de butin (environ 2 pièces par jour, un nommé par semaine de la même rencontre) et le plancher à 75 %.
2. La Marée : les récompenses (une tenue en trois semaines) et le fait que les éclats s'échangent au marché : les garder
   échangeables, ou les lier au personnage ?
3. L'or : baisser les commandes PNJ, ajouter des puits (usure et réparation de l'équipement, perfectionnement), ou un prix
   minimum au marché pour les matières premières ?
4. Faut-il relever un peu le Traqueur (route, Marée) ?
5. Relire les 30 commandes de maître écrites cette nuit (noms, surnoms, histoires).

## 7. Sources consultées (systèmes d'autres jeux)

- [Market Interventions in a Large-Scale Virtual Economy](https://arxiv.org/pdf/2210.07970) (Old School RuneScape : une taxe
  change peu les volumes, un puits ciblé fait monter le prix de l'objet visé).
- [Gold sinks : why most MMORPGs don't remove enough currency](https://gamedepth.onrender.com/posts/gold-sinks-why-most-mmorpgs-dont-remove-enough-currency)
  (les puits en pourcentage restent efficaces quand les joueurs s'enrichissent).
- [Legend of Mushroom, guides](https://commonsensegamer.com/legend-of-mushroom-guide-tips-tricks-to-play-better/) et
  [donjon à clés quotidiennes](https://theriagames.com/?p=8321) (étapes à boss, revenir en arrière pour monter, donjons à
  tentatives limitées).
- [Wartune, World BOSS](https://breezewiki.discard.no/wartune/wiki/World_BOSS) (récompenses au prorata des dégâts, prix
  du dernier coup) ; [World Boss de Sipher](https://atlas-atherlabs.super.site/sipher/wiki/game-feature/world-boss)
  (classements par classe, récompenses cumulées à part) : la Marée reprend l'idée des paliers communs et d'un score
  ramené à son niveau.
