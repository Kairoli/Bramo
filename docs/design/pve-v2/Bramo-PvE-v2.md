# Bramo — les zones doivent faire changer les outils

**Révision PvE solo, ensembles et gemmes de situation — 22 octobre 2026.**

Base relue : `Kairoli/Bramo`, `main`, commit `c120336036ae2ee6bff6d9f509ede1d26c892094`. Cette proposition répond au message de Claude et remplace les réponses de zones du précédent dossier. Elle ne remet pas en chantier l’économie, les filières, les escouades, les donjons sans quota ni la branche saisonnière retenus par Louis.

**Statut : proposition livrée en données, pas équilibrage adopté.** Les rencontres utilisent les schémas et le moteur TypeScript du jeu. Les ensembles et gemmes de ce dossier sont des contrats à intégrer ; leurs affinités chiffrées sont des cibles, pas des résultats simulés. Aucun banc Python de combat n’a été utilisé.

## 1. Mon verdict sur les essais de Claude

La critique principale est juste. J’avais donné des noms de réponses — dégâts, soutien, contrôle — à des zones qui ne forçaient pas réellement ces arbitrages dans le moteur. Une compétence de protection trop petite ne devient pas une réponse intéressante simplement parce que le texte conseille de se protéger. Et un ensemble presque aussi bon partout rend le changement de build peu utile.

Il faut donc **partir de la mécanique ennemie et lui relier un outil mesurable**, puis laisser les kits de classe l’exploiter différemment. L’équipement aide une classe à franchir son mur plus tôt ; il ne doit pas donner à toutes les classes le même nouveau moteur de dégâts. Braises, Angle et runes restent natifs, et les effets secondaires ne les redéclenchent pas.

Je retiens les corrections testées : PV et dégâts ennemis montent ensemble ; récupération de donjon à 30 % avec préparation ; vrais plans de groupe pour les soutiens ; affaiblissement réservé au coup lourd ; aucune composition obligatoire. Changer de voie reste une option gratuite dans sa classe, sans exiger d’en remonter une autre.

Trois limites doivent toutefois rester visibles :

1. **Le critère strict du groupe n’est pas entièrement acquis.** `ecart-equipement.md` montre que quatre DPS demandent +15 % de P et PV pour passer le mur, alors que le critère §9 fixe au plus un palier d’environ +10 %. Le résultat est proche du but ; ce n’est pas encore la même chose. On garde+10 % comme cible et on rejoue après les nouveaux outils.
2. **Le « palier à +10 % » est synthétique.** Les essais augmentent P et PV. Les pools d’affixes publiés ont pour multiplicateurs 1 / 1,45 / 1,9 aux paliers 1 / 10 / 20, et leurs statistiques ne sont pas encore branchées dans les combats. Je ne prétends donc pas avoir calé la route sur une vraie courbe d’équipement qui n’existe pas encore dans le moteur.
3. **La difficulté périodique est incomplète dans le code actuel.** L’aura ignore le multiplicateur de danger ; aura et érosion ignorent la fureur. Cela doit être corrigé avant de valider une route profonde, sans leur appliquer deux fois les multiplicateurs.

Les treize rapports JSON pertinents ont été relus par données, échecs inclus ; leurs empreintes et comptes sont dans `verification/sources-et-rapports.json`. Exemple : 2491 échecs parmi 6480 parcours du rapport donjon initial, toutes variantes confondues. Ce chiffre ne décrit pas la seule préparation finalement retenue. Les tableaux de recherche agrègent plusieurs graines par plan : je ne les présente pas comme des journaux individuels.

## 2. Une structure assez petite pour apprendre, assez ouverte pour construire

Je propose **six familles de réponses, chacune présente dans deux zones**, avec trois manières de s’en approcher : ensemble, gemme majeure ou préparation. Le plan complète la réponse. Une même famille garde le même mot-clé partout ; le joueur apprend ce que signifie « Pluie » plutôt que douze exceptions.

