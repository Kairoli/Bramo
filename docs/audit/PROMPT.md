# Audit complet des systèmes de Bramo : la commande

Commande de Louis (24 octobre 2026, nuit), en anglais ci-dessous, avec les **ajouts du superviseur** acceptés par Louis.
Les ajouts priment en cas de conflit.

## Ajouts du superviseur (à lire d'abord)

1. **Langue.** Tous les rapports sont **en français**, simples, pour Louis : il n'est pas développeur. Code et identifiants en
   anglais, comme le reste du projet.
2. **Ordre de lecture.** D'abord le `CLAUDE.md` de la racine en entier (règles du projet, section « Travail en sessions »,
   état du projet). Ensuite **le code et des mesures, avant les fiches de conception** (`docs/design/`). Ces fiches ont été
   écrites par Claude, le même modèle que toi : les lire en premier, c'est hériter de leurs hypothèses. Le moteur fait foi.
3. **Réutiliser les outils qui existent**, après avoir vérifié qu'ils correspondent toujours au moteur (ne pas les
   reconstruire) :
   - `sim/src/tempo/` : `bench.ts` (banc des builds : 9 voies, zones et gardiens, archétypes, builds au hasard), `timers.ts`,
     `levers.ts` (leviers du joueur bloqué), `needed.ts` (niveau requis par étape), `force.ts` (Force dans le temps),
     `tune.ts`, `patch.ts` (variantes de rythme et ajouts de talents) ;
   - `sim/src/rythme.ts`, `sim/src/wall.ts`, `sim/src/audit.ts` (audit du contenu) ;
   - `sim/src/server/` : simulation de serveur (`run.ts`, 11 façons de jouer dans `personas.ts`, `world.ts`, `report.ts`) ;
   - les scénarios `sim combat-*` (`sim/src/scenarios/` : `combat-build`, `combat-coherence`, `combat-search`,
     `combat-tools`…) ;
   - les rapports existants dans `sim/reports/`, et les fiches `docs/design/coherence/build-v3.md`, `debloquer.md`,
     `rythme.md`, `docs/design/puissance.md`, `pvp.md`, `bots.md` (à lire après les mesures, voir 2).
4. **Vocabulaire du projet.** Les « eight gauges » sont les huit **réserves** (`pools` : Tisons, Entailles, Frimas, Rancœur,
   Ferveur, Mesure, Échos, Trophées). La « four-talent limit », ce sont les **quatre places de talent majeur** (arme, torse,
   tête, collier : objets nommés puis gemmes). La puissance affichée est la **Force** (moteur de Puissance, `characterForce`).
5. **Première chose à faire : vérifier le recalage de la Puissance.** Les coûts et durées de `data/power/` ont été recalés
   le 24 octobre (nuit) sans être remesurés (`docs/design/puissance.md` §8). Relancer en arrière-plan, dès le début :
   `pnpm --filter @bramo/sim exec tsx src/server/run.ts 120 90 real 11 v3-puissance` (environ 21 min). Écrire le résultat
   dans `puissance.md` §8 (remesuré : ce qu'ajoutent les systèmes en paliers, route du casu, avance du tryhard).
6. **Règles techniques.**
   - Ne jamais ouvrir `apps/server/.pglite/` (la base de Louis). Pour lancer un serveur : un `PORT` et un `PGLITE_DIR`
     propres (voir `CLAUDE.md` §11).
   - Ne rien changer au jeu : ni `data/`, ni les règles, ni le combat. Les outils d'étude vont dans `sim/`, les propositions
     dans `sim/proposals/<nom>/`, les rapports dans `docs/audit/` et `sim/reports/audit/`.
   - Lancer en arrière-plan toute simulation qui dépasse quelques minutes.
   - Sous Windows, ne pas mettre d'accents graves (backticks) dans un `node -e "…"` entre guillemets doubles : le shell les
     exécute. Écrire plutôt un script `.cjs` ou `.ts`.
   - Vérifier les tests (`pnpm test`) et les types (`pnpm typecheck`) avant chaque commit.
7. **Point d'étape avec Louis après la phase 3** (outils vérifiés, ce qui est testable établi), avant les grosses campagnes
   de mesure. L'écrire dans `docs/audit/00-point-etape.md` (en français simple : ce qui est testable, ce qui ne l'est pas,
   ce que coûtera chaque phase), puis finir ton tour avec un court compte rendu. Le superviseur le transmet à Louis et te
   renvoie sa réponse.
8. **Ne rien perdre.** L'avancée vit dans `docs/audit/AVANCEMENT.md` (phases faites, en cours, à faire, commandes
   lancées, où sont les résultats) : un autre agent doit pouvoir reprendre sans recommencer.
