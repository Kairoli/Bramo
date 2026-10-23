# Les puits d'or voulus : Mécène, Ouvrages, Affineur

23 octobre 2026. Constat de la simulation de serveur : le jeu crée environ deux fois l'or qu'il détruit, et cet or dort
chez quelques joueurs riches (des mineurs), pendant que le joueur moyen dépense tout. Couper l'or appauvrit tout le monde
sans toucher les riches. Louis a donc choisi des **dépenses que les joueurs ont envie de faire**, parmi cinq idées
proposées par Claude : le Mécène de la Marée (« surtout le 1 »), les Ouvrages du clan et le Perfectionnement.

Chiffres proposés par Claude, à équilibrer au simulateur (section 4).

## 1. Le Mécène de la Marée [Décidé par Louis]

- Un joueur **offre la Marée du soir** à tout le serveur. Son or **disparaît**.
- Chaque mécène donne **+10 % d'éclats à tous les participants** de ce soir-là. Trois mécènes au plus par soir.
- Son nom s'affiche dans la fenêtre de la Marée, dans le bandeau (« offerte par… ») et au **fil du serveur**.
- **Prix** : 250 or par participant du dernier soir (environ 28 000 or sur un serveur de 120 joueurs), au moins 5 000 or (monnaie ×10 depuis le 23 octobre). Un
  grand serveur coûte plus cher : le geste reste à la mesure du nombre de gens qu'il touche.
- On offre la Marée de ce soir tant qu'elle n'est pas finie, sinon celle de demain. Une seule fois par soir et par joueur.
- **Titres** [Demande de Louis : selon le nombre de fois] : Mécène d'un soir (1), Ami de la digue (5), Bienfaiteur des
  Marées (15), Lanterne du bourg (40), Grand Mécène de la Marée (100).

Où : `data/combat/tide.yaml` (`patron`), `combat/tide.ts` (`patronPrice`, `patronDay`, `offerTide`, `tideShards`),
`apps/server/src/tide.ts` (`offerPatron`, table `tide_patrons`), `POST /api/tide/patron`, `components/Tide.tsx`.

## 2. Les Ouvrages du clan et le Banquet [Décidé par Louis]

- Une **suite sans fin d'ouvrages** : la Statue du fondateur, le Phare, les Jardins suspendus, la Grande Table, les
  Tentures, l'Observatoire, le Pavillon des trophées, la Fontaine des Marées, puis la liste recommence. Le clan continue de
  progresser après ses bâtiments.
- Chaque ouvrage demande **5 000 or** (pour 3 membres actifs, choix de Louis), **une récolte** que les joueurs produisent en
  trop, **une matière transformée** et **une pièce finie d'un autre artisan** (mortier, bronze, fioles, charpentes, verre,
  escaliers, pain et ragoût pour la Grande Table, toile teinte, lingots d'argent, arches, fermes de toit) [Décidé par Louis :
  « certains crafts requièrent plusieurs métiers, ou un achat »]. Le premier ouvrage ne demande que des recettes du niveau 1.
- **La récompense : le Banquet** [Choix de Louis : « fête ou banquet du clan », 12 h seulement]. Chaque ouvrage achevé
  donne un Banquet en réserve (trois au plus). Le chef ou un officier le lance quand il veut : **pendant 12 h, +20 % d'XP**
  (métiers et combat) pour tous les membres, en ligne comme hors ligne. Un seul banquet à la fois. Pas de titre : la Marée
  en donne déjà.
- **Rythme** [Louis : « un banquet par semaine pour les plus actifs », en ajustant les quantités de ressources] : le coût suit
  les membres actifs (comme les bâtiments), +10 % par ouvrage puis **stable à partir du onzième** (deux fois le premier).
  Au simulateur (120 joueurs), les deux clans les plus actifs achèvent un ouvrage par semaine environ, les autres un toutes
  les deux à quatre semaines.
- Chaque ouvrage achevé rapporte aussi du Renom au clan.

