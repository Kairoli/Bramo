# Combat, classes, équipement et builds

> **Statut** : conception du 21 octobre 2026, issue du travail avec ChatGPT et de la relecture de Louis. Chaque point est marqué **[Décidé par Louis]**, **[Proposé par Claude]** (à valider) ou **[Ouvert]**. Les exemples d'objets, de sets, de gemmes et leurs chiffres illustrent des mécaniques ; ils ne forment **pas** un catalogue. Remplace [`items.md`](items.md) §2 à §4 pour tout ce qui touche à l'équipement, la qualité et les ensembles.

## 0. Décisions de Louis (21 octobre)

1. **Chef-d'œuvre** : un objet spécial, rare, **signé par un artisan**, par exemple un jet maximal sur la ligne variable : « Épique **Chef-d'œuvre** Tunique de l'Aube » au lieu de « Épique Tunique de l'Aube ». Il remplace l'ancienne qualité Normale / Supérieure / Rare / Chef-d'œuvre, qui disparaît.
2. **Les talents viennent des gemmes**, fabricables par les joailliers, achetables, et dropables. Plus c'est fort, plus c'est cher ou difficile. Les gemmes sont **la pierre angulaire des builds** : des talents qui peuvent construire un build complet autour d'eux, dans l'esprit de *The Division 2* (« on peut littéralement tout faire »).
3. **La tenue complète est modifiable** : l'apparence se choisit emplacement par emplacement, avec n'importe quel objet de la bonne catégorie, pour la personnalité.
4. **L'équipement s'use** (durabilité jamais réduite au maximum, réparation qui rend tout).
5. **Emplacements à la Dofus** : coiffe, cape, bottes, ceinture, bijoux (anneaux, collier). Détail au §4.
6. **Validés** : le niveau par classe, les raretés sans talent intrinsèque, les ensembles à 2 / 3 / 4 pièces, l'abandon des qualités statistiques.
6 ter. **Validés par Louis (21 octobre, suite)** : le **Terrain d'entraînement** (§2.4), l'**éveil** au niveau 75 (§2.2) et tout le §2 tel qu'écrit. Question soulevée : **les événements et boss mondiaux**, où des non-combattants ne pourraient pas se battre : réponse au §3.3.
6 bis. **Précisions de Louis (21 octobre, suite)** : les **voies sont la spécialisation** (dégâts, contrôle, soutien) ; le **style** vient du build et des sorts choisis ; **l'XP de classe ne monte pas en faisant les métiers**, seulement au combat.
7. **Chasse** : un métier de récolte comme les autres, **sans combat**.
8. **Triangle mêlée > tir > magie** : abandonné pour les monstres (réservé à un éventuel PvP).
9. **Recaler les recettes** sur l'échelle des paliers (1, 10, 20… 90) : fait dans ce chantier (§9).

## 1. Liberté de progression [Décidé par Louis]

Chaque joueur choisit son activité principale et peut en changer à tout moment : **combat**, **récolte**, **artisanat** (équiper les combattants de son clan), ou un mélange. Chaque profil a ses objectifs, ses équipements et ses récompenses :

| Profil | Ce qu'il cherche | Ce qui l'attend |
|---|---|---|
| Combattant | Donjons, boss, régions, ensembles, builds | Équipement fini en butin, composants, plans, gemmes |
| Récolteur | Rendement, économie de matériaux, trouvailles | Équipement de métier (outils, tenues de récolte), gemmes de métier |
| Artisan | Séries, signature, chefs-d'œuvre | Plans, composants, commandes, reforge ; équipe les combattants sans jamais combattre |

**Les objets, composants, plans et gemmes circulent par le marché et les commandes.** Un artisan n'a jamais à finir un donjon, un combattant n'a jamais à monter un métier.

## 2. Niveau de classe

