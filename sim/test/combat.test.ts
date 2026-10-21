import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT, loadVariant } from '../src/load.js';
import { runCase } from '../src/scenarios/combat.js';

describe('combat : moteur réel et banc du dossier', () => {
  const combat = loadVariant().combat!;
  const banc = JSON.parse(readFileSync(join(ROOT, 'sim', 'reference', 'banc-coeur-v0.2.json'), 'utf8')) as {
    baselines: { level: number; plan: string; encounter: string; medianTime: number }[];
  };

  it('retrouve les temps du banc Python en kit seul (ouverture « séquence ») à quelques pour cent près', () => {
    const median = (xs: number[]) => {
      const s = [...xs].sort((a, b) => a - b);
      return s.length % 2 ? s[s.length >> 1]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
    };
    const deltas = banc.baselines.map((b) => {
      const times = Array.from({ length: 12 }, (_, seed) => runCase(combat, { plan: b.plan, level: b.level, encounter: b.encounter, opening: 'sequence', danger: 1, variant: 'plan' }, seed))
        .filter((r) => r.win)
        .map((r) => r.time);
      expect(times.length, `${b.plan} ${b.level} ${b.encounter}`).toBe(12);
      return Math.abs(median(times) / b.medianTime - 1);
    });
    expect(median(deltas)).toBeLessThan(0.02);
    expect(Math.max(...deltas)).toBeLessThan(0.08);
  });
});

describe('combat : propositions', () => {
  it('une proposition ne change que ce qu’elle écrit (paramètres de voie, plans ajoutés) et reste validée', () => {
    const base = loadVariant().combat!;
    const p = loadVariant('combat-voies-v1').combat!;
    expect(p.paths.red_temper!.params.perHeat).toBe(0.22);
    expect(p.paths.red_temper!.params.hits).toBe(base.paths.red_temper!.params.hits);
    expect(p.paths.fulgurant).toEqual(base.paths.fulgurant);
    expect(p.plans.fulgurant_advised?.levels['80']).toHaveLength(5);
    expect(Object.keys(p.plans).length).toBe(Object.keys(base.plans).length + 9);
  });
});
