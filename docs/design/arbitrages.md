# Arbitrages structurants et ordre d'implémentation

> **Rangs de métier** : décision séparée du 21 octobre (surnoms et commandes du maître aux niveaux 20, 40, 60, 80 et 99), voir [`rangs.md`](rangs.md).
>
> **Tranchés le 21 octobre** : n° 1, 2, 4, 11 et 12 (marqués **[Décidé]**, avec les ajustements de Louis). Les autres attendent sa décision. Chacun donne la recommandation, l'alternative principale et ce que ça change. Une fois tranché, le point passe en **[Décidé]** dans le document concerné et dans `docs/game-design.md`.

## 1. Arbitrages

| # | Question | Recommandation | Alternative | Conséquence du choix |
|---|---|---|---|---|
| 1 | Rendement hors ligne | **[Décidé]** **100 % partout, autonomie 16 h** ([presence.md](presence.md)) | 75 % hors ligne, plafond 16 h | 100 % : téléphone = bureau, onglet ouvert sans intérêt, écart de production casu / tryhard ×1,5. 75 % : rester rapporte encore +33 %, téléphone à 82 %. |
| 2 | Énergie quotidienne (×1,5 les 2 premières heures) | **[Décidé, modifié par Louis]** remplacée par **deux coups de fouet de 30 min par jour (×1,5), activés quand le joueur le veut** | La supprimer (ma recommandation) | Ils ne dépendent plus de l'onglet visible. Effet mesuré : +0,5 h effective par jour pour tout le monde, l'écart casu / onglet reste ×1,45. |
| 3 | Récompenses de participation | **À part de la production** : Renom, prime de commande, rencontres, bonus de clan pour tous | Un bonus de production « Élan » gagné par des actions | Séparer protège le ratio ×2 et évite la course à la production sociale. |
| 4 | Courbe et taux d'XP | **[Décidé, modifié par Louis]** Courbe RuneScape conservée, taux R(L) = 400 × 2^((L−1)/55), artisanat ×1,75, **sans XP doublée sous 20** ([progression.md](progression.md)). **Modifié le 23 octobre** : après une partie jouée en nouveau joueur, Louis remet l'XP doublée jusqu'au niveau 20 (`settings.xp.earlyBoost`) | Avec l'apprentissage ×2 sous 20 (ma recommandation) ; courbe aplatie | Spécialiste régulier : 30 en ~1 jour, 60 en 13 jours, 85 en 3,3 mois, 90 en 5,2 mois, 99 en 11 mois. Conséquence : une première session de 20 min atteint le niveau 4 environ, le niveau 10 vient au bout de ~2 h 30 effectives. |
| 5 | Liste des métiers | **17 métiers + 3 extensions, ouverts par phases** ; Tannerie séparée de la Couture ; Agriculture et Joaillerie ajoutées ([metiers.md](metiers.md)) | 14 métiers actuels ; ou 25–30 métiers | 17 couvrent toutes les chaînes. Au-delà, un serveur de 20–50 joueurs n'a plus de spécialiste par métier. |
| 6 | Agriculture en parallèle de l'activité | **Oui : parcelles en temps réel**, bornées par leur nombre | Agriculture comme métier de récolte classique | Une vraie exception à « une seule activité », justifiée par la limite des parcelles et la raison de revenir qu'elle donne. |
| 7 | Construction | **La garder comme métier-puits** : éléments posés dans l'atelier personnel et la halle du clan | La retirer, ou en faire une simple fonction de clan sans XP | Sans elle, 5 % de la production sert ; avec, 26 %. C'est le levier économique le plus fort. |
| 8 | Exploration | **Expéditions qui produisent des cartes de gisement** (échangeables), des curiosités et des sites | Carte de prospection quotidienne du v1.0 | Remplace un bonus de connexion par un produit de métier. |
| 9 | Plafonds de bonus | **Clan +10 % toutes sources ; nouvelle catégorie Lieu +25 %** (carte ou filon de clan, la meilleure des deux) ; filon de clan = expédition de clan, 48 h pour tous ([monde.md](monde.md)) | Garder les filons à +5 % par membre présent | Plus de bonus qui dépend de la présence simultanée ; cumul maximal ×1,95. |
| 10 | Marchand PNJ | **[Décidé, modifié par Louis]** **Aucun rachat PNJ.** Le PNJ passe seulement **X commandes par jour** (3 aujourd'hui, Comptoir de la guilde) ; tout le reste est entre joueurs ([marche.md](marche.md)) | Rachat à 10 % plafonné (ma recommandation) | Plus aucun plancher de prix : un serveur peu peuplé peut manquer d'offres (Étal de la guilde, `marche.md` §5). L'or entre par les commandes PNJ (récompenses ×0,75 le 21 octobre), sort par la taxe, les réparations, l'étal et les bâtiments de clan ; équilibre mesuré dans `marche.md` §9. |
| 11 | Repas | **[Décidé]** **Un repas rapporte ~2 fois son coût ; garde-manger automatique gratuit** | Repas manuels | Le garde-manger supprime un écart de pure attention entre casu et tryhard. |
| 12 | Usure | **[Décidé, modifié par Louis]** Par heure d'usage effectif, réparation qui rend tout, **sans perte de durabilité maximale**, recyclage à 40 % | Réparations qui retirent 15 % de durabilité maximale (ma recommandation) | Un objet aimé ne se détruit jamais. La demande d'équipement vient alors des réparations (travail d'artisan, or au PNJ), des paliers supérieurs, de la qualité, des nouveaux joueurs et des événements, pas du remplacement. |
| 13 | Affinité de classe | **Plafond +5 %** et consommables signature par voie | +10 % (v1.0) | À +10 %, monter son métier principal deviendrait obligatoire. |
| 14 | Saisons | **Quatre événements récurrents de 4 semaines par an, sans remise à zéro**, jetons conservés, ensembles latéraux | Saisons de 6 semaines avec remise à zéro (v1.0) | Conforme à la décision de progression permanente. |
| 15 | Classes de métier | **Déblocage au niveau 60** | 40 (v1.0) | Avec la nouvelle progression, 40 tomberait en 2 à 4 jours. |
| 16 | Guilde du bourg | **Clan PNJ par défaut** pour les joueurs sans clan | Rien | Personne n'est privé de l'axe clan sur un petit serveur. |
| 17 | File d'actions | **Rester à 3 gratuites** ; examiner « fabriquer aussi les ingrédients » | Allonger la file | Lié au confort payant (longueur de file pour les abonnés, encore ouverte). |

## 2. Points encore ouverts

- **Rangs** : commandes du maître, surnoms définitifs et traitement de l'XP en attente de validation d'un palier ([`rangs.md`](rangs.md) §4).
- **Coup de fouet derrière une publicité** (idée de Louis : regarder une pub pour l'obtenir, pub retirable par un abonnement, coup de fouet achetable plus tard). Point d'attention : un bonus de production obtenu contre de l'argent ou de l'attention publicitaire touche au pilier « le payant ne vend que du confort et du cosmétique, jamais de ressources » et à l'écart ×2–2,5. Piste compatible : la pub ou l'abonnement ne donnent **pas plus** de coups de fouet que le joueur gratuit, seulement un confort (par exemple l'activation automatique). Pour l'instant : deux charges gratuites pour tous.

- Public visé et nom du jeu (v1.0).
- Arrivée du PvP.
- Confort payant : longueur de la file, place d'inventaire ; aucun ne doit toucher à l'écart de progression.
- Prime de commande : plafond exact, protection contre les échanges de complaisance entre deux comptes.
- Croissance des parcelles et plafond d'autonomie (recommandation : indépendants).
- Montants exacts des puits d'or (solde visé légèrement positif).

## 3. Ordre d'implémentation

Chaque étape se termine par `pnpm test`, `pnpm --filter @bramo/sim sim report` et une relecture des écarts.

1. **[Fait le 21 octobre]** **Présence et progression** : dans `data/settings.yaml`, rendement unique 100 %, autonomie 16 h, coups de fouet (2 × 30 min, bouton dans la barre du haut). Recettes, repas et objets repris de `boucle-v0` ; épreuves 30 et 60 réécrites.
2. **[Fait le 21 octobre]** **Bûcheronnage et Menuiserie jouables ; un outil par métier** : fers d'outils + manches, boucle récolte → transformation → fabrication → usage jouable. **Reste** : les outils d'apprenti (aujourd'hui, sans outil on travaille simplement sans bonus).
3. **[Fait le 21 octobre]** **Usure, réparation, recyclage et garde-manger dans le moteur** (outils ; réparation par un artisan avec le marché) : durabilité décomptée par `advance` au fil des fabrications (hors ligne compris), sans perte de durabilité maximale ; réparation par recette ou au PNJ ; recyclage ; repas mangés automatiquement. C'est le **renouvellement de la demande**.
4. **[Fait pour l'essentiel le 21 octobre]** **P2 — Marché** : ordres d'achat et de vente, taxe 5 %, achat direct, commandes PNJ du jour (Comptoir), **Pêche** jouable, fin du marchand du port. **Aussi fait** : commandes PNJ par joueur adaptées aux niveaux, Étal de la guilde (palier 1, livre vide), prime de commande, réparation par matériaux et par un artisan. **Abandonné** : commandes à matériaux fournis, frais de dépôt (décisions du 21 octobre). **Reste** : simulateur de marché (bots qui passent des ordres) : voir marche.md §7.
5. **P3 — Clans, Construction, Agriculture** : Guilde du bourg, entrepôt, commandes internes, halle et ses bâtiments, atelier personnel, parcelles. Le grand puits entre en service.
6. **P4 — Combat** : Chasse, Tannerie, Couture, Enchantement, Joaillerie, Alchimie ; armures par style, flèches et potions ; affinité plafonnée et consommables de voie. Simulateur : temps de combat et butin.
7. **P5 — Premier événement (le Givre)**, Artificerie et Exploration (cartes de gisement), classes de métier.
8. **P6** — Arènes, ouverture ; extensions (Élevage, Archéologie, Dressage) selon la population.
