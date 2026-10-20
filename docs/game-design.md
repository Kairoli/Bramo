# Bramo — game design

> Document de référence. Les chiffres ici sont des intentions ; les valeurs qui font foi sont dans `data/` (marquées `# à équilibrer` tant qu'elles sont provisoires).

## 1. Vision

Idle-RPG multijoueur dans le navigateur, dans l'esprit de SimpleMMO, Melvor Idle et RuneScape. On monte des métiers, on choisit une classe, on rejoint un clan, on commerce sur un marché, on vit des saisons.

Le jeu est **casu dans l'ensemble** : on y passe quelques minutes plusieurs fois par jour, et l'absence ne coûte jamais rien.

## 2. Piliers

| Pilier | Ce que ça veut dire concrètement |
|---|---|
| Personne n'est bloqué, personne ne fait tout seul | Tout métier peut se monter seul, mais le temps nécessaire pousse à se spécialiser et à échanger (marché, clan). |
| Casu d'abord | Écart tryhard / casu visé : **×2 à ×2,5**, jamais ×10. Pas de course au niveau max. |
| Récompenser le présent, ne jamais punir l'absent | Le hors ligne rapporte moins (~25 %) mais ne fait rien perdre. Bonus d'énergie pour la présence. |
| Payant = confort et cosmétique | Jamais de statistiques ni de ressources à vendre. |
| Serveur autoritaire | Tous les calculs côté serveur ; le client affiche. |

## 3. Progression des métiers

### 3.1 Courbe d'XP
Courbe de RuneScape, niveaux 1 à 99 :

```
XP(L) = floor( Σ_{l=1}^{L-1} floor(l + 300 · 2^(l/7)) / 4 )
```

Repères : niveau 2 = 83 XP, niveau 99 = **13 034 431 XP**.

### 3.2 Titres
| Niveau | Titre |
|---|---|
| 1 | Novice |
| 30 | Apprenti |
| 60 | Compagnon |
| 85 | Maître |
| 99 | Grand maître |

### 3.3 Maîtrise après 99 *(plus tard)*
Paliers au rendement décroissant, plafonnés à **+10 %** au total.

### 3.4 Affinité de métier *(plus tard, avec les classes)*
+1 % par tranche de 10 niveaux du métier lié à la classe, plafonnée à **+10 %**.

### 3.5 Objets faits maison *(plus tard)*
Les objets fabriqués par un joueur sont **signés** de son nom et de **meilleure qualité** que ceux trouvés ou achetés aux PNJ. Paliers de qualité visibles sur la maquette : Normale, Supérieure, Rare, Chef-d'œuvre.

## 4. Métiers (14 au lancement)

| Famille | Métiers |
|---|---|
| Récolte | Minage, Bûcheronnage, Pêche, Herboristerie, Chasse |
| Artisanat | Forge, Menuiserie, Cuisine, Alchimie, Couture, Artificerie, Enchantement |
| Monde et clan | Construction, Exploration |

**Prototype (P1)** : Minage, Forge, Herboristerie et Cuisine jouables, 5 à 6 recettes chacun, avec des chaînes :
- minerai (Minage) → lingot (Forge) → lame / outil (Forge) ;
- herbes (Herboristerie) + poisson → repas (Cuisine).

Le poisson venant de la Pêche (« bientôt »), le prototype le fait vendre par le **marchand du port** (PNJ) à prix fixe, ce qui donne aussi un usage à l'or. Le marchand rachète tous les objets à leur valeur. Il disparaîtra ou changera de rôle quand la Pêche et le marché arriveront.

Les repas donnent un bonus de vitesse temporaire (un seul actif à la fois, plafonné à +10 %). Les pioches forgées donnent le bonus d'outil du Minage (plafonné à +30 %).

Les autres métiers existent dans les données et apparaissent « Bientôt » (en pointillés) dans l'interface.

## 5. Boucle idle

### 5.1 Une activité à la fois
- Une seule activité en cours (un métier, une recette, une quantité).
- Une **file d'actions** à suivre, longueur **3** (réglage). Une fois l'activité finie, la suivante démarre automatiquement.
- Lancer une recette alors qu'une autre tourne : « Lancer à la place de [activité] » (remplace) ou « Ajouter à la file ».

### 5.2 Rendement
| Situation | Rendement |
|---|---|
| Actif (joueur présent) | 100 % |
| Hors ligne | ~25 %, accumulation plafonnée à **12 h** |
| Énergie quotidienne | 150 % sur les **2 premières heures actives** de la journée |

Quand le plafond hors ligne est atteint, la progression s'arrête simplement : rien n'est perdu de ce qui a été acquis.

### 5.3 Bonus (plafonnés, dans les réglages)
| Source | Plafond |
|---|---|
| Outil | +30 % |
| Potion ou repas | +10 % |
| Clan | +10 % |
| Saison | +20 % |

En P1, seuls l'outil et le repas sont actifs ; clan et saison valent 0 mais existent dans le calcul.

### 5.4 Calcul à la demande
Aucune boucle serveur permanente. À chaque interaction ou connexion, le serveur recalcule la progression à partir des horodatages (début de l'activité, dernière visite, énergie consommée), applique les rendements et les bonus, puis enregistre le nouvel état.

### 5.5 Résumé d'absence
À la connexion, une popup s'ouvre seule : durée d'absence, XP gagnée, objets produits, niveaux pris, et une phrase d'explication (ex. « Votre forge a tourné au quart de sa vitesse. Le plafond de 12 h n'est pas atteint : rien n'a été perdu. »). Le résumé reste ensuite consultable dans le journal.

## 6. Comptes
Pseudo et mot de passe, un personnage par compte.

## 7. Classes *(P4–P5, ne pas coder maintenant)*

### 7.1 Classes de base
| Classe | Style | Métier lié |
|---|---|---|
| Forgefeu | Mêlée | Forge |
| Traqueur | Tir | Chasse |
| Runiste | Magie | Enchantement |

Chaque classe a **trois voies** : dégâts, contrôle, soutien.

### 7.2 Progression de classe
- Niveau 30 : choix de la **voie**.
- Niveau 60 : **spécialisation**.
- Niveau 75 : **éveil**.

### 7.3 Classes de métier
Débloquées au **niveau 40** du métier lié : **Artificier** (Artificerie), **Alchimiste** (Alchimie).

### 7.4 Triangle de combat
Mêlée > Tir > Magie > Mêlée.

## 8. Économie et social *(plus tard)*

### 8.1 Marché (P2)
Ordres d'achat et de vente, **taxe de 5 %**. L'**usure des objets** est le principal puits de ressources.

### 8.2 Clans (P3)
Entrepôt commun, commandes internes, postes d'experts, projets de construction.

### 8.3 Saisons (P5)
Durée **6 semaines**, une **mutation** par saison (ex. « Saison des marées : Pêche +20 % »).

## 9. Interface

Maquettes de référence : `docs/maquettes/`
- `1-accueil-resume-absence.png` — accueil avec la popup de résumé d'absence
- `2-accueil.png` — accueil
- `3-metiers-grille.png` — salle Métiers, grille
- `4-metiers-forge.png` — salle d'un métier (Forge)
- `5-runiste.png` — test de style du personnage

### 9.1 Règles générales
- Un accueil et cinq salles : **Accueil, Métiers, Personnage, Clan, Marché, Combat** (six onglets en haut). Tout le reste s'ouvre en popup ou en volet.
- **Aucun scroll de page** : cible 1440×900, correct à 1280×720.
- Squelette commun : **bande visuelle du lieu en haut, contenu en bas**.
- Barre du haut : nom du jeu, onglets, puis à droite l'événement en cours, l'or, la jauge d'énergie, la recherche.
- Police unique **Bricolage Grotesque**, palette « Anthracite et cuivre » (voir `CLAUDE.md`).

### 9.2 Accueil
- **En haut** : carte du monde avec des lieux cliquables (Mines, Bois, Halle du clan, Arène…) et un volet d'infos à droite.
- **En bas, trois colonnes** :
  - gauche : journal et discussion, onglets Tout / Journal / Clan / Serveur (P1 : seul Journal fonctionne) ;
  - centre : activité en cours (anneau de progression, gains, file d'actions) et lien « Changer d'activité » ;
  - droite : le personnage **en entier**, entouré de ses emplacements (cosmétiques, arme, outil, repas), avec nom, titre, classe et voie, sans alertes d'équipement. Lien « Ouvrir le personnage ».

### 9.2 bis Salle Personnage
- Trois colonnes : équipement et apparence (détail de chaque emplacement) et sac ; le personnage centré, entouré de ses emplacements ; les caractéristiques (progression, rendement et bonus plafonnés, énergie, métiers, combat à venir).
- Emplacements : Coiffe, Épaules, Haut, Gants, Ceinture, Cape, Bas, Bottes (cosmétiques) ; Arme (de classe) ; Outil et Repas (objets qui donnent un bonus). Un vrai système d'équipement avec statistiques arrivera avec le combat (P4).

### 9.3 Salle Métiers
- Grille de tous les métiers, groupés (Récolte, Artisanat, Monde et clan). Les métiers « Bientôt » en pointillés.
- Un clic ouvre la **salle du métier** :
  - en haut : la scène, avec le maître PNJ (et le niveau, le titre, la barre d'XP du métier) ;
  - en bas à gauche : recettes paginées en **2×3**, filtres par catégorie, recettes verrouillées en gris ;
  - à droite : la recette choisie — niveau requis, temps, XP, ingrédients, quantité −/+/Max, bouton « Lancer » (ou « Lancer à la place de [activité] »), et la file.

### 9.4 Personnages
Toujours à gauche de la scène, de face mais tourné vers la droite, jamais en miroir. Proportions réalistes. Placeholders pour l'instant ; plus tard 2D vectorielle en pièces (squelette + tenue), ambiance sombre et lumière colorée des sorts.

## 10. Feuille de route

| Phase | Contenu |
|---|---|
| P0 | Chiffrage et simulateur d'équilibrage |
| P1 | Prototype solo (métiers, idle, hors ligne, résumé d'absence) |
| P2 | Marché et commandes |
| P3 | Clans |
| P4 | Combat |
| P5 | Saisons et classes de métier |
| P6 | Arènes PvP et ouverture |

## 11. Questions ouvertes
- Public visé.
- Arrivée du PvP (quand, sous quelle forme).
- Durée exacte des saisons (6 semaines à confirmer).
- Longueur de la file pour les abonnés (confort payant).