| Famille | Bon outil contre | Ensemble | Gemme majeure | Deux zones principales |
|---|---|---|---|---|
| Interstice | Fenêtres fermées | Les Heures creuses | Opale d’interstice |1 et7 |
| Pluie | Érosion qui s’accumule | Les Habits de pluie | Perle de lessive |2 et8 |
| Impact | Lourds et charges | L’Enclume patiente | Hématite d’arrêt |3 et10 |
| Battue | Renforts | Les Passeurs de braise | Grenat de battue |4 et11 |
| Fracture | Garde ennemie | Les Mains de traverse | Œil de faille |5 et9 |
| Reprise | Aura d’usure | Les Veilleurs du Sceau | Ambre de reprise |6 et12 |

**Ce ne sont pas six ensembles réservés aux six zones correspondantes.** Ils restent utilisables dans les donjons, les variantes de boss et les mutations qui partagent ces mots-clés. Leur valeur vient de la mécanique réellement présente, jamais d’un bonus codé « dans la zone5 ». Un futur donjon à renforts réutilise Battue sans nouvelle exception.

Au départ, chaque rencontre a une menace principale et au plus une menace secondaire discrète. Sinon, le joueur ne comprend pas ce qui l’a tué et le catalogue devient une liste de résistances à cocher. Plus tard, une mutation peut associer deux familles, avec des récompenses et un budget de difficulté distincts. La route permanente n’est pas réécrite pendant une saison.

### Un coût de choix réel

- Un ensemble de situation utilise les mêmes emplacements et le même budget de lignes qu’un autre ensemble. Son effet fort n’est pas ajouté gratuitement au meilleur équipement généraliste.
- Une gemme de situation occupe **une majeure existante** ; elle remplace un talent de build ou un talent de nommé. On ne crée pas d’emplacement supplémentaire. Le maximum de majeures décidé ailleurs reste inchangé.
- Set, gemme et préparation de **même famille ne se cumulent pas**. La variante la plus forte s’applique ; leurs délais sont partagés. La gemme donne une autre façon de répondre en conservant son 4+4 habituel, pas un renfort automatique du set adapté.
- Les paliers2/3/4 des nouveaux sets **améliorent un même effet**. Ils remplacent la version précédente. Ce choix proposé évite d’afficher trois déclencheurs supplémentaires par set et de rendre le2+2+2 systématiquement supérieur.
- Le set ne devient pas plus puissant avec la rareté ; la rareté conserve son budget de lignes et de rolls. Les valeurs de gemmes fournies sont une référence Rare à tester : les anciens multiplicateurs de rang ne s’appliquent pas aveuglément aux purges, pourcentages et délais. Une gemme légendaire ne doit jamais produire une immunité permanente par multiplication automatique.

Avec 11 places, deux sets de4 restent possibles. Les huit emplacements proposés par famille sont tête, torse, mains, jambes, pieds, ceinture, collier et anneau ; arme, cape et second anneau laissent de la place à d’autres choix. Aucun set de situation n’exige un type d’arme. Une copie du même modèle ne compte qu’une fois pour le bonus d’ensemble, même avec deux anneaux ; les deux instances gardent leurs statistiques.

Les trois classes utilisent ces familles avec leurs silhouettes et armes habituelles. Un Runiste n’a pas besoin d’un marteau ni un Traqueur d’un heaume lourd pour obtenir Fracture. Le nom d’une famille n’est pas une restriction de classe. Les gemmes n’imposent pas d’élément ; les résistances/faiblesses élémentaires ennemies restent reportées.

## 3. Les effets proposés

Les24 fiches complètes — déclencheur, condition, opération, paramètres, délai, plafond et cumul — sont dans `design/equipements-situation.yaml`. Voici les chiffres nécessaires pour juger le projet sans lire le contrat technique.

