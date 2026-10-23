import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/node/index.js';
import { advance } from '../src/engine/advance.js';
import { combatantOf, emptyCombat, routeStages, startRoute } from '../src/combat/progress.js';
import { activePrep, potionsFor, readSupplies, stockSupplies, unstockSupplies } from '../src/combat/supplies.js';
import { HOUR, T0, makeState } from './fixture.js';

const content = loadContent(fileURLToPath(new URL('../../../data', import.meta.url)));

const runist = (level: number, inventory: Record<string, number> = {}) =>
  makeState({
    classId: 'runist',
    inventory,
    combat: { ...emptyCombat(), xp: { runist: content.xpTable[level]! } },
    equipment: Object.values(content.gearModels)
      .filter((m) => m.starter && m.classes.includes('runist'))
      .map((m) => ({ model: m.id, lines: [] })),
  });

describe('fournitures de combat', () => {
  it('on emporte potions et préparations du sac, on peut les reprendre', () => {
    const s = stockSupplies(runist(10, { minor_healing_potion: 5, drive_oil: 2, iron_ore: 3 }), 'minor_healing_potion', 4, content);
    expect(s.inventory.minor_healing_potion).toBe(1);
    expect(readSupplies(s.combat.supplies).potions.minor_healing_potion).toBe(4);
    expect(() => stockSupplies(s, 'iron_ore', 1, content)).toThrow(/potion/);
    expect(() => stockSupplies(s, 'drive_oil', 3, content)).toThrow(/sac/);
    const back = unstockSupplies(s, 'minor_healing_potion', 10);
    expect(back.inventory.minor_healing_potion).toBe(5);
    expect(readSupplies(back.combat.supplies).potions.minor_healing_potion).toBeUndefined();
  });

  it('la potion la plus forte part au combat, et la préparation donne son outil de situation', () => {
    let s = runist(30, { minor_healing_potion: 3, frost_tonic: 3, drive_oil: 2 });
    s = stockSupplies(s, 'minor_healing_potion', 3, content);
    s = stockSupplies(s, 'frost_tonic', 3, content);
    s = stockSupplies(s, 'drive_oil', 2, content);
    expect(potionsFor(s, content)?.item).toBe('frost_tonic');
    expect(potionsFor(s, content)?.count).toBe(content.combat!.rules.supplies!.potionsPerFight);
    expect(activePrep(s, content)).toBe('drive_oil');
    const setup = combatantOf(s, content);
    expect(setup.potions?.heal).toBe(content.items.frost_tonic!.potion!.heal);
    expect(setup.tools?.some((t) => t.id === 'drive_oil')).toBe(true);
  });

  it('sur la route, la préparation s’use au temps de combat et la suivante prend le relais ; les potions bues disparaissent', () => {
    let s = runist(20, { drive_oil: 2, minor_healing_potion: 50 });
    s = stockSupplies(s, 'drive_oil', 2, content);
    s = stockSupplies(s, 'minor_healing_potion', 50, content);
    // Une étape dure pour boire des potions : le gardien du premier chapitre.
    const stages = routeStages(content.combat!);
    s.combat.route = { stage: 9, best: 9 };
    s = startRoute(s, T0, content, 9);
    const { state } = advance(s, T0 + 3 * HOUR, content);
    const sup = readSupplies(state.combat.supplies);
    expect(sup.preps.drive_oil ?? 0).toBe(0);
    expect(sup.active === null || sup.active.leftMs <= 60 * 60_000).toBe(true);
    expect(sup.potions.minor_healing_potion ?? 0).toBeLessThan(50);
    expect(stages.length).toBeGreaterThan(9);
  });
});
