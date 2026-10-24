# Saison 1 : Les Pages du Notaire

**[Décidé par Louis le 24 octobre, chiffres proposés par Claude et acceptés]** Rien n'est codé. La saison ne commence pas
maintenant : elle s'ouvrira avec la sortie publique. Cette fiche garde tout ce qui a été décidé pour la construire le moment
venu. Modèle d'une saison : `../lore/bible-de-bramo.md` §13.3.

## 0. Ce qui a été décidé avec Louis

- La saison n'est **pas** la Marée du soir. La Marée tourne tous les soirs, toute l'année, donne des **éclats** et a sa propre
  boutique (Marée haute, cadres de titre). La saison a **sa propre monnaie, les feuillets**, et sa propre boutique.
- D'où le nom : la Saison 1 ne s'appelle plus « La Marée haute » (on confondait avec la Marée du soir et la tenue Marée haute).
- **Trois mutateurs** qui touchent chacun une partie du jeu (métiers, combat, marché), aucun au-delà de 10 % [Louis : « 20 %
  c'est gigantesque sur 10 semaines » ; « au moins 2 ou 3 mutateurs qui touchent un peu à tout », pas de la complexité].
- **Des quêtes de saison** pour gagner des feuillets, qui ne forcent jamais à changer sa façon de jouer.
- **Des gros montants** pour pouvoir lisser (comme l'or), pas des 1 ou 2.
- **Feuillets invendables** (liés au personnage) : sinon un joueur riche en or viderait la saison en deux semaines.
- **Une arme d'apparence par classe** : bâton (Runiste), marteau (Forgefeu), arc (Traqueur).
- **Une tenue complète par classe**, dessinée par Claude, **vendue pièce par pièce** : on achète les pièces qu'on veut.
- **Rythme** : un joueur ne vide pas la saison en deux semaines, mais ne galère pas non plus.

## 1. L'histoire

**Le thème** : le commencement, et une première vérité — la Marée ne prend pas au hasard.

**Ce que fait la Marée** : elle monte plus haut que jamais depuis la Grande Marée. Elle arrache des pages au registre du Notaire
des marées (le gardien des Archives englouties), et ces pages s'échouent partout dans les Lointains.

**Les actes**, annoncés au Panneau à leur date, pour tout le serveur (une ligne chacun, plus un mot dans le journal) :

| Quand | Acte | Annonce au Panneau |
|---|---|---|
| Semaine 1 | **La crue** | « La Marée est montée plus haut que jamais. Au matin, la digue était couverte de feuillets trempés. » |
| Semaine 4 | **Le nom** | « Odile la copiste a fait sécher un feuillet : il porte le nom d'une famille du bourg, et la date de la Grande Marée. » |
| Semaine 8 | **Les comptes** | « Recollées, les pages disent toutes la même chose : la Marée ne prend pas au hasard. Elle tient des comptes. » |
| Semaine 10 | **Le pupitre** | « Odile garde une page, la plus abîmée. Elle installe un pupitre sous la halle : le Registre du bourg est ouvert. » |

**Ce qui reste après** (obligatoire) :
- **Le Registre et le Carnet** : le Carnet (salle Personnage) range les pages du Registre. **Six pages, une par gardien** battu
  pour la première fois (Mère Grise, le Contremaître rouge, la Matriarche de résine, le Notaire des marées, le Gardien des trois
  portes, le Régent des courants), plus **la page de la Saison 1**, que reçoivent ceux qui ont trouvé au moins un feuillet.
  Les pages de gardien sont **permanentes** : un joueur qui arrive à la Saison 5 les gagne toujours. Chaque saison suivante
  ajoute sa page.
- **Odile la copiste**, nouvelle figure du bourg, et son **pupitre sous la halle**, où l'on relit le Registre.

**La question laissée ouverte** : de qui sont les noms écrits dans le registre, et qui tient les comptes de la Marée ?
(Une seule révélation par saison : « elle tient des comptes ». Le pourquoi reste fermé : §10 et §13.6 de la bible.)

## 2. Les feuillets

Une monnaie de saison, **liée au personnage** (ni vente, ni échange). Elle s'affiche dans le bandeau de la saison.

### 2.1 Comment on en gagne

| Source | Gain | Pourquoi |
|---|---|---|
| **Trouvailles** | 6 par heure de métier et 6 par heure de route (le hors-ligne compte), **150 par jour au plus** | tout le monde laisse tourner son perso : le plafond empêche le temps passé seul de creuser l'écart |
| **Quêtes de la semaine** | 4 quêtes, renouvelées le lundi, **200 chacune** | la vraie différence entre un joueur présent et un absent |
| **Marée du soir** (inscrit, en direct ou non) | **50 + 10 par lanterne allumée** (90 au plus) | relie la saison au soir sans la confondre avec lui |
| **Ventes au marché** | **1 par tranche de 25 or** vendus, **60 par jour au plus** | une économie active ; le plafond coupe les abus entre comptes |
| **Gardiens** | **300** à la première victoire sur chacun des six, une fois | rattrape les nouveaux venus, qui arrivent tard sur la route |

### 2.2 Les quêtes de la semaine

Quatre par joueur, tirées chaque lundi dans la liste (comme les commandes du Comptoir, propres à chacun). **Deux se remplissent
en jouant normalement, deux demandent un geste** ; aucune ne demande de changer de métier ni de build.

| Se remplit toute seule | Demande un geste |
|---|---|
| Travaille 25 heures dans tes métiers (n'importe lesquels) | Participe à 2 Marées du soir |
| Gagne 150 combats sur la route | Termine 5 commandes du Comptoir |
| Fabrique ou récolte 500 objets | Vends 10 lots au marché |
| Fais 10 comptes ronds (mutateur 1) | Apporte quelque chose à ton clan (seulement si on a un clan) |

Les quantités sont **à équilibrer** au simulateur (la route d'un joueur bloqué rejoue ses étapes, donc les combats comptent toujours).

## 3. Les trois mutateurs

Ils valent pour tout le monde, pendant toute la saison, et sont écrits dans les données (`data/seasons.yaml`).

| Mutateur | Ce qu'il touche | La règle |
|---|---|---|
| **Le compte rond** | les métiers | **une action sur 10 compte double** dans chaque métier (+10 % au total, juste entre une récolte de 12 s et une fabrication de 2 min). Un compteur dans la salle du métier : « prochain compte rond dans 3 ». |
| **L'encre fraîche** | le combat et le build | **le premier sort de ton plan part deux fois** à chaque combat, la seconde à 50 %. Le choix du sort d'ouverture change la méta pendant 10 semaines. |
| **La marge du Notaire** | le marché | la **taxe de vente passe de 5 % à 3 %** (les feuillets des ventes, §2.1, en plus). |

## 4. La boutique de la saison

En feuillets. **Tout s'achète à la pièce** ; rien n'oblige à tout prendre.

### 4.1 Les apparences

**La tenue du Copiste**, une version par classe (`byClass`), six pièces : coiffe, haut, gants, jambes, bottes, cape.

| Classe | L'idée de la tenue | L'arme d'apparence |
|---|---|---|
| **Runiste** | robe de scribe, capuche où dépasse une plume, manchettes tachées d'encre | **Bâton-plume** : un bâton surmonté d'une grande plume qui goutte d'encre |
| **Forgefeu** | tablier taché d'encre, manchettes de copiste, gants de cuir ciré | **Marteau-sceau** : un marteau dont la tête est un sceau de notaire (il laisse un cachet) |
| **Traqueur** | capuchon court, carquois de rouleaux de parchemin à la place des flèches | **Arc-signet** : un arc enrubanné de parchemin, des flèches à plume d'oie taillée |

Commun aux trois : encre bleu-noir, parchemin, cire rouge, des feuillets qui volent doucement (effet léger, budget d'affichage
de `../eclats.md` §8).

### 4.2 Les prix

| Objet | Prix |
|---|---|
| Une pièce de la tenue du Copiste (×6 par classe) | **1 500** chacune |
| L'arme d'apparence de la classe | **4 000** |
| L'ornement de nom de la saison (le même pour toutes les classes ; à demander à GPT) | **3 500** |
| **Tout pour sa classe** (6 pièces, l'arme, l'ornement) | **16 500** |
| La tenue et l'arme d'une autre classe (on peut changer de classe à tout moment) | **13 000** par classe |
| **Toute la boutique** (trois classes et l'ornement) | **42 500** |

Pas d'exclusivité définitive : après la saison, ses apparences pourront revenir un jour en boutique ; la saison, elle, ne
revient pas.

## 5. Le classement et les titres

**Le classement de la saison** : le nombre de **feuillets trouvés** (pas ceux qu'on a gardés : acheter ne fait rien perdre).

| Feuillets trouvés | Titre de saison |
|---|---|
| 5 000 | Lecteur |
| 12 000 | Copiste |
| 20 000 | Archiviste |
| 26 000 | Plume du Notaire |
| Les 10 premiers du serveur | Encre d'or |

Les titres de saison se choisissent comme les autres (fenêtre « Ornements et titres ») et gardent leur saison : « Copiste
(Saison 1) ».

## 6. La fin de la saison

- Les mutateurs s'arrêtent, la boutique ferme, les quêtes s'arrêtent.
- Les **feuillets restants se changent en éclats**, **10 feuillets pour 1 éclat** : rien n'est perdu, mais on n'a pas intérêt à
  les garder plutôt qu'à les dépenser.
- Les apparences achetées, les titres, les pages du Carnet, Odile et son pupitre restent.

## 7. Le rythme (vérifié)

Calcul fait avec la simulation de serveur (`sim/reports/serveur/v6-real-120x90.md`, 120 joueurs, 90 jours) : 94 % des joueurs
inscrits à la Marée chaque soir, 3,7 lanternes allumées en moyenne ; route finie vers le jour 45 (casu) ou 31 (tryhard) ;
ventes au marché de 350 or par jour (casu) à 1 700 (tryhard) et plus (artisan du marché), or ×10 compris.

| Façon de jouer | Par jour | Boutique de sa classe (16 500) | Trouvés en 10 semaines | Titre atteint |
|---|---|---|---|---|
| Tryhard (4 quêtes, toutes les Marées, gros vendeur) | ~410 | **fin de la semaine 5** | ~30 600 | Plume du Notaire |
| Régulier (4 quêtes, 6 Marées sur 7) | ~365 | **semaine 6** | ~27 400 | Plume du Notaire, de justesse |
| Tranquille (3 quêtes, 3 Marées par semaine) | ~285 | **semaine 7 à 8** | ~21 600 | Archiviste |
| Joue peu (les 2 quêtes qui se font seules, pas de Marée) | ~210 | **dans les derniers jours** | ~16 500 | Copiste |

Chacun finit sa boutique, aucun ne la vide en deux semaines. Écart tryhard / casu tranquille : ×1,4 (principe n° 2 :
jamais plus de 2 à 2,5). Personne ne peut tout acheter (42 500) : les trois classes restent un vrai but pour les plus
assidus.

## 8. Ce qui est stable, ce qu'il faudra mesurer

**Stable par construction** :
- feuillets invendables : pas de saison achetée avec de l'or, pas de transfert entre comptes ;
- plafond des trouvailles : le perso qui tourne 24 h n'avance pas plus vite que celui qui tourne 12 h ;
- plafond des ventes : un vendeur à son propre second compte ne gagne pas plus de 60 par jour ;
- les gardiens ne donnent leurs feuillets qu'une fois.

**À mesurer au simulateur avant l'ouverture** (le moment venu) :
- **L'encre fraîche** : rendre la Marée plus facile pour tous. Les points de Marée sont comparés à un build moyen de son niveau :
  la référence doit être calculée **avec** le mutateur, sinon toutes les lanternes s'allument et les éclats montent. Mesurer
  aussi le gain sur les gardiens (cible : quelques pour cent de vitesse, pas un palier).
- **Le compte rond** : +10 % de production pour tous pendant 10 semaines, donc un peu plus de matières sur le marché et des prix
  un peu plus bas. Accepté, à surveiller.
- **La marge du Notaire** : la taxe du marché est 20 % des puits d'or ; la baisser de 5 % à 3 % retire environ 8 % des puits
  pendant la saison. Accepté pour 10 semaines, à surveiller avec le reste de l'or.
- Les quantités des quêtes (§2.2).

## 9. Ce qu'il faudra construire (une seule fois, pour toutes les saisons)

La machine des saisons, pour que chaque saison suivante ne soit **qu'une fiche dans `data/seasons.yaml`** :

1. **`data/seasons.yaml`** : numéro, titre, dates, actes (date et annonce), mutateurs, monnaie, sources de feuillets et leurs
   plafonds, quêtes, boutique (pièces et prix), titres, page du Registre, taux de change de fin.
2. **Le moteur** : la saison en cours selon la date ; les mutateurs dans le calcul (catégorie « Saison » déjà prévue pour le
   compte rond ; une règle d'ouverture pour l'encre fraîche ; la taxe du marché lue depuis la saison) ; les feuillets et leurs
   plafonds par jour ; les quêtes de la semaine ; le change de fin.
3. **Le serveur** : les annonces des actes au Panneau à leur date ; le classement de la saison ; la boutique ; les titres.
4. **L'écran** : un bandeau de saison (dans la barre du haut, où la place est prévue), une fenêtre Saison (histoire en actes,
   feuillets, quêtes, boutique, classement), le compteur du compte rond dans la salle d'un métier.
5. **Le Registre et le Carnet** : les six pages de gardien (à écrire), la page de la Saison 1, l'onglet Carnet de la salle
   Personnage ; Odile et son pupitre au bourg.
6. **Les apparences** : la tenue du Copiste pour les trois classes, les trois armes, l'ornement de saison (GPT).

Ce qui est laissé de côté (dosage, bible §13.3) : gardien de saison, zone de saison, quatrième visage de la Marée, Grande
Marée de fin de saison.
