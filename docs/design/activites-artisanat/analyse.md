# Analyse du dossier « Activités et artisanat » (v0.1)

> **Statut** : analyse de Claude du 22 octobre 2026, à partir de [`Bramo-activites-artisanat.md`](Bramo-activites-artisanat.md), de ses données (ZIP), du dossier « Le cœur du jeu », de [`../coeur-du-jeu/integration.md`](../coeur-du-jeu/integration.md) et du code au commit `87bea61`. Marques : **[Décidé par Louis]**, **[Proposé par Claude]**, **[Ouvert]**. Tout ce qui est « mesuré » ici vient du **moteur réel** (`packages/shared/src/combat/`), avec les résultats bruts gardés dans `sim/reports/combat/`, échecs compris.

## 0. En une page

**Le dossier est solide sur l'économie et l'artisanat, et sa structure d'activités est la bonne.** Je recommande d'en adopter l'essentiel : craft de tout l'équipement (sauf les nommés), butin borné en « unités de référence », vestiges régionaux, recyclage en poudres, réparation par le métier de la pièce, donjons répétables sans quota, escouades engagées, route solo permanente + branche saisonnière, world boss en assauts asynchrones, Routes franches plus tard. Ses chiffres de recettes reposent sur les vraies durées du jeu (vérifié), ses calculs de garantie sont exacts (vérifié).

**Mais sa promesse centrale sur le PvE solo n'est pas encore démontrée** : avec le kit seul (sorts et passifs), les douze zones ne font pas alterner les builds (§3.1). Les voies d'une même classe se distinguent par leur vitesse, à peine par leur survie, et les protections pèsent trop peu face aux PV. Le levier voulu, **les ensembles de 4**, n'est pas encore dans le moteur : le tester est **le chantier qui conditionne tout le PvE** (§5), avant de chiffrer 120 étapes.

Trois autres résultats d'essai changent des règles du dossier :
- **Donjons** : 20 % de PV rendus entre deux salles est trop dur même avec potions et repas (4 voies sur 9 échouent). **30 % avec une préparation (repas, potions) fait passer les 9 voies**, et donne au soutien une niche mesurable : il finit sans boire ses potions (§3.3).
- **Groupes de 1 à 4** : la bonne mise à l'échelle est **PV × N et cadence des attaques × N, coups répartis entre les membres**. Chacun gagne alors autant par heure qu'en solo (0,90 à 1,06 fois le temps solo), la composition mixte est la plus sûre ; garder la cadence inchangée rend un groupe beaucoup trop sûr (§3.2).
- **Traqueur** : la classe la plus fragile dans toutes les zones et tous les donjons (Tue-Bête surtout) ; à corriger avec le chantier des voies.

Deux résultats de la seconde série d'essais (après les questions de Louis) :
- **Le soutien soutenait mal ses alliés à cause des plans conseillés**, trouvés pour la vitesse en solo et sans aucun soin. Avec un plan de groupe (soins, protections), un Glyphiste couvre 4 fois plus de dégâts de ses alliés, et l'ordre attendu apparaît : 2 dégâts + soutien + contrôle ou 2 soutiens battent 3 dégâts + contrôle et 4 dégâts (§3.4).
- **Faille trouvée et refermée** : un groupe sans aucun DPS devenait le plus sûr de tous. Une difficulté qui monte PV **et** dégâts (la pente du dossier) et une **fureur** calée sur chaque salle l'empêchent de franchir tous les murs en prenant son temps (§3.4).
- **Ensembles de 4** : les zones du dossier n'y sont pas liées, et son propre banc montre qu'une paire d'ensembles ne change le temps que de ~6 % (13 % au plus), et un même ensemble (la Vigie) revient dans la plupart des meilleures paires (§3.5).

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

**Précision de Louis (22 octobre).** Le levier voulu pour faire alterner les builds n'est pas la voie mais **les ensembles de 4 pièces** : le dossier a jugé trop dur d'imposer la refonte complète d'une voie ou d'une classe. **Ces essais ne testent pas ce levier** : ils jouent le kit seul (sorts et passifs), car les effets d'ensemble et les gemmes ne sont pas encore dans le moteur. Ils montrent seulement que **le kit seul ne crée pas d'alternance** ; ils ne disent pas que les ensembles échoueraient.