### 2.1 Un niveau par classe, gagné au combat [Décidé par Louis]
- Chaque classe (Forgefeu, Traqueur, Runiste ; Artificier et Alchimiste plus tard) a **son propre niveau**, de 1 à 99.
- **L'XP de classe vient du combat, et seulement du combat.** Faire ses métiers ne fait **pas** monter la classe (décision du 21 octobre, qui corrige le récapitulatif ChatGPT : « toutes les activités productives donnent de l'XP à la classe »). Les métiers donnent l'XP des métiers, le combat celle de la classe.
- **Changer de classe conserve** les niveaux de toutes les classes, les métiers, le sac et les possessions. Gratuit, à tout moment.
- Les **trois voies** d'une classe partagent son niveau. **Pas de progression par type d'arme.**

### 2.2 Les voies sont la spécialisation [Décidé par Louis]
Les trois **voies** (**dégâts**, **contrôle**, **soutien**) *sont* la spécialisation de la classe : il n'y a pas de « spécialisation » en plus. Elles se choisissent au **niveau 30** et se changent gratuitement en ville. Le **style** de jeu à l'intérieur d'une voie ne vient pas d'un autre palier de choix : il vient du **build et des sorts choisis** (compétences du plan, équipement, gemmes, ensemble). L'ancienne « doctrine » du niveau 60 que j'avais proposée est **retirée**.

| Niveau de classe | Ce que ça donne |
|---|---|
| 1 à 29 | **Base** : une attaque de base et un répertoire de sorts qui s'élargit (un nouveau sort tous les 5 niveaux), à placer dans un **plan de combat** à quatre emplacements. |
| 30 | **Voie** : un passif de voie, deux sorts propres à la voie, un emplacement de sort en plus. |
| 75 | **Éveil** [Validé par Louis] : un dernier sort, l'**ultime** de la classe, qui entre dans le plan avec sa condition de lancement. Si Louis préfère, l'éveil disparaît et tous les sorts se débloquent avec le niveau. |

**Le plan de combat** est ce que le joueur prépare : l'ordre de priorité de ses sorts, leurs conditions, les réponses aux situations (un protecteur à garder pour la phase dangereuse, une interruption quand la cible charge). Chaque classe et chaque voie ont un **plan par défaut utilisable** ; aucune intervention manuelle n'est jamais requise.

