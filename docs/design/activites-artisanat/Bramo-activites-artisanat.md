# Bramo — Des activités qui alimentent les builds

**Donjons, artisanat, progression solo, saisons et vie collective**  
Proposition v0.1 · 22 octobre 2026 · Pour Louis et Claude  
Base examinée : `Kairoli/Bramo`, `main` au commit `cfa4b9e7c1be88e9578c7100874335bdb3fe2447`.  
Relecture finale des décisions : `5077fa79e285eadc4e4583072a1cb3c9eff4c8aa` ; les données d’objets et de recettes n’ont pas changé entre ces deux points.

> Ce dossier prolonge « Le cœur du jeu ». Il ne remplace ni les décisions de Louis, ni le travail d’intégration de Claude. Toutes les règles nouvelles et toutes les quantités ci-dessous sont des **propositions**, même quand la formulation est directe. Aucun équilibrage économique ou combat n’est certifié. Les vérifications jointes concernent des références, des recettes et des calculs de budget ; aucune nouvelle simulation de combat n’a été effectuée ici.

## 1. La proposition en une lecture

Je recommande un jeu où l’on choisit **ce que l’on cherche**, puis l’activité adaptée à cet objectif. Le donjon fournit des trouvailles et des vestiges ; les récolteurs fournissent la masse des matières ; les artisans transforment ces deux apports en pièces ciblées ; la progression solo met les assemblages à l’épreuve. Les activités collectives donnent une raison d’en parler et de préparer quelque chose ensemble.

Les cinq choix structurants sont les suivants :

1. **Tous les équipements classiques et d’ensemble sont fabricables**, y compris en Légendaire. Le craft choisit le modèle, le palier et la rareté ; les lignes aléatoires restent aléatoires. Les **nommés à capacité unique restent des trophées de rencontre**, accessibles aussi par le marché et par une garantie de progression de butin. C’est ma recommandation pour l’exception que Louis laisse ouverte.
2. **Les donjons sont répétables, sans limite journalière ni clé obligatoire.** Ils occupent l’activité principale. Leur coût est le temps, l’usage de l’équipement et les consommables choisis, pas l’obligation de se reconnecter chaque jour.
3. **Une route solo permanente boucle sur douze zones mécaniques**, en réutilisant six régions visuelles. Chaque zone comporte dix étapes. Les récompenses importantes sont ponctuelles et acquises une seule fois par compte ; les records peuvent continuer bien au-delà du dernier bonus de puissance.
4. **Les mutations vivent sur une route saisonnière séparée**, construite avec les mêmes rencontres. Le record permanent ne recule jamais parce qu’une saison change les règles.
5. **Les clans ont une activité de logistique et de parcours**, « Les Routes franches », plutôt qu’un deuxième gros boss obligatoire. Les world boss constituent un rendez-vous collectif distinct, ouvert aussi aux métiers et résolu par des assauts asynchrones.

Je ne recommande pas d’ouvrir ces cinq systèmes simultanément. Le premier morceau jouable doit relier un petit ensemble de recettes, une route de donjon et quelques zones solo. Le reste sert de cadre cohérent pour les extensions.

### Ce que ce dossier ne promet pas

Aucune table ne peut garantir que chaque objet sera acheté, que tous les métiers rapporteront le même prix ou que personne ne découvrira un build dominant. L’objectif est d’avoir des sources compréhensibles, plusieurs débouchés, des alternatives aux pénuries, des coûts explicites et des mesures permettant de corriger les problèmes. Une économie de joueurs restera une économie de choix, avec des surplus et des variations de prix.

Une difficulté numérotée à l’infini n’est pas une infinité de contenu. Après le maximum de progression, certains murs resteront infranchissables. La variété vient des mécaniques, des collections, des nouveaux assemblages et du contenu ajouté ; les numéros entretiennent le record, pas une promesse de nouveautés sans fin.

## 2. Base réelle, décisions récentes et contradictions

### Ce qui est déjà dans le dépôt

Le moteur de combat partagé existe désormais : combats déterministes, trois mécaniques de classe, neuf voies, 66 sorts, bénéficiaires des protections, équipes de taille paramétrable et contributions. Il tourne dans les tests et le simulateur, **pas encore dans une activité de combat jouable**. Les statistiques d’équipement, les gemmes, les ensembles et le butin ne sont pas encore raccordés au combat.

**Actualisation de fin de lecture :** Claude a depuis intégré `combat-voies-v1`, après recherche de plans, avec ajustements ciblés des DPS Forgefeu/Traqueur et de la survie des voies de contrôle. Le diagnostic initial sur Fulgurant provenait surtout de ses plans conseillés. Ce complément ne demande ni de rétablir les anciens coefficients ni de réappliquer les ajustements ; ses zones doivent être éprouvées avec les données adoptées. La précision récente sur l’alternance de builds/voies selon les zones est compatible avec la variété recherchée ici.

Les sept métiers jouables sont Minage, Bûcheronnage, Herboristerie, Pêche, Forge, Menuiserie et Cuisine. Dix autres sont déclarés mais à venir : Chasse, Agriculture, Tannerie, Couture, Alchimie, Joaillerie, Enchantement, Artificerie, Construction et Exploration. Il n’est pas nécessaire d’ajouter dix nouveaux métiers pour les besoins de ce dossier : les dix-sept existants suffisent.

Le fichier `data/gear.yaml` contient **769 modèles**, dont quinze pièces de départ. Le texte de `CLAUDE.md` parle de 754 modèles ordinaires : l’écart est celui de ces quinze pièces, pas un nouveau pool à recréer. Les sept ensembles de démonstration actuels ne constituent pas encore les dix-huit ensembles de la proposition précédente.

### Règles de continuité

| Sujet | Point de départ retenu | Conséquence dans cette proposition |
|---|---|---|
| Une activité principale | Décision et moteur existants | Combat, donjon, travail et participation événementielle se partagent le même temps |
| Hors ligne | 100 % pendant 16 h d’autonomie | Une déconnexion n’interrompt pas une mission déjà engagée dans cette fenêtre |
| Changement de classe | Gratuit, niveaux séparés, voies au niveau de leur classe | Un mur ne doit pas exiger de remonter une autre classe pour continuer |
| Recyclage combat | Poudres et fragments d’atelier, confirmé dans `integration.md` | Aucun retour de minerai, de peau, de fibre ou de vestige de boss |
| Commandes de fabrication à matériaux fournis | Abandonnées dans `marche.md` | Pas d’escrow de matières ni de système de livraison obligatoire réintroduit ici |
| Réparation par artisan | Demande de service existante | Elle reste le modèle de service ; le matériel revient au propriétaire |
| Or | Commandes PNJ limitées, échanges et taxe 5 % | Aucun nouveau robinet d’or dans les morts de monstres, les coffres répétables ou les scores |
| Clans | Bâtiments, contributions ; entrepôt non décidé | Les fournitures de projet sont consommées, pas déposées dans un entrepôt retirable |
| Éléments | Feu, Givre, Foudre, Physique ; résistances ennemies reportées | Aucune zone de cette proposition ne réclame un type de dégâts |
| Nommés | Capacité fixe qui occupe une majeure | La garantie d’obtention ne fournit jamais une cinquième majeure |
| Chef-d’œuvre | Signature et jets choisis au maximum ; plafond actuel | Aucun nouveau grade au-dessus, aucune garantie ajoutée par ce dossier |

### Ajustements par rapport au dossier précédent

- Le groupe proposé passe de **1–3 à 1–4**. Ce changement demande des essais : le moteur accepte N participants, ce qui ne démontre pas que les rencontres ni les récompenses sont adaptées à quatre.
- Les fragments échangeables permettant de « fabriquer » un nommé sont remplacés dans cette proposition par une **progression personnelle de trophée**. Cela conserve le nommé comme récompense de rencontre. Le nommé fini reste échangeable.
- Les huit emplacements possibles d’un ensemble ne changent pas. L’artisan ne fabrique pas une pièce sur un emplacement que l’ensemble ne possède pas.
- La source de loot est exprimée en **unités de rencontre de référence** avec des récompenses de parcours, pas en nombre brut de clics sur un boss.
- La route solo est définie comme une progression de compte, avec records par classe facultatifs. Les récompenses ne se multiplient pas en changeant de classe.
- Les chiffres de l’ancien document économique fondés sur le rachat PNJ sont obsolètes. Ils ne servent pas ici à annoncer une économie équilibrée.

## 3. Donner un rôle clair à chaque activité

| Activité | Ce qu’on y cherche | Gain répétable principal | Ce qu’elle ne remplace pas |
|---|---|---|---|
| Récolte de métier | Matières en volume et grade précis | Minerai, bois, peaux, fibres, poissons, herbes | Les capacités uniques des nommés |
| Transformation et fabrication | Objet choisi, commerce, signature | Composants, équipement, gemmes, consommables | La progression de trophée d’un boss |
| Zones ordinaires | XP de classe, apprentissage, classiques | Classiques ; rares résidus de rencontre | Le rendement d’un récolteur dédié |
| Cible choisie | Une capacité nommée précise | Jet de trophée et progression de garantie | La variété du parcours complet |
| Donjon complet | Mélange de vestiges, ensembles et objectifs | Butin personnel de parcours, source régionale | Un passage obligatoire quotidien |
| Route solo permanente | Mesurer et développer son personnage | XP encadrée ; récompenses de première réussite | Une ferme d’objets gratuite sans fin |
| Route de saison | Expérimenter sous une règle différente | Collection et variantes visuelles | Une remise à zéro de la puissance |
| World boss | Objectif collectif et rendez-vous social | Récompenses plafonnées d’événement | Le meilleur farm de chaque objet du jeu |
| Routes franches du clan | Planifier, produire, convoyer | Objectifs de participation et décoration | Un entretien obligatoire du clan |

Un joueur peut donc choisir une soirée de préparation puis laisser tourner son activité. Le joueur exclusivement artisan achète les vestiges ou les pièces de ses clients ; le combattant achète l’équipement, les gemmes et les consommables. Aucun des deux ne doit monter une seconde carrière uniquement pour accéder à l’autre moitié du marché.

## 4. Craft, loot et objets nommés

### Ce qui est fabricable

| Famille | Fabrication | Butin | Règle distinctive |
|---|---|---|---|
| Classiques, toutes raretés | Oui | Oui | Matériaux courants ; choix exact du modèle au craft |
| Ensembles, Épique et Légendaire | Oui, à partir de 40 | Oui dans leurs sources | Matériaux ordinaires + vestige régional + liant de mémoire |
| Gemmes mineures | Oui, Joaillerie | Oui, en appoint | Statistique définie par le modèle de gemme |
| Gemmes majeures | Oui, Joaillerie avec noyau d’Enchantement | Oui, en appoint | Talent choisi au craft, sans tirage caché du talent |
| Nommés à talent fixe | **Non, recommandation V1** | Oui ; garantie personnelle | Acquisition de rencontre, service et commerce restent possibles |
| Apparences ordinaires fabriquées | Oui, quand leur système existera | Collections et événements | Aucun avantage de combat caché |
| Pièces de départ liées | Non | Don initial par classe | Pas de matière obtenue en boucle en recréant une classe |

La rareté est une propriété choisie de la recette. Fabriquer une robe épique ne donne pas une robe commune « faute de chance ». En revanche, son nombre de lignes dans la plage prévue et leurs valeurs suivent le moteur de jets. Le chef-d’œuvre reste l’exception signée décidée pour les artisans.

Les bonus 2/3/4 d’un ensemble ne deviennent pas plus puissants en Légendaire. La différence porte sur le budget d’attributs déjà prévu. Les couleurs d’interface doivent distinguer clairement **rareté** et **appartenance à un ensemble** ; on ne crée pas une cinquième rareté verte qui remplace le système existant.

### Pourquoi fabriquer si le boss donne déjà la pièce ?

Le butin fait découvrir et peut donner une excellente surprise. Le craft garantit le **bon modèle et le bon emplacement**, au prix de matières et de travail. Un joueur qui possède trois pièces n’attend pas exclusivement le bon jet de bottes : il achète ou fait fabriquer la pièce manquante à un artisan qui la met en vente.

Une pièce dropée peut être aussi bonne qu’une pièce fabriquée ordinaire à budget égal. La signature et le chef-d’œuvre différencient l’artisan ; on ne dégrade pas arbitrairement le loot pour obliger à passer par lui.

### Recettes et accès aux plans

Les classiques sont appris avec le niveau du métier. Les familles d’ensembles sont connues à leur niveau de fabrication, à partir de 40 ; leur obstacle économique est le vestige et le travail, pas un plan lié que seul le combattant peut obtenir. Cela évite qu’un artisan spécialisé doive battre un boss avant de fabriquer pour son clan.

Des plans cosmétiques ou des variantes de collection peuvent être trouvés et échangés. Une recette indispensable à un build ne disparaît pas pendant onze mois. Les six profondeurs 40/50/60/70/80/90 donnent de **nouveaux exemplaires** ; elles ne transforment pas une vieille pièce de 40 en pièce de 90.

### Nommés : une rareté avec une sortie à la malchance

Avant une activité ciblée, le joueur choisit un trophée du répertoire légal de la rencontre, pour sa classe de loot et son palier. À chaque unité de référence victorieuse : **5 %** de chance de recevoir cet objet ; à la vingtième unité sans l’avoir reçu, il est garanti. Ce sont des paramètres de départ, pas des taux déjà validés.

Le compteur est propre au **compte, trophée et palier**, enregistré dans le journal de chasse, pas dans un matériau échangeable. La progression déjà acquise ne disparaît pas si l’on change de cible. Un drop de ce trophée remet son compteur à zéro ; un autre objet ne le remet pas à zéro. Le trophée garanti garde ses jets aléatoires ordinaires, sans garantie de chef-d’œuvre.

