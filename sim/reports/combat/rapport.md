# Banc de combat sur le moteur réel

> Généré par `pnpm --filter @bramo/sim sim combat`. Ne pas modifier à la main.

**38880 combats** en 10,4 s (12 graines par cas). Empreintes : données `173742c3dae17649`, moteur `20ec0cd7cb11587f`, banc `3e3f57f19207c75b`.

**Portée.** Kit de classe seul : sorts, mécanique de classe et passif de voie. Statistiques normalisées du dossier (P = 100, 2 800 PV, 25 % de réduction, 20 % de critique, 12 % de Cadence) : **pas encore d'équipement, d'ensembles, de gemmes ni de nommés**, ni de résistances élémentaires (reportées). Les répertoires 40 et 80 changent les sorts accessibles, pas les statistiques. Rencontres isolées, solo. Les fichiers `combats.json` (un combat par ligne) et `resume.json` (une ligne par cas) gardent tout, échecs compris.

**Lecture.** Dans chaque cellule « temps · PV », le temps est la médiane des **victoires** et les PV la médiane de **tous les combats de la même ligne** (même plan, même profil, mêmes graines). Quand une cellule retient « le meilleur plan de la voie », le PV affiché est celui **de ce plan-là**, pas une moyenne d'autres plans.

## 1. Moteur réel et banc du dossier (kit seul, ouverture « séquence », règles du dossier v0.2)

Le banc Python a joué les mêmes plans en kit seul avec la règle d'ouverture « séquence » et les chiffres du dossier v0.2 ; le moteur les rejoue avec ces mêmes chiffres (`sim/reference/dossier-v0.2-combat.yaml`), pas avec l'équilibrage actuel de `data/`. Les tirages ne sont pas les mêmes (générateurs différents) : on attend des écarts de quelques pour cent, pas une égalité.