Où : `data/clan_works.yaml`, `engine/commission.ts` (`workAt`, `worksNeeds`), `engine/state.ts` (`banquet`,
`xpMultiplier`), `engine/advance.ts` et `combat/progress.ts` (l'XP du banquet), `apps/server/src/clans.ts`
(`contributeWorks`, `launchBanquet`, colonnes `clans.works_level`, `banquets`, `banquet_from`, `banquet_until`),
`POST /api/clan/works/contribute`, `POST /api/clan/banquet`, salle Clan (bande « Ouvrages » sous les bâtiments).

## 3. L'Affineur du bourg : le perfectionnement [Décidé par Louis]

Pour les joueurs qui commencent à avoir un bel équipement : un système de fin de jeu, qui récompense ceux qui
s'investissent. « Ça avantage ceux qui calculent, mais en endgame, c'est ok. **Ne plafonne pas.** »

- **Rang d'affinage, sans plafond** : +1, +2, +3… Chaque rang ajoute **+3 %** aux caractéristiques de la pièce
  (Puissance, Vitalité, Défense…). Pour les pièces **Épiques et Légendaires du palier 40 et plus**, ensembles et objets
  nommés compris. Le rang reste sur la pièce, même vendue en vitrine.
- **Affûtage d'une ligne** (décision plus ancienne de Louis) : une ligne bonus monte de 10 % de sa plage, **jusqu'à son
  maximum, jamais au-delà** ; jamais un chef-d'œuvre. Toutes raretés.
- **Coût** : de l'or, qui disparaît, et la **matière de la pièce** (le lingot, la planche, le cuir de son palier), que les
  artisans fabriquent. Chaque service coûte plus que le précédent sur la même pièce : l'or +15 % par rang, la matière +8 %.
  Un rang de plus est toujours possible, jamais gratuit.
- Repères : une pièce Épique de palier 60 coûte environ 5 600 or et 25 lingots d'orichalque pour le rang +1 ; au rang +40,
  environ cent fois plus d'or. Les rangs sont la progression sans fin de l'équipement, face à la route qui ne finit jamais.

Où : `data/gear_crafting.yaml` (`refine`), `engine/refine.ts` (`rankCost`, `rankUp`, `honeCost`, `honeLine`,
`rankedStats`), `CharacterState.equipment[].rank` (le combat le lit), colonnes `gear_items.rank` et `hones`,
`POST /api/gear/refine`, fiche d'une pièce (bloc « L'Affineur du bourg »).

## 4. Mesures du simulateur

Série `sim/reports/serveur/v15-real-s11`, `s12`, `s13` (120 joueurs, 90 jours, monnaie ×10, Comptoir ×2).

| | Graine 11 | Graine 12 | Graine 13 |
|---|---|---|---|
| Marées offertes par un mécène | 103 | 118 | 77 |
| Or détruit par les mécènes | 3,05 M | 3,50 M | 2,29 M |
| Ouvrages achevés (par clan) | 10, 9, 6, 5, 3, 3, 2 | 6, 2, 2, 2, 2, 2, 2 | 2, 2, 2, 2, 2, 1, 1, 1 |
| Banquets lancés | 38 | 18 | 13 |
| Rangs d'affinage achetés (rang le plus haut) | 10 (+4) | 6 (+2) | 7 (+5) |
| Or créé / or détruit, 30 derniers jours | 1,3 | 1,5 | 1,4 |

Le Mécène est le puits le plus fort : presque un mécène par soir, sans qu'il faille les y pousser. Les Ouvrages donnent un
Banquet par semaine aux clans les plus actifs. L'Affineur sert peu en 90 jours : le simulateur n'y envoie que les joueurs
qui calculent et ont plus de 50 000 or, et les belles pièces (Épiques de palier 40) arrivent tard ; c'est un puits de fin de
jeu, qui grandira avec l'âge du serveur.

## 5. À valider par Louis

1. Les prix : Mécène à 25 or par participant ; Ouvrages (or et quantités) ; Affineur (or de base, croissance).
2. Le bonus du mécène : +10 % d'éclats par mécène, trois au plus.
3. Le Banquet : +20 % d'XP pendant 12 h, trois en réserve au plus, lancé par le chef ou un officier.
4. L'Affineur : +3 % par rang, à partir des pièces Épiques de palier 40 ; l'Affineur est un PNJ du bourg (les artisans
   vendent la matière ; plus tard, un artisan joueur pourrait faire le service lui-même).