9. **Commits** : petits, sur ta branche, en français à l'impératif, terminés par
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ne pas fusionner dans `main` et ne pas pousser `main` : le
   superviseur vérifie et fusionne.
10. **À la fin** : un bloc « Fait — l'audit des systèmes » dans la section « État » de `CLAUDE.md` (court : verdict, les trois
    priorités, où sont les rapports), et le compte rendu de fin prévu par « Travail en sessions ».
11. **Livrables** (partie 16) dans `docs/audit/` : `01-rapport.md` (le rapport pour Louis, court), puis un fichier par
    analyse ; preuves et scripts dans `sim/reports/audit/` et `sim/src/audit/`.

## La commande de Louis

BRAMO — COMPLETE GAME SYSTEM VIABILITY & LONG-TERM DESIGN AUDIT

### YOUR ROLE

You are acting as an independent senior game systems designer, combat balance analyst, and simulation engineer.

Your assignment is to perform a comprehensive investigation of Bramo, an idle MMORPG/browser RPG currently under development.

You have access to the source code, game systems, data, existing simulations, design documents, and development history.

Your mission is NOT to balance the game to perfection.

Your mission is to determine whether Bramo's existing systems are:

1. Mechanically functional.
2. Meaningful for players.
3. Strategically interesting.
4. Reasonably balanced without excessive homogenization.
5. Sustainable over months or years of progression.
6. Expandable with additional classes, equipment, talents, mechanics, bosses, and activities.
7. Robust enough to support a growing player population and evolving metagame.

Most importantly, determine whether the game actually rewards understanding its mechanics, or whether its apparent complexity is mostly superficial.

Do not assume the existing design is good simply because it has already been implemented.

Do not assume something is broken simply because a simulation produces an unfavorable result.

Approach this investigation as though you were evaluating a game developed by an unfamiliar studio before recommending whether development should continue on its existing foundation.

### PART 1 — UNDERSTAND THE GAME BEFORE TESTING

Before running any simulations, thoroughly investigate the actual implementation.

Read the relevant source code, combat engine, configuration, data files, existing reports, and design documentation, including CLAUDE.md.

Identify and document:

- Every playable class and its mechanical identity.
- Every currently implemented combat mechanic.
- All eight combat gauges and their activation, filling, spending, and interaction rules.
- Equipment, gear sets, bonuses, and itemization systems.
- Gems, talents, and the four-talent build limit.
- Damage, healing, mitigation, critical hits, resource generation, and other combat formulas.
- Progression systems and power scaling.
- PvE stages, bosses, dungeons, and other combat activities.
- Equipment acquisition and progression costs.
- Existing simulation infrastructure.
- Any PvP-related systems already implemented or planned.

Distinguish carefully between:

- Fully implemented features.
- Partially implemented features.
- Planned but nonexistent features.
- Features described in documentation that no longer match the code.

The actual game engine and executable behavior are the source of truth.

Do not invent mechanics or treat future plans as implemented systems.

Produce an initial map showing how the game's mechanics interact.

Identify which mechanics genuinely change combat behavior and which are essentially numerical modifiers.

Do not begin making balance recommendations yet.

### PART 2 — DOES PLAYER INTELLIGENCE ACTUALLY MATTER?

This is one of the most important questions in the entire investigation.

Bramo is intended to reward players who understand their class, equipment, talents, gauges, and combat interactions.

However, raw progression and long-term investment must remain meaningful.

We want players to benefit from intelligent decisions without allowing optimization to completely invalidate months of progression.

#### 2.1 — Create simulated player archetypes

Create several distinct simulated player behaviors.

Player A — The Casual Player

- Selects equipment mainly by displayed power.
- Does not deeply understand mechanical synergies.
- Uses reasonable but imperfect talent choices.
- Represents an ordinary player enjoying the game without studying its systems.

Player B — The Stat Optimizer

- Understands the important numerical stats for their class.
- Prioritizes relevant attributes.
- Does not deeply optimize gauge interactions or complex combinations.

Player C — The Build Specialist

- Understands class mechanics.
- Chooses synergistic gear sets.
- Optimizes four-talent combinations.
- Understands gauge generation and consumption.
- Adapts their build to the activity.

Player D — The Experimental Player

- Uses unusual or unconventional combinations.
- Tests less obvious interactions.
- Sometimes sacrifices raw power for utility, survivability, or mechanical advantages.

Player E — The Poorly Optimized Player

- Makes genuinely bad equipment and talent choices.
- Ignores obvious synergies.
- Serves as a lower-performance baseline.

These archetypes must be implemented as actual decision policies, not arbitrary damage multipliers.

They should operate under equivalent access to equipment and progression resources.

#### 2.2 — Compare equivalent characters

Run comparisons with:

- Identical levels.
- Identical progression investment.
- Equivalent gear rarity and upgrade budgets.
- Equivalent acquisition opportunities.
- Different equipment choices.
- Different talent combinations.
- Different gauge strategies.

Test each playable class independently.

Measure:

- Maximum PvE stage reached.
- Damage output.
- Effective survivability.
- Healing effectiveness.
- Combat duration.
- Gauge activation frequency.
- Gauge resource wasted or unused.
- Win rate against identical encounters.
- Overall progression efficiency.

Central question:

Does a player who understands Bramo's mechanics achieve meaningfully better results than someone who simply equips the highest-power items?

If the difference is negligible, investigate whether the game's strategic complexity is largely cosmetic.

If the difference is enormous, investigate whether casual players are excessively punished.

Do not assume either outcome is automatically bad.

#### 2.3 — Can intelligent builds overcome moderate power disadvantages?

Repeat comparisons with controlled power differences.

Test gaps of approximately:

- 5%
- 10%
- 15%
- 20%
- 30%
- 50%
- 100%

These are exploratory test points, not intended balance targets.

Use both a meaningful measure of actual combat power and the game's displayed power score, if one exists.

Compare optimized weaker characters against poorly optimized stronger characters.

Determine at which power differences strategic optimization can still compensate.

Desired design philosophy:

A clever player should sometimes defeat a somewhat stronger opponent.

However, a player with months of additional progression, vastly superior equipment, and substantially greater investment should generally retain a decisive advantage.

An optimized newcomer should not routinely defeat a poorly optimized veteran with dramatically superior progression.

Determine whether Bramo currently respects this principle.

Do not enforce an arbitrary numerical threshold. Present the observed relationship and recommend an acceptable range with justification.

### PART 3 — DO BUILDS ACTUALLY EXIST?

Bramo contains equipment sets, talents, class mechanics, and eight combat gauges.

On paper, this creates a substantial number of possible combinations.

But theoretical combinations are not the same as meaningful builds.

#### 3.1 — Build diversity investigation

For every class, identify:

- The strongest general-purpose builds.
- The strongest defensive builds.
- The strongest damage-focused builds.
- Builds specializing in gauge generation.
- Builds specializing in gauge consumption.
- Builds suited to specific bosses or encounter types.
- Unusual but potentially viable combinations.

Do not assume every class must support every archetype.

Enumerate combinations exhaustively where feasible.

Where exhaustive enumeration is computationally impractical, use appropriate search algorithms, sampling, or optimization techniques.

Record the search coverage and limitations.

#### 3.2 — Determine whether choices are meaningful

For each equipment set, talent, and significant mechanic, investigate:

1. Does choosing it change the outcome of combat?
2. Does it change how the build functions?
3. Does it create a meaningful trade-off?
4. Is it useful in at least one realistic situation?
5. Is it consistently outperformed by another option?
6. Does it interact meaningfully with other systems?
7. Is its value dependent on equipment or progression thresholds?

Identify options that appear diverse but produce practically identical outcomes.

For example:

If two different gear sets produce nearly identical damage, survivability, gauge behavior, and encounter performance, determine whether they offer a meaningful distinction.

However, numerical similarities do not automatically make an option redundant if it serves a different acquisition path, progression stage, or strategic purpose.

#### 3.3 — Detect dominant builds

Identify whether certain builds consistently outperform nearly every alternative.

A dominant build is not automatically a problem.

It becomes concerning when:

- It is optimal across almost every activity.
- It has no meaningful weaknesses.
- It makes other equipment or talents irrelevant.
- It requires no meaningful sacrifices.
- It removes incentives to experiment.
- It becomes mandatory for reasonable progression.

Distinguish between:

Healthy meta: Some builds are stronger, but alternatives remain useful.

Concentrated meta: A few builds dominate, but specialized alternatives exist.

Collapsed meta: One build or mechanic invalidates most other choices.

Provide evidence for each conclusion.

#### 3.4 — Evaluate the four-talent limit

Investigate whether four talent slots create interesting decisions.

Questions include:

- Are players forced to make meaningful sacrifices?
- Are some talents effectively mandatory?
- Are there enough competitive alternatives?
- Do certain combinations trivialize encounters?
- Are some talents only useful because of unintended interactions?
- Would adding more talents meaningfully expand build diversity?

Do not recommend changing the number of talent slots without demonstrating why the existing limit is insufficient.

### PART 4 — DEEP AUDIT OF THE EIGHT GAUGES

The gauge system is one of Bramo's central mechanical features.

Some effects fill gauges under specific combat conditions. Other effects trigger when gauges reach certain thresholds or consume stored resources.

This system is intended to provide mechanical identity beyond ordinary stat stacking.

Investigate it thoroughly.