La garantie est une obtention de rencontre, pas une recette de Forge. Le matériel reste réparable et peut être acheté à un autre joueur. Le combattant qui ne veut pas d’artisanat et l’artisan qui ne veut pas de combat conservent donc chacun leur voie d’accès.

En moyenne, une garantie au vingtième essai avec 5 % par essai donne environ **12,83 unités par nommé**, pas vingt. À six minutes de référence, c’est environ **77 minutes** pour le plan de référence, hors échecs et transitions. Les joueurs rapides gagnent plus vite : le compteur ne doit donc jamais progresser sur un simple temps passé à perdre.

Ce délai est un point de discussion : avec 24 nommés et plusieurs paliers, la recherche des bons jets reste longue, mais l’accès initial à un talent n’est pas volontairement fixé à plusieurs semaines. Les essais devront confronter ce rythme à la progression de niveau.

## 5. Les filières de matières et les dix-sept métiers

### Récolte : des sources renouvelables et choisies

Les ressources ordinaires ne sont pas un stock fini partagé entre tous les joueurs. Un filon de mithril reste une activité accessible ; un autre joueur ne peut pas épuiser pour la journée tout le minerai du serveur. Le niveau, le temps et le choix d’activité limitent la production. Les sites riches temporaires peuvent exister plus tard, mais ne sont pas la seule source d’une matière obligatoire.

Le joueur choisit une production principale. Les sous-produits sont un supplément raisonnable, pas une obligation de produire mille bûches pour avoir cent écorces. Le bois garde son écorce existante ; une recette d’écorçage ciblée permet de fournir la Tannerie quand le marché des bûches est saturé. Même logique pour les peaux, les plumes et les gemmes brutes : une cible de récolte dédiée doit exister.

| Métier | Productions proposées | Deux débouchés au minimum | Demande qui revient |
|---|---|---|---|
| Minage | Minerais, pierre, sable, pierre runique, gemmes brutes | Forge, Joaillerie, Alchimie, Enchantement, Construction | Réparations, abrasifs, fioles, projets, nouvelles pièces |
| Bûcheronnage | Bois et écorce ciblable | Menuiserie, Tannerie, Construction | Armes, outils, cuir, projets |
| Herboristerie | Herbes, pigments, fibres sauvages de secours | Cuisine, Alchimie, Couture | Repas, réactifs, tissus |
| Pêche | Poissons, coquilles, perles ciblables | Cuisine, Joaillerie, Alchimie | Vivres, bijoux et consommables |
| Chasse | Peaux, viandes, plumes, os | Tannerie, Cuisine, Artificerie | Cuir, vivres, matériel logistique |
| Agriculture | Fibres, céréales, légumes, plantes tinctoriales | Couture, Cuisine, Alchimie | Tissus, repas et pigments |
| Forge | Lingots, ferrures, armes et armures métalliques | Combattants, autres artisans, projets | Réparations, nouvelles pièces et quincaillerie |
| Menuiserie | Bois préparé, manches, arcs, arbalètes, bâtons | Combattants, Forge, Construction | Armes, outils, éléments de parcours |
| Tannerie | Cuir, lanières, armures de cuir | Combattants, Forge, Couture | Réparations et équipements |
| Couture | Fils, tissus, tenues, capes, bannières | Combattants, Menuiserie, Tannerie, clan | Réparations, équipements, décor et fournitures |
| Cuisine | Repas de travail, vivres longs, provisions | Tous les joueurs et activités collectives | Usage effectif, jamais le simple temps d’absence |
| Alchimie | Encres, réactifs, abrasifs, potions, fioles | Enchantement, Tannerie, combattants | Réactifs de fabrication et consommables |
| Joaillerie | Métaux précieux, gemmes, bijoux, sceptres | Tous les builds, Enchantement | Nouvelles pièces, gemmes et services |
| Enchantement | Noyaux de gemme, liants de mémoire, grimoires | Joaillerie et fabricants de sets | Gemmes et pièces d’ensemble |
| Artificerie | Treuils, pièges, instruments et modules de parcours | Chasse, Construction, activités de clan | Fournitures choisies ; pas de munition obligatoire ajoutée |
| Construction | Éléments de chantier, aménagements et décor | Ateliers personnels, clans, Routes franches | Projets volontaires, sans bâtiment qui se détruit à l’absence |
| Exploration | Relevés, cartes, curiosités et découvertes | Récolte, collections, parcours de clan | Cartes et atlas ; fonction à confirmer avant ouverture |

Les quatre dernières lignes ne justifient pas une taxe obligatoire sur chaque objet. Une épée commune ne demande pas dix-sept métiers. Le lien concerne le réseau entier, pas chaque recette prise individuellement.

### Les six flux principaux

- **Minerai → lingot → pièce métallique.** Le cuir de poignée et le bois du manche sont des apports transversaux.
- **Gibier → peau → cuir → pièce de cuir.** L’écorce ou l’extrait tannant sert au tannage ; le textile reste un complément.
- **Culture ou fibres sauvages → fil → tissu → vêtement.** Les fibres sauvages servent de recours, pas de meilleure production que des parcelles convenablement gérées.
- **Minerai précieux + gemme brute → métal affiné + pierre taillée → bijou.** Le minerai précieux n’est pas obligatoirement fondu par la Forge : la Joaillerie garde son affinage.
- **Pierre runique + encre → noyau → gemme majeure.** L’Enchantement prépare un composant commun ; le joaillier choisit le talent final.
- **Équipement indésirable → poudre ou fragments → finition et perfectionnement.** Ce flux ne recrée pas les matières de récolte ou les composants régionaux.

### Agriculture : ne pas cacher un temps de plusieurs jours dans une robe

Il faut afficher séparément le travail actif et les **parcelle·heures**. Une matière qui pousse en parallèle n’est pas gratuite, mais son temps ne s’additionne pas intégralement à celui d’une activité principale.

Hypothèse d’étude, non décision sur l’Agriculture : une parcelle de fibres produit 60 unités en quatre heures ; deux fibres suffisent à la quantité de fil nécessaire pour une unité de tissu de base. On obtient alors quinze fibres par parcelle et par heure. Une robe 40 épique consomme 65 tissus dans le barème proposé : 130 fibres, soit environ 8,67 parcelle·heures. Avec six parcelles, la croissance correspondante occupe environ 1,44 h de calendrier, en parallèle du travail. Ce n’est pas une durée totale de fabrication ni une règle déjà codée.

Les cultures mûres ne pourrissent pas ; le réensemencement automatique et la croissance au-delà des seize heures restent des arbitrages d’Agriculture. Une récolte rend de quoi conserver ses semences, et une petite source initiale doit être prévue. Aucun plan ne dépend d’un stock PNJ de graines dont l’existence serait supposée à tort.

## 6. Recettes : un barème lisible et exploitable

### Vingt-huit patrons, pas des milliers de décisions indépendantes

Les matières ci-dessous sont **préparées** : lingots, cuir tanné, tissu, bois préparé, fil, métal précieux affiné, gemme taillée, encre. Les transformations sont décrites au chapitre suivant. L’orientation offensive ou protectrice ne change pas le coût d’une même famille : on ne pénalise pas financièrement un rôle.

| Patron | Métier | Matières de base | Finition de base |
| --- | --- | --- | --- |
| Coiffe métallique | Forge | 10 métal, 2 cuir | 4 min |
| Plastron | Forge | 18 métal, 4 cuir, 2 tissu | 8 min |
| Gantelets | Forge | 6 métal, 2 cuir | 3 min |
| Jambières | Forge | 14 métal, 3 cuir, 2 tissu | 6 min |
| Bottes ferrées | Forge | 8 métal, 2 cuir | 3 min |
| Capuche de cuir | Tannerie | 8 cuir, 2 tissu, 1 métal | 4 min |
| Pourpoint | Tannerie | 16 cuir, 4 tissu, 2 métal | 8 min |
| Gants de cuir | Tannerie | 5 cuir, 2 tissu, 1 métal | 3 min |
| Chausses de cuir | Tannerie | 12 cuir, 3 tissu, 2 métal | 6 min |
| Bottes de cuir | Tannerie | 7 cuir, 2 tissu, 1 métal | 3 min |
| Coiffe textile | Couture | 8 tissu, 1 cuir | 4 min |
| Robe | Couture | 18 tissu, 2 cuir | 8 min |
| Mitaines | Couture | 6 tissu, 1 cuir | 3 min |
| Pantalon textile | Couture | 14 tissu, 2 cuir | 6 min |
| Chaussures textiles | Couture | 8 tissu, 2 cuir | 3 min |
| Cape | Couture | 10 tissu, 2 cuir | 4 min |
| Ceinture | Tannerie | 6 cuir, 2 métal | 3 min |
| Anneau | Joaillerie | 4 métal précieux, 1 gemme taillée | 4 min |
| Collier | Joaillerie | 6 métal précieux, 1 gemme taillée, 1 cuir | 5 min |
| Marteau | Forge | 16 métal, 4 bois préparé, 2 cuir | 8 min |
| Épée et bouclier | Forge | 18 métal, 6 bois préparé, 3 cuir | 10 min |
| Hache | Forge | 14 métal, 3 bois préparé, 2 cuir | 8 min |
| Arc | Menuiserie | 20 bois préparé, 4 fil, 2 cuir | 8 min |
| Arbalète | Menuiserie | 18 bois préparé, 6 métal, 4 fil, 2 cuir | 10 min |
| Dagues | Forge | 12 métal, 2 bois préparé, 2 cuir | 8 min |
| Bâton | Menuiserie | 20 bois préparé, 2 gemme taillée, 2 fil | 8 min |
| Sceptre | Joaillerie | 12 métal précieux, 4 bois préparé, 1 gemme taillée | 8 min |
| Grimoire | Enchantement | 4 tissu, 6 cuir, 2 bois préparé, 2 encre | 8 min |

Les capes sont réalisées en Couture, y compris pour le Forgefeu ; les ceintures sont réalisées en Tannerie. Leur apparence s’adapte à la classe, mais elle ne décide pas à elle seule du métier de fabrication. Une coiffe métallique partagée avec le Traqueur reste une fabrication de Forge. Les familles du modèle font foi ; le système n’infère pas une recette depuis le nom français de l’objet.

### Paliers de matières proposés

Les trois premiers métaux et les premières essences réutilisent la filière actuelle. Les noms et filières au-delà ne sont pas tous dans les données : cette table propose leur extension. Le palier de l’équipement et le niveau minimum du dernier artisan sont identiques ; les ingrédients bas niveau peuvent rester accessibles à des fournisseurs moins avancés.

| Palier | Métal | Bois | Cuir | Tissu | Bijou / pierre | Facteur de quantité | Facteur de temps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Bronze | Pin | Cuir brut | Toile de lin | Cuivre / Quartz | 1 | 1,0 |
| 10 | Fer | Chêne | Cuir souple | Lin serré | Cuivre poli / Quartz clair | 1,25 | 1,1 |
| 20 | Acier | Frêne | Cuir renforcé | Sergé de lin | Cuivre ciselé / Agate | 1,5 | 1,2 |
| 30 | Acier trempé | If | Cuir de lande | Toile de chanvre | Argent / Améthyste | 1,75 | 1,3 |
| 40 | Mithril | Bois de lune | Cuir de veille | Toile de coton | Argent pur / Opale | 2 | 1,4 |
| 50 | Mithril renforcé | Charme | Cuir de voyage | Coton croisé | Or / Topaze | 2,25 | 1,5 |
| 60 | Orichalque | Cèdre | Cuir lamellaire | Soie végétale | Or pur / Saphir | 2,5 | 1,6 |
| 70 | Azurite | Ébène | Cuir de rafale | Toile des brumes | Électrum / Aigue-marine | 2,75 | 1,7 |
| 80 | Sombracier | Bois d’ombre | Cuir nocturne | Étoffe nocturne | Électrum sombre / Onyx | 3 | 1,8 |
| 90 | Astralite | Bois d’aurore | Cuir astral | Étoffe d’aurore | Électrum astral / Cristal astral | 3,5 | 1,9 |

Pour la quantité, `Q = plafond(quantité du patron × facteur de palier × facteur de rareté)`, ingrédient par ingrédient. Un ingrédient absent du patron ne réapparaît pas à cause de l’arrondi. Le temps de dernière fabrication vaut `temps du patron × facteur de temps du palier × facteur de temps de rareté`, arrondi à la seconde supérieure.

| Rareté choisie | Facteur de matières | Facteur de temps de finition | Poudre d’atelier avant poids d’emplacement |
|---|---:|---:|---:|
| Commun | 1,00 | 1,00 | 0 |
| Rare | 1,35 | 1,25 | 1 |
| Épique | 1,80 | 1,60 | 2 |
| Légendaire | 2,60 | 2,20 | 4 |

La poudre vaut `plafond(base de rareté × poids d’emplacement)` et porte le grade du palier. Les poids reprennent le fichier actuel : coiffe 0,8 ; torse 1,4 ; gants/bottes/cape/ceinture 0,6 ; jambes 1 ; collier 0,7 ; anneau 0,5 ; arme 1,6. Ce sont des coûts de finition, pas des attributs supplémentaires.

### Ajouter un ensemble

Une pièce d’ensemble part du même patron et reçoit :

- son vestige régional au grade du palier ;
- un **liant de mémoire** en Épique, deux en Légendaire ;
- la finition de rareté ordinaire, sans seconde taxe de finition cachée.

| Emplacement | Vestiges en Épique | Vestiges en Légendaire |
|---|---:|---:|
| Coiffe | 4 | 6 |
| Torse | 6 | 9 |
| Gants | 3 | 5 |
| Jambes | 5 | 8 |
| Bottes | 3 | 5 |
| Cape | 3 | 5 |
| Ceinture | 3 | 5 |
| Anneau | 2 | 3 |
| Collier | 3 | 5 |
| Arme | 6 | 9 |