| Ensemble |2 pièces |3 pièces, remplace2 |4 pièces, remplace3 |
|---|---|---|---|
| Heures creuses | Stocke20 % des pertes de fenêtre, plafond2 P |35 %, plafond4 P |100 %, plafond12 P ; restitution unique à l’ouverture |
| Habits de pluie | Retire1 charge à partir de2, délai18 s |1 charge, délai12 s |2 charges, délai10 s ; aucune immunité |
| Enclume patiente | Atténue15 % d’un lourd, au plus6 % PV max |25 %, au plus12 % PV max |65 %, au plus25 % PV max ; délai 6 s |
| Passeurs de braise |×1,20 contre les renforts |×1,40 |×1,80 ; aucun bonus contre le chef |
| Mains de traverse |×1,25 contre la garde |×1,50 |×2 contre la garde ; aucun surplus en dégâts PV |
| Veilleurs du Sceau | Récupère25 % de l’aura réellement prise |40 % |75 % ; réserve8 % PV, délai 6 s, soins plafonnés30 % PV/30 s |

`P` désigne la Puissance du personnage ; elle n’est utilisée que pour le stockage offensif. Les défenses sont calculées sur les PV maximum réels de début de combat. À P100/PV2800, le plafond d’Impact4 est700 PV, pas700 à tous les niveaux.

**Pourquoi des effets aussi forts ?** Un cran de danger à×1,25 n’est pas «25 % de dégâts ennemis en plus » : avec PV×danger^1,5, l’ennemi a aussi environ40 % de PV supplémentaires. Sans accélération du combat, l’exposition cumulée peut augmenter d’environ75 %. Un minuscule bonus de5 % ne peut pas fournir le gain demandé. Les gros coefficients sont donc conditionnels et plafonnés ; leur valeur hors mécanique est presque nulle. Ils restent des hypothèses à mesurer.

### Les gemmes, une autre allocation du build

| Gemme | Effet de référence | Coût de choix |
|---|---|---|
| Opale d’interstice | Stocke70 % des pertes de fenêtre, plafond8 P/cycle | Une majeure ; garde ses sets habituels |
| Perle de lessive | Retire2 charges à partir de2, délai16 s | Une majeure ; aucune immunité ni soin |
| Hématite d’arrêt | Atténue50 % du lourd, au plus20 % PV max, délai 6 s | Une majeure ; aucun bénéfice sur coups simples |
| Grenat de battue |×1,55 contre les renforts natifs | Une majeure ; zéro contre un boss isolé |
| Œil de faille |×1,65 contre la garde uniquement | Une majeure ; zéro après sa disparition |
| Ambre de reprise | Récupère45 % de l’aura prise ; réserve5 % PV, délai 8 s, plafond20 % PV/30 s | Une majeure ; ne soigne pas les dégâts d’érosion |

Chaque préparation est une version moins forte, disponible avant le mur. Exemples : Baume de parade, Poudre de coin, Rinçage clair. Une seule préparation utilitaire équipée, en plus du repas et des potions de secours existants. Pas six potions automatiques supplémentaires à surveiller. Les détails sont dans `design/consommables.yaml` ; leurs coûts doivent être calés sur les filières économiques déjà retenues.

### Ce qu’on préserve dans les builds

Un Forgefeu peut garder son moteur de Braises et remplacer une famille de set par Impact. Un Traqueur peut conserver sa Morsure et prendre une Perle de lessive pour les Fossés. Un Runiste peut choisir une Opale et sacrifier un talent offensif plutôt que démonter ses deux ensembles. Ces trois décisions ont des coûts différents ; elles ne donnent pas aux trois classes une attaque identique.

Interstice ne critique pas une seconde fois et ne produit pas de rune. Fracture ne transforme pas une garde cassée en dégâts gratuits sur les PV. Reprise ne nourrit ni Encre ni talent de soin. Battue n’accorde pas un buff cumulable à chaque renfort mort. Ces garde-fous évitent les boucles les plus évidentes ; seuls les tests de paires et de nommés peuvent vérifier les synergies restantes.

## 4. Les douze rencontres et leurs réponses