#### 4.1 — Individual gauge usefulness

For each gauge, analyze:

- How it fills.
- How frequently it fills.
- What triggers its effects.
- What resources or opportunities it consumes.
- How often its effects activate in realistic combat.
- How much value it provides.
- Whether its value changes with encounter duration.
- Whether its value changes with enemy attack frequency.
- Whether its value changes with player equipment or talents.

Identify gauges that rarely activate or whose effects are practically irrelevant.

Also identify gauges that activate excessively and produce disproportionate benefits.

#### 4.2 — Gauge interactions

Analyze interactions between:

- Gauge generation.
- Gauge consumption.
- Talent effects.
- Equipment bonuses.
- Class-specific mechanics.
- Healing.
- Damage.
- Defensive effects.
- Triggered effects and chained activations.

Investigate whether feedback loops exist.

Examples include:

- An effect generates gauge resources that activate another effect.
- A defensive effect indirectly accelerates resource generation.
- A healing effect enables a resource loop.
- Multiple triggered effects amplify one another.
- Gauge generation becomes faster than consumption.

Detect infinite loops, unintended recursive triggers, runaway scaling, deadlocks, and unexpectedly powerful combinations.

Test them through the actual combat engine.

#### 4.3 — Is the system genuinely interesting?

Determine whether gauge optimization produces meaningful strategic decisions.

Or whether the system ultimately reduces to:

"Equip the items that fill gauges fastest and automatically win."

Investigate whether different gauges have genuinely different strengths.

Evaluate whether the system encourages adapting builds to encounters.

Important:

Do not recommend simplifying or removing the gauge system simply because it is complicated.

Complexity is acceptable when it produces meaningful decisions.

Complexity becomes a problem when it adds maintenance burden or player confusion without meaningful gameplay value.

### PART 5 — CLASS IDENTITY AND VIABILITY

Bramo currently has three primary classes, each intended to offer a distinct approach to combat.

The goal is not equal performance everywhere.

The goal is meaningful class identity and long-term viability.

#### 5.1 — Evaluate every class

For each class, determine:

- What it does particularly well.
- What it struggles with.
- Which mechanics define its identity.
- Whether its strengths are actually reflected in combat.
- Whether its weaknesses are meaningful.
- Whether it has several viable builds.
- Whether its mechanics remain relevant as progression increases.

Do not infer class identity purely from descriptions.

Measure actual performance.

#### 5.2 — Evaluate classes across activities

Compare every class in:

- Standard PvE progression.
- Sustained single-target combat.
- Burst-damage encounters.
- Long-duration boss encounters.
- Encounters emphasizing survival.
- Encounters emphasizing healing or utility.
- Dungeons and group activities, where implemented.
- Other implemented combat activities.

For planned activities, clearly label any hypothetical simulations.

A class does not need to dominate every activity.

For example, one class may excel at standard PvE progression, another at sustained boss damage, and another at defensive or utility-oriented encounters.

However, every class should have credible reasons to be selected.

#### 5.3 — Can every class progress?

This is critical.

If one class is weaker at PvE progression, determine whether it can still advance at a reasonable pace.

Compare the time and resources required for each class to overcome equivalent progression milestones.

A class being behind another by several stages may be acceptable.

A class requiring three months to accomplish what another does in three weeks may represent a serious problem, depending on its compensating strengths.

Do not judge viability solely from maximum stage reached.

#### 5.4 — Identify class obsolescence

Investigate whether any class:

- Has no meaningful competitive advantage.
- Is consistently inferior at comparable investment.
- Becomes irrelevant in later progression.
- Depends entirely on one overpowered interaction.
- Cannot use major parts of the equipment or talent ecosystem effectively.

Distinguish temporary meta disadvantages from structural class problems.

### PART 6 — PvE PROGRESSION AND DIFFICULTY

Bramo is a long-term idle game.

Players are expected to encounter progression walls.

Getting stuck is not inherently a problem.

In games such as Legend of Mushroom, players may remain at the same PvE stage for weeks while gradually improving their characters.

That is a legitimate progression model.

The important question is whether those walls are meaningful, understandable, and eventually surmountable.

#### 6.1 — Simulate progression over time

Simulate realistic player progression over:

- The first hour.
- The first day.
- The first week.
- The first month.
- Three months.
- Six months.
- One year, where current content and formulas support meaningful extrapolation.

Include different activity levels and optimization strategies.

Use actual resource acquisition rates, equipment progression, and upgrade costs.

Do not grant characters arbitrary gear upgrades without accounting for how those upgrades would be acquired.

If systems needed for a realistic long-term simulation are missing, state that explicitly.

#### 6.2 — Identify progression walls

For each simulated player, record:

