# Une économie active

23 octobre 2026, après-midi. Objectif de Louis : « une économie active, où passer par le marché est l'instinct numéro 1 du
joueur pour monter un métier qu'il ne récolte pas ». Exemple : un herboriste qui veut monter Forgeron achète de gros stocks
de minerai au lieu de miner des heures. Référence : Dofus, où les hôtels de vente sont au cœur de tout. Et « ni noir ni
blanc » : récolter soi-même reste toujours possible ; le marché est un raccourci payant, jamais une obligation.

## 1. Ce qui a changé

| Changement | Décidé par | Pourquoi |
|---|---|---|
| **Or du Comptoir ×2** | Louis | Au simulateur, deux fois plus d'or fait acheter deux fois plus d'unités au marché, sans faire monter les prix (les joueurs récoltent bien plus que ce qui se consomme). Louis accepte que certains joueurs soient riches : « un jour ils monteront un métier et utiliseront l'argent ». |
| **Monnaie ×10** | Louis | « Miner pour vendre son métal 1 or, ça fait chier. » Avec des montants dix fois plus grands, un minerai se vend 12, 25 ou 40 au lieu d'être écrasé au plancher de 1 ; et un joueur voit 5 000 plutôt que 500. Tout est à l'échelle : or de départ 1 000, Comptoir, maîtres, bâtiments, ouvrages, Mécène, Affineur, étal, valeur des objets (recalculée plus finement), valeur du temps du simulateur. |
| **Achat en gros** (« Acheter 10 / 100 / 1 000 maintenant ») | Claude | Le marché n'achetait qu'une unité d'un clic. Les boutons prennent les offres les moins chères jusqu'à la quantité choisie, avec le prix total affiché ; rien ne reste en attente (`immediate` sur `POST /api/market/order`). |
| **Recettes croisées** | Louis (sur proposition) | Les recettes de niveau moyen et haut de la Couture, de la Cuisine, de la Menuiserie et de la Construction demandent le produit d'un autre artisan (corde de cuir pour la douelle d'arc, boutons d'Artificerie pour la robe de lin, rune pour la robe d'adepte, pain pour les soupes, tirants de fer pour l'arche). Le début reste simple. |
| **Bâtiments de clan par niveaux** | Louis (sur proposition) | Avant, uniquement des matières brutes. Désormais : niveau 1 = une récolte et une pièce simple (planches, mortier, moellons, verre, lanières, pain) ; niveaux 2 et 3 = des pièces d'autres artisans (charpentes, escaliers, lingots, toile, parchemins, arches, fermes de toit). Champ `fromLevel` de `data/buildings.yaml`. |
| **Ouvrages variés, 5 000 or** | Louis | Chaque ouvrage : une récolte en trop, une matière transformée, une pièce finie d'un autre artisan. Le premier ne demande que des recettes du niveau 1. Rythme réglé pour un Banquet par semaine pour les clans les plus actifs. |

## 2. Mesures (simulateur, 120 joueurs, 90 jours, trois graines)

`sim/reports/serveur/v15-real-s11`, `s12`, `s13` ; serveurs extrêmes `v15-meta`, `v15-dump`, `v15-hoard`.

| | Avant cette journée | Maintenant |
|---|---|---|
| Joueurs qui achètent chaque jour | ~56 % | **63 à 74 %** |
| Unités achetées par joueur et par jour | ~61 | **184 à 243** |
| Achats en gros (100 unités et plus) par jour | ~20 | **50 à 62** |
| Joueurs qui renoncent à un achat faute d'or (par jour) | 12 à 21 % | **9 à 11 %** |
| Prix des matières (100 = prix de référence) | ~50 à 60 | **44 à 72** selon la graine |
| Ouvrages achevés en 90 jours, meilleurs clans | 0 | **10 et 9** (graine 11), 6 (graine 12), 2 (graine 13) |
| Marées offertes par un mécène | — | **77 à 118** (presque un mécène par soir) |
| Or créé / or détruit, 30 derniers jours | 1,6 à 2,1 | **1,3 à 1,5** |

Ce qui reste à surveiller :

- **Les plus riches** gardent beaucoup d'or (environ 850 par joueur et par jour en moyenne, à l'échelle ×10). Louis l'accepte ;
  les prix ne montent pas, et les puits voulus (Mécène, Ouvrages, Affineur) absorbent davantage à mesure qu'ils s'enrichissent.
- **Un serveur de bradeurs** (40 % de joueurs qui vendent 30 % sous le marché) écrase les prix à 9 % de la référence : le
  marché n'a pas de plancher. C'est le prix de la liberté du marché ; à surveiller avec de vrais joueurs.
- **Le Traqueur, le Runiste ou le Forgefeu** passent tour à tour derrière selon la graine (petits groupes) : pas de classe
  défavorisée de façon régulière.

## 3. Ce que le simulateur a dû apprendre

Ces corrections ne changent pas le jeu ; elles rendent les joueurs simulés plus proches de vrais joueurs.

- **Acheter ou récolter** : un joueur qui calcule compare les deux pour chaque recette et choisit selon ce qu'il cherche et
  l'or qu'il a (avant, seuls les joueurs « qui cherchent l'or » achetaient leurs matières).
- **La Construction et l'Exploration** n'étaient exercées par personne (famille « monde » qu'aucune façon de jouer ne
  choisissait) : la Construction compte désormais comme un artisanat, l'Exploration comme une récolte.
- **Fabriquer pour son clan** : un membre valorise ce que son clan attend (au moins 1,5 fois sa valeur), le garde pour le
  donner, et le fabrique même hors de ses métiers si son niveau le permet (n'importe qui sait faire du bronze).
- **Mesures du marché** : acheteurs par jour, unités, achats en gros, achats ratés faute d'or (rapport, section Marché).
- Hypothèses à garder en tête : 40 % de ce qu'un membre donne au clan va aux ouvrages ; un mécène est un joueur qui a au
  moins six fois le prix et qui est généreux ; l'Affineur sert aux joueurs qui calculent et ont plus de 50 000 or.