Le fichier natif est `sim/proposals/zones-v2/combat.yaml`. Les identifiants des douze zones sont conservés, mais leurs mécaniques sont redistribuées. La version de base sert à isoler les réponses sans fureur ; la variante `zones-v2-fury` ajoute des délais issus du groupe de référence et sert de point de départ pour la route. Elles ne doivent pas remplacer silencieusement les rencontres de production.

| Zone | Menace lisible | Outil adapté | Réponse de plan / autre approche |
|---|---|---|---|
|1. Chaussée des lanternes | Cycle14 s, ouverte8–14 ; réduction80 % hors ouverture | Interstice | Premier gros sort vers8 s ; cooldowns qui recoupent l’ouverture ; tonic à la place d’une majeure |
|2. Fossés gris | Érosion toutes les8 s, jusqu’à3 charges | Pluie | Forgefeu : Refroidissement ; Runiste : Sceau de répit ; Traqueur : dégâts soutenus et outil universel |
|3. Cour des trois coups | Une attaque sur3 frappe×6 | Impact | Protection/Repli, affaiblissement réservé au lourd ; ralentissement des attaques ordinaires |
|4. Vergers de verre | Deux renforts à10 s puis à30 s | Battue | Dégâts de zone ; priorité renforts après extension ; course au chef reste possible |
|5. Cloître des balances | Garde750 toutes les12 s, durant9 s | Fracture | Dissipation si disponible, ou dégâts continus ; la garde ne rend pas invulnérable |
|6. Fours de recuit | Aura23 PV/s et petits coups | Reprise | Purification si disponible, soin régulier ou course au chef ; infusion utilitaire |
|7. Salle des échos | Cycle18 s, ouverte11–18 ; réduction85 % hors ouverture | Interstice | Ouverture programmée au plus10 s, puis cooldowns ; aucune première utilisation à11 s autorisée |
|8. Gué des plaies | Érosion plus rapide, petite charge toutes les22 s | Pluie | Purge si disponible, sinon dégâts soutenus ; défense pour la charge séparément |
|9. Chambre aux deux sceaux | Deux ennemis, garde alternée toutes les10 s | Fracture | Dégâts de zone, dissipation si disponible ; priorité sans garde après extension |
|10. Terrasses de la vigie | Charge760 toutes les16 s, petits coups entre deux | Impact | Protection/repli et affaiblissement sur charge ; le ralentissement ne retarde pas la charge |
|11. Atelier des mauvais jours | Auxiliaire qui permet trois soins ennemis au maximum | Battue | Zone + anti-soin ; priorité auxiliaire après extension ; course au chef sans détour possible |
|12. Belvédère des trois vents | Aura25 PV/s, petite charge toutes les20 s | Reprise | Soin/purification selon répertoire, défense simple contre la petite charge |

Les dégâts présentés sont les valeurs de données **avant** les règles de réduction qui s’appliquent à leur source. Aura et érosion gardent leur traitement périodique propre. Les horaires des fenêtres reprennent exactement la convention du moteur : l’ouverture est à la fin du cycle, pas au début.

### Une précision sur les sorts disponibles

Je ne donne pas à toutes les classes une purification fictive. Forgefeu et Runiste en ont une commune au niveau20. Le Traqueur n’en a une commune qu’au niveau85 (`tr_cover`) ; le Meneur de meute en a une de voie au70. Avant cela, le Traqueur répond à l’érosion par l’équipement universel, la préparation et la vitesse de mise à mort. Changer de voie peut aider, jamais devenir un péage.

Même prudence pour la dissipation : Cercle révélateur est commun au Runiste au35, Décrassage au Forgefeu au65 ; le Traqueur n’a pas de dissipation native commune. Fracture couvre ce manque sans effacer les différences de kits.

