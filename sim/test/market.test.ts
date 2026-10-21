import { describe, expect, it } from 'vitest';
import { loadVariant } from '../src/load.js';
import { runWorld } from '../src/market/world.js';

describe('simulation du marché', () => {
  const content = loadVariant();
  const r = runWorld(content, { players: 12, days: 20, seed: 3, initialShare: 0.5, joinDays: 8 });

  it('l’or est conservé : départ + commandes PNJ − taxe − réparations PNJ − étal − bâtiments de clan', () => {
    const joined = r.bots.filter((b) => b.level > 0).length;
    const inflow = r.days.reduce((s, d) => s + d.gold.npc, 0);
    const outflow = r.days.reduce((s, d) => s + d.gold.tax + d.gold.pnjRepair + d.gold.stall + d.gold.clan, 0);
    const expected = joined * content.settings.character.startingGold + inflow - outflow;
    expect(r.days.at(-1)!.goldSupply).toBeCloseTo(expected, -1);
  });

  it('même graine, même résultat', () => {
    const again = runWorld(content, { players: 12, days: 20, seed: 3, initialShare: 0.5, joinDays: 8 });
    expect(again.days.at(-1)!.goldSupply).toBe(r.days.at(-1)!.goldSupply);
    expect(again.bots.map((b) => b.gold)).toEqual(r.bots.map((b) => b.gold));
  });

  it('les joueurs travaillent et les échanges ont lieu', () => {
    expect(r.days.some((d) => d.trades > 0)).toBe(true);
    expect(Math.max(...r.bots.map((b) => b.level))).toBeGreaterThan(5);
  });
});
