/**
 * Outils de situation (dossier PvE v2, `design/verification.yaml`) : pour chaque voie, chaque zone et chaque outil, le mur
 * (plus haut danger gagné à 90 %) avec la difficulté couplée du dossier : dégâts ennemis × D, PV ennemis × D^1,5.
 *
 * - Témoin : aucun outil (statistiques normalisées ; il n'existe pas encore de set généraliste branché dans le moteur).
 * - Candidats : ensemble 4, gemme majeure et préparation de chaque famille, seulement dans les zones où leur mécanique existe
 *   (ailleurs l'effet vaut zéro par construction : le résultat serait celui du témoin).
 * - Plans : les finalistes du criblage du kit (`screenPool`), chacun en quatre ouvertures (tout à 0 s, ou le sort le plus fort
 *   programmé à 4, 8 ou 10 s), et chaque priorité de cible utile à la zone. Le meilleur réglage est choisi sur les graines de
 *   criblage puis de confirmation ; le mur retenu est rejoué sur des graines réservées, jamais vues pendant le choix.
 */
import { type CombatContent, type Encounter, type FightResult, type PlanEntry, type Spell, type TargetPriority, type Tool, fight } from '@bramo/shared';
import { planOf, screenPool } from './combat-search.js';

export interface ToolsOptions {
  level: number;
  hpExponent: number;
  grid: number[];
  /** Largeur relative du dernier encadrement du mur. */
  refine: number;
  screenSeeds: number;
  confirmSeeds: { start: number; count: number };
  heldOutSeeds: { start: number; count: number };
  winRate: number;
  /** Fureur : délai × D^1,5 (pente de la route, puissance attendue constante). */
  furyScales: boolean;
  /** Configurations confirmées par case. */
  confirmed: number;
  finalists: number;
}

export const defaultToolsOptions: ToolsOptions = {
  level: 80,
  hpExponent: 1.5,
  grid: [1, 1.125, 1.25, 1.4, 1.5, 1.6, 1.75, 2, 2.25, 2.5, 2.8, 3.125, 3.5, 4, 4.5, 5, 6],
  refine: 0.03,
  screenSeeds: 4,
  confirmSeeds: { start: 2000, count: 32 },
  heldOutSeeds: { start: 10000, count: 64 },
  winRate: 0.9,
  furyScales: true,
  confirmed: 3,
  finalists: 5,
};

/** Familles utiles à une rencontre : celles dont la mécanique y existe. */
export function relevantFamilies(e: Encounter): Tool['family'][] {
  const out: Tool['family'][] = [];
  if (e.windows) out.push('interstice');
  if (e.erosion) out.push('rain');
  if (e.charge || e.attack.heavyEvery || (e.adds ?? []).some((a) => a.attack.heavyEvery)) out.push('impact');
  if (e.adds?.length) out.push('beat');
  if (e.guard) out.push('fracture');
  if (e.aura) out.push('breath');
  return out;
}

export interface Config {
  spells: string[];
  plan: PlanEntry[];
  opening: string;
  priority: TargetPriority;
}

export interface CellResult {
  path: string;
  encounter: string;
  /** Identifiant de l'outil, ou `none` pour le témoin. */
  tool: string;
  wall: number;
  /** Victoires sur les graines réservées au mur retenu ; et juste au-dessus (mur × (1 + refine)) sur la confirmation. */
  heldOut: number;
  above: number;
  /** Causes des défaites juste au-dessus du mur. */
  aboveLosses: Record<string, number>;
  /** Le mur dépasse la grille : valeur minimale. */
  censored: boolean;
  config: Config;
  /** Danger normal : temps médian des victoires du réglage le plus rapide (confirmation), et ses victoires. */
  normalTime: number | null;
  normalWinRate: number;
  /** Compteurs moyens au mur (graines réservées) : effets de l'outil et consommation. */
  metrics: Record<string, number>;
}

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[s.length >> 1]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};

/** Ouvertures : tout à 0 s (par cooldown croissant), ou le sort le plus fort programmé à 4, 8 ou 10 s. */
export function openings(spells: Spell[]): { id: string; plan: PlanEntry[] }[] {
  const base = planOf(spells);
  const top = [...spells].sort((a, b) => b.damage - a.damage)[0]!;
  return [
    { id: '0', plan: base },
    ...[4, 8, 10].map((at) => ({ id: `${top.id}@${at}`, plan: base.map((p) => (p.spell === top.id ? { ...p, at } : p)) })),
  ];
}

