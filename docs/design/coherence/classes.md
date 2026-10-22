# Les sorts, les armes, et le Traqueur réparé

> **Statut** : vérification de Claude du 22 octobre 2026, à la demande de Louis (« répare le Traqueur ; recheck les sorts et leur cohérence, pas besoin de tout refaire, trouve les soucis ; quelqu'un qui prend sur le papier la pire classe doit quand même réussir, avec du temps et du theorycraft »). **Rien n'est adopté** : les changements vivent dans `sim/proposals/coherence-v2/` (`combat.yaml`, `gear.yaml`), `data/` est inchangé. Rapports : [`armes.md`](../../../sim/reports/combat/coherence-v2/armes.md), [`build.md`](../../../sim/reports/combat/coherence-v2/build.md), [`situation.md`](../../../sim/reports/combat/coherence-v2/situation.md).

## En bref

- **Le retard du Traqueur avait trois causes**, toutes mesurées : ses **sorts de voie** (à statistiques égales, le Tue-Bête allait 17 % moins vite que le Trempe-Rouge), un **trou dans sa trousse** (aucune purification avant le niveau 85, aucune dissipation : d'où l'érosion), et **les armes**, qui ne valent pas toutes la même chose.
- **Réparé** : purification au niveau 20 et dissipation au niveau 55 (comme les autres classes), sorts et passifs du Tue-Bête et du Piégeur relevés, et une force à lui, **l'affût** (il vise les interstices quand l'ennemi se protège).
- **Les armes** : les Dagues du Chat maigre n'avaient aucune Puissance (−23 %) ; le Marteau, le Bâton et l'Arbalète valaient 5 à 6 % de plus que les autres. Règle proposée : **chaque arme garde son caractère, sa Puissance s'ajuste** pour que toutes se valent.
- **Le reste des sorts est cohérent**, avec trois remarques (§1).

## 1. Ce que j'ai vérifié dans les sorts

J'ai relu les 66 sorts et mesuré chaque voie **avec les mêmes statistiques** (celles du banc : Puissance 100, PV 2 800), pour que seuls les sorts et la mécanique de classe comptent. Temps moyen de victoire et mur, sur 24 rencontres (zones, profils, gardiens) :

| Voie | Rôle | Avant : temps | Avant : mur | Après : temps | Après : mur |
|---|---|---|---|---|---|
| Trempe-Rouge (Forgefeu) | dégâts | 45,1 s | 1,44 | — | — |
| Fulgurant (Runiste) | dégâts | 46,7 s | 1,57 | — | — |
| **Tue-Bête (Traqueur)** | dégâts | **52,6 s** | **1,32** | **44,6 s** | **1,45** |
| Enclumier (Forgefeu) | contrôle | 54,9 s | 1,51 | — | — |
| Sigillaire (Runiste) | contrôle | 53,9 s | 1,52 | — | — |
| **Piégeur (Traqueur)** | contrôle | **58,2 s** | **1,40** | **52,5 s** | **1,54** |
| Rémouleur (Forgefeu) | soutien | 59,9 s | 1,48 | — | — |
| Glyphiste (Runiste) | soutien | 53,6 s | 1,61 | — | — |
| **Meneur de meute (Traqueur)** | soutien | 60,5 s | 1,56 | 56,9 s | 1,67 |

(« Après » : seules les voies du Traqueur changent.)

**Les problèmes trouvés :**

1. **Le Tue-Bête et le Piégeur étaient en dessous de leur rôle.** Un DPS doit aller plus vite que les autres (décision de Louis), et le Tue-Bête était plus lent que deux voies de contrôle. Ses sorts de voie frappaient moins fort que ceux du Trempe-Rouge, qui a en plus ses Braises.
2. **Le Traqueur n'avait pas les outils de base des autres classes.** Le Forgefeu purifie au niveau 20 (*Refroidissement*), le Runiste aussi (*Sceau de répit*) ; le Traqueur seulement au niveau 85 (*Rappel au couvert*). Et il n'avait **aucune dissipation** (les autres : *Décrassage*, *Cercle révélateur*). C'est exactement pourquoi l'érosion l'écrasait : rien ne la retirait.
3. **Un sort de haut niveau plus faible qu'un sort de niveau 1** : *Regard fixe* (niveau 55) faisait moins de dégâts par seconde que *Trait de poursuite* (niveau 1), sans rien d'autre qu'une marque. Il gagne la dissipation : il devient l'outil contre les gardes.

**Les remarques, sans urgence :**

