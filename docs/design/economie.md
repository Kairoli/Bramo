# Économie, marché et puits

> **Statut : recommandation**, à arbitrer (voir [`arbitrages.md`](arbitrages.md)). Chiffres : `sim/reports/rapport.md`, sections « Repas » et « Économie ». Hypothèses du modèle : `sim/proposals/boucle-v0/economy.yaml`.
> [Décidé] : marché entre joueurs, ordres d'achat et de vente, commandes artisanales ; l'usure suit les actions réellement réalisées (hors ligne compris) ; un personnage arrêté ne se dégrade pas ; pas de perte de durabilité maximale ; repas à ~2 fois leur coût et garde-manger automatique (21 octobre).

## 1. Le constat principal : un surplus structurel

Dans un idle où chaque joueur produit 16 à 24 h effectives par jour **pour gagner de l'XP**, la production n'est pas tirée par la demande. Le simulateur additionne tout ce que le jeu consomme réellement (usure, repas, flèches, potions, kits des nouveaux) :

| Variante (avec combat) | Part de la production qui sert | Vendu au PNJ | Stocké | Or créé par joueur et par jour |
|---|---|---|---|---|
| Comme le prototype : rachat PNJ à 25 %, sans plafond, sans Construction ni recyclage | **5 %** | 47 % | 47 % | **+1 553** |
| Usure ×3 et repas plus forts | 7 % | 46 % | 46 % | +1 415 |
| **Recommandé** : Construction (15 % de l'artisanat), recyclage, rachat PNJ 10 % plafonné | **26 %** | 18 % | 45 % | **−90** |

Conséquences :

1. **L'usure n'est pas le puits principal**, contrairement au v1.0. Même triplée, elle ne retire que quelques pour cent du travail : un outil de fer coûte 37 min et tient des dizaines d'heures. Il ne faut pas la rendre punitive pour compenser : elle sert à **renouveler la demande** (les forgerons ont des clients), pas à absorber le volume.
2. **Le rachat du marchand PNJ est le vrai robinet d'or.** Sans plafond, il crée ~1 500 or par joueur et par jour, soit 300 000 par jour à 200 joueurs : inflation assurée.
3. **Le puits qui compte est la Construction**, parce qu'elle consomme des matériaux en quantité et rapporte de l'XP : on y met volontiers son surplus. Le recyclage absorbe ensuite une partie de ce qui a été fabriqué pour l'XP.
4. **Même ainsi, ~45 % de la production reste en stock.** C'est normal et sain dans un idle : les prix des matières en surplus tombent vers le plancher du PNJ, et ce sont **les artisans qui veulent de l'XP** qui les rachètent. Le marché ne vit pas de la rareté des matières de base, mais du **temps économisé** et des **paliers rares**.

## 2. Trois sortes de puits, à ne pas mélanger

| Retire… | Mécanismes | Rôle |
|---|---|---|
| **de l'or** | Taxe du marché (5 % sur chaque vente) ; frais de dépôt d'un ordre ; réparations au PNJ (au double du coût des matériaux) ; postes d'atelier et services (expéditions, stations) ; entretien de la halle du clan, **proportionnel à son usage**, jamais à l'absence | Tenir l'inflation |
| **des ressources** | Construction (éléments posés) ; consommables (repas, potions, flèches, runes de combat) ; recyclage (60 % perdus) ; épreuves des maîtres ; projets d'événement | Absorber le volume |
| **des équipements** | Usure → réparations (chacune réduit la durabilité maximale) → recyclage ; montée de palier ; qualité recherchée | Renouveler la demande des artisans |

## 3. Usure et réparation [Décidé le 21 octobre ; dans le moteur pour les outils, réparation par un artisan avec le marché]

- **La durabilité se compte en heures d'usage effectif** : chaque fabrication ou combat simulé, hors ligne compris, consomme sa durée. Un personnage arrêté (activité terminée, autonomie écoulée) n'use rien.
- **Repères** : outil de fer ~60 h effectives (deux à trois jours pour un régulier), armure de palier ~150 h de combat. Toujours affichée (« reste 23 h »), jamais de surprise.
- **Usé ≠ perdu** : à 0, l'objet ne donne plus son bonus et le personnage retombe sur l'outil d'apprenti. Il ne disparaît pas.
- **Réparer** : par un joueur du métier (30 % des matériaux, un peu d'XP, commande possible) ou par le PNJ (en or, deux fois plus cher). **La durabilité maximale ne baisse jamais** (décision de Louis : un objet qu'on aime ne doit pas se détruire doucement). Un objet n'est remplacé que par un meilleur palier.
- **Conséquence** : la demande d'équipement ne vient plus du remplacement, mais des **réparations** (travail régulier des artisans, or retiré par le PNJ), de la **montée de palier**, de la **qualité**, des **nouveaux joueurs** et des **ensembles d'événement**. Le modèle économique n'en est presque pas changé, l'usure pesant peu en volume.
- **Recycler** : rend 40 % des matériaux principaux (arrondis vers le bas), sans or. C'est un débouché pour tout ce qu'on fabrique pour l'XP, et une source de matières de bas niveau.

## 4. Consommables : le rapport bonus / coût [Recommandé]

Règle : **un repas rapporte environ deux fois le temps de chaîne qu'il coûte** à un joueur autonome. Il vaut la peine, sans être une évidence absurde, et sa production occupe vraiment des cuisiniers.

| Repas | Actuel : h de bonus par h de cuisson | Actuel : rendement autonome | Proposé : h de bonus par h de cuisson | Proposé : rendement autonome |
|---|---|---|---|---|
| Tisane de menthe | 300 | ×3,6 | 240 | ×2,1 |
| Poisson grillé au thym | 360 | ×10,0 | 180 | ×2,0 |
| Bouillon d'ortie | 450 | ×6,8 | 180 | ×1,9 |
| Truite à la sauge | 386 | ×11,4 | 150 | ×1,9 |
| Soupe aux lys-lanternes | 450 | ×13,1 | 113 | ×1,9 |
| Festin du givre | 360 | ×14,4 | 105 | ×2,0 |

Le simulateur règle seul la durée de chaque repas à partir du coût de sa chaîne (`pnpm --filter @bramo/sim sim calibrate --write`).

- **Garde-manger** : on y range des repas, le personnage en mange un dès que le précédent expire, **hors ligne compris**, gratuitement. Sans lui, le tryhard aurait un repas actif en permanence et le casu une heure par jour : un écart de pure attention.
- **Volume** : ~0,4 h de chaîne par joueur et par jour (≈2 % du travail), soit ~150 repas par jour à 20 joueurs et ~1 500 à 200.
- **Potions et flèches** suivent le temps de combat : 60 flèches et 2 potions par heure de combat dans les hypothèses, soit ~1 900 flèches par jour à 20 joueurs.

## 5. Le marchand PNJ : un rôle limité [Recommandé]

Le marchand ne doit être ni un débouché ni une source infinie d'or.

- **Vend** : outils d'apprenti (gratuits), graines de base, appâts simples, fioles vides au prix fort. Le poisson disparaît de sa boutique quand la Pêche ouvre.
- **Rachète** : à **10 % de la valeur de référence**, plafonné à **2 000 or par personnage et par semaine** (plafond hebdomadaire : pas de geste quotidien obligé). C'est un plancher de prix, pas un revenu.
- **Comptoir de la guilde** *(tranche la question des commandes de PNJ)* : trois commandes par semaine et par personnage, adaptées à ses niveaux, payées en or et en Renom. Elles injectent l'or **de façon maîtrisée** et donnent un débouché aux produits de bas niveau. Pas de quête quotidienne.
- **Valeur de référence** : 1 000 or par heure de travail autonome (outils d'apprenti). Un minerai de cuivre vaut ~3 or, une pioche de fer ~600, une robe runée ~2 600.

## 6. Sources et sorties d'or (variante recommandée, par joueur et par jour)

| Flux | Or / jour |
|---|---|
| + Rachat du PNJ (plafonné) | 286 |
| + Épreuves des maîtres | 40 |
| − Taxe du marché | 244 |
| − Réparations au PNJ | 49 |
| − Entretien du clan | 42 |
| − Services en or | 80 |
| **Solde** | **−90** |

Le solde doit rester **proche de zéro et légèrement positif** pour que les nouveaux trouvent de l'or en circulation : à régler avec le plafond du PNJ et le comptoir. **Hypothèses les plus sensibles** (rapport, « Sensibilité ») : la part de la production échangée au marché (elle porte la taxe) et le plafond hebdomadaire du PNJ ; viennent ensuite la part de temps passée en Construction (elle fait varier la part utile de 16 % à 47 %). L'usure et les flèches comptent peu.

## 7. Marché et commandes

- **Ordres d'achat et de vente** [Décidé], taxe de 5 % sur la vente, petits frais de dépôt remboursés si l'ordre est exécuté.
- **Commandes artisanales** [Décidé] : le client fournit tout ou partie des matériaux, l'artisan fabrique dans sa file et livre. Prime de commande (+20 % d'XP sur la fabrication, plafonnée) : servir les autres rapporte un peu plus que fabriquer pour soi, ce qui transforme une partie du surplus en demande réelle.
- **Signature et qualité** (v1.0) : les objets faits maison portent le nom de l'artisan. La réputation se construit par la qualité.

## 8. Viabilité selon la taille du serveur

| Joueurs | Spécialistes par métier (17 métiers) | Métiers sans spécialiste | Métiers avec moins de 3 spécialistes | Outils réparés / semaine | Repas / jour |
|---|---|---|---|---|---|
| 20 | 0,7 | ~9 | ~16 | 38 | 150 |
| 50 | 1,8 | ~4 | ~12 | 95 | 370 |
| 200 | 7,1 | ~0 | ~2 | 380 | 1 470 |

Ce qu'on en tire :

- **À 20 joueurs, le marché ne peut pas reposer sur des spécialistes** : la moitié des métiers n'en a aucun. L'autonomie doit rester praticable (elle l'est : §7 de `metiers.md`), le PNJ fournit un plancher, et **les clans jouent le rôle du marché** (entrepôt, commandes internes).
- **Il faut ouvrir les métiers par phases** : 6 métiers jouables pour la boucle de test, ~12 avec le marché et les clans, 18 avec le combat. Une règle simple : pas plus d'un métier jouable pour trois joueurs actifs.
- **À 50 joueurs**, la plupart des métiers ont un ou deux spécialistes : les commandes artisanales deviennent le cœur des échanges.
- **À 200 joueurs**, le marché se suffit ; les prix se forment vraiment.

## 9. Hypothèses sensibles et limites

- Le modèle est **un bilan de flux moyens**, pas une simulation d'agents qui fixent des prix. Il dit où va le travail et d'où vient l'or ; il ne prédit pas les prix.
- La population (part de casus, de spécialistes) et le temps de combat sont supposés.
- La part de temps en Construction est **un choix des joueurs** : si la Construction est peu attrayante, le surplus remonte. C'est l'hypothèse qui compte le plus pour les ressources.
- Le butin de combat n'est pas modélisé : il ajoutera une source de matières et d'or à intégrer en P4.
- Prochaine étape du simulateur : des bots qui passent des ordres au marché, pour tester les prix et la liquidité à 20 et 50 joueurs.
