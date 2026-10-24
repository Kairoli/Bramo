import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/node/index.js';
import { characterForce, combatantOf } from '../src/combat/progress.js';
import { fight } from '../src/combat/engine.js';
import { applyPower, forceOf, nodeCost, powerTotals, settlePower, upgradeBlocker, upgradeNode } from '../src/power/power.js';
import { powerConfigSchema, powerSystemSchema } from '../src/schemas/power.js';
import type { Content } from '../src/schemas/content.js';
import { HOUR, T0, makeState } from './fixture.js';

// Le moteur de Puissance se teste sur data/ (classes, combat), avec des systèmes d'essai écrits ici : on vérifie des règles.
const base = loadContent(fileURLToPath(new URL('../../../data', import.meta.url)));
const research = powerSystemSchema.parse({
  id: 'research',
  name: 'Recherches',
  kind: 'research',
  nodes: [
    { id: 'edge', name: 'Fil', maxLevel: 5, cost: { gold: { base: 100, growth: 2 }, items: [{ item: 'copper_ore', base: 10, growth: 1.5 }] }, durationSec: { base: 60 }, perLevel: [{ stat: 'power', pct: 0.02 }] },
    { id: 'hide', name: 'Peau', maxLevel: 3, requires: [{ node: 'edge', level: 2 }], perLevel: [{ stat: 'maxHp', flat: 100 }, { stat: 'evasion', flat: 0.02 }] },
    { id: 'arena', name: 'Lice', perLevel: [{ stat: 'power', pct: 0.1, in: ['arena'] }] },
  ],
});
const relics = powerSystemSchema.parse({
  id: 'relics',
  name: 'Reliques',
  kind: 'collection',
  unlock: { classLevel: 10 },
  nodes: [
    { id: 'lamp', name: 'Lampe', maxLevel: 3, choice: 'a', perLevel: [{ stat: 'combo', flat: 0.1 }], talents: [{ level: 2, talent: { id: 'lamp_t', name: 'Lampe', effects: [{ when: 'basic', do: { gain: { pool: 'tisons', n: 1 } } }], pools: { tisons: 2 } } }], force: 0.5 },
    { id: 'bell', name: 'Cloche', choice: 'a', perLevel: [{ stat: 'counter', flat: 0.1 }] },
  ],
});
const content: Content = { ...base, power: { config: powerConfigSchema.parse({ caps: { evasion: 0.05, combo: 0.5 } }), systems: [research, relics] } };
const hero = (over: Parameters<typeof makeState>[0] = {}) => makeState({ classId: 'forgefire', gold: 10_000, inventory: { copper_ore: 1000 }, ...over });

describe('moteur de Puissance : nœuds, coûts, recherches', () => {
  it('le coût grandit niveau par niveau', () => {
    expect(nodeCost(research.nodes[0]!, 1)).toEqual({ gold: 100, items: [{ item: 'copper_ore', qty: 10 }], seconds: 60 });
    expect(nodeCost(research.nodes[0]!, 3)).toEqual({ gold: 400, items: [{ item: 'copper_ore', qty: 23 }], seconds: 60 });
  });

  it('une recherche se paie tout de suite et compte à la fin de son minuteur', () => {
    const s = upgradeNode(hero(), content, 'research', 'edge', T0);
    expect(s.gold).toBe(9_900);
    expect(s.inventory.copper_ore).toBe(990);
    expect(s.power!.research!.levels.edge ?? 0).toBe(0);
    expect(upgradeBlocker(s, content, 'research', 'edge', T0 + 1000)).toBe('Une recherche est déjà en cours.');
    const done = settlePower(s, T0 + 60_000);
    expect(done.power!.research!.levels.edge).toBe(1);
    expect(done.power!.research!.pending).toEqual([]);
    expect(settlePower(done, T0 + HOUR)).toBe(done);
  });

  it('prérequis, maximum, choix exclusif, ouverture par le niveau de classe', () => {
    expect(upgradeBlocker(hero(), content, 'research', 'hide', T0)).toBe('Demande Fil niveau 2.');
    const maxed = hero({ power: { research: { levels: { edge: 5 }, pending: [] } } });
    expect(upgradeBlocker(maxed, content, 'research', 'edge', T0)).toBe('Au niveau maximum.');
    expect(upgradeBlocker(hero(), content, 'relics', 'lamp', T0)).toBe("S'ouvre au niveau 10 de classe.");
    const lvl10 = hero({ combat: { ...hero().combat, xp: { forgefire: content.xpTable[10]! } } });
    const lamp = upgradeNode(lvl10, content, 'relics', 'lamp', T0);
    expect(lamp.power!.relics!.levels.lamp).toBe(1);
    expect(upgradeBlocker(lamp, content, 'relics', 'bell', T0)).toBe('Un autre choix de ce groupe est déjà pris.');
    expect(upgradeBlocker(hero({ gold: 0 }), content, 'research', 'edge', T0)).toBe('Il faut 100 or.');
  });
});

