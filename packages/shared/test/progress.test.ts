import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/node/index.js';
import { advance } from '../src/engine/advance.js';
import { startActivity } from '../src/engine/actions.js';
import { viewCombat } from '../src/combat/view.js';
import { advisedPlan, choosePath, classLevel, currentPlan, setPlan, startCombat, stopCombat } from '../src/combat/progress.js';
import type { Content } from '../src/schemas/content.js';
import { HOUR, T0, makeState } from './fixture.js';

// Le combat se teste sur data/ : on vérifie des règles (déterminisme, XP, pauses), pas des chiffres d'équilibrage.
const content = loadContent(fileURLToPath(new URL('../../../data', import.meta.url)));
const forge = () => makeState({ classId: 'forgefire', inventory: { copper_ore: 10 } });
const recipe = Object.values(content.recipes).find((r) => r.inputs.length === 0 && r.level === 1)!;

describe('activité de combat', () => {
  it('une seule activité à la fois : le combat arrête le métier, et inversement', () => {
    const s = startActivity(forge(), recipe.id, 10, 'replace', T0, content);
    const c = startCombat(s, 'duel', T0, content);
    expect(c.activity).toBeNull();
    expect(c.combat.activity?.encounter).toBe('duel');
    const back = startActivity(c, recipe.id, 10, 'replace', T0, content);
    expect(back.combat.activity).toBeNull();
  });

  it('les rencontres donnent de l’XP de classe, jamais de métier', () => {
    const s = startCombat(forge(), 'duel', T0, content);
    const { state, summary } = advance(s, T0 + 2 * HOUR, content);
    expect(summary.combat.fights).toBeGreaterThan(50);
    expect(summary.combat.wins).toBe(summary.combat.fights);
    expect(state.combat.xp.forgefire).toBeGreaterThan(0);
    expect(state.skills).toEqual({});
    expect(classLevel(state, 'forgefire', content)).toBeGreaterThan(1);
    expect(summary.combat.levelUps[0]?.classId).toBe('forgefire');
  });

  it('avancer en une fois ou en plusieurs fois donne le même résultat', () => {
    const s = startCombat(forge(), 'pack', T0, content);
    const once = advance(s, T0 + 3 * HOUR, content).state;
    let step = s;
    for (let h = 1; h <= 3; h++) step = advance(step, T0 + h * HOUR, content).state;
    let odd = s;
    for (const t of [T0 + 17_321, T0 + HOUR + 999, T0 + 2 * HOUR + 1, T0 + 3 * HOUR]) odd = advance(odd, t, content).state;
    expect(step.combat).toEqual(once.combat);
    expect(odd.combat).toEqual(once.combat);
  });

  it('trois défaites de suite mettent l’activité en pause, sans rien faire perdre', () => {
    const deadly: Content = structuredClone(content);
    deadly.combat!.encounters.deadly = { ...deadly.combat!.encounters.duel!, id: 'deadly', attack: { damage: 5000, period: 1 } };
    const s = startCombat(forge(), 'deadly', T0, deadly);
    const { state, summary } = advance(s, T0 + HOUR, deadly);
    expect(summary.combat.losses).toBe(3);
    expect(summary.combat.stopped).toBe('losses');
    expect(state.combat.activity).toBeNull();
    expect(state.inventory).toEqual(s.inventory);
    expect(state.combat.xp.forgefire).toBeGreaterThan(0);
  });

  it('le Terrain d’entraînement donne 40 % de l’XP et s’arrête au niveau 40', () => {
    const s = startCombat(forge(), null, T0, content);
    const hour = advance(s, T0 + HOUR, content);
    // Niveau 1 pendant presque toute l'heure : à peu près 40 % de 400 XP.
    expect(hour.state.combat.xp.forgefire).toBeGreaterThan(150);
    expect(hour.state.combat.xp.forgefire).toBeLessThan(200);
    const capped = makeState({ classId: 'forgefire', combat: { ...s.combat, xp: { forgefire: content.xpTable[40]! } } });
    expect(() => startCombat(capped, null, T0, content)).toThrow(/niveau 40/);
    const nearly = { ...s, combat: { ...s.combat, xp: { forgefire: content.xpTable[40]! - 5 } } };
    const end = advance(nearly, T0 + HOUR, content);
    expect(end.summary.combat.stopped).toBe('training_cap');
    expect(classLevel(end.state, 'forgefire', content)).toBe(40);
  });

  it('arrêter le combat garde l’XP acquise', () => {
    const s = advance(startCombat(forge(), 'duel', T0, content), T0 + HOUR, content).state;
    const stopped = stopCombat(s);
    expect(stopped.combat.activity).toBeNull();
    expect(stopped.combat.xp).toEqual(s.combat.xp);
  });
});

