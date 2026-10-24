/**
 * Audit des systèmes, phase 3 : les outils de simulation correspondent-ils encore au moteur du jeu ? (docs/audit/PROMPT.md,
 * ajout n° 3). Sept vérifications, chacune contre le vrai moteur (`fight`, `combatantOf`, `wornLoadout`) et `data/` :
 *
 * 1. Parité banc / jeu : le témoin du banc (`makeBuild`, Rare de palier 20 sans ligne) et le même équipement porté par un
 *    vrai personnage de niveau 20 (`combatantOf`, plancher et points forts de classe compris).
 * 2. Fidélité du cache du simulateur de serveur (`sim/src/server/fightCache.ts`) : arrondi du build et 6 graines, contre le
 *    combat exact sur 6 et 60 graines.
 * 3. Contexte de la Puissance : ce que le combattant reçoit en route, en Marée, en Lice et en donjon, et le contexte que la
 *    Marée utilise vraiment (`tideScore` appelle `combatantOf` sans contexte).
 * 4. Le plancher : il ne baisse jamais d'un niveau au suivant (indice de mur du plancher, niveaux 1 à 99).
 * 5. Le plancher l'emporte-t-il sur un vrai équipement ? (part des niveaux où un Rare / Épique de son palier est sous le plancher).
 * 6. Déterminisme : deux appels identiques de `fight` donnent le même résultat.
 * 7. Vitesse du moteur : millisecondes par rencontre (sert au coût des phases suivantes).
 * 8. Le temps de monter les niveaux de classe.
 * 9. L'unité des rapports du banc : un palier d'équipement vaut-il ×1,096 de mur ?
 *
 * pnpm --filter @bramo/sim exec tsx src/audit/verifier.ts      (écrit sim/reports/audit/verifier.md)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type CharacterState,
  type CombatStats,
  type CombatantSetup,
  type Content,
  type Encounter,
  combatantOf,
  curveTier,
  emptyCombat,
  fight,
  routeStage,
  tierFactorAt,
  wallIndex,
  wornGear,
  wornLoadout,
  wornPieces,
} from '@bramo/shared';
import { loadContent } from '@bramo/shared/node';
import { buildKit } from '../coherence/kits.js';
import { type Lab, wallOf } from '../coherence/lab.js';
import { makeBuild, witnessSpec } from '../scenarios/combat-build.js';
import { installFightCache, probe } from '../server/fightCache.js';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const content: Content = loadContent(join(ROOT, 'data'), join(ROOT, 'art'));
const combat = content.combat!;
const out: string[] = ['# Vérification des outils de simulation (audit, phase 3)', ''];
const fr = (n: number, d = 1) => n.toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d });
const pc = (x: number, d = 1) => `${fr(100 * x, d)} %`;

/** Un personnage de test : classe, niveau, équipement (modèles, lignes vides), systèmes de Puissance. */
function character(classId: string, level: number, models: string[], power?: CharacterState['power']): CharacterState {
  return {
    seed: 1,
    classId,
    equipment: models.map((model) => ({ model, lines: [] })),
    combat: { ...emptyCombat(), xp: { [classId]: content.xpTable[level]! } },
    ...(power ? { power } : {}),
  } as unknown as CharacterState;
}
const statLine = (s: Partial<CombatStats>) =>
  `P ${fr(s.power ?? 0)} · PV ${fr(s.maxHp ?? 0, 0)} · Déf ${pc(s.damageReduction ?? 0)} · Crit ${pc(s.critChance ?? 0)} · Cad ${pc(s.haste ?? 0)}`;

// --- 1. Parité banc / jeu -----------------------------------------------------------------------------------------------
out.push('## 1. Le témoin du banc et le même équipement en jeu', '', '| Classe | Banc (`makeBuild`) | Jeu (`combatantOf`, niveau 20) | Plancher ? | Écart de Puissance |', '|---|---|---|---|---|');
const lab: Lab = { content, combat, encounters: [], catalog: combat.talents!, tools: combat.tools, reports: 'audit' };
const parity: Record<string, number> = {};
for (const classId of Object.keys(combat.kits)) {
  const path = combat.kits[classId]!.paths[0]!.id;
  const bench = makeBuild(lab, path, witnessSpec('none'));
  const kit = buildKit(content, { classId, tier: 20, rarity: 'rare', orientation: 'mixed', rolls: 'none' });
  const state = character(classId, 20, kit.models);
  const game = combatantOf(state, content);
  const floored = !!wornGear(state, content)?.floored;
  parity[classId] = (game.stats?.power ?? 0) / bench.stats.power - 1;
  out.push(`| ${classId} | ${statLine(bench.stats)} | ${statLine(game.stats ?? {})} | ${floored ? 'oui' : 'non'} | ${parity[classId]! >= 0 ? '+' : ''}${pc(parity[classId]!)} |`);
}
out.push('', 'Le banc ne voit pas les points forts de classe (`data/power/4-classes.yaml`, actifs d\'office) : le Traqueur a +8 % de Puissance sur la route dans le jeu, pas au banc.', '');

