/**
 * Puissance des classes et des voies à équipement égal (un Rare complet de son niveau : le plancher à 100 %), sur les
 * rencontres de la route : la part de victoires et les dégâts par seconde, rapportés à la moyenne des classes.
 * `pnpm --filter @bramo/sim exec tsx src/classPower.ts` ; essais : PATCH='{"combat.kits.tracker.params.bonus":0.4}'.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '@bramo/shared/node';
import { type CharacterState, type CombatantSetup, advisedPlan, curveTier, emptyCombat, fight, routeStages, tierFactorAt, wornGear } from '@bramo/shared';

const root = fileURLToPath(new URL('../../', import.meta.url));
const content = loadContent(join(root, 'data'));
for (const [path, value] of Object.entries(JSON.parse(process.env.PATCH ?? '{}') as Record<string, unknown>)) {
  const keys = path.split('.');
  let o = content as unknown as Record<string, unknown>;
  for (const k of keys.slice(0, -1)) o = o[k] as Record<string, unknown>;
  o[keys.at(-1)!] = value;
}
// WEAPON='{"staff":{"vitality":0.35},"longbow":{"power":1.1}}' : multiplie des statistiques des armes d'une famille (essais).
for (const [fam, mul] of Object.entries(JSON.parse(process.env.WEAPON ?? '{}') as Record<string, Record<string, number>>))
  for (const m of Object.values(content.gearModels)) if (m.slot === 'weapon' && m.family === fam) m.stats = m.stats.map((x) => ({ ...x, value: x.value * (mul[x.stat] ?? 1) }));
// WEAPON_ADD='{"longbow":{"vitality":0.16}}' : ajoute une statistique aux armes d'une famille, en part de leur Puissance.
for (const [fam, add] of Object.entries(JSON.parse(process.env.WEAPON_ADD ?? '{}') as Record<string, Record<string, number>>))
  for (const m of Object.values(content.gearModels)) {
    if (m.slot !== 'weapon' || m.family !== fam) continue;
    const power = m.stats.find((x) => x.stat === 'power')?.value ?? 0;
    for (const [stat, k] of Object.entries(add)) m.stats = [...m.stats.filter((x) => x.stat !== stat), { stat, value: Math.round(power * k) } as (typeof m.stats)[number]];
  }
const combat = content.combat!;
const stages = routeStages(combat).filter((_, i) => i % 5 === 4 && i < 120);
const rows: { who: string; wins: number; dps: number }[] = [];
for (const [classId, kit] of Object.entries(combat.kits)) {
  // Arme essayée (WFAM) : ses statistiques et sa cadence.
  const wfam = () => (process.env.WFAM ? (JSON.parse(process.env.WFAM) as Record<string, string>)[classId]! : kit.weapons[0]!);
  for (const path of [null, ...kit.paths.map((p) => p.id)]) {
    let wins = 0;
    let n = 0;
    let dmg = 0;
    let time = 0;
    for (const st of stages) {
      // Le joueur a le niveau du palier de l'étape (voie à partir de 30 ; avant, la classe seule).
      const level = Math.max(1, st.tier);
      if ((path === null) !== (level < combat.pathLevel)) continue;
      const f = tierFactorAt(combat.rules, level);
      let stats = { ...combat.rules.referenceStats, power: combat.rules.referenceStats.power * f, maxHp: combat.rules.referenceStats.maxHp * f };
      // GEAR=1 : de vraies pièces Rare du palier de la courbe (celui du butin), arme de la classe ; parmi trois mélanges
      // (tout offensif, armure protectrice, moitié-moitié), celui qui gagne le mieux : ce que ferait un joueur qui calcule.
      let mixes: (typeof stats)[] = [stats];
      if (process.env.GEAR) {
        const tier = curveTier(combat.rules, level) ?? 1;
        const pick = (slot: string, orient: string) =>
          Object.values(content.gearModels).filter((m) => m.tier === tier && m.rarity === 'rare' && m.slot === slot && m.orientation === orient && !m.set && !m.talent && !m.starter && m.classes.includes(classId) && (slot !== 'weapon' || m.family === (process.env.WFAM ? JSON.parse(process.env.WFAM)[classId] : kit.weapons[0])))[0]?.id;
        const slots = Object.keys(content.gearSlots);
        const armor = ['head', 'torso', 'hands', 'legs', 'feet', 'cape', 'belt'];
        const build = (protect: (slot: string) => boolean) => {
          const equipment = slots.flatMap((slot) => {
            const id = pick(slot, protect(slot) ? 'protective' : 'offensive') ?? pick(slot, 'offensive');
            return id ? Array.from({ length: slot === 'ring' ? 2 : 1 }, () => ({ model: id, lines: [] })) : [];
          });
          return wornGear({ classId, equipment, combat: { ...emptyCombat(), xp: { [classId]: content.xpTable[level]! } } } as unknown as CharacterState, content)!.stats as typeof stats;
        };
        mixes = [build(() => false), build((s) => armor.includes(s)), build((s) => ['torso', 'legs', 'head'].includes(s))];
      }
      const scale0 = tierFactorAt(combat.rules, st.tier);
      const score = (x: typeof stats) => {
        let w = 0;
        for (let seed = 0; seed < 4; seed++) if (fight(combat, [{ id: 'p1', classId, pathId: path, plan: advisedPlan(combat, classId, path, level), weapon: wfam(), stats: x }], combat.encounters[st.encounter]!, { seed, enemyDamageScale: scale0, enemyHpScale: scale0 }).win) w++;
        return w;
      };
      // MIX=0|1|2 : impose un mélange (ce que porte un joueur qui ne calcule pas).
      stats = process.env.MIX ? mixes[Number(process.env.MIX)]! : mixes.map((x) => ({ x, w: score(x) })).sort((a, b) => b.w - a.w)[0]!.x;
      const setup: CombatantSetup = { id: 'p1', classId, pathId: path, plan: advisedPlan(combat, classId, path, level), weapon: wfam(), stats };
      const scale = tierFactorAt(combat.rules, st.tier);
      for (let seed = 0; seed < 4; seed++) {
        const r = fight(combat, [setup], combat.encounters[st.encounter]!, { seed, enemyDamageScale: scale, enemyHpScale: scale });
        n++;
        if (r.win) wins++;
        dmg += r.team[0]!.contributions.damage / scale;
        time += r.time;
      }
    }
    if (n) rows.push({ who: `${classId}/${path ?? 'avant voie'}`, wins: wins / n, dps: dmg / time });
  }
}
const mean = (k: 'wins' | 'dps', pre: boolean) => {
  const xs = rows.filter((r) => r.who.endsWith('avant voie') === pre);
  return xs.reduce((s, r) => s + r[k], 0) / xs.length;
};
for (const r of rows) {
  const pre = r.who.endsWith('avant voie');
  console.log(`${r.who.padEnd(24)} victoires ${(r.wins * 100).toFixed(0).padStart(3)} %   dégâts/s ${(r.dps / mean('dps', pre)).toFixed(2)} × la moyenne`);
}
