# Progression des métiers

> **Statut : recommandation**, à arbitrer (voir [`arbitrages.md`](arbitrages.md)). Chiffres : `sim/reports/rapport.md`.
> « Heure effective » = une heure d'activité à 100 % de rendement, bonus non compris.

## 1. Vérification de la mesure

Le simulateur rejoue le vrai moteur (`advance`) avec les données actuelles : Minage seul, 2 h de présence par jour d'un bloc, sans outil ni repas, meilleur minerai pour l'XP.

| Profil | h eff./jour | Niv. 30 | Niv. 60 | Niv. 85 | Niv. 90 | Niv. 99 |
|---|---|---|---|---|---|---|
| 2 h d'un bloc le soir | 6,0 | 30 min | 1,1 j | 11 j | 18 j | 44 j |
| 2 h en deux sessions | 7,6 | 30 min | 21 h | 9,1 j | 14 j | 35 j |
| 20 min par jour | 3,5 | 1,3 h | 2,0 j | 19 j | 31 j | — |
| Onglet visible 7 h–23 h | 19,0 | 30 min | 6,3 h | 3,5 j | 5,6 j | 14 j |

**La mesure est confirmée** : Minage 60 en un jour, 90 en 18 jours. Le niveau 30 tombe dans la première demi-heure.

## 2. D'où vient la vitesse

- **Les recettes rapportent beaucoup** : l'orichalque donne 125 XP toutes les 9 s, soit 50 000 XP par heure. Le 99 demande 13 M d'XP : 260 heures effectives suffisent.
- **Le temps effectif est élevé même pour un casu** : 2 h de présence produisent 6 h effectives (énergie ×1,5 puis 12 h à 25 %).
- **La courbe n'est pas en cause** : c'est celle de RuneScape, mais RuneScape se joue activement, quelques heures par jour. Un idle tourne jusqu'à 24 h par jour : chaque XP/heure doit être pensée en heures de calendrier.
- **Les paliers rapportent trop peu de différence** : de 5,7 XP/s (cuivre) à 13,9 XP/s (orichalque). Le temps n'est donc pas porté par les recettes mais par la seule courbe.
- **Les ingrédients ne coûtent rien** : une recette d'artisanat consomme 1 à 3 objets récoltés en 3 à 9 s chacun ; l'autonomie est gratuite et le commerce sans intérêt.

## 3. Les leviers et ce qu'on en fait [Recommandé]