Les horaires d’ouverture du tableau sont des points de départ, **pas des rotations optimales certifiées**. Cadence, GCD, ordre et cooldowns font dériver la suite ; le moteur doit rechercher de vrais plans limités à10 s d’ouverture, puis jouer normalement. Aucun script « attendre chaque fenêtre » ni interrupteur automatique de classe n’est ajouté.

## 5. Obtention : ne jamais enfermer l’outil derrière son propre mur

Chaque famille est reliée à ses deux régions sources. Son premier patron ou une préparation d’entrée est accessible par une **commande de préparation avant la zone**, avec des ressources ordinaires du palier. Le joueur peut récolter, fabriquer, faire une commande ou acheter : ni boss obligatoire pour l’artisan, ni métier obligatoire pour le combattant.

Les régions donnent ensuite composants thématiques, exemplaires finis, rolls plus intéressants et qualité. Le patron de maîtrise peut demander du contenu de la région ; **le premier outil fonctionnel ne le demande pas**. Un marché vide ne doit pas empêcher le premier joueur de fabriquer sa réponse.

Les ensembles d’armure passent par Forge/Couture et les bijoux/gemmes par Joaillerie. Les recettes de famille réutilisent les patrons de recettes du précédent dossier ; je ne crée pas une deuxième économie ni48 nouvelles matières exclusives. Deux régions peuvent fournir une même catégorie de composant avec des variantes de rendement. Argent et or restent à la Joaillerie. Les nommés restent non fabricables en V1 : butin, garantie et marché.

Les effets sont séparés des modèles visuels et des matériaux. Bronze, fer ou acier restent des bases de palier ; le trait d’ensemble ne requiert pas de dessiner une nouvelle banque par élément. Six noms d’objets par famille sont fournis comme pistes sérieuses ou légèrement amusantes, pas comme un nouveau pool fermé.

### Migration des anciens ensembles

**Ne pas additionner ce catalogue à tous les anciens effets portant le même nom.** Les versions proposées d’Enclume patiente, Passeurs de braise, Mains de traverse, Heures creuses et Veilleurs remplacent leurs anciens effets de dossier après comparaison des identifiants. Habits de pluie est une nouvelle famille de réponse. Les noms publics peuvent rester ; les anciens coefficients ne restent pas actifs en parallèle.

Les autres sets de build peuvent subsister. Il faut toutefois rejouer la Vigie et les meilleurs généralistes à budget égal avant d’en conserver les effets tels quels. Objectif proposé : un généraliste confortable, dont le gain de mur médian reste autour de0–5 %, et qui perd face à l’outil précis dans sa mécanique. Il ne s’agit pas de nerfer la Vigie au hasard d’un pourcentage : son moteur doit d’abord être branché et mesuré.

## 6. Le Traqueur : une survie de classe, pas un soutien universel

Je reprends **Repli couvert**, sort commun existant au niveau20, plutôt que d’ajouter une ressource.

**Proposition :** conserve son dégât0,65 P, son tag de préparation et sa cible ; cooldown18 s ; réserve de protection personnelle de **12 % des PV max pendant8 s**. Remplace l’ancien bouclier0,8 P. À PV2800 : 336 absorbables au lieu de 80. Le coût reste une des cinq places du plan.

Cette réserve protège contre coups et charges, pas contre aura/érosion ; elle ne soigne pas, ne protège pas un allié et ne se cumule pas avec elle-même. Les boucliers de soutien conservent leur fonctionnement. Le passif `supportPower` ne l’augmente pas. Elle s’épuise et laisse des périodes découvertes, ce qui garde une différence avec un vrai soutien.

**Point d’implémentation important :** ne pas écrire simplement `shield:3.36`. Ce serait une approximation à P100/PV2800, puis la protection risquerait d’être plafonnée par les caps en P du moteur actuel. Le contrat `design/traqueur.yaml` crée une réserve native personnelle indexée sur les PV, comptée séparément, sans relever tous les boucliers du jeu.