- **Les trois voies de contrôle ont des sorts de voie identiques** d'une classe à l'autre (un étourdissement à 1,0 P et 35 de Pression, un ralentissement à 25 %, une grosse Pression à 45) ; pareil pour les soutiens. Ce n'est pas un déséquilibre, c'est un manque de caractère : la classe ne se distingue que par sa mécanique. À retravailler un jour, sans urgence.
- **Le Rémouleur est le soutien le plus faible** (59,9 s, mur 1,48). Il reste dans la fourchette, je n'y touche pas ici.
- **Les ultimes ont le même budget** (cooldown 60 s, environ 3 P sur 3 cibles, une protection) : cohérent.

## 2. Ce que je change pour le Traqueur

| Quoi | Avant | Après | Pourquoi |
|---|---|---|---|
| *Repli couvert* (niveau 20) | bouclier 0,8 | bouclier 0,8 **et purification** | comme les deux autres classes au niveau 20 |
| *Regard fixe* (niveau 55) | 1,65 P, marque | 1,65 P, marque, **dissipe une garde** | le Traqueur trouve la faille ; un sort de niveau 55 qui sert enfin |
| *Tir à la couture* (Tue-Bête, 30) | 1,75 P | 2,05 P | le DPS doit être un DPS |
| *Pas de côté* (Tue-Bête, 70) | 1,9 P | 2,2 P | idem |
| *La morsure après le trait* (passif du Tue-Bête) | saignement 0,65 P | 0,9 P | idem |
| *Flèches de gêne* (Piégeur, 50) | 1,1 P | 1,3 P | le contrôle le plus faible remonte au niveau des autres |
| *Contrepiège* (passif du Piégeur) | 0,35 P | 0,55 P | idem |
| **L'affût** (toute la classe, nouveau) | — | quand l'ennemi se protège (fenêtre fermée), le Traqueur perd **35 % de moins** de la réduction (d'abord la moitié : trop fort, §4) | sa force à lui : la patience du chasseur |

**L'affût** répond à ta question : « donner au Traqueur un endroit où il est meilleur ». Les régions à fenêtres (les Abords du bourg, les Archives englouties) sont aussi celles de l'érosion : le Traqueur y porte une réponse à l'érosion, et y garde quand même l'avantage grâce à l'affût. Faible d'un côté, fort de l'autre, dans la même région. Un autre build passe toujours ces zones, mais le Traqueur y est le mieux placé.

## 3. Les armes à valeur égale

Le catalogue d'objets donne à chaque arme des statistiques secondaires (Cadence, Critique, Défense, Vitalité), mais elles ne valent pas la même chose une fois converties en combat : un point de Critique vaut environ sept fois moins qu'un point de Puissance, un point de Vitalité presque autant. Résultat (kit témoin palier 20 Rare, l'arme changée seule) :

| Arme | Aujourd'hui | Écart à l'arme médiane | Proposé |
|---|---|---|---|
| Cogne-tout (marteau, Forgefeu) | Puissance 231, Cadence 103 | +4,0 % | Puissance 187, Cadence 103 |
| Épée du Mur de fer (Forgefeu) | Puissance 154, Défense 137 | 0 % | inchangée |
| Fend-crâne (hache, Forgefeu) | Puissance 188, Cadence 171 | +1,0 % | Puissance 178, Cadence 171 |
| Arc de la Haie vive (Traqueur) | Puissance 188, Critique 171 | −2,8 % | Puissance 220, Critique 171 |
| Claque-neuf (arbalète, Traqueur) | Puissance 231, Cadence 86 | +2,6 % | Puissance 202, Cadence 86 |
| **Dagues du Chat maigre (Traqueur)** | Cadence 223, Critique 154, **aucune Puissance** | **−20,0 %** | Puissance 176, Cadence 223, Critique 154 |
| Bâton de l'Encrier (Runiste) | Puissance 223, Vitalité 86 | +3,1 % | Puissance 189, Vitalité 86 |
| Sceptre fêlé (Runiste) | Cadence 188, Puissance 154 | −5,7 % | Puissance 216, Cadence 188 |
| Grimoire des marges (Runiste) | Vitalité 154, Puissance 137 | −1,0 % | Puissance 146, Vitalité 154 |

(Valeurs du palier 20 Rare, dans le catalogue des dix paliers : `../contenu/butin-et-recettes.md` §1.3. Les écarts ont un peu bougé depuis la première version de ce tableau, parce que les bijoux du nouveau catalogue existent aussi en offensif.)

**La règle** : chaque arme garde ses statistiques secondaires (c'est sa couleur : une arme rapide, une arme qui critique, une arme qui protège) ; **sa Puissance s'ajuste** pour que toutes se valent. Les paliers et raretés gardent la courbe du catalogue, et la règle s'applique à chacun des dix paliers. Choisir son arme devient un goût et un style (vite, critique, solide), plus jamais un piège. Reproduire : `pnpm --filter @bramo/sim sim combat-weapons --write`.

## 4. Dans les vraies zones, avec le vrai équipement

Tout le banc refait (équipement réel du **catalogue des dix paliers**, armes égalisées, talents, plans recalculés), 12 zones et 6 gardiens. Ce qui a changé pour le Traqueur :

**En vitesse**, il n'est plus derrière : le Tue-Bête est dans le peloton de tête presque partout, et **dans les zones à fenêtres, les trois voies du Traqueur sont les trois plus rapides**. Les temps absolus changent aussi parce que les armes ont été égalisées :

| Zone | Avant (Tue-Bête / meilleure voie) | Après |
|---|---|---|
| La Chaussée des lanternes (fenêtres) | 60 s, 6ᵉ (le Trempe-Rouge : 51 s) | **37 s, 1er** (avec le Piégeur) ; Meneur 39 s ; le Trempe-Rouge 51 s |
| La Salle des échos (fenêtres) | 65 s, 8ᵉ | **31 s, 1er** ; Piégeur 32 s, Meneur 35 s ; le Trempe-Rouge 51 s |
| Cible durable (profil du banc) | 32 s, 7ᵉ | 29 s, 5ᵉ (les cinq premiers tiennent en 2 s) |
| La Cour des trois coups | 39 s, 8ᵉ | 31 s, 1er (avec le Trempe-Rouge) |

**Face à l'érosion**, la réponse n'est plus obligatoire : ce que l'ensemble anti-érosion rapporte au Traqueur (en paliers) est revenu au niveau des autres classes.

| Rencontre | Tue-Bête avant → après | Piégeur avant → après | Les autres classes |
|---|---|---|---|
| Les Fossés gris | 4,0 → 0,9 | 4,3 → 1,2 | 0,9 à 1,8 |
| Mère Grise | 4,0 → 0,6 | 4,6 → 0,9 | 0,3 à 0,9 |
| Le Notaire des marées | 4,3 → 1,5 | 4,3 → 2,4 | 0,6 à 1,5 |

**Au mur**, le Tue-Bête reste la voie la moins solide (dernière en mur dans 8 rencontres sur 18) : c'est un DPS à distance, il tient moins que les autres ; mais l'écart est d'environ deux à trois paliers, plus de quatre.

**Ce qui est maintenant trop fort** : avec le catalogue des dix paliers, l'arc du Traqueur a gagné de la Puissance (la règle des armes l'a remonté) et **l'affût va trop loin** : −30 à −40 % de temps dans les deux zones à fenêtres. Et le **Meneur de meute en build Ferveur** est devenu à la fois rapide (+33 %) et le plus solide de tous (2,3 paliers ; 3,1 de mur dans la Salle des échos, contre 2,2 pour les autres). **Corrigé dans la proposition, pas encore mesuré** (Louis a demandé de ne pas relancer le banc tout de suite) : l'affût passe de 0,5 à 0,35, et la Main tendue (la gemme qui remplit la Ferveur) donne 2 Ferveur par soin ou bouclier au lieu de 3, et 1 par attaque de base toutes les 10 s au lieu de 6. Les chiffres ci-dessus sont ceux d'avant ces deux réglages. Le **Fulgurant** reste le plus faible dans les zones à fenêtres.

## 5. « La pire classe doit quand même réussir »

Ta règle, traduite en trois vérifications mesurables, sur les 18 rencontres (12 zones, 6 gardiens) :

| Vérification | Résultat |
|---|---|
| **Avec du temps** : chaque voie, **sans aucun talent ni ligne**, gagne chaque rencontre à son palier (mur du témoin ≥ 1) | **Oui, partout** (le pire : 1,06, le Contremaître rouge) |
| **Avec du theorycraft** : la voie la plus faible de la rencontre, avec son meilleur build et sa meilleure réponse, passe au moins aussi haut qu'une voie médiane avec son simple build de farm | **13 rencontres sur 18** ; dans les 5 autres, il lui manque au plus 0,9 palier |
| **Personne n'est loin** : écart entre la meilleure et la pire voie au mur, build de farm | 0,3 à 3,7 paliers dans 14 rencontres ; **4,6 à 5,5** dans les quatre rencontres à fenêtres (les deux zones, Mère Grise, le Notaire : l'affût du Traqueur, le Meneur en Ferveur, la faiblesse du Fulgurant) |

Autrement dit : **avec le temps, tout le monde passe tout** ; avec du theorycraft, la voie la plus mal placée rattrape une voie moyenne dans presque toutes les rencontres ; et l'écart vient de ce qu'une zone favorise une classe, jamais d'une classe faible partout. Les zones à fenêtres sont l'exception : l'écart y est trop grand depuis le catalogue des dix paliers, d'où les deux réglages du §4.
