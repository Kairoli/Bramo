import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/node/index.js';
import { advance } from '../src/engine/advance.js';
import { startActivity } from '../src/engine/actions.js';
import { viewCombat } from '../src/combat/view.js';
import { advisedPlan, choosePath, classLevel, currentPlan, emptyCombat, equipmentSetup, routeStages, setPlan, startCombat, startRoute, stopCombat } from '../src/combat/progress.js';
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

  it('le déroulé de la rencontre en cours est rejoué pour l’écran : attaques de base, sorts, PV ennemis qui baissent', () => {
    const s = advance(startCombat(forge(), 'duel', T0, content), T0 + 10_000, content).state;
    const a = viewCombat(s, content)!.activity!;
    expect(a.timeline!.some((e) => e.kind === 'basic')).toBe(true);
    expect(a.timeline!.some((e) => e.kind === 'cast' && content.combat!.spells[e.spell!])).toBe(true);
    const hp = a.timeline!.filter((e) => e.hp !== undefined).map((e) => e.hp!);
    expect(hp.every((h, i) => i === 0 || h <= hp[i - 1]! + 1e-9)).toBe(true);
    expect(a.fightTime! * 1000).toBeCloseTo(s.combat.activity!.current!.ms, -1);
    expect(a.win).toBe(s.combat.activity!.current!.win);
    // Le journal du dernier combat ne liste pas chaque attaque de base.
    const done = advance(s, T0 + HOUR, content).state;
    expect(viewCombat(done, content)!.lastFight!.lines.some((l) => l.text.startsWith('attaque de base'))).toBe(false);
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

describe('équipement, paliers et butin', () => {
  const runist = (level: number, equipment?: { model: string; lines: { name: string; value: number }[] }[]) =>
    makeState({ classId: 'runist', combat: { ...emptyCombat(), xp: { runist: content.xpTable[level]! } }, ...(equipment ? { equipment } : {}) });
  const kit = (tier: number, rarity: string) =>
    Object.values(content.gearModels)
      .filter((m) => m.tier === tier && m.rarity === rarity && !m.set && !m.named && !m.starter && m.classes.includes('runist') && m.orientation === 'offensive')
      .filter((m, i, all) => all.findIndex((x) => x.slot === m.slot) === i)
      .map((m) => ({ model: m.id, lines: [] }));

  it('sans équipement connu, les statistiques de référence ; avec, celles de l’équipement, jamais sous le plancher du palier de la classe', () => {
    expect(equipmentSetup(runist(1), content)).toEqual({});
    const starter = Object.values(content.gearModels).filter((m) => m.starter && m.classes.includes('runist')).map((m) => ({ model: m.id, lines: [] }));
    const floor = equipmentSetup(runist(1, starter), content).stats!;
    expect(floor.power).toBeCloseTo(content.combat!.rules.referenceStats.power * 0.797, 1);
    const legend = equipmentSetup(runist(90, kit(90, 'legendary')), content).stats!;
    expect(legend.power).toBeGreaterThan(floor.power! * 2);
  });

  it('une zone a son palier : ennemis plus faibles au palier 1, et une victoire donne vestiges et parfois de l’équipement', () => {
    const s = startCombat(runist(1, kit(1, 'rare')), 'z01_lantern_road', T0, content);
    const { state, summary } = advance(s, T0 + 6 * HOUR, content);
    expect(summary.combat.wins).toBeGreaterThan(0);
    expect(state.inventory.galets_du_puits).toBeGreaterThan(0);
    expect(summary.combat.vestiges.galets_du_puits).toBe(state.inventory.galets_du_puits);
    for (const l of summary.combat.loot) expect(content.gearModels[l.model]!.tier).toBe(1);
    // Même butin en une ou plusieurs fois.
    const half = advance(s, T0 + 3 * HOUR, content);
    const rest = advance(half.state, T0 + 6 * HOUR, content);
    expect([...half.summary.combat.loot, ...rest.summary.combat.loot]).toEqual(summary.combat.loot);
    expect(rest.state.inventory.galets_du_puits).toBe(state.inventory.galets_du_puits);
  });

  it('les cercles d’une région haute s’ouvrent avec le palier de la classe', () => {
    expect(() => startCombat(runist(10), 'z05_balance_cloister', T0, content, 60)).toThrow('cercle');
    const s = startCombat(runist(70), 'z05_balance_cloister', T0, content, 60);
    expect(s.combat.activity?.tier).toBe(60);
    expect(startCombat(runist(1), 'z05_balance_cloister', T0, content).combat.activity?.tier).toBeUndefined();
  });
});

describe('la route (PvE solo)', () => {
  const runist = (level: number) => makeState({ classId: 'runist', combat: { ...emptyCombat(), xp: { runist: content.xpTable[level]! } }, equipment: [] });

  it('les étapes suivent le monde : régions basses, puis les régions hautes cercle par cercle, chaque chapitre finit sur son gardien', () => {
    const stages = routeStages(content.combat!);
    expect(stages[0]).toMatchObject({ label: '1-1', encounter: 'z01_lantern_road', tier: 1 });
    expect(stages.length).toBeGreaterThan(50);
    for (let j = 1; j < stages.length; j++) expect(stages[j]!.tier).toBeGreaterThanOrEqual(stages[j - 1]!.tier);
    const chapters = new Set(stages.map((s) => s.chapter));
    for (const c of chapters) expect(stages.filter((s) => s.chapter === c).at(-1)!.guardian).toBe(true);
    expect(stages.at(-1)!.tier).toBe(90);
  });

  it('une victoire mène à l’étape suivante, une défaite fait rejouer la même, sans jamais s’arrêter', () => {
    const s = startRoute(runist(80), T0, content);
    const { state, summary } = advance(s, T0 + 6 * HOUR, content);
    expect(summary.combat.wins).toBeGreaterThan(0);
    expect(state.combat.route.best).toBeGreaterThan(0);
    expect(state.combat.activity?.route).toBe(true);
    // Trop faible : il perd en boucle à la même étape, l'activité continue.
    const weak = startRoute({ ...runist(1), combat: { ...runist(1).combat, route: { stage: 40, best: 40 } } }, T0, content);
    const lost = advance(weak, T0 + 3 * HOUR, content);
    expect(lost.summary.combat.losses).toBeGreaterThan(3);
    expect(lost.state.combat.activity).not.toBeNull();
    expect(lost.state.combat.route.stage).toBe(40);
    // Même résultat en une ou plusieurs fois.
    const half = advance(s, T0 + 3 * HOUR, content);
    expect(advance(half.state, T0 + 6 * HOUR, content).state.combat.route).toEqual(state.combat.route);
  });

  it('on peut rejouer une étape franchie, pas en sauter', () => {
    const s = { ...runist(10), combat: { ...runist(10).combat, route: { stage: 4, best: 4 } } };
    expect(startRoute(s, T0, content, 2).combat.route.stage).toBe(2);
    expect(() => startRoute(s, T0, content, 6)).toThrow(/pas encore ouverte/);
  });
});

describe('plan et voie', () => {
  const at = (level: number) => makeState({ classId: 'forgefire', combat: { ...emptyCombat(), xp: { forgefire: content.xpTable[level]! } } });

  it('sans plan enregistré, le plan conseillé : des sorts accessibles, sans horaire', () => {
    const { plan, advised } = currentPlan(at(1), content);
    expect(advised).toBe(true);
    expect(plan.length).toBeGreaterThan(0);
    for (const e of plan) {
      expect(content.combat!.spells[e.spell]!.level).toBeLessThanOrEqual(1);
      expect(e.at).toBe(0);
    }
    expect(advisedPlan(content.combat!, 'forgefire', 'anvil', 80)).toEqual(content.combat!.plans.anvil_advised!.levels['80']);
    // En groupe, un soutien part de son plan de groupe (soins et protections) ; une autre voie garde son plan.
    expect(advisedPlan(content.combat!, 'runist', 'glyphkeeper', 80, 'group')).not.toEqual(advisedPlan(content.combat!, 'runist', 'glyphkeeper', 80));
    expect(advisedPlan(content.combat!, 'runist', 'glyphkeeper', 80, 'group').map((e) => e.spell)).toContain('rn_refuge');
    expect(advisedPlan(content.combat!, 'forgefire', 'anvil', 80, 'group')).toEqual(advisedPlan(content.combat!, 'forgefire', 'anvil', 80));
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