**Conséquence.** On ne peut pas chiffrer les 120 étapes maintenant : il faut d'abord prouver que **les ensembles de 4** (et les gemmes) créent l'alternance que le kit seul ne crée pas, avec des effets assez lourds face aux mécaniques (§5). La bonne nouvelle : l'outil de mesure existe, et il dira objectivement quand c'est atteint.

### 3.2 Groupes de 1 à 4 : quelle mise à l'échelle

**Méthode.** `sim combat-groups` : six compositions (duo, trio, 4 dégâts, 4 contrôles, 4 soutiens, mixte), plans conseillés, six profils de rencontre, danger ×1 et ×2, trois mises à l'échelle. Rapport : `sim/reports/combat/groupes.md`.

| Mise à l'échelle | Temps du groupe / temps solo de ses membres | Sûreté |
|---|---|---|
| PV × N, cadence inchangée, coups répartis | 0,92 à 1,11 | **Trop sûre** : chacun reçoit N fois moins de coups |
| **PV × N, cadence × N, coups répartis** | **0,90 à 1,06** | **Chaque membre subit la pression du solo.** À ×2, membre le plus bas : 4 dégâts 32 %, 4 contrôles 44 %, 4 soutiens 40 %, **mixte 47 %** |
| PV × N, cadence × N, tout sur le premier | jusqu'à 1,43 | Le premier meurt ; à ×2, aucune composition ne passe le groupe compact. Sans rôle de tank, à écarter |

**Recommandation [Proposé par Claude]** : PV × N, cadence des attaques ordinaires × N, chaque coup ordinaire vise un membre à tour de rôle ; les **phases** (charge, garde, soin) ne se multiplient pas, une charge frappe un seul membre ; une aura ou une érosion touche chacun. Résultat : **autant de récompenses par participant et par heure qu'en solo**, jusqu'à ~10 % d'avance de synergie, et une composition complémentaire plus sûre. C'est exactement l'objectif du dossier (§9), mesuré.

### 3.3 Donjon : la récupération entre les salles décide de tout

**Méthode.** `sim combat-dungeon` : la Fonderie en prototype (groupe compact → cible durable → charge → groupe compact → gardes → soin ennemi), PV gardés d'une salle à l'autre, 15 s de repos qui rendent une part des PV maximum, et les **consommables du dossier** (§21) préparés avant le départ : potion de secours bue automatiquement sous 35 % des PV, qui rend 8 % des PV maximum, une toutes les 90 s, stock pour tout le parcours ; repas de combat +3 % de PV maximum. Rapport : `sim/reports/combat/donjon.md` (toutes les combinaisons, une ligne par parcours dans `donjon.json`).

Voies (sur 9) qui terminent au moins 90 % des parcours :

| Repos · danger | Sans consommable | 3 potions + repas | 6 potions + repas |
|---|---|---|---|
| 20 % · ×1 | 2 (Meneur, Glyphiste) | 4 | 5 (Tue-Bête : 0 %) |
| **30 % · ×1** | 5 | **9** | 9 |
| 40 % · ×1 | 9 | 9 | 9 |
| 40 % · ×1,25 | 3 | 8 (sauf Tue-Bête) | 8 |
| 50 % · ×1,5 | 1 | 4 | 7 |

**Lecture.**
- **À 20 %, même avec 6 potions, 4 voies sur 9 échouent** : trop dur pour une difficulté normale. Ce serait une obligation de soutien, contraire au dossier.
- **À 30 %, la préparation devient décisive** : sans rien, les DPS et le Piégeur échouent souvent (Trempe-Rouge 75 %, Piégeur 42 %, Tue-Bête 0 %) ; avec 3 potions et un repas, **toutes les voies passent**.
- **Le soutien a enfin une niche mesurable : il économise ses consommables.** À 30 % avec 3 potions, Meneur de meute et Glyphiste n'en boivent aucune, le Sigillaire moins d'une, un DPS ses trois. Le soutien coûte moins cher à faire tourner ; un DPS va plus vite mais consomme. C'est aussi un **débouché régulier pour la Cuisine et l'Alchimie**.
- Le prototype dure ~6 min pour six salles : les 12 à 20 min annoncés demanderont des salles 2 à 3 fois plus longues, à mesurer avant de figer les chiffres.