| Levier | Proposition | Pourquoi |
|---|---|---|
| Présence | Rendement unique 100 %, autonomie 16 h, plus d'énergie (voir [`presence.md`](presence.md)) | Le temps effectif ne dépend plus d'un onglet visible. Il monte donc pour tout le monde (16 à 24 h/jour) : les taux d'XP doivent baisser d'autant. |
| Courbe | **Conserver la courbe RuneScape** | Elle est connue, lisible, et sa forme exponentielle sert le serveur persistant : un nouveau venu rattrape vite le milieu de tableau (60 en deux semaines), le haut niveau reste un investissement. |
| XP des recettes | Règle unique **R(L) = 400 × 2^((L−1)/55) XP par heure effective** pour la meilleure récolte d'un palier : 400 au niveau 1, 580 au 30, 840 au 60, 1 230 au 90 | Chaque palier rapporte ~+13 % d'XP/h en plus d'objets de plus grande valeur. Fin de jeu 30 à 40 fois plus lente qu'aujourd'hui par heure effective. |
| Durées | Récolte : **12 s + 2 s par dizaine de niveaux** (12 s au 1, 30 s au 90) | Volumes lisibles (300 à 120 unités par heure), matières rares plus lentes, sans changer l'XP/h. |
| Artisanat | XP par heure de fabrication = **1,75 × R(L)** | L'artisan qui achète ses matériaux progresse ~1,75 fois plus vite qu'un récolteur ; celui qui récolte tout progresse ~2,5 fois moins vite dans son métier, mais monte aussi ses récoltes. C'est ce qui rend le commerce intéressant en temps économisé. |
| Début | **Apprentissage : XP ×2 sous le niveau 20**, dans chaque métier | Garde un premier soir généreux (niveau 10 dans la première heure et demie, 20 dans la journée) et rend agréable l'essai de nouveaux métiers. Coût nul en fin de jeu. Déjà codé dans le moteur (`xp.apprenticeship`, absent de `data/`). |
| Bonus | Outils +10 % (bronze) à +30 % (orichalque) ; repas +3 à +10 % | Inchangés en plafond. Ils sont désormais payés (usure, repas qui coûtent la moitié de ce qu'ils rapportent). |
| Ingrédients | Quantités fortes sur les pièces finales (30 lingots pour une épée, 10 rouleaux de toile pour une robe) | Une pièce coûte 25 min à 2 h de travail autonome : l'équipement a une valeur, l'autonomie a un coût. |
| Paliers | Une nouvelle ressource tous les 10 niveaux, des recettes aux 70, 80, 90 et des chefs-d'œuvre | Toujours un objectif à moins de deux semaines, même en fin de jeu (voir §6). |

**Courbe alternative écartée** : une courbe moins exponentielle (doublement tous les 9 niveaux au lieu de 7) donnerait 60 en un mois pour 99 en un an, mais le premier soir ne dépasserait pas le niveau 5. Ce n'est pas un bon échange.

## 4. Durées obtenues

Simulation avec le vrai moteur et la proposition `boucle-v0` (les forgerons sont calculés à part, à 30 h effectives par jour bonus compris).

| Profil | Niv. 30 | Niv. 60 | Niv. 85 | Niv. 90 | Niv. 99 |
|---|---|---|---|---|---|
| Spécialiste casu (20 min/j, outils, sans repas) | 1,4 j | 20 j | 5,4 mois | 8,3 mois | plus de 17 mois |
| Spécialiste régulier (2 visites/j, outils, repas) | 21 h | 13 j | 3,4 mois | 5,3 mois | 11,4 mois |
| Spécialiste tryhard (repas +10 %, clan +10 %) | 17 h | 12 j | 3,2 mois | 4,9 mois | 10,7 mois |
| 3 métiers + combat, régulier | 3,4 j | 52 j | 13,6 mois | 21 mois | près de 4 ans |
| 3 métiers + combat, casu | 5,4 j | 2,6 mois | 21 mois | 33 mois | — |
| Forgeron autonome (mine son minerai) | 1,1 j | 20 j | 5,8 mois | 9,0 mois | 19,5 mois |
| Forgeron qui achète le minerai | 10 h | 8 j | 2,3 mois | 3,5 mois | 7,7 mois |
| Forgeron qui achète aussi ses lingots | 10 h | 7 j | 2,0 mois | 3,2 mois | 6,8 mois |

**Durées cibles proposées** (spécialiste régulier) et leur raison :

| Niveau | Cible | Raison |
|---|---|---|
| 30 (Apprenti) | 1 jour | La première épreuve de maître tombe le deuxième soir : un objectif immédiat et une raison de revenir. |
| 60 (Compagnon) | 2 semaines | Le nouveau venu devient utile au marché (paliers intermédiaires, gros volume) dans le mois de son arrivée. |
| 85 (Maître) | 3 à 4 mois | Le titre qui ouvre les postes d'experts du clan doit être rare et respecté. |
| 90 | 5 à 6 mois | Les dernières ressources (90) : un vrai investissement, une saison entière. |
| 99 (Grand maître) | ~1 an | Un trophée, une annonce sur le fil du serveur. Un casu spécialisé y arrive aussi, en un an et demi environ. |

Les forgerons qui achètent leurs matières montent plus vite que les récolteurs : c'est voulu, car ils paient en or le temps des autres. L'autonome reste possible (Forge 60 en 20 jours) mais **2,5 fois plus lent** que celui qui achète son minerai.

## 5. Ce qu'un personnage atteint avec le temps

Niveau dans un métier (Minage, proposition `boucle-v0`) :

| Profil | 1 semaine | 1 mois | 3 mois | 6 mois | 1 an |
|---|---|---|---|---|---|
| Spécialiste, casu | 46 | 64 | 78 | 86 | 94 |
| Métier principal (½) + combat, casu | 34 | 56 | 69 | 78 | 86 |
| 3 métiers + combat (¼ chacun), casu | 17 | 46 | 60 | 69 | 78 |
| Spécialiste, régulier | 51 | 70 | 83 | 91 | 99 |
| Métier principal (½) + combat, régulier | 41 | 61 | 75 | 83 | 91 |
| 3 métiers + combat (¼ chacun), régulier | 25 | 51 | 66 | 75 | 83 |

Ce que ça représente pour un régulier qui a un métier principal et fait du combat :

- **Après une semaine** : métier principal ~40, Apprenti (épreuve passée), outils de fer, premiers objets vendus au marché, un clan rejoint. Les métiers d'appoint à 15–25 grâce à l'apprentissage.
- **Après un mois** : Compagnon (60) dans son métier, équipement du palier 3–4 fait maison ou commandé, une place reconnue dans le clan (« le forgeron »).
- **Après trois mois** : 75 dans son métier, les ressources rares de son palier, un premier événement saisonnier complet, ses premières commandes régulières.
- **Après six mois** : Maître (85) à portée, poste d'expert du clan, chefs-d'œuvre signés.
- **Après un an** : 90+ dans son métier, 99 pour un spécialiste ; deux à quatre métiers d'appoint au-dessus de 60.

**Arrivée tardive** : grâce à la courbe exponentielle, l'écart en niveaux reste petit. Un joueur qui arrive six mois après un régulier spécialisé est au niveau 70 au bout d'un mois, contre 91 pour le vétéran : il produit déjà des ressources de palier 7 sur 10, et le vétéran n'est « que » 20 niveaux devant. La règle de rattrapage du v1.0 (bonus d'XP sous la moyenne du serveur) n'est pas nécessaire au lancement ; à réévaluer quand le serveur aura un an.

## 6. Garder des choix en fin de jeu

- **Une nouvelle ressource tous les 10 niveaux** jusqu'au 90 (Minage : cuivre et étain, fer, charbon, argent, mithril, or, orichalque, azurite, sombracier, astralite), et des recettes de qualité à 70, 80, 90.
- **Les objets de haut niveau sont lents et chers** : la rareté se joue en unités par heure (30 s par action au 90), pas seulement en niveau.
- **Qualité des objets faits maison** (prévu au v1.0) : un artisan au-dessus du niveau d'une recette a une chance de qualité Supérieure, Rare ou Chef-d'œuvre. Un Grand maître reste demandé pour des objets de palier moyen.
- **Épreuves Maître (85) et Grand maître (99)** : chefs-d'œuvre qui demandent des matières de plusieurs métiers, donc du commerce.
- **Maîtrise après 99** (v1.0, inchangée) : paliers décroissants, +10 % au total au plus.

## 7. Limites de ces chiffres

- Le spécialiste « régulier » suppose une file jamais vide (deux visites par jour suffisent pour la récolte ; un artisan doit avoir son stock d'ingrédients).
- Les forgerons au-delà du niveau 45 utilisent une extrapolation : les paliers supérieurs gardent la structure de chaîne de l'acier.
- Le partage du temps est modélisé comme un découpage égal des journées ; un joueur réel concentre ses efforts.
- Le combat n'existe pas encore : sa part (¼ ou ½) est une hypothèse.
