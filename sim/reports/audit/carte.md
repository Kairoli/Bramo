# Carte des mécaniques (audit, phase 1)

Tirée de `data/` et du moteur (commit courant). 46 gemmes de talent, 12 objets nommés, 18 ensembles, 18 outils de situation, 27 rencontres, 66 sorts, 4440 modèles d'équipement.

## 1. Les huit réserves

Tous les talents du jeu : gemmes (g), objets nommés (n), paliers d'ensemble (e), talents de la Puissance (p). « Lue » : multiplie un effet par les charges (`scaleBy`) ou attend un seuil (`poolAtLeast`) sans la vider. « Conversion » : reçoit une part des charges d'une autre.

| Réserve | Plafond | Remplie par | Dépensée par | Lue sans la vider | Conversion vers elle |
|---|---|---|---|---|---|
| Tisons | 10 | 4 : L'Allume-Feu (g), La Forge portative (n), Les Fondeurs sourds (2) (e), Le Fer du second feu (2) (e) | 1 : Le Feu aux poudres (g) | **rien** | — |
| Entailles | 10 | 7 : Le Fil du rasoir (g), Le Barbier (g), Le Pas de course (g), L'Arc des Ronceraies (n), Le Mauvais Présage (n), Le Pied-de-biche (2) (e), La Battue silencieuse (3) (e) | 1 : Le Coup de grâce (g) | 1 : Rouge vif (g) | — |
| Frimas | 10 | 5 : Le Souffle polaire (g), Le Bénéfice du doute (n), Le Mauvais Présage (n), Le Ciré du Gué (2) (e), Les Mains de traverse (2) (e) | 2 : Le Dégel brutal (g), Cœur de glace (g) | **rien** | — |
| Rancœur | 10 | 5 : La Rancune tenace (g), Le Marteau des griefs (n), L'Enclume patiente (2) (e), Le Tablier de suie (2) (e), La Cloche du puits (p) | 2 : Retour à l'envoyeur (g), Le Marteau des griefs (n) | 1 : La Peau de vieux cuir (g) | — |
| Ferveur | 10 | 5 : La Main tendue (g), La Longue Haleine (g), Le Sceau qui tient (n), Les Habits de pluie (2) (e), Les Veilleurs du sceau (2) (e) | 2 : La Grâce oblique (g), L'Auréole de travers (g) | **rien** | Les Cendres tièdes (g) depuis tisons ; Le Petit Arrangement (n) depuis rancoeur |
| Mesure | 10 | 6 : Le Métronome (g), La Longue Haleine (g), Le Pas de course (g), La Ponctuelle (n), Les Heures creuses (2) (e), Le Sceau brisé (p) | 1 : Le Grand Accord (g) | 1 : Le Rythme cardiaque (g) | Le Mauvais Perdant (g) depuis rancoeur |
| Échos | 10 | 6 : Le Ricochet (g), Le Perroquet (g), Le Dernier Avertissement (n), Le Fil du retour (n), Le Sablier fêlé (2) (e), La Phrase inachevée (2) (e) | 1 : Le Point d'orgue (g) | **rien** | Le Pas de deux (g) depuis mesure |
| Trophées | 6 | 3 : Le Barbier (g), Le Collectionneur (g), La Meute du dimanche (2) (e) | 1 : Le Taxidermiste (g) | 1 : La Vitrine (g) | — |

Note : `gamePoolLinks` (`combat/guide.ts`, la bulle « dans le jeu » des jauges) ne parcourt que les objets nommés et les ensembles : pour le joueur, presque toutes les réserves y paraissent « dépensées par rien », alors que les gemmes de talent les dépensent.

## 2. La langue des talents : ce que les données utilisent