Les quantités de vestiges ne doublent pas mécaniquement tous les dix niveaux : on demande le **bon grade**, produit dans le contenu correspondant. Un joueur ne convertit pas mille victoires faciles au palier 40 en ingrédients de 90.

Le liant ne donne aucun talent autonome et ne rajoute aucune ligne d’enchantement. Il sert à fabriquer le modèle d’ensemble. Cela donne un débouché à l’Enchantement sans ajouter une quatrième couche de personnalisation au personnage.

### Exemple entièrement résolu : plastron des Cendres, palier 40 Épique

Le patron du plastron utilise 18 métaux, 4 cuirs, 2 tissus et 8 minutes de finition. Le facteur de palier est 2 ; celui des matières épiques est 1,8 ; le temps de palier est 1,4, celui de rareté 1,6.

| Entrée | Quantité |
|---|---:|
| Lingots du palier 40, ici mithril | 65 |
| Cuir brut préparé | 15 |
| Toile de lin | 8 |
| Poudre d’atelier de grade 40 | 3 |
| Scorie de mémoire de grade 40 | 6 |
| Liant de mémoire de grade 40 | 1 |
| Temps de Forge final | 1 076 s, soit 17 min 56 s |

Les matières principales suivent le palier ; les compléments restent au grade 1. Un plastron 90 ne réclame donc pas aussi Couture 90 et Tannerie 90. Les gemmes de foyer d’un bâton ou d’un bijou suivent toutefois son grade. Les composants d’Enchantement et d’Alchimie transversaux sont des préparations apprises au plus tard au niveau 20, même lorsqu’ils emploient un réactif de grade supérieur. Leurs métiers gardent leurs propres recettes finales avancées.

Le temps de Forge final **n’inclut pas** la récolte et la préparation des ingrédients ni l’obtention des vestiges. Le forgeron peut acheter ces entrées. Le mineur peut vendre ses minerais à un autre fondeur. Personne n’est obligé de réaliser seul toute la chaîne.

| Exemple de pièce d’ensemble | Matières préparées ; grade entre parenthèses | Dernier métier | Finition seule |
| --- | --- | --- | --- |
| Plastron · 40 Épique | 65 métal (40), 15 cuir (1), 8 tissu (1) | Forge | 17 min 56 s |
| Pourpoint · 40 Épique | 58 cuir (40), 15 tissu (1), 8 métal (1) | Tannerie | 17 min 56 s |
| Robe · 40 Épique | 65 tissu (40), 8 cuir (1) | Couture | 17 min 56 s |
| Marteau · 40 Épique | 58 métal (40), 15 bois préparé (1), 8 cuir (1) | Forge | 17 min 56 s |
| Arbalète · 40 Épique | 65 bois préparé (40), 22 métal (1), 15 fil (1), 8 cuir (1) | Menuiserie | 22 min 24 s |
| Sceptre · 40 Épique | 44 métal précieux (40), 15 bois préparé (1), 4 gemme taillée (40) | Joaillerie | 17 min 56 s |
| Anneau · 40 Épique | 15 métal précieux (40), 4 gemme taillée (40) | Joaillerie | 8 min 58 s |

### Pourquoi ne pas facturer tous les objets le même prix ?

Un anneau et un plastron n’occupent pas le même budget. En revanche, trois torses comparables doivent demander un ordre de grandeur de travail similaire. Les petites vérifications jointes comparent quelques chaînes 40 avec des durées de collecte explicitement hypothétiques ; elles servent à détecter un tissu dix fois plus lent que le métal, pas à prédire les prix.

Le prix final reste libre sur le marché. L’artisan peut payer plus cher une matière rare, accepter une marge plus basse ou vendre un excellent jet. Aucun « prix juste » calculé ici ne devient un prix PNJ garanti.

### Couverture du catalogue et limites de l’export

Le fichier `audit-catalogue.json` examine les 769 modèles actuels. **717 classiques** reçoivent un projet de recette. Les **52 autres modèles** sont explicitement isolés : quinze départs liés, vingt-huit pièces des anciens sets et neuf modèles dont le nom entre en collision avec les nouveaux nommés. Aucun n’est oublié silencieusement.

Ces neuf collisions ne prouvent pas que le modèle actuel possède déjà un talent nommé : le catalogue peut porter le même nom sur un Légendaire ordinaire. Claude doit décider le renommage ou la migration avant d’en faire un trophée.

Pour les ensembles futurs, les 298 variantes de modèles du dossier précédent, les six paliers 40–90 et les deux raretés donnent **3 576 recettes résolues proposées**. Avec les classiques, le fichier comporte **4 293 recettes**. Cela ne crée pas 4 293 nouveaux dessins ou 4 293 effets : c’est le dépliage automatique de vingt-huit patrons.

L’export utilise des identifiants de matières génériques comme `metal_t40`, à relier aux vrais identifiants. Les recettes de futurs ensembles visent des identifiants `proposal_*` : les modèles correspondants ne sont pas encore créés dans `gear.yaml`. **Ne pas copier l’export directement dans `data/recipes/`.** Le générateur et le validateur sont des outils de conception, pas un installateur du jeu.

## 7. Transformations, gemmes, réparations et recyclage

### Chaînes de préparation proposées

| Recette | Métier | Entrées | Sortie | Temps de travail de départ |
|---|---|---|---|---:|
| Bronze | Forge | 1 cuivre + 1 étain | 1 lingot | 8 s, existant |
| Fer | Forge | 2 minerais de fer | 1 lingot | 10 s, existant |
| Acier | Forge | 2 minerais de fer + 2 charbons | 1 lingot | 12 s, existant |
| Métal avancé | Forge | 2 minerais du grade + 1 charbon | 1 lingot | 12–24 s selon palier |
| Acier trempé 30 / mithril renforcé 50 | Forge | 2 minerais de fer + 3 charbons / 2 minerais de mithril + 2 charbons | 1 lingot du nouveau grade | 14 s / 18 s, préparation directe sans refonte inverse |
| Charbon de bois, recours débutant | Forge | 2 bois de pin bruts | 1 charbon substituable | 8 s ; plus lent que le Minage une fois celui-ci débloqué |
| Bois préparé | Menuiserie | 1 bûche du grade | 1 unité | 8–20 s |
| Cuir, tannage lent | Tannerie | 1 peau + 2 écorces | 1 cuir | 30 s |
| Cuir, tannage aux réactifs | Tannerie | 1 peau + 1 extrait tannant | 1 cuir | 15 s |
| Extrait tannant, lot | Alchimie | 4 écorces + 1 herbe | 4 extraits | 20 s |
| Fil | Couture | 1 fibre préparée | 2 fils | 8 s |
| Tissu | Couture | 4 fils | 1 tissu | 16 s |
| Métal précieux | Joaillerie | 2 minerais précieux | 1 unité affinée | 12 s au grade 40 |
| Gemme taillée | Joaillerie | 1 gemme brute du grade | 1 gemme taillée | 60 s au grade 40 |
| Encre, lot | Alchimie | 4 herbes du grade + 2 charbons | 2 encres | 40 s |
| Abrasif d’atelier | Alchimie | 2 sables + 1 herbe du grade | 2 poudres du grade | 10 s |
| Liant de mémoire | Enchantement | 4 pierres runiques du grade + 2 encres + 1 poudre du grade | 1 liant | 45 s |
| Noyau runique | Enchantement | 4 pierres runiques du grade + 2 encres | 1 noyau | 45 s |

Le fichier `preparations.json` décrit 122 recettes de préparation et 107 sources, dont 30 vestiges de rencontre. Les recettes résolues d’équipement commencent aux matières préparées ; ce second fichier permet d’en suivre les entrées. Plusieurs identifiants possèdent un alias actuel (bronze, fer, acier, premières planches). Les nouveaux restent des propositions. Les coûts du bronze et des préparations existantes ne sont pas changés par une approximation de chaîne.

L’abrasif et la poudre de recyclage sont substituables pour la finition. Cela donne une sortie de démarrage : un artisan ne doit pas casser une robe épique pour obtenir la poudre nécessaire à sa toute première robe épique. L’abrasif demande du travail et des ressources, donc sa présence ne rend pas le recyclage gratuit ou infini.

### Gemmes

- **Mineure** : une gemme taillée du grade + une poudre ; finition de Joaillerie de 30 s, à ajuster par grade. Le modèle choisit la famille de statistique.
- **Majeure** : deux gemmes taillées + un noyau runique + deux poudres ; finition de Joaillerie de 90 s, à ajuster par grade. Le talent est celui choisi dans la recette.
- Les dix-huit talents majeurs du dossier précédent sont conservés. Leur effet n’est pas multiplié arbitrairement par dix entre deux grades ; seuls les paramètres explicitement prévus par le moteur peuvent évoluer.
- Je propose l’accès aux majeures à partir du niveau de métier 20, cohérent avec les premiers nommés ; ce seuil reste à valider avec les sockets du catalogue.
- Le retrait d’une gemme doit permettre les essais de build. Recommandation : service peu coûteux, sans destruction de gemme. Aucun deuxième système de chance d’échec n’est ajouté.

### Réparation

Une réparation complète consomme environ **30 % des matières ordinaires du patron réellement utilisé**, sans reprendre les vestiges, les liants, les gemmes serties ni le talent nommé. Une réparation partielle est proportionnelle à l’usure. Les petits restes fractionnaires sont accumulés par l’exemplaire ou la facture ; on ne paie pas un lingot entier à chaque micro-réparation.

La Forge répare le métal, la Tannerie le cuir, la Couture le textile, la Menuiserie le bois et la Joaillerie les bijoux ; un grimoire relève de l’Enchantement. Les pièces mixtes prennent le métier final de leur recette. Cela retire à la Forge le monopole de toutes les réparations de combat sans changer la réparation actuelle des outils.

Le PNJ de secours coûte plus cher et retire de l’or. Sa formule réelle doit être harmonisée avec `settings.wear.repairGoldShare`, pas recopiée depuis un ancien paragraphe indiquant encore 50 %. La durabilité maximale ne diminue pas. Le donjon ne consomme que les heures effectivement résolues ; aucune usure pendant l’attente du groupe ou après la pause d’autonomie.

### Recyclage

| Produit recyclé | Résultat proposé | Interdictions |
|---|---|---|
| Classique ou set Commun/Rare | 1 à 2 poudres de son grade, selon emplacement et rareté | Aucun matériau principal rendu |
| Classique ou set Épique/Légendaire | 2 à 4 poudres, éventuellement un fragment de finition | Aucun vestige régional, liant ou noyau récupéré |
| Nommé | Même budget de recyclage qu’un classique équivalent | Aucun progrès supplémentaire de trophée |
| Départ lié | Rien | Pas de boucle de changement de classe |
| Outil de métier | Règle actuelle séparée | Ne pas lui appliquer silencieusement la migration combat |

Les poudres et les fragments servent à des opérations qui consomment **aussi** d’autres ressources ou du travail. Une poudre n’achète pas une pièce entière auprès d’un PNJ. Le grade 1 n’est pas convertible en grade 90. Il n’existe pas de chaîne qui fasse `équipement → poudre → équipement identique` sans perte de matières et sans temps.

### Consommables : éviter les coûts de classe arbitraires

Je n’ajoute pas ici de flèches obligatoires au Traqueur, de runes consommées à chaque sort au Runiste ou de combustible à chaque attaque au Forgefeu. Certaines de ces idées apparaissent comme hypothèses dans les anciens textes ; elles imposeraient des coûts différents aux classes avant qu’on sache les équilibrer.

Première version : un repas long choisi, une politique automatique de potion facultative, et des fournitures d’activité. Les repas de travail existants ne deviennent pas des potions de combat par simple renommage. Les nouveaux consommables de combat ont leurs propres effets et un coût horaire mesuré. On peut gagner avec un équipement correct sans consommer un inventaire de douze buffs.

## 8. Une économie qui tolère le surplus sans vivre de pénuries

### Ne pas chercher à faire disparaître toute la production

Un joueur peut choisir une récolte pour l’XP alors que le marché en a déjà beaucoup. Il n’existe pas de recette magique qui absorbera à prix élevé toutes les matières de tous les joueurs. À population stable et équipement durable, une partie du stock augmentera. L’objectif est de garder le temps économisé utile et d’éviter qu’une seule activité fournisse tout.

Je retiens cinq sorties : équipements et essais de jets, réparation d’usage, consommables, projets volontaires de Construction, fournitures d’activités collectives. Les commandes PNJ restent un robinet d’or borné et un petit débouché, pas un aspirateur de surplus.

Un sixième outil est possible plus tard : **exercices d’atelier**. Ils donnent le même XP horaire qu’une fabrication de référence, utilisent 80 % de ses matières ordinaires, ne produisent ni pièce vendable, ni poudre, ni chef-d’œuvre. Ils permettent de pratiquer sans inonder le marché. Leur efficacité doit être confrontée aux recettes normales ; ce n’est pas une nouvelle monnaie ni une obligation quotidienne. Ne pas les implémenter avant d’avoir observé un vrai surplus de pièces.

### Quand une matière manque

1. Vérifier que le prix monte réellement et qu’aucune erreur de recette ne consomme dix fois trop.
2. Vérifier que la récolte est ciblable et qu’un métier déclaré « bientôt » n’est pas déjà indispensable à un équipement vendu comme disponible.
3. Prévoir une seconde manière raisonnable d’obtenir le même ingrédient : fibres sauvages, tannage lent, extraction ciblée, reprise de donjon au même grade.
4. Si c’est un vestige, garder un minimum garanti par victoire et une source de secours moins efficace.
5. Corriger les recettes ou les cadences de manière annoncée. Ne pas modifier automatiquement le drop du prochain joueur à partir du prix du marché.