// --- 2. Fidélité du cache du simulateur de serveur -----------------------------------------------------------------------
const cases: { label: string; setup: CombatantSetup; enc: Encounter; scale: number }[] = [];
const stageOf = (n: number) => routeStage(combat, n - 1);
for (const [classId, level, stage] of [['tracker', 40, 45], ['forgefire', 40, 45], ['runist', 60, 70], ['forgefire', 60, 70], ['tracker', 25, 30], ['runist', 25, 30]] as const) {
  const kit = buildKit(content, { classId, tier: curveTier(combat.rules, level)!, rarity: 'rare', orientation: 'mixed', rolls: 'none' });
  const st = stageOf(stage);
  // Un joueur qui a monté ses systèmes : les petites statistiques spéciales (régénération, contre-attaque) sont celles que
  // l'arrondi au centième touche le plus.
  const power = { recherches: { levels: { fil_de_lame: 10, cuir_epais: 10, coup_franc: 4, riposte: 3, bonne_mine: 4, elan: 3 }, pending: [] }, lanterne: { levels: { meche: 20, meche_longue: 1, halo: 1 }, pending: [] }, reliques: { levels: {}, pending: [] } };
  const setup = combatantOf(character(classId, level, kit.models, power), content);
  cases.push({ label: `${classId} niv. ${level}, étape ${st.label}`, setup, enc: combat.encounters[st.encounter]!, scale: tierFactorAt(combat.rules, st.tier) });
}
const exact = (c: (typeof cases)[number], seeds: number[]) => {
  const rs = seeds.map((seed) => fight(combat, [c.setup], c.enc, { seed, enemyDamageScale: c.scale, enemyHpScale: c.scale }));
  return { winRate: rs.filter((r) => r.win).length / rs.length, time: rs.reduce((a, r) => a + r.time, 0) / rs.length };
};
// Au mur : la difficulté où le combat exact gagne une fois sur deux (60 graines), là où un arrondi compte vraiment.
const seedsWall = Array.from({ length: 60 }, (_, i) => i);
for (const c of cases) {
  let lo = c.scale;
  let hi = c.scale * 4;
  for (let i = 0; i < 18; i++) {
    const mid = Math.sqrt(lo * hi);
    if (exact({ ...c, scale: mid }, seedsWall).winRate >= 0.5) lo = mid;
    else hi = mid;
  }
  c.scale = lo;
  c.label += ' (au mur)';
}
out.push('## 2. Le cache du simulateur de serveur', '', 'Même combattant (systèmes de Puissance montés : régénération 0,27 %/s, contre-attaque 1,2 %, combo 1,2 %), même rencontre. « Cache » = build arrondi (Puissance et PV par pas de 2 %, le reste au centième) et graines 0 à 5, comme `fightCache.ts`.', '', '| Cas | Régén. / contre / combo (exact → arrondi) | Victoires exactes, graines 0-5 | Cache | Victoires exactes, 60 graines | Exact sur 60 graines, petites parts arrondies seulement | Durée exacte / cache (s) |', '|---|---|---|---|---|---|---|');
const seeds6 = [0, 1, 2, 3, 4, 5];
const seeds60 = Array.from({ length: 60 }, (_, i) => i);
const cache = installFightCache();
for (const c of cases) {
  const e6 = exact(c, seeds6);
  const e60 = exact(c, seeds60);
  const p = probe(combat, c.setup, c.enc, c.scale);
  const s = c.setup.stats ?? {};
  const r2 = (x?: number) => Math.round((x ?? 0) * 100) / 100;
  // Seulement l'arrondi des parts au centième (régénération, contre-attaque, combo, critique…), sur 60 graines : le biais de l'arrondi sans le bruit des 6 graines.
  const parts = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, typeof v === 'number' && k !== 'power' && k !== 'maxHp' ? r2(v) : v]));
  const eParts = exact({ ...c, setup: { ...c.setup, stats: parts } }, seeds60);
  out.push(`| ${c.label} | ${fr(100 * (s.regen ?? 0), 2)} / ${fr(100 * (s.counter ?? 0), 1)} / ${fr(100 * (s.combo ?? 0), 1)} % → ${fr(100 * r2(s.regen), 0)} / ${fr(100 * r2(s.counter), 0)} / ${fr(100 * r2(s.combo), 0)} % | ${pc(e6.winRate, 0)} | ${pc(p.winRate, 0)} | ${pc(e60.winRate, 0)} | ${pc(eParts.winRate, 0)} | ${fr(e6.time)} / ${fr(p.time)} |`);
}
cache.uninstall();
out.push('');

