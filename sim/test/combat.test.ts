import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildContent } from '@bramo/shared';
import { readRawContent } from '@bramo/shared/node';
import { DATA_DIR, ROOT, loadVariant, patchCombat } from '../src/load.js';
import { dossierCombat, runCase } from '../src/scenarios/combat.js';

describe('combat : moteur réel et banc du dossier', () => {
  // Le banc a joué les chiffres du dossier v0.2, pas l'équilibrage actuel de data/.
  const combat = dossierCombat();
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
  it('un combat.yaml ne change que ce qu’il écrit (paramètres de voie, plans ajoutés)', () => {
    const raw = readRawContent(DATA_DIR);
    const before = buildContent(raw).combat!;
    const plan = { ...before.plans.red_temper_advised!, id: 'essai' };
    raw.combat = patchCombat(raw.combat, { paths: { red_temper: { params: { perHeat: 0.5 } } }, addPlans: [plan] });
    const after = buildContent(raw).combat!;
    expect(after.paths.red_temper!.params.perHeat).toBe(0.5);
    expect(after.paths.red_temper!.params.hits).toBe(before.paths.red_temper!.params.hits);
    expect(after.paths.fulgurant).toEqual(before.paths.fulgurant);
    expect(Object.keys(after.plans).length).toBe(Object.keys(before.plans).length + 1);
    // Il construit le contenu deux fois (plus de 4 000 modèles) : plus long que le délai par défaut sur une machine chargée.
  }, 30_000);
});
