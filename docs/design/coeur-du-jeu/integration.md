# Intégrer « le cœur du jeu » au moteur réel

> **Statut** : plan d'intégration proposé par Claude le 22 octobre 2026, après lecture du dossier [`Bramo-coeur-du-jeu.md`](Bramo-coeur-du-jeu.md) (v0.2) et confrontation au dépôt (`main` après `d5ab806`). Les marques suivent la convention du projet : **[Décidé par Louis]**, **[Proposé par Claude]**, **[Ouvert]**. Les coefficients du dossier restent provisoires (`# à équilibrer`).

## 1. Précisions de Louis du 22 octobre [Décidé par Louis]

1. **Combat entièrement automatique** : on prépare le build, on choisit les sorts, on programme leur **première utilisation**, puis ils tournent sur leurs cooldowns.
2. **Forgefeu soutien** : ses protections visent **lui-même ou un allié**. Une protection individuelle ne devient jamais une protection de tout le groupe.
3. **Ralentissement** : réduit la **cadence des attaques ordinaires** (les combattants sont fixes). Il ne décale pas les phases spéciales des boss.
4. **Éléments** : gardés dans les compétences, affixes et synergies ; **résistances et faiblesses élémentaires ennemies reportées** (pour ne pas pénaliser les classes moins polyvalentes).
5. **Équilibrage des voies** : un DPS a un **avantage de rendement perceptible** ; soutien et contrôle gardent une **progression solo satisfaisante**. Examiner Fulgurant et Sigillaire, sans hausse générale des dégâts à l'aveugle.
6. **Difficulté** : toutes les voies progressent, aucun build ne réussit tout immédiatement. Une **progression PvE solo à difficulté croissante**, distincte des zones et donjons, avec des **murs** franchis par les niveaux, l'équipement et le build.
7. **Récompenses de cette progression** : bonus permanents envisageables, **à définir** ; pas de bonus économique illimité qui ferait des combattants de meilleurs producteurs que les artisans et récolteurs.
8. **Extensions futures** (à rendre compatibles, pas à coder) : donjons avec participation **asynchrone d'alliés hors ligne**, **world boss** collectifs ; les contributions de soutien et de contrôle sont reconnues.
9. **Accessibilité** : un **plan automatique conseillé** permet de commencer ; les réglages fins optimisent, sans précision à la seconde pour le contenu ordinaire.
10. **Réponse à Q1, ouverture** : le build a un **minuteur** (sort 1 immédiat, sort 2 après 3 s…, **10 s au plus**) ; une fois ce minuteur exécuté, les sorts partent en automatique selon leur cooldown, simplement. Règle « séquence » dans `rules.yaml` (`maxFirstUse: 10`).
11. **Réponse à Q2, nommés** : les gemmes sont des talents à mettre sur les builds ; les armes et objets nommés ont aussi des capacités uniques, **traitées comme des talents** (une capacité nommée occupe la place d'une gemme majeure).
12. **Réponse à Q3, récompenses de la progression solo** : « un peu tout », mais **pas à chaque palier** : à des **checkpoints conséquents**. Bonus de combat plafonnés, titres et cosmétiques, caches de butin ponctuelles, matériaux de perfectionnement.
13. **Réponse à Q4, forme** : un **mélange** entre une progression classique par étapes et chapitres (à la *Legend of Mushroom*) et une couche **saisonnière à mutations**. *[Proposé par Claude, à valider]* : une échelle permanente d'étapes groupées en chapitres, jamais remise à zéro, avec un checkpoint de récompenses en fin de chapitre ; chaque saison de 6 semaines applique une **mutation** (règle de rencontre qui change) sur des étapes de saison, avec leurs propres récompenses cosmétiques et de collection.
14. **Réponse à Q5, recyclage** : l'équipement de combat, dropé ou fabriqué, se recycle en **poudres et fragments d'atelier**, pas en matières premières.
15. **Réponse à Q6** : second élément du Traqueur = **Foudre**.

## 2. Ce que le dossier suppose et ce que le code fait

| Sujet | Dépôt (22 octobre) | Dossier | Conséquence |
|---|---|---|---|
| Moteur de combat | Aucun (ni stats de combat, ni niveau de classe, ni activité de combat) | Banc Python indépendant, pas de moteur TypeScript | Tout le moteur est à écrire dans `packages/shared`, utilisé par le serveur **et** le simulateur (principe « même moteur ») |
| Statistiques d'équipement | 6 stats fixes (`vitality`, `defense`, `power`, `haste`, `crit`, `tenacity`) ; lignes aléatoires identifiées par leur **libellé français** (« Critique ») | 11 stats + groupes d'affixes, éléments paramétrés | Il faudra des identifiants stables de lignes (migration de `gear_pools.yaml` et des exemplaires déjà tirés) |
| Ensembles | 7 ensembles **d'une classe**, bonus en texte | 18 ensembles **multi-classes**, bonus structurés, bijoux et arme inclus | Ne pas additionner les anciens bonus aux nouveaux ; décider la migration (§3) |
| Python | — | Banc et vérificateur en Python | Python n'est pas installé ici ; on ne relance pas le banc, on compare le moteur TypeScript à ses **résultats livrés** |

## 3. Contradictions avec les décisions existantes

| # | Point | Décision ou texte existant | Dossier | Proposition |
|---|---|---|---|---|
| C1 | **Talents fixes sur les objets nommés** | [Décidé par Louis] « Les talents viennent des gemmes » (`combat-items.md` §0.2) | 24 nommés à talent fixe qui **remplace** une majeure ; le dossier cite « la dernière demande de Louis » | **Tranché par Louis le 22 octobre** : capacités uniques des nommés traitées comme des talents (§1, point 11) |
| C2 | **Résistances élémentaires** | `combat-items.md` §3.1 [Proposé par Claude] : les résistances ennemies diversifient les builds ; dossier §4 : « une région glacée moins favorable au Givre » | — | **Reportées** (précision 4). Le moteur garde le type de dégâts et un champ de résistance à 0, non utilisé par le contenu |
| C3 | **Ouverture du plan** | Précision 1 : « première utilisation, puis cooldowns » | §3 : les répétitions **attendent la fin de l'ouverture** complète | **Tranché par Louis le 22 octobre** : minuteur de 10 s au plus, puis cooldowns (« séquence », §1 point 10). « independent » reste simulée pour comparer |
| C4 | **Hors ligne** | `combat-items.md` §3.1 [Proposé par Claude] : échantillon de 20 combats puis extrapolation | §17 : un échantillon ne suffit pas pour attribuer le butin | Je retire ma proposition : résolution déterministe complète, à la demande, avec reprise ; coût mesuré à l'étape 4 |
| C5 | **Pas de temps** | `combat-items.md` §3.1 : 1 pas par seconde | Banc : 0,25 s | Horloge entière en millisecondes, pas de 250 ms réglable (`combat.tickMs`) |
| C6 | **Rareté Légendaire** | `combat-items.md` §5.2 [Proposé par Claude] : un attribut conditionnel unique | Rareté sans talent ni attribut conditionnel | Le dossier suit la décision de Louis du 21 octobre (lignes 1+0-1 / 2+1-2 / 2+2-3 / 2+3-4) ; §5.2 est dépassé |
| C7 | **Recyclage** | `settings.wear.recycleShare: 0.4` pour les outils | Équipement de combat recyclé en poudres et fragments, pas 40 % de la recette | **Tranché par Louis le 22 octobre** : poudres et fragments (§1, point 14) |
| C8 | **Ralentissement des boss** | Précision 3 | §7 et banc : ralentissement des boss plafonné à 15 %, sur les attaques ordinaires seulement | Compatible. Le moteur sépare **cadence ordinaire** (ralentissable) et **calendrier de phases** (jamais ralenti) |
| C9 | **Protections de groupe** | Précision 2 | « Une plaque, un bénéficiaire » ; budget total fixé en groupe | Compatible. Le moteur choisit un **bénéficiaire** par protection, selon la priorité du plan (soi en solo) |
| C10 | **Second élément du Traqueur** | `combat-items.md` §4.2 : « nature/foudre à décider » | Foudre, provisoirement | **Tranché par Louis le 22 octobre** : Foudre |
| C11 | **Sorts de voie et ultime** | `combat-items.md` §2.2 : deux sorts de voie au 30, l'ultime « entre dans le plan » | Trois sorts de voie (30, 50, 70) ; l'ultime **prend une des cinq places** | Le dossier précise sans contredire ; je suis le dossier |

## 4. Ce que disent déjà les résultats du banc sur les voies

> Comparaisons faites **ligne par ligne** dans `resultats-combat.json` : le temps médian (victoires) et les PV médians portent sur **le même plan, le même profil et les mêmes graines**. Je ne compare pas le tableau des meilleurs temps (§16, meilleur des trois plans par case) à la colonne des PV moyens (moyenne de tous les plans et profils) : ce ne sont pas les mêmes agrégations.

**Kit seul** (baselines du banc : premier plan de chaque voie, sans ensemble, nommé ni gemme, statistiques normalisées), répertoire 80 :

| Voie (rôle) | Cible durable | Groupe | Charge | Usure | Gardes | Soin ennemi |
|---|---|---|---|---|---|---|
| Fulgurant (dégâts) | 47,3 s · 74 % | 68,3 s · 60 % | 51,3 s · 62 % | 56,3 s · 65 % | 61,0 s · 84 % | 52,3 s · 83 % |
| Sigillaire (contrôle) | 53,8 s · 62 % | 79,3 s · 35 % | 53,8 s · 52 % | 61,8 s · 49 % | 63,3 s · 68 % | 57,3 s · 71 % |
| Glyphiste (soutien) | 47,3 s · 83 % | 76,0 s · 73 % | 51,0 s · 76 % | 53,8 s · 82 % | 57,0 s · 95 % | 52,3 s · 97 % |

- **Fulgurant n'a aucun avantage de rendement sur Glyphiste** dans le kit : même temps sur cible durable, plus lent en usure et contre les gardes, et toujours moins de PV. Son seul avantage est le groupe (−10 %). Au répertoire 40, il gagnait (41,3 s contre 52,0 s) : **le plan 80 de Fulgurant (Ligne de partage, Cercle de rupture, Phrase souveraine) fait moins bien que son plan 40**. Le problème tient à la fois au passif (0,65 P tous les trois sorts, sans lien avec la phrase) et au répertoire 80.
- **Sigillaire est dominé par Glyphiste partout** : plus lent **et** moins de PV dans les six profils, en kit comme avec l'équipement des plans (le meilleur plan Glyphiste bat le meilleur Sigillaire sur les deux mesures, case par case). Le contrôle ne paie pas dans ces profils : la Rupture (+8 % de dégâts reçus, prochaine attaque −25 %) vaut peu face à des ennemis qui frappent peu fort.
- Même constat plus léger ailleurs : **Enclumier** à peu près égal à Trempe-Rouge au répertoire 80 en kit ; **Piégeur** moins de PV que Tue-Bête pour un temps plus long.
- **Aucun échec** dans les 324 lignes de référence : à danger normal, tout passe. Les échecs n'apparaissent qu'aux stress tests (dégâts ×2 en groupe : Tue-Bête et Piégeur 0 %, Sigillaire 25 %).

Pistes (à mesurer dans le moteur réel avant d'en retenir une, **pas de hausse générale des dégâts**) :
- **Fulgurant** : lier le Dernier mot à la phrase (par exemple : plus fort quand les trois runes lues sont différentes, ou quand il conclut un Trait lu), revoir le plan 80 conseillé avant de toucher au coefficient.
- **Sigillaire** et contrôle en général : donner de la valeur au contrôle par le **contenu** (attaques chargées qui comptent vraiment, renforts), et une partie offensive au Scellé (le seuil de trois Scellés est lent : 3 actions de contrôle qualifiantes).
- Garder pour cible : DPS **10 à 30 % plus rapide** que le soutien de sa classe à danger normal, soutien et contrôle **plus sûrs** (PV, taux de victoire) à danger élevé.

## 5. Ordre d'intégration proposé

Chaque étape se termine par une vérification écrite et un commit. Les chiffres restent dans `data/`, marqués `# à équilibrer`.

| Étape | Contenu | Vérification |
|---|---|---|
| **0** | Ce document : contradictions, questions, ordre | Relecture par Louis |
| **1** | **Moteur de combat partagé, kit seul** (`packages/shared/src/combat/`) : horloge en ms entières, tirages séparés par flux, plan (sorts, première utilisation, priorité), cooldowns et délai global, attaque de base par famille d'arme, trois mécaniques de classe, neuf passifs, Stabilité/Pression/Rupture, ralentissement sur la cadence ordinaire seulement, boucliers à **bénéficiaire**, équipes de 1 à N combattants (solo = 1), registre de **contributions** par combattant (dégâts, soins utiles, absorptions, atténuation, Pression, Ruptures, dissipations). Données `data/combat/` validées par zod (66 sorts, 9 voies, 6 profils de rencontre) | Tests unitaires des règles du dossier (exemple A/B/C du §3, Braises, Angle, runes, Scellés, Encre, conversion des étourdissements, plafond de ralentissement des boss, phases non décalées) |
| **2** | **`sim combat`** sur le moteur réel : les 27 plans en kit seul, six profils, graines, les deux règles d'ouverture, tolérance des horaires (±1 à 2 s) ; résultats **bruts** par combat (victoire, temps, PV, cause d'échec, métriques) gardés dans `sim/reports/combat/`, résumé séparé par type d'agrégation | Comparaison aux baselines du banc (même plan, même profil) avec tolérance ; écarts expliqués |
| **3** | **Équilibrage des voies** : propositions dans `sim/proposals/combat-*/`, mesurées sur danger normal et élevé ; Fulgurant, Sigillaire, contrôle | Rapport comparatif avant/après ; Louis choisit |
| **4** | **Niveau de classe et activité de combat** : XP de classe au temps de combat (`R(L)`, rattrapage), plan enregistré, **plan conseillé automatique** par classe/voie/niveau, combat comme activité de `advance` (une activité à la fois, 16 h d'autonomie, coups de fouet), état reprenable et idempotent ; routes serveur ; salle Combat minimale (plan, journal « 2 Braises dépensées ») | Tests « une fois = plusieurs fois », coût d'une absence de 16 h mesuré ; vérification dans le navigateur |
| **5** | **Statistiques réelles** : `gearTotals` → P, Vitalité, Défense, Cadence… avec rendements décroissants (`plafond × score / (score + K)`), budget par palier ; puis la **progression solo à difficulté croissante** (paliers de rencontres composées, murs mesurés) | Courbe « niveau + équipement de palier → palier franchi » par voie ; aucune voie bloquée, aucun build qui passe tout |
| **6** | **Gemmes** (4 majeures, mineures), quelques **ensembles** structurés, nommés (si C1 confirmé), **butin** vers les exemplaires, recyclage de combat | Simulateur de marché relancé avec les sources et puits du combat (20 joueurs) ; ratio « matériaux recréés / heure de combat » < 10 % d'un récolteur |
| Plus tard | Donjons à alliés hors ligne, world boss | Préparé dès l'étape 1 : équipes, bénéficiaires, contributions par rôle ; snapshots de build |

## 6. Avancement

### Étape 1 faite (22 octobre) : moteur de combat partagé, kit seul

- **Données** `data/combat/` : `rules.yaml` (règles communes), `kits.yaml` (3 mécaniques, 9 voies), `spells.yaml` (66 sorts), `plans.yaml` (27 plans d'exemple, répertoires 40 et 80), `encounters.yaml` (6 profils du banc). Portées depuis `projet.json` du dossier, validées par zod (`schemas/combat.ts`) et par `buildCombatContent` (classes, voies, armes, sorts de voie, places, un seul ultime) au démarrage du serveur comme du simulateur.
- **Moteur** `packages/shared/src/combat/engine.ts` : `fight(combat, équipe, rencontre, { seed, opening, enemyDamageScale, trace })`. Horloge en ms entières, tirages par flux, deux règles d'ouverture, équipes de 1 à N avec un bénéficiaire par protection, registre de contributions, journal lisible (« 3 Braises dépensées », « rune Sceau lue », « Rupture »). Le client ne reçoit pas encore ce contenu.
- **Écart voulu avec le banc Python** : une Assise (Enclumier) et une préparation d'attaque de base **remplacent** la précédente (texte du dossier ; le banc gardait l'ancienne). Ouverture « séquence » avec un minuteur de 10 s au plus (réponse de Louis à Q1).
- **Tests** : 13 tests de règles (`packages/shared/test/combat.test.ts`) dont l'exemple A/B/C du §3, le plafond de ralentissement des boss, les phases non décalées, la conversion de l'étourdissement, la récupération après Rupture, le bénéficiaire unique en groupe ; un test du simulateur qui exige de retrouver les temps du banc.

### Étape 2 faite (22 octobre) : `sim combat` sur le moteur réel

`pnpm --filter @bramo/sim sim combat` : 29 160 combats en une dizaine de secondes. Rapport [`sim/reports/combat/rapport.md`](../../../sim/reports/combat/rapport.md), une ligne par cas dans `resume.json`, une ligne par combat dans `combats.json` (échecs compris, avec leur cause et les PV ennemis restants).

- **Fidélité** : en kit seul et ouverture « séquence », le moteur retrouve les temps du banc Python avec un écart **médian de 0,5 %** (maximum 5,7 %) et les mêmes PV. Les constats du §4 tiennent donc dans le moteur réel.
- **Rendement des DPS** (meilleur plan de chaque voie, répertoire 80, danger normal, ouverture « séquence ») : Glyphiste est **aussi rapide ou plus rapide que Fulgurant** sur cinq profils sur six (de +3 % à −9 % ; seul le groupe compact donne +13 % au DPS), avec plus de PV ; Sigillaire est **plus lent et plus fragile que Glyphiste dans les six profils**. Forgefeu (soutien +15 à 26 %, contrôle +11 à 35 %) et Traqueur (soutien +15 à 20 %) sont dans la cible ; **Piégeur** n'est que 5 à 12 % plus lent que Tue-Bête, avec un peu plus de PV.
- **Murs** : à dégâts ennemis ×2, le **groupe compact** arrête presque tous les plans (en « séquence », seul Contre-écriture passe tout ; Plaques fidèles et Garde offensive gagnent une fois sur deux) ; les plans de contrôle y font 0 %. Le contrôle ne protège pas encore contre les groupes.
- **Accessibilité** : décaler chaque horaire au hasard de ±2 s change le temps de moins de 3 % ; mettre tous les sorts à 0 s (ordre du plan) fait aussi bien ou mieux (−6 à +5 %). Un plan conseillé « sorts dans l'ordre, sans horaire » suffit pour commencer.
- **Ouverture** : en moyenne sur les six profils, « independent » va de 6 % plus rapide à 4 % plus lent que « séquence » selon les plans (13 % au plus sur un profil). La règle change peu le rendement : elle se choisit sur la lisibilité.

### Étape 3 faite (22 octobre) : équilibrage des voies, deux propositions mesurées

Rien n'est changé dans `data/`. Les propositions sont dans `sim/proposals/<nom>/combat.yaml` (format décrit dans `sim/README.md`) ; les leviers ajoutés au moteur sont des paramètres **inactifs par défaut** (`data/` donne exactement les mêmes combats qu'avant).

**Outil nouveau : la recherche de plans** (`sim combat-search`). Pour chaque voie, toutes les combinaisons de 5 sorts accessibles aux répertoires 40 et 80 (au plus un ultime), sans horaire ; les plus rapides, les plus sûrs et le meilleur de chaque profil sont rejoués à 12 graines et aux dangers ×1 à ×4. Le **mur** d'une voie dans un profil est le plus haut danger où l'un de ses plans gagne 90 % des combats. Rapports : `sim/reports/combat/recherche.md` (données actuelles) et `sim/reports/combat/<proposition>/recherche.md`. La même recherche fournira le **plan conseillé automatique** de l'étape 4.

**Ce que la recherche a changé au diagnostic** (données actuelles, kit seul) :
- **Fulgurant n'a pas de problème de passif** : avec son meilleur plan, c'est le DPS le plus rapide (41,4 s en moyenne au répertoire 80, contre 42,9 pour Trempe-Rouge et 46,4 pour Tue-Bête). Son retard venait des **plans d'exemple** du dossier, qui lui retirent Rature ardente au répertoire 80. Glyphiste et Sigillaire sont alors 6 à 14 % plus lents que lui.
- Le vrai écart manquant est chez **Forgefeu et Traqueur au répertoire 40** : l'Enclumier y est même 1 à 3 % plus rapide que Trempe-Rouge, et le Piégeur seulement 2 à 5 % plus lent que Tue-Bête.
- **Le contrôle n'avait aucun avantage de survie** : ses murs étaient ceux du DPS. Il était seulement un DPS un peu plus lent.
- **Des sorts de voie que personne ne prend** : le meilleur plan d'Enclumier et de Rémouleur (aux deux répertoires) et de Trempe-Rouge au 40 ne contient **aucun** sort de sa voie ; les sorts communs valent mieux.

**Proposition `combat-plans-v1`** : seulement des plans conseillés (un par voie, issus de la recherche), aucune règle changée. Elle règle Fulgurant et montre l'effet des plans seuls. Rapport : `sim/reports/combat/combat-plans-v1/rapport.md`.

**Proposition `combat-voies-v1`** *[Proposé par Claude, à valider]* : les plans conseillés recherchés sur ses propres règles, plus :
1. **Deux passifs de dégâts renforcés, eux seuls** : Rebattue (Trempe-Rouge) 0,12 → 0,22 P par Braise ; Morsure (Tue-Bête) 0,42 → 0,65 P. Fulgurant inchangé.
2. **Survie du contrôle** (Enclumier, Piégeur, Sigillaire) : l'Affaiblissement de leur passif touche **toutes les attaques** de la cible pendant sa durée, à valeur réduite (Enclumier 8 → 6 % par Braise, Contrepiège et Interdit 25-30 → 20 %) ; leurs ralentissements +10 points et +50 % de durée (toujours plafonnés à 15 % sur un boss, sans toucher ses phases).
3. **Rupture des ennemis ordinaires** (jamais des boss) : Stabilité 50 au lieu de 80, et 2 s d'étourdissement à la Rupture.

Résultats de la recherche sur cette proposition (meilleur plan par profil ; écart de temps au DPS de la classe ; murs) :

| Classe | Répertoire 40 : contrôle / soutien | Répertoire 80 : contrôle / soutien | Murs du contrôle |
|---|---|---|---|
| Forgefeu | +5 à +9 % / +8 à +14 % (avant : −1 à −3 % / +1 à +8 %) | +11 à +18 % / +14 à +23 % (avant : +2 à +12 % / +10 à +16 %) | égaux ou plus hauts que le DPS partout, ≥ ×4 contre gardes et soins |
| Traqueur | +5 à +10 % / +8 à +15 % (avant : +2 à +5 % / +4 à +10 %) | +2 à +13 % / +12 à +16 % (avant : +1 à +11 % / +10 à +14 %) | égaux ou plus hauts que le DPS ; un demi-cran au-dessus sur quatre profils sur six au répertoire 80 |
| Runiste | +3 à +8 % / +3 à +13 % (avant : +6 à +11 % / +3 à +13 %) | +5 à +12 % / +6 à +12 % (avant : +7 à +14 % / +6 à +12 %) | Sigillaire ≥ ×4 contre gardes et soins, ×3 contre la charge |

Ce qui reste insatisfaisant, à arbitrer :
- En solo, le contrôle franchit parfois **des murs plus hauts que le soutien** (Enclumier ≥ ×4 contre gardes et soins, Rémouleur ×3). Le soutien garde son avantage en groupe, qui n'est pas encore simulé (étape 6).
- Au répertoire 40, le Runiste de contrôle ou de soutien n'est que 3 % plus lent que Fulgurant contre la cible durable.
- **Le groupe compact à ×2 reste un mur** pour presque toutes les voies (seuls Glyphiste et, dans `combat-voies-v1`, Sigillaire à 67 % le franchissent). C'est un réglage de contenu (étape 5), pas de voie.
- Les sorts de voie d'Enclumier et de Rémouleur restent inutilisés : il faudra les revoir un par un, avec Louis, plutôt que de monter leurs chiffres à l'aveugle.

Prochaine étape : choix de Louis sur `combat-voies-v1` (les trois leviers sont indépendants), puis **4, niveau de classe et activité de combat**.

## 7. Questions pour Louis

- ~~Q1 — Ouverture~~ : tranché (§1, point 10).
- ~~Q2 — Nommés à talent fixe~~ : tranché (§1, point 11).
- ~~Q3 à Q6~~ : tranchées (§1, points 12 à 15). Reste à valider la forme précise de la progression solo (point 13), au moment de l'étape 5.