- Where progression slows.
- Why progression slows.
- How long the wall lasts.
- What upgrades eventually overcome it.
- Whether build changes can overcome it sooner.
- Whether waiting and accumulating resources is the only solution.

Classify progression walls as:

Healthy wall: Progression slows, but there are credible ways to improve.

Strategic wall: A build adjustment or mechanical understanding can produce a breakthrough.

Investment wall: Additional progression or equipment is required.

Problematic wall: The player becomes stuck for unreasonable periods without meaningful opportunities or clear progression.

All three healthy wall types are acceptable.

The game should not require every wall to be solved through build optimization.

#### 6.3 — Raw power versus intelligent itemization

This is a particularly important experiment.

Create two otherwise equivalent characters.

Character A always equips the highest displayed-power items.

Character B selects items based on class-relevant stats, mechanical interactions, and build synergy.

Compare their progression.

Determine whether intelligent itemization creates meaningful advantages.

If both characters consistently progress at the same rate, investigate whether the itemization system is failing to reward player understanding.

Also test whether the displayed power score accurately reflects actual combat effectiveness.

If it does not, determine whether this is acceptable design or potentially misleading to players.

#### 6.4 — Difficulty curve

Analyze whether PvE difficulty scales sustainably.

Identify:

- Unexpected difficulty spikes.
- Excessively easy stretches.
- Unintended progression skips.
- Impossible encounters.
- Mechanics that become irrelevant at high progression.
- Scaling formulas that eventually produce pathological results.

Do not attempt to eliminate normal progression walls.

### PART 7 — EQUIPMENT AND ITEMIZATION AUDIT

Determine whether equipment choices create actual gameplay decisions.

#### 7.1 — Item usefulness

Evaluate the current equipment ecosystem.

Identify:

- Universally useful items.
- Class-specific items.
- Build-specific items.
- Situational items.
- Transitional progression items.
- Items with no credible practical use.

An item does not need to be useful at endgame to be valuable.

Early-game and transitional equipment can serve legitimate purposes.

However, an item that is inferior to another item in every meaningful situation, at equivalent acquisition cost and progression stage, may be redundant.

#### 7.2 — Set bonuses

Investigate whether gear sets:

- Create recognizable build archetypes.
- Offer meaningful advantages.
- Encourage synergy with talents and gauges.
- Require trade-offs.
- Remain useful as the game expands.
- Are excessively dependent on particular combinations.

Identify whether the optimal strategy is always to use the same set.

#### 7.3 — Stat relevance

Measure the actual contribution of each combat stat.

Determine whether some stats are effectively worthless.

Test their value across:

- Different classes.
- Different builds.
- Different progression levels.
- Different enemy types.
- Different encounter durations.

Identify stats that become disproportionately powerful or irrelevant as numbers grow.

Pay particular attention to multiplicative scaling, thresholds, diminishing returns, caps, and interactions between stats.

#### 7.4 — Itemization depth

Determine whether the equipment system has meaningful depth or simply creates an illusion of choice.

Do not equate having more items with having more meaningful decisions.

### PART 8 — FUTURE PvP VIABILITY

PvP is not yet implemented as a complete feature in Bramo.

Do not pretend otherwise.

However, evaluate whether the current combat architecture could support a meaningful PvP system later.

#### 8.1 — PvP compatibility

Investigate whether existing mechanics can reasonably support player-versus-player combat.

Consider:

- Burst damage.
- Sustained damage.
- Healing.
- Defensive effects.
- Gauge generation.
- Triggered effects.
- Crowd control, if present.
- Combat duration.
- Turn order or action timing.
- Power disparities.

Identify mechanics that might behave acceptably in PvE but become problematic in PvP.

#### 8.2 — Preliminary PvP experiments

If technically feasible, construct an isolated, clearly labeled experimental PvP simulation using the existing combat engine.

Do not modify production gameplay to make this possible.

Test:

- Equal-investment class matchups.
- Optimized versus casual builds.
- Defensive versus offensive builds.
- Moderate power disadvantages.
- Large power disadvantages.
- Potentially abusive gauge interactions.

These tests are exploratory, not validation of a finished PvP system.

If the existing engine cannot faithfully simulate PvP, explain what prevents it and what infrastructure would be needed.

#### 8.3 — Long-term PvP philosophy

Assess whether the game could support a PvP environment where:

- Classes have favorable and unfavorable matchups.
- Optimization matters.
- Equipment investment matters.
- Veterans retain meaningful progression advantages.
- No single class becomes universally dominant.
- Counter-builds exist.
- The meta can evolve.

Do not require every matchup to be 50/50.

A 60/40 matchup may be completely acceptable.

Even more uneven matchups may be acceptable when meaningful counters and alternative strengths exist.

The concern is systemic dominance, not mathematical symmetry.

