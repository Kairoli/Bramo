/**
 * Recale le danger de chaque rencontre de la route après un changement de rythme : pour chaque zone et chaque gardien, le
 * multiplicateur des dégâts ennemis qui redonne le niveau de classe requis d'avant (`needed.ts` : le plus petit niveau où
 * chaque classe gagne 8 combats sur 10 avec le set de départ), plus `HARDER` niveaux (« pas trop simple », Louis). Seuls les
 * dégâts bougent : les durées des combats (et donc les limites de temps) ne changent pas.
 *
 * pnpm --filter @bramo/sim exec tsx src/tempo/tune.ts <dossier data d'avant> [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type CharacterState, type Content, type Encounter, combatantOf, emptyCombat, fight, routeStage, routeStages, tierFactorAt } from '@bramo/shared';
import { loadContent } from '@bramo/shared/node';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const before = loadContent(process.argv[2]!, `${root}art`);
const after = loadContent(`${root}data`, `${root}art`);
const HARDER = Number(process.env.HARDER ?? 1);
const classes = Object.keys(after.combat!.kits);

function winsAt(content: Content, enc: Encounter, classId: string, level: number, tier: number, dmg = 1): number {
  const combat = content.combat!;
  const starter = Object.values(content.gearModels).filter((m) => m.starter && m.classes.includes(classId));
  const state = { seed: 1, classId, equipment: starter.map((m) => ({ model: m.id, lines: [] })), combat: { ...emptyCombat(), xp: { [classId]: content.xpTable[level]! } } } as unknown as CharacterState;
  const setup = combatantOf(state, content);
  const s = tierFactorAt(combat.rules, tier);
  let w = 0;
  for (let seed = 1; seed <= 10; seed++) if (fight(combat, [setup], enc, { seed, enemyDamageScale: s * dmg, enemyHpScale: s }).win) w++;
  return w;
}
/** Plus petit niveau qui gagne 8 sur 10 (recherche par dichotomie ; 100 si aucun). */
function need(content: Content, enc: Encounter, classId: string, tier: number, dmg = 1): number {
  if (winsAt(content, enc, classId, 99, tier, dmg) < 8) return 100;
  let lo = 1;
  let hi = 99;
  if (winsAt(content, enc, classId, 1, tier, dmg) >= 8) return 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (winsAt(content, enc, classId, mid, tier, dmg) >= 8) hi = mid;
    else lo = mid;
  }
  return hi;
}

const stages = routeStages(after.combat!);
const out: string[] = ['| Rencontre | Étapes | Niveau requis avant | après (sans retouche) | dégâts × | après |', '|---|---|---|---|---|---|'];
const factors: Record<string, number> = {};
for (const enc of Object.values(after.combat!.encounters).filter((e) => e.kind === 'zone' || e.kind === 'gardien')) {
  // Étapes représentatives : la 5e et la 9e de sa zone, ou ses étapes de gardien.
  const mine = stages.filter((s) => s.encounter === enc.id && (enc.kind === 'gardien' || [4, 8].includes(s.index % 10)));
  const target = mine.flatMap((s) => classes.map((c) => Math.min(99, need(before, before.combat!.encounters[enc.id]!, c, s.tier) + HARDER)));
  const gap = (d: number) => {
    const got = mine.flatMap((s) => classes.map((c) => need(after, enc, c, s.tier, d)));
    return got.reduce((a, g, i) => a + (Math.min(g, 100) - target[i]!), 0) / got.length;
  };
  let lo = 0.5;
  let hi = 3;
  const g0 = gap(1);
  let d = 1;
  if (Math.abs(g0) > 0.5) {
    for (let i = 0; i < 9; i++) {
      d = Math.sqrt(lo * hi);
      if (gap(d) < 0) lo = d;
      else hi = d;
    }
    d = Math.round(Math.sqrt(lo * hi) * 100) / 100;
  }
  // OVERRIDE='{"z01_lantern_road":1.3}' : un multiplicateur choisi à la main (la première zone doit rester facile).
  const forced = (JSON.parse(process.env.OVERRIDE ?? '{}') as Record<string, number>)[enc.id];
  if (forced) d = forced;
  factors[enc.id] = d;
  const show = (fn: (c: string, t: number) => number) => mine.map((s) => classes.map((c) => fn(c, s.tier)).join('/')).join(' · ');
  out.push(`| ${enc.name} | ${mine.map((s) => s.label).join(', ')} | ${show((c, t) => need(before, before.combat!.encounters[enc.id]!, c, t))} | ${show((c, t) => need(after, enc, c, t))} | ${d} | ${show((c, t) => need(after, enc, c, t, d))} |`);
  console.error(`${enc.id} : ×${d}`);
}
console.log(out.join('\n'));
if (process.argv.includes('--write')) {
  const f = `${root}data/combat/encounters.yaml`;
  let s = readFileSync(f, 'utf8');
  s = s.replace(/^- (\{.*\})$/gm, (line, json) => {
    const e = JSON.parse(json) as Encounter & Record<string, any>;
    const d = factors[e.id];
    if (!d || d === 1) return line;
    const r1 = (x: number) => Math.round(x * d * 10) / 10;
    e.attack.damage = r1(e.attack.damage);
    for (const a of e.adds ?? []) a.attack.damage = r1(a.attack.damage);
    if (e.charge) e.charge.damage = Math.round(e.charge.damage * d);
    if (e.aura) e.aura.damage = r1(e.aura.damage);
    if (e.erosion) e.erosion.damage = r1(e.erosion.damage);
    return `- ${JSON.stringify(e)}`;
  });
  writeFileSync(f, s);
  console.error('Écrit : data/combat/encounters.yaml');
}