Ce rework n’est pas actif dans les essais de base livrés. Il faudra le comparer A/B : améliore-t-il le Tue-Bête au mur, sans faire du Meneur de meute le meilleur partout ? Les classes ne sont pas équilibrées par un simple multiplicateur de PV distribué au hasard.

## 7. Route profonde : pente couplée, fureur et ancrage réel

Conserver douze zones de dix nœuds, puis réutiliser leurs mécaniques aux circuits suivants. Un nœud perdu ne retire aucun acquis. Les récompenses de checkpoint restent uniques, et les bonus économiques restent plafonnés selon le dossier précédent.

Point de départ proposé, avant calibration réelle :

`s = circuit ×120 + zoneIndex ×10 + nœudLocal`

`D(s) = calibrationDeZone ×1,008^s`

`PV ennemis = PV de base × N engagé × D^1,5`

`Dégâts de toutes les sources = dégâts de base × D`

`Cadence ordinaire = cadence de base × N engagé` ; ciblage réparti. N est figé au départ, pas recalculé après chaque mort. Garde et soins ennemis suivent les PV, comme actuellement ; les charges, renforts et fenêtres gardent leurs horaires fixes. Le ralentissement ne touche pas leurs calendriers.

Cela définit une pente d’essai cohérente, **pas une promesse que le nœud120 sera atteint en tel nombre de jours**. Une fois les objets branchés, enregistrer pour chaque ancre de progression P, PV, réduction, critique, cadence, budget de rolls et heures d’obtention attendues. Rejouer le premier circuit avec ces objets et ajuster les bases des zones ; ne pas utiliser le seul niveau affiché comme approximation de la puissance.

### Fureur

Garder la fureur linéaire testée : après le délai, `multiplicateur =1 +0,10 × secondes dépassées`. Ce n’est pas un+10 % composé chaque seconde. La fureur affecte aussi aura et érosion après correction du moteur.

Le délai est fixé depuis un **groupe équilibré de référence, pour l’effectif et l’ancre de progression**, jamais depuis la composition réellement amenée. À profondeur croissante, point de départ :

`délai =1,1 × tempsDeRéférenceZone × D^1,5 / ratioDePuissanceAttendueAuNœud`.

La puissance attendue est une table de progression fixée par les concepteurs ; améliorer son équipement réel ne fait pas reculer arbitrairement la ligne d’arrivée. La fureur laisse le bon build gagner plus tôt et empêche les quatre soutiens de tout résoudre par attente illimitée. Sa pente actuelle est sévère : on la conserve comme contrôle, puis on la mesure sur les outils et compositions, plutôt que de l’annoncer équilibrée par intuition.

La variante avec fureur du ZIP contient des seuils ancrés sur un vrai passage du groupe de référence au danger1 ; le suivi de profondeur et la courbe réelle restent à intégrer. Le fichier `design/route.yaml` indique exactement les hypothèses et ce qui manque.

## 8. Tableau d’affinité attendu : objectifs, pas observations

Chaque case principale ci-dessous vise un ratio de mur **de1,25 à1,40 avec le set 4**, et **de1,15 à1,30 avec la gemme** par rapport au meilleur généraliste de même voie et budget. La gemme peut gagner le cran demandé dans certaines configurations, sans prétendre égaler partout le set 4. Les préparations visent un appoint plus petit. En l’absence du mot-clé, l’effet vaut zéro et remplacer un généraliste peut coûter jusqu’à8 % de mur pour un set,7 % pour une gemme : l’outil n’est pas un bonus gratuit à conserver partout. Impact peut néanmoins donner un petit appoint contre les charges secondaires des zones8 et12, sans y devenir premier.

