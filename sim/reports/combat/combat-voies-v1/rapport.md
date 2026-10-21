# Banc de combat sur le moteur réel : proposition `combat-voies-v1`

> Généré par `pnpm --filter @bramo/sim sim combat --proposal combat-voies-v1`. Ne pas modifier à la main.

**38880 combats** en 16,5 s (12 graines par cas). Empreintes : données `11645f960a12d574`, moteur `20ec0cd7cb11587f`, banc `e16d2d2d938a8e7a`.

**Portée.** Kit de classe seul : sorts, mécanique de classe et passif de voie. Statistiques normalisées du dossier (P = 100, 2 800 PV, 25 % de réduction, 20 % de critique, 12 % de Cadence) : **pas encore d'équipement, d'ensembles, de gemmes ni de nommés**, ni de résistances élémentaires (reportées). Les répertoires 40 et 80 changent les sorts accessibles, pas les statistiques. Rencontres isolées, solo. Les fichiers `combats.json` (un combat par ligne) et `resume.json` (une ligne par cas) gardent tout, échecs compris.

**Lecture.** Dans chaque cellule « temps · PV », le temps est la médiane des **victoires** et les PV la médiane de **tous les combats de la même ligne** (même plan, même profil, mêmes graines). Quand une cellule retient « le meilleur plan de la voie », le PV affiché est celui **de ce plan-là**, pas une moyenne d'autres plans.

## 0. Avant / après (répertoire 80, ouverture « sequence »)

« Avant » = `data/`, « après » = la proposition, mêmes graines. Temps · PV du **meilleur plan de la voie** pour ce profil (PV du même plan) ; entre parenthèses, l'écart au meilleur plan de dégâts de la classe.

| Voie | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
|---|---|---|---|---|---|---|
| Trempe-Rouge | 44,0 s · 60 % → **35,5 s · 65 %** | 61,9 s · 41 % → **57,3 s · 44 %** | 45,8 s · 57 % → **36,9 s · 60 %** | 50,3 s · 52 % → **39,5 s · 58 %** | 50,3 s · 66 % → **39,5 s · 72 %** | 46,3 s · 69 % → **37,3 s · 74 %** |
| Enclumier | 49,5 s (+13 %) · 72 % → **39,5 s (+11 %) · 67 %** | 83,3 s (+35 %) · 40 % → **62,5 s (+9 %) · 42 %** | 51,0 s (+11 %) · 63 % → **42,8 s (+16 %) · 63 %** | 58,1 s (+16 %) · 57 % → **46,8 s (+18 %) · 57 %** | 61,8 s (+23 %) · 75 % → **46,8 s (+18 %) · 73 %** | 56,3 s (+22 %) · 77 % → **43,4 s (+16 %) · 75 %** |
| Rémouleur | 50,8 s (+15 %) · 65 % → **42,8 s (+20 %) · 65 %** | 78,3 s (+26 %) · 50 % → **67,3 s (+17 %) · 48 %** | 53,3 s (+16 %) · 56 % → **44,8 s (+21 %) · 63 %** | 58,5 s (+16 %) · 61 % → **48,0 s (+22 %) · 60 %** | 61,3 s (+22 %) · 77 % → **48,5 s (+23 %) · 75 %** | 55,3 s (+19 %) · 77 % → **45,8 s (+23 %) · 75 %** |
| Tue-Bête | 48,3 s · 52 % → **39,3 s · 60 %** | 71,0 s · 32 % → **60,0 s · 38 %** | 49,3 s · 43 % → **41,0 s · 56 %** | 55,6 s · 43 % → **44,6 s · 52 %** | 57,1 s · 59 % → **44,6 s · 66 %** | 52,0 s · 62 % → **41,1 s · 69 %** |
| Piégeur | 50,8 s (+5 %) · 61 % → **38,9 s (-1 %) · 67 %** | 78,3 s (+10 %) · 31 % → **69,3 s (+15 %) · 39 %** | 54,3 s (+10 %) · 53 % → **43,5 s (+6 %) · 63 %** | 61,3 s (+10 %) · 46 % → **47,3 s (+6 %) · 56 %** | 64,3 s (+12 %) · 65 % → **47,3 s (+6 %) · 69 %** | 56,5 s (+9 %) · 68 % → **44,5 s (+8 %) · 72 %** |
| Meneur de meute | 55,3 s (+15 %) · 73 % → **42,8 s (+9 %) · 73 %** | 82,8 s (+17 %) · 59 % → **69,5 s (+16 %) · 59 %** | 59,3 s (+20 %) · 63 % → **45,3 s (+10 %) · 72 %** | 64,0 s (+15 %) · 65 % → **51,0 s (+14 %) · 67 %** | 67,3 s (+18 %) · 85 % → **51,0 s (+14 %) · 82 %** | 61,8 s (+19 %) · 85 % → **46,5 s (+13 %) · 84 %** |
| Fulgurant | 47,3 s · 74 % → **34,5 s · 68 %** | 66,9 s · 61 % → **57,5 s · 44 %** | 49,5 s · 61 % → **37,3 s · 60 %** | 56,0 s · 66 % → **40,8 s · 60 %** | 59,1 s · 81 % → **40,8 s · 72 %** | 52,8 s · 82 % → **37,5 s · 74 %** |
| Sigillaire | 53,8 s (+14 %) · 62 % → **38,0 s (+10 %) · 69 %** | 79,3 s (+19 %) · 35 % → **62,0 s (+8 %) · 51 %** | 55,3 s (+12 %) · 52 % → **39,8 s (+7 %) · 63 %** | 61,8 s (+10 %) · 49 % → **46,3 s (+13 %) · 60 %** | 64,3 s (+9 %) · 68 % → **46,3 s (+13 %) · 72 %** | 57,0 s (+8 %) · 71 % → **41,3 s (+10 %) · 75 %** |
| Glyphiste | 47,3 s (+0 %) · 83 % → **38,5 s (+12 %) · 77 %** | 75,3 s (+13 %) · 73 % → **64,3 s (+12 %) · 59 %** | 51,0 s (+3 %) · 76 % → **41,0 s (+10 %) · 69 %** | 53,8 s (-4 %) · 82 % → **45,8 s (+12 %) · 71 %** | 53,8 s (-9 %) · 97 % → **45,8 s (+12 %) · 83 %** | 51,3 s (-3 %) · 97 % → **42,3 s (+13 %) · 83 %** |

