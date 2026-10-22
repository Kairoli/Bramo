import { describe, expect, it } from 'vitest';
import { resolveLoadout } from '@bramo/shared';
import { makeLab, play } from '../src/coherence/lab.js';
import { ARCHETYPES, archetypeSpec, makeBuild, situationSpecs } from '../src/scenarios/combat-build.js';
import { referenceStats } from '../src/scenarios/combat-coherence.js';
import { join } from 'node:path';
import { baseGearFile, planWeapons, readGearFile } from '../src/scenarios/combat-weapons.js';
import { PROPOSALS_DIR } from '../src/load.js';

describe('cohérence : proposition coherence-v1', () => {
  const lab = makeLab('coherence-v1');

  it('le témoin palier 20 Rare mixte retrouve les statistiques de référence (moyenne des classes)', () => {
    const classes = Object.keys(lab.combat.kits);
    const mean = (f: (s: ReturnType<typeof referenceStats>) => number) => classes.reduce((a, c) => a + f(referenceStats(lab, c)), 0) / classes.length;
    const ref = lab.combat.rules.referenceStats;
    expect(mean((s) => s.power) / ref.power).toBeCloseTo(1, 1);
    expect(mean((s) => s.maxHp) / ref.maxHp).toBeCloseTo(1, 1);
    expect(mean((s) => s.damageReduction)).toBeCloseTo(ref.damageReduction, 1);
  });

  it('chaque gemme, nommé et ensemble du catalogue se résout dans le budget, et se joue', () => {
    const rules = { majors: 4, setPieces: 8, preps: 1 };
    const choices = [
      ...lab.catalog.gems.map((g) => ({ gems: [g.id] })),
      ...lab.catalog.named.map((n) => ({ named: [n.id] })),
      ...lab.catalog.sets.map((s) => ({ sets: { [s.id]: 4 } })),
    ];
    for (const choice of choices) {
      const r = resolveLoadout(lab.catalog, lab.tools, choice, rules);
      expect(r.errors).toEqual([]);
      const res = play(lab, 'red_temper', { id: 'x', stats: referenceStats(lab, 'forgefire'), talents: r.talents, tools: r.tools }, lab.combat.encounters.duel!, 1, 1);
      expect(res.time).toBeGreaterThan(0);
    }
  });
});

describe('cohérence : build v2 (coherence-v2)', () => {
  const lab = makeLab('coherence-v2', 'coherence-zones-v2,coherence-bosses-v1');

  it('le catalogue des dix paliers : chaque palier et chaque rareté existent pour chaque emplacement, ensembles de 40 à 90', () => {
    const models = Object.values(lab.content.gearModels).filter((m) => !m.starter);
    const tiers = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90];
    for (const t of tiers) for (const slot of ['head', 'torso', 'hands', 'legs', 'feet', 'cape', 'belt', 'necklace', 'ring', 'weapon']) for (const r of ['common', 'rare', 'epic', 'legendary']) {
      expect(models.some((m) => m.tier === t && m.slot === slot && m.rarity === r && !m.set && !m.named)).toBe(true);
    }
    const sets = models.filter((m) => m.set);
    expect(Math.min(...sets.map((m) => m.tier))).toBe(40);
    expect(new Set(sets.map((m) => m.set)).size).toBe(15);
  });

  it('les gardiens de région rejoignent les zones, et chaque archétype de chaque classe se construit dans le budget', () => {
    expect(lab.encounters.filter((e) => /^b\d_/.test(e.id))).toHaveLength(6);
    for (const path of ['red_temper', 'trapper', 'glyphkeeper']) for (const a of ARCHETYPES) expect(() => makeBuild(lab, path, archetypeSpec(lab, path, a))).not.toThrow();
  });

  it('armes à valeur égale : chaque arme du palier 20 Rare donne le même indice de mur à 1 % près, et seules les armes changent', () => {
    const base = readGearFile(baseGearFile(join(PROPOSALS_DIR, 'coherence-v2')));
    const fresh = makeLab('coherence-v2', 'coherence-zones-v2');
    fresh.content.gearModels = Object.fromEntries(base.map((m) => [m.id, m]));
    const plan = planWeapons(fresh);
    for (const w of plan.weapons) expect(Math.abs(w.after.index / plan.target - 1)).toBeLessThan(0.01);
    const before = base;
    const after = Object.values(lab.content.gearModels);
    expect(after.map((m) => m.id)).toEqual(before.map((m) => m.id));
    const changed = after.filter((m, i) => JSON.stringify(m.stats) !== JSON.stringify(before[i]!.stats));
    expect(changed.every((m) => m.slot === 'weapon')).toBe(true);
  }, 30_000);

  it('une réponse de situation garde 10 pièces d’ensemble au plus, avec le 4 pièces de la famille', () => {
    for (const a of ARCHETYPES) {
      const farm = archetypeSpec(lab, 'trapper', a);
      for (const f of ['interstice', 'rain', 'impact', 'beat', 'fracture', 'breath']) {
        const [set, gem] = situationSpecs(lab, 'trapper', farm, f);
        const pieces = Object.values(set!.spec.sets);
        expect(pieces.reduce((x, n) => x + n, 0)).toBeLessThanOrEqual(10);
        expect(Object.entries(set!.spec.sets).some(([id, n]) => n === 4 && lab.catalog.sets.find((s) => s.id === id)?.family === f)).toBe(true);
        expect(() => makeBuild(lab, 'trapper', set!.spec)).not.toThrow();
        expect(() => makeBuild(lab, 'trapper', gem!.spec)).not.toThrow();
      }
    }
  });
});