// --- 3. Contexte de la Puissance -------------------------------------------------------------------------------------------
out.push('## 3. Les points forts de classe selon le contenu', '', '| Classe | Route | Marée (`tide`) | Lice (`arena`) | Donjon (`dungeon`) |', '|---|---|---|---|---|');
for (const classId of Object.keys(combat.kits)) {
  const kit = buildKit(content, { classId, tier: 20, rarity: 'rare', orientation: 'mixed', rolls: 'none' });
  const state = character(classId, 20, kit.models);
  const cell = (ctx: 'route' | 'tide' | 'arena' | 'dungeon') => {
    const s = combatantOf(state, content, ctx).stats ?? {};
    return `P ${fr(s.power ?? 0)}, PV ${fr(s.maxHp ?? 0, 0)}`;
  };
  out.push(`| ${classId} | ${cell('route')} | ${cell('tide')} | ${cell('arena')} | ${cell('dungeon')} |`);
}
out.push('', 'Dans le jeu, `tideScore` (`packages/shared/src/combat/tide.ts`) appelle `combatantOf(state, content)` sans contexte, donc « route » : la Marée applique le bonus de route du Traqueur et ignore celui du Runiste et la recherche « Le Savoir de la Marée ». Aucun appel du jeu ne passe `arena` ni `dungeon` (ces contenus n\'existent pas) : le point fort du Forgefeu ne s\'applique nulle part.', '');

// --- 4 et 5. Le plancher --------------------------------------------------------------------------------------------------
out.push('## 4. Le plancher, niveau par niveau', '');
const ref = combat.rules.referenceStats;
const conv = combat.rules.gearStats!;
const floorAt = (L: number): CombatStats => {
  const f = tierFactorAt(combat.rules, L);
  const ramp = conv.floorRampLevel ? Math.min(1, (L - 1) / (conv.floorRampLevel - 1)) : 1;
  const share = 1 - (1 - (conv.floorShare ?? 1)) * ramp;
  return { ...ref, power: ref.power * f * share, maxHp: ref.maxHp * f * share };
};
const drops: number[] = [];
for (let L = 2; L <= 99; L++) if (wallIndex(floorAt(L)) < wallIndex(floorAt(L - 1)) - 1e-9) drops.push(L);
out.push(drops.length ? `Le plancher baisse aux niveaux ${drops.join(', ')}.` : 'Le plancher ne baisse jamais d\'un niveau au suivant (niveaux 1 à 99).', '');
out.push('## 5. Un vrai équipement contre le plancher', '', 'Équipement complet d\'une rareté au palier de la courbe du niveau (sans ligne aléatoire, sans ensemble), porté au niveau L. « Plancher » : le plancher l\'emporte (l\'équipement ne compte pas).', '', '| Niveau | Commun | Rare | Épique | Légendaire |', '|---|---|---|---|---|');
for (const L of [1, 5, 9, 10, 15, 19, 20, 25, 29, 30, 35, 39, 40, 45, 49, 50, 59, 60, 70, 80, 89, 90]) {
  const row = (['common', 'rare', 'epic', 'legendary'] as const).map((rarity) => {
    const kit = buildKit(content, { classId: 'forgefire', tier: curveTier(combat.rules, L)!, rarity, orientation: 'mixed', rolls: 'none' });
    const state = character('forgefire', L, kit.models);
    const w = wornLoadout(combat.rules, combat.talents, combat.tools, wornPieces(state.equipment!, content));
    const ratio = wallIndex(w.stats) / wallIndex(floorAt(L));
    return `${ratio < 1 ? '**plancher**' : 'équipement'} (${fr(ratio, 2)})`;
  });
  out.push(`| ${L} | ${row.join(' | ')} |`);
}
out.push('', 'Entre parenthèses : indice de mur de l\'équipement / indice de mur du plancher. Sous 1, toutes les statistiques de l\'équipement sont remplacées par le plancher (`wornLoadout`) : critique, Cadence, Défense choisies n\'y changent rien ; seuls les talents, ensembles et outils comptent encore.', '');

// --- 6. Déterminisme ------------------------------------------------------------------------------------------------------
const c0 = cases[0]!;
const a = fight(combat, [c0.setup], c0.enc, { seed: 42, enemyDamageScale: c0.scale, enemyHpScale: c0.scale, trace: true });
const b = fight(combat, [c0.setup], c0.enc, { seed: 42, enemyDamageScale: c0.scale, enemyHpScale: c0.scale, trace: true });
out.push('## 6. Déterminisme', '', JSON.stringify(a) === JSON.stringify(b) ? 'Deux appels identiques de `fight` donnent exactement le même résultat, journal compris.' : '**Deux appels identiques donnent des résultats différents.**', '');

