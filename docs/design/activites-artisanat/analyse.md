# Analyse du dossier « Activités et artisanat » (v0.1)

> **Statut** : analyse de Claude du 22 octobre 2026, à partir de [`Bramo-activites-artisanat.md`](Bramo-activites-artisanat.md), de ses données (ZIP), du dossier « Le cœur du jeu », de [`../coeur-du-jeu/integration.md`](../coeur-du-jeu/integration.md) et du code au commit `87bea61`. Marques : **[Décidé par Louis]**, **[Proposé par Claude]**, **[Ouvert]**. Tout ce qui est « mesuré » ici vient du **moteur réel** (`packages/shared/src/combat/`), avec les résultats bruts gardés dans `sim/reports/combat/`, échecs compris.

## 0. En une page

**Le dossier est solide sur l'économie et l'artisanat, et sa structure d'activités est la bonne.** Je recommande d'en adopter l'essentiel : craft de tout l'équipement (sauf les nommés), butin borné en « unités de référence », vestiges régionaux, recyclage en poudres, réparation par le métier de la pièce, donjons répétables sans quota, escouades engagées, route solo permanente + branche saisonnière, world boss en assauts asynchrones, Routes franches plus tard. Ses chiffres de recettes reposent sur les vraies durées du jeu (vérifié), ses calculs de garantie sont exacts (vérifié).

**Mais les essais dans le moteur réel contredisent sa promesse centrale sur le PvE solo** : douze zones mécaniques ne suffisent pas à faire alterner la voie la mieux adaptée (§3.1). Dans le kit actuel, les voies d'une même classe se distinguent par leur vitesse, à peine par leur survie, et les outils de protection pèsent trop peu face aux PV. Tant que ce n'est pas corrigé, chiffrer 120 étapes serait chiffrer du vide. C'est **le chantier qui conditionne tout le PvE** (§5).

Trois autres résultats d'essai changent des règles du dossier :
- **Donjons** : 20 % de PV rendus entre deux salles rendent le parcours infranchissable sans soutien au danger normal (seuls Meneur de meute et Glyphiste passent). Il faut 35 à 50 %, et c'est ce paramètre qui donne enfin au soutien une niche mesurable : l'endurance sur un parcours long (§3.3).
- **Groupes de 1 à 4** : la bonne mise à l'échelle est **PV × N et cadence des attaques × N, coups répartis entre les membres**. Chacun gagne alors autant par heure qu'en solo (0,90 à 1,06 fois le temps solo), la composition mixte est la plus sûre ; garder la cadence inchangée rend un groupe beaucoup trop sûr (§3.2).
- **Traqueur** : la classe la plus fragile dans toutes les zones et tous les donjons (Tue-Bête surtout) ; à corriger avec le chantier des voies.

