# Bramo — le cœur du jeu

**Classes, voies, sorts, combat automatique, contenu PvE, équipement et obtention.**

Proposition complète de conception · 21 octobre 2026 · version 0.2 · destinée à Louis et Claude.

**Tout ce qui est nouveau dans ce dossier est proposé, pas encore approuvé ni implémenté.** La conversation récente de Louis prime sur les anciens textes du dépôt. Le dépôt reste inchangé.

Le choix central est de donner à chaque classe une mécanique présente dès les premiers combats, transformée par ses voies, puis enrichie par les objets. Les trois classes peuvent partager une partie de leur équipement sans partager leur fonctionnement. Les ennemis valorisent ces différences et la préparation du plan ; ils ne demandent aucune action pendant le combat.

Le dossier contient une cible de contenu complète et un banc de conception reproductible. **Ce banc est indépendant du moteur TypeScript actuel.** Il vérifie des interactions et donne des premiers écarts ; il ne certifie ni l’équilibrage du jeu publié, ni le marché, ni le PvP.

## 1. La proposition en une page

Le Forgefeu accumule jusqu’à trois Braises avec ses Chauffes et choisit comment les dépenser avec ses Trempes. Le Traqueur ouvre un Angle mort sur une Proie puis l’exploite avant sa disparition. Le Runiste lit la rune laissée par le sort précédent et écrit la suivante : l’ordre des sorts devient une grammaire.

Chaque classe a trois voies : dégâts, contrôle, soutien. Une voie transforme l’usage de la mécanique de classe ; elle n’ajoute pas simplement « +10 % de dégâts ». Chacune garde accès aux compétences communes qui lui permettent de se défendre, d’affaiblir un ennemi et de finir un combat seule.

Le joueur prépare quatre sorts avant le niveau 30, puis cinq. Il règle leur première utilisation et leur ordre de priorité. Après l’ouverture, leurs cooldowns déterminent les lancements automatiques. L’ultime du niveau 75 occupe une des cinq places : ce n’est pas une sixième compétence gratuite obligatoire.

| Ensemble du projet | Contenu proposé |
| --- | --- |
| Classes et voies | 3 classes, 9 voies ; une mécanique centrale et un passif de voie distinct |
| Compétences | 66 sorts : 22 par classe, dont 12 communs, 9 répartis entre voies, 1 ultime |
| Choix dans une voie | 16 sorts accessibles à terme, 5 équipés ; les sorts des deux autres voies sont exclus |
| Ensembles | 18 : 12 partagés et 2 propres à chaque classe ; 8 pièces possibles par ensemble, bonus 2/3/4 |
| Pièces | 144 pièces canoniques, déclinées en 298 modèles de silhouette ou d’arme ; chiffres de statistiques à calibrer |
| Nommés | 24 talents fixes : 6 armes par classe et 6 colliers universels |
| Gemmes | 18 majeures et 8 familles de mineures statistiques |
| PvE | 6 régions, 18 adversaires marquants, 6 parcours de donjon ; profondeurs permanentes |
| Plans d’exemple | 27 assemblages, avec choix de sorts aux paliers 40 et 80 et équipement complet |
| Vérification | 273 associations 4+4 possibles avec une arme et un collier nommés réservés ; banc de combat et recherche d’assemblages joints |

Je garde des sets communs parce qu’ils ouvrent des croisements intéressants. J’ajoute six sets de classe parce qu’une mécanique propre mérite aussi des objets capables de la transformer. **Aucun ensemble n’est réservé à une voie.** Un Enclumier peut chercher des dégâts ; un Tue-Bête peut chercher de la sécurité ; un Glyphiste peut construire une alternance offensive.

Le contenu démarre modestement dans la version à coder : un adversaire de chaque grand type et un donjon suffisent à vérifier le système. La cible de contenu décrite ici sert à éviter de construire cette première version dans une impasse.

## 2. Ce que le dépôt fait réellement et les arbitrages repris

| Sujet | État de référence | Traitement dans ce dossier |
| --- | --- | --- |
| Classes | Trois classes affichées, poses et tenues ; aucun kit complet exécuté | Les trois mécaniques et les neuf passifs sont nouveaux |
| XP de classe | Prévue uniquement au combat, niveau propre à chaque classe | Conservé ; métiers et armes ne donnent pas une nouvelle XP de combat |
| Voies | Dégâts / contrôle / soutien au niveau 30 ; noms proposés | Conservé ; noms de voies encore modifiables |
| Équipement | 769 modèles, paliers 1/10/20, exemplaires, équipement et totaux | Conserver le socle ; ce dossier ajoute une conception de contenu 20+ et 40+ |
| Talents nommés | Ancien texte : talents uniquement dans les gemmes | Dernière demande de Louis : talent fixe autorisé, remplaçant une majeure |
| Ensembles | 7 définitions illustratives ; ancien texte limité aux 7 vêtements | Proposition : inclure bijoux et armes ; redéfinir les effets avant de les rendre exécutables |
| Gemmes et combat | Exemples de design, pas de moteur complet | Le banc joint est un prototype de règles, pas une intégration au jeu |
| Hors ligne | 100 %, 16 h d’autonomie, une activité à la fois | Conservé ; combat et progression de métier restent des activités distinctes |
| Commerce | Entre joueurs ; pas de rachat PNJ, outils de bronze de secours | Pas de création d’or par le butin ; composants et équipement échangeables |
| Usure | 150 h de combat prévues pour les pièces ; réparation sans destruction | Conserver ; mettre en pause une répétition avant un équipement devenu inutilisable |
| Artisanat | 7 métiers jouables ; autres filières encore en chantier | Définir leurs débouchés sans prétendre qu’ils existent déjà |
| Personnages | Un personnage par compte, plusieurs niveaux de classe conservés | Les builds et classes sont des profils du même personnage ; pas de production parallèle ajoutée |

