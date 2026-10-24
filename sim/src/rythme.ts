/**
 * Le rythme du combat : durée des rencontres de la route, nombre de sorts lancés, part des dégâts (attaques de base, sorts,
 * afflictions, talents), taille des coups. Personnage au niveau du palier de l'étape, set de départ ramené au plancher (comme
 * `wall.ts`), plan conseillé, 6 graines. Étapes mesurées : la 5ᵉ et le gardien (10ᵉ) de chaque chapitre.
 *
 * pnpm --filter @bramo/sim exec tsx src/rythme.ts [proposition]   (sans proposition : data/)
 * PATCH='{"rules.fightLimit":120}' pour essayer un réglage sans écrire de proposition.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '@bramo/shared/node';
import { type CharacterState, combatantOf, emptyCombat, fight, routeStage, tierFactorAt } from '@bramo/shared';

const root = fileURLToPath(new URL('../../', import.meta.url));
const content = loadContent(join(root, 'data'));
const combat = content.combat!;
if (process.env.PATCH) {
  for (const [path, value] of Object.entries(JSON.parse(process.env.PATCH) as Record<string, unknown>)) {
    const keys = path.split('.');
    let o = combat as unknown as Record<string, unknown>;
    for (const k of keys.slice(0, -1)) o = o[k] as Record<string, unknown>;
    o[keys.at(-1)!] = value;
  }
}

/**
 * Variantes de rythme, par variables d'environnement (1 = inchangé) :
 * X : tous les nombres × X (Puissance, PV, dégâts et soins ennemis) : même combat, de plus gros chiffres ;
 * K : combats K fois plus courts à danger égal : PV ennemis (et gardes, soins ennemis) ÷ K, dégâts ennemis × K ;
 * M : mécaniques ennemies M fois plus fréquentes (fenêtres, charges, gardes, érosion, renforts, fureur) ;
 * C : recharge des sorts × C.
 */
const V = (k: string) => Number(process.env[k] ?? 1);
const [X, K, M, C, D] = [V('X'), V('K'), V('M'), V('C'), V('D')];
{
  const R = combat.rules as unknown as Record<string, any>;
  R.referenceStats.power *= X;
  R.referenceStats.maxHp *= X;
  if (R.gearStats) {
    R.gearStats.power.perPoint *= X;
    R.gearStats.power.base *= X;
    for (const k of ['base', 'perPoint', 'perDefense']) R.gearStats.maxHp[k] *= X;
  }
  for (const e of Object.values(combat.encounters) as any[]) {
    // KG : le facteur de rythme des gardiens (par défaut K) : des gardiens plus longs que les zones.
    const kk = e.kind === 'gardien' && process.env.KG ? Number(process.env.KG) : K;
    const dd = e.kind === 'gardien' && process.env.DG ? Number(process.env.DG) : D;
    const hp = X / kk, dmg = X * kk * dd;
    // AR : les ennemis frappent AR fois plus souvent, AR fois moins fort (moins de coups qui emportent tout).
    const AR = V('AR');
    const atk = (a: any) => a && ((a.damage *= dmg / AR), (a.period /= AR));
    e.hp *= hp;
    atk(e.attack);
    for (const a of e.adds ?? []) { a.hp *= hp; atk(a.attack); a.arrive /= M; }
    if (e.charge) { e.charge.damage *= dmg; e.charge.period /= M; }
    if (e.guard) { e.guard.amount *= hp; e.guard.period /= M; e.guard.duration /= M; }
    if (e.regen) { e.regen.amount *= hp; e.regen.period /= M; }
    if (e.aura) e.aura.damage *= dmg;
    if (e.erosion) { e.erosion.damage *= dmg; e.erosion.period /= M; }
    if (e.windows) { e.windows.period /= M; e.windows.open /= M; }
    if (e.enrage) e.enrage.after /= M;
  }
  for (const s of Object.values(combat.spells) as any[]) s.cooldown *= C;
  // TC : délais internes des talents et seuils « compétence de N s de recharge ou plus » × TC (à régler avec C).
  const TC = V('TC');
  const walk = (o: any) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(walk);
    for (const k of ['cooldown', 'minCooldown', 'noSkillFor']) if (typeof o[k] === 'number') o[k] *= TC;
    Object.values(o).forEach(walk);
  };
  walk((combat as any).talents);
  // CUT=0.4 : une gemme d'essai « test_cadence » : chaque attaque de base raccourcit de CUT s la recharge des sorts.
  if (process.env.CUT) (combat as any).talents.gems.push({ id: 'test_cadence', name: 'Essai de Cadence', role: 'utility', text: '', effects: [{ when: 'basic', do: { cooldownCut: Number(process.env.CUT) } }] });
}