### PART 9 — CAN BRAMO EXPAND WITHOUT BREAKING?

This is one of the highest-priority parts of the investigation.

Bramo is intended to receive new content over time.

The combat and progression systems must not depend on a permanently fixed set of classes, items, or mechanics.

#### 9.1 — Fourth-class stress test

Design a hypothetical fourth class with a genuinely distinct mechanical identity.

Do not implement it in production.

Investigate whether it can be integrated into the existing architecture.

Determine:

- Whether existing combat formulas support it.
- Whether the gauge system accommodates it.
- Whether talents can express its mechanics.
- Whether existing equipment systems support it.
- Whether it requires extensive class-specific exceptions.
- Whether it creates unintended interactions.
- Whether its addition invalidates existing classes.

The objective is not to design the perfect fourth class.

The objective is to test whether Bramo can accommodate one.

#### 9.2 — New mechanic stress test

Invent several plausible future mechanics, such as:

- A new resource interaction.
- A damage-over-time mechanic.
- A defensive counterattack mechanic.
- A resource conversion mechanic.
- A conditional support effect.

These are hypothetical test cases, not feature requests.

Determine whether each mechanic could be added cleanly.

Identify architectural constraints and dangerous interactions.

#### 9.3 — Equipment expansion

Simulate the addition of new equipment sets and talents.

Investigate whether new content can introduce meaningful alternatives without requiring constant power creep.

Determine whether the existing system encourages developers to make each new item numerically stronger than previous items.

If so, assess whether that approach is sustainable.

#### 9.4 — Scaling and future content

Stress-test numerical progression far beyond currently available content.

Look for:

- Numerical overflow.
- Unbounded multiplicative scaling.
- Unintended exponential growth.
- Defensive or healing immortality.
- Damage becoming meaningless.
- Permanent gauge loops.
- Encounter duration becoming unreasonable.
- Mechanics becoming obsolete at high progression.

Distinguish actual failures from speculative future risks.

#### 9.5 — Architectural extensibility

Assess how difficult it would be to add:

- New classes.
- New gauges or gauge interactions.
- New talents.
- New gear sets.
- New bosses.
- New encounter mechanics.
- New combat activities.
- PvP-specific rules.

Identify whether adding content requires modifying core combat code repeatedly.

A robust system should allow substantial content expansion through data and well-defined mechanics rather than endless hardcoded exceptions.

### PART 10 — ECONOMY, REWARDS, AND LONG-TERM PROGRESSION

Combat balance cannot be evaluated independently from acquisition and progression.

A powerful build is not necessarily problematic if it requires substantial investment.

A weaker build may remain valuable if it is accessible much earlier.

Investigate:

- Equipment acquisition rates.
- Upgrade costs.
- Resource income.
- Progression bottlenecks.
- Crafting relevance.
- Reward scaling.
- Gear replacement frequency.
- Resource inflation.
- Long-term resource sinks.

Test whether players can realistically acquire the equipment required by the builds being evaluated.

A theoretically optimal build that requires impossibly rare combinations should not be treated as the standard player experience.

Evaluate whether long-term progression continues to provide meaningful goals.

Identify whether new content would require unsustainable increases in rewards or character power.

If relevant economic systems are incomplete, separate verified findings from assumptions.

### PART 11 — SIMULATION ENGINEERING AND VALIDITY

Your conclusions must be based on reliable experiments.

This is not a request for speculative balance opinions.

#### 11.1 — Use the actual game engine

Whenever possible, run simulations using the same combat logic as the production game.

Avoid maintaining a separate approximation that gradually diverges from the real implementation.

If a separate simulator is necessary, verify it against the production engine using representative test cases.

#### 11.2 — Reproducibility

Every important experiment must record:

- Game version or commit.
- Simulation configuration.
- Character builds.
- Progression investment.
- Encounter configuration.
- Random seeds.
- Number of repetitions.
- Measured outcomes.

Results must be reproducible.

#### 11.3 — Statistical reliability

Do not draw conclusions from a handful of battles.

Use enough repetitions to distinguish meaningful differences from randomness.

Report uncertainty where appropriate.

Use paired comparisons with shared random seeds when possible.

Do not treat a 51% win rate as meaningfully different from 49% without sufficient evidence.

#### 11.4 — Avoid biased optimization

Do not compare a carefully optimized build against a deliberately terrible build and conclude that the system has excellent strategic depth.

Compare realistic player strategies.

Ensure optimization algorithms receive equivalent information and resource constraints.

Use independent validation encounters to reduce the risk of overfitting builds to specific tests.

#### 11.5 — Separate structural issues from tuning issues

For every identified problem, classify it as:

Structural issue: The design or architecture fundamentally prevents the intended behavior.