Une matière chère n’est pas forcément un défaut : c’est parfois la raison d’être d’un fournisseur. Une matière sans source praticable ou contrôlée par un unique joueur est un défaut de conception.

### Quand une matière déborde

Rendre la demande visible, proposer des projets volontaires à petite échelle, éviter les recettes d’XP dominantes qui produisent toutes le même objet, puis réduire les sorties inutiles du combat. Les vieux matériaux restent utiles dans quelques ingrédients transversaux et dans leurs réparations, sans demander du bronze dans chaque plastron astral.

Les projets ne donnent pas des bonus infinis. Une bannière de clan, un décor d’atelier, une serre ou une collection de mobilier peuvent absorber des surplus sans punir celui qui ne les finance pas. La Construction ne doit pas devenir un bâtiment qui s’écroule si personne ne se connecte.

### Mesures avant toute affirmation d’équilibre

| Mesure sur une fenêtre glissante | Signal à examiner | Réponse possible |
|---|---|---|
| Stock / consommation quotidienne | Stock élevé qui continue de monter | Revoir la production pour l’XP et les sorties inutiles |
| Temps d’attente d’un achat au prix récent | Absence durable d’offre, surtout débutant | Source ciblée ou recette alternative |
| Origine des matières | Combat et recyclage fournissent une part majeure des minerais | Réduire ces sources ; viser 0 au lancement pour les bruts |
| Temps complet d’une pièce | Un style coûte bien plus que les autres | Réviser quantité, transformation ou croissance |
| Nombre de vendeurs actifs | Une filière n’a qu’un fournisseur | Autonomie praticable et calendrier d’ouverture des métiers |
| Marge et volume de vente | Un métier gagne seulement de l’XP sans clients | Revoir ses produits, ne pas lui ajouter un bonus artificiel |
| Or créé / détruit | Stock monétaire qui croît sans débouché | Examiner PNJ et services, pas les prix imposés aux joueurs |
| Part du temps en activité événementielle | L’événement supplante toutes les autres activités | Réduire ou plafonner ses récompenses économiques |

Les tests futurs doivent couvrir au moins 20, 50 et 200 joueurs, des serveurs dominés par les combattants et d’autres par les métiers, l’arrivée de nouveaux joueurs, une baisse de population et un marché avec vendeurs peu fréquents. Le présent dossier ne simule aucun de ces marchés.

Les taux de taxe et le prix minimal entier existants demandent aussi un traitement des petits lots : prélever une taxe arrondie à chaque minerai vendu un or peut écraser sa valeur. Une vente par lots et une accumulation des fractions de taxe valent mieux qu’un prix plancher PNJ universel.

## 9. Des donjons qui ont un fonctionnement complet

### Une instance préparée, puis résolue automatiquement

Un donjon est un parcours de **six salles** : deux approches, deux rencontres intermédiaires, une salle de combinaison et un gardien final. Les six parcours réutilisent les dix-huit adversaires proposés ; ils ne demandent pas trente-six nouveaux boss.

| Salle | Fonction | Exemple de contenu |
|---|---|---|
| 1 | Lire la règle du lieu | Deux ouvriers de forge aux coups espacés |
| 2 | Introduire une priorité | Un porte-lanterne renforce un allié fragile |
| 3 | Première rencontre notable | Veilleur de four et son exposition régulière |
| 4 | Variante de formation | Deux gardes, un éclat fragile, cadence différente |
| 5 | Combiner sans tout empiler | Une garde temporaire et une charge annoncée |
| 6 | Gardien du parcours | Contremaître rouge, avec plusieurs réponses prévues |

Avant de partir : difficulté et palier d’objet, route, groupe, plan, priorités de soin et de cible, politique de potions, nombre de répétitions et arrêt après échecs. Tout est consultable. Une fois engagé, aucun bouton manuel de réaction n’est nécessaire.

Un participant ne reçoit du loot de grade supérieur que si sa classe de combat a le niveau d’accès correspondant ; une aide de haut niveau ne fabrique pas des trophées 90 pour un personnage 1. Les récompenses inférieures et l’XP suivent leurs règles propres.

Le groupe choisit une branche avant le départ : **Courte** pour la cible finale déjà débloquée, **Réserves** pour le parcours mélangé ou **Relevés** pour l’objectif de collection. Le premier prototype peut n’offrir que Courte et Réserves. Il n’y a pas d’événement qui attend un vote en direct au milieu de l’absence.

### Durée et transitions

Point de départ : un parcours de l’ordre de **12–20 minutes** pour un groupe de référence, selon le palier et le profil ; une tentative ciblée de quelques minutes. Ces durées doivent être mesurées, pas obtenues en gonflant artificiellement les PV des salles faciles. Le budget comparatif de butin utilise un parcours de référence de dix-huit minutes et une cible de référence de six minutes.

Les PV persistent entre les salles. Un repos automatique de quinze secondes rend **20 % des PV maximum**, plafonné au maximum ; les cooldowns continuent. Les effets de rencontre et ressources temporaires sont purgés à la transition, sans rendre prêts les talents encore en recharge. Ce choix conserve une valeur aux soins et évite de commencer chaque salle avec une pile artificielle de protections.

Un personnage tombé reste hors combat jusqu’à la fin de la salle. Si elle est gagnée, il revient avec 50 % de vie avant le repos normal. Si toute l’escouade tombe, la tentative de parcours est perdue. Les objets gagnés dans les salles déjà validées restent acquis, mais pas la récompense de fin.

Après une défaite : trente secondes de récupération puis sortie, reprise ou arrêt selon le plan préparé. Par défaut, **trois échecs consécutifs arrêtent l’activité**, sans perte d’objet. L’interface explique la salle, la cause principale et la progression ennemie restante. Les consommables déjà utilisés et l’usure effective ne sont pas remboursés ; les matières mises en réserve pour des tentatives non jouées le sont.

Un système de reprise technique conserve les salles déjà résolues. Il ne permet pas de recomposer sans limite son build après chaque salle : les changements de plan se font entre les parcours. Un abandon volontaire puis une réentrée ne réinitialise pas les cooldowns pour obtenir une attaque gratuite.

### Palier, profondeur et effectif sont trois réglages différents

- **Palier d’objet** : 1/10/20…90 ; détermine les matériaux et modèles éligibles.
- **Profondeur de difficulté** : quelques rangs lisibles ; complexifie ou renforce les rencontres, sans créer de grade d’objet infini.
- **Effectif** : 1, 2, 3 ou 4 participants ; ajuste la rencontre et fournit un butin personnel à chacun.

Les routes d’ensembles s’ouvrent au palier 40. Tous leurs effets restent disponibles à ce palier ; les versions 60/80/90 augmentent les budgets ordinaires, pas le nombre de capacités requises pour qu’un build fonctionne.

Hypothèse initiale à tester pour N personnages : PV ennemis `×N`, dégâts des coups individuels inchangés, dégâts réellement collectifs `×N` au total mais répartis entre les bénéficiaires ; attaques et cibles clairement définies. Ce n’est pas une formule d’équilibrage final. Une charge de boss ne frappe pas chacun pour quatre fois les dégâts en groupe de quatre.

Avec des synergies, un groupe peut gagner 10–20 % de temps ou de fiabilité. Il ne doit pas produire quatre fois plus de récompenses **par participant et par heure**. Les récompenses sont personnelles et identiques à palier égal ; l’éventuel gain vient du jeu en groupe. Il faut tester les groupes de quatre soutiens, les quatre DPS, les contrôles empilés et les compositions mixtes avant publication.

### Les six parcours, concrètement

| Parcours | Variation de salles | Matière principale et objectif | Réponse possible sans composition imposée |
|---|---|---|---|
| Galeries du vieux puits | Carapace, collecteur, gardien ; courte introduction | Classiques et premiers trophées ; reprise 40 de secours | Dégâts appuyés, afflictions ou endurance |
| Fonderie sans maître | Exposition, cloche chargée, gardes du contremaître | Scories de mémoire ; Cendres, Enclume, Passeurs, Recuit | Absorber, affaiblir ou raccourcir la phase dangereuse |
| Relais des chasseurs perdus | Silhouettes, cocon, leurre du Veneur | Ambres de veille ; Empreinte, Ronces, Relais, Battue, Incise | Zones, priorité de cible, contrôle ou protection |
| Chambre des phrases noyées | Rythmes, sentence, refrain | Encre fossile ; Orage, Intervalles, Fracture, Palimpseste | Débit régulier, dissipation, Pression ou garde |
| Trois Portes du serment | Séquences, érosion, gardes du Porte-serment | Éclats de serment ; Sceau, Revers, Vigie, Rivets, Meute | Soins, protections, attaques réparties ou forte poursuite |
| Passage des trois vents | Rafale, défense renouvelée, combinaison du Régent | Quartz de faille ; échange de secours et nommés | Deux réponses complémentaires, jamais trois obligations de classe |

### Pas de quota journalier pour le farm normal

Aucun « trois donjons puis revenez demain », aucune clé fabriquée chaque jour. Les limites sont l’activité unique, les seize heures d’autonomie, la capacité réelle du build et les consommables choisis. Le bonus de première découverte, lui, n’est reçu qu’une fois. Un journal de collection peut donner un objectif hebdomadaire cosmétique sans transformer les parcours normaux en corvées calendaires.

## 10. Coopération hors ligne : une escouade engagée

### Le contrat d’escouade

Un joueur autorise un **plan précis** à participer à une escouade, pour quatre heures par défaut ou une autre durée bornée, au plus dans son autonomie restante. Il choisit son stock maximal de consommables, les paliers autorisés et son comportement après échec. L’autorisation peut être déposée à l’avance ; les autres n’ont pas besoin de le voir connecté au départ.

Quand la mission commence, son personnage occupe son activité principale. Il ne produit pas des lingots en parallèle et n’est pas cloné dans dix donjons. Une personne ne peut être engagée que dans une seule escouade à la fois. Le leader ne peut pas interrompre une fabrication en cours sans autorisation : l’offre est disponible lorsque la file prévue laisse la place, ou lors d’un créneau explicitement réservé.

Au départ, le serveur enregistre un instantané : classe, niveau, voie, équipement par identifiant d’exemplaire, gemmes, plan, stocks réservés et version des règles. Les objets engagés sont verrouillés contre la vente ou l’équipement simultané. Ils ne deviennent pas la propriété du leader.

### Déconnexion, autonomie et départ

- La connexion n’influence pas le rendement ni les chances.
- L’autorisation de durée et l’autonomie de chaque propriétaire bornent ses actions ; le leader ne prolonge pas les seize heures d’un allié.
- On n’entame pas une nouvelle salle pour un groupe dont un contrat vient d’expirer. La salle déjà engagée est résolue dans la borne de temps autorisée ; si cette borne ne suffit pas, le départ est reporté. Le temps engagé est réservé avant le lancement.
- Une fin de contrat ou une demande de départ prend effet à la transition suivante ; personne ne disparaît au milieu d’un coup pour réécrire l’issue.
- Entre deux parcours, le groupe peut se reformer ou se réduire, avec une nouvelle instance adaptée. **Aucun redimensionnement des PV ennemis en cours de combat.**
- Le propriétaire récupère automatiquement son butin, son XP réelle et ses objets ; les réserves inutilisées sont libérées. Il peut consulter le journal plus tard.

Cette formule a une conséquence assumée : prêter son personnage a un coût d’opportunité. Elle récompense les vraies escouades et empêche une bibliothèque de personnages puissants de devenir du rendement gratuit pour tout le serveur.

Une version à compagnons gratuits pourrait être plus pratique, mais poserait un autre problème d’équilibrage. Je ne la mélange pas à la première version. Jouer seul reste possible sur les mêmes familles d’objets ; ne pas trouver d’escouade ne bloque donc pas la collection.

### Résolution technique à préparer

L’instance a un identifiant et un registre de salles/requêtes déjà appliquées. Le serveur prend les participants dans un ordre de verrouillage stable, réserve leurs activités et sauvegarde les résultats atomiquement. Le premier joueur qui consulte peut déclencher le calcul, **mais pas recevoir l’autorité** sur son issue.

Un crash, deux onglets ou deux joueurs demandant le résultat ne doivent ni doubler un coffre, ni doubler une usure. Une modification de build après le départ ne change pas le passé. Une mise à jour de règles ne recalcule pas le butin d’un vieux combat avec de nouveaux coefficients : il faut une politique de version ou une migration de fin de mission annoncée.

Le moteur actuel calcule à la demande sans boucle serveur permanente. Les escouades asynchrones peuvent rester compatibles avec ce principe. Leur coût de calcul, la contention des verrous et la reprise d’une longue absence devront être mesurés dans le moteur réel.

## 11. Butin : budgets, cibles et vestiges

### Une unité de référence

Une unité de référence correspond à la récompense d’une cible notable calibrée autour de **six minutes, transitions comprises**. Ce repère appartient à la table de rencontre ; il n’est pas le nombre de minutes réellement perdues par le joueur. Les victoires rapides sont rémunérées plus vite. Une défaite ne gagne pas une unité parce qu’elle a duré longtemps.

La profondeur et le palier sont figés au départ. On ne fait pas entrer un niveau 90 après l’engagement pour convertir le coffre d’un boss 20 en coffre 90. Le choix de classe de loot est lui aussi figé ; il peut viser une autre classe déjà débloquée sans faire monter cette classe gratuitement.

### Table de départ à comparer

| Récompense personnelle | Cible : 1 unité | Parcours complet : 3 unités | À l’heure de référence |
|---|---:|---:|---:|
| Vestiges régionaux | 2 garantis | 6 garantis | 20 |
| Classique fini | 20 % d’un exemplaire | Espérance 0,60 exemplaire | 2 |
| Cache de set | 10 % d’une cache | Espérance 0,30 cache | 1 |
| Nommé ciblé | 5 % + garantie à 20 unités | 3 jets sur les sources des trois rencontres | Environ 0,78 nommé au total avec les garanties |
| Minerais, peaux, fibres, bois bruts | 0 | 0 | 0 |
| Or neuf | 0 | 0 | 0 |

