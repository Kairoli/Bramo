import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/node/index.js';
import { advance } from '../src/engine/advance.js';
import { startActivity } from '../src/engine/actions.js';
import { viewCombat } from '../src/combat/view.js';
import { advisedPlan, choosePath, classLevel, currentPlan, emptyCombat, equipmentSetup, routeStages, setPlan, startCombat, startRoute, stopCombat } from '../src/combat/progress.js';
import type { Content } from '../src/schemas/content.js';
import { applyPreset, deletePreset, renamePreset, savePreset } from '../src/combat/presets.js';
import { chooseClass } from '../src/engine/actions.js';
import { HOUR, T0, makeState } from './fixture.js';
import { canHoldGem, socketGem } from '../src/engine/equipment.js';
import { tierFactorAt } from '../src/combat/loadout.js';

// Le combat se teste sur data/ : on vérifie des règles (déterminisme, XP, pauses), pas des chiffres d'équilibrage.
const content = loadContent(fileURLToPath(new URL('../../../data', import.meta.url)));
const forge = () => makeState({ classId: 'forgefire', inventory: { copper_ore: 10 } });
const recipe = Object.values(content.recipes).find((r) => r.inputs.length === 0 && r.level === 1)!;

describe('activité de combat', () => {
  it('le combat tourne à côté du métier : l’un ne coupe pas l’autre, et les deux progressent', () => {
    const s = startActivity(forge(), recipe.id, 10, 'replace', T0, content);
    const c = startCombat(s, 'duel', T0, content);
    expect(c.activity?.recipeId).toBe(recipe.id);
    expect(c.combat.activity?.encounter).toBe('duel');
    const back = startActivity(c, recipe.id, 10, 'replace', T0, content);
    expect(back.combat.activity?.encounter).toBe('duel');
    const { state, summary } = advance(back, T0 + HOUR, content);
    expect(summary.xp[recipe.profession]).toBeGreaterThan(0);
    expect(state.combat.xp.forgefire).toBeGreaterThan(0);
  });

  it('changer de classe, de voie ou de plan relance la rencontre en cours avec le nouveau build', () => {
    const mid = advance(startCombat(forge(), 'duel', T0, content), T0 + 10_000, content).state;
    expect(mid.combat.activity?.current?.setup.classId).toBe('forgefire');
    const switched = chooseClass(mid, 'runist', content);
    expect(switched.combat.activity?.current).toBeNull();
    const next = advance(switched, T0 + 11_000, content).state;
    expect(next.combat.activity?.current?.setup.classId).toBe('runist');
    expect(setPlan(mid, [{ spell: 'fg_quench', at: 0 }], content).combat.activity?.current).toBeNull();
  });

  it('la route part d’elle-même dès qu’aucun autre combat ne tourne', () => {
    const { state } = advance(forge(), T0 + 10 * 60_000, content);
    expect(state.combat.activity?.route).toBe(true);
    expect(state.combat.route.best).toBeGreaterThan(0);
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

  it('trois défaites de suite arrêtent la patrouille, sans rien faire perdre : la route reprend', () => {
    const deadly: Content = structuredClone(content);
    deadly.combat!.encounters.deadly = { ...deadly.combat!.encounters.duel!, id: 'deadly', attack: { damage: 5000, period: 1 } };
    const s = startCombat(forge(), 'deadly', T0, deadly);
    const { state, summary } = advance(s, T0 + HOUR, deadly);
    expect(summary.combat.stopped).toBe('losses');
    expect(state.combat.stopped).toBe('losses');
    expect(state.combat.activity?.route).toBe(true);
    for (const [item, qty] of Object.entries(s.inventory)) expect(state.inventory[item]).toBeGreaterThanOrEqual(qty);
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
    expect(classLevel(end.state, 'forgefire', content)).toBeGreaterThanOrEqual(40);
    expect(end.state.combat.activity?.route).toBe(true);
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

  it('quitter une patrouille garde l’XP acquise et rend la main à la route, qui ne s’arrête pas', () => {
    const s = advance(startCombat(forge(), 'duel', T0, content), T0 + HOUR, content).state;
    const stopped = stopCombat(s, T0 + HOUR, content);
    expect(stopped.combat.activity?.route).toBe(true);
    expect(stopped.combat.xp).toEqual(s.combat.xp);
    expect(() => stopCombat(stopped, T0 + HOUR, content)).toThrow(/tourne toujours/);
  });
});

describe('données qui changent', () => {
  it('une rencontre retirée des données arrête la patrouille au lieu de bloquer le personnage', () => {
    const s = startCombat(forge(), 'duel', T0, content);
    const changed: Content = structuredClone(content);
    delete changed.combat!.encounters.duel;
    const { state, summary } = advance(s, T0 + HOUR, changed);
    expect(state.combat.activity?.route).toBe(true);
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
  const runist = (level: number, equipment?: { model: string; lines: { name: string; value: number }[]; gem?: string }[]) =>
    makeState({ classId: 'runist', combat: { ...emptyCombat(), xp: { runist: content.xpTable[level]! } }, ...(equipment ? { equipment } : {}) });
  const kit = (tier: number, rarity: string) =>
    Object.values(content.gearModels)
      .filter((m) => m.tier === tier && m.rarity === rarity && !m.set && !m.named && !m.starter && m.classes.includes('runist') && m.orientation === 'offensive')
      .filter((m, i, all) => all.findIndex((x) => x.slot === m.slot) === i)
      .map((m) => ({ model: m.id, lines: [] }));

  it('une gemme de situation sertie donne son outil au combat, une seule fois, dans les quatre places majeures', () => {
    const weapon = Object.values(content.gearModels).find((m) => m.slot === 'weapon' && m.classes.includes('runist') && canHoldGem(m) && !m.talent)!;
    const head = Object.values(content.gearModels).find((m) => m.slot === 'head' && m.classes.includes('runist') && canHoldGem(m))!;
    const without = equipmentSetup(runist(1, [{ model: weapon.id, lines: [] }]), content);
    expect(without.tools ?? []).toHaveLength(0);
    const one = equipmentSetup(runist(1, [{ model: weapon.id, lines: [], gem: 'wash_pearl' }]), content);
    expect(one.tools?.map((t) => t.id)).toEqual(['wash_pearl']);
    // Deux fois la même gemme : un seul outil.
    const twice = equipmentSetup(runist(1, [{ model: weapon.id, lines: [], gem: 'wash_pearl' }, { model: head.id, lines: [], gem: 'wash_pearl' }]), content);
    expect(twice.tools?.map((t) => t.id)).toEqual(['wash_pearl']);
    // Sertir : seulement dans une place majeure ; l'ancienne gemme revient au sac.
    const items = [{ id: 1, model: weapon.id, lines: [], masterpiece: false, signedBy: null, wear: 0, equipped: 'weapon', gem: 'wash_pearl' }];
    const r = socketGem(items, 1, 'gem_fault_eye', content);
    expect(r.items[0]!.gem).toBe('fault_eye');
    expect(r.give).toBe('gem_wash_pearl');
    const legs = Object.values(content.gearModels).find((m) => m.slot === 'legs')!;
    expect(() => socketGem([{ ...items[0]!, model: legs.id }], 1, 'gem_fault_eye', content)).toThrow(/chaton/);
  });

  it('sans équipement connu, les statistiques de référence ; avec, celles de l’équipement, jamais sous le plancher du palier de la classe', () => {
    expect(equipmentSetup(runist(1), content)).toEqual({});
    const starter = Object.values(content.gearModels).filter((m) => m.starter && m.classes.includes('runist')).map((m) => ({ model: m.id, lines: [] }));
    const floor = equipmentSetup(runist(1, starter), content).stats!;
    expect(floor.power).toBeCloseTo(content.combat!.rules.referenceStats.power * 0.797, 1);
    // Chaque niveau compte : le plancher monte entre deux paliers de la courbe (avant, le niveau 9 valait le niveau 1).
    const at = (level: number) => equipmentSetup(runist(level, starter), content).stats!.power!;
    expect(at(5)).toBeGreaterThan(at(1));
    expect(at(9)).toBeGreaterThan(at(5));
    expect(at(10)).toBeGreaterThan(at(9));
    // Le plancher descend vers `floorShare` en douceur : un niveau de plus ne rend jamais plus faible.
    for (let l = 1; l < 99; l++) expect(at(l + 1)).toBeGreaterThanOrEqual(at(l));
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

  it('douze zones de dix étapes : neuf dans la zone, la dixième contre le gardien de la région ; le palier monte de 1 à 90', () => {
    const all = routeStages(content.combat!);
    const beyond = (content.combat!.rules.route?.beyondChapters ?? 0) * 10;
    expect(all).toHaveLength(120 + beyond);
    const stages = all.slice(0, 120);
    expect(stages[0]).toMatchObject({ label: '1-1', encounter: 'z01_lantern_road', tier: 1, guardian: false });
    expect(stages[8]).toMatchObject({ label: '1-9', encounter: 'z01_lantern_road', guardian: false });
    expect(stages[9]).toMatchObject({ label: '1-10', encounter: 'b1_lavandiere', guardian: true });
    expect(stages[10]).toMatchObject({ label: '2-1', encounter: 'z02_gray_ditches' });
    for (const s of stages) expect(s.guardian).toBe(s.index % 10 === 9);
    for (let j = 1; j < stages.length; j++) expect(stages[j]!.tier).toBeGreaterThanOrEqual(stages[j - 1]!.tier);
    expect(stages.at(-1)).toMatchObject({ tier: 90, encounter: 'b6_regent' });
    // Au-delà des Lointains : les régions hautes reviennent au-delà du palier 90, les ennemis continuent la courbe.
    if (beyond) {
      const b = all.slice(120);
      expect(b[0]!.chapterName.startsWith('Au-delà')).toBe(true);
      expect(b[0]!.tier).toBeGreaterThan(90);
      for (const s of b) expect(s.guardian).toBe(s.index % 10 === 9);
      expect(tierFactorAt(content.combat!.rules, b.at(-1)!.tier)).toBeGreaterThan(tierFactorAt(content.combat!.rules, 90));
    }
  });

  it('la première victoire contre un gardien donne son trophée (son objet nommé, ou une pièce de ses ensembles), une seule fois', () => {
    const s0 = runist(30);
    s0.combat.route = { stage: 9, best: 9 };
    const s = startRoute(s0, T0, content, 9);
    const { state, summary } = advance(s, T0 + 2 * HOUR, content);
    expect(state.combat.route.best).toBeGreaterThan(9);
    const named = summary.combat.loot.filter((l) => content.gearModels[l.model]?.talent === 'petit_arrangement');
    expect(named.length).toBeGreaterThanOrEqual(1);
    // Rejouer le gardien déjà battu ne redonne pas le trophée.
    const again = startRoute(state, T0 + 2 * HOUR, content, 9);
    const r2 = advance(again, T0 + 2 * HOUR + 5 * 60_000, content);
    expect(r2.summary.combat.loot.filter((l) => content.gearModels[l.model]?.talent === 'petit_arrangement').length).toBeLessThanOrEqual(1);
  });

  it('une victoire mène à l’étape suivante ; trois défaites de suite font reculer d’une étape ; jamais d’arrêt', () => {
    const s = startRoute(runist(80), T0, content);
    const { state, summary } = advance(s, T0 + 6 * HOUR, content);
    expect(summary.combat.wins).toBeGreaterThan(0);
    expect(state.combat.route.best).toBeGreaterThan(0);
    expect(state.combat.activity?.route).toBe(true);
    // Trop faible : la route recule jusqu'à une étape qu'il gagne, l'activité continue, l'étape atteinte reste acquise.
    const weak = startRoute({ ...runist(1), combat: { ...runist(1).combat, route: { stage: 40, best: 40 } } }, T0, content);
    const lost = advance(weak, T0 + 3 * HOUR, content);
    expect(lost.summary.combat.losses).toBeGreaterThan(3);
    expect(lost.summary.combat.wins).toBeGreaterThan(0);
    expect(lost.state.combat.activity?.route).toBe(true);
    expect(lost.state.combat.route.stage).toBeLessThan(40);
    expect(lost.state.combat.route.best).toBe(40);
    // Une ou deux défaites ne font pas reculer.
    const one = startRoute({ ...runist(1), combat: { ...runist(1).combat, route: { stage: 40, best: 40 } } }, T0, content);
    let st = one;
    for (let t = 1; t <= 200 && st.combat.activity!.losses < 2; t++) st = advance(st, T0 + t * 5_000, content).state;
    expect(st.combat.route.stage).toBe(40);
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

describe('préréglages de build', () => {
  const at = (level: number) => makeState({ classId: 'forgefire', combat: { ...emptyCombat(), xp: { forgefire: content.xpTable[level]!, runist: content.xpTable[40]! } } });

  it('enregistrer garde classe, voie, plan et équipement ; appliquer les remet, changer de classe compris', () => {
    let s = choosePath(at(40), 'anvil', content);
    s = setPlan(s, [{ spell: 'fg_quench', at: 0 }, { spell: 'fg_workshop', at: 2 }], content);
    s = savePreset(s, { name: '  Mur  ' }, [3, 7], content);
    const p = s.combat.presets[0]!;
    expect(p).toMatchObject({ name: 'Mur', classId: 'forgefire', path: 'anvil', gear: [3, 7] });
    expect(s.combat.activePreset).toBe(p.id);
    // Autre build, puis retour au préréglage.
    let other = chooseClass(s, 'runist', content);
    other = savePreset(other, { name: 'Glyphes' }, [], content);
    expect(other.combat.presets).toHaveLength(2);
    const back = applyPreset(other, p.id, content);
    expect(back.classId).toBe('forgefire');
    expect(back.combat.paths.forgefire).toBe('anvil');
    expect(currentPlan(back, content)).toEqual({ plan: [{ spell: 'fg_quench', at: 0 }, { spell: 'fg_workshop', at: 2 }], advised: false });
    expect(back.combat.activePreset).toBe(p.id);
    // Écraser, renommer, supprimer ; six au plus.
    expect(savePreset(back, { id: p.id }, [9], content).combat.presets.find((x) => x.id === p.id)!.gear).toEqual([9]);
    expect(renamePreset(back, p.id, 'Gardien').combat.presets[0]!.name).toBe('Gardien');
    expect(deletePreset(back, p.id).combat.presets.map((x) => x.name)).toEqual(['Glyphes']);
    let full = back;
    for (let i = 0; i < 4; i++) full = savePreset(full, {}, [], content);
    expect(() => savePreset(full, {}, [], content)).toThrow(/Au plus 6/);
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
