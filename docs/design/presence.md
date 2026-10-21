# Présence, hors ligne et participation

> **Statut** : le rendement unique (100 %, 16 h) et les coups de fouet sont **[Décidé] le 21 octobre et appliqués** ; les récompenses de participation (§4) restent **[Recommandé]**. Chiffres : `sim/reports/rapport.md`, section « Présence ».
> [Décidé] : pas de bonus du jour ; on ne punit jamais l'absent ; l'écart casu / tryhard visé est de ×2 à ×2,5, jamais ×10.

## 1. Le problème mesuré

Heures effectives produites par jour, à recette et équipement identiques (vrai moteur) :

| Variante | 20 min/j (1 session) | 2 visites/j | Téléphone, 6 × 3 min | 2 h/j | Onglet 7 h–23 h | Onglet jour et nuit | Onglet 24 h / 20 min | Téléphone / onglet |
|---|---|---|---|---|---|---|---|---|
| **Actuel** : 25 % hors ligne 12 h, énergie ×1,5 | 3,5 | 6,5 | 6,6 | 7,6 | 19,0 | 25,0 | **×7,0** | 35 % |
| 50 % hors ligne, plafond 16 h | 8,4 | 12,2 | 12,2 | 13,0 | 20,0 | 24,0 | ×2,9 | 61 % |
| 75 % hors ligne, plafond 16 h | 12,4 | 18,1 | 18,1 | 18,5 | 22,0 | 24,0 | ×1,9 | 82 % |
| 100 %, autonomie 12 h | 12,4 | 24,0 | 24,0 | 20,0 | 24,0 | 24,0 | ×1,9 | 100 % |
| **100 %, autonomie 16 h** | 16,4 | 24,0 | 24,0 | 24,0 | 24,0 | 24,0 | ×1,5 | 100 % |
| **Décidé : 100 %, 16 h, 2 coups de fouet de 30 min** | 16,9 | 24,5 | 24,5 | 24,5 | 24,5 | 24,5 | ×1,45 | 100 % |
| 100 %, autonomie 24 h | 24,0 | 24,0 | 24,0 | 24,0 | 24,0 | 24,0 | ×1,0 | 100 % |

Le ×7 de la mesure est retrouvé (×7,04). Deux défauts : le jeu paie **la fenêtre visible, pas la participation**, et le **téléphone** (qui passe en arrière-plan, donc hors ligne) produit le tiers d'un onglet de bureau.

Remarque : à 100 % avec 12 h d'autonomie, « 2 h par jour » (20,0) fait moins bien que « 2 visites » (24,0) : ce qui compte n'est plus le temps passé mais **l'espacement des visites**.

## 2. Comparaison des solutions

| | 50 % / 16 h | 75 % / 16 h | 100 % / 16 h (recommandé) | 100 % / 24 h |
|---|---|---|---|---|
| **Ce qui donne envie de rester** | La production double quand on reste : on reste pour produire. | +33 % en restant : encore une raison de laisser l'onglet ouvert. | Rien en production. Rester sert à **participer** : commandes, marché, clan, rencontres, discussion (§4). | Idem. |
| **Fenêtre ouverte sans rien faire** | ×2,4 sur le casu : forte récompense. | ×1,8 : récompense nette. | Égale deux visites par jour : **aucun avantage** à rester ouvert. | Aucun. |
| **Téléphone en arrière-plan** | 61 % d'un onglet. | 82 %. | **100 %** : deux visites suffisent. | 100 %. |
| **Écart de production casu 20 min / onglet** | ×2,9 | ×1,9 | ×1,5 | ×1,0 |
| **Raison de revenir** | Forte (et culpabilisante). | Moyenne. | Revenir deux fois par jour (matin et soir) donne tout ; une fois par jour donne les deux tiers. | Aucune : une visite par semaine suffit à tout produire si la file est longue. |
| **Économie** | Production totale ~0,6 × celle d'un 100 %. | ~0,85 ×. | Production totale la plus haute à présence égale : les taux d'XP doivent être calibrés en conséquence (fait dans `progression.md`). | Idem, et plus aucun rythme. |

**Pourquoi pas 75 %** : c'est un compromis honnête, mais il continue de payer l'onglet ouvert (×1,8) et laisse le téléphone à 82 %. Si l'on veut une incitation de production à rester, il vaut mieux qu'elle vienne d'actions (§4) que d'un onglet.

**Pourquoi pas 24 h** : on perd la seule raison mécanique de revenir, et l'écart casu / tryhard tombe à 1 sur la production ; il ne resterait que le commerce, que l'on ne peut pas borner.

## 3. Décision : rendement unique, coups de fouet et participation séparée