Les espérances 0,60 et 0,30 peuvent être mises en œuvre par trois jets indépendants ; elles ne veulent pas dire « au plus un objet » dans le parcours. Pour les nommés, trois jets donnent 14,26 % d’au moins un drop direct sans compter les garanties ; plusieurs exemplaires sont possibles. Chaque salle ne progresse que le compteur de sa propre source. Dans la Fonderie, le Veilleur peut donner La Rancune, la Cloche Les Bonnes Manières et le Contremaître Le Compte y est. Le parcours ne donne donc pas trois crédits de La Rancune. La route courte est plus efficace pour un trophée précis, la route complète diversifie les recherches. Les compteurs et garanties sont traités dans l’ordre, sans nouvelle chance à la reconnexion.

Les salles 3, 5 et 6 contiennent les trois rencontres notables et attribuent chacune leur unité après victoire. Quitter après la salle 3 ne donne pas les deux suivantes. Les salles 1, 2 et 4 contribuent à l’XP et au parcours, sans créer un quatrième budget complet de trophée.

Le parcours n’est pas réputé équilibré parce que 3 × 6 = 18. Le temps, les échecs et les bénéfices des transitions doivent être mesurés pour que la cible courte et le parcours aient des rendements voisins sur leur objectif commun. La version complète gagne son intérêt par la variété de sources, les collections et les rencontres intermédiaires, pas par un bonus obligatoire de 100 %. L’étalon de six minutes n’autorise pas à ajouter une attente artificielle pour atteindre ce chiffre. Si un boss de référence dure seulement deux minutes, son poids de récompense doit être inférieur à une unité, avec une progression de garantie en unités fractionnaires. Les données de rencontre doivent porter ce poids ; les taux du tableau décrivent une unité entière et ne doivent pas être copiés comme « 5 % à chaque monstre ».

### Répartition des ensembles

Au début, on choisit une famille cible parmi celles de la région. La cache de set fournit cette famille, puis un emplacement légal. **90 %** des pièces suivent la classe de loot choisie ; les autres peuvent alimenter le commerce. Aucun jet ne crée une pièce impossible pour la classe d’un set exclusif.

Les vestiges de la région servent à toutes ses familles. Les ingrédients ordinaires et le travail du fabricant distinguent les pièces. Il n’existe donc pas dix-huit monnaies de set qui occupent dix-huit cases supplémentaires dans la banque.

| Région | Vestige | Ensembles concernés |
|---|---|---|
| Forges éteintes | Scorie de mémoire | Cendres, Enclume, Passeurs, Recuit |
| Lisière des veilleurs | Ambre de veille | Empreinte, Ronces, Relais, Battue, Incise |
| Archives englouties | Encre fossile | Orage, Intervalles, Fracture, Palimpseste |
| Bastion des longues veilles | Éclat de serment | Sceau, Revers, Vigie, Rivets, Meute |
| Cicatrice des trois vents | Quartz de faille | Source de secours pour les quatre familles régionales ci-dessus |

Le quartz de faille s’échange à **4 pour 1** contre un vestige choisi du même grade. Il n’y a pas d’échange inverse. Les Abords, dans leur reprise 40+, donnent un choix limité de vestige existant avec un rendement réduit, plutôt qu’une sixième monnaie. Les nommés conservent leurs sources de boss précises : un quartz n’achète pas La Rancune.

Les vestiges et poudres sont échangeables. Un artisan peut donc choisir sa carrière et acheter ces entrées. Les boss n’ont pas le monopole des gemmes, des herbes, des matières premières et de l’or en plus des trophées.

### Grades de loot et nommés intermédiaires

Le set apparaît à 40. Les six premiers nommés du dossier précédent restent disponibles à partir de 20, les autres à partir de 40. Les classiques existent sur tous les paliers. Une profondeur 50 ou 70 peut donner le grade intermédiaire correspondant même si l’habillage principal de donjon est décrit par routes 40/60/80/90 : c’est un rang paramétré, pas un nouveau décor à produire.

Les taux de rareté des classiques sont une table à calibrer avec les recettes. Proposition de départ pour une unité de loot classique : 55 % Commun, 30 % Rare, 13 % Épique, 2 % Légendaire ; une cache de set est Épique par défaut, avec 10 % de Légendaire. Ces répartitions ne s’appliquent pas aux nommés, déjà Légendaires dans le premier lot. Les beaux jets doivent rester une recherche, pas une recette d’or par le PNJ.

### Trois façons de compléter son build

1. **Combat** : gagner directement une pièce, des vestiges et un trophée ; vendre les trouvailles qui ne servent pas.
2. **Artisanat** : acheter les vestiges, choisir une pièce, fabriquer pour soi ou pour le marché.
3. **Commerce** : vendre sa spécialité et acheter la pièce finie recherchée.

Aucune voie ne réclame que le personnage monte d’abord Forge, Couture, Chasse et Runiste en même temps.

## 12. PvE solo permanent : la Route des Lointains

### Le principe

Une progression personnelle, entièrement automatique, organisée en **douze zones de dix étapes**, soit 120 étapes par circuit. Chaque zone réutilise le décor d’une des six régions, mais présente un problème différent. Une étape comporte une à trois rencontres courtes ; elle ne devient pas une promenade nécessitant des clics.

À l’étape dix d’une zone, on retrouve un gardien ou une variante marquante. Réussir ouvre la zone suivante et son checkpoint. Après la douzième, le circuit suivant reprend les douze thèmes avec une puissance supérieure. Les formations et deux variantes connues renouvellent les rencontres ; pas besoin de dessiner 120 boss.

Le chiffre d’étape n’est **pas** le niveau de personnage. L’étape 120 ne réclame pas un niveau 120 dans un jeu limité à 99. Le premier circuit couvre la montée en puissance ; les suivants mesurent le dépassement de ce premier parcours.

### Mon désaccord avec une classe obligatoire par zone

Louis imagine qu’une zone pourrait inciter à passer soutien, puis une autre à passer DPS. L’idée de varier les avantages est bonne. En faire une obligation pose un problème : changer de classe est gratuit, mais son niveau est séparé. Le joueur peut devoir quitter son objectif et monter une autre classe pendant des jours. Cela produit une taxe d’accès, pas seulement un choix de build.

Je recommande donc **changer d’abord les outils, puis éventuellement la voie, et la classe si on en a envie**. Une zone d’usure favorise le soin, mais une garde, une purification, un équipement de récupération ou une meilleure vitesse de victoire doivent constituer d’autres réponses. Une voie soutien peut franchir cette zone avec moins de statistiques ; une autre voie peut attendre un peu ou investir dans un outil de survie.

À la limite absolue de progression, certains builds passeront plus haut que d’autres. On ne peut pas promettre le même record à toutes les combinaisons. La cible raisonnable est que chaque classe et chaque voie aient plusieurs plans viables et des zones où leur investissement est récompensé. Si un rôle plafonne systématiquement un circuit entier plus bas à budget égal, le système échoue à cet objectif.

### Fonctionnement préparé

Le joueur choisit « pousser jusqu’au prochain mur », une limite de temps ou le prochain checkpoint. Son plan courant est utilisé jusqu’à une défaite. Deux tentatives supplémentaires au plus peuvent confirmer l’échec ; ensuite l’activité s’arrête ou revient à une ferme enregistrée **si le joueur l’a demandé**. On ne dépense pas seize heures en morts répétées parce qu’il est parti dormir.

La formation et sa graine sont déterministes pour le joueur, l’étape et la version de contenu. Relancer n’est pas une loterie de nouvelle formation. Un changement de build permet un nouvel essai du même problème. La saison ne reroll pas le parcours permanent.

Le changement de classe, voie et équipement se fait hors rencontre, entre les essais. L’interface garde un aperçu : danger principal, fenêtre annoncée, causes de la dernière défaite, alternatives possibles. Les paramètres d’ouverture ne doivent pas réclamer une précision inférieure à la tolérance de deux secondes observée dans le premier banc de Claude.

### Douze zones mécaniques

Les évaluations de rôle ci-dessous sont des **intentions qualitatives**, pas des résultats simulés. « Favorisé » ne veut jamais dire « obligatoire ».

| Zone | Mécanique | DPS | Contrôle | Soutien | Affinité recherchée |
| --- | --- | --- | --- | --- | --- |
| 1. La Chaussée des lanternes | Une cible résistante prépare des coups espacés ; un porteur fragile renforce brièvement sa garde. | Dégâts soutenus ou priorité sur le porteur. | Ralentir les coups et ouvrir une Rupture. | Tenir les coups puis utiliser sa conversion offensive. | DPS |
| 2. Les Fossés gris | Une érosion faible s’accumule jusqu’à trois charges et expire ; une purification la retire. | Abréger l’exposition, garder une réponse de survie. | Réduire les coups qui posent l’érosion. | Récupérer pendant les intervalles et purifier. | Soutien |
| 3. La Cour des trois coups | Deux coups ordinaires puis un coup renforcé annoncé ; longue récupération. | Conclure dans la récupération, garder un bouton défensif automatique. | Préparer la Rupture ou l’affaiblissement. | Placer une garde ou récupérer entre les coups. | Contrôle / soutien |
| 4. Les Vergers de verre | Deux renforts fragiles arrivent à des moments fixes, sans rendre le chef invulnérable. | Dégâts répartis ou poursuite du chef. | Neutraliser les renforts pendant la poursuite. | Absorber les renforts avec une offense adaptée. | DPS / contrôle |
| 5. Le Cloître des balances | Une garde renouvelée se dissipe, s’use ou expire ; la fin laisse une ouverture. | User la garde ou préparer ses gros impacts. | Dissiper, rompre ou affaiblir la transition. | Attendre la fenêtre en limitant les pertes. | Contrôle |
| 6. Les Fours de recuit | Exposition régulière et lourde charge ; une protection réellement utilisée aide à ouvrir la fenêtre suivante. | Passer la charge avec un outil défensif puis accélérer. | Affaiblir la charge et profiter de la Rupture. | Transformer une absorption réelle en poursuite. | Soutien |
| 7. La Salle des échos | Alternance de périodes de garde et de vulnérabilité assez longues ; les attaques ordinaires continuent. | Choisir la cadence qui exploite les périodes ouvertes. | Maintenir une pression utile entre les fenêtres. | Protéger pendant la garde puis convertir son aide. | Mixte |
| 8. Le Gué des plaies | Un éclat périodique laisse une affliction courte ; une purification aide sans être indispensable. | Prévoir une défense puis raccourcir le combat. | Affaiblir les sources de dégâts directs. | Réparer l’érosion et choisir la bonne protection. | Soutien |
| 9. La Chambre aux deux sceaux | Deux adversaires alternent le soutien de leur garde ; tous deux restent vulnérables. | Répartir les dégâts ou concentrer une proie. | Empêcher un soutien et ouvrir la seconde cible. | Tenir les deux puis gagner par poursuite. | DPS |
| 10. Les Terrasses de la vigie | Une frappe de cloche précède une garde courte ; la Stabilité ouvre une fenêtre offensive. | Préparer ses dégâts après la garde, absorber un choc. | Produire une Rupture quand elle compte. | Amortir la frappe et convertir la garde en attaque. | Contrôle |
| 11. L’Atelier des mauvais jours | Un auxiliaire soigne au plus trois fois ou renforce une défense finie, selon la variante annoncée. | Priorité sur l’auxiliaire ou débit offensif. | Interrompre, rompre ou dissiper. | Dépasser le soutien fini de l’ennemi sans mourir. | DPS / contrôle |
| 12. Le Belvédère des trois vents | Deux règles des zones précédentes, annoncées avant l’étape, sur un calendrier fixe. | Assembler poursuite et une réponse de sécurité. | Choisir les menaces à affaiblir. | Protéger les pics et conserver assez de dégâts. | Mixte |

### Les contraintes doivent rester franchissables de plusieurs façons

- Une garde a une quantité finie, une expiration ou une faiblesse à la Pression ; elle ne nécessite pas obligatoirement une dissipation.
- Un soin ennemi a **trois utilisations au maximum** dans les variantes qui en possèdent. Même si le soin retarde un soutien, il ne crée pas de combat perpétuel.
- Un renfort a des PV et des dégâts qui permettent de le cibler, l’affaiblir ou l’ignorer avec un coût. Il ne rend pas le chef invulnérable.
- Une purification facilite une zone d’affliction ; la protection, la récupération et une victoire plus courte restent possibles.
- Le contrôle fort n’est pas rendu inutile par toutes les rencontres : contre les boss il devient Pression, contre les renforts il agit normalement.
- Une zone ne réduit jamais « les soins de 100 % », « les dégâts physiques de 90 % » ou « tous les dégâts non-Givre ». Ces interdictions choisissent la classe à la place du joueur.
- Un même étage n’empile pas trois règles nouvelles. La douzième zone combine au plus deux règles déjà enseignées.

### La difficulté qui monte

Sur le premier circuit, il faut ajuster l’enveloppe de puissance à la vraie courbe niveau/équipement. Les 120 premières étapes ne sont donc pas chiffrées arbitrairement à partir de P = 100. On doit d’abord connaître le personnage débutant, la prise de voie 30, les premiers sets 40 et les vrais budgets 60/80/90.

Au-delà d’un point d’ancrage calibré — **120 dans l’exemple**, mais ce numéro est ajustable — une forme simple peut être :

`PV(s) = PV_ancre × 1,012^(s − ancre)`  
`Dégâts(s) = dégâts_ancre × 1,008^(s − ancre)`