| Zone | Interstice | Pluie | Impact | Battue | Fracture | Reprise |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
|1 Lanternes | **Premier** |—|—|—|—|—|
|2 Fossés |—| **Premier** |—|—|—|—|
|3 Trois coups |—|—| **Premier** |—|—|—|
|4 Vergers |—|—|—| **Premier** |—|—|
|5 Balances |—|—|—|—| **Premier** |—|
|6 Fours |—|—|—|—|—| **Premier** |
|7 Échos | **Premier** |—|—|—|—|—|
|8 Gué |—| **Premier** | Appoint |—|—|—|
|9 Sceaux |—|—|—|—| **Premier** |—|
|10 Terrasses |—|—| **Premier** |—|—|—|
|11 Atelier |—|—|—| **Premier** |—|—|
|12 Vents |—|—| Appoint |—|—| **Premier** |

« Premier » signifie meilleur **dans sa catégorie** : set comparé aux autres sets, gemme comparée aux autres majeures, avec le reste du build réoptimisé. Une gemme, qui coûte une majeure plutôt que quatre pièces, n’a pas à battre le set correspondant dans un duel de coefficients bruts. Les tableaux JSON/CSV fournissent les cibles exactes et leur statut `non mesuré`.

Si Fracture ne gagne que10 % de mur malgré une bonne accélération, on ne remplace pas ce résultat par « réussite » : on augmente son levier conditionnel ou on réduit la cadence de garde et revoit la répartition des menaces. Si un kit dissipe déjà toutes les gardes à faible coût, cet outil peut être moins utile à cette voie ; il faut le publier et vérifier que l’acceptation sur six zones reste tenue pour chacune des neuf voies. Une différence entre classes n’est pas une anomalie à gommer automatiquement.

## 9. Comment vérifier sans choisir les résultats qui nous arrangent

**Le ratio est multiplicatif :** mur outil / mur générique. Passer de×2 à×2,25 représente12,5 %, pas25 %. L’ancienne grille1 /1,5 /2 /2,5 /3 /4 est trop grossière pour trancher seule. Échantillonner plus finement, puis resserrer les deux murs à3 % ; si le meilleur danger essayé passe encore, prolonger la grille au lieu de conclure à une égalité.

Faire deux comparaisons : même plan pour isoler l’effet, puis meilleur plan de chaque candidat pour mesurer le jeu réel. Conserver les plans rapides, sûrs et spécialisés au mur, pas seulement ceux qui gagnent la moyenne au danger1. Rechercher des ouvertures valides au plus10 s et leurs retours de cooldown ; l’actuel `combat-search` commence tout à0 et ne suffit pas à vérifier ce levier.

De même, l’actuel `combat-search` ne passe que `enemyDamageScale`. Il faut lui brancher PV×danger^1,5, les équipements et la priorité de cible avant d’utiliser ses résultats comme verdict de ce dossier. Ces options sont décrites dans `design/verification.yaml` ; elles ne sont pas des flags CLI prétendument déjà disponibles.

Cribler sur quelques graines, confirmer sur64, puis juger sur128 graines réservées, sans modifier le plan après avoir vu la graine. Publier tous les échecs, morts et consommables, ainsi que les médianes et cas les plus faibles. Un12/12 observé sur un petit échantillon n’est pas une garantie générale de90 %.

### Acceptation solo

1. Au moins six zones sur douze : outil adapté≥1,25 fois le mur du généraliste, **vérifié pour chaque voie**, pas seulement la meilleure classe.
2. Chaque set et chaque gemme de situation est premier dans au moins deux zones de sa catégorie. Sinon, fusionner, revoir ou retirer l’objet.
3. Aucune des neuf voies sous×1,5 dans une zone avec son meilleur outil et la préparation de référence.
4. Dans chaque classe, la voie DPS est la plus rapide dans au moins sept zones, à budget égal et succès≥90 %. Comparer les mêmes nœuds, pas chacun à son mur personnel.
5. Vérifier les paires4+4 et les assemblages partiels, les talents de nommés et les autres majeures. Deux familles utiles ensemble ne doivent pas créer de proc récursif ou d’immunité totale. Les restrictions d’emplacements, doublons et budget de talents sont réellement appliquées.

### Acceptation groupe — principes de Louis conservés