export function runCell(combat: CombatContent, pathId: string, encounter: Encounter, tool: Tool | null, pool: Spell[][], o: ToolsOptions): CellResult {
  const path = combat.paths[pathId]!;
  const weapon = combat.kits[path.class]!.weapons[0]!;
  const priorities: TargetPriority[] = ['chief'];
  if (encounter.adds?.length) priorities.push('adds_first');
  if (encounter.guard && encounter.enemies > 1) priorities.push('unguarded_first');
  const configs: Config[] = pool.flatMap((spells) => openings(spells).flatMap((op) => priorities.map((priority) => ({ spells: spells.map((s) => s.id), plan: op.plan, opening: op.id, priority }))));

  const play = (cfg: Config, danger: number, seed: number): FightResult => {
    const enc = o.furyScales && encounter.enrage ? { ...encounter, enrage: { ...encounter.enrage, after: encounter.enrage.after * danger ** o.hpExponent } } : encounter;
    return fight(combat, [{ id: 'p1', classId: path.class, pathId, plan: cfg.plan, weapon, ...(tool ? { tools: [tool] } : {}), targetPriority: cfg.priority }], enc, {
      seed,
      opening: 'sequence',
      enemyDamageScale: danger,
      enemyHpScale: danger ** o.hpExponent,
    });
  };
  const seeds = (s: { start: number; count: number }) => Array.from({ length: s.count }, (_, i) => s.start + i);
  const screen = Array.from({ length: o.screenSeeds }, (_, i) => i);
  const passes = (cfg: Config, danger: number, list: number[]) => {
    let wins = 0;
    for (let i = 0; i < list.length; i++) {
      if (play(cfg, danger, list[i]!).win) wins++;
      // Arrêt dès que le seuil est hors d'atteinte.
      if (list.length - (i + 1) - Math.ceil(o.winRate * list.length - wins) < 0) return false;
    }
    return wins >= Math.ceil(o.winRate * list.length - 1e-9);
  };
  /** Plus haut point de la grille franchi (recherche dichotomique, succès supposé décroissant avec le danger). */
  const gridWall = (cfg: Config, list: number[], lo = -1, hi = o.grid.length) => {
    // lo : indice franchi connu (-1 : aucun) ; hi : indice échoué connu.
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (passes(cfg, o.grid[mid]!, list)) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  // 1. Criblage de tous les réglages.
  const screened = configs.map((cfg) => ({ cfg, k: gridWall(cfg, screen) }));
  screened.sort((a, b) => b.k - a.k);
  const finalists = screened.slice(0, o.confirmed);
  // 2. Confirmation et encadrement fin du mur.
  const confirm = seeds(o.confirmSeeds);
  let best: { cfg: Config; wall: number; censored: boolean } | null = null;
  for (const f of finalists) {
    const k = gridWall(f.cfg, confirm, -1, Math.min(o.grid.length, f.k + 2));
    if (k < 0) {
      if (!best) best = { cfg: f.cfg, wall: 0, censored: false };
      continue;
    }
    let lo = o.grid[k]!;
    const censored = k === o.grid.length - 1;
    let hi = censored ? lo : o.grid[k + 1]!;
    while (hi / lo > 1 + o.refine) {
      const mid = Math.sqrt(lo * hi);
      if (passes(f.cfg, mid, confirm)) lo = mid;
      else hi = mid;
    }
    if (!best || lo > best.wall) best = { cfg: f.cfg, wall: lo, censored };
  }
  // 3. Graines réservées au mur retenu : on descend d'un cran fin tant qu'elles ne passent pas.
  const held = seeds(o.heldOutSeeds);
  let wall = best!.wall;
  const rate = (danger: number, list: number[]) => {
    const rs = list.map((s) => play(best!.cfg, danger, s));
    return { rs, rate: rs.filter((r) => r.win).length / list.length };
  };
  let heldRun = wall > 0 ? rate(wall, held) : { rs: [], rate: 0 };
  while (wall > 0 && heldRun.rate < o.winRate && wall > 1 / (1 + o.refine) ** 20) {
    wall /= 1 + o.refine;
    heldRun = rate(wall, held);
  }
  const aboveRun = rate((wall || 1) * (1 + o.refine), confirm);
  const aboveLosses: Record<string, number> = {};
  for (const r of aboveRun.rs) if (!r.win) aboveLosses[r.cause === 'death' ? `mort:${r.killedBy}` : 'temps'] = (aboveLosses[`${r.cause === 'death' ? `mort:${r.killedBy}` : 'temps'}`] ?? 0) + 1;
  const metrics: Record<string, number> = {};
  for (const r of heldRun.rs) for (const [k, v] of Object.entries(r.team[0]!.metrics)) if (/Bonus|banked|released|Removed|Avoided|Healed|cover|potions|erosionDamage|auraDamage|hpLost/.test(k)) metrics[k] = (metrics[k] ?? 0) + v / heldRun.rs.length;
  // Vitesse au danger normal : le plus rapide des réglages confirmés et des plus rapides du criblage.
  let normalTime: number | null = null;
  let normalWinRate = 0;
  for (const cfg of new Set([...finalists.map((f) => f.cfg), best!.cfg])) {
    const rs = confirm.map((s) => play(cfg, 1, s));
    const wr = rs.filter((r) => r.win).length / rs.length;
    const t = median(rs.filter((r) => r.win).map((r) => r.time));
    if (wr >= o.winRate && t !== null && (normalTime === null || t < normalTime)) {
      normalTime = t;
      normalWinRate = wr;
    }
  }
  return { path: pathId, encounter: encounter.id, tool: tool?.id ?? 'none', wall, heldOut: heldRun.rate, above: aboveRun.rate, aboveLosses, censored: best!.censored, config: best!.cfg, normalTime, normalWinRate, metrics };
}

export interface CellJob {
  path: string;
  encounter: string;
  tool: string;
}

/** Toutes les cases : chaque voie, chaque rencontre, le témoin et les outils de familles présentes. */
export function jobs(combat: CombatContent, tools: Tool[], ranks: Tool['rank'][] = ['set4', 'gem', 'prep']): CellJob[] {
  const out: CellJob[] = [];
  for (const path of Object.keys(combat.paths)) {
    for (const enc of Object.values(combat.encounters)) {
      out.push({ path, encounter: enc.id, tool: 'none' });
      for (const family of relevantFamilies(enc)) for (const t of tools.filter((x) => x.family === family && ranks.includes(x.rank))) out.push({ path, encounter: enc.id, tool: t.id });
    }
  }
  return out;
}

export function runJobs(combat: CombatContent, tools: Tool[], list: CellJob[], o: ToolsOptions, onDone?: (r: CellResult, i: number) => void): CellResult[] {
  const pools = new Map<string, Spell[][]>();
  return list.map((j, i) => {
    if (!pools.has(j.path)) pools.set(j.path, screenPool(combat, j.path, { level: o.level, screenSeeds: 2, finalists: o.finalists, opening: 'sequence' }));
    const tool = j.tool === 'none' ? null : tools.find((t) => t.id === j.tool)!;
    const r = runCell(combat, j.path, combat.encounters[j.encounter]!, tool, pools.get(j.path)!, o);
    onDone?.(r, i);
    return r;
  });
}

// --- Rapport -----------------------------------------------------------------------------------------------------

const fr = (n: number | null, d = 2) => (n === null ? '—' : n.toFixed(d).replace('.', ','));
const pct = (n: number) => `${n >= 0 ? '+' : ''}${fr(n * 100, 0)} %`;

export function toolsMarkdown(combat: CombatContent, tools: Tool[], results: CellResult[], o: ToolsOptions, title: string, note: string): string {
  const enc = Object.values(combat.encounters);
  const paths = Object.values(combat.paths);
  const get = (p: string, e: string, t: string) => results.find((r) => r.path === p && r.encounter === e && r.tool === t);
  const toolName = (id: string) => (id === 'none' ? 'aucun' : (tools.find((t) => t.id === id)?.name ?? id));
  const md: string[] = [`# ${title}`, '', '> Généré par `pnpm --filter @bramo/sim sim combat-tools`. Ne pas modifier à la main.', '', note, ''];
  md.push(
    `**Méthode.** Difficulté couplée : dégâts ennemis × D, PV (et garde, soins ennemis) × D^${fr(o.hpExponent, 1)}${o.furyScales ? ', délai de fureur × D^1,5' : ''}. Mur : plus haut D gagné à ${o.winRate * 100} % ; grille ${o.grid.map((g) => fr(g, 3)).join(' / ')}, puis encadrement à ${o.refine * 100} %. Plans : ${o.finalists}+ finalistes du criblage du kit par voie (répertoire ${o.level}), quatre ouvertures chacun (tout à 0 s, ou le sort le plus fort à 4, 8 ou 10 s) et les priorités de cible utiles ; ouverture « séquence ». Choix du réglage sur ${o.screenSeeds} graines puis ${o.confirmSeeds.count} graines (${o.confirmSeeds.start}+) ; mur rejoué sur ${o.heldOutSeeds.count} graines réservées (${o.heldOutSeeds.start}+), descendu de 3 % tant qu'elles ne passent pas à 90 %. Témoin : aucun outil, statistiques normalisées (P 100, PV 2 800 au répertoire 80) ; un outil hors de sa mécanique vaut zéro par construction.`,
    '',
    '**Ratio** : mur de l’outil / mur du témoin, même voie (multiplicatif : ×2 → ×2,25 = +12,5 %).',
    '',
  );
  // Critères.
  const families = [...new Set(tools.map((t) => t.family))];
  const adapted = (e: Encounter) => relevantFamilies(e);
  const ratio = (p: string, e: string, t: string) => {
    const a = get(p, e, t);
    const b = get(p, e, 'none');
    return a && b && b.wall > 0 ? a.wall / b.wall : null;
  };
  md.push('## Critères d’acceptation solo', '');
  // 1. ≥ 6 zones où l'outil adapté (meilleur set 4 des familles présentes) donne ≥ 1,25 pour chaque voie.
  const zoneOk = enc.map((e) => {
    const per = paths.map((p) => Math.max(...adapted(e).map((f) => ratio(p.id, e.id, tools.find((t) => t.family === f && t.rank === 'set4')!.id) ?? 0)));
    return { e, per, all: per.every((x) => x >= 1.25), median: [...per].sort((a, b) => a - b)[per.length >> 1]!, worst: Math.min(...per) };
  });
  const c1 = zoneOk.filter((z) => z.all).length;
  md.push(`1. **Outil adapté ≥ ×1,25 pour chaque voie : ${c1} zone${c1 > 1 ? 's' : ''} sur ${enc.length}** (critère : au moins 6) — ${c1 >= 6 ? 'tenu' : '**non tenu**'}.`, '');
  md.push('| Zone | Famille | Ratio médian (set 4) | Pire voie | Voies ≥ ×1,25 |', '|---|---|---|---|---|');
  for (const z of zoneOk) {
    const worstPath = paths[z.per.indexOf(z.worst)]!.name;
    md.push(`| ${z.e.name} | ${adapted(z.e).join(', ')} | ×${fr(z.median)} | ×${fr(z.worst)} (${worstPath}) | ${z.per.filter((x) => x >= 1.25).length}/9 |`);
  }
  md.push('');
  // 2. Chaque set et gemme premier de sa catégorie dans ≥ 2 zones (mur médian sur les neuf voies).
  md.push('2. **Chaque outil premier de sa catégorie dans au moins deux zones** (mur médian des neuf voies, entre outils de même rang ; une zone sans aucun outil de la catégorie qui dépasse le témoin ne compte pour personne).', '');
  md.push('| Rang | ' + families.join(' | ') + ' |', `|---|${families.map(() => '---').join('|')}|`);
  for (const rank of ['set4', 'gem', 'prep'] as const) {
    const firsts: Record<string, number> = Object.fromEntries(families.map((f) => [f, 0]));
    for (const e of enc) {
      const meds = families.map((f) => {
        const t = tools.find((x) => x.family === f && x.rank === rank)!;
        const ws = paths.map((p) => get(p.id, e.id, adapted(e).includes(f) ? t.id : 'none')?.wall ?? 0).sort((a, b) => a - b);
        return { f, m: ws[ws.length >> 1]! };
      });
      const none = [...paths.map((p) => get(p.id, e.id, 'none')?.wall ?? 0)].sort((a, b) => a - b)[paths.length >> 1]!;
      const top = Math.max(...meds.map((x) => x.m));
      if (top > none) for (const x of meds) if (x.m === top) firsts[x.f]!++;
    }
    md.push(`| ${rank} | ${families.map((f) => `${firsts[f]}${firsts[f]! >= 2 ? '' : ' **✗**'}`).join(' | ')} |`);
  }
  md.push('');
  // 3. Aucune voie sous ×1,5 avec son meilleur outil.
  const below: string[] = [];
  for (const p of paths) for (const e of enc) {
    const best = Math.max(...results.filter((r) => r.path === p.id && r.encounter === e.id).map((r) => r.wall));
    if (best < 1.5) below.push(`${p.name} · ${e.name} (×${fr(best)})`);
  }
  md.push(`3. **Mur ≥ ×1,5 avec le meilleur outil, partout** — ${below.length ? `**non tenu : ${below.length} cas** : ${below.join(' ; ')}` : 'tenu'}.`, '');
  // 4. DPS le plus rapide de sa classe dans ≥ 7 zones (danger normal, meilleur outil de chaque voie, ≥ 90 %).
  md.push('4. **Voie de dégâts la plus rapide de sa classe dans au moins 7 zones** (danger normal, meilleur outil de chaque voie, ≥ 90 % de victoires).', '');
  md.push('| Classe | Zones où le DPS est le plus rapide | Zones perdues (voie plus rapide) |', '|---|---|---|');
  for (const kit of Object.values(combat.kits)) {
    const fastest = (pid: string, e: string) => Math.min(...results.filter((r) => r.path === pid && r.encounter === e && r.normalTime !== null).map((r) => r.normalTime!));
    const dps = kit.paths.find((p) => p.role === 'damage')!;
    const lost: string[] = [];
    let n = 0;
    for (const e of enc) {
      const d = fastest(dps.id, e.id);
      const other = kit.paths.filter((p) => p.id !== dps.id).map((p) => ({ p, t: fastest(p.id, e.id) })).sort((a, b) => a.t - b.t)[0]!;
      if (d <= other.t) n++;
      else lost.push(`${e.name} (${other.p.name} ${fr(other.t, 1)} s contre ${fr(d, 1)} s)`);
    }
    md.push(`| ${kit.label} | ${n}/12${n >= 7 ? '' : ' **✗**'} | ${lost.join(' ; ') || '—'} |`);
  }
  md.push('');
  // Détail par zone.
  md.push('## Murs par zone', '', 'Chaque case : mur (graines réservées : victoires) et ratio au témoin. Ensuite : réglage du meilleur outil (ouverture, priorité).', '');
  for (const e of enc) {
    const fams = adapted(e);
    const cols = ['none', ...fams.flatMap((f) => (['set4', 'gem', 'prep'] as const).map((r) => tools.find((t) => t.family === f && t.rank === r)!.id))];
    md.push(`### ${e.name}`, '', `| Voie | ${cols.map(toolName).join(' | ')} | Meilleur réglage |`, `|---|${cols.map(() => '---').join('|')}|---|`);
    for (const p of paths) {
      const cells = cols.map((t) => {
        const r = get(p.id, e.id, t);
        if (!r) return '—';
        const q = t === 'none' ? '' : ` (${pct((ratio(p.id, e.id, t) ?? 0) - 1)})`;
        return `${r.censored ? '≥ ' : ''}×${fr(r.wall)}${q}${r.heldOut < o.winRate ? ' **!**' : ''}`;
      });
      const bestR = results.filter((r) => r.path === p.id && r.encounter === e.id).sort((a, b) => b.wall - a.wall)[0];
      const cfg = bestR ? `${toolName(bestR.tool)} : ${bestR.config.spells.map((s) => combat.spells[s]?.name ?? s).join(', ')} · ouverture ${bestR.config.opening} · ${bestR.config.priority}` : '—';
      md.push(`| ${p.name} | ${cells.join(' | ')} | ${cfg} |`);
    }
    md.push('');
  }
  md.push('## Échecs juste au-dessus du mur', '', 'Causes des défaites à mur × 1,03 (graines de confirmation), meilleur outil de chaque case.', '');
  const causes: Record<string, number> = {};
  for (const r of results) for (const [k, v] of Object.entries(r.aboveLosses)) causes[k] = (causes[k] ?? 0) + v;
  md.push(Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k} : ${v}`).join('\n'), '');
  return md.join('\n');
}
