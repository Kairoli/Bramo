# Arbitrages structurants et ordre d'implémentation

> Les choix ci-dessous attendent la décision de Louis. Chacun donne la recommandation, l'alternative principale et ce que ça change. Une fois tranché, le point passe en **[Décidé]** dans le document concerné et dans `docs/game-design.md`.

## 1. Arbitrages

| # | Question | Recommandation | Alternative | Conséquence du choix |
|---|---|---|---|---|
| 1 | Rendement hors ligne | **100 % partout, autonomie 16 h** ([presence.md](presence.md)) | 75 % hors ligne, plafond 16 h | 100 % : téléphone = bureau, onglet ouvert sans intérêt, écart de production casu / tryhard ×1,5. 75 % : rester rapporte encore +33 %, téléphone à 82 %. |
| 2 | Énergie quotidienne (×1,5 les 2 premières heures) | **Supprimer** | La garder pour l'onboarding seulement (premier jour) | Elle récompensait l'onglet visible. Sa suppression enlève une jauge de la barre du haut. |
| 3 | Récompenses de participation | **À part de la production** : Renom, prime de commande, rencontres, bonus de clan pour tous | Un bonus de production « Élan » gagné par des actions | Séparer protège le ratio ×2 et évite la course à la production sociale. |
| 4 | Courbe et taux d'XP | **Courbe RuneScape conservée**, taux R(L) = 400 × 2^((L−1)/55), artisanat ×1,75, **apprentissage ×2 sous 20** ([progression.md](progression.md)) | Courbe aplatie (doublement tous les 9 niveaux) | Spécialiste régulier : 30 en 1 jour, 60 en 2 semaines, 85 en 3,4 mois, 90 en 5,3 mois, 99 en 11 mois. La courbe aplatie retarde 60 à un mois mais rend le premier soir très lent. |
| 5 | Liste des métiers | **18 métiers + 3 extensions, ouverts par phases** ; Tannerie séparée de la Couture ; Agriculture et Joaillerie ajoutées ([metiers.md](metiers.md)) | 14 métiers actuels ; ou 25–30 métiers | 18 couvre toutes les chaînes. Au-delà, un serveur de 20–50 joueurs n'a plus de spécialiste par métier. |
| 6 | Agriculture en parallèle de l'activité | **Oui : parcelles en temps réel**, bornées par leur nombre | Agriculture comme métier de récolte classique | Une vraie exception à « une seule activité », justifiée par la limite des parcelles et la raison de revenir qu'elle donne. |
| 7 | Construction | **La garder comme métier-puits** : éléments posés dans l'atelier personnel et la halle du clan | La retirer, ou en faire une simple fonction de clan sans XP | Sans elle, 5 % de la production sert ; avec, 26 %. C'est le levier économique le plus fort. |
| 8 | Exploration | **Expéditions qui produisent des cartes de gisement** (échangeables), des curiosités et des sites | Carte de prospection quotidienne du v1.0 | Remplace un bonus de connexion par un produit de métier. |
| 9 | Plafonds de bonus | **Clan +10 % toutes sources ; nouvelle catégorie Lieu +25 %** (carte ou filon de clan, la meilleure des deux) ; filon de clan = expédition de clan, 48 h pour tous ([monde.md](monde.md)) | Garder les filons à +5 % par membre présent | Plus de bonus qui dépend de la présence simultanée ; cumul maximal ×1,95. |
| 10 | Marchand PNJ | **Rachat à 10 %, plafonné à 2 000 or par semaine ; Comptoir de la guilde : 3 commandes par semaine** ([economie.md](economie.md)) | Rachat à 25 % sans plafond (prototype) | Sans plafond : ~1 500 or créés par joueur et par jour. Tranche la question des commandes de PNJ (oui, hebdomadaires et limitées). |
| 11 | Repas | **Un repas rapporte ~2 fois son coût ; garde-manger automatique gratuit** | Repas manuels | Le garde-manger supprime un écart de pure attention entre casu et tryhard. |
| 12 | Usure | **Par heure d'usage effectif, réparations qui réduisent la durabilité maximale (−15 %), recyclage à 40 %** | Usure forte comme puits principal (v1.0) | L'usure renouvelle la demande, elle n'absorbe pas le volume. |
| 13 | Affinité de classe | **Plafond +5 %** et consommables signature par voie | +10 % (v1.0) | À +10 %, monter son métier principal deviendrait obligatoire. |
| 14 | Saisons | **Quatre événements récurrents de 4 semaines par an, sans remise à zéro**, jetons conservés, ensembles latéraux | Saisons de 6 semaines avec remise à zéro (v1.0) | Conforme à la décision de progression permanente. |
| 15 | Classes de métier | **Déblocage au niveau 60** | 40 (v1.0) | Avec la nouvelle progression, 40 tomberait en 2 à 4 jours. |
| 16 | Guilde du bourg | **Clan PNJ par défaut** pour les joueurs sans clan | Rien | Personne n'est privé de l'axe clan sur un petit serveur. |
| 17 | File d'actions | **Rester à 3 gratuites** ; examiner « fabriquer aussi les ingrédients » | Allonger la file | Lié au confort payant (longueur de file pour les abonnés, encore ouverte). |

## 2. Points encore ouverts

- Public visé et nom du jeu (v1.0).
- Arrivée du PvP.
- Confort payant : longueur de la file, place d'inventaire ; aucun ne doit toucher à l'écart de progression.
- Prime de commande : plafond exact, protection contre les échanges de complaisance entre deux comptes.
- Croissance des parcelles et plafond d'autonomie (recommandation : indépendants).
- Montants exacts des puits d'or (solde visé légèrement positif).

## 3. Ordre d'implémentation

Chaque étape se termine par `pnpm test`, `pnpm --filter @bramo/sim sim report` et une relecture des écarts.

1. **Présence et progression** *(petit, aucun nouveau système)* : dans `data/settings.yaml`, rendement unique 100 %, autonomie 16 h, énergie retirée, apprentissage ×2 sous 20. Recaler les recettes de Minage, Herboristerie, Forge et Cuisine sur `boucle-v0` (durées, XP, quantités, repas). Réécrire les épreuves 30 et 60 avec les nouvelles quantités. Retirer la jauge d'énergie du client ; textes du résumé d'absence.
2. **Bûcheronnage et Menuiserie jouables ; un outil par métier** : fers d'outils + manches, outils d'apprenti gratuits et incassables. Boucle complète récolte → transformation → fabrication → usage.
3. **Usure, réparation, recyclage et garde-manger dans le moteur** : durabilité décomptée par `advance` au fil des fabrications (hors ligne compris) ; réparation par recette ou au PNJ ; recyclage ; repas mangés automatiquement. C'est le **renouvellement de la demande**.
4. **P2 — Marché** : ordres d'achat et de vente, taxe, commandes artisanales et prime de commande, rachat PNJ plafonné, Comptoir hebdomadaire. **Pêche** jouable, fin du marchand du port. Simulateur : bots qui passent des ordres.
5. **P3 — Clans, Construction, Agriculture** : Guilde du bourg, entrepôt, commandes internes, halle et ses bâtiments, atelier personnel, parcelles. Le grand puits entre en service.
6. **P4 — Combat** : Chasse, Tannerie, Couture, Enchantement, Joaillerie, Alchimie ; armures par style, flèches et potions ; affinité plafonnée et consommables de voie. Simulateur : temps de combat et butin.
7. **P5 — Premier événement (le Givre)**, Artificerie et Exploration (cartes de gisement), classes de métier.
8. **P6** — Arènes, ouverture ; extensions (Élevage, Archéologie, Dressage) selon la population.