120 talents (gemmes, nommés, paliers d'ensemble, talents de la Puissance).

| Déclencheur | Talents |
|---|---|
| fight_start | 3 |
| direct | 21 |
| basic | 12 |
| skill | 20 |
| crit | 3 |
| kill | 6 |
| hit_taken | 7 |
| shield_broken | 1 |
| shield_expired | 1 |
| heal_done | 4 |
| protect_done | 5 |
| absorbed | **0** |
| control | 6 |
| break | 2 |
| dispel | **0** |
| temper | 3 |
| angle | 3 |
| companion | **0** |
| rune_read | 1 |
| hp_below | 3 |
| dot_expired | **0** |
| every | 7 |

| Action | Effets |
|---|---|
| amplify | 11 |
| critBonus | 3 |
| damage | 7 |
| dot | 2 |
| mark | 2 |
| slow | 1 |
| vuln | 2 |
| shield | 8 |
| heal | 5 |
| healShare | **0** |
| buff | **0** |
| cooldownCut | 3 |
| heat | 1 |
| replayRune | 1 |
| transferDots | 1 |
| bank | **0** |
| spend | **0** |
| next | 4 |
| gain | 50 |
| spendPool | 12 |
| scaleBy | 4 |
| lowHpHeal | **0** |
| stack | **0** |
| uses | **0** |
| usesPerHeat | **0** |
| other | **0** |

| Condition | Effets |
|---|---|
| poolAtLeast | 12 |
| after | 8 |
| target | 7 |
| pattern | 7 |
| before | 6 |
| minCooldown | 5 |
| targetHpBelow | 4 |
| hpBelow | 4 |
| every | 3 |
| heatAtLeast | 2 |
| skill | 2 |
| noSkillFor | 1 |

| Modificateur passif | Talents |
|---|---|
| dotDuration | 1 |
| dotDamage | 2 |
| markDuration | **0** |
| slowDuration | 2 |
| shieldPower | 3 |
| healPower | 2 |
| pressure | 1 |
| runeValue | 1 |
| angleDuration | 2 |
| shieldDuration | **0** |
| slowedTakenReduction | **0** |
| defenseScore | 1 |
| hasteScore | 2 |
| heatCap | 2 |
| basicDamage | 3 |
| skillDamage | 1 |
| spendPower | 1 |
| spendKeep | 1 |

## 3. Mécanique ou simple nombre ?

Un talent « mécanique » remplit ou dépense une réserve, prépare l'action suivante, rejoue une rune, rend des Braises, raccourcit des recharges, pose un état (marque, ralentissement, affliction, vulnérabilité), convertit une réserve ou apporte un outil de situation. Les autres ne font que des bonus chiffrés (dégâts en plus, bouclier, soin, modificateur).

- Mécaniques : 78 talents sur 120.
- Simples nombres : 42 : Le Petit Bois (gemme), Les Engelures (gemme), La Peau de vieux cuir (gemme), La Bonne Conscience (gemme), Le Rythme cardiaque (gemme), La Cacophonie (gemme), La Vitrine (gemme), Le Bastion d'opérette (gemme), Le Coup d'envoi (gemme), La Mèche courte (gemme), Le Pare-balles (gemme), Le Second Souffle (gemme), L'Usure (gemme), La Peau dure (gemme), Le Coup double (gemme), L'Aiguille (gemme), Le Sac sans fond (nommé), Les Heures supplémentaires (nommé), Les Heures creuses (3) (ensemble 3), Le Sablier fêlé (3) (ensemble 3), Les Habits de pluie (3) (ensemble 3), Le Ciré du Gué (3) (ensemble 3), L'Enclume patiente (3) (ensemble 3), Les Fondeurs sourds (3) (ensemble 3), Les Passeurs de braise (3) (ensemble 3), La Meute du dimanche (3) (ensemble 3), Les Mains de traverse (3) (ensemble 3), Le Pied-de-biche (3) (ensemble 3), Les Veilleurs du sceau (3) (ensemble 3), Le Tablier de suie (3) (ensemble 3), Le Fer du second feu (3) (ensemble 3), La Battue silencieuse (2) (ensemble 2), La Phrase inachevée (3) (ensemble 3), La Mèche et le Briquet (2) (ensemble 2), Le Souffle long (2) (ensemble 2), Le Souffle long (3) (ensemble 3), Les Aiguilles du beffroi (2) (ensemble 2), La Boussole noyée (puissance:reliques), Le Miroir de vase (puissance:reliques), La Lanterne du passeur (puissance:reliques), Le Fanal (puissance:lanterne), La Veilleuse (puissance:lanterne).

## 4. Les rencontres de la route

| Rencontre | Sorte | Palier | Limite (s) | Mécaniques |
|---|---|---|---|---|
| La Chaussée des lanternes | zone | 1 | 35 | fenêtres (fermées −80 %) |
| Les Fossés gris | zone | 10 | 35 | érosion |
| Mère Grise, la Lavandière du Puits | gardien | 10 | 55 | érosion, fenêtres (fermées −60 %) |
| La Cour des trois coups | zone | 20 | 30 | coup lourd 1/3 ×5 |
| Les Vergers de verre | zone | 30 | 25 | renforts ×6 |
| Le Contremaître rouge | gardien | 30 | 50 | renforts ×2, coup lourd 1/3 ×4 |
| Le Cloître des balances | zone | 40+ | 25 | garde menaçante |
| Les Fours de recuit | zone | 40+ | 30 | aura 72.5/s |
| La Matriarche de résine | gardien | 40+ | 50 | garde menaçante, aura 37.6/s |
| La Salle des échos | zone | 40+ | 35 | fenêtres (fermées −85 %) |
| Le Gué des plaies | zone | 40+ | 25 | charge 582 / 14.7 s, érosion |
| Le Notaire des marées | gardien | 40+ | 55 | érosion, fenêtres (fermées −65 %) |
| La Chambre aux deux sceaux | zone | 40+ | 40 | 2 ennemis, garde alternée |
| Les Terrasses de la vigie | zone | 40+ | 25 | charge 2565 / 10.7 s |
| Le Gardien des trois portes | gardien | 40+ | 45 | coup lourd 1/3 ×5, garde menaçante |
| L’Atelier des mauvais jours | zone | 40+ | 35 | renforts ×1, soin ennemi |
| Le Belvédère des trois vents | zone | 40+ | 25 | charge 504 / 13.3 s, aura 78.8/s |
| Le Régent des courants | gardien | 40+ | 40 | renforts ×6, aura 32.8/s |

## 5. Ce que le moteur sait faire et que le jeu n'utilise pas

- Effets de ligne aléatoire sans aucune ligne dans `gear_pools.yaml` : penetration, physical, fire, frost, lightning, startShield (les éléments n'ont donc aucun effet en combat : aucune résistance, aucune ligne de dégâts par élément).
- Statistiques fixes des modèles d'équipement : defense, vitality, power, crit, haste.
- Statistiques des systèmes de Puissance : power, critChance, combo, critMultiplier, maxHp, counter, evasion, regen, haste (les seules sources de combo, contre-attaque, esquive et régénération).
- Déclencheurs sans aucun talent : absorbed, dispel, companion, dot_expired.
- Actions sans aucun talent : healShare, buff, bank, spend, lowHpHeal, stack, uses, usesPerHeat, other.
- Modificateurs sans aucun talent : markDuration, shieldDuration, slowedTakenReduction.

## 6. Qui porte quoi

- Objets nommés : Le Marteau des griefs (forgefire, weapon) ; La Forge portative (forgefire, weapon) ; L'Arc des Ronceraies (tracker, weapon) ; La Ponctuelle (tracker, weapon) ; Le Dernier Avertissement (runist, weapon) ; Le Sceau qui tient (runist, weapon) ; Le Bénéfice du doute (toutes, necklace) ; Le Petit Arrangement (toutes, necklace) ; Le Mauvais Présage (toutes, necklace) ; Le Sac sans fond (toutes, necklace) ; Les Heures supplémentaires (toutes, necklace) ; Le Fil du retour (toutes, necklace).
- Ensembles de classe : Le Fer du second feu (forgefire), La Battue silencieuse (tracker), La Phrase inachevée (runist) ; sans classe : 15.
- Gemmes par rôle : producer 12, payoff 14, amplifier 10, bridge 5, utility 5.
- Gemmes de situation (outils, rang « gemme ») : Opale d'interstice, Perle de lessive, Hématite d'arrêt, Grenat de battue, Œil de faille, Ambre de reprise.