// --- 7. Vitesse du moteur -------------------------------------------------------------------------------------------------
const N = 600;
const t0 = performance.now();
let simulated = 0;
for (let i = 0; i < N; i++) {
  const c = cases[i % cases.length]!;
  simulated += fight(combat, [c.setup], c.enc, { seed: 1000 + i, enemyDamageScale: c.scale, enemyHpScale: c.scale }).time;
}
const msPer = (performance.now() - t0) / N;
out.push('## 7. Vitesse du moteur', '', `${N} rencontres de la route (${fr(simulated / N)} s de combat en moyenne) : ${fr(msPer, 2)} ms de calcul par rencontre, sur cette machine, un seul cœur.`, '');

// --- 8. Le temps de monter un niveau de classe -------------------------------------------------------------------------------
// XP de classe par heure de combat gagné : R(L) = xpPerHour × 2^((L−1)/xpDoubling) (`classXpPerHour`, sans rattrapage ni Banquet) ;
// une heure de route ≈ (durée de combat) / (durée + repos) heures de combat créditées, toutes victoires.
const prog = combat.rules.progression;
const rate = (L: number) => prog.xpPerHour * 2 ** ((L - 1) / prog.xpDoubling);
const share = 21 / (21 + prog.rest);
let hours = 0;
const reach: Record<number, number> = {};
for (let L = 1; L < 99; L++) {
  hours += (content.xpTable[L + 1]! - content.xpTable[L]!) / rate(L) / share;
  reach[L + 1] = hours;
}
out.push('## 8. Le temps de monter les niveaux de classe', '', `Heures de route (combats de 21 s, repos ${prog.rest} s, toutes gagnées, sans coup de fouet ni Banquet) pour atteindre un niveau depuis le niveau 1, et pour les 10 niveaux suivants. Une journée de jeu = 16 h d'autonomie au plus.`, '', '| Niveau | Depuis le niveau 1 | Les 10 niveaux suivants |', '|---|---|---|');
for (const L of [10, 20, 30, 40, 50, 60, 70, 80, 89]) out.push(`| ${L} | ${fr(reach[L]!, 0)} h (${fr(reach[L]! / 16, 1)} j à 16 h/j) | ${fr(reach[L + 10]! - reach[L]!, 0)} h (${fr((reach[L + 10]! - reach[L]!) / 16, 1)} j) |`);
out.push('');

// --- 9. L'unité des rapports du banc : un palier = ×1,096 de mur ? ------------------------------------------------------------
// Le banc mesure le « mur » en danger D (dégâts ennemis × D, PV × D^1,5) et convertit en paliers avec ×1,096 par palier
// (`lab.ts` PALIER). Dans le jeu, un palier de plus, c'est +12 % de Puissance et de PV pour le personnage. On vérifie : le même
// témoin, Puissance et PV × 1,12, gagne-t-il bien ×1,096 de mur ?
{
  const encs = Object.values(combat.encounters).filter((e) => e.kind === 'zone' || e.kind === 'gardien');
  const lab9: Lab = { content, combat, encounters: encs, catalog: combat.talents!, tools: combat.tools, reports: 'audit' };
  const seeds = Array.from({ length: 8 }, (_, i) => 700 + i);
  out.push('## 9. Un palier d\'équipement vaut-il ×1,096 de mur ?', '', 'Témoin du banc (Rare de palier 20, plan conseillé), puis le même avec Puissance et PV × 1,12 ; mur = plus haut danger gagné 7 fois sur 8 (`wallOf`).', '', '| Voie | Rapport de mur médian sur les 18 rencontres | Plus bas | Plus haut |', '|---|---|---|---|');
  for (const path of ['red_temper', 'beastslayer', 'fulgurant']) {
    const b0 = makeBuild(lab9, path, witnessSpec('none'));
    const b1 = { ...b0, stats: { ...b0.stats, power: b0.stats.power * 1.12, maxHp: b0.stats.maxHp * 1.12 } };
    const plan = combat.plans[`${path}_advised`]!.levels['80']!;
    const ratios = encs.map((e) => wallOf(lab9, path, { ...b1, plan }, e, seeds, 0.875, 0.01).wall / wallOf(lab9, path, { ...b0, plan }, e, seeds, 0.875, 0.01).wall).sort((x, y) => x - y);
    out.push(`| ${combat.paths[path]!.name} | ×${fr(ratios[ratios.length >> 1]!, 3)} | ×${fr(ratios[0]!, 3)} | ×${fr(ratios.at(-1)!, 3)} |`);
  }
  out.push('');
}

const dir = join(ROOT, 'sim', 'reports', 'audit');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'verifier.md'), `${out.join('\n')}\n`);
console.log(out.join('\n'));