**Danger ×1,5** : meilleur taux de victoire parmi les plans de la voie, avant → après.

| Voie | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
|---|---|---|---|---|---|---|
| Trempe-Rouge | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Enclumier | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Rémouleur | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Tue-Bête | 100 % → **100 %** | 8 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Piégeur | 100 % → **100 %** | 8 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Meneur de meute | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Fulgurant | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Sigillaire | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Glyphiste | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |

**Danger ×2,0** : meilleur taux de victoire parmi les plans de la voie, avant → après.

| Voie | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
|---|---|---|---|---|---|---|
| Trempe-Rouge | 100 % → **100 %** | 0 % → **0 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Enclumier | 100 % → **100 %** | 0 % → **0 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Rémouleur | 100 % → **100 %** | 50 % → **50 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Tue-Bête | 100 % → **100 %** | 0 % → **0 %** | 17 % → **100 %** | 33 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Piégeur | 100 % → **100 %** | 0 % → **0 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Meneur de meute | 100 % → **100 %** | 0 % → **0 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Fulgurant | 100 % → **100 %** | 17 % → **33 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Sigillaire | 100 % → **100 %** | 0 % → **67 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |
| Glyphiste | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** | 100 % → **100 %** |

## 2. Les neuf voies, répertoire 80, danger normal, ouverture « sequence »

Chaque cellule : **meilleur plan de la voie** pour ce profil (temps médian le plus court parmi ses plans qui gagnent tout), puis les PV médians **de ce même plan**.

| Voie | Rôle | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
|---|---|---|---|---|---|---|---|
| cycle de forge · Trempe-Rouge | dégâts | 35,5 s · 65 % | 57,3 s · 44 % | 36,9 s · 60 % | 39,5 s · 58 % | 39,5 s · 72 % | 37,3 s · 74 % |
| cycle de forge · Enclumier | contrôle | 39,5 s · 67 % | 62,5 s · 42 % | 42,8 s · 63 % | 46,8 s · 57 % | 46,8 s · 73 % | 43,4 s · 75 % |
| cycle de forge · Rémouleur | soutien | 42,8 s · 65 % | 67,3 s · 48 % | 44,8 s · 63 % | 48,0 s · 60 % | 48,5 s · 75 % | 45,8 s · 75 % |
| poursuite · Tue-Bête | dégâts | 39,3 s · 60 % | 60,0 s · 38 % | 41,0 s · 56 % | 44,6 s · 52 % | 44,6 s · 66 % | 41,1 s · 69 % |
| poursuite · Piégeur | contrôle | 38,9 s · 67 % | 69,3 s · 39 % | 43,5 s · 63 % | 47,3 s · 56 % | 47,3 s · 69 % | 44,5 s · 72 % |
| poursuite · Meneur de meute | soutien | 42,8 s · 73 % | 69,5 s · 59 % | 45,3 s · 72 % | 51,0 s · 67 % | 51,0 s · 82 % | 46,5 s · 84 % |
| phrase runique · Fulgurant | dégâts | 34,5 s · 68 % | 57,5 s · 44 % | 37,3 s · 60 % | 40,8 s · 60 % | 40,8 s · 72 % | 37,5 s · 74 % |
| phrase runique · Sigillaire | contrôle | 38,0 s · 69 % | 62,0 s · 51 % | 39,8 s · 63 % | 46,3 s · 60 % | 46,3 s · 72 % | 41,3 s · 75 % |
| phrase runique · Glyphiste | soutien | 38,5 s · 77 % | 64,3 s · 59 % | 41,0 s · 69 % | 45,8 s · 71 % | 45,8 s · 83 % | 42,3 s · 83 % |

## 3. Rendement des voies de dégâts

Temps du meilleur plan de contrôle et de soutien **rapporté** au meilleur plan de dégâts de la même classe, profil par profil (+20 % = 20 % plus lent que le DPS). Cible de conception du dossier : soutien 10 à 30 % plus lent à danger normal.

| Classe | Voie | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
|---|---|---|---|---|---|---|---|
| forgefire | Enclumier | +11 % | +9 % | +16 % | +18 % | +18 % | +16 % |
| forgefire | Rémouleur | +20 % | +17 % | +21 % | +22 % | +23 % | +23 % |
| tracker | Piégeur | -1 % | +15 % | +6 % | +6 % | +6 % | +8 % |
| tracker | Meneur de meute | +9 % | +16 % | +10 % | +14 % | +14 % | +13 % |
| runist | Sigillaire | +10 % | +8 % | +7 % | +13 % | +13 % | +10 % |
| runist | Glyphiste | +12 % | +12 % | +10 % | +12 % | +12 % | +13 % |

## 4. Danger ×1,5 (dégâts ennemis), répertoire 80, ouverture « sequence »

Taux de victoire de **chaque plan** (12 graines). Les échecs restent dans `combats.json`.