Balance issue: The mechanic works but its numerical values need adjustment.

Content issue: The system works but lacks sufficient variety or supporting content.

Progression issue: Acquisition rates, rewards, or scaling produce undesirable outcomes.

Usability issue: The mechanic is meaningful but difficult for players to understand.

No issue: The observed behavior is acceptable or desirable.

This distinction is essential.

Do not recommend redesigning an entire mechanic when changing a coefficient would solve the problem.

Conversely, do not recommend numerical tuning for a fundamentally broken interaction.

### PART 12 — ADVERSARIAL VALIDATION

Before finalizing your conclusions, actively attempt to disprove them.

If you conclude that a talent is useless, search for realistic builds and encounters where it becomes valuable.

If you conclude that a class is weak, attempt to find a viable specialization.

If you conclude that a build is dominant, search for counters, trade-offs, acquisition constraints, and encounters where it struggles.

If you conclude that a gauge is overpowered, determine whether its strength depends on an unrealistic test configuration.

If you conclude that a progression wall is unhealthy, investigate whether it is intentional and whether realistic progression eventually resolves it.

Do not defend an initial conclusion merely because you already wrote it.

Revise conclusions when new evidence contradicts them.

Clearly distinguish:

- Verified findings.
- Strongly supported interpretations.
- Weak evidence.
- Untested hypotheses.

### PART 13 — REPORT FOR A NON-GAME-DESIGNER

The owner of Bramo is an independent developer, not a professional game systems designer.

Your report must be understandable without requiring expertise in game theory, statistics, or balancing.

Avoid presenting hundreds of technical metrics without interpretation.

For every significant finding, explain:

1. What happens?
2. Why does it happen?
3. Why does it matter to an actual player?
4. Is it genuinely a problem?
5. What happens if we leave it unchanged?
6. What would you recommend, and why?

Use concrete examples from Bramo.

For example:

"An optimized Runist can clear 12% more stages than a casual Runist at equivalent investment because of improved gauge generation. This suggests the build system rewards understanding its mechanics."

Or:

"This equipment set is used in 85% of optimized builds across all three classes. It has almost no meaningful weaknesses, suggesting it may reduce build diversity."

These are illustrative examples, not expected results.

Do not fabricate statistics.

#### 13.1 — Executive verdict

Provide a clear assessment of whether Bramo's current systems are:

- Ready to expand.
- Viable but requiring targeted corrections.
- Functional but structurally limited.
- In need of significant redesign.
- Too incomplete to evaluate reliably.

Explain your conclusion.

#### 13.2 — System scorecard

Evaluate each major system on:

- Mechanical correctness.
- Strategic depth.
- Build diversity.
- Class viability.
- Progression sustainability.
- Long-term extensibility.
- Simulation confidence.

Use clear qualitative assessments supported by evidence.

Do not assign arbitrary numerical scores simply to make the report look precise.

#### 13.3 — Priority classification

Classify recommendations as:

P0 — Critical: Fundamental failures that threaten the game's viability.

P1 — Important: Significant problems worth resolving before broad expansion or public testing.

P2 — Improvement: Worthwhile changes that can reasonably wait.

P3 — Optional: Design preferences, polish, or speculative improvements.

Do not label every imperfection as critical.

#### 13.4 — Recommended action

For each major problem, state whether the appropriate response is:

- Keep as-is.
- Adjust numerical values.
- Improve existing mechanics.
- Add supporting content.
- Refactor the architecture.
- Redesign the mechanic.
- Defer until real player data exists.

Explain the expected benefit and possible downsides.

### PART 14 — DESIGN A PERMANENT VALIDATION FRAMEWORK

Bramo will continue evolving.

We need to avoid repeating a massive manual audit every time a new item or talent is added.

Investigate how to establish a reusable validation framework.

It should be capable of detecting:

- Newly dominant builds.
- Newly useless talents.
- Class performance regressions.
- Broken gauge interactions.
- Unexpected progression changes.
- Numerical scaling problems.
- Major differences between optimized and casual builds.
- Equipment sets that invalidate previous options.

Propose a practical automated testing strategy that can be integrated into the development workflow.

Prefer:

- Deterministic regression tests.
- Reusable combat scenarios.
- Build-search tools.
- Progression simulations.
- Automated comparison against previous versions.
- Clear reporting of significant changes.

Avoid proposing an excessively complicated multi-agent infrastructure when ordinary scripts and tests would accomplish the same work.

If an AI agent would provide genuine value, explain exactly what it should do that deterministic testing cannot.

The objective is a maintainable system, not an impressive-looking architecture.

### PART 15 — EXECUTION RULES

Follow these rules throughout the investigation.

Rule 1 — Do not change gameplay

This is an investigation, not an implementation mission.