Ces multiplicateurs portent sur l’enveloppe de la rencontre ; les parts de PV, dégâts et cadence des sous-ennemis sont normalisées pour ne pas créer un saut caché quand on change de thème. Les délais annoncés, la limite de ralentissement et les durées de contrôle ne sont pas multipliés. La progression ne devient pas une série de coups impossibles à anticiper.

| Distance après l’ancrage | Facteur de PV | Facteur de dégâts |
|---|---:|---:|
| +30 étapes | environ 1,43 | environ 1,27 |
| +60 étapes | environ 2,05 | environ 1,61 |
| +120 étapes | environ 4,18 | environ 2,60 |
| +240 étapes | environ 17,51 | environ 6,77 |

C’est une **illustration de pente**, pas la preuve que l’étape 240 résistera un mois. Il faut confronter les pentes à la vitesse d’XP, aux objets accessibles, aux achats de marché et aux meilleurs plans trouvés. Les scénarios de progression doivent inclure les jours 1, 7, 30 et 90, un casu, un joueur très actif et un personnage aidé par le marché du clan ; sinon « personne ne passe tout au premier mois » reste seulement une intention. Des records élevés peuvent rester impossibles sans nouveau contenu ; on n’augmente pas le plafond réel de progression uniquement en ajoutant des numéros.

La limite actuelle de combat est 240 s. Je la conserve pour le premier prototype. Les plans de soutien de référence doivent terminer confortablement les étapes de leur budget avant cette borne ; un timer n’a pas à être une pénalité invisible sur toutes les voies défensives. Les étapes d’usure ne sont pas conçues comme des soins à tenir pendant quatre minutes avec un ennemi immortel : l’objectif reste de vaincre.

### Mesurer la variété au lieu de la déclarer

Pour chaque budget réel, comparer neuf voies × au moins trois plans × douze zones, puis les enchaînements. Mesurer le record, les victoires fiables, le temps, les consommables et le nombre de changements de plan. Une modification qui fait gagner cinq étapes mais double le coût peut avoir une place ; une voie qui fait moins bien sur tous les critères n’en a pas.

Cible de revue, à discuter : un écart de record entre les meilleurs plans des voies de l’ordre d’un chapitre, pas de plusieurs circuits, à investissement comparable. Ce n’est pas un plafond artificiel appliqué au joueur. On ne baisse pas les statistiques d’un bon build pour respecter un graphique ; on examine les mécaniques et les plans des voies en difficulté.

## 13. Checkpoints, récompenses et rattrapage

### Une récompense par checkpoint, une fois par compte

Le record permanent et les récompenses sont communs au compte. Le record par classe sert à comparer ses essais, sans douze nouveaux coffres à chaque changement. Une réinitialisation de voie ne restaure rien à réclamer.

Les caches sont attribuées au moment de la victoire, avec un grade figé, borné par l’étape et le palier accessible à la classe qui l’a vaincue. Les réclamer plus tard ou changer de classe ne les améliore pas. Les caches d’équipement sont liées au compte et ne se recyclent pas ; elles aident l’équipement, sans devenir une machine à poudres par création de personnages.

| Première réussite | Proposition de récompense | Intention |
|---|---|---|
| Étape 10 | Un classique Rare, emplacement choisi, palier 10 maximum | Remplacer un mauvais départ sans donner un set |
| Étape 20 | Titre « A pris la route » + entrée de bestiaire | Premier souvenir visible |
| Étape 30 | Une réserve de matière au choix, budget 20 min de collecte du grade autorisé | Aider un achat ou une fabrication, une seule fois |
| Étape 40 | +1 % de Puissance de combat permanent | Premier jalon chiffré, sans économie |
| Étape 50 | Une gemme mineure au choix du grade autorisé | Faire découvrir un réglage |
| Étape 60 | Titre « La halte était facultative » + motif de profil | Objectif de collection |
| Étape 70 | Matière au choix, budget 30 min de collecte | Préparer une pièce ou un service |
| Étape 80 | Deuxième +1 % de Puissance de combat | Bonus cumulé : 2 %, jamais une nouvelle multiplication |
| Étape 90 | Une gemme majeure au choix, liée et non recyclable | Tester un talent ; ne remplace pas les futurs achats |
| Étape 100 | Apparence de bivouac ou bannière de personnage | Marquer la progression |
| Étape 110 | Matière au choix, budget 45 min de collecte | Dernier appoint de la première route |
| Étape 120 | Troisième +1 % de Puissance + titre « Les bornes ont des limites » | Fin des bonus de puissance de ce système |

Les étapes 130, 140… peuvent donner un titre de circuit, une variante de décor ou des jetons de collection non échangeables à cadence espacée. **Pas +1 % de puissance ou de production tous les dix niveaux pour toujours.** Les ressources ponctuelles du premier circuit représentent 95 minutes de collecte de référence au total, pas 95 minutes par famille de matière. Le choix porte sur un seul paquet équivalent, pas sur toutes les lignes à la fois.

Les +3 % de Puissance sont une option proposée qui respecte la demande de bonus plafonnés. On peut préférer les retirer avant le lancement pour garder la route entièrement collection/obtention ; ils ne sont pas une hypothèse nécessaire à l’équilibrage des recettes.

### Les bonus économiques évoqués par Louis

Je ne les activerais pas dans le premier morceau jouable. Ils lient deux progressions dont les courbes ne sont pas encore mesurées. Si on les garde ensuite : **trois jalons de +1 % au maximum**, réunis dans une seule catégorie plafonnée à 3 %, avec un parcours de métiers donnant exactement le même déblocage. Les deux accès partagent les mêmes identifiants de récompense ; ils ne s’additionnent pas.

Exemple : franchir un jalon de route **ou** terminer un carnet de maître de plusieurs métiers ouvre le même point. Cela évite de transformer le PvE en prérequis d’efficacité pour un joueur entièrement artisan. Cette catégorie serait nouvelle et doit être simulée avec les bonus Outil/Repas/Clan/Saison existants ; elle n’est pas cachée dans le +3 % de la Guilde du bourg.

### Rejouer, échouer et gagner de l’XP

Le replay n’accorde plus le coffre de checkpoint. Il peut fournir l’XP de classe selon le moteur, sans matériaux ni sets répétables supplémentaires. Le farm économique se fait dans les zones et donjons prévus pour cela.

Pour les échecs, proposition de départ : un crédit d’apprentissage **unique par étape et compte**, au plus égal à 20 % du temps de référence de cette étape, puis aucun nouveau crédit d’échec. La victoire suit la règle normale d’XP. On évite une ferme optimale contre un boss qu’on ne cherche jamais à battre. Ce plafond doit être comparé au système d’XP de classe que Claude intégrera ; il ne doit pas multiplier les revenus en alternant les voies.

Le rattrapage de classe reste celui du projet, encore à calibrer. La route déjà ouverte est accessible aux nouvelles classes, mais leur équipement exige leurs vrais niveaux et leurs réussites portent leur classe réelle dans le journal. Monter une seconde classe n’efface pas le record principal.

## 14. Mutations de saison : oui, avec une séparation claire

### Une branche saisonnière utilisant le même contenu

La route permanente garde ses étapes, mécaniques et récompenses. La saison ouvre une **route parallèle** avec les mêmes zones, une mutation annoncée et un record saisonnier. Le record de saison peut repartir lors de la suivante ; le personnage, ses classes, ses objets, son record permanent et ses récompenses acquises ne sont jamais remis à zéro.

On réutilise les douze zones et leurs gardiens. La mutation remplace ou ajuste **une** règle secondaire ; elle ne s’empile pas systématiquement sur les deux mécanismes d’une étape déjà dense. Les formations et la graine sont fixées pour la saison. Il n’y a pas de reroll payant ni de recherche du seed favorable.

### Six mutations possibles

| Mutation | Règle positive | Contrainte associée | Ce qu’on teste |
|---|---|---|---|
| Saison du Givre | Un ralentissement natif appliqué prolonge une petite fenêtre de faiblesse, avec délai interne | Les coups ordinaires espacés sont un peu plus lourds ; phases spéciales inchangées | Contrôle, garde et dégâts opportunistes, sans bonus exclusif aux dégâts Givre |
| Les Braises longues | Les afflictions autorisées durent plus longtemps, sans plus de cumuls | Les gardes ennemies sont un peu plus épaisses | Dégâts persistants ou Pression/dissipation, sans obligation Feu |
| Les Reflets | Une protection native réellement utilisée prépare une réplique offensive bornée | Les pics annoncés sont un peu plus fréquents, dans les limites de tolérance | Protections, prévention et choix du bénéficiaire |
| Le Temps creux | Après un court intervalle sans compétence, la prochaine attaque de base reçoit un bonus | Les fenêtres de vulnérabilité sont plus longues mais moins fréquentes | Place des attaques ordinaires, sans vider forcément son plan |
| La Double trace | Une cible secondaire vaincue laisse une faible ouverture sur le chef | Les renforts ont un peu plus de PV | Zones, priorité, poursuite et contrôle ; le chef reste attaquable |
| Les Liens francs | Alterner une action offensive et une action de soutien natives prépare un petit effet mixte | La régénération gratuite entre rencontres est plus faible | Hybrides et récupération ; éviter d’avantager exclusivement le soutien |

Les paramètres ne sont pas fixés ici. Chaque effet doit préciser origine, cible, plafond, délai et possibilité de déclenchement par l’équipement. Une réplique de mutation ne réactive pas sa propre condition ni tous les talents. Les plafonds ordinaires de ralentissement, bouclier et vulnérabilité restent valables.

### Récompenses et reruns

Récompenses : points de collection non échangeables, apparence de saison, titre, bannières et éventuellement une cache ponctuelle au budget limité. Aucun talent indispensable n’est enfermé dans six semaines de calendrier. Un ancien motif revient lors d’un rerun ; les nouveaux joueurs peuvent progresser vers la même collection.

Pour une première saison, six checkpoints espacés suffisent. Le prestige peut continuer, mais il ne donne pas davantage de vitesse économique. Les nouveaux arrivants reçoivent une entrée adaptée à leur palier et des objectifs accessibles ; le classement de record n’est pas la condition d’obtenir la collection de base.

La saison ne doit pas faire temporairement gagner des étapes permanentes plus faciles, puis laisser un record et des bonus économiques obtenus sous une règle disparue. C’est la raison principale de la branche séparée.

## 15. World boss : la Veille des Géants

### L’objectif collectif et les combats locaux

Je recommande un **front mondial ouvert pendant 72 heures**, avec des assauts automatiques de dix minutes. Tout joueur peut rejoindre pendant cette fenêtre, y compris en lançant sa participation avant de se déconnecter. On évite un boss ouvert dix minutes à une heure où la moitié du serveur dort.

Le boss possède une grande résistance de campagne partagée. Les personnages l’affrontent dans des assauts de un à quatre joueurs, avec leurs règles de niveau et leurs plans. Leurs résultats alimentent l’objectif mondial. Ce choix est important : **ce n’est pas un combat unique contenant cent personnages et cent effets simultanés**. Tout le monde contribue au même boss ; la simulation reste découpée en escouades, donc compatible avec l’asynchronisme et les protections à bénéficiaire.

Une version où cent joueurs combattent réellement dans la même instance demanderait une autre architecture, un ciblage de groupe différent et des règles de soutien spécifiques. Elle n’est pas promise par le moteur actuel et n’est pas nécessaire pour faire vivre un world boss.

Les PV affichés de campagne sont des unités normalisées, pas la somme brute de PV d’un monstre local. Les dégâts locaux alimentent ces unités à partir d’une référence de palier ; sinon un vétéran pourrait terminer l’objectif avant que les débutants aient participé. La normalisation doit rester monotone et plafonnée, sans donner plus de crédit à un mauvais build qu’à un bon au même palier.

### Trois géants pour commencer

| Géant | Particularité des assauts | Contribution de métiers associée |
|---|---|---|
| **Le Porte-Fanal** | Alternance de coups espacés et pluie d’éclats ; des fenêtres s’ouvrent après Rupture | Réparer et alimenter les balises : bois, verre, quincaillerie |
| **La Veuve de cuivre** | Renforts articulés et garde renouvelée ; choix entre les affaiblir ou poursuivre le corps | Préparer des outils de récupération et des cordages |
| **Le Grand Arpenteur** | Trois phases fixes : marche lourde, souffle, repos ; protections et contrôle ont des moments utiles | Relevés du terrain, vivres et consolidation des passages |

Ces géants sont du contenu futur. Le premier peut réutiliser un assemblage de silhouettes et d’effets ; aucun besoin de produire les trois avant de tester le système d’événement.

### Participation, mort et retour

Un assaut dure dix minutes au maximum. Le boss local est une représentation durable à laquelle on inflige des dégâts ; il n’est pas nécessaire de le tuer pour terminer un assaut. Ce mode doit donc avoir un résultat explicite « contribution terminée » distinct du « temps écoulé = défaite » des rencontres ordinaires.

À la mort, le personnage attend **soixante secondes**, puis revient automatiquement dans le même assaut. Cette attente consomme le budget de participation engagé ; elle ne produit ni XP de combat ni dégâts. Les cooldowns continuent, les préparations de classe sont purgées au retour et aucun coffre de mort n’est créé. Mourir ne doit pas réinitialiser les talents pour accélérer le rendement.

Un soutien évite du temps mort et permet à ses alliés de poursuivre ; un contrôle crée des Ruptures utiles ; un DPS transforme ces fenêtres en dégâts. Si la résurrection rend le soutien inutile, il faut revoir le coût de mort ou les profils d’attaque avant de multiplier les récompenses de soin.

Après plusieurs morts très rapprochées, le plan peut s’arrêter selon la politique préparée. Pas de destruction d’équipement, pas de dette de statistiques qui persiste pendant la nuit. L’usure et les consommables suivent uniquement le travail réellement effectué.