Corrigé dès maintenant dans le jeu : **la taxe du marché** (elle prenait 100 % d'une vente de 1 or) et **cinq noms de modèles** qui doublonnaient des nommés ou un passif (l'audit du dossier n'en voyait que trois).

## 1. Ce que j'ai vérifié

| Vérification | Résultat |
|---|---|
| Durées de récolte et de préparation supposées par le dossier (`preparations.json`) contre `data/recipes/` | **Identiques** pour les 32 sources et 5 préparations qui existent déjà, sauf la pierre runique : supposée récoltée en 12 à 14 s dès le niveau 1, elle demande Minage 15 et 16 s dans le jeu |
| Garantie des nommés (5 %, garantie à la 20ᵉ unité) | **Exact** : 12,83 unités en moyenne, 77 min à 6 min l'unité, 0,78 nommé par heure de référence ; 14,26 % d'au moins un drop direct sur 3 jets |
| Audit des noms (« 9 collisions ») | **Incomplet** : 15 modèles et 5 noms, pas 9 et 3. Manquaient « Murmure-d'épine » (apostrophe différente) et « Le Dernier Mot » (nom du passif de Fulgurant). Renommés (§4) |
| Taxe du marché sur les petits lots | **Problème réel** : la taxe arrondie au supérieur prenait 1 or sur toute vente de moins de 20 or (100 % d'une vente de 1 or). Corrigé : arrondi au plus proche (§4) |
| Douze zones solo, groupes de 1 à 4, donjon à PV gardés | **Jamais simulés par le dossier.** Simulés ici dans le moteur réel (§3) |

Le moteur a été étendu pour exprimer ces activités, **avec des options inactives par défaut** : les 38 880 combats du banc actuel donnent exactement les mêmes résultats. Ajouts (tous dans les données, testés par 8 nouveaux tests) :
- **renforts** qui arrivent à heure fixe ; vaincre le groupe principal termine la rencontre (un renfort ne rend jamais le chef invulnérable) ;
- **série de coups lourds** (un coup sur N est renforcé) ;
- **garde** sur tout le groupe ou à tour de rôle, **renforcée tant qu'un renfort vit** ;
- **soin ennemi** limité en nombre d'utilisations, éventuellement porté par un auxiliaire ;
- **érosion** cumulable qu'une purification retire ;
- **fenêtres** de vulnérabilité (dégâts réduits hors des fenêtres) ;
- **groupes** : PV et cadence ennemis adaptés à l'effectif, coups répartis entre les membres ;
- **PV de départ** (donjon : les PV se gardent d'une salle à l'autre) ;
- option de règle : les affaiblissements « une attaque » peuvent être **gardés pour le prochain coup lourd ou chargé**.

## 2. Cohérence avec les décisions

| Sujet | Décision existante | Dossier | Verdict |
|---|---|---|---|
| Talents des nommés | [Décidé par Louis, 22 oct.] capacités uniques traitées comme des talents | Nommés non fabricables en V1 ; butin + garantie personnelle + marché | **Compatible.** « Comme des talents » porte sur la place (une majeure), pas sur l'obtention. **À confirmer par Louis** (Q1) |
| Recyclage | [Décidé] poudres et fragments | Idem, aucune matière principale rendue | Conforme |
| Commandes à matériaux fournis | [Décidé] abandonnées | Aucune réintroduite | Conforme |
| Réparation par artisan | [Décidé] demande au marché, pas de matériaux fournis par le client, la Forge ne doit pas devenir indispensable | Réparation par le métier de la pièce (Forge, Tannerie, Couture, Menuiserie, Joaillerie, Enchantement), ~30 % des matières ordinaires | **Conforme, et répond au garde-fou** sur la Forge |
| Échelle des métaux | `combat-items.md` §5.5 : « argent (30), mithril (40), or (50)… » | Argent et or deviennent la filière des **métaux précieux** (Joaillerie) ; la Forge passe par « acier trempé » (30) et « mithril renforcé » (50) | **Cohérent avec `metiers.md`** (argent et or pour la Joaillerie). Je recommande la version du dossier (Q4) |
| Classe et voie dans le solo | [Décidé par Louis, 22 oct.] zones et paliers font alterner la voie ; un DPS montera parfois un build de contrôle | « Mon désaccord avec une classe obligatoire par zone » | **Malentendu du dossier** : Louis parle de **voie et de build**, pas de classe. Changer de voie est gratuit et partage le niveau : aucune taxe d'accès. Le problème est ailleurs (§3.1) |
| Bonus de la route | [Décidé, Q3] un peu de tout, à des checkpoints conséquents | +1 % de Puissance aux étapes 40/80/120 (3 % au plus), titres, gemmes, matières ponctuelles ; aucun bonus économique au début | Conforme |
| Forme du solo | [Décidé, Q4] étapes et chapitres façon *Legend of Mushroom* + saisons à mutations | Route permanente (12 zones × 10 étapes) + route saisonnière séparée | Conforme |
| Clans | [Décidé] clan à construire, bâtiments à boosts, pas d'entrepôt | Routes franches : apports consommés, pas d'entrepôt ; classement reporté | Conforme ; à reporter après donjons et world boss |
| Événements | `combat-items.md` §3.3 : jamais fermés aux non-combattants, canaux normalisés | World boss : 4 canaux au même plafond | Conforme |
| Limite de combat | `rules.fightLimit` = 240 s | « Unité de référence » de **6 minutes** par cible notable | **Tension** : une cible de 6 min ne tient pas dans 240 s. Le dossier précise que c'est une unité de budget ; il faut l'écrire comme un **poids de récompense** (temps de référence de la rencontre / 360 s), jamais comme une durée de combat (§5) |

## 3. Essais dans le moteur réel

### 3.1 Les douze zones ne font pas alterner les voies

**Méthode.** Les douze zones du dossier traduites en rencontres d'essai (proposition `sim/proposals/zones-v0/`), puis trois variantes. Pour chacune, `sim combat-search` essaie **toutes les combinaisons de 5 sorts** de chaque voie au répertoire 80 et mesure le **mur** : le plus haut danger (×1 à ×4) où l'un de ses plans gagne 90 % des combats. Rapports : `sim/reports/combat/zones-*/recherche.md`.

| Variante | Ce qui change | Écart de mur entre la meilleure et la moins bonne voie, par zone | Mur moyen par voie (Trempe-Rouge · Enclumier · Rémouleur · Tue-Bête · Piégeur · Meneur · Fulgurant · Sigillaire · Glyphiste) |
|---|---|---|---|
| `zones-v0` | Mécaniques du dossier, menaces modérées | 0,5 à 1,5 cran | 2,42 · 2,38 · 2,38 · **1,96** · 2,33 · 2,33 · 2,46 · 2,75 · 2,58 |
| `zones-v1` | Menaces franches (coups lourds ×9, gardes ×2, érosion ×2,5…) | 0,5 à 1 cran | 1,83 · 1,83 · 1,83 · **1,25** · 1,79 · 1,79 · 1,92 · 2,08 · 2,00 |
| `zones-v1-defense` | v1 + soins et protections ×2,5 | 0,5 à 2 crans | 2,42 · 2,46 · 2,67 · **1,92** · 2,17 · 2,54 · 2,54 · 2,75 · 2,96 |
| `zones-v1-heavy` | + affaiblissements gardés pour le coup lourd | identique au précédent | identique |

**Lecture.**
- **Le motif annoncé par le dossier (DPS ici, soutien là, contrôle là-bas) n'apparaît dans aucune variante.** Exemples : dans la Chambre aux deux sceaux, annoncée « DPS », Trempe-Rouge et Tue-Bête ont les murs **les plus bas** ; les Fossés gris (érosion, annoncés « soutien ») ne favorisent qu'un soutien, le Glyphiste, et seulement quand les protections sont multipliées par 2,5.
- **Les écarts suivent les classes plus que les voies** : le Runiste a les murs les plus hauts, le **Traqueur les plus bas partout** (Tue-Bête dernier dans les quatre variantes).
- **Le DPS reste le plus rapide presque partout** : l'ordre de vitesse décidé à l'étape 3 tient.

**Pourquoi.** Trois causes, mesurées :
1. **Les voies d'une même classe partagent l'essentiel de leurs sorts** : les meilleurs plans d'Enclumier et de Rémouleur ne contiennent aucun sort de leur voie (étape 3). La voie ne change qu'un passif.
2. **Les outils défensifs pèsent trop peu** : une protection vaut 0,2 à 1,5 P, soit 1 à 5 % des 2 800 PV de référence. Même ×2,5, l'écart entre voies dépasse rarement un cran.
3. **Le contrôle ne vise pas le danger** : en combat automatique, la Rupture affaiblit « la prochaine attaque », presque toujours un coup ordinaire. Les garder pour le coup lourd aide réellement (Enclumier : de 2 à 8 victoires sur 8 sur les Terrasses de la vigie) mais un plan de contrôle ne provoque qu'une à deux Ruptures par combat de boss : pas assez pour déplacer un mur.

**Conséquence.** On ne peut pas chiffrer les 120 étapes maintenant : il faut d'abord que les voies aient des **outils distinctifs et lourds** face aux mécaniques (§5). La bonne nouvelle : l'outil de mesure existe, et il dira objectivement quand c'est atteint.

### 3.2 Groupes de 1 à 4 : quelle mise à l'échelle

**Méthode.** `sim combat-groups` : six compositions (duo, trio, 4 dégâts, 4 contrôles, 4 soutiens, mixte), plans conseillés, six profils de rencontre, danger ×1 et ×2, trois mises à l'échelle. Rapport : `sim/reports/combat/groupes.md`.

| Mise à l'échelle | Temps du groupe / temps solo de ses membres | Sûreté |
|---|---|---|
| PV × N, cadence inchangée, coups répartis | 0,92 à 1,11 | **Trop sûre** : chacun reçoit N fois moins de coups |
| **PV × N, cadence × N, coups répartis** | **0,90 à 1,06** | **Chaque membre subit la pression du solo.** À ×2, membre le plus bas : 4 dégâts 32 %, 4 contrôles 44 %, 4 soutiens 40 %, **mixte 47 %** |
| PV × N, cadence × N, tout sur le premier | jusqu'à 1,43 | Le premier meurt ; à ×2, aucune composition ne passe le groupe compact. Sans rôle de tank, à écarter |

**Recommandation [Proposé par Claude]** : PV × N, cadence des attaques ordinaires × N, chaque coup ordinaire vise un membre à tour de rôle ; les **phases** (charge, garde, soin) ne se multiplient pas, une charge frappe un seul membre ; une aura ou une érosion touche chacun. Résultat : **autant de récompenses par participant et par heure qu'en solo**, jusqu'à ~10 % d'avance de synergie, et une composition complémentaire plus sûre. C'est exactement l'objectif du dossier (§9), mesuré.

### 3.3 Donjon : la récupération entre les salles décide de tout

**Méthode.** `sim combat-dungeon` : la Fonderie en prototype (groupe compact → cible durable → charge → groupe compact → gardes → soin ennemi), PV gardés d'une salle à l'autre, 15 s de repos qui rendent une part des PV maximum. Rapport : `sim/reports/combat/donjon.md`.

| Repos | Danger ×1 | Danger ×1,5 |
|---|---|---|
| 20 % (dossier) | **Seuls Meneur de meute et Glyphiste** terminent ; tous les autres tombent en salle 3 | Personne |
| 35 % | Tout le monde sauf Tue-Bête | Personne |
| 50 % | Tout le monde | Glyphiste 100 %, Sigillaire 83 %, Meneur 33 %, les autres 0 % |
| 100 % (salles indépendantes) | Tout le monde | Tout le monde |

**Lecture.** Garder les PV crée une vraie dimension **d'endurance**, la seule où le soutien (et le Sigillaire) prennent un avantage net : c'est la niche que les zones n'ont pas su lui donner. Mais à 20 %, elle devient une **obligation de composition**, contraire au dossier lui-même. Recommandation : **40 % au départ**, à recalibrer avec les vraies salles ; le danger d'un donjon se règle ensuite par la longueur et la profondeur, pas par une récupération punitive. Le prototype dure ~6 min pour six salles : les 12 à 20 min annoncés demanderont des salles 2 à 3 fois plus longues, à mesurer.

## 4. Corrigé dans le jeu à l'occasion

- **Taxe du marché** (`engine/market.ts`) : arrondie au plus proche au lieu du supérieur. Elle vaut 5 % en moyenne même sur les petits lots, le vendeur ne reçoit jamais plus que le prix (aucun or créé). Test mis à jour.
- **Noms de modèles** (`data/gear.yaml`, `docs/design/catalogue/data.mjs`, `ITEMS.md`, `catalogue.html/json`) : *La Rancune* → *Le Marteau des griefs*, *Le Dernier Mot* → *Rondache du Dernier Carré*, *Murmure-d'épine* → *Arc des Ronceraies*, *Les Sœurs silencieuses* → *Les Jumelles muettes*, *Le Livre des ratures* → *Le Recueil des brouillons*. Les identifiants ne changent pas (exemplaires existants intacts) ; les noms restent libres pour les futurs nommés.

## 5. Le chantier qui conditionne le PvE : l'identité des voies

Proposition **[Proposé par Claude]**, à faire avant de chiffrer la route solo :

1. **Des outils de voie lourds et ciblés** : chaque voie gagne deux ou trois réponses qui changent l'issue face à une mécanique, plutôt que des passifs de +0,15 P. Exemples à mesurer : contrôle → Pression bien plus forte et Rupture qui couvre le prochain coup lourd ; soutien → protections en part des PV (10 à 20 % des PV maximum plutôt que 1 P) et purification ; dégâts → exécution et dégâts de zone qui tuent les renforts avant leur effet.
2. **Ne pas monter les protections partout** : les essais montrent qu'une protection plus forte rend aussi le **Glyphiste plus rapide** (son Encre convertit l'absorbé en dégâts). Les leviers doivent être propres à chaque voie.
3. **Traqueur** : revoir sa survie de classe (Repli couvert, Garde de meute) ; c'est la classe la plus fragile partout.
4. **Critère d'acceptation mesurable**, avec `sim combat-search` sur les douze zones : dans au moins la moitié des zones, la meilleure voie dépasse la moins bonne d'**au moins un cran**, et **chaque voie est en tête dans au moins deux zones** ; aucune voie sous ×1,5 dans une zone ; le DPS reste le plus rapide de sa classe dans la majorité des zones.
5. **Ensuite seulement**, chiffrer la pente des 120 étapes avec la vraie courbe d'équipement.

## 6. Verdicts par sujet

| Sujet | Verdict | Précision |
|---|---|---|
| Tout l'équipement fabricable, sauf les nommés | **Adopter** | Le craft choisit le modèle (sa rareté est celle du modèle) ; les lignes restent aléatoires |
| Nommés : butin, garantie personnelle (5 %, 20 unités), commerce | **Adopter** si Louis confirme (Q1) | Compteur par compte, trophée et palier ; jamais une cinquième majeure |
| Vingt-huit patrons, facteurs de palier et de rareté | **Adopter comme générateur** | Durées vérifiées. Ne pas importer les 4 293 recettes : générer les recettes du jeu depuis les patrons, palier par palier |
| Vestiges régionaux (4 + quartz de faille 4 pour 1) | **Adopter** | Aucun vestige recyclable ; minimum garanti par victoire |
| Recyclage en poudres, abrasif substituable | **Adopter** | Conforme à la décision de Louis |
| Réparation par le métier de la pièce, ~30 % des matières | **Adopter** | Harmoniser la formule PNJ avec `settings.wear.repairGoldShare` (150 %) |
| Taxe des petits lots | **Fait** | Arrondi au plus proche |
| Donjons de 6 salles, 1 à 4, sans quota | **Adopter avec correction** | Repos à **40 %** (pas 20 %) ; mise à l'échelle de groupe du §3.2 |
| Escouades hors ligne engagées | **Adopter, plus tard** | Une seule escouade, activité engagée, instantané figé ; à construire sur le moteur actuel (déterministe, à la demande) |
| Route solo 12 × 10 | **Adopter la structure, pas encore les chiffres** | Après le chantier des voies (§5). Crédit d'XP d'échec : unique par étape, comme proposé |
| Bonus de route +1 % ×3, aucun bonus économique au début | **Adopter** | Conforme à Q3 |
| Route saisonnière à mutations | **Adopter, plus tard** | Une mutation à la fois, record séparé |
| World boss : 72 h, assauts de 10 min, 4 canaux, 60 min d'effort récompensé | **Adopter, plus tard** | Mort : 60 s d'attente ; contributions déjà comptées par le moteur (soins utiles, absorbé, atténué, Pression) |
| Routes franches (clan) | **Reporter** | Après donjon et world boss ; mode classé encore plus tard |
| Consommables : un repas de combat, une potion automatique | **Adopter, avec mesure** | Une potion de 8 % des PV peut remplacer un soutien : à tester avant d'ouvrir |
| Agriculture en parcelle·heures | **Ouvert** | Arbitrage déjà en attente (`arbitrages.md`) |

## 7. Ordre d'intégration révisé

| Étape | Contenu | Condition pour continuer |
|---|---|---|
| **5a** | **Identité des voies** (§5) et survie du Traqueur, mesurées sur les douze zones | Critère du §5 atteint |
| **5b** | **Statistiques réelles** : l'équipement porté nourrit P, PV, Défense, Cadence, Critique (rendements décroissants) | Courbe niveau + équipement → murs franchis, par voie |
| **6a** | **Une boucle d'objets complète** : une douzaine de classiques (Forge et Menuiserie d'abord, déjà jouables), butin de combat vers les exemplaires, recyclage en poudres, vente à la vitrine | Un objet parcourt toute la boucle : butin ou craft → porté → usé → réparé → vendu ou recyclé |
| **6b** | **Route solo, six premières zones** et leurs checkpoints | Plusieurs plans par voie ; aucun échec causé par un élément requis |
| **6c** | **Fonderie complète** (6 salles, repos 40 %), deux ensembles, trois nommés avec garantie | Rendement ciblé vs parcours vs craft comparé |
| 7 | Tannerie, Couture, Joaillerie, Enchantement minimales (cuir, tissu, bijoux, gemmes) ; reste des zones et régions | Aucun métier « bientôt » requis par un objet annoncé |
| 8 | Escouades de 2 puis 4 ; route saisonnière ; world boss ; Routes franches | Aucun double gain ni double engagement ; non-combattants réellement participants |

## 8. Questions pour Louis

- **Q1 — Nommés** : non fabricables en V1 (butin, garantie de 20 unités, marché), comme le recommande le dossier ? Ou fabricables comme les gemmes ?
- **Q2 — Donjons** : récupération de **40 %** des PV entre deux salles (mes essais : 20 % impose un soutien, 50 % rend l'endurance peu sensible) ?
- **Q3 — Chantier des voies (§5)** : d'accord pour le faire **avant** de chiffrer la route solo, avec le critère mesurable proposé ?
- **Q4 — Métaux** : argent et or réservés à la Joaillerie (filière précieuse) et « acier trempé » (30) / « mithril renforcé » (50) pour la Forge, comme le propose le dossier ?