1. **Rendement unique de 100 %**, en ligne comme hors ligne [Décidé]. L'énergie quotidienne, qui récompensait les deux premières heures d'onglet ouvert, devient **deux coups de fouet de 30 min (×1,5) par jour de jeu**, activés quand le joueur le veut, qui comptent aussi hors ligne ; un second activé pendant le premier s'y ajoute [Décidé, idée de Louis]. Ils ajoutent une demi-heure effective par jour à tout le monde et ne creusent pas l'écart.
2. **Autonomie de 16 h** après la dernière visite. Une visite = ouvrir le jeu (une requête authentifiée), dix secondes sur un téléphone suffisent. Au-delà, l'activité attend ; rien n'est perdu. Le résumé d'absence le dit : « Votre personnage a travaillé 16 h sur 20 ; il a attendu ensuite. »
3. **La participation est récompensée à part**, par des récompenses qui ne demandent ni horaire ni présence simultanée, et qui passent surtout par **autre chose que la vitesse de production** (§4).
4. Réglages appliqués dans `data/settings.yaml` : `rates.offline: 1`, `rates.offlineCapHours: 16`, `energy: { multiplier: 1.5, charges: 2, durationMin: 30 }`. Route `POST /api/energy/activate`, bouton « Coup de fouet » dans la barre du haut.
5. [Ouvert] Coup de fouet derrière une publicité : voir `arbitrages.md` §2.

## 4. Récompenser la participation sans horaire

Adaptées à un idle et à 20–200 joueurs : tout se fait de façon asynchrone, avec un seuil qui s'ajuste au nombre de joueurs actifs.

| Activité | Ce qu'on fait | Ce qu'on gagne |
|---|---|---|
| **Commandes artisanales** | Un joueur publie « 3 pioches de fer, je fournis le minerai, je paie 400 or » ; un artisan l'accepte, la fabrique dans sa file, la livre. | Or, Renom, XP de l'artisan (**prime de commande +20 % d'XP sur la fabrication**, plafonnée à 4 h effectives par jour). |
| **Marché** | Ordres d'achat et de vente, sans attendre l'autre partie. | Or (gains du commerce). |
| **Commandes internes et entrepôt du clan** | Déposer, retirer, répondre à une commande d'un membre. | Contribution de clan (classement interne, rangs). |
| **Projets du clan** | Livrer des éléments de construction quand on veut ; le projet avance pour tous. | Bonus de clan **pour tous les membres**, participants ou non (on ne punit pas l'absent). |
| **Rencontres** | Un événement de 48 h (« Une caravane en détresse », « Une bête rôde ») : chacun contribue à son rythme (livraisons, combat idle). Seuil proportionnel aux joueurs actifs de la semaine. | Récompense commune si le seuil est atteint, part personnelle proportionnelle à la contribution, avec un plancher bas. |
| **Entraide aux nouveaux** | Parrainer, remplir un « kit d'arrivée » demandé par le jeu. | Renom, titre de parrain. |
| **Fil du serveur** | Féliciter, réagir à une montée de titre. | Rien de mesurable (pas de récompense à la réaction, elle serait farmée). |
| **Veillée hebdomadaire** *(optionnel)* | Un moment annoncé où le maître d'un métier fait une démonstration. | Cosmétique ou titre ; **la même récompense s'obtient en différé** pendant la semaine. |

**Renom** : réputation de compte auprès des guildes du bourg. Il ouvre des cosmétiques gagnables en jeu, des titres, des décorations d'atelier, des plans de variantes esthétiques. **Pas de puissance.** Il évite que la participation devienne une course à la production.

## 5. Ce que vaut le ×2 à ×2,5 et où il s'applique

Le ratio s'applique à trois indicateurs, à choix identiques (même recette, même stratégie) :

| Indicateur | Casu 20 min | Régulier 2 visites | Tryhard | Écart casu / tryhard |
|---|---|---|---|---|
| Heures effectives de production par jour | 16,4 | 24 | 24 | ×1,5 |
| Production avec bonus (outil, repas, clan) | 16,4 × 1,3 | 24 × 1,38 | 24 × 1,5 | ×1,7 |
| Temps pour le niveau 90 d'un métier (simulé) | 8,3 mois | 5,3 mois | 4,9 mois | ×1,7 |
| Niveau de classe *(à mesurer en P4)* | | | | cible ≤ ×2,5 |

Ils **ne s'appliquent pas** : à l'or et à la richesse issue du commerce (non bornable sans tuer le marché), aux objets rares ou à la qualité obtenue, aux classements, au Renom. Le simulateur mesure l'écart à chaque changement de réglage.

## 6. Sur téléphone

- L'application en arrière-plan ne compte pas comme présente, mais avec un rendement unique cela n'a plus d'effet.
- Le geste type : ouvrir, lire le résumé, relancer la file, répondre à une commande, fermer. Moins d'une minute.
- Une **notification optionnelle** « autonomie bientôt écoulée » ou « récolte mûre » (Agriculture) aide sans obliger.
