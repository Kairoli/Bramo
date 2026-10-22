# Message pour GPT : la cohérence d'ensemble, puis le build v2

> **Obsolète (22 octobre 2026)** : Louis ne passe plus par GPT, toute la conception se fait avec Claude. Ce qui était demandé ici (donjons, géants, Routes franches, relecture des noms) est repris dans [`../contenu/le-monde.md`](../contenu/le-monde.md). Gardé pour l'historique.

> À copier tel quel. Rédigé par Claude le 22 octobre 2026 pour Louis, après `docs/design/coherence/coherence.md` (diagnostic) et `docs/design/coherence/build.md` (la refonte du build, du butin et du contenu que Louis a confiée à Claude). Remplace la première version de ce message : les demandes C, D et E de cette version sont faites (voir plus bas).

---

Bonjour. Claude a repris ensemble tes trois dossiers (« Le cœur du jeu », « Activités et artisanat », « PvE v2 ») et les a **exécutés dans le moteur du jeu** : une langue commune des talents (`talentSchema` dans `packages/shared/src/schemas/combat.ts`), les statistiques réelles de l'équipement (`gearStats`), un budget unique (`resolveLoadout`). Puis Louis lui a demandé de **tout refaire pour que ça fasse sens et soit intéressant** (« des talents originaux, un aspect looter, une méta sans que tout se vaille, des récompenses pour le meilleur build ; tout n'est que prototype »). Lis dans cet ordre :

1. `docs/design/coherence/build.md` : le principe (huit réserves), ce que porte un personnage, les mesures, les récompenses, le contenu (régions, gardiens, donjons, world boss, Routes franches, mutations) et **les choix que Claude a faits à la place de Louis** (à valider par lui) ;
2. `sim/reports/combat/coherence-v2/catalogue.md` : le catalogue complet (34 gemmes, 15 ensembles, 12 nommés, lignes par emplacement), généré depuis les données ;
3. `sim/reports/combat/coherence-v2/build.md` et `situation.md` : les mesures brutes, échecs compris ;
4. `docs/design/coherence/coherence.md` : le diagnostic qui a mené là (§2 et §3).

Rien n'est adopté. Les données vivent dans `sim/proposals/coherence-v2/` (talents, lignes, conversion, outils), `coherence-zones-v2/` (zones refaites) et `coherence-bosses-v1/` (six gardiens).

## Ce qui a changé depuis ton dossier

- **Huit réserves** (Tisons, Entailles, Frimas, Rancœur, Ferveur, Mesure, Échos, Trophées) : des objets les remplissent, d'autres les dépensent, d'autres les relient. Une gemme qui dépense ne fait rien seule. Les classes ont leurs entrées (Braises, Angle, runes) par les nommés et les ensembles de classe.
- **Ensembles à deux étages** : 2 et 3 pièces nourrissent un style ; **4 pièces = un outil de situation** (tes six familles), sans effet ailleurs. Plus d'ensemble généraliste.
- **Lignes de build** sur l'équipement (plafond d'une réserve, dépenses, afflictions…), aucune ligne morte : le bon jet dépend du build.
- Tes demandes de la première version : **C** (catalogue de gemmes de build), **D** (outils recalés sur le palier), **E** (12 nommés gardés, deux armes par classe et six colliers) sont faites par Claude. **A** (Fracture et Battue refaites par le contenu) est faite dans `coherence-zones-v1/-v2`. **B** (régions et familles) est proposée au §6 de `build.md`.

## Ce que je te demande maintenant

**A. Une relecture créative**, la priorité de Louis : il aime la vibe actuelle (noms d'ensembles qui racontent quelque chose, surnoms d'objets un peu rigolos, zones qui ne font pas génériques). Relis les noms, textes et surnoms du catalogue ; propose des remplaçants pour ceux qui sonnent plats, et **quatre à six talents de plus** qui tordent une règle d'une manière qu'aucun autre n'a (dans la langue commune ; si un effet a besoin d'un nouveau déclencheur ou d'une nouvelle action, décris-le, Claude l'ajoutera au moteur).

**B. Les donjons des six régions** : six salles chacun (deux d'approche, deux intermédiaires, une salle de combinaison qui mêle les deux familles de la région, le gardien de `coherence-bosses-v1`), au format `encounterSchema`, avec des noms et une petite histoire par salle. Cible : la salle de combinaison est celle où un build qui n'a qu'une réponse souffre ; le donjon entier se fait avec 30 % de PV rendus entre les salles.

**C. Les trois géants de la Veille** (Porte-Fanal, Veuve de cuivre, Grand Arpenteur, §6.3) : chaque phase est une rencontre du moteur (le moteur n'a pas de phases ; une phase = une rencontre de 3 à 4 minutes), et les contributions des métiers par canal.

**D. Les étapes des Routes franches** (§6.4) : six étapes, chacune une famille de mécanique, et ce que les artisans y fournissent.

Cibles mesurables, que Claude rejouera avec `sim combat-build --step situation` : au mur d'une rencontre, le 4 pièces de sa famille rapporte **environ un palier** (×1,096) au build de farm, pour chaque voie ; aucune rencontre ne rend une seule réponse obligatoire (deux familles, ou une famille et un plan). Livre au format du jeu ; pas de banc séparé comme source de vérité.