describe('données qui changent', () => {
  it('une rencontre retirée des données arrête le combat au lieu de bloquer le personnage', () => {
    const s = startCombat(forge(), 'duel', T0, content);
    const changed: Content = structuredClone(content);
    delete changed.combat!.encounters.duel;
    const { state, summary } = advance(s, T0 + HOUR, changed);
    expect(state.combat.activity).toBeNull();
    expect(summary.combat.stopped).toBe('unavailable');
  });

  it('un sort retiré des données n’empêche pas d’afficher l’état (le journal du dernier combat disparaît)', () => {
    const played = advance(startCombat(forge(), 'duel', T0, content), T0 + HOUR, content).state;
    expect(viewCombat(played, content)?.lastFight).not.toBeNull();
    const changed: Content = structuredClone(content);
    for (const e of played.combat.last!.setup.plan) delete changed.combat!.spells[e.spell];
    expect(viewCombat(played, changed)?.lastFight).toBeNull();
  });
});

describe('plan et voie', () => {
  const at = (level: number) => makeState({ classId: 'forgefire', combat: { xp: { forgefire: content.xpTable[level]! }, paths: {}, plans: {}, activity: null, nextIndex: 0, last: null, stopped: null } });

  it('sans plan enregistré, le plan conseillé : des sorts accessibles, sans horaire', () => {
    const { plan, advised } = currentPlan(at(1), content);
    expect(advised).toBe(true);
    expect(plan.length).toBeGreaterThan(0);
    for (const e of plan) {
      expect(content.combat!.spells[e.spell]!.level).toBeLessThanOrEqual(1);
      expect(e.at).toBe(0);
    }
    expect(advisedPlan(content.combat!, 'forgefire', 'anvil', 80)).toEqual(content.combat!.plans.anvil_advised!.levels['80']);
  });

  it('la voie s’ouvre au niveau 30, se change gratuitement, et ne garde que ses sorts', () => {
    expect(() => choosePath(at(29), 'anvil', content)).toThrow(/niveau 30/);
    expect(() => choosePath(at(40), 'fulgurant', content)).toThrow(/votre classe/);
    const s = choosePath(at(40), 'anvil', content);
    const { plan } = currentPlan(s, content);
    for (const e of plan) expect([undefined, 'anvil']).toContain(content.combat!.spells[e.spell]!.path);
  });

  it('un plan enregistré est validé (niveau, places, minuteur de 10 s) ; null revient au conseillé', () => {
    const s = at(10);
    expect(() => setPlan(s, [{ spell: 'fg_workshop', at: 12 }], content)).toThrow(/au plus 10 s/);
    expect(() => setPlan(s, [{ spell: 'fg_great_temper', at: 0 }], content)).toThrow(/niveau 75/);
    const mine = setPlan(s, [{ spell: 'fg_quench', at: 0 }, { spell: 'fg_workshop', at: 3 }], content);
    expect(currentPlan(mine, content)).toEqual({ plan: [{ spell: 'fg_quench', at: 0 }, { spell: 'fg_workshop', at: 3 }], advised: false });
    expect(currentPlan(setPlan(mine, null, content), content).advised).toBe(true);
  });
});