| Niveau | Plan | Rencontre | Banc : temps · PV | Moteur : temps · PV | Écart de temps |
|---|---|---|---|---|---|
| 40 | fg_red_ash | duel | 48,00 s · 58 % | 48,50 s · 59 % | +1,0 % |
| 40 | fg_red_ash | pack | 72,75 s · 39 % | 72,75 s · 40 % | 0,0 % |
| 40 | fg_red_ash | charge | 49,25 s · 50 % | 49,25 s · 49 % | 0,0 % |
| 40 | fg_red_ash | attrition | 53,25 s · 53 % | 53,13 s · 53 % | -0,2 % |
| 40 | fg_red_ash | ward | 53,25 s · 69 % | 53,13 s · 69 % | -0,2 % |
| 40 | fg_red_ash | recovery | 51,25 s · 68 % | 51,63 s · 68 % | +0,7 % |
| 40 | fg_control_crack | duel | 47,88 s · 66 % | 48,50 s · 65 % | +1,3 % |
| 40 | fg_control_crack | pack | 77,50 s · 43 % | 77,50 s · 43 % | 0,0 % |
| 40 | fg_control_crack | charge | 49,25 s · 53 % | 50,13 s · 53 % | +1,8 % |
| 40 | fg_control_crack | attrition | 53,25 s · 60 % | 54,25 s · 60 % | +1,9 % |
| 40 | fg_control_crack | ward | 53,25 s · 76 % | 55,38 s · 76 % | +4,0 % |
| 40 | fg_control_crack | recovery | 51,63 s · 76 % | 52,00 s · 76 % | +0,7 % |
| 40 | fg_support_plate | duel | 51,25 s · 79 % | 51,25 s · 79 % | 0,0 % |
| 40 | fg_support_plate | pack | 82,25 s · 67 % | 82,75 s · 67 % | +0,6 % |
| 40 | fg_support_plate | charge | 52,75 s · 72 % | 52,75 s · 72 % | 0,0 % |
| 40 | fg_support_plate | attrition | 57,75 s · 79 % | 57,75 s · 80 % | 0,0 % |
| 40 | fg_support_plate | ward | 63,25 s · 89 % | 63,25 s · 89 % | 0,0 % |
| 40 | fg_support_plate | recovery | 56,25 s · 89 % | 56,25 s · 89 % | 0,0 % |
| 40 | tr_damage_pursuit | duel | 47,00 s · 59 % | 47,38 s · 59 % | +0,8 % |
| 40 | tr_damage_pursuit | pack | 75,25 s · 34 % | 75,38 s · 33 % | +0,2 % |
| 40 | tr_damage_pursuit | charge | 48,88 s · 47 % | 49,50 s · 48 % | +1,3 % |
| 40 | tr_damage_pursuit | attrition | 54,75 s · 51 % | 54,75 s · 52 % | 0,0 % |
| 40 | tr_damage_pursuit | ward | 57,75 s · 65 % | 57,75 s · 66 % | 0,0 % |
| 40 | tr_damage_pursuit | recovery | 50,50 s · 69 % | 50,50 s · 68 % | 0,0 % |
| 40 | tr_control_snare | duel | 50,50 s · 61 % | 50,75 s · 60 % | +0,5 % |
| 40 | tr_control_snare | pack | 82,25 s · 32 % | 82,25 s · 32 % | 0,0 % |
| 40 | tr_control_snare | charge | 51,50 s · 50 % | 52,25 s · 50 % | +1,5 % |
| 40 | tr_control_snare | attrition | 58,75 s · 49 % | 58,25 s · 49 % | -0,9 % |
| 40 | tr_control_snare | ward | 62,00 s · 67 % | 62,00 s · 67 % | 0,0 % |
| 40 | tr_control_snare | recovery | 55,25 s · 69 % | 55,25 s · 69 % | 0,0 % |
| 40 | tr_support_pack | duel | 52,00 s · 85 % | 52,00 s · 85 % | 0,0 % |
| 40 | tr_support_pack | pack | 84,00 s · 75 % | 84,00 s · 75 % | 0,0 % |
| 40 | tr_support_pack | charge | 54,75 s · 76 % | 54,75 s · 76 % | 0,0 % |
| 40 | tr_support_pack | attrition | 59,00 s · 82 % | 59,00 s · 82 % | 0,0 % |
| 40 | tr_support_pack | ward | 63,75 s · 97 % | 64,25 s · 97 % | +0,8 % |
| 40 | tr_support_pack | recovery | 55,75 s · 96 % | 56,50 s · 96 % | +1,3 % |
| 40 | rn_damage_phrase | duel | 41,25 s · 72 % | 41,50 s · 72 % | +0,6 % |
| 40 | rn_damage_phrase | pack | 66,50 s · 55 % | 65,25 s · 55 % | -1,9 % |
| 40 | rn_damage_phrase | charge | 43,50 s · 66 % | 43,75 s · 66 % | +0,6 % |
| 40 | rn_damage_phrase | attrition | 48,25 s · 68 % | 48,63 s · 67 % | +0,8 % |
| 40 | rn_damage_phrase | ward | 48,25 s · 80 % | 48,63 s · 79 % | +0,8 % |
| 40 | rn_damage_phrase | recovery | 43,75 s · 79 % | 43,75 s · 80 % | 0,0 % |
| 40 | rn_control_frost | duel | 59,25 s · 85 % | 58,00 s · 85 % | -2,1 % |
| 40 | rn_control_frost | pack | 91,63 s · 69 % | 92,00 s · 69 % | +0,4 % |
| 40 | rn_control_frost | charge | 62,25 s · 75 % | 62,25 s · 75 % | 0,0 % |
| 40 | rn_control_frost | attrition | 68,00 s · 84 % | 68,50 s · 84 % | +0,7 % |
| 40 | rn_control_frost | ward | 74,25 s · 97 % | 77,50 s · 96 % | +4,4 % |
| 40 | rn_control_frost | recovery | 67,50 s · 98 % | 67,50 s · 98 % | 0,0 % |
| 40 | rn_support_guard | duel | 52,00 s · 97 % | 52,00 s · 98 % | 0,0 % |
| 40 | rn_support_guard | pack | 81,13 s · 85 % | 82,63 s · 85 % | +1,8 % |
| 40 | rn_support_guard | charge | 55,00 s · 81 % | 55,25 s · 81 % | +0,5 % |
| 40 | rn_support_guard | attrition | 58,25 s · 97 % | 58,88 s · 97 % | +1,1 % |
| 40 | rn_support_guard | ward | 63,00 s · 97 % | 63,25 s · 97 % | +0,4 % |
| 40 | rn_support_guard | recovery | 55,75 s · 99 % | 55,75 s · 99 % | 0,0 % |
| 80 | fg_red_ash | duel | 49,38 s · 63 % | 51,25 s · 64 % | +3,8 % |
| 80 | fg_red_ash | pack | 74,75 s · 46 % | 71,25 s · 47 % | -4,7 % |
| 80 | fg_red_ash | charge | 53,00 s · 53 % | 53,13 s · 54 % | +0,2 % |
| 80 | fg_red_ash | attrition | 59,25 s · 54 % | 58,75 s · 54 % | -0,8 % |
| 80 | fg_red_ash | ward | 61,25 s · 69 % | 60,75 s · 69 % | -0,8 % |
| 80 | fg_red_ash | recovery | 54,25 s · 73 % | 54,75 s · 73 % | +0,9 % |
| 80 | fg_control_crack | duel | 49,25 s · 73 % | 49,50 s · 72 % | +0,5 % |
| 80 | fg_control_crack | pack | 81,25 s · 41 % | 83,25 s · 40 % | +2,5 % |
| 80 | fg_control_crack | charge | 50,75 s · 63 % | 51,00 s · 63 % | +0,5 % |
| 80 | fg_control_crack | attrition | 59,00 s · 56 % | 58,13 s · 57 % | -1,5 % |
| 80 | fg_control_crack | ward | 61,75 s · 75 % | 61,75 s · 75 % | 0,0 % |
| 80 | fg_control_crack | recovery | 55,75 s · 78 % | 56,25 s · 77 % | +0,9 % |
| 80 | fg_support_plate | duel | 51,75 s · 86 % | 51,75 s · 87 % | 0,0 % |
| 80 | fg_support_plate | pack | 83,75 s · 79 % | 84,25 s · 78 % | +0,6 % |
| 80 | fg_support_plate | charge | 55,25 s · 79 % | 54,25 s · 79 % | -1,8 % |
| 80 | fg_support_plate | attrition | 60,00 s · 82 % | 60,00 s · 82 % | 0,0 % |
| 80 | fg_support_plate | ward | 62,00 s · 97 % | 62,50 s · 97 % | +0,8 % |
| 80 | fg_support_plate | recovery | 56,75 s · 96 % | 56,25 s · 96 % | -0,9 % |
| 80 | tr_damage_pursuit | duel | 47,25 s · 55 % | 48,50 s · 53 % | +2,6 % |
| 80 | tr_damage_pursuit | pack | 73,25 s · 29 % | 73,25 s · 31 % | 0,0 % |
| 80 | tr_damage_pursuit | charge | 49,38 s · 44 % | 49,50 s · 44 % | +0,3 % |
| 80 | tr_damage_pursuit | attrition | 55,13 s · 43 % | 55,63 s · 43 % | +0,9 % |
| 80 | tr_damage_pursuit | ward | 56,50 s · 60 % | 57,13 s · 59 % | +1,1 % |
| 80 | tr_damage_pursuit | recovery | 53,25 s · 62 % | 53,25 s · 62 % | 0,0 % |
| 80 | tr_control_snare | duel | 55,25 s · 54 % | 56,00 s · 54 % | +1,4 % |
| 80 | tr_control_snare | pack | 87,25 s · 22 % | 89,00 s · 22 % | +2,0 % |
| 80 | tr_control_snare | charge | 57,00 s · 46 % | 57,50 s · 46 % | +0,9 % |
| 80 | tr_control_snare | attrition | 64,25 s · 40 % | 64,25 s · 40 % | 0,0 % |
| 80 | tr_control_snare | ward | 67,00 s · 59 % | 67,50 s · 59 % | +0,7 % |
| 80 | tr_control_snare | recovery | 62,00 s · 61 % | 63,75 s · 61 % | +2,8 % |
| 80 | tr_support_pack | duel | 58,13 s · 89 % | 57,25 s · 88 % | -1,5 % |
| 80 | tr_support_pack | pack | 92,00 s · 93 % | 92,25 s · 92 % | +0,3 % |
| 80 | tr_support_pack | charge | 60,25 s · 84 % | 60,25 s · 84 % | 0,0 % |
| 80 | tr_support_pack | attrition | 67,75 s · 94 % | 68,25 s · 94 % | +0,7 % |
| 80 | tr_support_pack | ward | 69,38 s · 100 % | 69,50 s · 99 % | +0,2 % |
| 80 | tr_support_pack | recovery | 66,50 s · 98 % | 66,50 s · 98 % | 0,0 % |
| 80 | rn_damage_phrase | duel | 47,25 s · 74 % | 47,25 s · 74 % | 0,0 % |
| 80 | rn_damage_phrase | pack | 68,25 s · 60 % | 66,88 s · 61 % | -2,0 % |
| 80 | rn_damage_phrase | charge | 51,25 s · 62 % | 51,75 s · 62 % | +1,0 % |
| 80 | rn_damage_phrase | attrition | 56,25 s · 65 % | 56,25 s · 66 % | 0,0 % |
| 80 | rn_damage_phrase | ward | 61,00 s · 84 % | 61,00 s · 84 % | 0,0 % |
| 80 | rn_damage_phrase | recovery | 52,25 s · 83 % | 52,75 s · 82 % | +1,0 % |
| 80 | rn_control_frost | duel | 53,75 s · 62 % | 53,75 s · 62 % | 0,0 % |
| 80 | rn_control_frost | pack | 79,25 s · 35 % | 79,25 s · 35 % | 0,0 % |
| 80 | rn_control_frost | charge | 53,75 s · 52 % | 55,25 s · 52 % | +2,8 % |
| 80 | rn_control_frost | attrition | 61,75 s · 49 % | 61,75 s · 49 % | 0,0 % |
| 80 | rn_control_frost | ward | 63,25 s · 68 % | 64,25 s · 68 % | +1,6 % |
| 80 | rn_control_frost | recovery | 57,25 s · 71 % | 57,00 s · 71 % | -0,4 % |
| 80 | rn_support_guard | duel | 47,25 s · 83 % | 47,25 s · 83 % | 0,0 % |
| 80 | rn_support_guard | pack | 76,00 s · 73 % | 75,25 s · 73 % | -1,0 % |
| 80 | rn_support_guard | charge | 51,00 s · 76 % | 51,00 s · 76 % | 0,0 % |
| 80 | rn_support_guard | attrition | 53,75 s · 82 % | 53,75 s · 82 % | 0,0 % |
| 80 | rn_support_guard | ward | 57,00 s · 95 % | 53,75 s · 97 % | -5,7 % |
| 80 | rn_support_guard | recovery | 52,25 s · 97 % | 51,25 s · 97 % | -1,9 % |

Écart absolu de temps : médian 0,5 %, maximal 5,7 %.

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

