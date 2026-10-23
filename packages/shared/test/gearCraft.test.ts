import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/node/index.js';
import { craftGear, craftableModels, gearRecipe, isCraftable } from '../src/engine/gearCraft.js';
import { makeState } from './fixture.js';

const content = loadContent(fileURLToPath(new URL('../../../data', import.meta.url)));
const models = Object.values(content.gearModels);
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('fabrication de l’équipement', () => {
  it('chaque modèle fabricable a une recette ; ensembles, nommés et set de départ ne se fabriquent pas', () => {
    const craftable = models.filter((m) => isCraftable(m, content));
    expect(craftable.length).toBeGreaterThan(2500);
    for (const m of craftable.slice(0, 400)) {
      const r = gearRecipe(m.id, content)!;
      expect(r.level).toBe(Math.max(1, Math.round(m.tier * content.gearCrafting!.levelPerTier)));
      expect(r.inputs.length).toBeGreaterThan(0);
      for (const i of r.inputs) expect(content.items[i.item]).toBeDefined();
    }
    for (const m of models.filter((x) => x.set || x.talent || x.starter).slice(0, 50)) expect(gearRecipe(m.id, content)).toBeNull();
    // Tous les métiers d'équipement ont de quoi faire.
    for (const p of ['smithing', 'tanning', 'tailoring', 'jewelcrafting', 'carpentry', 'enchanting']) expect(craftableModels(p, content).length).toBeGreaterThan(0);
  });

  it('plus haut palier et plus rare : plus de matière et plus de temps', () => {
    const torso = (tier: number, rarity: string) => models.find((m) => m.slot === 'torso' && m.family === 'armor' && m.tier === tier && m.rarity === rarity && isCraftable(m, content))!;
    const a = gearRecipe(torso(1, 'common').id, content)!;
    const b = gearRecipe(torso(40, 'common').id, content)!;
    const c = gearRecipe(torso(40, 'legendary').id, content)!;
    expect(b.inputs[0]!.qty).toBeGreaterThan(a.inputs[0]!.qty);
    expect(c.inputs[0]!.qty).toBeGreaterThan(b.inputs[0]!.qty);
    expect(c.durationSec).toBeGreaterThan(b.durationSec);
    expect(c.xp).toBeGreaterThan(b.xp);
  });

  it('fabriquer : niveau et matières requis, matières prises, XP gagnée, lignes tirées', () => {
    const m = models.find((x) => x.slot === 'head' && x.family === 'armor' && x.tier === 1 && x.rarity === 'rare' && isCraftable(x, content))!;
    const r = gearRecipe(m.id, content)!;
    const inv = Object.fromEntries(r.inputs.map((i) => [i.item, i.qty + 1]));
    const s = makeState({ inventory: inv });
    const out = craftGear(s, m.id, content, rand, 'Brann');
    for (const i of r.inputs) expect(out.state.inventory[i.item]).toBe(1);
    // Un métier neuf : l'XP du début compte double (settings.xp.earlyBoost).
    expect(out.state.skills[r.profession]).toBeCloseTo(r.xp * (content.settings.xp.earlyBoost?.multiplier ?? 1), 5);
    expect(out.gear.model).toBe(m.id);
    expect(out.gear.lines.length).toBeGreaterThanOrEqual(m.rolls[0]);
    expect(() => craftGear(makeState({}), m.id, content, rand)).toThrow(/manque/);
    const high = models.find((x) => x.tier === 40 && isCraftable(x, content))!;
    expect(() => craftGear(makeState({ inventory: inv }), high.id, content, rand)).toThrow(/niveau 32/);
  });
});