Do not modify production balancing, class mechanics, items, talents, progression, or combat behavior.

You may create isolated simulation tools, tests, reports, and experimental branches where necessary.

Rule 2 — Evidence before recommendations

Never recommend a major redesign based only on intuition.

Verify claims through code inspection, mathematical analysis, simulations, or reproducible experiments.

Rule 3 — Do not chase perfect balance

Bramo is allowed to have a meta.

Some classes may be stronger than others.

Some equipment sets may be preferred.

Some builds may be substantially more powerful.

That is acceptable when the overall ecosystem still offers meaningful choices and opportunities.

Rule 4 — Losing is not automatically a problem

A character losing to a boss does not prove the build is bad.

A player remaining stuck at a PvE stage does not prove progression is broken.

An optimized build losing against stronger content is normal.

Evaluate whether the result is consistent with the intended progression model.

Rule 5 — Preserve meaningful progression

Intelligent builds should matter.

Long-term investment should also matter.

Neither should completely invalidate the other.

Rule 6 — Challenge the existing design

Do not protect the current architecture because development effort has already been invested.

If something is fundamentally flawed, say so.

But also do not recommend replacing a working system simply because a different design would be easier to balance.

Rule 7 — Respect the development stage

Bramo is still under development.

Do not treat unfinished content as evidence of a broken system.

However, identify incomplete systems that prevent meaningful validation.

Rule 8 — No invented results

Do not claim to have simulated anything that was not actually executed.

If computational limits prevent exhaustive testing, explain what was tested and what remains uncertain.

Rule 9 — Manage computational cost

Begin with representative scenarios and small-scale validation.

Expand into larger simulations only when the infrastructure has been verified.

Use efficient search methods instead of blindly brute-forcing impossible combinations.

Rule 10 — Do not over-engineer

The owner is a solo developer.

Favor practical solutions that can be maintained and extended without a dedicated balancing department.

### PART 16 — DELIVERABLES

Create a dedicated audit directory within the repository, following existing project conventions.

Provide:

1. Executive Report — A readable summary of Bramo's overall system viability.
2. Combat & Build Analysis — Detailed class, equipment, talent, and gauge findings.
3. Progression Analysis — Simulated progression, difficulty walls, and investment-versus-optimization results.
4. Extensibility Assessment — Findings from hypothetical class, mechanic, and equipment expansion tests.
5. PvP Readiness Assessment — What the current systems support and what remains unverified.
6. Simulation Evidence — Reproducible configurations, raw results, and relevant scripts.
7. Prioritized Recommendations — A concise list of actual problems, ordered by severity.
8. Future Validation Plan — A practical proposal for ongoing automated system testing.

Where helpful, include charts showing performance differences, progression curves, build distributions, and class comparisons.

Avoid generating enormous unreadable reports.

The executive summary should be approachable, while detailed evidence remains available separately.

### FINAL QUESTION — THE MOST IMPORTANT ONE

After completing the investigation, answer this question clearly:

"If Bramo launches with its current combat and progression foundations, can we realistically keep adding classes, equipment, talents, bosses, mechanics, and activities for years while preserving meaningful character progression, strategic build choices, and viable class identities?"

If yes, explain why.

If no, identify precisely what prevents it.

If the answer is conditional, identify the conditions.

Then answer five additional questions:

1. Do player decisions genuinely matter, or does raw power dominate almost everything?
2. Do the three classes have meaningful reasons to exist, or is one class objectively the best choice in nearly every situation?
3. Do equipment sets, talents, and gauges produce genuinely different builds, or merely different ways to achieve similar numbers?
4. Is the system sustainable for long-term idle progression, including months or years of accumulated power?
5. What are the three most important things we should address before expanding the game further?

Be independent, critical, and evidence-driven.

Do not flatter the developer.

Do not search for problems simply to justify changes.

Do not assume that complex systems are automatically good or that simpler systems are automatically better.

The objective is not to make Bramo perfectly balanced. The objective is to determine whether Bramo is a strong, expandable, and genuinely interesting game system worth building upon.

### EXECUTION ORDER

This is a substantial investigation. Do not attempt to complete it through a single superficial pass.

1. Inspect the repository and existing simulations.
2. Establish what can actually be tested.
3. Validate the simulation infrastructure.
4. Execute the combat, build, and class experiments.
5. Execute progression and long-term scaling experiments.
6. Perform extensibility and PvP-readiness stress tests.
7. Challenge preliminary findings.
8. Produce the final evidence-backed reports.

Work through the phases systematically.

If the investigation spans multiple working sessions, preserve completed results and the remaining work in the repository so that progress is not lost.

Do not repeatedly restart the investigation from scratch.

Do not make gameplay changes without explicit approval.

Begin the audit.