const SEEDS = Number(process.env.SEEDS ?? 6);
// GEMS=allume_feu,feu_aux_poudres,petit_bois : gemmes de talent serties dans l'arme, le torse et la coiffe (les places majeures du set de départ).
const GEMS = (process.env.GEMS ?? '').split(',').filter(Boolean);
const MAJOR = ['weapon', 'torso', 'head'];
const stages = (process.env.STAGES ?? Array.from({ length: 12 }, (_, c) => [c * 10 + 4, c * 10 + 9]).flat().join(',')).split(',').map(Number);
type Row = { low: number; procs: number; spends: number; stage: string; name: string; tier: number; cls: string; win: number; time: number; casts: number; basics: number; share: Record<string, number>; hit: number; bigHit: number; P: number; hp: number };
const rows: Row[] = [];
let engineMs = 0, simulatedS = 0;
for (const classId of Object.keys(combat.kits)) {
  const starter = Object.values(content.gearModels).filter((m) => m.starter && m.classes.includes(classId));
  for (const i of stages) {
    const st = routeStage(combat, i);
    const enc = combat.encounters[st.encounter]!;
    const level = Math.max(1, Math.min(99, st.tier));
    const state = { seed: 1, classId, equipment: starter.map((m) => ({ model: m.id, lines: [], ...(GEMS[MAJOR.indexOf(m.slot)] ? { gem: GEMS[MAJOR.indexOf(m.slot)] } : {}) })), combat: { ...emptyCombat(), xp: { [classId]: content.xpTable[level]! } } } as unknown as CharacterState;
    const setup = combatantOf(state, content);
    // HASTE=0.5 : Cadence imposée ; POWERX=0.8 : Puissance × 0,8 (comparer un build de vitesse à un build de Puissance).
    if (setup.stats && process.env.HASTE) setup.stats = { ...setup.stats, haste: Number(process.env.HASTE) };
    // REVERSE=1 : l'ouverture à l'envers (mêmes minuteurs, sorts dans l'ordre inverse) : ce que vaut un bon ordre d'ouverture.
    if (process.env.REVERSE) { const sp = setup.plan.map((p) => p.spell).reverse(); setup.plan = setup.plan.map((p, i) => ({ ...p, spell: sp[i]! })); }
    if (setup.stats && process.env.POWERX) setup.stats = { ...setup.stats, power: (setup.stats.power ?? 0) * Number(process.env.POWERX) };
    const s = tierFactorAt(combat.rules, st.tier);
    let win = 0, time = 0, casts = 0, basics = 0, hits = 0, hitSum = 0, big = 0, procs = 0, spends = 0, low = 0;
    const share: Record<string, number> = {};
    // CARRY=0.5 : la moitié des réserves passe d'une rencontre à la suivante (les graines se suivent comme des rencontres de la route).
    const CARRY = Number(process.env.CARRY ?? 0);
    let carry: Record<string, number> = {};
    for (let seed = 1; seed <= SEEDS; seed++) {
      const one = CARRY ? { ...setup, startPools: carry } : setup;
      const t0 = performance.now();
      fight(combat, [one], enc, { seed, enemyDamageScale: s, enemyHpScale: s });
      engineMs += performance.now() - t0;
      const r = fight(combat, [one], enc, { seed, enemyDamageScale: s, enemyHpScale: s, trace: true });
      carry = Object.fromEntries(Object.entries(r.team[0]!.pools).map(([k, v]) => [k, Math.floor(v * CARRY)]));
      simulatedS += r.time + (combat.rules.progression?.rest ?? 5);
      if (r.win) win++;
      low += r.team[0]!.minHpRatio;
      time += r.time;
      for (const e of r.trace!) {
        if (e.who !== setup.id) continue;
        if (e.kind === 'cast') casts++;
        if (e.kind === 'basic') basics++;
        if ((e.kind === 'cast' || e.kind === 'basic') && e.dmg) { hits++; hitSum += e.dmg; big = Math.max(big, e.dmg); }
      }
      for (const [k, v] of Object.entries(r.team[0]!.metrics)) {
        if (k.startsWith('talent:')) procs += v;
        if (k.startsWith('spent:')) spends += v;
      }
      for (const [k, v] of Object.entries(r.team[0]!.metrics)) if (k.startsWith('damage:')) share[k.slice(7)] = (share[k.slice(7)] ?? 0) + v;
    }
    const total = Object.values(share).reduce((a, b) => a + b, 0) || 1;
    rows.push({
      low: low / SEEDS, procs: procs / SEEDS, spends: spends / SEEDS,
      stage: st.label, name: enc.name, tier: st.tier, cls: classId, win: win / SEEDS, time: time / SEEDS, casts: casts / SEEDS, basics: basics / SEEDS,
      share: Object.fromEntries(Object.entries(share).map(([k, v]) => [k, Math.round((100 * v) / total)])),
      hit: hits ? hitSum / hits : 0, bigHit: big, P: Math.round(setup.stats?.power ?? 0), hp: Math.round((enc.hp ?? 0) * s * (enc.enemies ?? 1)),
    });
  }
}
const f = (x: number, d = 0) => x.toFixed(d);
console.log('étape | rencontre | palier | classe | victoires | durée (s) | sorts | attaques de base | coup moyen | plus gros | P | PV ennemis | procs de talent | dépenses de réserve | part des dégâts');
if (!process.env.QUIET) for (const r of rows) console.log([r.stage, r.name.slice(0, 26), r.tier, r.cls, `${f(r.win * 100)} %`, f(r.time), f(r.casts, 1), f(r.basics, 1), f(r.hit), f(r.bigHit), r.P, r.hp, f(r.procs, 1), f(r.spends, 1), Object.entries(r.share).map(([k, v]) => `${k} ${v}`).join(' ')].join(' | '));
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
console.log(`\nMoyenne : durée ${f(avg(rows.map((r) => r.time)))} s (zones ${f(avg(rows.filter((r) => !r.stage.endsWith('-10')).map((r) => r.time)))} s, gardiens ${f(avg(rows.filter((r) => r.stage.endsWith('-10')).map((r) => r.time)))} s) · ${f(avg(rows.map((r) => r.casts)), 1)} sorts par combat · coup moyen ${f(avg(rows.map((r) => r.hit)))} · victoires ${f(avg(rows.map((r) => r.win)) * 100)} % · procs ${f(avg(rows.map((r) => r.procs)), 1)} · dépenses ${f(avg(rows.map((r) => r.spends)), 1)}`);