### Quatre canaux de contribution, pas une compétition de richesse

| Canal | Activité principale | Ce qui valide l’effort |
|---|---|---|
| Combat | Assauts de dix minutes | Présence effective dans la simulation, dégâts et aide réellement utiles |
| Récolte | Production dédiée à l’événement | Temps de récolte réalisé pendant la mission ; sorties affectées au front |
| Fabrication | Fournitures d’événement | Temps de fabrication et consommation du lot prévu |
| Logistique | Transport, relevés, organisation | Temps d’activité, parcours et fournitures définis |

Une mission de dix minutes donne une unité d’effort personnel. Acheter mille poissons puis cliquer sur « donner » n’en donne pas cent : les livraisons libres peuvent aider un objectif de collection du front, mais ne remplacent pas les opérations de temps qui ouvrent la récompense personnelle.

Les matières produites pour la mission sont consommées ou réservées à celle-ci ; elles ne sont pas vendues une seconde fois. Les fournitures utilisent des matériaux courants d’un grade adapté, sans trophée rare obligatoire. Un débutant a une mission accessible dès son entrée dans l’activité.

Pour le combat, les soins comptent seulement quand ils rendent des PV perdus ; les protections seulement sur les dégâts réellement absorbés ; l’affaiblissement sur les dégâts réellement évités ; la Pression selon son effet sur la Stabilité. Ni sursoin, ni bouclier jamais touché, ni auto-dégât créé par une gemme ne gonflent le score. Les contributions de contrôle ne sont pas comptées une seconde fois comme dégâts inventés.

Le score de détail explique le rôle et peut alimenter des distinctions cosmétiques. **La récompense de base suit l’effort validé**, pour éviter que le meilleur DPS accapare l’équipement de tous les autres. L’objectif mondial, lui, profite de la performance et de la complémentarité.

### Récompenses proportionnelles à l’avancée du serveur

Recommandation : une base personnelle, puis des seuils collectifs, par exemple 25/50/75/100 % de l’objectif annoncé. À chaque seuil, une petite partie supplémentaire de la récompense est ouverte pour les participants éligibles. Il n’existe pas de partage à somme fixe où rejoindre tard réduit le coffre d’un autre joueur.

Le budget économique personnel est borné à **soixante minutes d’effort par événement**, soit six missions de dix minutes. On peut les programmer en un bloc, sans six connexions. Au-delà, la contribution peut aider le serveur et le prestige, mais n’émet pas une nouvelle série de ressources. La base personnelle n’est pas perdue si le serveur n’atteint pas 100 %.

Au budget maximal : une cache de ressources régionales au choix plafonnée à l’équivalent de trente minutes de source normale, quelques points cosmétiques et une progression de collection. Aucun nommé exclusif de build, aucun bonus d’or illimité et aucun équipement supérieur aux profondeurs normales. Les quatre canaux ont le même plafond économique.

Les taux exacts et la part collective sont à calibrer. On peut commencer avec la seule collection et ajouter la petite cache une fois les flux mesurés.

L’objectif du serveur est calculé depuis une population active passée, annoncé avant l’ouverture puis figé. Il doit avoir un plancher praticable pour vingt joueurs et ne pas être relevé en direct parce que les participants font de bons résultats. Une chute brutale de population justifie une intervention annoncée, pas une modification cachée du dernier pourcentage.

Quand l’objectif est atteint, les assauts restent accessibles jusqu’à la fin de la fenêtre. L’animation peut montrer une forme affaiblie ou les rémanences du géant ; on ne supprime pas la participation des joueurs absents pendant la victoire. Le classement éventuel reste cosmétique.

### Finalisation hors ligne

L’événement doit enregistrer les engagements avant leur début. Un joueur ne rejoint pas après la clôture en demandant de compter ses dix heures précédentes. À la fermeture, le serveur règle toutes les missions déjà engagées et autorisées, puis fige les seuils collectifs et les coffres.

Un simple calcul à la consultation peut suffire au prototype, mais une tâche bornée de finalisation est probablement préférable pour annoncer le résultat sans attendre le retour de chaque participant. C’est une exception localisée à discuter avec l’architecture actuelle ; il ne faut pas lancer un combat en temps réel par joueur connecté pour résoudre ce besoin.

## 16. Clan : les Routes franches

### Une activité de clan qui parle aussi aux artisans

Le clan prend en charge une caravane sur une route de six étapes : un pont à consolider, un relais affamé, un passage dangereux, une cargaison à protéger, un atelier à remettre en service et une arrivée. On prépare l’itinéraire, les priorités et les rôles ; le parcours s’exécute en différé. Le combat fait partie des réponses possibles, mais **la victoire ne se réduit pas aux PV d’un boss**.

Les quatre familles d’ordres sont **Récolter**, **Préparer**, **Reconnaître** et **Escorter**. La Construction et l’Artificerie produisent des fournitures utiles quand ces métiers sont prêts ; elles ne bloquent pas le lancement. Le prototype peut utiliser pierre, planches, vivres et cordages déjà reliés aux filières.

L’instance de parcours possède trois ressources internes : intégrité de la cargaison, vivres et matériel. Une reconnaissance peut révéler une contrainte ou diminuer un risque ; une préparation protège le matériel ; une escorte réduit les pertes de rencontre. Ces jauges n’existent que dans ce mode, pas sur l’écran de combat ordinaire.

### Une route exemple

| Étape | Deux options préparées | Ce qui rend le choix intéressant |
|---|---|---|
| Pont de la Paille courte | Consolider avec le matériel ou passer par le gué | Économiser des vivres contre préserver les outils |
| Relais des Marmites vides | Livrer des provisions ou préparer un camp mobile | Soutenir le lieu ou préserver le stock de fin |
| Bois aux Faux Panneaux | Reconnaître le passage ou envoyer une escorte plus importante | Anticipation et répartition des ordres |
| Col des Trois Cordes | Treuil et cordages ou chemin long | Matériel contre consommation de vivres |
| Atelier sans patron | Remettre un outil en service ou garder des pièces de secours | Bénéfice différé ou sécurité immédiate |
| Porte du Dernier Péage | Protéger la livraison ou accomplir un objectif secondaire | Assurer la réussite ou chercher davantage de prestige |

Le péage n’est pas une dépense d’or destinée à acheter le classement. Le nom peut désigner une troupe, une formalité ou un ouvrage à franchir. On n’ajoute pas une taxe obligatoire au clan à la fin de sa semaine.

Chaque membre choisit son rôle et ses ordres à l’avance. Les officiers fixent les préférences de route avant le départ. Un imprévu utilise une politique préparée (« protéger d’abord la cargaison »), pas un vote à deux heures du matin.

### Deux usages du même système

**Parcours coopératif ouvert** : tous les membres volontaires participent sur une semaine. Les apports matériels sont consommés par l’objectif, avec un reçu clair ; aucun entrepôt commun retirable n’est nécessaire. Les seuils donnent de la décoration de halle, de l’histoire, une collection et éventuellement un petit paquet personnel borné. Les bonus de bâtiments existants restent dans leur plafond de 10 %. Aucune maintenance n’est exigée sous peine de perdre le clan.

**Parcours homologué, plus tard** : une route hebdomadaire commune, des règles comparables et un classement cosmétique. Ce second usage ne doit pas être développé avant qu’une campagne coopérative fonctionne.

### Pourquoi un classement unique de clans serait trompeur

Le total brut récompense surtout le nombre de membres et leur ancienneté. Diviser par le nombre de membres peut favoriser un minuscule clan d’élite et encourager à exclure les joueurs moins actifs. Le « meilleur clan » n’est donc pas un indicateur naturel qu’il suffit de calculer.

Je propose des divisions de **3, 6 ou 12 participants inscrits**, avec une seule équipe homologuée par clan et par semaine. Le clan choisit sa division ; les divisions ont leurs classements séparés. Les trois personnes d’un petit clan n’affrontent pas les trente membres d’un grand au score cumulé.

Le roster est figé avant le début de sa tentative. Quitter un clan, changer d’équipe ou rejoindre un autre clan ne réinitialise pas son éligibilité de semaine. La préparation peut être prévisualisée ; il n’y a pas cinquante tentatives classées dont on ne garderait que la meilleure graine.

### Budget de participation classée

Chaque inscrit dispose de **six ordres comptés de vingt minutes**, soit deux heures sur la semaine, exécutables en un engagement automatique. Ces ordres occupent l’activité principale. Ils ne sont pas six horaires de rendez-vous. Leur durée ne diminue pas avec un coup de fouet dans ce mode homologué ; ce serait sinon un avantage de calendrier ou de bonus externe.

Une opération joue une étape du plan préparé et consomme un ordre. Les décisions des membres et la route choisie déterminent l’efficacité ; leur vitesse de connexion ne donne pas de points. Pour un prototype, l’engagement des plans est complet avant la première résolution, puis les six étapes s’enchaînent sans attendre un membre absent.

Si une équipe inscrite ne peut plus terminer, les membres ne perdent ni équipement ni bâtiments. Leur tentative est simplement incomplète. Les remplaçants sont possibles **avant le départ**, pas après avoir vu le résultat d’une étape.

### Normaliser sans effacer les choix

Pour un classement censé comparer les décisions, je préfère un **catalogue de prêt commun** : mêmes budgets de statistiques, sélection d’outils de métier et de profils de combat disponible à tous les inscrits. Les identités de classe, les plans et les interactions de talents restent, mais la richesse ne fournit pas un chef-d’œuvre supplémentaire. Les opérations de récolte ou d’artisanat possèdent aussi des profils équivalents ; on ne normalise pas seulement les combattants.

Cela demande du contenu et de la validation. Si ce catalogue de prêt est trop lourd pour la première version classée, conserver des ligues de progression et annoncer qu’elles comparent des clans développés, plutôt que présenter des scores bruts comme une mesure de stratégie pure. Le mode coopératif ouvert utilise normalement les vrais personnages.

Les ressources du mode homologué sont une dotation interne de parcours ; on ne peut pas injecter cent mille lingots du marché pour rattraper une mauvaise décision. Le mode ouvert, lui, peut consommer des ressources réelles pour ses projets. Les deux registres de fournitures sont distincts et ne se convertissent pas l’un dans l’autre.

### Score et récompenses

Score proposé : **1 000 points par étape livrée**, plus l’intégrité finale de cargaison (0–100), plus des objectifs secondaires annoncés (0–50). Le temps de connexion et le premier arrivé ne départagent pas les égalités ; les ex æquo gardent le même rang. Les 150 points de bonus maximum restent inférieurs aux 1 000 points d’une étape : cinq étapes et tous les bonus donnent 5 150, moins que six étapes sans bonus (6 000).

Récompenses de rang : bannière, plaque de halle, emblème temporaire, titre et historique de saison. Récompenses de participation : collection accessible aux joueurs de toutes les divisions, avec la même valeur économique par personne. Pas +10 % de production pour le premier clan : un bonus de puissance récurrent transformerait sa victoire en moyen de gagner encore davantage.

Ce format ne résout pas tout : un compte n’est pas une preuve d’une personne distincte, les grands clans ont plus de candidats et la stratégie optimale peut être copiée. Les divisions, le budget fixe, une tentative et les récompenses cosmétiques réduisent les enjeux ; ils ne prouvent pas l’absence de multi-comptes ou de métagame.

## 17. Rythme d’un joueur et place de chaque spécialité

### Une semaine facultative, pas une liste de corvées

| Profil | Activité habituelle | Objectif choisi | Participation collective possible |
|---|---|---|---|
| Combattant | Zone ou donjon en autonomie | Un nommé, un meilleur jet, dix étapes solo | Une heure de world boss lors d’une fenêtre large |
| Récolteur | Matière demandée du grade choisi | Outil, titre de maître, carte ou atelier | Mission de récolte du front, ordre de Route franche |
| Artisan | Composants, équipements ou gemmes | Une vente, une signature, un nouveau patron | Préparation de fournitures ; pas besoin de changer de carrière |
| Hybride casu | Deux activités préparées selon ses besoins | Une pièce ou un checkpoint | Une escouade engagée avant déconnexion |
| Joueur de clan | Activité personnelle habituelle | Aménagement ou collection du clan | Deux heures classées facultatives sur une semaine |

Un joueur ne doit pas faire obligatoirement progression solo + donjon journalier + world boss + caravane pour que son équipement fonctionne. Le farm normal reste utile sans événement. Le world boss, les Routes et la saison ne sont pas trois nouvelles sources cumulatives de bonus économiques permanents.

Le canal métier des événements doit être amusant et visible : voir les balises réparées, les réserves livrées ou le convoi avancer. Ce n’est pas uniquement cliquer sur « donner 500 minerais » puis disparaître du tableau. Une ligne du journal et un aperçu de l’avancée peuvent créer cette présence sans demander de mini-jeu manuel.

### Trois exemples de boucles concrètes

**La chasse au premier set.** Le joueur fait quelques Forges, reçoit deux pièces intéressantes et des scories. Il vend un bon classique qu’il ne joue pas, achète une gemme et un troisième emplacement d’ensemble. Pour la quatrième pièce, il choisit entre continuer le donjon et acheter une fabrication. Il essaie le résultat sur sa zone solo d’usure, sans devoir changer de classe.

**L’artisane de clan.** Elle reste en Couture. Elle achète des fibres, des vestiges et un liant, fabrique une cape demandée et la met en vente. Elle répare aussi les textiles via le service. Lors du géant, elle engage une heure de préparation de fournitures ; elle reçoit la collection et le même plafond de récompense qu’un combattant. Sa classe peut rester peu montée.

**Le groupe qui joue en décalé.** Deux joueurs ont autorisé leurs plans pour quatre heures pendant la nuit. Un troisième prépare le parcours et rejoint leur escouade au créneau prévu. Chacun consomme son activité, sa durabilité et son stock choisi ; personne n’a besoin de regarder l’écran. Au retour, les trois reçoivent leurs résultats personnels et discutent de la salle où leur préparation a échoué.