### 2.3 Combien d'XP de classe [Proposé par Claude]
- **Au temps de combat effectif** : `XP de classe par heure de combat = R(niveau de la classe)`, la courbe des métiers (`R(L) = 400 × 2^((L−1)/55)`), sur la courbe d'XP RuneScape. Une classe monte au rythme d'un métier.
- **Rattrapage** : une classe plus basse que la plus haute des classes du joueur gagne **+50 % d'XP de classe** tant qu'elle n'a pas atteint 80 % du niveau de la plus haute. Changer de classe ne coûte pas des mois.
- Le hors ligne suit la règle générale (100 % pendant 16 h d'autonomie) ; aucun gain par une action instantanée (recyclage, vente, remise de commande).

### 2.4 Pour celles et ceux qui ne veulent pas combattre [Validé par Louis]
La classe ne doit être **ni une obligation ni un goulot** pour eux :
- **Rien de ce qui concerne les métiers ne dépend du niveau de classe.** Outils, tenues de métier et gemmes de métier se débloquent avec le **niveau du métier** ; l'affinité de la classe avec son métier lié (+5 % au plus) dépend du **niveau du métier**, pas de celui de la classe. Le rang du maître, les clans, le marché, les chefs-d'œuvre et les commandes non plus.
- La classe sert alors d'**identité** (pose, tenue de départ, nom) et de petit bonus de métier. On peut la choisir pour son style et ne jamais combattre.
- **L'artisan** équipe les combattants (armes, armures, gemmes, reforges) sans jamais avoir besoin d'un niveau de classe : l'équipement de combat n'exige un niveau de classe que de **celui qui le porte**.
- **Option « Terrain d'entraînement »** : une activité automatique, sans butin ni risque, qui donne de l'XP de classe à **40 %** du rythme du combat, jusqu'au niveau de classe **40**. Elle sert à ceux qui veulent porter de l'équipement de palier moyen ou essayer un build sans affronter de vraies rencontres. Au-delà, il faut de vraies rencontres. Validé par Louis.

## 3. Combat entièrement automatique [Décidé par Louis]

- **La préparation est le jeu** : classe, voie, doctrine, plan, équipement, gemmes. Aucune mécanique n'exige un clic pendant le combat (pas d'esquive au bon moment, pas d'interruption cliquée, pas de changement urgent d'équipement).
- Les mécaniques de boss sont **résolues par le build et le plan** : interrompre une attaque chargée selon une priorité, garder une protection pour une phase dangereuse, répondre aux soins ennemis, gérer des renforts ou plusieurs cibles. **Chaque boss important accepte plusieurs réponses viables.**
- **Les rencontres valorisent des qualités différentes** : cible unique, groupes, contrôle, protections, dégâts prolongés, combat court ou endurance. Si toute rencontre ne récompensait que les dégâts immédiats sur une cible, les mêmes builds finiraient par dominer.
- **Aucune mort punitive** (« on ne punit jamais l'absent ») : un échec fait perdre le temps et un peu d'usure, rien d'autre.

### 3.1 Cadre technique [Proposé par Claude]
- Un combat est une **simulation à pas fixes** (1 pas par seconde de jeu), déterministe pour une graine donnée, résolue **côté serveur** (le client n'affiche que le journal et un résumé).
- **Hors ligne** : on ne simule pas des milliers de combats. On simule un petit échantillon (par exemple 20 combats) par couple (build, rencontre) pour estimer taux de victoire, durée et gains, puis on **extrapole** sur la durée d'autonomie. L'estimation est mise en cache tant que le build ne change pas.
- **Statistiques** : Vitalité (PV), Défense (réduction), Puissance, Cadence, Critique, Dégâts critiques, Ténacité (durée des statuts subis), Pénétration. Trois types de dégâts (Physique, Feu, Foudre, plus Givre) pour que les résistances des ennemis diversifient les builds.
- **Statuts** (mots-clés partagés par les gemmes, les ensembles et les compétences) : Brûlure, Saignement, Marque, Ralentissement, Étourdissement, Vulnérabilité, Bouclier, Régénération, Charge.

### 3.3 Événements et boss mondiaux : tout le monde y participe [Proposé par Claude, à valider]

**Règle** : un événement ne doit jamais être fermé à celles et ceux qui ne veulent pas combattre. Chaque événement ou boss mondial a **au moins trois canaux de contribution**, et **le meilleur palier de récompense est atteignable par chacun**.

Le boss mondial (le gardien d'un événement, [`monde.md`](monde.md) §2) a une **réserve de PV commune**, proportionnelle au nombre de joueurs actifs, et une durée de quelques jours. Les contributions s'additionnent pour tout le serveur (ou pour un clan, selon l'événement).

| Canal | Qui | Comment il agit sur le boss |
|---|---|---|
| **Combat** | Combattants | Leurs dégâts automatiques retirent des PV au boss. Ils sont limités par un plafond quotidien d'apport pour que la contribution reste casu (aucune course). |
| **Ravitaillement** | Artisans | Ils fabriquent des **consommables et des machines d'événement** (balistes et pièges de la Forge, banquets de la Cuisine, flasques de l'Alchimie, runes de l'Enchantement, flèches, potions). Chacun remis au **point de ravitaillement** soit inflige des dégâts à distance, soit **renforce tous les combattants** pour un temps (ça compte comme contribution). |
| **Récolte** | Récolteurs | Ils rapportent les **ressources de la région d'événement** (minerais givrés, herbes de brume, poissons de la marée…) qui alimentent les artisans, ou qui font avancer un chantier commun du camp (barricades, tour de guet : bâtiments d'événement). |
| **Logistique** | Tout le monde | Les commandes d'événement (type commandes PNJ : un lot d'objets contre des jetons), le transport, l'entretien du camp. |

**Récompenses** :
- Un **score de contribution normalisé par canal** : le meilleur apport possible d'un combattant et celui d'un artisan ou d'un récolteur donnent **le même palier** de récompense. Personne n'est classé au sacrifice d'un autre canal.
- **Pour tous** : jetons d'événement, titre ou cosmétique d'événement, objets d'ambiance. **Selon le canal** : butin de combat (pièces, plans, gemmes) pour les combattants ; plans et composants rares pour les artisans ; ressources et collections pour les récolteurs.
- Ensembles d'événement : **jamais de bonus exclusif indispensable** ; leurs pièces se fabriquent et s'échangent, donc un non-combattant peut les produire et les vendre.

**Conséquences de conception** : un événement contient donc toujours **un contenu de combat**, **des recettes**, **des ressources** et **des commandes**. Le simulateur vérifiera que, sur un serveur simulé, chaque profil (combattant, artisan, récolteur) peut atteindre le palier maximal avec un temps de jeu comparable.

### 3.2 Contenu de combat
- **Régions** (ressources, ennemis, composants, collections, contraintes propres) et **donjons** (suite de rencontres avec un boss), dans l'esprit des zones des métiers.
- **Événements récurrents** : régions transformées, rencontres, composants, collections et équipements thématiques, **en rerun**, sans réinitialiser la progression ([`monde.md`](monde.md) §2).
- « Expéditions » n'est **pas** un système de combat distinct (le mot reste réservé à l'Exploration et aux expéditions de clan) ; les épreuves de combat ne sont pas retenues.

## 4. Emplacements [Décidé par Louis, détail proposé par Claude]

« Prends un peu comme sur Dofus. » Proposition :

| Catégorie | Emplacements | Remarques |
|---|---|---|
| Vêtements | **Coiffe, Torse, Gants, Jambes, Bottes, Cape, Ceinture** (7) | Quatre grandes familles : métal (mêlée), cuir (tir), tissu (magie), plus des pièces universelles ; une même robe ou un même plastron peut servir plusieurs voies. |
| Bijoux | **Collier, Anneau 1, Anneau 2** (3) | Largement universels (Joaillerie). |
| Arme | **Arme** (1) | Catégories d'armes par classe, à fixer (§5.4). |
| Utilitaires | **Outil, Repas** | Déjà dans le jeu. |
| Apparence seule | **Épaulières** | Pas de statistiques : un emplacement purement cosmétique (Couture, événements). |

Dix emplacements de statistiques en combat (sept vêtements, trois bijoux) plus l'arme : onze au total. Les ensembles de 2, 3 et 4 pièces se répartissent sur les sept vêtements.

## 5. Objets

### 5.1 Structure d'un objet [Décidé par Louis, validé]
Chaque objet est un **exemplaire unique** (identifiant propre) d'un **modèle**. Le modèle fixe :
- le **niveau requis** (niveau de classe pour le combat, niveau du métier pour les outils et les tenues de métier) ;
- la **rareté** : Commun, Rare, Épique, Légendaire ;
- les **attributs fixes** (dépendent du modèle : tous les plastrons n'ont pas la même orientation défensive) ;
- l'**emplacement de gemme** éventuel, et l'**ensemble** éventuel.

L'exemplaire ajoute :
- **une seule ligne variable**, tirée dans une petite liste compatible avec l'objet, avec une valeur variable entre un minimum et un plafond ;
- l'**usure** (§5.6), la **gemme** sertie, la **signature** de l'artisan s'il est fabriqué, et le marqueur **Chef-d'œuvre**.

Dans un même emplacement et un même palier, plusieurs modèles **concurrents** : une cuirasse protectrice, un harnais fragile et offensif, une pièce intermédiaire. Le joueur peut sacrifier de la résistance pour de l'attaque.

### 5.2 Raretés [Proposé par Claude]
La rareté ne porte **aucun talent** (les talents sont dans les gemmes). Elle règle :

| Rareté | Budget de statistiques | Attributs fixes | Emplacement de gemme | Pièce d'ensemble |
|---|---|---|---|---|
| Commun | ×1,00 | 1 à 2 | non | non |
| Rare | ×1,05 | 2 | oui, mineur | possible |
| Épique | ×1,10 | 2 à 3 | oui | oui |
| Légendaire | ×1,15 | 3, dont **un attribut fixe conditionnel unique** (ni talent ni statistique brute : « +X % de dégâts contre une cible brûlée ») | oui | oui |

Pas de limite à un légendaire équipé. La rareté appartient au modèle : un objet nommé ne tombe pas tantôt Commun, tantôt Légendaire ; seule sa ligne variable diffère.

### 5.3 Chef-d'œuvre [Décidé par Louis]
Un **Chef-d'œuvre** est un exemplaire **fabriqué** dont la ligne variable est au **jet maximal** (ou très proche), ou un objet exceptionnel signé. Il se reconnaît à son nom (« Épique Chef-d'œuvre Tunique de l'Aube ») et à la signature de l'artisan. La chance d'en fabriquer **dépend de l'écart entre le niveau de l'artisan et celui de la recette**, ce qui garde les artisans de haut niveau demandés. Pas de qualité statistique supplémentaire.

### 5.4 Armes [Ouvert]
Une classe a **deux ou trois catégories d'armes**, qui orientent le style sans imposer de garde-robe : par exemple Forgefeu (marteau lent, épée et bouclier équilibrés), Traqueur (arc long, arbalète), Runiste (bâton, sceptre). À décider avec le catalogue de la tranche verticale.

### 5.5 Paliers d'équipement [Décidé par Louis]
Tous les **dix niveaux** : 1, 10, 20, 30… 90. Un palier ajoute une sélection cohérente d'objets, pas une refonte de chaque catégorie. **Un palier ≈ +10 %** de statistiques, une rareté ≈ +5 %, la ligne variable ±3 % : une pièce Rare du palier précédent vaut un Commun du palier suivant, donc **une pièce bien adaptée reste intéressante**. Le niveau 99 est un accomplissement, sans tenue imposée.

Correspondance avec les ressources : cuivre et étain (1), fer (10), acier (20), argent (30), mithril (40), or (50), orichalque (60), azurite (70), sombracier (80), astralite (90).

### 5.6 Usure, réparation, reforge [Décidé par Louis pour l'usure ; reste proposé]
- **L'équipement s'use** au temps de combat (repères : une armure de palier ≈ 150 h). Usé, il perd ses statistiques mais n'est jamais perdu. Réparation par soi-même, par un artisan ou chez le PNJ. La durabilité maximale ne baisse jamais.
- **Reforge** (par un artisan) : retire la ligne variable et en tire une nouvelle. Le joueur peut **garder l'ancienne ligne** si la nouvelle ne convient pas. Le coût **croît à chaque reforge** du même exemplaire.
- **Perfectionnement** : monter la valeur de la ligne vers son plafond, contre matériaux et or. Pas de montée en +15 ni de rang supplémentaire dans la première version.
- Ce sont des **puits d'or et de matériaux pour tous les joueurs**, clan ou non.
- Pas de conversion d'un objet vers le palier supérieur ni de changement de rareté dans la première version.

## 6. Gemmes et talents : la pierre angulaire des builds [Décidé par Louis, détail proposé]

> « Des talents qui peuvent construire un build complet autour. Pense à *The Division 2* : on peut littéralement tout faire. »

### 6.1 Principe
Une **gemme** porte un **talent** : une règle automatique du type *quand [événement], si [condition], alors [effet]*, avec un délai propre et une limite de cumul. Les gemmes se **sertissent** dans l'équipement, s'**extraient** (matériaux ou service) et se **réutilisent** : on change de pièce sans perdre son effet. Elles sont indépendantes de la classe : **tout talent est utilisable par tout le monde** ; c'est le plan de la classe et le reste du build qui le rendent bon ou mauvais.

### 6.2 Deux sortes de gemmes
| | Emplacements | Rôle |
|---|---|---|
| **Gemmes de talent (majeures)** | Quatre : **Arme, Torse, Coiffe, Collier** | Définissent le build. |
| **Gemmes mineures** | Sur les autres pièces rares et au-delà | Petits ajustements de statistiques ; volume de travail pour les bijoutiers. |
| **Gemmes de métier** | Outils et tenues de récolte et d'artisanat | Trouvailles, économie d'ingrédients, rendement. |

### 6.3 Le langage des talents
- **Déclencheurs** : début de combat, toutes les N secondes, sur coup, sur critique, sur mort d'un ennemi, quand on est touché, quand un bouclier se brise, quand un statut est appliqué ou arrive à terme, quand une compétence est lancée, PV sous un seuil.
- **Conditions** : cible marquée, brûlée, ralentie ou étourdie ; nombre d'ennemis ; PV de la cible ; bouclier actif ; Charges accumulées.
- **Effets** : appliquer ou propager un statut, infliger des dégâts, soigner, protéger, modifier une statistique le temps d'un état, déclencher une attaque secondaire sur une autre cible, convertir un statut en dégâts, accumuler ou dépenser des Charges.
- **Règles contre les boucles** : un talent a un **délai interne** ; un effet déclenché par un talent **ne déclenche pas d'autre talent** (profondeur 1) ; au plus **quatre talents majeurs** actifs ; chaque talent affiche en une phrase ce qu'il fait.

### 6.4 Puissance et obtention : « plus c'est fort, plus c'est cher ou dur »
- La **puissance** d'une gemme suit son **palier** (niveau requis) et son **rang** (Commun à Légendaire : ×1, ×1,15, ×1,3, ×1,5 sur les valeurs, et à partir de Rare une **clause supplémentaire** qui change le talent).
- Sources : **fabrication** par la Joaillerie (plans appris ; les rangs élevés demandent des composants de boss), **achat** au marché, **butin** de rencontres (un talent peut tomber directement).
- Les gemmes sont le premier bien **non lié** : pas besoin de classe, donc elles circulent beaucoup.

### 6.5 Exemples de talents et de builds (illustratifs, pas un catalogue)
| Famille de build | Idée | Talents illustrant la mécanique |
|---|---|---|
| **Brasier** | Brûlures qui se propagent | *Cendre vive* : un coup direct applique Brûlure (délai 3 s) ; *Mort en flammes* : à la mort d'une cible brûlée, la brûlure passe à un ennemi proche |
| **Chasse marquée** | Une cible, des critiques | *Œil du chasseur* : la première attaque marque la cible ; *Dernière empreinte* : les critiques sur cible marquée augmentent les dégâts critiques |
| **Rempart** | Boucliers et ripostes | *Bastion* : un bouclier au début du combat ; *Choc de rappel* : un bouclier brisé étourdit l'attaquant |
| **Conducteur d'orage** | Critiques en chaîne | *Paratonnerre* : un critique frappe une seconde cible à moitié de puissance (délai) ; *Surtension* : accumuler des Charges, puis les dépenser |
| **Givre figé** | Contrôle et sécurité | *Souffle polaire* : ralentit périodiquement la cible la plus dangereuse ; *Glace-miroir* : les ralentis subissent plus |
| **Saigneur** | Dégâts sur la durée | *Plaie ouverte* : un coup applique Saignement cumulable ; *Hémorragie* : convertir les Saignements en dégâts immédiats |
| **Cadence** | Beaucoup de petits coups | *Fièvre de combat* : +Cadence à chaque coup, jusqu'à 5 ; *Rythme* : chaque cinquième coup déclenche un effet |
| **Soutien** | Durer et protéger | *Régénération du veilleur* : soin périodique ; *Sceau* : protège l'allié le plus bas |
| **Métier** | Récolte et artisanat | *Veine franche* : trouvailles et sous-produits ; *Atelier économe* : économie d'ingrédients |

**Objectif de conception** : qu'un joueur puisse bâtir un build entier autour d'**un** talent (ses autres gemmes, l'ensemble, les doctrines et le plan l'épaulent) et que plusieurs de ces builds soient viables dans une même voie.

## 7. Ensembles : 2, 3 et 4 pièces [Décidé par Louis, validé]
- À partir d'un palier (le niveau 20 comme première piste), des **pièces d'ensemble** : bonus à **2**, **3** et **4** pièces. Assemblages possibles : 4+2, 3+3, 2+2+2, ensembles mixtes avec des objets indépendants (sept vêtements).
- « Pièce d'ensemble » est **distinct de la rareté**.
- Le bonus à 4 pièces doit **attirer sans rendre les autres assemblages systématiquement inférieurs** : il sert un type de rencontre (groupes, par exemple) là où le 3 pièces sert un autre (cible unique).
- Les ensembles viennent de **donjons, de fabrication ou d'événements** ; ceux d'événement ne donnent jamais de bonus exclusif indispensable.
- Les ensembles imaginés (Cendres persistantes, L'Enclume patiente, La Dernière empreinte, Ronces vives, L'Orage contenu, Veilleurs du sceau, Veine franche, L'Atelier économe, Givre des cimes) restent des **pistes** pour la tranche verticale.

## 8. Sources, loot et économie [Proposé par Claude]
- **Le butin combine** : équipements finis, composants, plans, gemmes, fragments. **Fragments** : une progression garantie pour les objectifs rares (n fragments = un exemplaire précis).
- Un loot doit pouvoir être : une amélioration immédiate, une pièce manquante, une possibilité de build, un objet pour une autre classe, une vente intéressante ou une apparence.
- **Marché des équipements** : les exemplaires étant uniques, plus d'ordres d'achat appariés. Une **vitrine** filtrée par emplacement, palier, rareté, ensemble, ligne variable et gemme ; achats directs.
- **Équilibre de l'or** : la reforge, le perfectionnement, l'extraction des gemmes et les réparations sont des puits pour **tout le monde**.
- **Équilibre des builds** : un test automatique (le simulateur) cherche les meilleurs builds par type de rencontre et **alerte si un seul domine** (objectif : au moins trois builds à moins de 10 % du meilleur par type de rencontre). L'écart entre un bon et un excellent build reste de l'ordre de **+25 %** de vitesse de victoire.

## 9. Recettes recalées sur les paliers (fait le 21 octobre)

Échelle d'outils : **bronze = palier 1, fer = 10, acier = 20** (au lieu de 5 / 15 / 35 au niveau de Forge). Les fers d'outil, les outils, les lingots d'acier et la réparation par un artisan suivent ces niveaux ; l'XP des recettes est recalculée par `sim calibrate --data --write`. Les paliers suivants (argent, mithril…) s'ajouteront avec leurs métaux.

## 10. Tranche verticale : l'ordre de réalisation [Proposé par Claude]

1. **Moteur d'objets à exemplaires** (identifiant propre, ligne variable, gemme, signature, usure) : préalable de tout, sans dépendance aux chiffres ouverts.
2. **Apparence par emplacement** (remplace la tenue globale), écran d'équipement, **vitrine du marché**.
3. **Catalogue minimal** : paliers 1, 10 et 20 ; sept vêtements + trois bijoux + arme ; deux classes (Forgefeu, Traqueur) ; deux armes par classe.
4. **Gemmes** : le langage de talents (§6.3), une quinzaine de gemmes, Joaillerie jouable.
5. **Combat automatique** : simulateur à pas fixes, plan de combat, quatre rencontres de nature différente (cible unique, groupe, endurance, boss qui se soigne), un donjon.
6. **Ensembles** (un par classe au palier 20), **métiers manquants** utiles (Tannerie, Couture, Chasse minimale), **simulateur de builds**.

## 11. Questions ouvertes
- Les **catégories d'armes** (§5.4) et leur nombre.
- Les **chiffres** : caractéristiques et plafonds, budget exact des raretés, valeur et coût du perfectionnement, taux de butin.
- La **liste exacte des déclencheurs et effets** de gemmes de la première version.
- Le **plan de combat** : interface (liste de priorités simple, ou conditions plus riches).
- La **réserve de PV et le plafond d'apport** des boss mondiaux, la valeur des machines et des consommables d'événement (§3.3).
