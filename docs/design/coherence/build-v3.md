# Le build v3 : des combats courts, des builds qui varient, des minuteurs qui comptent

> **Statut** : analyse et essais du 24 octobre 2026 (soir), à la demande de Louis : « refais une analyse profonde de notre
> système ; je veux éviter les combats un peu longs et boring et vraiment varier les builds ; notre base est bonne, ne change
> pas tout, mais n'hésite pas à ajouter au besoin ; inspire-toi de ce qui existe ; Legend of Mushroom a une limite à 30 s par
> combat, ce qui pousse à utiliser les timers pour faire un max de dégâts sans mourir vite ». Suite de [`rythme.md`](rythme.md).
>
> **Rien n'est adopté : `data/` est inchangé.** Proposition : [`sim/proposals/build-v3/talents_add.yaml`](../../../sim/proposals/build-v3/talents_add.yaml)
> (ajouts au catalogue de talents, quelques retouches, un réglage). Mesures : `sim/src/tempo/bench.ts` (banc des builds) et
> `sim/src/tempo/timers.ts` (les minuteurs), rapports dans `sim/reports/combat/tempo/`. Moteur : la limite de temps par
> rencontre (`encounter.timeLimit`) et les conditions de talent « avant / après N secondes » (`before`, `after`), inactives par
> défaut (205 tests passent, combats existants identiques).

## 1. Ce qu'on garde

La base est bonne, et elle reste : les **huit réserves** (Tisons, Entailles, Frimas, Rancœur, Ferveur, Mesure, Échos, Trophées),
les **34 gemmes**, les **15 ensembles à deux étages**, les **12 objets nommés**, les lignes de build, les gemmes et ensembles de
situation, les mécaniques des trois classes et les neuf voies. Tout ce qui suit **s'ajoute**.

## 2. Le diagnostic, mesuré

Le banc : les **9 voies**, les **12 zones et 6 gardiens** de la route, le témoin (Rare de palier 20, sans talent), un build par
archétype (ses gemmes, ses ensembles, ses lignes), **40 builds tirés au hasard par voie**, le meilleur des plans conseillé et de
groupe, 4 graines. Pour chaque build : vitesse (temps des victoires), victoires, victoires « au mur » (deux paliers plus dur),
défaites au temps.

| | Aujourd'hui | Rythme vif seul | **v3** |
|---|---|---|---|
| Durée d'une zone / d'un gardien (témoin) | 45 s / 46 s | 14 s / 24 s | 13 s / 23 s |
| Archétypes | 8 | 8 | **11** |
| Archétypes à 10 % du meilleur (9 voies) | 56 sur 72 (78 %) | 36 sur 72 (50 %) | **63 sur 99 (64 %)** |
| Archétypes en tête selon la rencontre, par voie | 4,2 | 4,3 | **5,1** |
| Archétypes en tête différents, par rencontre | 4,2 | 4,1 | **4,7** |
| Meilleur build / build au hasard (vitesse) | 1,12 à 1,26 | 1,15 à 1,43 | 1,09 à 1,24 |
| Effet du réglage des minuteurs (§4) | −6 à +7 % | | **−19 à +10 %** |

Ce que ça dit :

1. **Aujourd'hui les combats sont longs (45 s ici, 65 s sur la route) et les minuteurs ne servent à rien** : régler son
   ouverture change le résultat de quelques pour cent au plus, parce que chaque sort part six à neuf fois.