## 18. Risques, arbitrages et ordre d’intégration

### Les points sur lesquels je conseille d’être ferme

| Risque | Choix recommandé |
|---|---|
| Tout le monde obligé de combattre pour mieux produire | Pas de bonus économique de route au premier prototype ; accès métier équivalent si ajouté |
| Craft rendu inutile par les pièces gratuites | Craft ciblé, volume de loot borné, signature et choix de modèle |
| Boss rendu inutile par le craft | Nommés non fabricables, vestiges régionaux, plaisir de la trouvaille |
| Classe obligatoire dans une zone | Plusieurs réponses ; rôle favorisé, jamais un contrôle de classe à l’entrée |
| Supports plus rapides et plus sûrs partout | Revoir leurs conversions et les vrais plans dans le moteur, pas ajouter une interdiction de rôle |
| Joueurs hors ligne inutilisables en groupe | Autorisations et instantanés d’escouade, sans clonage gratuit |
| Classement de clan acheté par dons | Récompenses cosmétiques et mode homologué à budget fermé |
| Retour à une corvée quotidienne | Pas de quota de donjon ; événements longs et programmation automatique |
| Serveur peu peuplé | Recours de matière, solo possible, ouverture progressive des filières |
| Trop de données avant un gameplay validé | Un petit morceau complet, puis extension des patrons |

### Décisions que Louis doit pouvoir prendre simplement

Les recommandations ci-dessous suffisent pour avancer dans une proposition sans arrêter le travail. Elles ne sont pas présentées comme déjà approuvées.

1. **Nommés** : butin + garantie + commerce, sans recette de fabrication V1.
2. **Donjons** : 1–4, répétables, aucun quota journalier.
3. **Hors ligne en groupe** : le personnage prêté engage son activité, une seule escouade.
4. **Solo** : douze thèmes, dix étapes par thème ; changer d’outils plutôt qu’imposer une autre classe.
5. **Bonus** : puissance bornée à 3 % optionnelle ; aucun bonus économique au début.
6. **Saison** : branche séparée, sans effacer les progrès permanents.
7. **World boss** : front large de 72 h, assauts de dix minutes, pas de combat simultané à cent acteurs.
8. **Clan** : commencer par la caravane coopérative, reporter le classement homologué.

### Un ordre qui permet de jouer et mesurer rapidement

| Étape | Livrable | Condition pour continuer |
|---|---|---|
| A | Relire ce dossier avec `integration.md`, conserver les décisions récentes | Contradictions écrites, politique de migration des anciens sets et noms |
| B | Niveau/XP de classe, statistiques réelles et une activité de combat, déjà au programme de Claude | Résultats de combat reproductibles avec le même moteur |
| C | Une douzaine de classiques et les préparations minimales de leurs métiers, loot/recyclage/vente | Un objet parcourt toute la boucle, pas seulement un bouton de test |
| D | Les six premières zones solo mécaniques, puis leurs checkpoints | Plusieurs plans de chaque voie ; aucun échec causé par un élément requis |
| E | Une Fonderie solo complète, deux ensembles et trois nommés | Comparer farm ciblé, parcours et craft sur temps/coûts/gains |
| F | Étendre les douze zones, les autres régions et les patrons | Vérifier la montée des grades et le marché à faible population |
| G | Escouades asynchrones de deux, puis quatre | Aucun double gain ni double engagement ; coût de calcul acceptable |
| H | Une mutation de saison | Record permanent indépendant et récompenses non duplicables |
| I | Un géant et une route de clan ouverte | Non-combattants réellement participants ; économie plafonnée |
| J | Classement homologué, variantes et davantage de contenu | Données d’usage suffisantes, catalogue de prêt et taille de population adaptés |

Le premier test peut n’exposer qu’un sous-ensemble du catalogue. Pour une ouverture publique où les trois classes fabriquent et achètent leurs pièces, les filières cuir/textile/bijoux doivent exister au moins dans leur forme minimale ; déclarer dix métiers « bientôt » tout en les exigeant dans toutes les recettes serait un blocage. Il faut donc distinguer test interne de filière et promesse publique « tout est fabricable ».

### Compatibilité avec de futures classes et le PvP

Les activités définissent des menaces, des cibles, des protections et des objectifs ; elles ne vérifient jamais `class_id == runist`. Une future classe utilise les mêmes contrats de dégâts, soins, Pression, priorité et temps. Sa nouvelle mécanique n’exige pas une treizième jauge permanente sur chaque monstre.

Les propriétés d’un effet, sa source et sa version restent explicites. Le PvP pourra avoir ses propres coefficients de contrôle et ses règles de match sans changer les récompenses des vieux donjons. Cette compatibilité est une discipline de conception, pas la promesse qu’un contenu PvE équilibré sera automatiquement équilibré en PvP.

## 19. Ce qui a été vérifié, et ce qu’il reste à mesurer

Les **20 vérifications locales** couvrent la couverture des 769 modèles, l’unicité des 4 293 recettes proposées, les quantités positives, les paliers, les métiers de sortie, les grades de vestiges, les emplacements légaux des ensembles et quelques calculs d’espérance et de temps de chaîne. Le rapport machine `verification.json` donne les résultats et les exclusions.

Le HTML a aussi passé quatorze contrôles de structure et d’interaction dans un DOM émulé : liens, calculateur, filtres d’ensemble, recherche et pente illustrative. Le rendu dans un vrai navigateur et les captures mobile/bureau n’ont pas pu être validés dans cet environnement ; le script Playwright correspondant est fourni pour le faire.

| Pièce d’ensemble 40 Épique | Chaîne ordinaire avec finition | Vestiges à cadence de référence | Total autonome de référence |
| --- | --- | --- | --- |
| Plastron | 121,98 min | 18,0 min | 139,98 min |
| Pourpoint | 114,15 min | 18,0 min | 132,15 min |
| Robe | 111,15 min | 18,0 min | 129,15 min |
| Marteau | 104,33 min | 18,0 min | 122,33 min |
| Arbalète | 91,3 min | 18,0 min | 109,3 min |
| Sceptre | 89,13 min | 18,0 min | 107,13 min |
| Anneau | 39,98 min | 6,0 min | 45,98 min |

Ces coûts additionnent les étapes d’un autonome, avec les fibres sauvages et le tannage lent ; ils ne décrivent pas le délai d’une commande passée au marché. L’Agriculture en parallèle peut modifier la chaîne textile. Les sept exemples n’établissent pas l’équilibre de tous les grades.

Les petits calculs de chaînes ne constituent pas une économie simulée : ils utilisent des durées de récolte simples, l’Agriculture hypothétique, aucune vente, aucun prix, aucun bonus et aucun chef-d’œuvre. Ils servent à rendre les coûts critiquables et modifiables.

**N’ont pas été testés ici** : les douze zones dans le moteur, les groupes de quatre, la consommation réelle d’une absence, l’économie des prix, la normalisation de world boss, la caravane et ses stratégies, le classement ou les tentatives de multi-comptes. Les chiffres de combat de Claude au commit examiné portent encore sur les six profils précédents. Aucun nouveau résultat de 29 160 combats n’est attribué à ce dossier.

### Scénarios que Claude devrait essayer ensuite

- À même budget réel : neuf voies × trois plans × douze thèmes, avec et sans optimisation des horaires, puis en séquences de salles.
- Quatre DPS, quatre soutiens, quatre contrôles et groupes mixtes ; perte d’un participant entre deux parcours.
- Une absence résolue d’un coup et en plusieurs requêtes ; annulation, expiration d’autorisation et crash après une salle.
- Un artisan pur qui achète ses vestiges et vend ses pièces ; un combattant pur qui achète tout ; un autonome qui réalise la chaîne.
- Serveur de vingt joueurs sans tailleur avancé ; pénurie d’encre ; surplus de cuir ; baisse de moitié des actifs.
- Farm d’un vieux grade très rapide : impossibilité d’obtenir une matière, un trophée ou une cache de grade supérieur.
- Garantie d’un nommé au milieu d’une série de trois jets ; changement de cible ; reprise après crash sans nouveau tirage.
- Soin excédentaire, bouclier jamais utilisé, auto-dégât et Pression refusée par la récupération : aucun crédit d’événement artificiel.
- Mutation qui expire pendant un assaut : ancienne version conservée pour le résultat, aucun checkpoint reçu deux fois.
- Clan qui change ses membres, divisions ou personnages après inscription : éligibilité conservée et tentative unique.

## 20. Sources et transmission à Claude

Le catalogue et les chaînes sont figés sur `cfa4b9e` ; la relecture de `integration.md` à `5077fa7` est conservée séparément dans `sources.json`. Les cinq commits suivants portent sur le combat et l’interface, sans modification de `gear.yaml` ni des recettes étudiées.

Sources principales du dépôt : `CLAUDE.md`, `docs/design/coeur-du-jeu/integration.md`, `docs/design/metiers.md`, `economie.md`, `marche.md`, `monde.md`, `combat-items.md`, les données `settings`, `professions`, `gear`, `gear_slots`, `items`, les recettes et les règles de combat. Le manifeste `sources.json` conserve le commit et les empreintes des fichiers lus.

Le dossier « Le cœur du jeu » fournit les identifiants des dix-huit ensembles, des vingt-quatre nommés, des dix-huit gemmes majeures et les 298 variantes de modèles. Ce complément conserve leurs identités mécaniques ; il n’ajoute pas de talents de combat non relus sous prétexte de remplir des recettes.

### Message de reprise

> Lis ce complément avec le dossier « Le cœur du jeu » et ton `integration.md`. Les nouvelles règles sont proposées, pas toutes validées. Préserve les décisions récentes, notamment recyclage combat, commandes sans matériaux fournis, activité unique et éléments sans résistances ennemies. Les 4 293 recettes résolues sont un export de conception à partir de matières préparées, pas un fichier à importer directement. Commence par une boucle jouable avec vrais objets, loot, craft et vente, puis une route solo et un donjon. Les world boss, la caravane et le classement sont des extensions. Donne des résultats issus du moteur réel, garde les échecs et distingue ce qui est simulé de ce qui est seulement proposé.

## 21. Fournitures concrètes et consommation collective

Ces recettes complètent les patrons d’équipement. Elles donnent des débouchés récurrents sans mettre un vestige de boss dans chaque plat. Les quantités ci-dessous sont de grade courant, sauf mention d’un grade choisi. Les missions d’événement consomment ensuite la fourniture ; on ne compte pas sa fabrication passée comme dix minutes d’effort événementiel gratuites.

| Fourniture | Métier / niveau proposé | Recette | Temps final | Usage |
|---|---|---|---:|---|
| Cordage renforcé | Couture 1 | 8 fils + 1 cuir | 30 s | Passage, logistique, Exploration ; alternative simple au treuil |
| Caisse de vivres | Cuisine 5 | 4 poissons + 2 herbes + 2 céréales | 60 s | Un ordre logistique ; choix de transport plutôt que buff cumulable |
| Fiole, lot de 2 | Alchimie 1 | 2 sables + 1 charbon ou charbon de bois | 20 s | Potions et fournitures, sans marchand de fioles infinies |
| Lot de consolidation | Construction 1 | 4 pierres + 2 bois préparés + 2 métaux | 90 s | Projet ouvert, pont, réparation de parcours |
| Balise de campagne | Artificerie 10 | 3 bois préparés + 2 fioles + 2 métaux | 90 s | World boss et reconnaissance ; une préparation simple reste disponible sans Artificerie |
| Treuil de voyage | Artificerie 30 | 6 métaux + 4 bois préparés + 2 cordages | 180 s | Option de route, jamais une clé obligatoire de donjon |
| Panneau de bannière | Couture 10 | 8 tissus + 2 fils + 1 pigment | 90 s | Décor et collection de clan, aucun bonus caché |
| Élément d’atelier | Construction 20 | 10 bois préparés + 4 pierres + 4 métaux + 2 tissus | 240 s | Aménagement volontaire, pas d’entretien à l’absence |

La céréale vient de l’Agriculture, le pigment d’une plante tinctoriale ou d’une préparation d’Alchimie ; ces deux filières doivent être ouvertes avant les recettes concernées. Au premier prototype, une caisse de poisson et d’herbes peut servir d’alternative explicite de vivres. Un tréteau simple remplace un élément d’atelier avancé pour les premières missions.

Pour des consommables de combat, je limiterais la première livraison à **un repas et une potion** :

- **Ragoût de marche** : Cuisine 10 ; 3 poissons ou viandes + 2 herbes + 2 céréales, 60 s, une heure d’usage effectif. Point de départ à tester : +3 % de PV maximum. Un seul repas de combat ; pas de cumul avec une autre nourriture de combat.
- **Potion de secours** : Alchimie 10 ; 4 herbes adaptées + 1 fiole, 30 s. Point de départ à tester : rend 8 % des PV maximum, utilisation automatique sous 35 % de PV, délai de 90 s. Le joueur borne son stock d’usage ; pas de potion déclenchée à chaque seconde.

Ces effets ne sont pas ajoutés au simulateur de combat fourni et doivent être testés avec les soutiens : une potion trop généreuse peut remplacer gratuitement leur rôle. Les repas de travail actuels gardent leur propre catégorie ; l’interface doit montrer clairement quel repas agit pendant l’activité courante. Je ne recommande pas de lancer simultanément dix qualités de potion et dix séries de buffs de nourriture.

La campagne de clan ouverte peut consommer ces fournitures réelles ; le parcours homologué utilise sa dotation interne. Les missions de world boss possèdent leurs recettes d’engagement liées à l’événement et leurs durées de dix minutes ; elles n’attribuent pas un score proportionnel au nombre de treuils préfabriqués dans une banque.