| Plan | Voie | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
|---|---|---|---|---|---|---|---|
| Braise longue | Trempe-Rouge | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Marteau battant | Trempe-Rouge | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Choc de trempe | Trempe-Rouge | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Percée | Enclumier | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Retour de forge | Enclumier | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Désarmer la charge | Enclumier | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Plaques fidèles | Rémouleur | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Recuire ensemble | Rémouleur | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Garde offensive | Rémouleur | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| La poursuite | Tue-Bête | 100 % | 25 % (9 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Flèches de sang | Tue-Bête | 100 % | 8 % (11 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| La battue | Tue-Bête | 100 % | 8 % (11 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Pièges et cible | Piégeur | 100 % | 8 % (11 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Pas trop vite | Piégeur | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Double détente | Piégeur | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Meute attentive | Meneur de meute | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Compagnon de chasse | Meneur de meute | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Le rebond | Meneur de meute | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Phrase vive | Fulgurant | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Ignition | Fulgurant | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Le coup d’après | Fulgurant | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Froid en ligne | Sigillaire | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Les fractures | Sigillaire | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Sceau patient | Sigillaire | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Garde écrite | Glyphiste | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Soutien offensif | Glyphiste | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Contre-écriture | Glyphiste | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Trempe-Rouge | Trempe-Rouge | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Enclumier | Enclumier | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Rémouleur | Rémouleur | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Tue-Bête | Tue-Bête | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Piégeur | Piégeur | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Meneur de meute | Meneur de meute | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Fulgurant | Fulgurant | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Sigillaire | Sigillaire | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Glyphiste | Glyphiste | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |

## 4. Danger ×2,0 (dégâts ennemis), répertoire 80, ouverture « sequence »

Taux de victoire de **chaque plan** (12 graines). Les échecs restent dans `combats.json`.

| Plan | Voie | Cible durable | Groupe compact | Attaque chargée | Usure régulière | Gardes à dissiper | Soin ennemi |
|---|---|---|---|---|---|---|---|
| Braise longue | Trempe-Rouge | 100 % | 0 % (12 mort (attack)) | 42 % (7 mort (charge)) | 100 % | 100 % | 100 % |
| Marteau battant | Trempe-Rouge | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Choc de trempe | Trempe-Rouge | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Percée | Enclumier | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Retour de forge | Enclumier | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Désarmer la charge | Enclumier | 100 % | 0 % (12 mort (attack)) | 8 % (11 mort (attack)) | 100 % | 100 % | 100 % |
| Plaques fidèles | Rémouleur | 100 % | 50 % (6 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Recuire ensemble | Rémouleur | 100 % | 0 % (12 mort (attack)) | 0 % (12 mort (charge)) | 100 % | 100 % | 100 % |
| Garde offensive | Rémouleur | 100 % | 50 % (6 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| La poursuite | Tue-Bête | 100 % | 0 % (12 mort (attack)) | 25 % (9 mort (charge)) | 75 % (3 mort (attack)) | 100 % | 100 % |
| Flèches de sang | Tue-Bête | 100 % | 0 % (12 mort (attack)) | 33 % (8 mort (charge)) | 58 % (5 mort (attack)) | 100 % | 100 % |
| La battue | Tue-Bête | 25 % (9 mort (attack)) | 0 % (12 mort (attack)) | 0 % (12 mort (charge)) | 0 % (12 mort (attack)) | 100 % | 100 % |
| Pièges et cible | Piégeur | 100 % | 0 % (12 mort (attack)) | 0 % (12 mort (attack)) | 58 % (5 mort (attack)) | 100 % | 100 % |
| Pas trop vite | Piégeur | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Double détente | Piégeur | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Meute attentive | Meneur de meute | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Compagnon de chasse | Meneur de meute | 100 % | 0 % (12 mort (attack)) | 42 % (7 mort (attack)) | 100 % | 100 % | 100 % |
| Le rebond | Meneur de meute | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Phrase vive | Fulgurant | 100 % | 33 % (8 mort (attack)) | 92 % (1 mort (attack)) | 100 % | 100 % | 100 % |
| Ignition | Fulgurant | 100 % | 0 % (12 mort (attack)) | 92 % (1 mort (attack)) | 100 % | 100 % | 100 % |
| Le coup d’après | Fulgurant | 100 % | 25 % (9 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Froid en ligne | Sigillaire | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Les fractures | Sigillaire | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Sceau patient | Sigillaire | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Garde écrite | Glyphiste | 100 % | 67 % (4 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Soutien offensif | Glyphiste | 100 % | 42 % (7 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Contre-écriture | Glyphiste | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Trempe-Rouge | Trempe-Rouge | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Enclumier | Enclumier | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Rémouleur | Rémouleur | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Tue-Bête | Tue-Bête | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Piégeur | Piégeur | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Meneur de meute | Meneur de meute | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Fulgurant | Fulgurant | 100 % | 0 % (12 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Sigillaire | Sigillaire | 100 % | 67 % (4 mort (attack)) | 100 % | 100 % | 100 % | 100 % |
| Plan conseillé Glyphiste | Glyphiste | 100 % | 33 % (8 mort (attack)) | 100 % | 100 % | 100 % | 100 % |

## 5. Règle d'ouverture : « independent » contre « sequence » (répertoire 80, danger normal)

Écart de temps médian de chaque plan (négatif : « independent » plus rapide), moyenne sur les six profils.

| Plan | Voie | Écart moyen | Plus grand écart |
|---|---|---|---|
| Braise longue | Trempe-Rouge | 0,0 % | 0,0 % |
| Marteau battant | Trempe-Rouge | -1,0 % | -2,6 % |
| Choc de trempe | Trempe-Rouge | -5,7 % | -9,0 % |
| Percée | Enclumier | -3,0 % | -5,3 % |
| Retour de forge | Enclumier | -3,1 % | -4,5 % |
| Désarmer la charge | Enclumier | -3,1 % | -4,9 % |
| Plaques fidèles | Rémouleur | -2,3 % | -4,6 % |
| Recuire ensemble | Rémouleur | -1,4 % | -3,8 % |
| Garde offensive | Rémouleur | -2,3 % | -4,6 % |
| La poursuite | Tue-Bête | 2,7 % | 7,3 % |
| Flèches de sang | Tue-Bête | -3,9 % | -4,3 % |
| La battue | Tue-Bête | -0,3 % | -1,2 % |
| Pièges et cible | Piégeur | -1,5 % | -6,3 % |
| Pas trop vite | Piégeur | -2,5 % | -5,5 % |
| Double détente | Piégeur | -3,2 % | -4,3 % |
| Meute attentive | Meneur de meute | -4,7 % | -8,3 % |
| Compagnon de chasse | Meneur de meute | -1,3 % | -3,6 % |
| Le rebond | Meneur de meute | -0,3 % | -1,9 % |
| Phrase vive | Fulgurant | -1,5 % | -4,8 % |
| Ignition | Fulgurant | -1,3 % | -3,6 % |
| Le coup d’après | Fulgurant | -1,6 % | -4,2 % |
| Froid en ligne | Sigillaire | 0,0 % | 0,0 % |
| Les fractures | Sigillaire | 0,0 % | 0,0 % |
| Sceau patient | Sigillaire | 0,0 % | 0,0 % |
| Garde écrite | Glyphiste | 4,0 % | 12,1 % |
| Soutien offensif | Glyphiste | 0,0 % | 0,0 % |
| Contre-écriture | Glyphiste | -1,1 % | -5,4 % |
| Plan conseillé Trempe-Rouge | Trempe-Rouge | 0,0 % | 0,0 % |
| Plan conseillé Enclumier | Enclumier | 0,0 % | 0,0 % |
| Plan conseillé Rémouleur | Rémouleur | 0,0 % | 0,0 % |
| Plan conseillé Tue-Bête | Tue-Bête | 0,0 % | 0,0 % |
| Plan conseillé Piégeur | Piégeur | 0,0 % | 0,0 % |
| Plan conseillé Meneur de meute | Meneur de meute | 0,0 % | 0,0 % |
| Plan conseillé Fulgurant | Fulgurant | 0,0 % | 0,0 % |
| Plan conseillé Sigillaire | Sigillaire | 0,0 % | 0,0 % |
| Plan conseillé Glyphiste | Glyphiste | 0,0 % | 0,0 % |

## 6. Tolérance des horaires (répertoire 80, danger normal, ouverture « sequence »)

Écart de temps médian par rapport au plan réglé, moyenne sur les six profils ; entre parenthèses, les profils qui ne gagnent plus tout. « ±1 s » et « ±2 s » : chaque horaire décalé au hasard (un tirage par graine), ce qui peut changer l'ordre des sorts. « Sans horaire » : tous les sorts à 0 s, dans l'ordre du plan.

| Plan | Chaque sort ±1 s | Chaque sort ±2 s | Sans horaire |
|---|---|---|---|
| Braise longue | +0,3 % | +1,5 % | -2,7 % |
| Marteau battant | -0,3 % | +0,3 % | -3,9 % |
| Choc de trempe | -1,9 % | -3,4 % | +3,7 % |
| Percée | -0,3 % | +0,2 % | -4,2 % |
| Retour de forge | -0,5 % | -0,7 % | -6,1 % |
| Désarmer la charge | +0,4 % | -0,1 % | -4,5 % |
| Plaques fidèles | +0,0 % | -0,3 % | -4,5 % |
| Recuire ensemble | +0,1 % | +0,3 % | -4,8 % |
| Garde offensive | +0,0 % | -0,3 % | -4,5 % |
| La poursuite | -0,4 % | -0,8 % | -1,6 % |
| Flèches de sang | -0,3 % | -0,2 % | -6,0 % |
| La battue | -0,6 % | -0,2 % | -3,1 % |
| Pièges et cible | +0,4 % | -0,2 % | -4,1 % |
| Pas trop vite | -0,7 % | -0,5 % | -2,2 % |
| Double détente | -1,5 % | -1,3 % | +0,3 % |
| Meute attentive | -1,8 % | -1,6 % | -3,1 % |
| Compagnon de chasse | +0,2 % | +0,7 % | -3,6 % |
| Le rebond | +0,7 % | +0,9 % | -2,4 % |
| Phrase vive | -0,1 % | -0,4 % | -2,6 % |
| Ignition | -0,9 % | -0,8 % | -5,4 % |
| Le coup d’après | -0,1 % | +0,5 % | -2,1 % |
| Froid en ligne | -0,5 % | +0,5 % | -4,1 % |
| Les fractures | +0,1 % | +0,5 % | -1,1 % |
| Sceau patient | +1,4 % | +1,6 % | -2,0 % |
| Garde écrite | +2,2 % | +1,7 % | -2,4 % |
| Soutien offensif | +1,3 % | +2,0 % | +2,0 % |
| Contre-écriture | +0,7 % | -0,8 % | -3,9 % |
| Plan conseillé Trempe-Rouge | +1,6 % | +2,0 % | +0,0 % |
| Plan conseillé Enclumier | +0,2 % | +0,3 % | +0,0 % |
| Plan conseillé Rémouleur | +0,5 % | +0,5 % | +0,0 % |
| Plan conseillé Tue-Bête | -0,7 % | -0,7 % | +0,0 % |
| Plan conseillé Piégeur | +1,3 % | +1,5 % | +0,0 % |
| Plan conseillé Meneur de meute | +0,6 % | +1,0 % | +0,0 % |
| Plan conseillé Fulgurant | -0,3 % | -0,3 % | +0,0 % |
| Plan conseillé Sigillaire | +0,2 % | +0,6 % | +0,0 % |
| Plan conseillé Glyphiste | +0,9 % | +0,9 % | +0,0 % |

## 7. Contributions moyennes par combat (répertoire 80, danger normal, ouverture « sequence », tous profils)

Ce que chaque voie apporte au-delà des dégâts : soins réellement rendus, dégâts absorbés par ses boucliers, dégâts évités par ses Affaiblissements, Pression retirée. Base des futures récompenses de groupe et de boss mondial. En solo, les dégâts totaux d'une victoire valent les PV ennemis : on montre donc les dégâts par seconde.

| Voie | Dégâts par seconde | Soins utiles | Absorbé | Atténué | Pression | Ruptures | Dissipations |
|---|---|---|---|---|---|---|---|
| Trempe-Rouge | 107,8 | 0 | 252 | 15 | 18 | 0,0 | 0,0 |
| Enclumier | 90,0 | 0 | 269 | 157 | 261 | 3,4 | 0,0 |
| Rémouleur | 90,3 | 256 | 588 | 33 | 32 | 0,3 | 0,0 |
| Tue-Bête | 98,8 | 53 | 0 | 1 | 23 | 0,1 | 0,0 |
| Piégeur | 89,3 | 61 | 0 | 202 | 244 | 3,3 | 0,0 |
| Meneur de meute | 83,6 | 749 | 430 | 2 | 23 | 0,1 | 0,0 |
| Fulgurant | 100,8 | 128 | 385 | 20 | 58 | 0,3 | 0,0 |
| Sigillaire | 89,4 | 63 | 208 | 145 | 256 | 3,2 | 0,1 |
| Glyphiste | 93,7 | 199 | 805 | 22 | 42 | 0,3 | 0,0 |

## 8. Tous les cas avec au moins un échec

200 cas sur 3240.

| Ouverture | Danger | Niveau | Horaires | Plan | Rencontre | Victoires | Causes | PV ennemis restants (médiane des échecs) |
|---|---|---|---|---|---|---|---|---|
| independent | ×1,5 | 40 | plan | tr_damage_pursuit | pack | 6/12 | 6 mort (attack) | 3 % |
| independent | ×1,5 | 40 | plan | tr_damage_blood | pack | 2/12 | 10 mort (attack) | 7 % |
| independent | ×1,5 | 40 | plan | tr_damage_battue | pack | 1/12 | 11 mort (attack) | 14 % |
| independent | ×1,5 | 40 | plan | tr_control_pack | pack | 0/12 | 12 mort (attack) | 13 % |
| independent | ×1,5 | 40 | plan | tr_control_double | pack | 1/12 | 11 mort (attack) | 14 % |
| independent | ×1,5 | 40 | plan | beastslayer_advised | pack | 11/12 | 1 mort (attack) | 0 % |
| independent | ×1,5 | 80 | plan | fg_control_interval | pack | 4/12 | 8 mort (attack) | 6 % |
| independent | ×1,5 | 80 | plan | tr_damage_pursuit | pack | 4/12 | 8 mort (attack) | 22 % |
| independent | ×1,5 | 80 | plan | tr_damage_blood | pack | 5/12 | 7 mort (attack) | 7 % |
| independent | ×1,5 | 80 | plan | tr_damage_battue | pack | 2/12 | 10 mort (attack) | 11 % |
| independent | ×1,5 | 80 | plan | tr_control_snare | pack | 2/12 | 10 mort (attack) | 7 % |
| independent | ×2,0 | 40 | plan | fg_red_ash | pack | 0/12 | 12 mort (attack) | 35 % |
| independent | ×2,0 | 40 | plan | fg_red_hammer | pack | 0/12 | 12 mort (attack) | 37 % |
| independent | ×2,0 | 40 | plan | fg_red_cycle | pack | 0/12 | 12 mort (attack) | 41 % |
| independent | ×2,0 | 40 | plan | fg_control_crack | pack | 0/12 | 12 mort (attack) | 37 % |
| independent | ×2,0 | 40 | plan | fg_control_ash | pack | 0/12 | 12 mort (attack) | 39 % |
| independent | ×2,0 | 40 | plan | fg_control_interval | pack | 0/12 | 12 mort (attack) | 41 % |
| independent | ×2,0 | 40 | plan | fg_support_plate | pack | 0/12 | 12 mort (attack) | 34 % |
| independent | ×2,0 | 40 | plan | fg_support_reheat | pack | 0/12 | 12 mort (attack) | 32 % |
| independent | ×2,0 | 40 | plan | fg_support_guard | pack | 1/12 | 11 mort (attack) | 14 % |
| independent | ×2,0 | 40 | plan | tr_damage_pursuit | pack | 0/12 | 12 mort (attack) | 42 % |
| independent | ×2,0 | 40 | plan | tr_damage_blood | pack | 0/12 | 12 mort (attack) | 47 % |
| independent | ×2,0 | 40 | plan | tr_damage_blood | charge | 4/12 | 8 mort (charge) | 4 % |
| independent | ×2,0 | 40 | plan | tr_damage_battue | pack | 0/12 | 12 mort (attack) | 45 % |
| independent | ×2,0 | 40 | plan | tr_damage_battue | charge | 11/12 | 1 mort (attack) | 0 % |
| independent | ×2,0 | 40 | plan | tr_damage_battue | attrition | 9/12 | 1 mort (attack), 2 mort (aura) | 3 % |
| independent | ×2,0 | 40 | plan | tr_control_snare | pack | 0/12 | 12 mort (attack) | 40 % |
| independent | ×2,0 | 40 | plan | tr_control_pack | pack | 0/12 | 12 mort (attack) | 52 % |
| independent | ×2,0 | 40 | plan | tr_control_pack | charge | 6/12 | 6 mort (attack) | 2 % |
| independent | ×2,0 | 40 | plan | tr_control_double | pack | 0/12 | 12 mort (attack) | 48 % |
| independent | ×2,0 | 40 | plan | tr_control_double | charge | 2/12 | 5 mort (charge), 5 mort (attack) | 4 % |
| independent | ×2,0 | 40 | plan | tr_support_pack | pack | 0/12 | 12 mort (attack) | 35 % |
| independent | ×2,0 | 40 | plan | tr_support_hunt | pack | 0/12 | 12 mort (attack) | 27 % |
| independent | ×2,0 | 40 | plan | tr_support_rebound | pack | 0/12 | 12 mort (attack) | 27 % |
| independent | ×2,0 | 40 | plan | rn_damage_phrase | pack | 8/12 | 4 mort (attack) | 3 % |
| independent | ×2,0 | 40 | plan | rn_damage_fire | pack | 0/12 | 12 mort (attack) | 34 % |
| independent | ×2,0 | 40 | plan | rn_damage_next | pack | 8/12 | 4 mort (attack) | 3 % |
| independent | ×2,0 | 40 | plan | rn_control_crack | pack | 1/12 | 11 mort (attack) | 23 % |
| independent | ×2,0 | 40 | plan | rn_control_seal | pack | 0/12 | 12 mort (attack) | 29 % |
| independent | ×2,0 | 40 | plan | rn_support_attack | pack | 0/12 | 12 mort (attack) | 22 % |
| independent | ×2,0 | 40 | plan | red_temper_advised | pack | 0/12 | 12 mort (attack) | 27 % |
| independent | ×2,0 | 40 | plan | anvil_advised | pack | 0/12 | 12 mort (attack) | 30 % |
| independent | ×2,0 | 40 | plan | whetter_advised | pack | 0/12 | 12 mort (attack) | 30 % |
| independent | ×2,0 | 40 | plan | beastslayer_advised | pack | 0/12 | 12 mort (attack) | 34 % |
| independent | ×2,0 | 40 | plan | trapper_advised | pack | 0/12 | 12 mort (attack) | 26 % |
| independent | ×2,0 | 40 | plan | packleader_advised | pack | 0/12 | 12 mort (attack) | 25 % |
| independent | ×2,0 | 40 | plan | fulgurant_advised | pack | 2/12 | 10 mort (attack) | 6 % |
| independent | ×2,0 | 40 | plan | glyphkeeper_advised | pack | 6/12 | 6 mort (attack) | 2 % |
| independent | ×2,0 | 80 | plan | fg_red_ash | pack | 0/12 | 12 mort (attack) | 33 % |
| independent | ×2,0 | 80 | plan | fg_red_ash | charge | 5/12 | 7 mort (charge) | 3 % |
| independent | ×2,0 | 80 | plan | fg_red_hammer | pack | 0/12 | 12 mort (attack) | 29 % |
| independent | ×2,0 | 80 | plan | fg_red_cycle | pack | 1/12 | 11 mort (attack) | 18 % |
| independent | ×2,0 | 80 | plan | fg_control_crack | pack | 0/12 | 12 mort (attack) | 37 % |
| independent | ×2,0 | 80 | plan | fg_control_ash | pack | 0/12 | 12 mort (attack) | 34 % |
| independent | ×2,0 | 80 | plan | fg_control_interval | pack | 0/12 | 12 mort (attack) | 53 % |
| independent | ×2,0 | 80 | plan | fg_control_interval | charge | 3/12 | 9 mort (attack) | 3 % |
| independent | ×2,0 | 80 | plan | fg_support_reheat | pack | 0/12 | 12 mort (attack) | 39 % |
| independent | ×2,0 | 80 | plan | fg_support_reheat | charge | 0/12 | 8 mort (charge), 4 mort (attack) | 6 % |
| independent | ×2,0 | 80 | plan | tr_damage_pursuit | pack | 0/12 | 12 mort (attack) | 44 % |
| independent | ×2,0 | 80 | plan | tr_damage_pursuit | charge | 5/12 | 7 mort (charge) | 3 % |
| independent | ×2,0 | 80 | plan | tr_damage_pursuit | attrition | 5/12 | 7 mort (attack) | 2 % |
| independent | ×2,0 | 80 | plan | tr_damage_blood | pack | 0/12 | 12 mort (attack) | 42 % |
| independent | ×2,0 | 80 | plan | tr_damage_blood | charge | 10/12 | 2 mort (charge) | 1 % |
| independent | ×2,0 | 80 | plan | tr_damage_battue | duel | 3/12 | 9 mort (attack) | 2 % |
| independent | ×2,0 | 80 | plan | tr_damage_battue | pack | 0/12 | 12 mort (attack) | 37 % |
| independent | ×2,0 | 80 | plan | tr_damage_battue | charge | 1/12 | 11 mort (charge) | 7 % |
| independent | ×2,0 | 80 | plan | tr_damage_battue | attrition | 1/12 | 11 mort (attack) | 6 % |
| independent | ×2,0 | 80 | plan | tr_control_snare | pack | 0/12 | 12 mort (attack) | 49 % |
| independent | ×2,0 | 80 | plan | tr_control_snare | charge | 1/12 | 11 mort (attack) | 6 % |
| independent | ×2,0 | 80 | plan | tr_control_snare | attrition | 10/12 | 2 mort (attack) | 0 % |
| independent | ×2,0 | 80 | plan | tr_control_pack | pack | 0/12 | 12 mort (attack) | 33 % |
| independent | ×2,0 | 80 | plan | tr_control_double | pack | 0/12 | 12 mort (attack) | 30 % |
| independent | ×2,0 | 80 | plan | tr_support_pack | pack | 10/12 | 2 mort (attack) | 28 % |
| independent | ×2,0 | 80 | plan | tr_support_hunt | pack | 0/12 | 12 mort (attack) | 34 % |
| independent | ×2,0 | 80 | plan | tr_support_hunt | charge | 10/12 | 2 mort (attack) | 1 % |
| independent | ×2,0 | 80 | plan | tr_support_rebound | pack | 0/12 | 12 mort (attack) | 36 % |
| independent | ×2,0 | 80 | plan | rn_damage_phrase | pack | 0/12 | 12 mort (attack) | 24 % |
| independent | ×2,0 | 80 | plan | rn_damage_phrase | charge | 8/12 | 4 mort (attack) | 3 % |
| independent | ×2,0 | 80 | plan | rn_damage_fire | pack | 0/12 | 12 mort (attack) | 24 % |
| independent | ×2,0 | 80 | plan | rn_damage_fire | charge | 11/12 | 1 mort (attack) | 0 % |
| independent | ×2,0 | 80 | plan | rn_damage_next | pack | 1/12 | 11 mort (attack) | 31 % |
| independent | ×2,0 | 80 | plan | rn_control_frost | pack | 0/12 | 12 mort (attack) | 35 % |
| independent | ×2,0 | 80 | plan | rn_control_crack | pack | 0/12 | 12 mort (attack) | 43 % |
| independent | ×2,0 | 80 | plan | rn_control_seal | pack | 0/12 | 12 mort (attack) | 44 % |
| independent | ×2,0 | 80 | plan | rn_support_guard | pack | 3/12 | 9 mort (attack) | 23 % |
| independent | ×2,0 | 80 | plan | rn_support_attack | pack | 5/12 | 7 mort (attack) | 28 % |
| independent | ×2,0 | 80 | plan | red_temper_advised | pack | 0/12 | 12 mort (attack) | 20 % |
| independent | ×2,0 | 80 | plan | anvil_advised | pack | 0/12 | 12 mort (attack) | 30 % |
| independent | ×2,0 | 80 | plan | whetter_advised | pack | 0/12 | 12 mort (attack) | 30 % |
| independent | ×2,0 | 80 | plan | beastslayer_advised | pack | 0/12 | 12 mort (attack) | 36 % |
| independent | ×2,0 | 80 | plan | trapper_advised | pack | 0/12 | 12 mort (attack) | 34 % |
| independent | ×2,0 | 80 | plan | packleader_advised | pack | 0/12 | 12 mort (attack) | 27 % |
| independent | ×2,0 | 80 | plan | fulgurant_advised | pack | 0/12 | 12 mort (attack) | 24 % |
| independent | ×2,0 | 80 | plan | sigilbinder_advised | pack | 8/12 | 4 mort (attack) | 3 % |
| independent | ×2,0 | 80 | plan | glyphkeeper_advised | pack | 4/12 | 8 mort (attack) | 8 % |
| sequence | ×1,5 | 40 | plan | fg_red_cycle | pack | 10/12 | 2 mort (attack) | 1 % |
| sequence | ×1,5 | 40 | plan | fg_control_ash | pack | 9/12 | 3 mort (attack) | 1 % |
| sequence | ×1,5 | 40 | plan | tr_damage_pursuit | pack | 5/12 | 7 mort (attack) | 2 % |
| sequence | ×1,5 | 40 | plan | tr_damage_blood | pack | 3/12 | 9 mort (attack) | 8 % |
| sequence | ×1,5 | 40 | plan | tr_damage_battue | pack | 1/12 | 11 mort (attack) | 23 % |
| sequence | ×1,5 | 40 | plan | tr_control_snare | pack | 11/12 | 1 mort (attack) | 0 % |
| sequence | ×1,5 | 40 | plan | tr_control_pack | pack | 0/12 | 12 mort (attack) | 20 % |
| sequence | ×1,5 | 40 | plan | tr_control_double | pack | 2/12 | 10 mort (attack) | 15 % |
| sequence | ×1,5 | 40 | plan | beastslayer_advised | pack | 11/12 | 1 mort (attack) | 0 % |
| sequence | ×1,5 | 80 | plan | fg_control_interval | pack | 0/12 | 12 mort (attack) | 7 % |
| sequence | ×1,5 | 80 | plan | tr_damage_pursuit | pack | 3/12 | 9 mort (attack) | 17 % |
| sequence | ×1,5 | 80 | plan | tr_damage_blood | pack | 1/12 | 11 mort (attack) | 5 % |
| sequence | ×1,5 | 80 | plan | tr_damage_battue | pack | 1/12 | 11 mort (attack) | 14 % |
| sequence | ×1,5 | 80 | plan | tr_control_snare | pack | 1/12 | 11 mort (attack) | 10 % |
| sequence | ×2,0 | 40 | plan | fg_red_ash | pack | 0/12 | 12 mort (attack) | 37 % |
| sequence | ×2,0 | 40 | plan | fg_red_ash | charge | 4/12 | 8 mort (charge) | 1 % |
| sequence | ×2,0 | 40 | plan | fg_red_hammer | pack | 0/12 | 12 mort (attack) | 40 % |
| sequence | ×2,0 | 40 | plan | fg_red_cycle | pack | 0/12 | 12 mort (attack) | 43 % |
| sequence | ×2,0 | 40 | plan | fg_red_cycle | charge | 11/12 | 1 mort (charge) | 1 % |
| sequence | ×2,0 | 40 | plan | fg_control_crack | pack | 0/12 | 12 mort (attack) | 43 % |
| sequence | ×2,0 | 40 | plan | fg_control_ash | pack | 0/12 | 12 mort (attack) | 41 % |
| sequence | ×2,0 | 40 | plan | fg_control_interval | pack | 0/12 | 12 mort (attack) | 42 % |
| sequence | ×2,0 | 40 | plan | fg_support_plate | pack | 0/12 | 12 mort (attack) | 36 % |
| sequence | ×2,0 | 40 | plan | fg_support_reheat | pack | 0/12 | 12 mort (attack) | 37 % |
| sequence | ×2,0 | 40 | plan | fg_support_guard | pack | 0/12 | 12 mort (attack) | 31 % |
| sequence | ×2,0 | 40 | plan | tr_damage_pursuit | pack | 0/12 | 12 mort (attack) | 42 % |
| sequence | ×2,0 | 40 | plan | tr_damage_pursuit | charge | 7/12 | 5 mort (charge) | 1 % |
| sequence | ×2,0 | 40 | plan | tr_damage_blood | pack | 0/12 | 12 mort (attack) | 47 % |
| sequence | ×2,0 | 40 | plan | tr_damage_blood | charge | 0/12 | 12 mort (charge) | 5 % |
| sequence | ×2,0 | 40 | plan | tr_damage_battue | duel | 11/12 | 1 mort (attack) | 0 % |
| sequence | ×2,0 | 40 | plan | tr_damage_battue | pack | 0/12 | 12 mort (attack) | 46 % |
| sequence | ×2,0 | 40 | plan | tr_damage_battue | charge | 6/12 | 6 mort (attack) | 3 % |
| sequence | ×2,0 | 40 | plan | tr_damage_battue | attrition | 5/12 | 3 mort (attack), 4 mort (aura) | 2 % |
| sequence | ×2,0 | 40 | plan | tr_control_snare | pack | 0/12 | 12 mort (attack) | 47 % |
| sequence | ×2,0 | 40 | plan | tr_control_pack | pack | 0/12 | 12 mort (attack) | 52 % |
| sequence | ×2,0 | 40 | plan | tr_control_double | pack | 0/12 | 12 mort (attack) | 49 % |
| sequence | ×2,0 | 40 | plan | tr_control_double | charge | 6/12 | 6 mort (attack) | 1 % |
| sequence | ×2,0 | 40 | plan | tr_support_pack | pack | 0/12 | 12 mort (attack) | 32 % |
| sequence | ×2,0 | 40 | plan | tr_support_hunt | pack | 2/12 | 10 mort (attack) | 17 % |
| sequence | ×2,0 | 40 | plan | tr_support_rebound | pack | 0/12 | 12 mort (attack) | 25 % |
| sequence | ×2,0 | 40 | plan | rn_damage_phrase | pack | 1/12 | 11 mort (attack) | 8 % |
| sequence | ×2,0 | 40 | plan | rn_damage_fire | pack | 0/12 | 12 mort (attack) | 37 % |
| sequence | ×2,0 | 40 | plan | rn_damage_fire | charge | 3/12 | 9 mort (attack) | 3 % |
| sequence | ×2,0 | 40 | plan | rn_damage_next | pack | 1/12 | 11 mort (attack) | 8 % |
| sequence | ×2,0 | 40 | plan | rn_control_crack | pack | 0/12 | 12 mort (attack) | 29 % |
| sequence | ×2,0 | 40 | plan | rn_control_seal | pack | 0/12 | 12 mort (attack) | 34 % |
| sequence | ×2,0 | 40 | plan | rn_support_attack | pack | 1/12 | 11 mort (attack) | 19 % |
| sequence | ×2,0 | 40 | plan | red_temper_advised | pack | 0/12 | 12 mort (attack) | 27 % |
| sequence | ×2,0 | 40 | plan | anvil_advised | pack | 0/12 | 12 mort (attack) | 30 % |
| sequence | ×2,0 | 40 | plan | whetter_advised | pack | 0/12 | 12 mort (attack) | 30 % |
| sequence | ×2,0 | 40 | plan | beastslayer_advised | pack | 0/12 | 12 mort (attack) | 34 % |
| sequence | ×2,0 | 40 | plan | trapper_advised | pack | 0/12 | 12 mort (attack) | 26 % |
| sequence | ×2,0 | 40 | plan | packleader_advised | pack | 0/12 | 12 mort (attack) | 25 % |
| sequence | ×2,0 | 40 | plan | fulgurant_advised | pack | 2/12 | 10 mort (attack) | 6 % |
| sequence | ×2,0 | 40 | plan | glyphkeeper_advised | pack | 6/12 | 6 mort (attack) | 2 % |
| sequence | ×2,0 | 80 | plan | fg_red_ash | pack | 0/12 | 12 mort (attack) | 33 % |
| sequence | ×2,0 | 80 | plan | fg_red_ash | charge | 5/12 | 7 mort (charge) | 3 % |
| sequence | ×2,0 | 80 | plan | fg_red_hammer | pack | 0/12 | 12 mort (attack) | 30 % |
| sequence | ×2,0 | 80 | plan | fg_red_cycle | pack | 0/12 | 12 mort (attack) | 18 % |
| sequence | ×2,0 | 80 | plan | fg_control_crack | pack | 0/12 | 12 mort (attack) | 39 % |
| sequence | ×2,0 | 80 | plan | fg_control_ash | pack | 0/12 | 12 mort (attack) | 39 % |
| sequence | ×2,0 | 80 | plan | fg_control_interval | pack | 0/12 | 12 mort (attack) | 55 % |
| sequence | ×2,0 | 80 | plan | fg_control_interval | charge | 1/12 | 11 mort (attack) | 4 % |
| sequence | ×2,0 | 80 | plan | fg_support_plate | pack | 6/12 | 6 mort (attack) | 20 % |
| sequence | ×2,0 | 80 | plan | fg_support_reheat | pack | 0/12 | 12 mort (attack) | 41 % |
| sequence | ×2,0 | 80 | plan | fg_support_reheat | charge | 0/12 | 12 mort (charge) | 9 % |
| sequence | ×2,0 | 80 | plan | fg_support_guard | pack | 6/12 | 6 mort (attack) | 20 % |
| sequence | ×2,0 | 80 | plan | tr_damage_pursuit | pack | 0/12 | 12 mort (attack) | 43 % |
| sequence | ×2,0 | 80 | plan | tr_damage_pursuit | charge | 3/12 | 9 mort (charge) | 2 % |
| sequence | ×2,0 | 80 | plan | tr_damage_pursuit | attrition | 9/12 | 3 mort (attack) | 3 % |
| sequence | ×2,0 | 80 | plan | tr_damage_blood | pack | 0/12 | 12 mort (attack) | 44 % |
| sequence | ×2,0 | 80 | plan | tr_damage_blood | charge | 4/12 | 8 mort (charge) | 1 % |
| sequence | ×2,0 | 80 | plan | tr_damage_blood | attrition | 7/12 | 5 mort (attack) | 1 % |
| sequence | ×2,0 | 80 | plan | tr_damage_battue | duel | 3/12 | 9 mort (attack) | 1 % |
| sequence | ×2,0 | 80 | plan | tr_damage_battue | pack | 0/12 | 12 mort (attack) | 42 % |
| sequence | ×2,0 | 80 | plan | tr_damage_battue | charge | 0/12 | 12 mort (charge) | 8 % |
| sequence | ×2,0 | 80 | plan | tr_damage_battue | attrition | 0/12 | 12 mort (attack) | 7 % |
| sequence | ×2,0 | 80 | plan | tr_control_snare | pack | 0/12 | 12 mort (attack) | 50 % |
| sequence | ×2,0 | 80 | plan | tr_control_snare | charge | 0/12 | 12 mort (attack) | 8 % |
| sequence | ×2,0 | 80 | plan | tr_control_snare | attrition | 7/12 | 5 mort (attack) | 1 % |
| sequence | ×2,0 | 80 | plan | tr_control_pack | pack | 0/12 | 12 mort (attack) | 47 % |
| sequence | ×2,0 | 80 | plan | tr_control_double | pack | 0/12 | 12 mort (attack) | 34 % |
| sequence | ×2,0 | 80 | plan | tr_support_pack | pack | 0/12 | 12 mort (attack) | 37 % |
| sequence | ×2,0 | 80 | plan | tr_support_hunt | pack | 0/12 | 12 mort (attack) | 35 % |
| sequence | ×2,0 | 80 | plan | tr_support_hunt | charge | 5/12 | 7 mort (attack) | 3 % |
| sequence | ×2,0 | 80 | plan | tr_support_rebound | pack | 0/12 | 12 mort (attack) | 36 % |
| sequence | ×2,0 | 80 | plan | rn_damage_phrase | pack | 4/12 | 8 mort (attack) | 28 % |
| sequence | ×2,0 | 80 | plan | rn_damage_phrase | charge | 11/12 | 1 mort (attack) | 0 % |
| sequence | ×2,0 | 80 | plan | rn_damage_fire | pack | 0/12 | 12 mort (attack) | 30 % |
| sequence | ×2,0 | 80 | plan | rn_damage_fire | charge | 11/12 | 1 mort (attack) | 1 % |
| sequence | ×2,0 | 80 | plan | rn_damage_next | pack | 3/12 | 9 mort (attack) | 33 % |
| sequence | ×2,0 | 80 | plan | rn_control_frost | pack | 0/12 | 12 mort (attack) | 35 % |
| sequence | ×2,0 | 80 | plan | rn_control_crack | pack | 0/12 | 12 mort (attack) | 43 % |
| sequence | ×2,0 | 80 | plan | rn_control_seal | pack | 0/12 | 12 mort (attack) | 44 % |
| sequence | ×2,0 | 80 | plan | rn_support_guard | pack | 8/12 | 4 mort (attack) | 20 % |
| sequence | ×2,0 | 80 | plan | rn_support_attack | pack | 5/12 | 7 mort (attack) | 28 % |
| sequence | ×2,0 | 80 | plan | red_temper_advised | pack | 0/12 | 12 mort (attack) | 20 % |
| sequence | ×2,0 | 80 | plan | anvil_advised | pack | 0/12 | 12 mort (attack) | 30 % |
| sequence | ×2,0 | 80 | plan | whetter_advised | pack | 0/12 | 12 mort (attack) | 30 % |
| sequence | ×2,0 | 80 | plan | beastslayer_advised | pack | 0/12 | 12 mort (attack) | 36 % |
| sequence | ×2,0 | 80 | plan | trapper_advised | pack | 0/12 | 12 mort (attack) | 34 % |
| sequence | ×2,0 | 80 | plan | packleader_advised | pack | 0/12 | 12 mort (attack) | 27 % |
| sequence | ×2,0 | 80 | plan | fulgurant_advised | pack | 0/12 | 12 mort (attack) | 24 % |
| sequence | ×2,0 | 80 | plan | sigilbinder_advised | pack | 8/12 | 4 mort (attack) | 3 % |
| sequence | ×2,0 | 80 | plan | glyphkeeper_advised | pack | 4/12 | 8 mort (attack) | 8 % |