2. **Raccourcir seul appauvrit les builds** : au rythme vif, la moitié des archétypes décroche. Les Entailles prennent la tête
   presque partout chez le Traqueur (l'achèvement sous 40 % arrive vite). La Mesure, la Ferveur et les Trophées, qui se
   construisent sur la durée, n'ont plus le temps. Il fallait **ajouter**, pas seulement raccourcir.
3. **La durée du combat devient un axe de build**, comme dans les MMO : un build pour les combats courts (zones, farm), un build
   pour les longs (gardiens, murs). C'est ce que font les trois archétypes ajoutés.

## 3. Ce qui s'ajoute

### 3.1 La limite de temps (le sablier, à la Legend of Mushroom)

Au-delà de la limite, la rencontre est perdue. Trois réglages mesurés :

| Limite (zone / gardien) | Défaites à son niveau : sans build / avec build | Victoires au mur : sans build / avec build | Défaites au temps au mur (avec build) | Archétypes à 10 % du meilleur |
|---|---|---|---|---|
| 30 s / 45 s | 4 % / 1 % | 66 % / 92 % | 2 % | 63 |
| 25 s / 40 s | 8 % / 1 % | 62 % / 88 % | 5 % | 64 |
| **20 s / 35 s** | 13 % / 6 % | 53 % / 80 % | 13 % | **68** |

**Recommandé : 20 s / 35 s** [discussion avec Louis : « il ne faut pas rendre le jeu trop simple »]. C'est le réglage où les
builds varient le plus et où la limite devient un vrai mur de dégâts (il faut faire assez de dégâts sans mourir trop vite, le
dilemme de Legend of Mushroom). Perdre coûte peu : une défaite crédite la moitié de son temps en XP, sans butin, et après trois
défaites la route recule d'une étape. Comment un joueur bloqué s'en sort : [`debloquer.md`](debloquer.md).

À l'écran : un **sablier** au-dessus de la scène qui se vide, rouge dans les 5 dernières secondes ; dans le journal, une défaite
« au temps » est dite comme telle (« il vous a manqué 8 % de ses PV »).

### 3.2 Trois archétypes de plus

Chacun a quatre gemmes et un ensemble (textes complets dans la proposition). Les seuils de temps sont pensés pour des combats de
10 à 25 s.

**L'Ouverture : tout donner dans les premières secondes.** C'est l'archétype des minuteurs : on place ses grosses compétences au
début, on aligne la vulnérabilité.

| Gemme | Effet |
|---|---|
| Le Coup d'envoi | pendant les 4 premières secondes, compétences +12 % |
| La Mèche courte | une compétence de 12 s de recharge ou plus lancée dans les 3 premières secondes frappe une seconde fois (0,45 P) |
| Le Premier Sang | ta première action marque la cible et la rend vulnérable (+5 %, 6 s) |
| Le Pare-balles | au début du combat, un bouclier de 0,6 P pendant 6 s |
| *Ensemble* La Mèche et le Briquet | 2 : compétences des 4 premières secondes +6 % · 3 : première action, vulnérabilité +4 % · 4 : Battue |

**L'Endurance : monter en puissance quand le combat dure.** L'archétype des gardiens.

| Gemme | Effet |
|---|---|
| Le Second Souffle | passé 10 s, attaques de base et compétences +20 % |
| La Longue Haleine | passé 5 s, toutes les 3 s : une Mesure et une Ferveur (une passerelle vers deux réserves) |
| L'Usure | passé 12 s, une compétence de 12 s ou plus frappe une seconde fois (0,75 P) |
| La Peau dure | passé 8 s, soin de 0,08 P toutes les 3 s |
| *Ensemble* Le Souffle long | 2 : passé 10 s, +8 % · 3 : passé 8 s, soin de 0,05 P toutes les 3 s · 4 : Reprise |

**La Cadence : la vitesse d'attaque.** Plus d'actions, donc plus de déclenchements (Mesure, Entailles, Tisons).

| Gemme | Effet |
|---|---|
| La Trotteuse | chaque attaque de base raccourcit de 0,15 s la recharge de tes compétences |
| Le Coup double | une attaque de base sur quatre frappe deux fois (0,3 P) |
| L'Aiguille | Cadence comptée 10 % de plus, attaques de base +5 % |
| Le Pas de course | une attaque de base sur quatre : une Mesure et une Entaille |
| *Ensemble* Les Aiguilles du beffroi | 2 : Cadence +10 % · 3 : chaque attaque de base raccourcit les recharges de 0,1 s · 4 : Interstice |

Et un réglage : **le plafond de la Cadence passe de 23 % à 50 %** (sans lui, l'archétype n'existe pas). Essayé aussi : la Cadence
qui raccourcit le délai d'une seconde entre deux compétences (`gcdHaste`, [`rythme.md`](rythme.md) §2.4) : avec le plafond relevé,
la Cadence prenait la tête des trois voies du Forgefeu et gonflait les Échos. **Écarté.**

### 3.3 Quatre retouches pour le combat court

- **La Main tendue** (Ferveur) : une Ferveur par attaque de base toutes les 5 s (au lieu de 10).
- **La Grâce oblique** (Ferveur) : se libère à 4 Ferveur (au lieu de 6), 0,30 P par Ferveur, délai 6 s.
- **L'Auréole de travers** (Ferveur) : toutes les 8 s (au lieu de 12), 0,06 P par Ferveur.
- **Le Grand Accord** (Mesure) : une compétence de 12 s ou plus (au lieu de 16), à 4 Mesures (au lieu de 5).
- **Le Coup de grâce** (Entailles) : 0,15 P par Entaille (au lieu de 0,19) ; elles menaient partout en combat court.

Avec le rythme vif ([`rythme.md`](rythme.md) §2.2 : ennemis plus fréquents et moins forts, recharges et délais des talents × 0,7).

## 4. Les minuteurs comptent enfin

Même build, même répertoire de sorts, deux ouvertures : le plan conseillé (les sorts courts d'abord) et **les grosses compétences
d'abord** (minuteurs 0, 1, 2… s). Différence de vitesse :

| | Aujourd'hui | v3 |
|---|---|---|
| Écart entre les deux ouvertures | −6 % à +7 % | **−19 % à +10 %** |

Et surtout, **la bonne ouverture dépend du build** : l'Ouverture et le Piégeur gagnent à tout lancer d'abord contre un gardien
(+6 à +8 %), la Trempe-Rouge en Tisons aussi en zone (+10 %), alors qu'un Sigillaire ou un Fulgurant en Entailles perd 18 à
19 % avec la même ouverture (il lui faut d'abord préparer). Mesuré juste avant la dernière retouche des Entailles. Il n'y a pas un bon réglage pour tous : il faut chercher le sien.
C'est la boucle de Legend of Mushroom, et le **mannequin** ([`rythme.md`](rythme.md) §4) est l'outil pour la faire.

## 5. Ce que vaut chaque archétype (v3)

Vitesse contre le témoin, moyenne des 9 voies :

| Archétype | Zones | Gardiens | Son terrain |
|---|---|---|---|
| Trophées | +29 % | +21 % | les zones à renforts (en tête de l'Atelier pour les 9 voies) |
| Entailles | +27 % | +25 % | partout, surtout le Traqueur |
| Échos | +25 % | +23 % | le Runiste (Fulgurant, Glyphiste) |
| Tisons | +22 % | +25 % | le Forgefeu, les gardiens |
| Rancœur | +22 % | +24 % | les murs (le meilleur au mur pour 4 voies) |
| Cadence | +22 % | +21 % | le Forgefeu (Trempe-Rouge, Rémouleur), les zones |
| **Ouverture** | **+23 %** | +16 % | **les zones** (combats courts) |
| Frimas | +19 % | +23 % | l'Enclumier, le Sigillaire, les murs |
| **Endurance** | +17 % | **+28 %** | **les gardiens** (en tête contre Mère Grise pour 4 voies, le Notaire pour 3) |
| Mesure | +17 % | +18 % | en complément (passerelle) |
| Ferveur | +10 % | +12 % | le mur et le groupe (soins et boucliers, peu de dégâts : voulu) |

**Rien n'est inutile** : les onze archétypes figurent parmi les meilleurs builds d'au moins une voie, et chacun a son terrain.

## 6. Ce qui reste

- **Le Glyphiste** dépend encore beaucoup des Échos (en tête dans 13 rencontres sur 18) ; le Meneur de meute des Entailles.
- **Plus d'enchaînements dans les kits** (un sort qui prépare le suivant, affiché dans la Préparation) rendraient les minuteurs
  encore plus importants pour tous les builds, pas seulement l'Ouverture.
- **La « Puissance de combat »** (le gros nombre des idle asiatiques, Legend of Mushroom en tête) : un seul chiffre pour son
  build, sur sa fiche et son profil, calculé par un vrai combat contre le mannequin (il compte donc les synergies, pas seulement
  les statistiques). Proposé, pas fait.
- **Avant d'adopter** : rejouer tout le banc sur le contenu adopté (murs de la route `wall.ts`, réponses de situation, simulation
  de serveur sur 60 jours, butin et XP à l'heure avec le repos raccourci), écrire les objets des nouvelles gemmes et des trois
  ensembles (Joaillerie, butin), leurs icônes et leurs noms définitifs.

## 7. À trancher par Louis

1. **La limite de temps** : 20 s en zone et 35 s contre un gardien (recommandé), 25 s / 40 s, ou 30 s / 45 s ?
2. **Les trois archétypes** (Ouverture, Endurance, Cadence) et leurs noms : d'accord ?
3. **Le plafond de la Cadence à 50 %** : oui ?
4. **On adopte** le rythme vif et la v3 dans le jeu (après le banc complet), ou tu veux d'abord les voir en jeu sur une pile d'essai ?