for (const kind of ['zones', 'gardiens']) {
  const rs = rows.filter((r) => r.stage.endsWith('-10') === (kind === 'gardiens'));
  console.log(`  ${kind.padEnd(10)} victoires ${f(avg(rs.map((r) => r.win)) * 100)} % · durée ${f(avg(rs.map((r) => r.time)))} s · PV au plus bas ${f(avg(rs.map((r) => r.low)) * 100)} % · ${f(avg(rs.map((r) => r.casts)), 1)} sorts`);
}
for (const cls of Object.keys(combat.kits)) {
  const rs = rows.filter((r) => r.cls === cls);
  console.log(`  ${cls.padEnd(10)} victoires ${f(avg(rs.map((r) => r.win)) * 100)} % · durée ${f(avg(rs.map((r) => r.time)))} s · ${f(avg(rs.map((r) => r.casts)), 1)} sorts · ${f(avg(rs.map((r) => r.basics)), 1)} attaques de base · PV au plus bas ${f(avg(rs.map((r) => r.low)) * 100)} % · coup moyen ${f(avg(rs.map((r) => r.hit)))} · plus gros ${f(Math.max(...rs.map((r) => r.bigHit)))}`);
}
console.log(`Coût du moteur : ${f((engineMs / simulatedS) * 3600)} ms de calcul par heure de route simulée (${f(engineMs / rows.length / SEEDS, 2)} ms par combat)`);