describe('moteur de Puissance : ce que ça donne au combat', () => {
  const strong = hero({
    combat: { ...hero().combat, xp: { forgefire: content.xpTable[20]! } },
    power: { research: { levels: { edge: 5, hide: 3, arena: 1 }, pending: [] }, relics: { levels: { lamp: 2 }, pending: [] } },
  });

  it('sans système, rien ne change ; avec, les bonus s’additionnent par niveau et selon le contenu', () => {
    const plain = hero({ combat: strong.combat });
    expect(combatantOf(plain, content)).toEqual(combatantOf(plain, base));
    const t = powerTotals(strong, content);
    expect(t.pct.power).toBeCloseTo(0.1, 9);
    expect(t.flat.maxHp).toBe(300);
    expect(t.flat.combo).toBeCloseTo(0.2, 9);
    expect(t.talents.map((x) => x.id)).toEqual(['lamp_t']);
    expect(t.force).toBe(1);
    expect(powerTotals(strong, content, 'arena').pct.power).toBeCloseTo(0.2, 9);
  });

  it('les statistiques : +% sur la Puissance, points ajoutés, plafonds', () => {
    const ref = content.combat!.rules.referenceStats;
    const s = applyPower(ref, powerTotals(strong, content), content.power!.config, content.combat!.rules);
    expect(s.power).toBeCloseTo(ref.power * 1.1, 6);
    expect(s.maxHp).toBe(ref.maxHp + 300);
    expect(s.evasion).toBe(0.05);
    expect(s.combo).toBeCloseTo(0.2, 9);
  });

  it('le combattant reçoit stats, talents et réserves ; la Force monte', () => {
    const setup = combatantOf(strong, content);
    expect(setup.talents?.some((t) => t.id === 'lamp_t')).toBe(true);
    expect(setup.pools?.tisons).toBeGreaterThan(content.combat!.talents!.pools.find((p) => p.id === 'tisons')!.max);
    const weak = hero({ combat: strong.combat });
    expect(characterForce(strong, content)).toBeGreaterThan(characterForce(weak, content));
    const ref = content.combat!.rules.referenceStats;
    // À l'équipement de référence : exactement `scale` ; un palier de plus (×1,096 de vraie force) : ×1,096^7 ≈ ×1,9.
    expect(forceOf(ref, content.power!.config, ref)).toBe(10_000);
    expect(forceOf({ ...ref, power: ref.power * 1.096 ** 2 }, content.power!.config, ref) / 10_000).toBeCloseTo(1.096 ** 7, 3);
  });
});

describe('statistiques spéciales (combo, contre-attaque, esquive, régénération)', () => {
  const combat = base.combat!;
  const enc = combat.encounters.duel!;
  const me = combatantOf(hero({ combat: { ...hero().combat, xp: { forgefire: base.xpTable[20]! } } }), base);
  const run = (stats: Record<string, number>) => fight(combat, [{ ...me, stats: { ...combat.rules.referenceStats, ...me.stats, ...stats } }], enc, { seed: 4 }).team[0]!.metrics;

  it('à 0, aucun effet : le combat est identique (aucun tirage de plus)', () => {
    const ref = fight(combat, [me], enc, { seed: 4 });
    expect(fight(combat, [{ ...me, stats: { ...combat.rules.referenceStats, ...me.stats, combo: 0, counter: 0, evasion: 0, regen: 0 } }], enc, { seed: 4 })).toEqual(ref);
  });

  it('chacune agit', () => {
    expect(run({ combo: 1 }).combos).toBeGreaterThan(0);
    expect(run({ counter: 1 }).counters).toBeGreaterThan(0);
    expect(run({ evasion: 1 }).hpLost ?? 0).toBeLessThan(run({}).hpLost!);
    expect(run({ regen: 0.01 }).regen).toBeGreaterThan(0);
  });
});