Au normal : chaque composition cohérente testée de1–4 joueurs et chaque voie solo atteint≥90 % avec préparation ordinaire. Au mur suivant : le bon groupe garde au plus+10 % d’avance de P/PV sur les compositions monorôles après adaptation de leur build. Aucun groupe sans DPS n’atteint un mur plus haut à budget égal. Le rendement attendu tient compte des échecs, repos, potions et durée : objectif proposé≤10 % d’écart de butin/h au dernier palier stable.

Il existe 714 multiensembles de voies pour les effectifs1 à4 si les neuf voies peuvent se répéter :9 +45 +165 +495. Les huit groupes du rapport actuel sont d’excellentes sentinelles, pas toutes les compositions possibles. Cribler les 714 puis confirmer les cas limites et leurs ordres de ciblage est une couverture raisonnable. Les plans de groupe des soutiens gardent `beneficiary: lowest`, les ressources sont par membre et le repos de donjon reste30 % avec la même préparation.

« Tout build peut progresser » signifie qu’aucune classe/voie/composition n’a de mur infranchissable par son équipement et sa préparation. Cela ne signifie pas qu’un plan incohérent ou sans statistiques doit vaincre immédiatement le même nœud qu’un build étudié. On ne promet ni l’équivalence des vitesses ni un contenu gagné à tout moment.

## 10. Ce qui est livré et l’ordre de travail conseillé

**Déjà exécutable :** les deux variantes de rencontres au format natif, leur validation et les essais de base dans le moteur partagé. **À intégrer :** les six primitives de situation, la priorité de cible, Repli en PV maximum, l’échelle périodique et la recherche équipée. **À mesurer ensuite :** les gains de mur, la courbe réelle du premier circuit, les 714 compositions et le rendement horaire.

Ordre conseillé à Claude :

1. Brancher les statistiques réelles des objets, en gardant un témoin normalisé.
2. Ajouter les six primitives et leurs tests de conservation ; régler les anciens effets du même nom avant d’activer les nouveaux.
3. Ajouter Repli et la priorité préparée ; corriger danger/fureur périodiques. Vérifier les cas limites listés dans le contrat.
4. Rejouer les douze zones : isolation puis recherche équipée, mêmes budgets, graines réservées et échecs conservés.
5. Corriger les valeurs qui ratent les critères, puis seulement calibrer la route sur les objets et les heures d’obtention. Les effets visuels et nouvelles matières viennent après.

Le résultat attendu est un cycle simple : **je comprends le mur → je choisis un outil → je l’achète, le fais fabriquer ou le gagne → j’avance plus tôt → je garde cet outil pour la prochaine mécanique semblable.** Pas une collection de douze uniformes imposés, ni une obligation de changer de classe.

### Fichiers de travail

| Fichier | Usage |
|---|---|
| `sim/proposals/zones-v2/combat.yaml` | Douze rencontres natives, témoin sans fureur |
| `sim/proposals/zones-v2-fury/combat.yaml` | Même base avec seuils de fureur de référence |
| `design/equipements-situation.yaml` | Six sets, six majeures,24 fiches d’effet |
| `design/consommables.yaml` | Six préparations alternatives |
| `design/zones-reponses.yaml` | Liens zone/outils/plans/régions |
| `design/extensions-moteur.md` | Ordre de calcul, effets, limites et tests |
| `design/traqueur.yaml` | Contrat du Repli couvert personnel |
| `design/route.yaml` | Pente, fureur, ancrage réel à compléter |
| `design/affinites-attendues.json` et `.csv` | Cibles quantitatives, jamais résultats |
| `design/verification.yaml` | Recherche et critères d’acceptation |
| `verification/` | Validation, essais natifs, sources et échecs |
| `MESSAGE-CLAUDE.md` | Handoff prêt à transmettre |

Les tableaux d’essais effectifs et leurs limites sont ajoutés dans `verification/RESULTATS.md`. Ils priment sur une hypothèse narrative de cette note ; aucune affinité d’équipement n’est déclarée validée avant intégration.