**Recommandation [Proposé par Claude]** : **30 % de PV rendus entre deux salles, au danger normal**, en comptant sur la préparation (repas, potions) ; la profondeur peut ensuite réduire ce repos ou durcir les salles. Ces chiffres sont à recalibrer quand les salles réelles et les statistiques d'équipement existeront.

### 3.4 Le soutien en groupe, et la faille des groupes sans dégâts

**Méthode.** `sim combat-dungeon-party` : la même Fonderie jouée à 4 (et un DPS seul pour comparer), ennemis à l'échelle du groupe (§3.2), PV gardés par membre, un membre tombé revenant à 50 % après une salle gagnée. Le moteur compte désormais à part l'aide apportée **aux alliés** (soins utiles, absorbé, atténué). Rapports : `sim/reports/combat/donjon-groupe*.md`.

**1. Le soutien n'aidait presque pas ses alliés, à cause de son plan.** Avec les plans conseillés actuels, toute l'aide aux alliés ne couvre que 15 à 17 % des dégâts reçus par l'équipe ; un Glyphiste aide ~1 500 PV sur un parcours où l'équipe en perd 17 000. Raison : **les plans conseillés du Glyphiste et du Rémouleur ne contiennent aucun soin** (ils ont été trouvés pour la vitesse en solo). Avec un **plan de groupe** (proposition `soutien-groupe` : soins, protections et purification de la voie), le Glyphiste aide ~6 700 PV et l'aide couvre **51 % des dégâts avec un soutien, 76 % avec deux**.

| Repos 30 %, sans consommable | ×1 | ×1,5 (dégâts seuls) |
|---|---|---|
| 4 dégâts | 100 % | 0 % |
| 3 dégâts + contrôle | 100 % | 0 % |
| 2 dégâts + 2 contrôles | 100 % | 67 % |
| **2 dégâts + soutien + contrôle** (plans de groupe) | 100 % | **100 %** |
| **2 dégâts + 2 soutiens** (plans de groupe) | 100 % | **100 %** (0 % avec les plans conseillés) |

Multiplier aussi les soins et protections (« Puissance de soutien » × 1,5 à × 2,5) rend les groupes avec soutien presque intouchables (aide de 91 à 159 % des dégâts) : **inutile**, le plan suffit. Et doubler les boucliers en gaspille la moitié : avec des coups répartis entre quatre membres, un bouclier de 6 s posé sur un seul allié expire souvent sans servir.

**2. Faille : le groupe sans dégâts.** Avec les plans de groupe, « 2 soutiens + 2 contrôles » passait même le danger ×2, qu'aucun groupe avec des DPS ne passe ; « 4 soutiens » aussi, en prenant 50 % de temps en plus. En jeu idle, rien ne presse : un tel groupe franchirait tous les murs. Deux corrections, mesurées ensemble (proposition `soutien-groupe-fureur`, rapport `donjon-groupe-soutien-groupe-fureur-pente.md`) :
- la difficulté fait monter **les PV et les dégâts** ensemble (PV × danger^1,5, la pente du dossier), au lieu des seuls dégâts ;
- une **fureur** par salle : passé 1,1 fois le temps d'un groupe équilibré à cette profondeur, +10 % de dégâts ennemis par seconde.

| Danger ×1,25 (pente du dossier, fureur), repos 30 % | Sans consommable | 3 potions + repas |
|---|---|---|
| 4 dégâts · 3 dégâts + contrôle · 2 dégâts + 2 contrôles | 0 % | 0 % |
| 2 dégâts + soutien + contrôle · 2 dégâts + 2 soutiens | **100 %** | **100 %** |
| 2 soutiens + 2 contrôles | 100 % (20 % plus lent) | 100 % |
| 4 soutiens | 25 % | 83 % |
| Toutes compositions à ×1,5 | 0 % : le mur demande niveau et équipement | 0 % |