Référence vérifiée : [Kairoli/Bramo, commit 706f70a](https://github.com/Kairoli/Bramo/tree/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0). Les versions des fichiers lus sont consignées dans `sources.json`.

Certaines sections historiques de `CLAUDE.md`, `game-design.md` et `monde.md` mentionnent encore une ligne aléatoire unique, une spécialisation supplémentaire au niveau 60, des pertes de durabilité maximale ou d’anciennes saisons. Elles sont dépassées par les décisions plus récentes. Le moteur d’exemplaires et la dernière table de rareté prévoient bien plusieurs lignes aléatoires.

Le bonus de métier de classe reste plafonné et extérieur à la mécanique de combat. Un joueur n’a pas à monter Forge pour que ses Braises fonctionnent, ni Chasse pour obtenir son compagnon de combat, ni Enchantement pour lire ses runes.

## 3. Le combat automatique : un contrat précis

### Le plan

Un plan contient les compétences équipées, leurs délais de première utilisation, leur ordre de priorité, la priorité des cibles et celle des bénéficiaires des protections/soins. Aucun changement de pièce ni aucun clic n’est attendu pendant la rencontre.

Je traduis « première rotation puis cooldowns » par une **ouverture** : chaque compétence équipée se lance une première fois à partir de son horaire ; les répétitions commencent lorsque cette ouverture est terminée. Les cooldowns démarrent dès le lancement de chaque sort et continuent pendant l’ouverture. Ils ne sont pas remis à zéro à sa fin. C’est une proposition d’interprétation à valider, car « première autorisation indépendante » serait une autre règle possible.

| Sort | Première utilisation | Cooldown sans Cadence | Ce qui se passe |
| --- | --- | --- | --- |
| A | 0 s | 8 s | Prêt de nouveau à 8 s, attend la fin de l’ouverture |
| B | 4 s | 12 s | Prêt à 16 s |
| C | 10 s | 20 s | Clôt l’ouverture ; prêt à 30 s |
| A, deuxième lancement | 11 s | 8 s | La récupération globale de C prend 1 s ; A n’attend pas 18 s |
| B, deuxième lancement | 16 s | 12 s | Suit son propre cooldown |
| A, troisième lancement | 19 s | 8 s | Suit désormais ses répétitions |

Les sorts sont instantanés à leur résolution, mais deux compétences du même personnage sont espacées d’au moins une seconde. L’attaque de base continue sur sa propre cadence ; elle n’annule pas un sort. Si plusieurs compétences sont prêtes, la plus ancienne échéance passe d’abord, puis l’ordre du plan départage les égalités. Un décalage fait partir le nouveau cooldown depuis le lancement réel : il n’existe pas de « rattrapage » de plusieurs lancements empilés.

Une place peut rester vide. Le jeu ne doit pas obliger à ajouter un mauvais sort simplement pour remplir cinq cases. Les horaires conseillés doivent rester utilisables sans réglage fin ; un intervalle supérieur à plusieurs secondes déclenche une explication dans l’éditeur, pas une interdiction.

### Cibles, groupes et fin de rencontre

Priorité de base : ennemi principal, puis cible suivante vivante. Le joueur peut préférer un soigneur, un renfort fragile ou un adversaire qui charge. On ne change pas sa cible pour obtenir artificiellement un bonus « nouvelle Proie » : il faut réellement désigner un autre ennemi. Soins et protections visent un bénéficiaire vivant selon le plan ; en solo, le porteur est toujours éligible.

Un effet ciblant une autre cible précise son comportement quand il n’y en a pas. Aucun effet ne copie silencieusement tous les dégâts d’une attaque de zone. Par défaut, les cibles secondaires d’une compétence reçoivent 55 % de ses dégâts et de ses afflictions ; les contrôles annoncés affectent toutes les cibles touchées. Une ressource de classe dépensée renforce la cible principale seulement, sauf mention explicite.

Dans un parcours, les cooldowns continuent entre salles. Le délai de première utilisation de la salle est une borne minimale, jamais un bouton qui rend disponible un sort encore en recharge. Le personnage dispose d’un repos automatique fixe entre rencontres, à calibrer avec les soins ; il ne suffit pas de quitter puis revenir pour réinitialiser sa puissance. Une défaite mène à une récupération puis à un nouvel essai, ou à une pause après des échecs répétés selon le choix du joueur. Pas de perte d’objets ou de progression.

**Le banc joint teste des rencontres isolées.** Le repos, les cooldowns conservés dans tout un donjon et les tentatives successives doivent être vérifiés dans le moteur réel avant de chiffrer les gains à l’heure. Il ne faut pas multiplier un résultat de duel isolé par mille en supposant ces transitions déjà résolues.

### Préparation et tolérance

Les boss annoncent des phases assez longues pour être couvertes par plusieurs réponses. Les timings optimaux améliorent une rencontre ; ils ne doivent pas transformer un décalage d’une seconde en mort assurée. Un contrôle lancé hors de la charge reste utile par sa Pression. Une garde posée tôt peut protéger les coups ordinaires ou récompenser son expiration. Un soin tardif peut récupérer le choc.

Je n’ajoute pas de mana générique commun aux trois classes. Les Braises, Angles et runes donnent déjà une préparation significative ; les cooldowns limitent les soins et les contrôles. Une deuxième barre de ressource sans décision propre alourdirait le jeu.

## 4. Les unités, les statistiques et les règles communes

**P désigne la Puissance utilisée pour résoudre l’effet.** Ce n’est ni le dernier critique, ni les PV maximum, ni le total d’une attaque de zone. Une mention « 0,35 P » produit un montant prévisible, ensuite réduit par les défenses applicables. Les déclenchements d’équipement ne critiquent pas et ne deviennent pas plus forts avec la taille du dernier coup d’arme.

Dans le banc, P vaut 100 et les PV 2 800. Les références 40 et 80 indiquent **les sorts accessibles**, avec les mêmes statistiques normalisées. Elles ne simulent pas la véritable puissance d’un personnage 40 contre un monstre 80. La courbe des statistiques par palier et les coefficients de conversion de l’équipement restent à construire depuis les objets actuels.

| Statistique | Rôle | Limite de conception proposée |
| --- | --- | --- |
| Puissance | Dégâts, soins et boucliers natifs | Un score de base commun évite une puissance de soin totalement inutilisable en solo |
| Vitalité | Réserve de PV | Ne multiplie pas les dégâts des talents ni des ripostes |
| Défense | Réduit les dégâts reçus | Conversion à rendement décroissant ; asymptote 45 % avant autres réductions |
| Cadence | Attaques de base et cooldowns des compétences | Rendement décroissant ; asymptote +35 % de vitesse ; ne réduit pas les délais internes des talents |
| Critique | Chance des impacts primaires | Plafond initial proposé 50 % ; afflictions et procs exclus |
| Dégâts critiques | Valeur des critiques | Base 150 %, plafond initial proposé 200 % ; le banc utilise 160 % |
| Ténacité | Durée des contrôles reçus | Ne rend pas totalement immunisé ; ne supprime pas une mécanique de boss |
| Pénétration | Ignore une fraction de Défense | N’ignore jamais toutes les réductions et tous les boucliers |
| Bonus élémentaire | Amplifie un type existant | Ne change pas le type d’une arme, n’invente ni sort ni statut |
| Puissance de soutien | Augmente soin et protection | Affixe de spécialisation, au prix d’une ligne offensive |
| Pression | Retire de la Stabilité aux adversaires concernés | Pas de mise à l’échelle avec les PV ni de multiplication par projectile |

Formes proposées : `réduction de Défense = plafond × score / (score + K du palier)` ; même forme pour la Cadence. Un cooldown vaut `cooldown de base / (1 + Cadence)`. Les pourcentages d’une même catégorie s’additionnent avant application ; les catégories de mitigation et les limites sont explicites. Les plafonds ci-dessus sont des hypothèses de départ, pas des décisions déjà prises par Louis.

Le banc utilise 25 % de réduction pour le joueur, 10 % pour les ennemis, 20 % de critique et 12 % de Cadence avant effets. Les résistances élémentaires, la Ténacité contre les contrôles reçus et les véritables jets d’affixes ne sont pas simulés. Une résistance PvE doit rester modérée : une région glacée peut être moins favorable au Givre, elle ne doit pas être entièrement immunisée à ce type.

### Armes et cadence

Les compétences restent celles de la classe avec toutes ses armes compatibles. Le visuel s’adapte : une Poursuite du Traqueur peut être un tir ou une lame lancée. L’épée et le bouclier sont un seul objet avec un seul budget, pas deux emplacements cachés. La distance affichée ne donne pas automatiquement une défense dans un combat sans déplacement.

| Famille | Intervalle de base proposé | Normalisation |
| --- | --- | --- |
| Marteau | 2,4 s | Dégâts de base = 0,62 P × intervalle / 2 s |
| Épée et bouclier | 2,0 s | Dégâts de base = 0,62 P × intervalle / 2 s |
| Hache | 2,0 s | Dégâts de base = 0,62 P × intervalle / 2 s |
| Arc long | 2,2 s | Dégâts de base = 0,62 P × intervalle / 2 s |
| Arbalète | 2,4 s | Dégâts de base = 0,62 P × intervalle / 2 s |
| Dagues | 1,8 s | Dégâts de base = 0,62 P × intervalle / 2 s |
| Bâton | 2,2 s | Dégâts de base = 0,62 P × intervalle / 2 s |
| Sceptre | 2,0 s | Dégâts de base = 0,62 P × intervalle / 2 s |
| Grimoire | 2,0 s | Dégâts de base = 0,62 P × intervalle / 2 s |

Ces intervalles restent proches pour contenir les écarts de déclenchement. Une arme rapide ne doit pas doubler les talents et une arme lente ne doit pas recopier son gros impact dans tous les procs. La Cadence modifie les intervalles réels ; les plafonds de fréquence des talents restent intacts. Le banc utilise bien la famille de l’arme nommée du plan, avec des dégâts de base normalisés. Le Runiste choisit l’élément de son attaque de base dans son plan ; le banc prend l’élément dominant des sorts, sans l’imposer à son bâton.

## 5. Les trois mécaniques de classe et les neuf voies

### Forgefeu — Le cycle de forge

**État visible : Braises : 0 à 3.**

Les gestes de Chauffe donnent une Braise. Les gestes de Trempe consomment les Braises présentes et ajoutent 0,15 P de dégâts par Braise à leur cible principale. Une Trempe fonctionne aussi sans Braise. Les Braises ne décroissent pas pendant une rencontre.

**Pourquoi le choisir :** Préparer une réserve puis choisir quelles frappes ou protections en profitent.

**Ce qui demande un choix :** Enchaîner trop de Chauffes à trois Braises gaspille de la préparation ; trop de Trempes laisse les suivantes peu renforcées.

| Voie proposée | Rôle | Passif et fonctionnement |
| --- | --- | --- |
| Trempe-Rouge | Dégâts | **Rebattue** — Une Trempe réserve 0,12 P par Braise pour chacune des trois prochaines attaques de base, pendant 8 s. Une nouvelle Trempe remplace la réserve restante, sans addition. |
| Enclumier | Contrôle | **Le poids du métal** — Une Trempe ajoute 6 points de Pression par Braise, réduit la prochaine attaque directe de la cible de 8 % par Braise pendant 6 s et prépare une Assise. Le prochain geste de Chauffe ajoute 0,30 P par Braise dépensée. Une Assise remplace la précédente ; elle expire après 8 s. |
| Rémouleur | Soutien | **Plaques de recuit** — Une Trempe produit une réserve de protection de 0,16 P par Braise, pour 6 s. À sa première absorption réelle, la plaque riposte pour 0,12 P par Braise. Une plaque, un bénéficiaire, une riposte ; remplacer une plaque ne déclenche rien. |

Les voies changent ce qui suit une Trempe : attaques de base renforcées, prochaine Chauffe qui profite d’une Assise, ou plaques qui rendent un vrai coup. Le choix porte aussi sur le nombre de Chauffes et de Trempes équipées. Cinq grosses Trempes ne forment pas automatiquement un bon build ; elles se partageraient une préparation insuffisante.

Un Rémouleur reste un combattant. Son rôle de réparation évoqué dans l’ancien document peut demeurer un service d’artisanat, mais il ne remplace pas ce kit de soutien de combat. Les soins et plaques ne demandent pas de consommer des lingots à chaque attaque.

### Traqueur — La poursuite

**État visible : Une Proie, un Angle mort.**

La priorité de cible du plan désigne une Proie. Un geste de Repérage lui ouvre un Angle mort pendant 6 s. Un geste de Poursuite consomme un Angle déjà présent pour ajouter 0,30 P de dégâts. Les attaques de base ne le consomment pas. Répéter Repérage renouvelle la durée sans cumuler des Angles.

**Pourquoi le choisir :** Organiser les pièges, tirs et interventions du compagnon pour exploiter les bonnes ouvertures.

**Ce qui demande un choix :** Une ouverture peut expirer avant sa Poursuite ; changer de cible abandonne son Angle. À la mort de la Proie, un Angle non consommé peut rejoindre la prochaine cible, pour 3 s au plus.

| Voie proposée | Rôle | Passif et fonctionnement |
| --- | --- | --- |
| Tue-Bête | Dégâts | **La morsure après le trait** — Consommer un Angle ajoute un Saignement personnel de 0,42 P sur 6 s. Une seule morsure de ce passif par cible ; renouveler remplace la durée et le montant restant. |
| Piégeur | Contrôle | **Contrepiège** — Consommer un Angle pose un Contrepiège pendant 6 s : la prochaine attaque directe de la cible est réduite de 25 % et déclenche 0,35 P de dégâts. Le geste ajoute aussi 10 points de Pression. Un Contrepiège par porteur et cible. |
| Meneur de meute | Soutien | **À mon signal** — Consommer un Angle prépare un Ordre de meute pendant 8 s. La prochaine compétence de compagnon ajoute 0,50 P de soin et 0,35 P de dégâts. Un Ordre créé par cette compétence attend la suivante ; le compagnon ne demande aucun métier. |

Un Angle n’est pas une Braise rebaptisée : il appartient à une cible, n’a qu’un état ouvert/fermé et impose une fenêtre courte. Une Proie n’est pas non plus une Marque partagée de l’équipement. Certaines compétences appliquent les deux, mais les mécanismes restent distincts.

Le compagnon est un mode d’action du Traqueur. Il n’ajoute pas un second personnage, une seconde file d’activités ou une usine de déclenchements autonomes. Ses interventions sont des compétences du plan. La Chasse reste un métier idle de récolte indépendant du combat. Le second type de dégâts choisi ici est provisoirement la Foudre pour rester dans les quatre types existants ; Nature reste une question ouverte, pas un cinquième type ajouté silencieusement.

### Runiste — La phrase runique

**État visible : Une rune précédente : Trait, Cercle ou Sceau.**

Un sort lit la rune laissée par le précédent, puis écrit sa propre forme. Trait ajoute 0,16 P de dégâts à la cible principale ; Cercle ajoute 0,08 P à deux ennemis au plus et un ralentissement de 10 % pendant 2 s ; Sceau protège un bénéficiaire pour 0,20 P pendant 4 s. Le premier sort ne lit aucune rune. Les attaques de base ne lisent ni n’écrivent. La forme et l’élément sont indépendants.

**Pourquoi le choisir :** Composer des séquences dont les effets changent avec l’ordre des sorts, en restant libre sur les éléments.

**Ce qui demande un choix :** Les collisions de cooldowns peuvent changer la phrase ; un sort utile isolément ne profite pas forcément de la rune disponible.

| Voie proposée | Rôle | Passif et fonctionnement |
| --- | --- | --- |
| Fulgurant | Dégâts | **Le dernier mot** — Chaque troisième sort ajoute un Dernier mot : 0,65 P de dégâts. Avec une rune Cercle lue, le montant se partage entre deux ennemis ; sans seconde cible il reste entier sur la première. Avec Sceau lu, 0,15 P du montant devient un bouclier. Aucun élément imposé. |
| Sigillaire | Contrôle | **Mise sous scellés** — Une action de classe qui ralentit, étourdit ou retire réellement de la Stabilité pose un Scellé, une fois par action. À trois Scellés : 0,75 P de dégâts et un Interdit qui réduit la prochaine attaque directe de la cible de 30 %, pendant 6 s. Les contrôles des gemmes ne posent pas de Scellés. |
| Glyphiste | Soutien | **L’encre de garde** — Les dégâts réellement absorbés par les boucliers de compétences du Runiste alimentent une Encre, plafonnée à 0,65 P. Le prochain sort de forme Trait ou Cercle dépense cette Encre en dégâts. Les boucliers de rune Sceau comptent ; ceux de l’équipement ne comptent pas. Ni expiration ni sursoin ne créent d’Encre. |

Les formes de rune ne sont pas des éléments. Un Trait peut être de Feu, Givre ou Foudre ; un Cercle peut ralentir par sa géométrie sans faire de dégâts de Givre. Un Sigillaire peut donc composer un plan de Givre, mais aussi contrôler avec d’autres écoles. Fulgurant désigne un rythme et une voie de dégâts, pas une obligation de jouer Foudre.

Exemple : Trait → Sceau → Cercle. Le Sceau lit Trait et ajoute des dégâts à son effet ; le Cercle lit Sceau et protège en attaquant ; le sort suivant lit Cercle. Changer l’ordre change la distribution des protections et impacts. Un ordre T–T–C favorise d’autres talents qu’un T–S–T. Les copies de runes produites par un objet ne réécrivent pas la phrase et ne fabriquent pas d’Encre.

### Ce que les gemmes ne donnent pas

Une gemme peut fournir une Marque, une brûlure ou un petit ralentissement. Elle ne donne ni Braises, ni Angle mort, ni phrase runique. Elle ne donne pas non plus le passif et les trois sorts d’une autre voie. Les mots-clés partagés rendent les croisements possibles ; l’origine de l’action conserve l’identité de la classe.

Deux joueurs équipés des mêmes Cendres + Empreinte peuvent ainsi préparer leurs effets différemment, garder des marges de survie différentes et privilégier d’autres compétences. Les deux petits sets de classe poussent cette distinction plus loin, sans devenir des uniformes obligatoires.

## 6. Répertoire complet des 66 sorts

Les chiffres sont des coefficients de banc à équilibrer. Une affliction indique son **montant total**, pas des dégâts par seconde. Les protections/soins indiqués visent un bénéficiaire, sauf futur sort explicitement collectif. Les sorts hybrides conservent des dégâts utiles : un soutien n’a pas quatre boutons qui font zéro dégât.

Les libellés français peuvent changer. Les identifiants stables, tags, niveaux et coefficients figurent dans `projet.json`. Les compétences sans voie restent communes ; une voie n’a pas accès aux compétences exclusives des deux autres.

### Répertoire du Forgefeu

**Compétences communes**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Frappe d’atelier | 1 | 6 s | Physique | 0,95 P de dégâts ; +1 Braise. |
| Trempe vive | 1 | 10 s | Feu | 1,2 P de dégâts ; Trempe : dépense les Braises, +0,15 P chacune sur la cible principale. |
| Éclat du four | 5 | 12 s | Feu | 0,65 P de dégâts ; 3 cibles, secondaires à 55 % ; +1 Braise ; Brûlure : 0,35 P au total / 6 s. |
| Garde rouge | 10 | 14 s | Physique | 0,45 P de dégâts ; +1 Braise ; protection 0,85 P / 6 s. |
| Coup de travers | 15 | 12 s | Physique | 1,1 P de dégâts ; +1 Braise ; ralentissement 15,0 % / 4 s ; Pression 18. |
| Refroidissement | 20 | 16 s | Physique | 0,6 P de dégâts ; Trempe : dépense les Braises, +0,15 P chacune sur la cible principale ; soin 0,75 P ; purifie une altération du bénéficiaire. |
| Poinçon du maître | 25 | 10 s | Physique | 0,8 P de dégâts ; +1 Braise ; Marque 8 s. |
| Marteau de retour | 35 | 14 s | Physique | 1,35 P de dégâts ; Trempe : dépense les Braises, +0,15 P chacune sur la cible principale ; Pression 20. |
| Grand soufflet | 45 | 18 s | Feu | 0,85 P de dégâts ; 3 cibles, secondaires à 55 % ; +1 Braise ; Brûlure : 0,45 P au total / 6 s. |
| Rivet de garde | 55 | 18 s | Physique | 0,65 P de dégâts ; Trempe : dépense les Braises, +0,15 P chacune sur la cible principale ; protection 1,2 P / 6 s ; Affaiblissement 15,0 % / 6 s. |
| Décrassage | 65 | 20 s | Feu | 0,9 P de dégâts ; +1 Braise ; réduction des soins reçus 20,0 % / 6 s ; dissipe une garde ennemie. |
| Contrepoids | 85 | 22 s | Physique | 1,6 P de dégâts ; Trempe : dépense les Braises, +0,15 P chacune sur la cible principale ; protection 0,8 P / 6 s. |
| La Grande Trempe · ultime | 75 | 60 s | Feu | 3,0 P de dégâts ; 3 cibles, secondaires à 55 % ; Trempe : dépense les Braises, +0,15 P chacune sur la cible principale ; protection 1,5 P / 8 s. |

**Trempe-Rouge**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Jet de scories | 30 | 16 s | Feu | 1,2 P de dégâts ; Trempe : dépense les Braises, +0,15 P chacune sur la cible principale ; Brûlure : 0,65 P au total / 6 s. |
| Deuxième frappe | 50 | 12 s | Physique | 1,4 P de dégâts ; +1 Braise ; prochaine attaque de base +0,55 P. |
| Reprise au rouge | 70 | 20 s | Feu | 2,2 P de dégâts ; 2 cibles, secondaires à 55 % ; Trempe : dépense les Braises, +0,15 P chacune sur la cible principale. |

**Enclumier**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Faire sonner l’enclume | 30 | 16 s | Physique | 1,0 P de dégâts ; Trempe : dépense les Braises, +0,15 P chacune sur la cible principale ; étourdit 1 s ; converti en Pression sur boss ; Pression 35. |
| Coins d’arrêt | 50 | 14 s | Physique | 0,9 P de dégâts ; +1 Braise ; ralentissement 25,0 % / 6 s ; Pression 15. |
| Frappe de scellement | 70 | 22 s | Physique | 1,5 P de dégâts ; Trempe : dépense les Braises, +0,15 P chacune sur la cible principale ; Pression 45 ; Affaiblissement 20,0 % / 6 s. |

**Rémouleur**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Pose de rivets | 30 | 14 s | Physique | 1,0 P de dégâts ; +1 Braise ; protection 1,1 P / 6 s. |
| Recuit partagé | 50 | 18 s | Feu | 1,05 P de dégâts ; Trempe : dépense les Braises, +0,15 P chacune sur la cible principale ; soin 1,0 P. |
| Plaque maîtresse | 70 | 22 s | Physique | 1,1 P de dégâts ; +1 Braise ; protection 1,4 P / 6 s ; Affaiblissement 15,0 % / 6 s. |

### Répertoire du Traqueur

**Compétences communes**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Lecture de piste | 1 | 8 s | Physique | 0,8 P de dégâts ; Repérage : ouvre un Angle ; Marque 8 s. |
| Trait de poursuite | 1 | 8 s | Physique | 1,25 P de dégâts ; Poursuite : exploite un Angle existant. |
| Collet vif | 5 | 12 s | Physique | 0,6 P de dégâts ; Repérage : ouvre un Angle ; ralentissement 20,0 % / 4 s ; Pression 15. |
| Sifflet bref | 10 | 14 s | Physique | 0,8 P de dégâts ; Repérage : ouvre un Angle ; compétence de compagnon ; soin 0,4 P. |
| Tir de travers | 15 | 12 s | Physique | 0,9 P de dégâts ; 3 cibles, secondaires à 55 % ; Poursuite : exploite un Angle existant. |
| Repli couvert | 20 | 16 s | Physique | 0,65 P de dégâts ; Repérage : ouvre un Angle ; protection 0,8 P / 6 s. |
| Flèche barbelée | 25 | 12 s | Physique | 1,0 P de dégâts ; Poursuite : exploite un Angle existant ; Saignement : 0,5 P au total / 6 s. |
| Piège de résine | 35 | 18 s | Physique | 0,65 P de dégâts ; Repérage : ouvre un Angle ; Pression 20 ; réduction des soins reçus 20,0 % / 6 s. |
| Battement de meute | 45 | 16 s | Physique | 0,95 P de dégâts ; Poursuite : exploite un Angle existant ; compétence de compagnon ; soin 0,65 P. |
| Regard fixe | 55 | 18 s | Foudre | 1,65 P de dégâts ; Poursuite : exploite un Angle existant ; Marque 8 s. |
| Filet d’orage | 65 | 20 s | Foudre | 1,0 P de dégâts ; 2 cibles, secondaires à 55 % ; Repérage : ouvre un Angle ; ralentissement 20,0 % / 6 s ; Pression 25. |
| Rappel au couvert | 85 | 20 s | Physique | 0,95 P de dégâts ; Repérage : ouvre un Angle ; compétence de compagnon ; soin 0,9 P ; purifie une altération du bénéficiaire. |
| La Grande Battue · ultime | 75 | 60 s | Physique | 2,8 P de dégâts ; 3 cibles, secondaires à 55 % ; Poursuite : exploite un Angle existant ; soin 0,9 P ; Marque 8 s. |

**Tue-Bête**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Tir à la couture | 30 | 14 s | Physique | 1,75 P de dégâts ; Poursuite : exploite un Angle existant ; ignore 20,0 % de la Défense pour ce sort. |
| Morsure croisée | 50 | 16 s | Physique | 0,9 P de dégâts ; Repérage : ouvre un Angle ; compétence de compagnon ; Saignement : 0,75 P au total / 6 s. |
| Pas de côté | 70 | 20 s | Foudre | 1,9 P de dégâts ; 2 cibles, secondaires à 55 % ; Poursuite : exploite un Angle existant. |

**Piégeur**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Dents de fer | 30 | 16 s | Physique | 1,0 P de dégâts ; Repérage : ouvre un Angle ; étourdit 1 s ; converti en Pression sur boss ; Pression 35. |
| Flèches de gêne | 50 | 12 s | Physique | 1,1 P de dégâts ; Poursuite : exploite un Angle existant ; Affaiblissement 20,0 % / 6 s. |
| Laissé pour compte | 70 | 22 s | Foudre | 1,3 P de dégâts ; Repérage : ouvre un Angle ; compétence de compagnon ; ralentissement 25,0 % / 6 s ; Pression 45. |

**Meneur de meute**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Garde de meute | 30 | 14 s | Physique | 1,0 P de dégâts ; Repérage : ouvre un Angle ; compétence de compagnon ; protection 1,0 P / 6 s. |
| Partage de chasse | 50 | 16 s | Physique | 1,1 P de dégâts ; Poursuite : exploite un Angle existant ; compétence de compagnon ; soin 0,8 P. |
| Retour de la meute | 70 | 22 s | Foudre | 1,3 P de dégâts ; Repérage : ouvre un Angle ; compétence de compagnon ; soin 1,0 P ; purifie une altération du bénéficiaire. |

### Répertoire du Runiste

**Compétences communes**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Trait incandescent | 1 | 8 s | Feu | 1,1 P de dégâts ; écrit Trait ; Brûlure : 0,2 P au total / 6 s. |
| Cercle de givre | 1 | 10 s | Givre | 0,75 P de dégâts ; 2 cibles, secondaires à 55 % ; écrit Cercle ; ralentissement 15,0 % / 4 s ; Pression 12. |
| Sceau de garde | 5 | 12 s | Foudre | 0,5 P de dégâts ; écrit Sceau ; protection 0,9 P / 6 s. |
| Trait fulgurant | 10 | 10 s | Foudre | 1,55 P de dégâts ; écrit Trait. |
| Anneau de cendres | 15 | 14 s | Feu | 0,75 P de dégâts ; 3 cibles, secondaires à 55 % ; écrit Cercle ; Brûlure : 0,4 P au total / 6 s. |
| Sceau de répit | 20 | 16 s | Givre | 0,65 P de dégâts ; écrit Sceau ; soin 0,9 P ; purifie une altération du bénéficiaire. |
| Trait de gel | 25 | 12 s | Givre | 1,15 P de dégâts ; écrit Trait ; ralentissement 20,0 % / 4 s ; Pression 18. |
| Cercle révélateur | 35 | 14 s | Foudre | 0,9 P de dégâts ; écrit Cercle ; Marque 8 s ; dissipe une garde ennemie. |
| Sceau du foyer | 45 | 18 s | Feu | 0,8 P de dégâts ; écrit Sceau ; soin 0,65 P ; protection 0,65 P / 6 s. |
| Ligne de partage | 55 | 16 s | Givre | 1,3 P de dégâts ; 2 cibles, secondaires à 55 % ; écrit Trait. |
| Anneau de silence | 65 | 20 s | Givre | 1,0 P de dégâts ; écrit Cercle ; Pression 30 ; Affaiblissement 20,0 % / 6 s. |
| Sceau de continuité | 85 | 22 s | Foudre | 0,8 P de dégâts ; écrit Sceau ; protection 1,5 P / 6 s. |
| La Phrase souveraine · ultime | 75 | 60 s | Élément du sort précédent | 3,0 P de dégâts ; 3 cibles, secondaires à 55 % ; écrit Cercle ; soin 0,8 P ; protection 0,8 P / 8 s. |

**Fulgurant**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Rature ardente | 30 | 16 s | Feu | 1,4 P de dégâts ; écrit Trait ; Brûlure : 0,75 P au total / 6 s. |
| Trait des éclats | 50 | 14 s | Givre | 1,65 P de dégâts ; écrit Trait. |
| Cercle de rupture | 70 | 22 s | Foudre | 1,2 P de dégâts ; 3 cibles, secondaires à 55 % ; écrit Cercle ; Pression 20. |

**Sigillaire**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Sceau d’arrêt | 30 | 16 s | Givre | 1,0 P de dégâts ; écrit Sceau ; étourdit 1 s ; converti en Pression sur boss ; Pression 35. |
| Cercle de l’entrave | 50 | 14 s | Foudre | 0,85 P de dégâts ; écrit Cercle ; ralentissement 25,0 % / 6 s ; Pression 20. |
| Trait d’interdit | 70 | 22 s | Feu | 1,4 P de dégâts ; écrit Trait ; Pression 45 ; réduction des soins reçus 20,0 % / 6 s. |

**Glyphiste**

| Sort | Niveau | CD | Type | Effet |
| --- | --- | --- | --- | --- |
| Sceau de résonance | 30 | 14 s | Foudre | 1,0 P de dégâts ; écrit Sceau ; protection 1,1 P / 6 s. |
| Cercle du refuge | 50 | 18 s | Givre | 1,0 P de dégâts ; écrit Cercle ; soin 0,9 P. |
| Trait de relève | 70 | 22 s | Feu | 1,4 P de dégâts ; écrit Trait ; protection 0,95 P / 6 s. |

### Ouvertures conseillées

Le Forgefeu essaie d’éviter de dépenser toutes ses Braises juste avant un geste qu’il voulait renforcer. Le Traqueur place au moins un Repérage avant une Poursuite, puis surveille les collisions de cooldowns qui laissent un Angle expirer. Le Runiste choisit d’abord une phrase lisible plutôt qu’une pile de ses cinq plus gros coefficients.

Les plans joints utilisent généralement 0 / 2 / 4 / 7 / 10 s pour donner une ouverture compréhensible. Ce ne sont pas des horaires optimaux universels. Les phases d’un boss et un choix de quatre sorts au lieu de cinq peuvent donner un meilleur résultat. Le banc ne cherche pas toutes les permutations de timings.

## 7. Contrôle et soutien : utiles dans tout le PvE

### La Stabilité des boss

Un boss qui ignore simplement les étourdissements retire une grande partie de leur intérêt aux contrôleurs. À l’inverse, un boss figé en permanence supprime tout combat. Je propose une **Stabilité** : les compétences de contrôle retirent de la Pression à cette barre ; un contrôle dur se convertit en Pression au lieu de faire « immunisé, zéro effet ».

Référence du banc : 80 de Stabilité, 15 de Pression par seconde d’étourdissement convertie, en plus de la Pression inscrite sur le sort. À zéro : **Rupture** pendant 6 s, +8 % de dégâts directs reçus et prochaine attaque directe affaiblie de 25 %. Une période de récupération de 8 s empêche une nouvelle Rupture immédiate. La barre ne gèle ni les scripts ni le combat.

Les ralentissements des boss sont plafonnés à 15 % et affectent leur cadence d’attaque ordinaire ; ils ne déplacent pas arbitrairement tout leur calendrier de phases. Les ennemis ordinaires peuvent être ralentis davantage et brièvement étourdis. Un même sort peut affecter deux ennemis, mais ne crédite qu’une fois ses compteurs d’équipement.

Un contrôle qui retire vraiment de la Stabilité peut qualifier Ronces, Fracture ou un talent qui le dit. Un ralentissement faible de gemme ne donne pas ce crédit de classe. Un ralentissement natif peut qualifier Ronces, mais **ne qualifie pas Fracture s’il n’a retiré aucune Stabilité et rien dissipé**. Ce point fait l’objet d’un test spécifique.

### Une réponse de chaque rôle

Une charge lourde peut être affaiblie par une Rupture, absorbée par une garde ou suivie d’un soin. Des renforts peuvent être détruits vite, ralentis et affaiblis, ou supportés le temps de finir leur chef. Une garde ennemie peut être dissipée, usée par les coups ou laissée expirer en préparant son prochain cycle. Un soin ennemi peut être réduit, interrompu ou dépassé par un débit raisonnable.

Les mécanismes ne sont pas tous équivalents en vitesse, sécurité ou effort de préparation. **La réussite doit rester possible avec chaque classe et chaque voie, avec un build adapté au palier.** Cela ne signifie pas qu’un assemblage aléatoire ou un personnage très sous-équipé réussit tout.

### Le soutien en solo et en groupe

Un soutien garde ses attaques de base, des sorts hybrides et les compétences offensives communes. Ses mécanismes renvoient une partie de l’aide vers la poursuite : plaque qui riposte, Ordre de meute qui soigne et frappe, Encre libérée dans une attaque. Il n’attend pas qu’un allié le porte pour progresser.

Il n’existe pas de bonus caché de dégâts « parce que vous êtes seul ». Les mêmes règles fonctionnent avec le porteur comme bénéficiaire. Les protections en groupe utilisent un budget total fixé : une réserve de 100 ne devient pas quatre réserves de 100 parce qu’il y a quatre alliés. Les réserves d’Encre et de Sceau viennent de l’aide réellement utilisée, pas d’un sursoin gratuit.

Je vise un soutien offensif généralement moins rapide qu’un pur DPS à danger faible, avec une meilleure marge à danger élevé. L’écart exact est à mesurer avec le vrai budget d’objets. La cible de conception est de rester souvent dans un ordre de 10–30 % de temps supplémentaire avec un plan adapté, sans promettre ce chiffre pour tous les boss, toutes les pièces et tous les plans.

Le contenu de groupe futur est un mode à 1–3 participants, ouvert en solo avec une mise à l’échelle. Pas de composition tank/healer/DPS obligatoire pour obtenir une famille d’objets. Les butins sont personnels et ne récompensent pas le dernier coup. Le soin/protection/contrôle réellement utile doit compter dans les contributions d’événement ; le DPS seul n’est pas le score universel de participation.

## 8. Régions, parcours et objectifs durables

Les régions 40+ sont des branches horizontales, ouvertes au même grand palier. Le joueur peut choisir sa source de set et son style de rencontre. Leurs profondeurs 60, 80 et 90 changent les formations et combinaisons de mécaniques, et délivrent des exemplaires de leur rang. Rejouer le rang 40 très vite ne produit pas de composants 90.

### Niveaux et progression des classes

La classe active gagne son XP au combat ; les métiers donnent seulement leur propre XP. Les niveaux des autres classes sont conservés, mais ne progressent pas en parallèle. Changer de classe ou de voie reste gratuit hors d’une rencontre en résolution. Les voies partagent le niveau de leur classe : essayer une autre voie ne recommence pas la montée.

Je reprends comme base de travail la courbe 1–99 du projet et la recommandation de revenu horaire `R(L) = 400 × 2^((L−1)/55)` pour le temps de combat effectif. Le rattrapage proposé dans le dépôt, +50 % pour une classe sous 80 % du niveau de la meilleure, peut rester un paramètre. Ces durées de progression doivent être recalculées avec les vrais combats, les repos et les consommables : les mesures des métiers ne prouvent pas automatiquement la durée d’une classe.

Une tentative interminable sans victoire ne doit pas devenir la meilleure méthode d’XP. Piste à éprouver : créditer le temps effectif, avec une borne de crédit par tentative fondée sur son temps de référence ; une victoire termine normalement le cycle. La progression doit récompenser un plan viable sans réserver l’XP aux seuls dégâts ou au dernier coup. Les affinités de métier et les classements de contribution ne servent pas à fabriquer une seconde XP de classe.

Pour un lancement de contenu, viser des rencontres ordinaires de quelques dizaines de secondes, des élites d’une à deux minutes et des gardiens de quelques minutes est une hypothèse plus utile qu’un unique monstre de dix secondes répété partout. Le banc normalisé sert à comparer les mécaniques ; ses durées ne sont pas encore la calibration définitive de ces contenus.

Les Forges commencent au niveau 20 puis possèdent leur route 40. Les Abords servent à apprendre et leur reprise 40 permet de revisiter un adversaire sans obtenir un objet 40 sur sa version de niveau 10. Un niveau 40 ne doit pas attendre la fin de six régions linéaires pour commencer à construire un set.

| Région | Tranches | Parcours de donjon | Intention |
| --- | --- | --- | --- |
| Les Abords du bourg | 1–19 ; reprise 40 pour les objets de palier 40 | Les Galeries du vieux puits | Apprendre la mécanique de classe, essayer les premiers sorts, viser un équipement classique. |
| Les Forges éteintes | 20–39 ; routes 40+ | La Fonderie sans maître | Premières armes nommées, choix de voie, gardes et attaques chargées. |
| La Lisière des veilleurs | 40 ; profondeurs 60 / 80 / 90 | Le Relais des chasseurs perdus | Marques, afflictions, transitions de cibles et premières variantes de sets. |
| Les Archives englouties | 40 ; profondeurs 60 / 80 / 90 | La Chambre des phrases noyées | Séquences de sorts, dissipations et protection contre des dégâts périodiques. |
| Le Bastion des longues veilles | 40 ; profondeurs 60 / 80 / 90 | Les Trois Portes du serment | Boucliers, endurance, soins et attaques qui mettent la défense à l’épreuve. |
| La Cicatrice des trois vents | 40 ; profondeurs 60 / 80 / 90 | Le Passage des trois vents | Combiner plusieurs réponses ; cibles prioritaires et fenêtres de danger. |

### Les Abords du bourg

Carrières, vergers abandonnés et sentiers de contrebande.

**Matières de filière :** pierre ordinaire, bois de récupération, herbes du talus. Ces ressources sont récoltées par les métiers appropriés ; le combat fournit surtout trophées, réactifs de boss et pièces. Les noms sont des propositions de contenu, pas des ressources déjà codées.

**Ensembles à viser :** sources de rattrapage et réactifs pour les familles permanentes ; aucun set obligatoire exclusif.

| Adversaire | Mécanique | Réponses possibles | Objets nommés ciblables |
| --- | --- | --- | --- |
| Dos-de-schiste | Une carapace atténue les petits impacts ; elle tombe progressivement sous les coups. | Frappes appuyées / Afflictions / Endurance et attaques ordinaires, sans immunité aux petits coups | Classiques 1/10; Premiers matériaux de réparation |
| Le Collecteur du bourbier | Se soigne brièvement à intervalles réguliers ; la quantité reste inférieure au débit d’un build de soutien de référence. | Interruption/Pression / Réduction des soins / Dégâts ou endurance qui dépassent le soin | Le Petit Arrangement |
| Le Gardien du puits | Prépare un coup lourd, puis laisse une période de récupération. | Briser sa Stabilité / Placer une garde avant le coup / Se soigner après, ou conclure le combat plus tôt | Plans classiques 10; Cosmétique de mine |

**Parcours — Les Galeries du vieux puits :** une formation d’approche, un affrontement intermédiaire qui introduit la contrainte, puis le gardien. Le joueur peut répéter l’élite ou le gardien débloqué pour cibler un objet ; il ne refait pas une promenade vide à chaque tentative. La version longue conserve les transitions et fournit un mélange de composants, de progression d’ensemble et de collection. Leurs gains par minute de référence doivent être comparés avant de rendre l’une strictement supérieure.

### Les Forges éteintes

Une fonderie désertée où le métal continue de travailler.

**Matières de filière :** minerai chargé de scories, charbon froid, fibres de suie. Ces ressources sont récoltées par les métiers appropriés ; le combat fournit surtout trophées, réactifs de boss et pièces. Les noms sont des propositions de contenu, pas des ressources déjà codées.

**Ensembles à viser :** Cendres persistantes, L’Enclume patiente, Les Passeurs de braise, Le Fer du second feu.

| Adversaire | Mécanique | Réponses possibles | Objets nommés ciblables |
| --- | --- | --- | --- |
| Le Veilleur de four | La chaleur produit des dégâts réguliers et un coup chargé toutes les 18 s. | Soin ou protection / Affaiblissement/Pression / Dégâts soutenus qui raccourcissent l’exposition | La Rancune, Murmure-d’épine, Le Dernier Avertissement |
| La Cloche de fer | Une frappe annoncée pendant 4 s frappe fort, sans tuer un aventurier correctement équipé de son palier. | Rupture / Bouclier anticipé / Récupération ; dégâts sur sa fenêtre de repos | Les Bonnes Manières, La Ponctuelle, Les Sœurs silencieuses, Le Sceau qui tient |
| Le Contremaître rouge | Alterne garde et activité ; une dissipation enlève la garde, sinon elle s’épuise sous les coups en 6 s au plus. | Dissiper / User la garde avec les attaques / Préparer sa séquence pour sa fin | Le Compte y est, Le Livre des ratures |

**Parcours — La Fonderie sans maître :** une formation d’approche, un affrontement intermédiaire qui introduit la contrainte, puis le gardien. Le joueur peut répéter l’élite ou le gardien débloqué pour cibler un objet ; il ne refait pas une promenade vide à chaque tentative. La version longue conserve les transitions et fournit un mélange de composants, de progression d’ensemble et de collection. Leurs gains par minute de référence doivent être comparés avant de rendre l’une strictement supérieure.

### La Lisière des veilleurs

Une forêt de chemins effacés, de bêtes dressées et de balises.

**Matières de filière :** écorce de veille, peaux de lisière, résine pâle. Ces ressources sont récoltées par les métiers appropriés ; le combat fournit surtout trophées, réactifs de boss et pièces. Les noms sont des propositions de contenu, pas des ressources déjà codées.

**Ensembles à viser :** La Dernière empreinte, Ronces vives, Les Relais du chemin gris, La Battue silencieuse, La Phrase inachevée.

| Adversaire | Mécanique | Réponses possibles | Objets nommés ciblables |
| --- | --- | --- | --- |
| Le Cerf de braise | Appelle deux silhouettes fragiles ; sa présence ne rend jamais leur destruction obligatoire. | Dégâts répartis / Contrôle/affaiblissement des silhouettes / Dégâts sur le cerf avec assez de protection | La Part du feu |
| La Matriarche de résine | Pose un cocon qui soigne et protège une petite quantité. | Réduction des soins / Pression ou dissipation / Éroder le cocon et tenir | La Ponctuelle, La Dette légère |
| Le Veneur creux | Déploie un leurre qui amplifie sa prochaine volée ; l’effet peut aussi être absorbé ou affaibli. | Prioriser le leurre / Contrôler la volée / Garde/soin avec maintien sur le Veneur | Murmure-d’épine |

**Parcours — Le Relais des chasseurs perdus :** une formation d’approche, un affrontement intermédiaire qui introduit la contrainte, puis le gardien. Le joueur peut répéter l’élite ou le gardien débloqué pour cibler un objet ; il ne refait pas une promenade vide à chaque tentative. La version longue conserve les transitions et fournit un mélange de composants, de progression d’ensemble et de collection. Leurs gains par minute de référence doivent être comparés avant de rendre l’une strictement supérieure.

### Les Archives englouties

Des salles noyées, des sentences qui flottent et des livres lestés de plomb.

**Matières de filière :** encre saline, lin de marée, pierres gravées. Ces ressources sont récoltées par les métiers appropriés ; le combat fournit surtout trophées, réactifs de boss et pièces. Les noms sont des propositions de contenu, pas des ressources déjà codées.

**Ensembles à viser :** L’Orage contenu, Les Heures creuses, Les Mains de traverse, Le Palimpseste.

| Adversaire | Mécanique | Réponses possibles | Objets nommés ciblables |
| --- | --- | --- | --- |
| Le Témoin sous l’eau | Marque un rythme régulier de coups et révèle une défense à la troisième séquence. | Marquage et cible unique / Afflictions longues / Phrases alternées ou protections de rythme | Le Témoin discret, Le Dernier Avertissement |
| Le Notaire des marées | Une sentence lui donne une garde temporaire ; l’enlever est utile sans être indispensable. | Dissiper / Faire tomber la garde avec les coups / Conserver un gros sort pour après | Le Point-virgule |
| Le Chantre muet | Prépare un refrain ; les tentatives de contrôle dur retirent de la Stabilité au lieu de le figer. | Pression et Rupture / Protection temporisée / Récupération et affaiblissement | L’Objection, Le Bénéfice du doute |

**Parcours — La Chambre des phrases noyées :** une formation d’approche, un affrontement intermédiaire qui introduit la contrainte, puis le gardien. Le joueur peut répéter l’élite ou le gardien débloqué pour cibler un objet ; il ne refait pas une promenade vide à chaque tentative. La version longue conserve les transitions et fournit un mélange de composants, de progression d’ensemble et de collection. Leurs gains par minute de référence doivent être comparés avant de rendre l’une strictement supérieure.

### Le Bastion des longues veilles

Une garnison qui tient encore un serment dont personne ne connaît la fin.

**Matières de filière :** fer de garde, cuir patiné, gemmes de guet. Ces ressources sont récoltées par les métiers appropriés ; le combat fournit surtout trophées, réactifs de boss et pièces. Les noms sont des propositions de contenu, pas des ressources déjà codées.

**Ensembles à viser :** Veilleurs du sceau, L’Autre revers, La Vigie sans sommeil, Les Rivets du serment, Les Pas dans les pas.

| Adversaire | Mécanique | Réponses possibles | Objets nommés ciblables |
| --- | --- | --- | --- |
| Le Gardien des trois portes | Trois coups espacés dont le dernier est renforcé. | Pression pour affaiblir la séquence / Plusieurs petites gardes / Soin entre les coups et dégâts réguliers | Le Dernier Rivet, La Clé sans serrure |
| L’Intendant de verre | Projette des éclats réguliers ; un nettoyage enlève une érosion, sans retirer les éclats eux-mêmes. | Purifier / Protéger et récupérer / Accélérer la victoire ; interrompre ses charges | Ça va tenir, Le Sceau qui tient |
| Le Porte-serment de la meute | S’entoure de deux gardes ; ceux-ci renforcent sa défense jusqu’à être vaincus ou épuisés. | Attaques de zone / Priorité sur un garde / Affaiblissement et endurance contre la formation | La Part du chien, Le Fil du retour |

**Parcours — Les Trois Portes du serment :** une formation d’approche, un affrontement intermédiaire qui introduit la contrainte, puis le gardien. Le joueur peut répéter l’élite ou le gardien débloqué pour cibler un objet ; il ne refait pas une promenade vide à chaque tentative. La version longue conserve les transitions et fournit un mélange de composants, de progression d’ensemble et de collection. Leurs gains par minute de référence doivent être comparés avant de rendre l’une strictement supérieure.

### La Cicatrice des trois vents

Un plateau fissuré où le vent soulève des éclats de pierre et de verre.

**Matières de filière :** quartz fendu, herbes de rafale, bois de faille. Ces ressources sont récoltées par les métiers appropriés ; le combat fournit surtout trophées, réactifs de boss et pièces. Les noms sont des propositions de contenu, pas des ressources déjà codées.

**Ensembles à viser :** sources de rattrapage et réactifs pour les familles permanentes ; aucun set obligatoire exclusif.

| Adversaire | Mécanique | Réponses possibles | Objets nommés ciblables |
| --- | --- | --- | --- |
| Le Héraut des trois vents | Un éclat vivant prépare une rafale périodique ; choisir sa cible ou préparer la garde sont deux réponses. | Changer de priorité / Dégâts répartis / Contrôle et garde sur la rafale | Sans sommation, Les Heures supplémentaires |
| La Sentinelle fendue | Renouvelle une défense limitée ; chaque Rupture la fragilise pour la fenêtre suivante. | Pression / Dissipation / Dégâts prolongés et survie | Le Mauvais Présage |
| Le Régent des courants | Alterne une charge, un éclat et une courte garde. Chaque phase conserve plusieurs réponses et des repères fixes. | Plan polyvalent / Gros dégâts avec une garde de sécurité / Contrôle et récupération pour une victoire plus lente | Plans au choix des familles permanentes; Cosmétique du Régent; Composants de profondeur |

**Parcours — Le Passage des trois vents :** une formation d’approche, un affrontement intermédiaire qui introduit la contrainte, puis le gardien. Le joueur peut répéter l’élite ou le gardien débloqué pour cibler un objet ; il ne refait pas une promenade vide à chaque tentative. La version longue conserve les transitions et fournit un mélange de composants, de progression d’ensemble et de collection. Leurs gains par minute de référence doivent être comparés avant de rendre l’une strictement supérieure.

### Profondeurs et renouvellement

| Palier | Ce qui renouvelle le contenu | Ce qui reste accessible |
| --- | --- | --- |
| 1–19 | Mécanique de classe, premières options, classiques et découvertes | Aucun set nécessaire |
| 20–29 | Deux armes nommées par classe dans les Forges ; premières interactions de talent | Le bon classique reste une alternative avec sa gemme libre |
| 30–39 | Choix de voie ; premiers outils spécifiques de rôle | Changer de voie n’impose pas un nouveau niveau |
| 40–59 | Quatre branches, premiers 4 pièces et doubles ensembles ; spécialisation des affixes | Toutes les familles de mécaniques de sets deviennent accessibles dans leurs routes 40 |
| 60–74 | Formations plus riches, nouvelles compétences de voie, nouveaux exemplaires 60 | Les effets de set ne sont pas remplacés par des versions entièrement nouvelles |
| 75–89 | Ultime à intégrer ou à laisser ; profondeur 80 et combinaisons de contraintes | Les mêmes voies gardent plusieurs réponses |
| 90–99 | Profondeurs finales, meilleurs jets, chefs-d’œuvre et collections longues | Pas de remise à zéro ni de deuxième montée forcée de rareté |

Une profondeur ne doit pas ajouter trois contraintes qui exigent simultanément une classe précise, un élément précis et une gemme précise. Chaque fiche de boss contient plusieurs réponses, au moins une accessible aux compétences communes. Les phases de soin ont un débit suffisamment bas pour ne pas créer de mur infini pour un soutien.

Les six régions et leurs variantes ne garantissent pas, à elles seules, un an d’intérêt. Le renouvellement vient ensuite de nouveaux adversaires, variations de formations, objets latéraux, collections, essais de classes et événements récurrents. Leur production doit rester soutenable ; créer d’emblée cent donjons presque identiques ne donnerait pas une meilleure base.

Un habillage d’événement équivalent à un set permanent conserve sa famille mécanique et ses clés de pièce. Changer le nom en « Givre des cimes » ne doit pas permettre de compter deux fois la même mécanique ou de contourner ses délais avec une variante saisonnière. Un véritable nouvel effet latéral porte un identifiant distinct, mais reste soumis aux mêmes familles de cumul. Les reruns ne suppriment ni recettes, ni possessions, ni progrès.

### Objectifs qui ne se réduisent pas au niveau

- **Bestiaire** : découvrir les adversaires, leurs variantes et leurs réponses ; récompenses de collection et apparences.
- **Plans de build** : assembler un premier noyau, essayer un talent nommé, passer d’un plan de groupe à un plan de boss.
- **Objets signés** : commander une pièce adaptée, faire améliorer ses jets, chercher un chef-d’œuvre d’artisan.
- **Collections de région** : reconstituer une histoire par des objets de curiosité ; titres et cosmétiques, sans bonus de dégâts à accumuler sur toutes les classes.
- **Objectifs de clan** : préparer un groupe, fournir gemmes et réparations, partager une source ou un plan de combat ; participation asynchrone.
- **Événements** : versions thématiques et apparences avec reruns ; aucune mécanique indispensable disparue onze mois par an.

Je n’ajoute pas de tournée quotidienne de toutes les régions. Un objectif choisi peut rester actif plusieurs jours, sans date d’expiration ni bonus de présence à une heure précise.

## 9. Butin, malchance et artisanat

### Des sources lisibles

Le plan de butin permet de cibler une famille d’ensemble proposée par la région et, sur un gardien, un nommé de sa table. Les pièces d’un même ensemble partagent ses règles ; un bâton n’est pas redessiné pour Feu, Givre et Foudre. Les jets produisent les variantes statistiques.

Le choix de focus, la classe, la profondeur et la version du contenu sont figés au début de la rencontre. Changer de classe avant de récupérer le résumé d’absence ne reroule pas le butin. Les résultats sont créés et enregistrés par le serveur ; le navigateur ne décide ni rareté ni affixe.

Une victoire avance un budget de butin fondé sur le **temps nominal de la rencontre**, pas sur le temps que le joueur a volontairement laissé durer le combat. Gagner plus vite reste utile ; retenir un ennemi vivant ne multiplie pas ses récompenses. Un boss faible conserve son rang de butin et ne devient jamais une fabrique de matériaux de rang 90.

| Canal | Cadence de départ proposée | But |
| --- | --- | --- |
| Classiques | 4 pièces finies par heure nominale victorieuse | Voir du loot, remplacer les mauvais emplacements, alimenter le marché et le recyclage |
| Progression d’ensemble | 1 cache ciblée par heure nominale, à partir du rang 40 | Une avancée garantie, sans dépendre uniquement d’une probabilité très faible |
| Cache d’ensemble | 8 pièces canoniques ; orientation de classe à 90 % pour les positions non partagées | Laisser du commerce et des objets pour les autres classes sans transformer chaque drop en déception |
| Fragments d’ensemble | 1 chute par cache ; 6 donnent accès à une pièce choisie via artisanat | Combattre les doublons ; matériaux ordinaires et service d’artisan à ajouter |
| Nommé ciblé | 5 % par victoire de boss de référence de 6 min | Une surprise directe ; rareté du modèle distincte de sa probabilité d’obtention |
| Recette de nommé | 1 fragment par victoire de référence ; 20 fragments pour sa part spéciale | Accumuler une matière échangeable même sans drop direct |
| Or | 0 ajouté par ce système | Conserver les commandes PNJ comme robinet contrôlé ; échanges de pièces entre joueurs |

Ces cadences sont une proposition, pas des taux définitifs à copier sans recettes. Elles sont exprimées en temps nominal : un joueur qui gagne 20 % plus vite les obtient plus vite ; une défaite ne donne pas les pièces prévues pour une victoire. La progression de fragments peut utiliser des fractions internes afin que des rencontres de référence plus courtes ne perdent pas leur part à l’arrondi.

Les six minutes sont une **unité de budget**, pas la durée imposée à tous les boss du jeu. Pour un gardien de référence de 90 s, on accorde un quart de fragment spécial et une probabilité ciblée `1 − 0,95^(90/360)`, soit environ 1,27 %, et non 5 % à chaque petit combat. La progression de cache avance de `temps de référence / 3 600`. Les coefficients du banc et les temps de référence du butin doivent être raccordés une fois les statistiques réelles calibrées ; il ne faut pas attribuer six minutes de récompenses à un adversaire prévu pour quarante-cinq secondes.

La probabilité de nommé concerne le **modèle focalisé**, pas chaque modèle de la table simultanément. Les trois armes de classes différentes d’un même gardien n’offrent pas trois jets de 5 % en parallèle.

Une cache contient une pièce et une chute ; on ne détruit pas obligatoirement la pièce pour recevoir sa progression garantie. Un même anneau d’ensemble ne compte qu’une fois, même porté en deux exemplaires : le deuxième peut garder ses statistiques, servir à une autre classe, se vendre ou se recycler.

| Cas simulé | Méthode | Moyenne premier 4 pièces | Médiane | 95e percentile |
| --- | --- | --- | --- | --- |
| Ensemble avec arme : 1 position partagée | Butin seul | 5,57 h | 5,0 h | 9 h |
| Ensemble avec arme : 1 position partagée | Avec chutes ciblées | 5,182 h | 5,0 h | 6 h |
| Ensemble avec collier : 2 positions partagées | Butin seul | 5,492 h | 5,0 h | 8 h |
| Ensemble avec collier : 2 positions partagées | Avec chutes ciblées | 5,14 h | 5,0 h | 6 h |

Le calcul utilise 100 000 parcours par cas, à une cache par heure de référence. Le temps et les matériaux du craft, les achats au marché et le gain de vitesse d’un meilleur build ne sont pas inclus. La médiane décrit un ordre de grandeur de premier noyau de build, pas la durée pour obtenir ses quatre pièces avec les meilleurs affixes.

Pour un nommé, après vingt victoires de référence, environ 35,8 % des joueurs n’auraient toujours pas vu le drop direct à 5 %. Ils auraient néanmoins réuni les vingt fragments spéciaux : deux heures nominales de victoires. **C’est une garantie de matière, pas une garantie d’objet fini en deux heures** : il faut encore les autres ingrédients et l’accès à la fabrication ou au commerce. Le délai moyen jusqu’au drop ou à ces matières est d’environ 77 minutes dans ce modèle simple.

Les plans de base des familles sont appris avec le niveau du métier ; le boss ne verrouille pas à lui seul la connaissance de toutes les recettes. Des plans rares de variations ou d’apparences peuvent se trouver en butin, mais un artisan pur doit pouvoir les acheter. Le combattant fournit les trophées et fragments ; l’artisan fournit le travail, les matières ordinaires, le choix d’une pièce précise et la chance de signature exceptionnelle.

### Répartition des filières

| Production | Métier final | Fournisseurs et boucle |
| --- | --- | --- |
| Pièces métalliques Forgefeu | Forge | Minage ; lanières de Tannerie ; étoffe commune de Couture |
| Pièces de cuir Traqueur | Tannerie | Chasse pour peaux ; Bûcheronnage pour tanin ; fils de Couture |
| Pièces textiles Runiste et capes | Couture | Agriculture pour fibres ; Tannerie pour attaches ; Enchantement pour gravures avancées |
| Marteaux, haches, épées/boucliers, dagues | Forge | Minage + manches de Menuiserie + attaches |
| Arcs et arbalètes | Menuiserie | Bûcheronnage + composants métalliques de Forge + corde de Couture |
| Bâtons | Menuiserie | Bois préparé + élément gravé d’Enchantement |
| Sceptres et grimoires | Enchantement | Support de Forge/Menuiserie/Joaillerie ou reliure de Couture |
| Colliers et anneaux | Joaillerie | Minage ; perles de Pêche ; réactifs spécifiques |
| Gemmes à talent | Joaillerie | Gemme brute + préparation d’Enchantement + composant de source |
| Repas et potions | Cuisine / Alchimie | Pêche, Agriculture, Herboristerie et Chasse |
| Réparations de combat | Métier de la pièce | Service avec matériaux ; PNJ de secours comme puits d’or, sans destruction de l’objet |

Les quantités exactes de recettes sont volontairement différées. La profondeur de chaîne et les besoins de bas niveau doivent respecter le projet : pas dix métiers à haut niveau pour une seule pièce. Un fabricant de cape ne doit pas être obligé de maîtriser Forge pour terminer chaque commande.

### Le risque économique à corriger avant l’ouverture

Un équipement fini qui tombe souvent et rend 40 % de sa recette peut transformer le combat en meilleur récolteur du serveur. Exemple **hypothétique** : quatre pièces par heure, trente minutes de matières de récolte par recette, recyclage à 40 % = **48 minutes de récolte recréées par heure de combat**. On n’a même pas encore compté les caches et nommés. Le taux de 40 % n’est pas équilibré indépendamment du volume de loot.

Je propose pour les équipements de combat un recyclage en **poudres et fragments d’atelier**, utiles au perfectionnement et aux services, au lieu de rendre 40 % de toute leur recette ordinaire. La règle est identique pour une pièce fabriquée ou dropée : pas de différence cachée selon son origine. Les outils gardent leur recyclage actuel ; ce changement pour le combat est un arbitrage explicite, pas une modification déjà faite.

Le budget à surveiller est : `matériaux ordinaires recréés / heure de combat` face au rendement d’un récolteur dédié. Cible initiale proposée : moins de 10 % à temps égal. Si Louis préfère garder strictement 40 % de matières pour les armures aussi, les taux de pièces finies devront être abaissés ou leur coût de recette révisé. On ne peut pas figer les trois nombres séparément.

Les pièces et composants restent échangeables ; pas de rachat PNJ qui convertit ce surplus en or infini. Les fragments ont des versions par rang : aucun échange de composants 40 contre une recette 90 à taux favorable.

## 10. L’architecture des objets

### Classiques, ensembles et nommés

| Type | Ce qui le rend intéressant | Compromis |
| --- | --- | --- |
| Classique | Deux lignes fixes adaptées, bons jets, majeure libre sur les emplacements concernés | Aucun bonus d’ensemble ; sa souplesse doit valoir quelque chose |
| Pièce d’ensemble | Contribue à une mécanique 2/3/4 ; huit positions au choix | La recherche du bonus impose des emplacements et une orientation de lignes fixes |
| Nommé | Talent fixe particulier et lignes de Légendaire | Remplace la gemme majeure de sa place ; n’appartient pas à un ensemble dans ce lot |
| Chef-d’œuvre | Exemplaire signé : lignes choisies au jet maximal et ligne bonus selon le système existant | Ne donne pas une majeure supplémentaire, ni une rareté supérieure ni un bonus de set 5 pièces |

Les nommés de ce lot occupent l’arme ou le collier. Avec un nommé, il reste trois majeures libres ; avec deux, deux. La coiffe et le torse gardent donc une place pour des choix de gemme. Un objet nommé n’est pas automatiquement meilleur qu’un Légendaire classique portant la gemme exacte qu’un joueur recherche.

La rareté fixe le budget et le nombre de lignes, pas l’appartenance à un set. Le lot commence avec des ensembles Épiques et des nommés Légendaires ; une future pièce d’ensemble Légendaire n’aurait pas un deuxième talent caché en plus du set. Les traitements visuels Épique/Légendaire des équipements ordinaires peuvent demeurer.

| Rareté du modèle | Lignes fixes | Lignes aléatoires | Talents |
| --- | --- | --- | --- |
| Commun | 1 | 0–1 | La rareté ne crée aucun talent |
| Rare | 2 | 1–2 | La rareté ne crée aucun talent |
| Épique | 2 | 2–3 | Set éventuel, majeure éventuelle |
| Légendaire | 2 | 3–4 | Majeure libre ou talent fixé pour un nommé |

### Affixes et éléments

Les groupes envisagés sont Vitalité, Défense, Cadence, Critique, Dégâts critiques, Ténacité, Pénétration, Dégâts élémentaires, Puissance de soutien, Afflictions, Pression et Attaques de base. Un emplacement n’offre qu’un sous-ensemble cohérent. Il faut conserver assez de groupes distincts pour quatre lignes et la ligne bonus du chef-d’œuvre.

Le groupe élémentaire tire ensuite un type : Physique, Feu, Givre ou Foudre. **Un objet ne tire qu’une ligne de ce groupe.** Un bâton peut donc exister avec Givre sur un exemplaire et Feu sur un autre, sans deux modèles de bâton. Les armes de classe privilégient les types de leur répertoire ; les bijoux communs peuvent proposer les quatre types. Un build atypique de Saignement sur Runiste peut chercher ses lignes physiques sur ces bijoux, sans imposer du Physique à tous les bâtons.

Le nom d’un set n’impose pas son élément. Cendres valorise les afflictions choisies ; Orage valorise une rafale ; Incise valorise les formes de rune. Un affixe Givre n’applique pas un ralentissement et un affixe Feu ne crée pas une brûlure. Une brûlure vient d’un sort ou d’un talent qui la prévoit.

Un plastron offensif de Forgefeu peut porter Puissance + Critique ; il n’est pas forcé de consacrer toutes ses lignes à la Défense parce qu’il ressemble à une armure. Les silhouettes restent liées aux familles compatibles de classe ; les choix statistiques restent ouverts à l’intérieur de ces familles.

### Amélioration, rangs et recherche du bon jet

Je conserve le principe **pas de montée de palier ni de rareté de l’exemplaire en V1**. On trouve ou fabrique un nouvel exemplaire du rang suivant. Le set garde sa mécanique et sa clé de pièce ; il n’a pas besoin d’un nouveau nom et d’une nouvelle liste de bonus tous les dix niveaux.

Les modèles de conception du lot se déclinent aux rangs 40, 60, 80 et 90. Le catalogue classique garde ses tranches plus fréquentes. Cela réduit la redondance des sets sans supprimer les paliers d’équipement de progression. Les 298 modèles listés ici sont les variantes de base ; les futures entrées de palier et leurs chiffres ne sont pas présentées comme déjà créées.

Le perfectionnement améliore une ligne déjà présente, sans changer son type ni en inventer une. Point de départ proposé : +10 points de la plage du jet par service, plafond 90 %, coût croissant. Le chef-d’œuvre reste la manière rare d’obtenir les lignes choisies au maximum et sa ligne supplémentaire. Aucun reroll de talent ou d’élément n’est ajouté silencieusement. Les plafonds et coûts du service attendent les recettes et les prix.

Un mauvais jet peut ainsi se vendre à un budget plus faible, être amélioré si les bonnes lignes sont présentes, servir à une autre classe compatible ou fournir une poudre de service. Tous les modèles ne resteront pas optimaux au niveau 99 : un équipement de palier a déjà une utilité s’il rend une tranche de progression intéressante.

## 11. Les dix-huit ensembles

Chaque ensemble comporte huit pièces possibles par classe compatible, dont six vêtements, un anneau et un collier ou une arme. On en porte deux, trois ou quatre pour ses bonus ; pas de bonus cinq à huit. Deux exemplaires du même anneau ne valent qu’une pièce canonique, même avec un autre rang. Les statistiques des deux anneaux restent utilisables.

Les douze ensembles partagés créent des interactions ; les six propres aux classes modifient leurs mécanismes. Les huit positions sont volontairement généreuses : elles évitent qu’une arme nommée précise rende impossible le mélange recherché.

### 1. Cendres persistantes

**Trois classes · Épique · première version 40 · source : Les Forges éteintes.**

Entretenir une affliction et préparer une retombée.

**Lignes fixes proposées :** Puissance + Critique. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Durée des Brûlures et Saignements personnels +10 %, sans cumul supplémentaire. |
| 3 | Dégâts de ces afflictions +5 %. |
| 4 | Trois actions directes contre une cible brûlée ou saignante préparent Retombée : la prochaine ajoute 0,35 P à la cible et 0,20 P à un autre ennemi au plus. Délai 8 s. |

**Assemblages à essayer :** Afflictions de classe ou Cendre vive ; Passeurs pour les groupes ; Empreinte pour une proie durable.

**Limite :** Ne crée aucune affliction à lui seul ; une seule avance de compteur par action.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume de la Veillée noire | Capuche de la Veillée noire | Coiffe de la Veillée noire |
| Torse | Plastron — Feux dormants | Pourpoint — Feux dormants | Robe — Feux dormants |
| Gants | Gantelets — Tison têtu | Gants — Tison têtu | Mitaines — Tison têtu |
| Jambes | Grèves — Cendres basses | Chausses — Cendres basses | Bas — Cendres basses |
| Cape | Cape — Dernier charbon | Manteline — Dernier charbon | Cape — Dernier charbon |
| Ceinture | Ceinturon — Fumée lente | Ceinture — Fumée lente | Ceinture — Fumée lente |
| Anneau | Anneau de suie | Anneau de suie | Anneau de suie |
| Collier | Collier — Braise sourde | Collier — Braise sourde | Collier — Braise sourde |

### 2. L’Enclume patiente

**Trois classes · Épique · première version 40 · source : Les Forges éteintes.**

Absorber un vrai coup et rendre une partie de la pression.

**Lignes fixes proposées :** Défense + Puissance. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Défense +8 % de score, avant conversion. |
| 3 | Boucliers produits +6 %. |
| 4 | Après 0,75 P réellement absorbé par vos boucliers en 4 s, ripostez pour 0,35 P et protégez un bénéficiaire pour 0,25 P pendant 6 s. Délai 8 s. |

**Assemblages à essayer :** Boucliers natifs ; Revers récompense au contraire leur expiration ; Rivets change la cadence des plaques.

**Limite :** Le bouclier né de la riposte ne nourrit pas sa propre activation ; seuil lié à P, pas aux PV max.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume — Veille de fer | Capuche — Veille de fer | Coiffe — Veille de fer |
| Torse | Plastron — Serment lourd | Pourpoint — Serment lourd | Robe — Serment lourd |
| Jambes | Grèves — Appui sûr | Chausses — Appui sûr | Bas — Appui sûr |
| Bottes | Solerets — Marche lente | Bottes — Marche lente | Bottines — Marche lente |
| Cape | Cape — Cuir épais | Manteline — Cuir épais | Cape — Cuir épais |
| Ceinture | Ceinturon — Poids juste | Ceinture — Poids juste | Ceinture — Poids juste |
| Anneau | Anneau d’aplomb | Anneau d’aplomb | Anneau d’aplomb |
| Arme | Épée et bouclier — Poids du serment | Arbalète — Poids du serment | Sceptre — Poids du serment |

### 3. La Dernière empreinte

**Trois classes · Épique · première version 40 · source : La Lisière des veilleurs.**

Poursuivre une cible désignée et garder son rythme.

**Lignes fixes proposées :** Puissance + Critique. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Critique +4 points contre une cible marquée, sous plafond. |
| 3 | Durée de vos Marques +15 %. |
| 4 | Trois actions directes successives sur la même cible marquée préparent Point final : +0,45 P sur la prochaine. Délai 7 s ; changer de cible perd la préparation. |

**Assemblages à essayer :** Marque de classe ou Œil du chasseur ; Fulgurant monocible ; Tue-Bête ; Vigie.

**Limite :** Une Proie du Traqueur n’est pas automatiquement une Marque partagée.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume — Regard fixe | Capuche — Regard fixe | Coiffe — Regard fixe |
| Torse | Plastron — Longue visée | Pourpoint — Longue visée | Robe — Longue visée |
| Gants | Gantelets — Prise nette | Gants — Prise nette | Mitaines — Prise nette |
| Jambes | Grèves — Piste close | Chausses — Piste close | Bas — Piste close |
| Cape | Cape — Pas muet | Manteline — Pas muet | Cape — Pas muet |
| Ceinture | Ceinturon — Dernier signe | Ceinture — Dernier signe | Ceinture — Dernier signe |
| Anneau | Anneau — Œil d’étain | Anneau — Œil d’étain | Anneau — Œil d’étain |
| Arme | Hache — Cible promise | Dagues — Cible promise | Grimoire — Cible promise |

### 4. Ronces vives

**Trois classes · Épique · première version 40 · source : La Lisière des veilleurs.**

Transformer des contrôles en fenêtres offensives.

**Lignes fixes proposées :** Puissance + Ténacité. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Durée des ralentissements +10 %, hors étourdissement. |
| 3 | Les ennemis ralentis infligent 5 % de dégâts directs en moins au porteur. |
| 4 | Deux actions de classe ayant réellement contrôlé ou retiré de la Stabilité préparent une Ouverture : votre prochaine action directe applique Vulnérabilité +6 % pendant 4 s. Délai 8 s. |

**Assemblages à essayer :** Piégeur ; Sigillaire ; Enclumier ; armes à contrôle ; Fracture en trois pièces pour une autre entrée.

**Limite :** Les contrôles de gemme ne remplissent pas le compteur ; Vulnérabilité ne s’additionne jamais.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume — Taillis sourd | Capuche — Taillis sourd | Coiffe — Taillis sourd |
| Torse | Plastron — Racines hautes | Pourpoint — Racines hautes | Robe — Racines hautes |
| Gants | Gantelets — Épines fines | Gants — Épines fines | Mitaines — Épines fines |
| Jambes | Grèves — Ronces basses | Chausses — Ronces basses | Bas — Ronces basses |
| Bottes | Solerets — Sentier fermé | Bottes — Sentier fermé | Bottines — Sentier fermé |
| Ceinture | Ceinturon — Nœud vif | Ceinture — Nœud vif | Ceinture — Nœud vif |
| Anneau | Anneau du collet | Anneau du collet | Anneau du collet |
| Collier | Collier — Cœur de ronce | Collier — Cœur de ronce | Collier — Cœur de ronce |

### 5. L’Orage contenu

**Trois classes · Épique · première version 40 · source : Les Archives englouties.**

Concentrer une courte rafale de compétences, plutôt qu’alterner sans contrainte.

**Lignes fixes proposées :** Puissance + Cadence. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Cadence +5 % de score, avant conversion. |
| 3 | Après deux compétences différentes lancées à 2 s d’intervalle au plus, dégâts directs +4 % pendant 4 s. |
| 4 | Deux compétences différentes lancées à 2 s d’intervalle au plus préparent un Écho : la prochaine compétence ajoute 0,35 P du même type. Délai 10 s ; aucun soin, contrôle, coût ou critique copié. |

**Assemblages à essayer :** Deux sorts de Givre suffisent ; rotations de Trempe ; alternance Repérage/Poursuite.

**Limite :** La fenêtre de 2 s est le temps réel de la simulation ; les attaques de base ne la remplissent pas et ne consomment pas l’Écho.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Torse | Plastron — Orage bas | Pourpoint — Orage bas | Robe — Orage bas |
| Gants | Gantelets — Main d’averse | Gants — Main d’averse | Mitaines — Main d’averse |
| Jambes | Grèves — Pluie oblique | Chausses — Pluie oblique | Bas — Pluie oblique |
| Bottes | Solerets — Pas d’orage | Bottes — Pas d’orage | Bottines — Pas d’orage |
| Cape | Cape — Ciel lourd | Manteline — Ciel lourd | Cape — Ciel lourd |
| Ceinture | Ceinturon — Nœud de pluie | Ceinture — Nœud de pluie | Ceinture — Nœud de pluie |
| Anneau | Anneau de l’éclair muet | Anneau de l’éclair muet | Anneau de l’éclair muet |
| Collier | Collier — Orage clos | Collier — Orage clos | Collier — Orage clos |

### 6. Veilleurs du sceau

**Trois classes · Épique · première version 40 · source : Le Bastion des longues veilles.**

Conserver une partie de l’aide réellement utile.

**Lignes fixes proposées :** Puissance + Vitalité. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Soins et boucliers produits +6 %. |
| 3 | Ténacité +5 % de score pendant un bouclier. |
| 4 | 20 % des soins effectifs et de l’absorption réelle des boucliers de compétences alimentent une Réserve de 1,50 P au plus. Toutes les 8 s, elle devient un bouclier de 6 s sur un bénéficiaire. |

**Assemblages à essayer :** Les trois soutiens ; Enclume ; certains builds de contrôle avec protections natives.

**Limite :** Les effets d’équipement, le sursoin et les barrières secondaires ne remplissent pas la Réserve.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume — Veilleur pâle | Capuche — Veilleur pâle | Coiffe — Veilleur pâle |
| Torse | Plastron — Garde commune | Pourpoint — Garde commune | Robe — Garde commune |
| Gants | Gantelets — Mains de veille | Gants — Mains de veille | Mitaines — Mains de veille |
| Jambes | Grèves — Rempart bas | Chausses — Rempart bas | Bas — Rempart bas |
| Cape | Cape — Bannière close | Manteline — Bannière close | Cape — Bannière close |
| Ceinture | Ceinturon — Nœud de garde | Ceinture — Nœud de garde | Ceinture — Nœud de garde |
| Anneau | Anneau du guet | Anneau du guet | Anneau du guet |
| Arme | Hache — Garde commune | Dagues — Garde commune | Grimoire — Garde commune |

### 7. Les Relais du chemin gris

**Trois classes · Épique · première version 40 · source : La Lisière des veilleurs.**

Faire circuler attaque et aide dans le même plan.

**Lignes fixes proposées :** Puissance + Cadence. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Puissance des soins +5 %. |
| 3 | Après un soin effectif de compétence, la prochaine attaque de base gagne 0,15 P, une fois toutes les 6 s. |
| 4 | Une action directe prépare un Relais pendant 6 s. La prochaine compétence de soin ou bouclier le dépense pour ajouter 0,40 P de dégâts à la cible prioritaire. Délai 9 s. |

**Assemblages à essayer :** Soutiens offensifs ; Sifflet bref ; Refroidissement ; Sceau de répit.

**Limite :** Le Relais créé par un sort hybride attend une autre action ; le soin secondaire ne prépare rien.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Torse | Plastron — Chemin gris | Pourpoint — Chemin gris | Robe — Chemin gris |
| Gants | Gantelets — Main tendue | Gants — Main tendue | Mitaines — Main tendue |
| Jambes | Grèves — Marche commune | Chausses — Marche commune | Bas — Marche commune |
| Bottes | Solerets — Revers de route | Bottes — Revers de route | Bottines — Revers de route |
| Cape | Cape — Nœud fraternel | Manteline — Nœud fraternel | Cape — Nœud fraternel |
| Ceinture | Ceinturon — Veille du pont | Ceinture — Veille du pont | Ceinture — Veille du pont |
| Anneau | Anneau du relais | Anneau du relais | Anneau du relais |
| Collier | Collier — Lien du chemin | Collier — Lien du chemin | Collier — Lien du chemin |

### 8. Les Heures creuses

**Trois classes · Épique · première version 40 · source : Les Archives englouties.**

Associer une compétence longue à un geste court.

**Lignes fixes proposées :** Puissance + Cadence. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Dégâts des compétences à cooldown de base ≥18 s +4 %. |
| 3 | La première attaque de base après une telle compétence gagne 0,15 P ; délai 8 s. |
| 4 | Une compétence à cooldown de base ≥18 s prépare un Intervalle pendant 6 s. La prochaine compétence à cooldown de base ≤12 s gagne 0,45 P de dégâts sur sa cible. Délai 10 s. |

**Assemblages à essayer :** Sort long + Frappe d’atelier ; contrôle suivi d’une attaque ; sorts courts du Runiste.

**Limite :** Les seuils utilisent le cooldown inscrit sur le sort, avant Cadence ; attendre sans lancer n’est pas récompensé.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume — Heure bleue | Capuche — Heure bleue | Coiffe — Heure bleue |
| Torse | Plastron — Attente courte | Pourpoint — Attente courte | Robe — Attente courte |
| Gants | Gantelets — Temps prêté | Gants — Temps prêté | Mitaines — Temps prêté |
| Jambes | Grèves — Minute creuse | Chausses — Minute creuse | Bas — Minute creuse |
| Bottes | Solerets — Entre-deux | Bottes — Entre-deux | Bottines — Entre-deux |
| Cape | Cape — Dernier intervalle | Manteline — Dernier intervalle | Cape — Dernier intervalle |
| Anneau | Anneau du contretemps | Anneau du contretemps | Anneau du contretemps |
| Arme | Épée et bouclier — L’Entre-deux | Arbalète — L’Entre-deux | Sceptre — L’Entre-deux |

### 9. L’Autre revers

**Trois classes · Épique · première version 40 · source : Le Bastion des longues veilles.**

Profiter d’une protection qui a tenu.

**Lignes fixes proposées :** Puissance + Défense. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Durée des boucliers de compétences +1 s. |
| 3 | Un bouclier de compétence qui expire avec un reste soigne pour 10 % de ce reste, sans nouvelle Réserve. |
| 4 | À l’expiration naturelle d’un bouclier de compétence, réservez 35 % de son reste, au plus 0,50 P. La prochaine action directe libère cette Reprise. Délai 10 s. |

**Assemblages à essayer :** Gardes anticipées ; Sceau qui tient ; Glyphiste ; Enclume pour couvrir deux issues.

**Limite :** Un remplacement ou une fin de combat ne vaut pas expiration ; les boucliers d’équipement sont exclus.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume — Revers clair | Capuche — Revers clair | Coiffe — Revers clair |
| Torse | Plastron — Doublure sûre | Pourpoint — Doublure sûre | Robe — Doublure sûre |
| Gants | Gantelets — Main intacte | Gants — Main intacte | Mitaines — Main intacte |
| Bottes | Solerets — Pas conservé | Bottes — Pas conservé | Bottines — Pas conservé |
| Cape | Cape — Bannière à l’envers | Manteline — Bannière à l’envers | Cape — Bannière à l’envers |
| Ceinture | Ceinturon — Couture double | Ceinture — Couture double | Ceinture — Couture double |
| Anneau | Anneau du revers | Anneau du revers | Anneau du revers |
| Collier | Collier — Revers d’argent | Collier — Revers d’argent | Collier — Revers d’argent |

### 10. Les Passeurs de braise

**Trois classes · Épique · première version 40 · source : Les Forges éteintes.**

Transporter un peu de l’investissement entre cibles.

**Lignes fixes proposées :** Puissance + Cadence. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Dégâts personnels sur la durée +4 %. |
| 3 | Après la mort d’une cible affectée par votre affliction, votre prochaine attaque de base gagne 0,15 P ; délai 8 s. |
| 4 | À la mort d’une cible, transférez une affliction personnelle et son montant restant vers un autre ennemi. Sans autre ennemi, ou à l’expiration complète d’une affliction, préparez 0,30 P pour la prochaine action directe. Délai partagé 10 s. |

**Assemblages à essayer :** Brûlures de Forgefeu ou Runiste ; Saignements du Traqueur ; Cendres.

**Limite :** Transférer ne recopie pas les dégâts déjà infligés ; un effet transféré reste secondaire et ne se retransfère pas.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume — Passage tiède | Capuche — Passage tiède | Coiffe — Passage tiède |
| Torse | Plastron — Braise portée | Pourpoint — Braise portée | Robe — Braise portée |
| Jambes | Grèves — Dernière foulée | Chausses — Dernière foulée | Bas — Dernière foulée |
| Bottes | Solerets — Pas de suie | Bottes — Pas de suie | Bottines — Pas de suie |
| Cape | Cape — Cape du passeur | Manteline — Cape du passeur | Cape — Cape du passeur |
| Ceinture | Ceinturon — Nœud de charbon | Ceinture — Nœud de charbon | Ceinture — Nœud de charbon |
| Anneau | Anneau du tison voyageur | Anneau du tison voyageur | Anneau du tison voyageur |
| Collier | Collier — Braise de poche | Collier — Braise de poche | Collier — Braise de poche |

### 11. La Vigie sans sommeil

**Trois classes · Épique · première version 40 · source : Le Bastion des longues veilles.**

Faire de la place aux attaques de base entre les compétences.

**Lignes fixes proposées :** Puissance + Critique. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Dégâts des attaques de base +5 %. |
| 3 | Une attaque de base sur une cible marquée donne 0,10 P de protection personnelle, délai 6 s. |
| 4 | Si vous n’avez lancé aucune compétence depuis 3 s, votre prochaine attaque de base ajoute 0,55 P. Sous 60 % de PV, 0,15 P du montant devient un soin. Délai 8 s. |

**Assemblages à essayer :** Rebattue ; alternance du Traqueur ; plans qui laissent les attaques de base travailler.

**Limite :** Les attaques de base continuent entre les sorts. Un plan très chargé ne profite pas automatiquement du quatre pièces.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume — Guet de nuit | Capuche — Guet de nuit | Coiffe — Guet de nuit |
| Torse | Plastron — Veille serrée | Pourpoint — Veille serrée | Robe — Veille serrée |
| Gants | Gantelets — Mains éveillées | Gants — Mains éveillées | Mitaines — Mains éveillées |
| Jambes | Grèves — Pas de ronde | Chausses — Pas de ronde | Bas — Pas de ronde |
| Bottes | Solerets — Dernier tour | Bottes — Dernier tour | Bottines — Dernier tour |
| Ceinture | Ceinturon — Nœud de guet | Ceinture — Nœud de guet | Ceinture — Nœud de guet |
| Anneau | Anneau de la vigie | Anneau de la vigie | Anneau de la vigie |
| Arme | Épée et bouclier — La Sentinelle | Arbalète — La Sentinelle | Sceptre — La Sentinelle |

### 12. Les Mains de traverse

**Trois classes · Épique · première version 40 · source : Les Archives englouties.**

Ouvrir une défense et profiter du coup suivant.

**Lignes fixes proposées :** Puissance + Ténacité. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Pression des compétences +8 %. |
| 3 | Après une action de classe qui retire de la Stabilité ou dissipe un effet, +4 % de dégâts directs pendant 4 s. |
| 4 | Une telle action prépare une Fêlure pendant 6 s. La prochaine compétence directe gagne 0,40 P et applique Vulnérabilité +5 % pendant 4 s. Délai 9 s. |

**Assemblages à essayer :** Tous les contrôleurs ; purge de chaque classe ; alternative à Ronces ; boss à Stabilité.

**Limite :** La Vulnérabilité de Ronces est plus forte, les deux valeurs ne s’ajoutent pas.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume — Biais de pierre | Capuche — Biais de pierre | Coiffe — Biais de pierre |
| Torse | Plastron — Traverse courte | Pourpoint — Traverse courte | Robe — Traverse courte |
| Gants | Gantelets — Mains de traverse | Gants — Mains de traverse | Mitaines — Mains de traverse |
| Jambes | Grèves — Assise fendue | Chausses — Assise fendue | Bas — Assise fendue |
| Cape | Cape — Poussière grise | Manteline — Poussière grise | Cape — Poussière grise |
| Ceinture | Ceinturon — Joint ouvert | Ceinture — Joint ouvert | Ceinture — Joint ouvert |
| Anneau | Anneau de la fêlure | Anneau de la fêlure | Anneau de la fêlure |
| Collier | Collier — Pierre de biais | Collier — Pierre de biais | Collier — Pierre de biais |

### 13. Le Fer du second feu

**Forgefeu · Épique · première version 40 · source : Les Forges éteintes.**

Changer le rythme Chauffe/Trempe.

**Lignes fixes proposées :** Puissance + Cadence. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Dégâts des gestes de Chauffe +4 %. |
| 3 | Une Trempe à trois Braises protège pour 0,20 P pendant 4 s. |
| 4 | Une Trempe qui consomme au moins deux Braises rend une Braise après sa résolution. Délai 8 s ; cette Braise rendue ne compte pas comme une Chauffe. |

**Assemblages à essayer :** Toutes les voies Forgefeu ; rend possible une séquence Chauffe/Trempe/Trempe sans rendre chaque Trempe maximale.

**Limite :** Ne rend jamais trois Braises ; ni réduction de cooldown ni auto-alimentation de compteur.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume — Second feu | — | — |
| Torse | Plastron — Fer revenu | — | — |
| Gants | Gantelets — Prise de recuit | — | — |
| Jambes | Grèves — Scories froides | — | — |
| Bottes | Solerets — Pas de forge | — | — |
| Ceinture | Ceinturon — Nœud de four | — | — |
| Anneau | Anneau du recuit | — | — |
| Arme | Marteau — Le Recuiseur | — | — |

### 14. Les Rivets du serment

**Forgefeu · Épique · première version 40 · source : Le Bastion des longues veilles.**

Mettre les gestes ordinaires au service de la Trempe.

**Lignes fixes proposées :** Puissance + Défense. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Boucliers de compétences +5 %. |
| 3 | La première attaque de base après une Trempe ajoute 0,15 P ; délai 6 s. |
| 4 | Une Trempe réserve un Rivet par Braise consommée, trois au plus, pendant 8 s. Chaque prochaine attaque de base dépense un Rivet pour protéger pour 0,18 P. Les réserves sont remplacées, jamais additionnées. |

**Assemblages à essayer :** Rémouleur ; Trempe-Rouge protégé ; Enclumier qui prépare un gros cycle.

**Limite :** Ces boucliers sont secondaires : ils ne créent ni Encre ni Réserve de Sceau.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | Heaume — Serment riveté | — | — |
| Torse | Plastron — Plaque fidèle | — | — |
| Gants | Gantelets — Mains liées | — | — |
| Bottes | Solerets — Pas du serment | — | — |
| Cape | Cape — Cape du garant | — | — |
| Ceinture | Ceinturon — Dernier rivet | — | — |
| Anneau | Anneau du garant | — | — |
| Collier | Collier — Nœud du serment | — | — |

### 15. La Battue silencieuse

**Traqueur · Épique · première version 40 · source : La Lisière des veilleurs.**

Exploiter les ouvertures sans abandonner les groupes.

**Lignes fixes proposées :** Puissance + Critique. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Durée d’Angle mort +2 s. |
| 3 | Les gestes de Repérage infligent +4 % de dégâts. |
| 4 | Consommer un Angle porte aussi 0,35 P à un second ennemi. S’il n’y en a pas, préparez un bonus de 0,25 P pour votre prochaine attaque de base. Délai 8 s. |

**Assemblages à essayer :** Les trois voies ; permet de garder des sorts de cible unique dans un donjon à groupes.

**Limite :** Le second impact ne consomme pas un second Angle ; branche solo moins forte que la somme de deux cibles.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | — | Capuche — Battue basse | — |
| Gants | — | Gants — Main sans bruit | — |
| Jambes | — | Chausses — Piste couverte | — |
| Bottes | — | Bottes — Pas étouffés | — |
| Cape | — | Manteline — Cape de rabattage | — |
| Ceinture | — | Ceinture — Nœud de piste | — |
| Anneau | — | Anneau du rabatteur | — |
| Arme | — | Dagues — Le Rabatteur | — |

### 16. Les Pas dans les pas

**Traqueur · Épique · première version 40 · source : Le Bastion des longues veilles.**

Faire alterner le porteur et son compagnon.

**Lignes fixes proposées :** Puissance + Cadence. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Dégâts des compétences de compagnon +5 %. |
| 3 | Après une compétence de compagnon, la prochaine attaque de base gagne 0,15 P ; délai 6 s. |
| 4 | Une compétence sans compagnon prépare un Pas pendant 6 s. La prochaine compétence de compagnon le dépense : 0,35 P de dégâts et 0,25 P de soin. Délai 9 s. |

**Assemblages à essayer :** Meneur ; Tue-Bête avec Morsure croisée ; Piégeur avec Laissé pour compte.

**Limite :** Un compagnon est un mode d’action du kit, pas un personnage ajouté ni une source indépendante de procs.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Torse | — | Pourpoint — Deuxième pas | — |
| Gants | — | Gants — Meute proche | — |
| Jambes | — | Chausses — Main du siffleur | — |
| Bottes | — | Bottes — Pattes de cuir | — |
| Cape | — | Manteline — Cape du meneur | — |
| Ceinture | — | Ceinture — Nœud de meute | — |
| Anneau | — | Anneau de la meute | — |
| Collier | — | Collier — Lien de meute | — |

### 17. Le Palimpseste

**Runiste · Épique · première version 40 · source : Les Archives englouties.**

Relire deux fois la même forme et la faire revenir dans la suite de la phrase.

**Lignes fixes proposées :** Puissance + Cadence. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Valeurs des effets de rune +8 %. |
| 3 | Après lecture d’un Sceau, votre prochaine attaque de base ajoute 0,15 P ; délai 8 s. |
| 4 | Après deux lectures consécutives d’une même forme de rune, le prochain sort rejoue cette rune à 150 % de sa valeur. Délai 8 s. La copie ne s’écrit pas et ne remplit aucun compteur. |

**Assemblages à essayer :** Les trois voies ; phrases monoélément possibles ; Sceau pour l’aide, Trait pour le direct.

**Limite :** A–A–B permet de lire deux fois A : la copie de A attend le quatrième sort. Seule la petite rune est copiée, jamais le sort complet.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | — | — | Coiffe — Marge ancienne |
| Torse | — | — | Robe — Peau d’encre |
| Gants | — | — | Mitaines — Doigts raturés |
| Jambes | — | — | Bas — Lignes basses |
| Bottes | — | — | Bottines — Cape réécrite |
| Cape | — | — | Cape — Dernière marge |
| Anneau | — | — | Anneau du palimpseste |
| Arme | — | — | Sceptre — Le Palimpseste |

### 18. La Phrase inachevée

**Runiste · Épique · première version 40 · source : La Lisière des veilleurs.**

Revenir à une forme et obtenir une ponctuation.

**Lignes fixes proposées :** Puissance + Ténacité. Les valeurs par emplacement ne sont pas calibrées.

| Pièces | Bonus |
| --- | --- |
| 2 | Dégâts directs après un changement de forme +4 % pendant 3 s. |
| 3 | Une forme Trait suivant Sceau ajoute 0,15 P de protection, délai 8 s. |
| 4 | Une séquence A–B–A de trois sorts, avec A différent de B, prépare une Incise : votre prochain sort ajoute 0,40 P à la cible et 0,25 P de protection. Délai 10 s. Les formes, pas les éléments, définissent la séquence. |

**Assemblages à essayer :** Sigillaire Givre ; Glyphiste qui alterne garde et attaque ; Fulgurant à séquences.

**Limite :** La préparation attend le quatrième sort ; le sort qui termine A–B–A ne la consomme pas.

| Pièce canonique | Forgefeu | Traqueur | Runiste |
| --- | --- | --- | --- |
| Coiffe | — | — | Coiffe — Point suspendu |
| Torse | — | — | Robe — Ligne ouverte |
| Jambes | — | — | Bas — Phrase basse |
| Bottes | — | — | Bottines — Pas de marge |
| Cape | — | — | Cape — Cape d’incise |
| Ceinture | — | — | Ceinture — Nœud du point |
| Anneau | — | — | Anneau de l’incise |
| Collier | — | — | Collier — Point suspendu |

### Répartitions d’équipement

4+4 n’est pas le seul objectif. 4+3+2 avec deux nommés est un choix concret des plans joints. Selon les positions disponibles, 4+4+3, 4+3+2+2, 3+3+3+2 ou cinq bonus de deux pièces peuvent aussi être construits ; ils ne réservent pas tous une place à un nommé. Leur puissance doit se comparer au même budget d’objets et de talents.

Les 273 paires contrôlées représentent 91 associations possibles par classe : ses douze sets communs et ses deux sets propres. Chacune peut porter quatre pièces de chaque set avec une arme et un collier nommés. Ce résultat prouve une liberté **d’emplacements** ; il ne prouve pas que chaque paire a une synergie ou le même rendement.

## 12. Les vingt-quatre objets nommés

Tous sont Légendaires dans ce lot : deux lignes fixes, trois à quatre aléatoires, un talent fixé qui occupe une majeure. Le type d’arme oriente sa silhouette et sa cadence, pas l’élément de tous les sorts. Les six premiers modèles de niveau 20 comprennent deux armes par classe ; leurs sources avancées peuvent aussi fournir les nouveaux exemplaires de palier.

### Forgefeu

**La Rancune** · Marteau · premier rang 20 · Le Veilleur de four.

Une perte réelle de PV due à une attaque ennemie donne une Rancune, une par seconde, trois au plus. La prochaine action directe les dépense pour 0,12 P chacune ; délai 8 s.

À essayer : Trempe-Rouge qui accepte quelques coups ; soutien de récupération.

Limite : Les coups entièrement absorbés ne donnent aucune Rancune.

**Les Bonnes Manières** · Épée et bouclier · premier rang 20 · La Cloche de fer.

Une action de classe qui interrompt ou retire de la Stabilité protège un bénéficiaire pour 0,35 P pendant 6 s ; délai 10 s.

À essayer : Enclumier ; Fracture ; bouclier de secours pour un autre Forgefeu.

Limite : Une action de zone ne donne qu’une protection.

**La Part du feu** · Hache · premier rang 40 · Le Cerf de braise.

Une action directe prolonge toutes vos afflictions présentes sur sa cible de 1 s ; délai 6 s ; au plus 2 s ajoutées à chaque application.

À essayer : Cendres ; Passeurs ; brûlure native ou gemme.

Limite : La prolongation conserve le débit et ajoute des dégâts ; son plafond est attaché à l’application.

**Le Compte y est** · Marteau · premier rang 40 · Le Contremaître rouge.

Une Trempe à trois Braises réserve 0,45 P pour votre prochaine attaque de base ; délai 10 s.

À essayer : Rebattue ; Vigie ; Trempe maximale.

Limite : Équiper Recuit ne permet pas d’ignorer les trois Braises requises.

**Le Dernier Rivet** · Épée et bouclier · premier rang 40 · Le Gardien des trois portes.

Après une Trempe à deux Braises au moins, votre prochain geste de Chauffe protège pour 0,40 P pendant 6 s ; délai 10 s.

À essayer : Cycle de protection ; Enclumier ; alternance de gestes.

Limite : Le geste qui prépare le Rivet ne peut pas le consommer.

**Ça va tenir** · Hache · premier rang 40 · L’Intendant de verre.

À l’expiration naturelle d’un bouclier de compétence, votre prochaine Trempe soigne pour 0,45 P ; délai 12 s.

À essayer : Revers ; Rémouleur ; garde anticipée.

Limite : Fin de rencontre, remplacement et bouclier d’équipement sont exclus.

### Traqueur

**Murmure-d’épine** · Arc long · premier rang 20 · Le Veilleur de four ; autre source : Le Veneur creux.

Un critique primaire sur une cible marquée ajoute 0,25 P sur un autre ennemi, ou sur la même cible si elle est seule ; délai 8 s.

À essayer : Empreinte ; critique ; Vigie.

Limite : Le projectile ajouté ne critique pas.

**La Ponctuelle** · Arbalète · premier rang 20 · La Cloche de fer ; autre source : La Matriarche de résine.

Une action directe sur une cible ralentie ou étourdie ajoute 0,45 P ; délai 12 s.

À essayer : Piégeur ; Frimas tenace ; contrôle léger de gemme.

Limite : Le talent ajoute des dégâts, pas du contrôle.

**Les Sœurs silencieuses** · Dagues · premier rang 40 · La Cloche de fer.

Une action de classe qui contrôle ou retire de la Stabilité prépare un Saignement de 0,30 P sur 6 s pour la prochaine action directe ; délai 10 s.

À essayer : Piégeur vers Cendres ; alternatives au pur contrôle.

Limite : Un seul Saignement de ce talent par cible.

**Le Témoin discret** · Arc long · premier rang 40 · Le Témoin sous l’eau.

Consommer un Angle sur une cible marquée conserve 2 s de son Angle pour votre prochain geste de Repérage ; celui-ci gagne 0,35 P de dégâts, délai 10 s.

À essayer : Lecture de piste ; Repérage offensif ; les trois voies.

Limite : Le reliquat est une préparation de dégâts, pas un second Angle instantané.

**Sans sommation** · Arbalète · premier rang 40 · Le Héraut des trois vents.

La première Poursuite sur une nouvelle Proie ajoute 0,50 P ; contre une Proie déjà connue, chaque troisième Angle consommé ouvre le même effet. Délai 12 s.

À essayer : Battue ; boss durable ; chasse de groupes.

Limite : Changer la priorité de cible sans nouvelle cible vivante ne réarme pas le talent.

**La Part du chien** · Dagues · premier rang 40 · Le Porte-serment de la meute.

Consommer un Ordre de meute ou lancer une compétence de compagnon après une Poursuite prépare un soin de 0,40 P pour votre prochaine compétence de compagnon ; délai 12 s.

À essayer : Meneur ; soins compagnons ; Meute.

Limite : La compétence qui prépare le soin attend la suivante pour le recevoir.

### Runiste

**Le Dernier Avertissement** · Bâton · premier rang 20 · Le Veilleur de four ; autre source : Le Témoin sous l’eau.

Lancer une même compétence deux fois en 14 s prépare une Sommation. Votre prochain sort marque sa cible pendant 6 s et rejoue à 100 % la rune qu’il lit. Délai 10 s.

À essayer : Empreinte ; plans réguliers ; les trois éléments.

Limite : La copie reste secondaire : elle ne s’écrit pas, ne produit pas d’Encre et ne remplit aucun compteur.

**Le Sceau qui tient** · Sceptre · premier rang 20 · La Cloche de fer ; autre source : L’Intendant de verre.

Un bouclier de compétence qui expire avec un reste soigne son bénéficiaire pour 0,35 P ; délai 12 s.

À essayer : Revers ; Glyphiste ; protection anticipée.

Limite : Le soin est secondaire ; il n’alimente ni Encre ni Réserve.

**Le Livre des ratures** · Grimoire · premier rang 40 · Le Contremaître rouge.

Un critique primaire sur une cible brûlée ou saignante ajoute 0,25 P du même type ; délai 8 s.

À essayer : Cendres ; affliction de gemme ; critique.

Limite : Une affliction seule ne provoque pas de critique ni de boucle.

**Le Point-virgule** · Bâton · premier rang 40 · Le Notaire des marées.

Lire Trait avec un sort de forme Cercle ajoute 0,40 P de dégâts à la cible principale ; délai 10 s.

À essayer : Alternance de formes ; Incise ; contrôle avec attaque.

Limite : Deux éléments différents ne sont pas requis.

**L’Objection** · Grimoire · premier rang 40 · Le Chantre muet.

Une action de classe qui contrôle ou retire de la Stabilité réserve la rune lue. La prochaine attaque de base la rejoue à 200 % ; délai 12 s.

À essayer : Sigillaire ; Palimpseste ; contrôle via plusieurs éléments.

Limite : La rune rejouée est secondaire et ne s’écrit jamais.

**La Clé sans serrure** · Sceptre · premier rang 40 · Le Gardien des trois portes.

Dissiper un effet avec une compétence ou lire Sceau avec un sort Trait prépare 0,35 P de protection pour la prochaine compétence ; délai 12 s.

À essayer : Glyphiste hybride ; purge ; gardes à ponctuation.

Limite : Une dissipation impossible ne déclenche rien, mais l’autre entrée reste accessible.

### Colliers universels

**Le Bénéfice du doute** · Bijou · premier rang 40 · Le Chantre muet.

Une tentative de contrôle dur convertie en Pression sur un boss, ou réellement résistée en PvP, protège pour 0,40 P pendant 6 s ; délai 12 s.

À essayer : Contrôleurs ; boss à Stabilité.

Limite : Ne transforme pas un contrôle résisté en contrôle réussi pour les autres compteurs.

**Le Fil du retour** · Bijou · premier rang 40 · Le Porte-serment de la meute.

Un soin effectif de compétence prépare un Fil. La prochaine action directe marque sa cible pendant 6 s et rend 0,25 P de soin au bénéficiaire du soin initial. Délai 10 s.

À essayer : Soutiens vers Empreinte ; soins personnels en solo.

Limite : Le soin de retour est secondaire ; aucun Fil ne peut se nourrir lui-même. En groupe, le bénéficiaire initial est mémorisé.

**Le Petit Arrangement** · Bijou · premier rang 40 · Le Collecteur du bourbier.

Une action directe pendant un bouclier personnel soigne pour 0,30 P sur 4 s ; délai 10 s.

À essayer : Protections ; agressivité sûre ; Enclume.

Limite : Régénération secondaire : ni Réserve ni Fil du retour.

**La Dette légère** · Bijou · premier rang 40 · La Matriarche de résine.

Après 0,60 P absorbé par un bouclier de compétence, la prochaine compétence de soin gagne 0,40 P ; délai 12 s.

À essayer : Soutien de récupération ; protection suivie de soin.

Limite : La protection de matériel n’ouvre pas cette entrée.

**Les Heures supplémentaires** · Bijou · premier rang 40 · Le Héraut des trois vents.

Une compétence à cooldown de base ≥18 s prépare 0,35 P pour la prochaine attaque de base ; délai 12 s.

À essayer : Intervalles ; Vigie ; rotations lentes.

Limite : Le temps passé hors combat ne prépare rien.

**Le Mauvais Présage** · Bijou · premier rang 40 · La Sentinelle fendue.

Après une Rupture de Stabilité à laquelle vous avez contribué, ou une dissipation réussie de compétence, votre prochaine action directe ajoute 0,45 P ; délai 12 s.

À essayer : Fracture ; contrôleurs ; utilitaires de purge.

Limite : Les contributeurs se qualifient individuellement ; aucune multiplication de la Vulnérabilité.

Deux talents ont été revus parce qu’ils seraient autrement moins intéressants qu’une gemme libre : le Dernier Avertissement ajoute une relecture de rune à sa Marque conditionnelle ; le Fil du retour rend un soin au bénéficiaire initial en plus du marquage. Un talent fixe avec plus de contraintes et exactement le même résultat qu’une gemme n’a pas une identité suffisante.

## 13. Les gemmes

Une même majeure n’est active qu’une fois. Arme, torse, coiffe et collier fournissent quatre places au total, **nommés inclus**. Les autres places reçoivent des mineures de statistiques, sans déclencheur caché. Un chef-d’œuvre ou une rareté supérieure ne contourne jamais ce total.

Le lot chiffre une version de référence de chaque majeure. Je n’ajoute pas immédiatement quatre raretés qui changent chacune les clauses du talent : ce serait multiplier le nombre de règles avant d’avoir éprouvé la première. Les rangs de gemme et leur progression peuvent ensuite être calibrés avec le moteur réel.

| Gemme majeure | Talent | Chemin qu’elle ouvre |
| --- | --- | --- |
| Cendre vive | Une action directe applique une Brûlure de 0,20 P sur 6 s ; délai 8 s. | Afflictions accessibles sans changer de classe. |
| Plaie ouverte | Un critique primaire applique un Saignement de 0,25 P sur 6 s ; délai 8 s. | Critique vers dégâts prolongés. |
| Œil du chasseur | Votre prochaine action directe applique Marque pendant 6 s ; délai 10 s. | Accès à Empreinte et Vigie. |
| Bastion | Au début d’une rencontre, protégez-vous pour 0,65 P pendant 8 s ; délai persistant 20 s. | Amortir une ouverture sans reproduire un kit de protecteur. |
| Souffle polaire | Une action directe ralentit de 10 % pendant 2 s ; délai 8 s. | Ouvre les conditions de cible ralentie, sans crédit de contrôle de classe. |
| Rythme | Après quatre actions directes, votre prochaine attaque de base ajoute 0,30 P ; délai 10 s. | Rotation vers attaque de base. |
| Retour d’onde | Un vrai coup ennemi qui brise votre bouclier déclenche 0,25 P sur l’attaquant ; délai 10 s. | Rupture réellement subie ; aucun effet à l’expiration. |
| Assistance fine | Une action de classe qui contrôle ou retire de la Stabilité soigne un bénéficiaire pour 0,30 P ; délai 10 s. | Contrôle vers récupération, sans crédit de soin primaire. |
| Garde alternée | Après une compétence de soin effectif ou de protection, protégez-vous pour 0,30 P pendant 6 s ; délai 10 s. | Aide native vers garde personnelle. |
| Marque de retour | Une action directe sur une cible marquée soigne pour 0,25 P ; délai 6 s. | Poursuite vers autonomie. |
| Frimas tenace | Une action directe sur une cible ralentie ajoute 0,25 P du même type ; délai 8 s. | Dégâts issus d’un ralentissement, sans imposer Givre. |
| Abri de cendre | Un critique primaire sur une cible brûlée ou saignante protège pour 0,30 P pendant 6 s ; délai 10 s. | Affliction et critique vers protection. |
| Patience taillée | Une compétence à cooldown de base ≥18 s prépare un soin de 0,30 P sur la prochaine attaque de base ; délai 12 s. | Geste long vers récupération. |
| Grâce oblique | Un soin effectif de compétence prépare 0,25 P pour votre prochaine action directe ; délai 10 s. | Soutien offensif ; aucun crédit sur sursoin. |
| Éclat de passage | À la mort de votre cible, la prochaine attaque de base ajoute 0,35 P. Sur une cible durable, chaque cinquième compétence prépare le même effet ; délai 12 s. | Transition de cible avec une solution monocible. |
| Tranchant net | Une dissipation, purification utile ou perte réelle de Stabilité infligée par une compétence prépare 0,30 P pour la prochaine action directe ; délai 10 s. | Utilitaires vers attaque. |
| Pouls régulier | Deux compétences différentes avec un cooldown de base ≤12 s préparent un bouclier de 0,30 P pour votre prochaine attaque de base ; délai 10 s. | Plans courts, attaques de base et garde. |
| Dernière étincelle | Sous 40 % de PV, votre prochaine compétence protège pour 0,55 P pendant 6 s ; délai 20 s. | Filet de sécurité lisible, sans invulnérabilité. |

### Mineures statistiques

| Famille | Statistique |
| --- | --- |
| Grenat de vigueur | Puissance |
| Jaspe robuste | Vitalité |
| Onyx de garde | Défense |
| Aigue-marine vive | Cadence |
| Quartz aigu | Critique |
| Hématite ancrée | Ténacité |
| Zircon de percée | Pénétration |
| Opale accordée | Dégâts élémentaires |

Les majeures s’extraient et se réutilisent avec un coût de matériaux/service ; changer de pièce ne détruit pas le cœur du build. Le niveau du métier sert à fabriquer la gemme, le niveau de classe sert à porter sa version de combat. Les gemmes de métier restent un catalogue distinct, porté par les équipements de métier : aucune obligation de combattre pour le récolteur.

## 14. Synergies, choix et limites

Une association intéressante relie une source et un usage, puis pose un compromis. Deux sets qui ajoutent chacun des dégâts indépendants ne constituent pas automatiquement une interaction. Les exemples suivants sont des chemins ; ils ne sont pas les seuls builds autorisés.

| Chaîne | Ce qu’elle permet | Ce qui l’empêche de tout faire |
| --- | --- | --- |
| Chauffes → Trempe → Recuit → nouvelle Trempe | Changer le tempo du Forgefeu avec moins de Chauffes intermédiaires | Une seule Braise rendue, délai 8 s ; la suivante n’est pas forcément maximale |
| Trempe-Rouge → Rebattue → Vigie / Rivets | Faire travailler les attaques de base après une dépense | Vigie demande une vraie fenêtre sans compétence ; une nouvelle Trempe remplace sa réserve |
| Enclumier → Assise → Chauffe | Conserver des dégâts utiles tout en préparant Pression et affaiblissement | L’Assise n’est utilisable que par une Chauffe, pas par toutes les ripostes |
| Repérage → Angle → Poursuite → Battue | Garder un jeu de Proie avec une réponse aux groupes | Un seul Angle consommé ; le coup secondaire n’en crée pas un autre |
| Poursuite → Ordre → compétence de compagnon → Meute | Soutien offensif avec une vraie alternance porteur/compagnon | L’Ordre attend une intervention suivante ; ni pet autonome ni déclenchement en cascade |
| Sœurs silencieuses → affliction → Cendres | Un Piégeur peut faire un build d’afflictions | Le contrôle de classe prépare le Saignement, la gemme de ralentissement ne suffit pas |
| T–T–C → Palimpseste / Dernier Avertissement | Revenir à une rune sans recopier un gros sort entier | Les copies restent secondaires, ne s’écrivent pas et ne fabriquent pas d’Encre |
| T–S–T → Incise → sort suivant | Une ponctuation qui combine attaque et protection | L’Incise attend une action suivante ; ce n’est pas un bonus gratuit à chaque alternance |
| Sceau natif → absorption réelle → Encre → Trait | Convertir une protection utile en dégâts de Glyphiste | PV max, sursoin et bouclier d’équipement ne remplissent pas l’Encre |
| Soin natif → Fil du retour → attaque → Marque | Un soutien peut investir Empreinte et continuer à aider | Le soin de retour est secondaire et ne prépare pas un nouveau Fil |
| Bouclier natif → Enclume ou Revers | Couvrir deux issues d’une garde, bris/absorption ou expiration | Prendre les deux sets consomme huit pièces ; une expiration ne vaut jamais un bris |
| Compétence longue → Intervalles → compétence courte | Construire une frappe préparée sur les cooldowns | Seuils de base ≥18 / ≤12 s, pas les cooldowns modifiés par Cadence |
| Marque → Empreinte / Vigie / Murmure-d’épine | Plusieurs façons d’exploiter la désignation d’une cible | Changer de cible perd la préparation d’Empreinte ; tous les effets ne sont pas bons en groupe |
| Brûlures et Saignements → Part du feu → Passeurs | Entretenir plusieurs applications et sauver un investissement à la mort | Trois applications par type/porteur ; extensions bornées ; transfert du restant seulement |
| Pression → Fracture ou Ronces → fenêtre de dégâts | Faire du contrôle une ouverture offensive même sur boss | Vulnérabilités non cumulables ; récupérer de la Stabilité bloque les crédits artificiels |

### Des incompatibilités qui doivent être visibles

Un plan sans soin natif ne fait pas fonctionner Fil du retour avec un simple soin de gemme. Un plan sans bouclier de compétence n’alimente pas Encre ou la Réserve à partir de Bastion. Une gemme Souffle polaire ouvre Frimas mais pas les Scellés du Sigillaire. Un set Fracture ne considère pas tout ralentissement comme une perte de Stabilité. Une arme sans affliction et sans gemme appropriée ne suffit pas à lancer Cendres.

Ces limites ne servent pas à punir l’expérimentation : l’éditeur les explique avant le lancement. On peut équiper une combinaison inhabituelle ; le jeu signale simplement « aucune source connue pour ce déclencheur » et montre ce qui manque.

## 15. Vingt-sept plans d’exemple

Chaque voie a trois points de départ. Leurs sorts, leurs déclencheurs et parfois leur répartition de pièces changent. Ils sont vérifiés pour les emplacements, pas proposés comme trois solutions définitives qui remplaceraient la recherche du joueur. Tous réservent quatre talents majeurs au total.

### Braise longue — Forgefeu / Trempe-Rouge

**Pièces :** 4 Cendres persistantes + 4 Les Passeurs de braise.

**Nommés :** La Part du feu. **Gemmes majeures :** Cendre vive, Œil du chasseur, Dernière étincelle.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Frappe d’atelier | Deuxième frappe |
| 2 s | Trempe vive | Jet de scories |
| 4 s | Éclat du four | Grand soufflet |
| 7 s | Jet de scories | La Grande Trempe |
| 10 s | Garde rouge | Garde rouge |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Heaume de la Veillée noire |
| Torse | Plastron — Feux dormants |
| Gants | Gantelets — Tison têtu |
| Jambes | Grèves — Cendres basses |
| Bottes | Solerets — Pas de suie |
| Cape | Cape — Cape du passeur |
| Ceinture | Ceinturon — Nœud de charbon |
| Anneau 1 | Anneau du tison voyageur |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Classique adapté au plan ; majeure libre si la place en offre une |
| Arme | La Part du feu |

### Marteau battant — Forgefeu / Trempe-Rouge

**Pièces :** 4 Le Fer du second feu + 4 La Vigie sans sommeil.

**Nommés :** Le Compte y est, Les Heures supplémentaires. **Gemmes majeures :** Plaie ouverte, Marque de retour.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Frappe d’atelier | Frappe d’atelier |
| 2 s | Trempe vive | Deuxième frappe |
| 4 s | Poinçon du maître | Reprise au rouge |
| 7 s | Jet de scories | La Grande Trempe |
| 10 s | Garde rouge | Poinçon du maître |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Heaume — Second feu |
| Torse | Plastron — Fer revenu |
| Gants | Gantelets — Prise de recuit |
| Jambes | Grèves — Pas de ronde |
| Bottes | Solerets — Dernier tour |
| Cape | Classique adapté au plan ; majeure libre si la place en offre une |
| Ceinture | Ceinturon — Nœud de guet |
| Anneau 1 | Anneau du recuit |
| Anneau 2 | Anneau de la vigie |
| Collier | Les Heures supplémentaires |
| Arme | Le Compte y est |

### Choc de trempe — Forgefeu / Trempe-Rouge

**Pièces :** 4 Le Fer du second feu + 3 Les Heures creuses + 2 L’Orage contenu.

**Nommés :** La Rancune, Le Petit Arrangement. **Gemmes majeures :** Cendre vive, Bastion.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Frappe d’atelier | Frappe d’atelier |
| 2 s | Trempe vive | Deuxième frappe |
| 4 s | Marteau de retour | Reprise au rouge |
| 7 s | Jet de scories | La Grande Trempe |
| 10 s | Garde rouge | Rivet de garde |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Heaume — Second feu |
| Torse | Plastron — Fer revenu |
| Gants | Gantelets — Prise de recuit |
| Jambes | Grèves — Scories froides |
| Bottes | Solerets — Entre-deux |
| Cape | Cape — Dernier intervalle |
| Ceinture | Ceinturon — Nœud de pluie |
| Anneau 1 | Anneau du contretemps |
| Anneau 2 | Anneau de l’éclair muet |
| Collier | Le Petit Arrangement |
| Arme | La Rancune |

### Percée — Forgefeu / Enclumier

**Pièces :** 4 Les Mains de traverse + 4 L’Enclume patiente.

**Nommés :** Les Bonnes Manières. **Gemmes majeures :** Assistance fine, Garde alternée, Tranchant net.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Frappe d’atelier | Frappe d’atelier |
| 2 s | Trempe vive | Coup de travers |
| 4 s | Coup de travers | Faire sonner l’enclume |
| 7 s | Faire sonner l’enclume | Frappe de scellement |
| 10 s | Garde rouge | Rivet de garde |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Heaume — Veille de fer |
| Torse | Plastron — Serment lourd |
| Gants | Gantelets — Mains de traverse |
| Jambes | Grèves — Appui sûr |
| Bottes | Solerets — Marche lente |
| Cape | Cape — Poussière grise |
| Ceinture | Ceinturon — Joint ouvert |
| Anneau 1 | Anneau de la fêlure |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Classique adapté au plan ; majeure libre si la place en offre une |
| Arme | Les Bonnes Manières |

### Retour de forge — Forgefeu / Enclumier

**Pièces :** 4 Le Fer du second feu + 4 Ronces vives.

**Nommés :** Le Dernier Rivet, Le Bénéfice du doute. **Gemmes majeures :** Frimas tenace, Pouls régulier.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Frappe d’atelier | Frappe d’atelier |
| 2 s | Trempe vive | Coins d’arrêt |
| 4 s | Coup de travers | Faire sonner l’enclume |
| 7 s | Faire sonner l’enclume | Frappe de scellement |
| 10 s | Poinçon du maître | Rivet de garde |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Heaume — Second feu |
| Torse | Plastron — Fer revenu |
| Gants | Gantelets — Prise de recuit |
| Jambes | Grèves — Ronces basses |
| Bottes | Solerets — Sentier fermé |
| Cape | Classique adapté au plan ; majeure libre si la place en offre une |
| Ceinture | Ceinturon — Nœud vif |
| Anneau 1 | Anneau du recuit |
| Anneau 2 | Anneau du collet |
| Collier | Le Bénéfice du doute |
| Arme | Le Dernier Rivet |

### Désarmer la charge — Forgefeu / Enclumier

**Pièces :** 4 Les Mains de traverse + 3 L’Enclume patiente + 2 Les Heures creuses.

**Nommés :** Les Bonnes Manières, Les Heures supplémentaires. **Gemmes majeures :** Patience taillée, Tranchant net.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Frappe d’atelier | Frappe d’atelier |
| 2 s | Marteau de retour | Faire sonner l’enclume |
| 4 s | Faire sonner l’enclume | Frappe de scellement |
| 7 s | Garde rouge | Décrassage |
| 10 s | Coup de travers | Rivet de garde |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Heaume — Biais de pierre |
| Torse | Plastron — Traverse courte |
| Gants | Gantelets — Mains de traverse |
| Jambes | Grèves — Assise fendue |
| Bottes | Solerets — Marche lente |
| Cape | Cape — Dernier intervalle |
| Ceinture | Ceinturon — Poids juste |
| Anneau 1 | Anneau d’aplomb |
| Anneau 2 | Anneau du contretemps |
| Collier | Les Heures supplémentaires |
| Arme | Les Bonnes Manières |

### Plaques fidèles — Forgefeu / Rémouleur

**Pièces :** 4 Les Rivets du serment + 4 Veilleurs du sceau.

**Nommés :** Le Dernier Rivet. **Gemmes majeures :** Grâce oblique, Garde alternée, Marque de retour.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Frappe d’atelier | Frappe d’atelier |
| 2 s | Trempe vive | Trempe vive |
| 4 s | Pose de rivets | Pose de rivets |
| 7 s | Refroidissement | Recuit partagé |
| 10 s | Poinçon du maître | Plaque maîtresse |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Heaume — Veilleur pâle |
| Torse | Plastron — Garde commune |
| Gants | Gantelets — Mains de veille |
| Jambes | Grèves — Rempart bas |
| Bottes | Solerets — Pas du serment |
| Cape | Cape — Cape du garant |
| Ceinture | Ceinturon — Dernier rivet |
| Anneau 1 | Anneau du garant |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Classique adapté au plan ; majeure libre si la place en offre une |
| Arme | Le Dernier Rivet |

### Recuire ensemble — Forgefeu / Rémouleur

**Pièces :** 4 Le Fer du second feu + 4 Les Relais du chemin gris.

**Nommés :** La Part du feu, Le Fil du retour. **Gemmes majeures :** Cendre vive, Bastion.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Frappe d’atelier | Frappe d’atelier |
| 2 s | Trempe vive | Éclat du four |
| 4 s | Pose de rivets | Trempe vive |
| 7 s | Refroidissement | Recuit partagé |
| 10 s | Éclat du four | Décrassage |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Heaume — Second feu |
| Torse | Plastron — Fer revenu |
| Gants | Gantelets — Prise de recuit |
| Jambes | Grèves — Scories froides |
| Bottes | Solerets — Revers de route |
| Cape | Cape — Nœud fraternel |
| Ceinture | Ceinturon — Veille du pont |
| Anneau 1 | Anneau du relais |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Le Fil du retour |
| Arme | La Part du feu |

### Garde offensive — Forgefeu / Rémouleur

**Pièces :** 4 Les Relais du chemin gris + 3 Le Fer du second feu + 2 Veilleurs du sceau.

**Nommés :** Ça va tenir, Le Petit Arrangement. **Gemmes majeures :** Souffle polaire, Tranchant net.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Frappe d’atelier | Frappe d’atelier |
| 2 s | Trempe vive | Trempe vive |
| 4 s | Pose de rivets | Pose de rivets |
| 7 s | Refroidissement | Recuit partagé |
| 10 s | Garde rouge | Plaque maîtresse |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Heaume — Second feu |
| Torse | Plastron — Chemin gris |
| Gants | Gantelets — Main tendue |
| Jambes | Grèves — Marche commune |
| Bottes | Solerets — Revers de route |
| Cape | Cape — Bannière close |
| Ceinture | Ceinturon — Nœud de four |
| Anneau 1 | Anneau du recuit |
| Anneau 2 | Anneau du guet |
| Collier | Le Petit Arrangement |
| Arme | Ça va tenir |

### La poursuite — Traqueur / Tue-Bête

**Pièces :** 4 La Dernière empreinte + 4 La Vigie sans sommeil.

**Nommés :** Murmure-d’épine. **Gemmes majeures :** Plaie ouverte, Rythme, Dernière étincelle.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Lecture de piste | Lecture de piste |
| 2 s | Trait de poursuite | Tir à la couture |
| 4 s | Collet vif | Morsure croisée |
| 7 s | Tir à la couture | Regard fixe |
| 10 s | Sifflet bref | La Grande Battue |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Capuche — Regard fixe |
| Torse | Pourpoint — Longue visée |
| Gants | Gants — Prise nette |
| Jambes | Chausses — Pas de ronde |
| Bottes | Bottes — Dernier tour |
| Cape | Manteline — Pas muet |
| Ceinture | Ceinture — Nœud de guet |
| Anneau 1 | Anneau de la vigie |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Classique adapté au plan ; majeure libre si la place en offre une |
| Arme | Murmure-d’épine |

### Flèches de sang — Traqueur / Tue-Bête

**Pièces :** 4 Cendres persistantes + 4 Les Passeurs de braise.

**Nommés :** Les Sœurs silencieuses, Le Petit Arrangement. **Gemmes majeures :** Souffle polaire, Frimas tenace.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Lecture de piste | Lecture de piste |
| 2 s | Flèche barbelée | Flèche barbelée |
| 4 s | Collet vif | Morsure croisée |
| 7 s | Tir à la couture | Tir à la couture |
| 10 s | Repli couvert | Filet d’orage |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Capuche de la Veillée noire |
| Torse | Pourpoint — Feux dormants |
| Gants | Gants — Tison têtu |
| Jambes | Chausses — Cendres basses |
| Bottes | Bottes — Pas de suie |
| Cape | Manteline — Cape du passeur |
| Ceinture | Ceinture — Nœud de charbon |
| Anneau 1 | Anneau du tison voyageur |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Le Petit Arrangement |
| Arme | Les Sœurs silencieuses |

### La battue — Traqueur / Tue-Bête

**Pièces :** 4 La Battue silencieuse + 3 L’Orage contenu + 2 La Vigie sans sommeil.

**Nommés :** Sans sommation, Les Heures supplémentaires. **Gemmes majeures :** Œil du chasseur, Éclat de passage.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Lecture de piste | Lecture de piste |
| 2 s | Trait de poursuite | Pas de côté |
| 4 s | Tir de travers | Morsure croisée |
| 7 s | Tir à la couture | Tir de travers |
| 10 s | Piège de résine | La Grande Battue |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Capuche — Battue basse |
| Torse | Pourpoint — Orage bas |
| Gants | Gants — Main sans bruit |
| Jambes | Chausses — Piste couverte |
| Bottes | Bottes — Pas étouffés |
| Cape | Manteline — Ciel lourd |
| Ceinture | Ceinture — Nœud de guet |
| Anneau 1 | Anneau de l’éclair muet |
| Anneau 2 | Anneau de la vigie |
| Collier | Les Heures supplémentaires |
| Arme | Sans sommation |

### Pièges et cible — Traqueur / Piégeur

**Pièces :** 4 Ronces vives + 4 La Dernière empreinte.

**Nommés :** La Ponctuelle. **Gemmes majeures :** Œil du chasseur, Assistance fine, Marque de retour.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Lecture de piste | Lecture de piste |
| 2 s | Trait de poursuite | Flèches de gêne |
| 4 s | Collet vif | Dents de fer |
| 7 s | Dents de fer | Laissé pour compte |
| 10 s | Sifflet bref | Filet d’orage |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Capuche — Regard fixe |
| Torse | Pourpoint — Longue visée |
| Gants | Gants — Prise nette |
| Jambes | Chausses — Piste close |
| Bottes | Bottes — Sentier fermé |
| Cape | Classique adapté au plan ; majeure libre si la place en offre une |
| Ceinture | Ceinture — Nœud vif |
| Anneau 1 | Anneau du collet |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Collier — Cœur de ronce |
| Arme | La Ponctuelle |

### Pas trop vite — Traqueur / Piégeur

**Pièces :** 4 Les Pas dans les pas + 4 Les Mains de traverse.

**Nommés :** Les Sœurs silencieuses, Le Bénéfice du doute. **Gemmes majeures :** Cendre vive, Tranchant net.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Lecture de piste | Trait de poursuite |
| 2 s | Trait de poursuite | Battement de meute |
| 4 s | Sifflet bref | Laissé pour compte |
| 7 s | Dents de fer | Dents de fer |
| 10 s | Piège de résine | Filet d’orage |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Capuche — Biais de pierre |
| Torse | Pourpoint — Deuxième pas |
| Gants | Gants — Meute proche |
| Jambes | Chausses — Main du siffleur |
| Bottes | Bottes — Pattes de cuir |
| Cape | Manteline — Poussière grise |
| Ceinture | Ceinture — Joint ouvert |
| Anneau 1 | Anneau de la fêlure |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Le Bénéfice du doute |
| Arme | Les Sœurs silencieuses |

### Double détente — Traqueur / Piégeur

**Pièces :** 4 Les Heures creuses + 3 La Battue silencieuse + 2 Les Mains de traverse.

**Nommés :** Le Témoin discret, Le Mauvais Présage. **Gemmes majeures :** Tranchant net, Patience taillée.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Lecture de piste | Lecture de piste |
| 2 s | Trait de poursuite | Tir de travers |
| 4 s | Dents de fer | Laissé pour compte |
| 7 s | Piège de résine | Flèches de gêne |
| 10 s | Sifflet bref | Filet d’orage |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Capuche — Heure bleue |
| Torse | Pourpoint — Attente courte |
| Gants | Gants — Temps prêté |
| Jambes | Chausses — Minute creuse |
| Bottes | Bottes — Pas étouffés |
| Cape | Manteline — Cape de rabattage |
| Ceinture | Ceinture — Joint ouvert |
| Anneau 1 | Anneau du rabatteur |
| Anneau 2 | Anneau de la fêlure |
| Collier | Le Mauvais Présage |
| Arme | Le Témoin discret |

### Meute attentive — Traqueur / Meneur de meute

**Pièces :** 4 Les Pas dans les pas + 4 Veilleurs du sceau.

**Nommés :** La Part du chien. **Gemmes majeures :** Garde alternée, Grâce oblique, Dernière étincelle.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Lecture de piste | Lecture de piste |
| 2 s | Trait de poursuite | Partage de chasse |
| 4 s | Garde de meute | Garde de meute |
| 7 s | Sifflet bref | Retour de la meute |
| 10 s | Repli couvert | Battement de meute |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Capuche — Veilleur pâle |
| Torse | Pourpoint — Garde commune |
| Gants | Gants — Mains de veille |
| Jambes | Chausses — Rempart bas |
| Bottes | Bottes — Pattes de cuir |
| Cape | Manteline — Cape du meneur |
| Ceinture | Ceinture — Nœud de meute |
| Anneau 1 | Anneau de la meute |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Classique adapté au plan ; majeure libre si la place en offre une |
| Arme | La Part du chien |

### Compagnon de chasse — Traqueur / Meneur de meute

**Pièces :** 4 La Dernière empreinte + 4 Les Relais du chemin gris.

**Nommés :** Murmure-d’épine, Le Fil du retour. **Gemmes majeures :** Marque de retour, Plaie ouverte.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Lecture de piste | Lecture de piste |
| 2 s | Trait de poursuite | Partage de chasse |
| 4 s | Garde de meute | Tir de travers |
| 7 s | Sifflet bref | Battement de meute |
| 10 s | Flèche barbelée | Filet d’orage |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Capuche — Regard fixe |
| Torse | Pourpoint — Longue visée |
| Gants | Gants — Prise nette |
| Jambes | Chausses — Piste close |
| Bottes | Bottes — Revers de route |
| Cape | Manteline — Nœud fraternel |
| Ceinture | Ceinture — Veille du pont |
| Anneau 1 | Anneau du relais |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Le Fil du retour |
| Arme | Murmure-d’épine |

### Le rebond — Traqueur / Meneur de meute

**Pièces :** 4 L’Autre revers + 3 La Vigie sans sommeil + 2 Les Pas dans les pas.

**Nommés :** Le Témoin discret, Le Petit Arrangement. **Gemmes majeures :** Bastion, Rythme.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Lecture de piste | Lecture de piste |
| 2 s | Trait de poursuite | Partage de chasse |
| 4 s | Garde de meute | Garde de meute |
| 7 s | Sifflet bref | Retour de la meute |
| 10 s | Repli couvert | Repli couvert |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Capuche — Revers clair |
| Torse | Pourpoint — Doublure sûre |
| Gants | Gants — Main intacte |
| Jambes | Chausses — Pas de ronde |
| Bottes | Bottes — Pas conservé |
| Cape | Manteline — Cape du meneur |
| Ceinture | Ceinture — Nœud de guet |
| Anneau 1 | Anneau de la vigie |
| Anneau 2 | Anneau de la meute |
| Collier | Le Petit Arrangement |
| Arme | Le Témoin discret |

### Phrase vive — Runiste / Fulgurant

**Pièces :** 4 Le Palimpseste + 4 L’Orage contenu.

**Nommés :** Le Point-virgule. **Gemmes majeures :** Rythme, Cendre vive, Pouls régulier.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Trait incandescent | Trait fulgurant |
| 2 s | Cercle de givre | Trait des éclats |
| 4 s | Trait fulgurant | Cercle de rupture |
| 7 s | Rature ardente | La Phrase souveraine |
| 10 s | Sceau de garde | Sceau de garde |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Coiffe — Marge ancienne |
| Torse | Robe — Peau d’encre |
| Gants | Mitaines — Doigts raturés |
| Jambes | Bas — Lignes basses |
| Bottes | Bottines — Pas d’orage |
| Cape | Cape — Ciel lourd |
| Ceinture | Ceinture — Nœud de pluie |
| Anneau 1 | Anneau de l’éclair muet |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Classique adapté au plan ; majeure libre si la place en offre une |
| Arme | Le Point-virgule |

### Ignition — Runiste / Fulgurant

**Pièces :** 4 Cendres persistantes + 4 Les Passeurs de braise.

**Nommés :** Le Livre des ratures, Le Petit Arrangement. **Gemmes majeures :** Plaie ouverte, Dernière étincelle.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Trait incandescent | Trait incandescent |
| 2 s | Anneau de cendres | Anneau de cendres |
| 4 s | Rature ardente | Rature ardente |
| 7 s | Sceau de garde | Sceau du foyer |
| 10 s | Cercle révélateur | La Phrase souveraine |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Coiffe de la Veillée noire |
| Torse | Robe — Feux dormants |
| Gants | Mitaines — Tison têtu |
| Jambes | Bas — Cendres basses |
| Bottes | Bottines — Pas de suie |
| Cape | Cape — Cape du passeur |
| Ceinture | Ceinture — Nœud de charbon |
| Anneau 1 | Anneau du tison voyageur |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Le Petit Arrangement |
| Arme | Le Livre des ratures |

### Le coup d’après — Runiste / Fulgurant

**Pièces :** 4 La Phrase inachevée + 3 Les Heures creuses + 2 La Dernière empreinte.

**Nommés :** Le Dernier Avertissement, Les Heures supplémentaires. **Gemmes majeures :** Œil du chasseur, Frimas tenace.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Trait incandescent | Trait fulgurant |
| 2 s | Cercle de givre | Trait des éclats |
| 4 s | Trait fulgurant | Anneau de silence |
| 7 s | Rature ardente | La Phrase souveraine |
| 10 s | Sceau de garde | Sceau de garde |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Coiffe — Point suspendu |
| Torse | Robe — Ligne ouverte |
| Gants | Mitaines — Temps prêté |
| Jambes | Bas — Phrase basse |
| Bottes | Bottines — Pas de marge |
| Cape | Cape — Dernier intervalle |
| Ceinture | Ceinture — Dernier signe |
| Anneau 1 | Anneau du contretemps |
| Anneau 2 | Anneau — Œil d’étain |
| Collier | Les Heures supplémentaires |
| Arme | Le Dernier Avertissement |

### Froid en ligne — Runiste / Sigillaire

**Pièces :** 4 Ronces vives + 4 La Phrase inachevée.

**Nommés :** L’Objection. **Gemmes majeures :** Assistance fine, Frimas tenace, Pouls régulier.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Trait de gel | Trait de gel |
| 2 s | Cercle de givre | Cercle de givre |
| 4 s | Sceau d’arrêt | Sceau d’arrêt |
| 7 s | Sceau de répit | Anneau de silence |
| 10 s | Sceau de garde | Ligne de partage |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Coiffe — Taillis sourd |
| Torse | Robe — Racines hautes |
| Gants | Mitaines — Épines fines |
| Jambes | Bas — Ronces basses |
| Bottes | Bottines — Pas de marge |
| Cape | Cape — Cape d’incise |
| Ceinture | Ceinture — Nœud du point |
| Anneau 1 | Anneau de l’incise |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Classique adapté au plan ; majeure libre si la place en offre une |
| Arme | L’Objection |

### Les fractures — Runiste / Sigillaire

**Pièces :** 4 Les Mains de traverse + 4 Le Palimpseste.

**Nommés :** Le Dernier Avertissement, Le Bénéfice du doute. **Gemmes majeures :** Souffle polaire, Marque de retour.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Trait incandescent | Trait de gel |
| 2 s | Trait de gel | Cercle de l’entrave |
| 4 s | Sceau d’arrêt | Trait d’interdit |
| 7 s | Cercle révélateur | Cercle révélateur |
| 10 s | Sceau de garde | Sceau de garde |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Coiffe — Biais de pierre |
| Torse | Robe — Traverse courte |
| Gants | Mitaines — Mains de traverse |
| Jambes | Bas — Lignes basses |
| Bottes | Bottines — Cape réécrite |
| Cape | Cape — Dernière marge |
| Ceinture | Ceinture — Joint ouvert |
| Anneau 1 | Anneau du palimpseste |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Le Bénéfice du doute |
| Arme | Le Dernier Avertissement |

### Sceau patient — Runiste / Sigillaire

**Pièces :** 4 L’Enclume patiente + 3 L’Autre revers + 2 Les Mains de traverse.

**Nommés :** La Clé sans serrure, Le Petit Arrangement. **Gemmes majeures :** Bastion, Tranchant net.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Trait incandescent | Trait de gel |
| 2 s | Trait de gel | Cercle de l’entrave |
| 4 s | Sceau d’arrêt | Trait d’interdit |
| 7 s | Cercle révélateur | Cercle révélateur |
| 10 s | Sceau de garde | Sceau du foyer |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Coiffe — Veille de fer |
| Torse | Robe — Serment lourd |
| Gants | Mitaines — Main intacte |
| Jambes | Bas — Appui sûr |
| Bottes | Bottines — Marche lente |
| Cape | Cape — Bannière à l’envers |
| Ceinture | Ceinture — Joint ouvert |
| Anneau 1 | Anneau du revers |
| Anneau 2 | Anneau de la fêlure |
| Collier | Le Petit Arrangement |
| Arme | La Clé sans serrure |

### Garde écrite — Runiste / Glyphiste

**Pièces :** 4 Veilleurs du sceau + 4 Le Palimpseste.

**Nommés :** Le Sceau qui tient. **Gemmes majeures :** Garde alternée, Grâce oblique, Dernière étincelle.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Trait incandescent | Trait fulgurant |
| 2 s | Cercle de givre | Cercle du refuge |
| 4 s | Sceau de résonance | Sceau de résonance |
| 7 s | Sceau de répit | Trait de relève |
| 10 s | Sceau de garde | Ligne de partage |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Coiffe — Veilleur pâle |
| Torse | Robe — Garde commune |
| Gants | Mitaines — Mains de veille |
| Jambes | Bas — Lignes basses |
| Bottes | Bottines — Cape réécrite |
| Cape | Cape — Dernière marge |
| Ceinture | Ceinture — Nœud de garde |
| Anneau 1 | Anneau du palimpseste |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Classique adapté au plan ; majeure libre si la place en offre une |
| Arme | Le Sceau qui tient |

### Soutien offensif — Runiste / Glyphiste

**Pièces :** 4 Les Relais du chemin gris + 4 La Phrase inachevée.

**Nommés :** Le Point-virgule, Le Fil du retour. **Gemmes majeures :** Marque de retour, Frimas tenace.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Trait incandescent | Anneau de cendres |
| 2 s | Trait de gel | Cercle du refuge |
| 4 s | Sceau de résonance | Sceau de résonance |
| 7 s | Sceau de répit | Trait de relève |
| 10 s | Cercle révélateur | Anneau de silence |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Coiffe — Point suspendu |
| Torse | Robe — Chemin gris |
| Gants | Mitaines — Main tendue |
| Jambes | Bas — Marche commune |
| Bottes | Bottines — Revers de route |
| Cape | Cape — Cape d’incise |
| Ceinture | Ceinture — Nœud du point |
| Anneau 1 | Anneau de l’incise |
| Anneau 2 | Classique adapté au plan ; majeure libre si la place en offre une |
| Collier | Le Fil du retour |
| Arme | Le Point-virgule |

### Contre-écriture — Runiste / Glyphiste

**Pièces :** 4 Les Relais du chemin gris + 3 La Phrase inachevée + 2 Veilleurs du sceau.

**Nommés :** La Clé sans serrure, Le Petit Arrangement. **Gemmes majeures :** Bastion, Rythme.

| Délai d’ouverture | Sort au niveau 40 | Sort au niveau 80 |
| --- | --- | --- |
| 0 s | Trait incandescent | Trait fulgurant |
| 2 s | Cercle de givre | Cercle du refuge |
| 4 s | Sceau de résonance | Sceau de résonance |
| 7 s | Sceau de répit | Trait de relève |
| 10 s | Sceau de garde | Sceau de garde |

| Emplacement | Pièce |
| --- | --- |
| Coiffe | Coiffe — Point suspendu |
| Torse | Robe — Chemin gris |
| Gants | Mitaines — Main tendue |
| Jambes | Bas — Marche commune |
| Bottes | Bottines — Revers de route |
| Cape | Cape — Cape d’incise |
| Ceinture | Ceinture — Nœud de garde |
| Anneau 1 | Anneau de l’incise |
| Anneau 2 | Anneau du guet |
| Collier | Le Petit Arrangement |
| Arme | La Clé sans serrure |

Le plan Givre du Sigillaire au niveau 80 n’utilise que des sorts de Givre : Trait de gel, Cercle de givre, Sceau d’arrêt, Anneau de silence et Ligne de partage. Il fonctionne par ses formes et son contrôle natif ; il n’a pas besoin d’un bâton nommé « de Givre » différent du bâton de Feu. Au niveau 40, le plan joint emploie une garde Foudre ; un joueur peut préférer quatre sorts de Givre plutôt que remplir sa cinquième place à tout prix.

## 16. Résultats du banc et portée de l’équilibrage

Le banc joint a exécuté **5,616 combats** pour les plans de référence, les baselines et la sensibilité (séparateurs anglais dans les fichiers de données). La recherche de sets ajoute **12,219 combats** : 2457 assemblages 4+4 criblés sur trois profils, puis 74 finalistes revus sur les six profils et huit graines, ainsi que des essais de danger accru. Les 36 vérifications de règles et de références sont passées.

Les 27 plans sont comparés avec le répertoire disponible à 40 puis à 80, douze graines par profil et des statistiques normalisées. Les six profils sont cible durable, groupe compact, charge lourde, usure, garde et soin ennemi. Les neuf baselines sans sets ni majeures conservent les mêmes statistiques de référence : elles testent un kit avec équipement classique neutre, pas un personnage nu.

**Aucun échec observé sur les 324 combinaisons plan/palier/profil du test de référence.** Douze victoires ne prouvent pas un taux réel de 100 % ; les écarts de statistiques et scripts réels restent à tester. Le criblage initial à une graine sert à chercher des problèmes, pas à déclarer une méta officielle.

Dans le tableau suivant, chaque case retient le meilleur temps médian des trois plans de la voie au répertoire 80. C’est un résumé d’efficacité parmi ces plans, pas l’annonce qu’un seul plan gagne tout.

| Voie | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
| --- | --- | --- | --- | --- | --- | --- |
| Forgefeu · Trempe-Rouge | 39,125 s | 59,25 s | 41,25 s | 44,25 s | 44,25 s | 41,25 s |
| Forgefeu · Enclumier | 46,75 s | 75,25 s | 47,25 s | 51,25 s | 51,0 s | 48,25 s |
| Forgefeu · Rémouleur | 46,75 s | 71,25 s | 47,75 s | 54,875 s | 53,25 s | 49,75 s |
| Traqueur · Tue-Bête | 39,25 s | 64,0 s | 39,75 s | 43,25 s | 43,25 s | 40,75 s |
| Traqueur · Piégeur | 45,75 s | 70,0 s | 46,75 s | 51,5 s | 51,375 s | 48,125 s |
| Traqueur · Meneur de meute | 46,75 s | 70,5 s | 47,75 s | 53,625 s | 53,625 s | 50,125 s |
| Runiste · Fulgurant | 41,75 s | 64,0 s | 43,75 s | 49,5 s | 49,5 s | 43,875 s |
| Runiste · Sigillaire | 47,25 s | 75,25 s | 49,25 s | 55,25 s | 58,5 s | 52,25 s |
| Runiste · Glyphiste | 46,75 s | 74,75 s | 47,75 s | 51,25 s | 53,25 s | 50,625 s |

| Voie | PV finaux moyens des médianes · plans et situations confondus | Part moyenne des dégâts directement produits par l’équipement |
| --- | --- | --- |
| Trempe-Rouge | 70,219 % | 6,337 % |
| Enclumier | 74,297 % | 5,187 % |
| Rémouleur | 89,439 % | 4,283 % |
| Tue-Bête | 57,61 % | 9,756 % |
| Piégeur | 67,131 % | 9,367 % |
| Meneur de meute | 93,935 % | 8,33 % |
| Fulgurant | 78,67 % | 7,698 % |
| Sigillaire | 76,59 % | 5,199 % |
| Glyphiste | 94,433 % | 6,187 % |

La dernière colonne ne mesure pas la valeur totale de l’équipement : ses statistiques, protections, états et multiplicateurs influencent aussi la rencontre. Elle sert seulement à surveiller un système où le personnage ne ferait qu’activer des coups gratuits. Les résultats ne permettent pas de quantifier la valeur d’un soigneur dans un vrai groupe.

### Ce que les essais ont fait changer

Orage était trop généraliste : alterner deux compétences quelconques était presque gratuit pour toutes les classes. Il demande maintenant une rafale de deux sorts différents à deux secondes d’intervalle au plus, avec un Écho limité. Vigie demandait elle aussi une alternance trop facile ; son quatre pièces exige désormais une place réelle laissée aux attaques de base. Palimpseste privilégie la relecture d’une forme, tandis qu’Incise privilégie A–B–A.

Les plans de soutien ont reçu de vraies variantes de groupe et d’attaque plutôt que trois plans monocibles presque identiques. Le passif Enclumier conserve une Assise offensive pour sa prochaine Chauffe. Deux nommés ont gagné une identité supplémentaire pour éviter d’être des versions plus contraintes d’une gemme.

Les tests vérifient notamment qu’un Ordre nouvellement créé attend la prochaine intervention, que la dépense de Braises ne se multiplie pas sur toutes les cibles, que les contrôles de zone affectent les bonnes cibles sans multiplier les compteurs, qu’un remplacement n’est pas une expiration et qu’un soin secondaire ne recharge pas une réserve native.

### Ce qu’il reste à vérifier

Le banc est volontairement limité : les trois plans de sorts par voie sont fixés ; la recherche change leurs paires de sets mais pas tous leurs talents majeurs, jets et horaires. Les statistiques sont normalisées. Les valeurs d’affixes, budgets par emplacement, résistances élémentaires et effets de Ténacité reçue ne sont pas évalués. Les six profils ne sont pas les dix-huit scripts détaillés de boss.

Les ensembles de protection comme Sceau, Revers et Rivets ne doivent pas être jugés seulement sur une course de vitesse à faible danger. Leur compétitivité en groupe n’est pas prouvée. Ils doivent rester en validation tant que les dégâts évités, les soins utiles et les parcours difficiles ne sont pas mesurés dans le moteur réel. Ajouter un set au catalogue ne suffit pas à lui garantir une place.

Les essais à +50 % et +100 % de dégâts ennemis servent de stress tests. Une difficulté à laquelle une voie n’a plus de réponse dans ses plans courants n’est pas à publier telle quelle ; on essaie d’abord d’autres sorts et équipements de cette voie avant d’exiger un changement de classe. Les résultats bruts sont joints, y compris les échecs. Ils ne sont pas effacés pour afficher une validation verte.

La cible de diversité reste au moins trois assemblages de fonctionnement différent proches du meilleur sur plusieurs types de rencontre. Il faut rechercher une domination sur le **gain attendu par heure, la fiabilité et le coût**, pas seulement le meilleur temps d’un combat déjà facile. Cette cible n’est pas certifiée pour tous les objets par le présent dossier.

**Lecture des stress tests :** à +50 % de dégâts ennemis, chaque voie dispose d’au moins un de ses trois plans gagnant les quatre graines dans chacune des six situations. À dégâts doublés, le groupe compact révèle les limites ci-dessous. Ce petit échantillon n’est pas une probabilité finale de succès et ne recherche pas d’autres sorts ou jets défensifs.

| Voie | Meilleur des trois plans · groupe à dégâts ×2 · 4 graines | Interprétation |
| --- | --- | --- |
| Trempe-Rouge | 100,0 % | Réussite de référence, pas garantie universelle |
| Enclumier | 50,0 % | Ne pas publier ce réglage comme passage obligatoire |
| Rémouleur | 100,0 % | Réussite de référence, pas garantie universelle |
| Tue-Bête | 0,0 % | Ne pas publier ce réglage comme passage obligatoire |
| Piégeur | 0,0 % | Ne pas publier ce réglage comme passage obligatoire |
| Meneur de meute | 100,0 % | Réussite de référence, pas garantie universelle |
| Fulgurant | 75,0 % | Ne pas publier ce réglage comme passage obligatoire |
| Sigillaire | 25,0 % | Ne pas publier ce réglage comme passage obligatoire |
| Glyphiste | 100,0 % | Réussite de référence, pas garantie universelle |

Ces échecs sont un signal utile : avant de créer un rang supérieur en multipliant simplement tous les dégâts par deux, il faut tester d’autres sorts, budgets défensifs et formations pour chacune des neuf voies. Un rang permanent ne doit pas transformer une préférence de classe en blocage.

## 17. Contrat des effets et protection contre les abus

### Origine, action et résolution

Chaque action porte un identifiant racine, un propriétaire, une cible et une origine. On distingue attaque de base, compétence, mécanique native de classe, effet d’équipement et état persistant. Un multi-projectile est une seule action pour les compteurs ; le compagnon ne crée pas un second propriétaire qui contourne les plafonds.

Les conditions lisent l’état au début de l’action. Les préparations déjà présentes peuvent être consommées par l’action éligible. La compétence et sa mécanique native se résolvent ; les compteurs de l’équipement avancent une seule fois. Une préparation acquise pendant cette action attend la suivante. Un effet secondaire n’envoie pas un nouvel événement primaire et ne se déclenche pas lui-même.

Un état secondaire peut être une condition d’une **future** action primaire : la brûlure d’une gemme peut permettre au coup suivant d’avancer Cendres. Une fin d’affliction peut préparer un jeton pour une future action, avec son délai ; elle ne produit pas une attaque en chaîne. Les déclenchements différés ont une durée de vie, huit secondes par défaut. Les cooldowns de ces effets démarrent à leur consommation/activation effective ; un jeton expiré n’inflige rien.

Un effet ne peut pas relire comme événements primaires ses propres dégâts, soins ou contrôles. Les copies de rune d’un objet restent des copies d’équipement. La rune native lue par la classe fait partie de l’action de compétence ; sa protection peut contribuer à Encre. Les plaques passives et barrières d’équipement gardent leur origine et ne deviennent pas des protections de compétence par commodité.

### Plafonds et règles de cumul

| Objet de la règle | Contrat proposé |
| --- | --- |
| Majeures | 4 au total, doublon d’une même gemme inactif ; nommés inclus |
| Pièce de set | Clé canonique set + pièce stable à travers classes, rangs et raretés ; anneau identique compté une fois |
| Vulnérabilité | La valeur active la plus forte, jamais la somme ; limite initiale 10 % |
| Affaiblissement | La plus forte réduction applicable ; les réserves à un coup sont consommées par un vrai coup |
| Ralentissements | La valeur la plus forte ; cap boss 15 %, pas de gel de tout le calendrier |
| Boucliers | Même source remplacée ; ni remplacement ni fin de combat ne déclenche une expiration |
| Réserve secondaire | Banc : au plus 1,60 P de boucliers d’équipement simultanés ; total des gardes 4,50 P |
| Sceau / Encre | Aide effective et absorption réelle, origine autorisée seulement ; pas de sursoin |
| Afflictions | Une application par source et cible, trois par type et porteur ; rafraîchissement borné |
| Extensions et transferts | Extension limitée par application ; transfert du montant restant, jamais des dégâts déjà faits |
| Délais | Par porteur et identifiant d’effet, pas par cible, exemplaire, projectile ou compagnon |
| PV maximum | Réserve de survie ; aucune conversion implicite en dégâts offensifs gratuits |
| Changement de build | Pas de remise à zéro des délais ; snapshot au début d’une rencontre |
| Mort et nouvelle cible | Cible vraiment vivante et distincte ; les préparations de cible ne revivent pas par changement d’interface |

Les plafonds de bouclier en P sont un point de départ du banc, pas une limite finale. Ils permettent d’étudier les boucles sans faire d’un empilement de Vitalité une source d’invulnérabilité et de DPS à la fois. Il faudra leur donner une traduction claire dans le vrai budget de statistiques et l’interface.

### Sauvegarde et simulation hors ligne

L’autorité reste serveur. Il faut sauvegarder le snapshot de build, la rencontre, son index, l’horloge logique, les cooldowns, états, réserves et la position du générateur aléatoire. Réclamer un résumé deux fois ne peut ni rejouer les gains ni réinitialiser les tirages. Les tirages sont séparés par flux/logique pour qu’une variation d’animation ou un jet d’attaque ennemi ne reroule pas un affixe.

Je recommande une résolution déterministe par événements, avec reprise/checkpoint et un budget de calcul mesuré. Un échantillon de vingt combats peut servir à un **aperçu** du rendement ; il ne suffit pas, tel quel, pour attribuer le butin et garantir qu’un joueur qui ouvre l’onglet toutes les cinq minutes reçoit la même progression qu’un absent de seize heures. Les transitions, ressources et cooldowns rendent une extrapolation naïve fausse.

Il n’est pas nécessaire d’avoir une boucle permanente pour tous les joueurs : la résolution peut se faire à la demande, en lots, avec reprise si le calcul est long. Le moteur TypeScript partagé doit servir au serveur et au simulateur. Le banc Python livré ici n’a pas vocation à devenir une deuxième vérité de production.

Les coups de fouet s’appliquent au temps d’activité crédité : ils accélèrent la progression du temps de combat simulé et donc le nombre de rencontres, sans changer les cooldowns relatifs du plan ni offrir des statistiques PvP. L’autonomie de seize heures demeure une limite de temps réel. Cette intégration devra être vérifiée avec `advance`, les consommables et l’usure.

## 18. Préparer le PvP sans prétendre le régler maintenant

Le PvE et le PvP partageront classes, états, actions et règles de provenance. Les profils de résistance, de contrôle et les coefficients de mode doivent être séparés dans les données. Une correction de soin ou de bouclier en arène ne doit pas obliger à rendre un soutien injouable en donjon.

Les actions au même horodatage demandent une règle symétrique : résoudre les événements par phases ou par lot, pas toujours faire agir « joueur A » avant « joueur B ». L’ordre stable des effets doit aussi être indépendant de l’ordre d’un tableau de gemmes ou de l’identifiant de compte. Le banc solo fixe l’ordre de ses effets ; il ne résout pas encore les échanges simultanés d’un duel.

Je ne réintroduis pas de triangle automatique mêlée > tir > magie comme solution d’équilibrage. Les classes ont déjà des séquences et réponses ; un avantage de catégorie risquerait de remplacer le choix de build par le contre-classe gratuit. C’est une recommandation pour la suite, pas la suppression d’une décision PvP déjà définitive.

Le PvP a besoin d’une limite de contrôle dur propre au bénéficiaire. Piste testable : une réserve de Résolution qui autorise un budget de contrôle, se recharge avec le temps et transforme les tentatives excédentaires en une compensation modeste et bornée. Les ralentissements, silences et étourdissements ne doivent pas contourner mutuellement le même budget en changeant leur libellé.

Les boucliers et soins se testent en duel puis à trois, avec des durées cibles, des limites de pression et éventuellement une fatigue commune après un long combat. Pas de règle PvE « boss immunisé » copiée aveuglément sur un joueur. Pas de PvP obligatoire pour obtenir une gemme ou un set indispensable au PvE.

Les emplacements, les quatre majeures, la normalisation des procs, les préparations différées et les limites de cumul sont les fondations réutilisables. **Aucun duel PvP ni combat de groupe n’a été simulé ici.** Les valeurs de Résolution, le matchmaking et une éventuelle normalisation de l’équipement restent à concevoir au moment du prototype PvP.

## 19. Lisibilité pour le joueur

Le joueur doit pouvoir comprendre sa classe sans ouvrir ce dossier.

- **Forgefeu** : trois Braises visibles ; les sorts indiquent Chauffe ou Trempe. Le passif de voie tient en une courte carte.
- **Traqueur** : une Proie et un Angle visible ; les sorts indiquent Repérage, Poursuite ou intervention de compagnon.
- **Runiste** : une rune précédente visible ; chaque sort montre ce qu’il lit et ce qu’il écrit.
- **Plan** : cinq cartes, une ligne d’ouverture, des cooldowns ; priorité des cibles et exemple utilisable.
- **Objets** : deux lignes fixes, jets regroupés, bonus actifs et progression du set. Les détails de formule restent dans le volet avancé.
- **Compatibilité** : explication d’un déclencheur sans source, d’un doublon de gemme ou d’un anneau déjà compté.
- **Journal** : « Angle exploité », « 2 Braises dépensées », « Rune Sceau lue », « 15 Stabilité retirée » ; le résultat explique le choix.

Les douze groupes d’affixes sont une bibliothèque de données, pas douze jauges à afficher autour du personnage. Les compteurs internes des sets restent des petites préparations d’état, pas une seconde interface de classe. Les informations avancées se déplient à la demande.

Un atelier de simulation sans gain permet de comparer deux plans possédés sur un adversaire déjà découvert. Les simulations n’inventent pas d’objets et n’augmentent pas l’XP. Les presets et le partage de build restent gratuits. Le chat et le clan peuvent rester ouverts pendant que l’activité continue : aucun besoin de surveiller une animation pour recevoir son butin.

## 20. Plan d’intégration au jeu actuel

### Étape A — contrats et moteur partagé

Formaliser les types de statistiques, d’états, de cibles et d’événements dans `packages/shared`. Ajouter le niveau par classe, les emplacements de plan et les snapshots. Garder le contenu en données validées. Le validateur vérifie les références, compatibilités et conditions de construction ; pas de valeurs de talent cachées dans React.

Les premiers tests portent sur l’ordre de résolution, les collisions de cooldowns, la dépense des ressources, la fin de cible, le contrôle converti et la reprise d’un combat. Le moteur de production et son simulateur utilisent les mêmes fonctions. Mesurer le coût d’une absence de seize heures sur le homeserver avant de choisir une stratégie de cache.

### Étape B — trois classes jouables, une tranche complète

Implémenter les mécaniques et les sorts communs des premiers niveaux, puis le premier passif et sort de chacune des neuf voies. Tester six adversaires simples : cible durable, groupe, charge, usure, garde, soin. Rendre visibles le plan, le journal et les métriques de réussite. Aucune nouvelle région ne compense une classe dont le kit ne tient pas.

La tranche verticale inclut les trois classes, pas un seul personnage privilégié. Les niveaux, changements de classe et sauvegardes de plans doivent fonctionner sans partager leur XP. Le terrain d’entraînement reste selon la règle validée : progression réduite et plafonnée au niveau de classe 40 pour ceux qui ne veulent pas affronter le contenu.

### Étape C — loot et filières

Brancher les victoires sur la création d’exemplaires existante, ajouter le snapshot des sources, les affixes à identifiants stables et la vitrine unitaire. Introduire les gemmes et leurs quatre places, deux nommés par classe puis quelques sets mécaniquement différents. Ajouter les filières de Tannerie, Couture, Joaillerie et Enchantement nécessaires aux recettes avant l’ouverture publique de la boucle complète.

Les quantités de recettes, le recyclage de combat et les taux de pièces finies se calibrent **ensemble**. Relancer le simulateur de marché avec les sources et puits de combat. Vérifier une population de vingt joueurs, pas seulement un marché idéal de deux cents spécialistes.

### Étape D — catalogue et contenu cible

Porter les 66 sorts, les 18 ensembles et les 24 talents nommés après les premiers retours. Déployer les branches de régions, leurs sources ciblées et les profondeurs. Mesurer temps de premier build, coût des services, pièces inutilisées, raisons de défaite et diversité réelle. Revoir ou retirer un modèle qui ne sert à aucun objectif à budget comparable.

Un set nouveau doit modifier une interaction identifiable ou occuper une niche de coût/progression ; un nouveau nom et une autre couleur ne suffisent pas. Les noms, variantes de silhouette et sources de ce dossier servent de catalogue, pas d’obligation de dessiner 298 fichiers avant de tester une seule mécanique.

### Étape E — groupes et PvP

Tester d’abord un groupe asynchrone de trois avec snapshots, bénéficiaires et butin personnel. Puis une arène de duel sans récompense de puissance exclusive. Ajouter les coefficients de mode et la Résolution seulement avec leurs tests. Un buff de groupe est évalué sur son budget total, pas sur une copie intégrale à chaque allié.

### Migrations à prévoir explicitement

| Fichier ou système actuel | Travail nécessaire |
| --- | --- |
| `data/classes.yaml` | Références vers mécanique, voies, sorts et versions de règles ; conserver apparence et métier |
| `gear_sets.yaml` | Passer d’une classe unique aux classes compatibles et d’un texte illustratif aux effets structurés |
| `gear.yaml` | Créer les vraies entrées de palier et statistiques ; les modèles de conception JSON ne sont pas importables tels quels |
| `gear_pools.yaml` | Identifiants de groupes, type élémentaire paramétré, conversion de score ; supprimer « élément de l’arme » ambigu |
| `equipment.ts` | Compter les pièces canoniques, exposer les quatre majeures, rattacher les effets à leurs origines |
| Schémas zod | Statistiques manquantes, règles d’effet, cibles, validité du plan et références de source |
| `advance` et sauvegarde | Horloge de combat, état reprenable, idempotence des gains et version de contenu |
| Marché / artisanat | Exemplaires échangeables, fabrication ciblée, perfectionnement et extraction de gemmes |
| Anciens sets de démonstration | Ne pas additionner leurs anciens bonus aux nouveaux ; garder les prototypes hors des nouvelles tables tant que la migration n’est pas décidée |

## 21. Arbitrages, risques et critères de validation

Je recommande d’adopter d’abord les mécaniques et les contrats d’événements. Les chiffres de talent et les taux de butin restent des paramètres. Il faut éviter d’engager l’illustration et toutes les recettes sur une règle qui n’a encore jamais été exécutée par le vrai moteur.

| Point | Position proposée | Pourquoi il reste à valider |
| --- | --- | --- |
| Ouverture | Une première rotation complète, puis répétitions sur cooldowns déjà écoulés | Autre interprétation possible : premières autorisations indépendantes |
| Cinq sorts et ultime | 5 dès 30 ; ultime prend une place | Choix lisible, mais à essayer en interface et sur les premiers joueurs |
| Trois mécaniques | Braises / Angle ciblé / rune précédente | Différences de fonctionnement à confirmer par le ressenti, pas seulement par le DPS |
| Ensembles | 12 communs + 2 par classe ; huit pièces possibles | Conserver leur choix réel sans produire dix-huit solutions dont dix inutiles |
| Nommés | Talent fixe qui remplace la majeure | Éviter de cumuler quatre gemmes et plusieurs talents gratuits |
| Boss contrôlables | Stabilité et conversion des contrôles durs | Ni immunité totale, ni neutralisation permanente |
| Puissance partagée | Dégâts, soins et gardes utilisent P ; affixes spécialisent | Préserver le soutien solo tout en donnant un coût aux meilleurs soins de groupe |
| Recyclage combat | Poudres/fragments, pas 40 % de la recette entière | Changerait une généralisation possible de la règle actuelle ; arbitrage économique important |
| Obtention | Focus, progression de cache, fragments échangeables | Les taux dépendent des recettes, de la vitesse réelle et du marché |
| Statistiques | Scores et rendements décroissants | La multiplication des pourcentages actuels par les rangs ne peut pas s’extrapoler sans limite |
| Rangs de sets | Nouveaux exemplaires 40/60/80/90, mêmes mécaniques | Compromis entre chasse au loot et remplacement répétitif |
| Hors ligne | Même moteur, reprise déterministe, aperçu distinct des gains | Les échantillons moyens ne garantissent pas l’équivalence de progression |
| PvP | Architecture prévue, coefficients et contrôle à éprouver plus tard | Aucune preuve d’équilibrage arène avec ce banc solo |

Avant une bêta ouverte, les critères doivent inclure : au moins un plan utilisable par chacune des neuf voies dans chaque famille de rencontre ; plusieurs assemblages de fonctionnement distinct proches du meilleur ; aucune source de gain infini par recyclage, changement de cible ou répétition de requête ; mêmes résultats en avançant une activité par petits lots ou par une seule absence ; coût de calcul acceptable ; absence de métier de combat obligatoire pour un artisan ou récolteur.

Les joueurs doivent pouvoir expliquer pourquoi ils préfèrent une classe à une autre. S’ils ne parlent que du bonus quatre pièces et jamais de Braises, Proie ou runes, l’équipement a pris trop de place. S’ils ne peuvent pas changer de set sans casser tout leur personnage, la classe et la voie n’en ont pas assez.

## 22. Fichiers, reproduction et lecture par Claude

Le fichier principal constitue la proposition commune. Les données et scripts ne sont pas des migrations prêtes à appliquer au dépôt. Ils permettent de retrouver chaque référence, tester une modification et vérifier les effets avant de les porter au moteur partagé.

| Fichier | Usage |
| --- | --- |
| `Bramo-coeur-du-jeu.md` | Texte complet à lire et annoter ; source du dossier de lecture |
| `Bramo-coeur-du-jeu.html` | Même dossier, navigation, recherche et tableaux consultables hors ligne |
| `projet.json` | Classes, voies, 66 sorts, sets, nommés, gemmes, contenu et 27 plans |
| `modeles-ensembles.json` | 298 variantes de base ; clés de pièce, classes, emplacements, familles et groupes fixes |
| `sources.json` | Commit du dépôt et empreintes des fichiers de référence |
| `banc_combat.py` | Banc solo indépendant ; `python3 banc_combat.py --seeds 12` |
| `chercher_assemblages.py` | Criblage 4+4 et stress tests ; `python3 chercher_assemblages.py` |
| `verifier.py` | Références, équipement et invariants ; `python3 verifier.py` |
| `calculer_butin.py` | Estimation du premier 4 pièces et des fragments de nommé |
| `resultats-*.json` et `recherche-assemblages.json` | Résultats bruts avec périmètre ; les échecs de stress restent visibles |
| `verification-*.json` | Emplacements, références et règles contrôlées |
| `diagnostic-diversite-initial.json` | Diagnostic initial qui a motivé la révision des effets trop généralistes |

Ordre conseillé pour Claude : sections 1–7 pour les règles, 8–10 pour la boucle d’obtention, 11–15 pour le catalogue et les exemples, 16–18 pour les limites et garanties techniques, puis 20–21 pour préparer l’intégration. Confronter toute proposition aux dernières décisions de Louis. Ne pas transformer les coefficients du banc en valeurs définitives par simple copie.

Pour modifier les données : éditer `projet.json`, puis exécuter `verifier.py`, `banc_combat.py`, `chercher_assemblages.py` et `calculer_butin.py`. Les noms de fichier de résultat sont remplacés à chaque exécution ; conserver une version si l’on veut une comparaison. Reproduire une expérience implique de garder à la fois la version des données et celle du banc.

### Sources de référence

- [CLAUDE.md](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/CLAUDE.md)
- [docs/game-design.md](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/docs/game-design.md)
- [docs/design/combat-items.md](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/docs/design/combat-items.md)
- [docs/design/monde.md](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/docs/design/monde.md)
- [docs/design/metiers.md](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/docs/design/metiers.md)
- [docs/design/economie.md](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/docs/design/economie.md)
- [docs/design/marche.md](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/docs/design/marche.md)
- [data/classes.yaml](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/data/classes.yaml)
- [data/gear.yaml](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/data/gear.yaml)
- [data/gear_pools.yaml](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/data/gear_pools.yaml)
- [data/gear_sets.yaml](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/data/gear_sets.yaml)
- [data/gear_slots.yaml](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/data/gear_slots.yaml)
- [packages/shared/src/engine/equipment.ts](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/packages/shared/src/engine/equipment.ts)
- [packages/shared/src/schemas/gear.ts](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/packages/shared/src/schemas/gear.ts)
- [sim/README.md](https://github.com/Kairoli/Bramo/blob/706f70aa8ad5675db7b1f4db2e9a9aa7f24c16a0/sim/README.md)

Les règles confirmées viennent du dépôt et de la conversation. Les sorts, mécanismes détaillés, chiffres, nouvelles sources et choix de cadence de ce dossier sont des propositions originales. Aucun conseil sur un autre jeu ni chiffre emprunté à The Division n’a servi de preuve d’équilibrage.