**Lecture.** C'est l'ordre que Louis attendait : un DPS seul est le plus fragile, la composition complète (dégâts, soutien, contrôle) franchit ce que les groupes de dégâts ne franchissent pas, et un groupe sans dégâts ne dépasse plus un groupe équilibré ; il reste viable mais plus lent, donc moins récompensé à l'heure.

### 3.5 Les ensembles de 4 : ce que mesure le banc du dossier

Louis se souvenait que les zones devaient jouer sur les **ensembles de 4**. Le dossier ne les relie pas : ses douze zones décrivent une réponse DPS, une réponse contrôle et une réponse soutien, et un « rôle favorisé », sans ensemble ni gemme. Le premier dossier avait en revanche essayé **toutes les paires d'ensembles 4+4** (2 457 assemblages, `recherche-assemblages.json`), avec les règles que notre moteur reproduit à 0,5 % près :
- le meilleur couple change bien selon le profil de rencontre (23 plans sur 27) ;
- **mais l'écart est faible** : la paire médiane n'est que **5,7 %** plus lente que la meilleure (13 % au pire), et les PV ne varient que de quelques points ;
- **un même ensemble revient partout** : la Vigie figure dans la paire la mieux classée par le criblage du dossier pour 8 voies sur 9, quel que soit le rôle (4 sur 9 si l'on classe par temps moyen sur les six profils).

Telles que chiffrées, les paires d'ensembles ne peuvent donc pas faire alterner les murs : elles pèsent autant que les passifs de voie, et un ensemble générique (la Vigie) convient presque partout. Pour que des ensembles le fassent, il faudrait des **ensembles de situation** à effet fort contre une mécanique précise (par exemple : la prochaine attaque chargée réduite de moitié ; les gardes subissent le double ; dégâts accrus contre les renforts ; plus de PV rendus au repos de donjon), comme `monde.md` le prévoyait pour les ensembles d'événement, et pas des bonus génériques.

## 4. Corrigé dans le jeu à l'occasion

- **Taxe du marché** (`engine/market.ts`) : arrondie au plus proche au lieu du supérieur. Elle vaut 5 % en moyenne même sur les petits lots, le vendeur ne reçoit jamais plus que le prix (aucun or créé). Test mis à jour.
- **Noms de modèles** (`data/gear.yaml`, `docs/design/catalogue/data.mjs`, `ITEMS.md`, `catalogue.html/json`) : *La Rancune* → *Le Marteau des griefs*, *Le Dernier Mot* → *Rondache du Dernier Carré*, *Murmure-d'épine* → *Arc des Ronceraies*, *Les Sœurs silencieuses* → *Les Jumelles muettes*, *Le Livre des ratures* → *Le Recueil des brouillons*. Les identifiants ne changent pas (exemplaires existants intacts) ; les noms restent libres pour les futurs nommés.

## 5. Le chantier qui conditionne le PvE : des ensembles qui comptent

Proposition **[Proposé par Claude]**, à faire avant de chiffrer la route solo. Le levier est celui de Louis : **les zones font alterner les ensembles de 4 (et les gemmes), pas les voies**. Le joueur bloqué à un mur farme ou fait fabriquer un autre ensemble, puis repasse à l'ancien deux zones plus loin.

1. **Porter dans le moteur quatre à six ensembles et quelques gemmes majeures** du dossier « Le cœur du jeu » (leurs effets sont déjà écrits et étaient exécutés par le banc Python), avec des statistiques réelles d'équipement.
2. **Rejouer les douze zones** avec `sim combat-search` étendu aux choix d'ensemble : pour chaque voie, chaque zone, quel ensemble franchit le plus haut ?
3. **Critère d'acceptation mesurable** : dans au moins la moitié des zones, l'ensemble le mieux adapté dépasse le moins bon d'**au moins un cran** pour une même voie ; **chaque ensemble est le meilleur dans au moins deux zones** ; aucune voie ne reste sous ×1,5 dans une zone avec son meilleur ensemble ; le DPS reste le plus rapide de sa classe dans la majorité des zones.
4. **Point de vigilance mesuré (§3.5)** : les effets d'ensemble du dossier valent environ 0,2 à 0,5 P ; son propre banc donne ~6 % d'écart entre paires, et un ensemble générique (la Vigie) revient presque partout. Il faut des **ensembles de situation**, forts contre une mécanique précise, pas des bonus génériques. Il faudra probablement des effets plus lourds face aux mécaniques (protections en part des PV, Pression forte, dégâts de zone qui tuent les renforts). Et ne pas monter les protections partout : une protection plus forte rend aussi le **Glyphiste plus rapide** (son Encre convertit l'absorbé en dégâts).
5. **Plans conseillés selon le contexte** : le plan conseillé d'un soutien doit être un plan de groupe en groupe, un plan de vitesse en solo (§3.4). Même logique pour la route solo : le plan conseillé d'une zone dépend de sa mécanique.
6. **Traqueur** : revoir sa survie de classe (Repli couvert, Garde de meute) ; c'est la classe la plus fragile partout, en zones comme en donjon.
7. **Difficulté** : faire monter PV et dégâts ensemble, avec une fureur par rencontre, pour que la sûreté seule ne franchisse pas les murs (§3.4).
8. **Ensuite seulement**, chiffrer la pente des 120 étapes avec la vraie courbe d'équipement.

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
| Donjons de 6 salles, 1 à 4, sans quota | **Adopter avec corrections** | Repos à **30 %** avec une préparation (pas 20 %) ; mise à l'échelle de groupe du §3.2 ; difficulté qui monte PV et dégâts, **fureur** par salle ; plans de groupe conseillés aux soutiens (§3.4) |
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
| **5a** | **Statistiques réelles** : l'équipement porté nourrit P, PV, Défense, Cadence, Critique (rendements décroissants) | Courbe niveau + équipement cohérente |
| **5b** | **Ensembles et gemmes dans le moteur** (§5) et survie du Traqueur, mesurés sur les douze zones | Critère du §5 atteint |
| **6a** | **Une boucle d'objets complète** : une douzaine de classiques (Forge et Menuiserie d'abord, déjà jouables), butin de combat vers les exemplaires, recyclage en poudres, vente à la vitrine | Un objet parcourt toute la boucle : butin ou craft → porté → usé → réparé → vendu ou recyclé |
| **6b** | **Route solo, six premières zones** et leurs checkpoints | Plusieurs plans par voie ; aucun échec causé par un élément requis |
| **6c** | **Fonderie complète** (6 salles, repos 30 %, repas et potions), deux ensembles, trois nommés avec garantie | Rendement ciblé vs parcours vs craft comparé |
| 7 | Tannerie, Couture, Joaillerie, Enchantement minimales (cuir, tissu, bijoux, gemmes) ; reste des zones et régions | Aucun métier « bientôt » requis par un objet annoncé |
| 8 | Escouades de 2 puis 4 ; route saisonnière ; world boss ; Routes franches | Aucun double gain ni double engagement ; non-combattants réellement participants |

## 8. Réponses aux questions de Louis

- **Nommés fabricables ?** Je les laisserais **non fabricables en V1**. Les gemmes sont déjà le talent fabricable : le joaillier vend « le talent que vous voulez ». Le nommé est autre chose, un **trophée** : c'est ce qui donne au combat une raison d'exister face à un artisanat qui fait tout le reste. Ni l'artisan ni le combattant n'en sont privés : il s'échange au marché, se répare et se perfectionne chez un artisan, et la garantie de 20 unités (77 min en moyenne) évite la malchance. Si plus tard un nommé reste introuvable au marché faute de combattants, on pourra ajouter une recette coûteuse à partir d'un **trophée de boss** échangeable, sans changer le reste.
- **20 % de repos en donjon, trop dur ?** Oui, même avec les consommables (§3.3) : avec 6 potions et un repas, 4 voies sur 9 échouent encore. **30 % avec une préparation** est le bon point : sans rien, les DPS échouent souvent ; avec 3 potions et un repas, toutes les voies passent, et le soutien finit sans boire ses potions. Ta remarque change donc la recommandation : de 40 % sans consommable à 30 % avec.
- **Zones et ensembles de 4** : le dossier ne relie pas ses zones aux ensembles (réponses par rôle seulement), et son propre banc montre que ses paires d'ensembles ne changent le résultat que de ~6 %, et un ensemble générique revient presque partout (§3.5). À dire au dossier : « ni le kit ni les ensembles tels que chiffrés ne font alterner les murs ; il faut des ensembles de situation forts contre une mécanique, et des zones conçues autour d'eux ».
- **Soutien en groupe** (seconde question de Louis) : le kit n'était pas en cause d'abord, ce sont les plans conseillés, faits pour la vitesse en solo. Avec un plan de groupe, le soutien couvre la moitié des dégâts de son équipe, et la composition complète franchit ce que les groupes de dégâts ne franchissent pas (§3.4).
- **Métaux** : **la version du dossier**. Argent et or n'ont pas de sens comme armures ; ils font une vraie filière à la Joaillerie (bijoux, sceptres), ce que `metiers.md` prévoyait déjà. La Forge garde un métal par palier (bronze, fer, acier, acier trempé, mithril, mithril renforcé, orichalque, azurite, sombracier, astralite), le Minage garde un nouveau minerai tous les 10 niveaux, et la Joaillerie n'est pas obligée d'acheter le métal de la Forge. Seul coût : « acier trempé » et « mithril renforcé » sont des variantes, moins dépaysantes qu'un métal neuf.

## 9. Principe de Louis : aucune composition imposée [Décidé par Louis, 22 octobre]

> « Les groupes ne doivent jamais être fixes. On ne doit pas imposer aux gens de jouer une composition en particulier. La difficulté surmontée par un bon build procure tout le plaisir d'un jeu. Il faut trouver la bonne balance. »

**Traduction mesurable [Proposé par Claude]**, à vérifier à chaque changement de contenu avec `sim combat-dungeon-party` et `sim combat-gear-gap` :
1. **Au danger de référence d'un contenu**, toute composition de 1 à 4 (et chaque voie seule, avec une préparation ordinaire) réussit au moins 90 % des parcours.
2. **Au mur suivant**, la complémentarité (dégâts, soutien, contrôle) fait passer plus tôt, mais **au plus un palier d'équipement d'avance** : une composition « mono-rôle » franchit le même mur avec environ +10 % de statistiques, ou un meilleur build.
3. **Aucune composition ne vaut beaucoup plus à l'heure** : les plus sûres sont plus lentes, donc moins récompensées par heure ; les plus rapides sont plus fragiles.
4. **Un groupe sans dégâts ne franchit pas plus haut qu'un groupe équilibré** (la difficulté monte PV et dégâts ensemble ; fureur par rencontre).

**Mesure actuelle** (Fonderie prototype, danger ×1,25 en pente du dossier, fureur, repos 30 %, 3 potions + repas ; `sim/reports/combat/ecart-equipement.md`) :

| Composition | Équipement de référence | +5 % | +10 % | +15 % |
|---|---|---|---|---|
| 4 dégâts | 0 % | 0 % | 0 % | 100 % |
| 3 dégâts + contrôle · 2 dégâts + 2 contrôles | 0 % | 100 % | 100 % | 100 % |
| 2 dégâts + soutien + contrôle · 2 dégâts + 2 soutiens · 2 soutiens + 2 contrôles | 100 % | 100 % | 100 % | 100 % |
| 4 soutiens | 83 % | 100 % | 100 % | 100 % |

Les quatre critères sont tenus sur ce prototype : la complémentarité vaut un demi-palier d'équipement (un palier et demi pour un groupe entièrement DPS), et toutes les compositions passent avec un peu d'équipement. À revérifier avec les vraies salles et les vraies statistiques d'équipement.

**Ajouté au jeu** : les plans de groupe des soutiens (`data/combat/plans.yaml`, `<voie>_group`) et un plan conseillé selon le contexte (`advisedPlan(…, 'group')`, `CombatView.advisedGroupPlan`) : en solo le plus rapide, en groupe celui qui aide les alliés.

## 10. Message pour GPT

Le texte à lui transmettre pour qu'il revoie les zones et le PvE solo : [`message-gpt.md`](message-gpt.md).
