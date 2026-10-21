import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Content } from '@bramo/shared';
import { ROOT, loadVariant } from '../load.js';
import { summarize } from '../market/dashboard.js';
import { type WorldOptions, type WorldResult, runWorld } from '../market/world.js';
import { fmt, table } from '../report.js';

/** Les récompenses de data/npc_orders.yaml valent déjà ×0,75 de l'original (équilibre du 21 octobre) : `npc` est exprimé par rapport à l'original. */
export const NPC_DATA_SCALE = 0.75;

/** Un jeu de réglages d'or à comparer. Sauf `npc`, tout est exprimé par rapport à `data/`. */
export interface GoldVariant {
  id: string;
  name: string;
  /** Or des commandes PNJ par rapport à l'original (×1 = avant l'équilibrage ; absent = `data/`, soit ×0,75). */
  npc?: number;
  /** Part de la valeur d'un objet demandée par le PNJ pour une réparation. */
  repairShare?: number;
  /** Multiplie l'or des bâtiments de clan. */
  buildingGold?: number;
  /** Multiplie les matériaux des bâtiments de clan. */
  buildingItems?: number;
  /** Or de départ. */
  startingGold?: number;
}

export function applyVariant(base: Content, v: GoldVariant): Content {
  const c = structuredClone(base);
  for (const o of Object.values(c.npcOrders)) o.gold = Math.max(1, Math.round(o.gold * (v.npc === undefined ? 1 : v.npc / NPC_DATA_SCALE)));
  for (const b of Object.values(c.buildings)) {
    b.base.gold = Math.round(b.base.gold * (v.buildingGold ?? 1));
    for (const i of b.base.items) i.qty = Math.max(1, Math.round(i.qty * (v.buildingItems ?? 1)));
  }
  if (v.repairShare !== undefined) c.settings.wear.repairGoldShare = v.repairShare;
  if (v.startingGold !== undefined) c.settings.character.startingGold = v.startingGold;
  return c;
}

export interface BalanceRow {
  variant: GoldVariant;
  result: WorldResult;
  /** Or par joueur et par jour, sur les 30 derniers jours : créé (commandes PNJ) et détruit (taxe, réparations, étal, clans). */
  inflow: number;
  sinkTax: number;
  sinkPnj: number;
  sinkClan: number;
  net: number;
  goldPerPlayer: number;
  levelsPerClan: number;
  /** Or moyen d'un membre de clan, et d'un joueur sans clan, à la fin. */
  goldClan: number;
  goldAlone: number;
  /** Premier jour où un clan achève un niveau de bâtiment (médiane des clans), et niveaux bâtis à la fin pour la médiane. */
  firstBuildDay: number | null;
  firstToolDays: number | null;
  day500: number | null;
  priceRatio: number;
}

/** Moyenne de lignes de plusieurs graines : une seule simulation est trop bruitée pour comparer des réglages. */
function averageRows(rows: BalanceRow[]): BalanceRow {
  const mean = (f: (r: BalanceRow) => number) => rows.reduce((a, r) => a + f(r), 0) / rows.length;
  const meanOrNull = (f: (r: BalanceRow) => number | null) => {
    const xs = rows.map(f).filter((x): x is number => x !== null);
    return xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : null;
  };
  return {
    variant: rows[0]!.variant,
    result: rows[0]!.result,
    inflow: mean((r) => r.inflow),
    sinkTax: mean((r) => r.sinkTax),
    sinkPnj: mean((r) => r.sinkPnj),
    sinkClan: mean((r) => r.sinkClan),
    net: mean((r) => r.net),
    goldPerPlayer: mean((r) => r.goldPerPlayer),
    goldClan: mean((r) => r.goldClan),
    goldAlone: mean((r) => r.goldAlone),
    levelsPerClan: mean((r) => r.levelsPerClan),
    firstBuildDay: meanOrNull((r) => r.firstBuildDay),
    firstToolDays: meanOrNull((r) => r.firstToolDays),
    day500: meanOrNull((r) => r.day500),
    priceRatio: mean((r) => r.priceRatio),
  };
}

export function runBalance(variants: GoldVariant[], opts: WorldOptions, seeds: number[] = [opts.seed]): BalanceRow[] {
  const base = loadVariant();
  return variants.map((variant) => averageRows(seeds.map((seed) => runBalanceOnce(base, variant, { ...opts, seed }))));
}

function runBalanceOnce(base: Content, variant: GoldVariant, opts: WorldOptions): BalanceRow {
  {
    const result = runWorld(applyVariant(base, variant), opts);
    const s = summarize(result);
    const win = result.days.slice(-30);
    const per = (f: (d: (typeof win)[number]) => number) => win.reduce((a, d) => a + f(d) / Math.max(1, d.players), 0) / win.length;
    const sinkClan = per((d) => d.gold.clan);
    const clans = result.clans.filter((c) => c.members.length > 0);
    const played = result.bots.filter((b) => b.level > 0);
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);
    const firstDay = result.days.findIndex((d) => d.buildingLevels > 0);
    return {
      variant,
      goldClan: avg(played.filter((b) => b.clanId !== null).map((b) => b.gold)),
      goldAlone: avg(played.filter((b) => b.clanId === null).map((b) => b.gold)),
      firstBuildDay: firstDay < 0 ? null : firstDay + 1,
      result,
      inflow: s.inflowNpc,
      sinkTax: s.outflowTax,
      sinkPnj: s.outflowPnj + s.outflowStall,
      sinkClan,
      net: s.inflowNpc - s.outflowTax - s.outflowPnj - s.outflowStall - sinkClan,
      goldPerPlayer: s.goldPerPlayer,
      levelsPerClan: clans.length ? clans.reduce((a, c) => a + Object.values(c.levels).reduce((x, l) => x + l, 0), 0) / clans.length : 0,
      firstToolDays: s.firstToolDays,
      day500: s.day500,
      priceRatio: s.priceRatio,
    };
  }
}

export function balanceMarkdown(rows: BalanceRow[], opts: WorldOptions): string {
  const head = ['Réglage', 'Entrée (PNJ)', 'Taxe', 'Répar. + étal', 'Clans', 'Solde', 'Or / joueur', 'Or en clan', 'Or sans clan', 'Niveaux bâtis / clan', '1er niveau bâti', 'Premier outil', '500 or'];
  const body = rows.map((r) => [
    r.variant.name,
    fmt(r.inflow),
    fmt(r.sinkTax),
    fmt(r.sinkPnj),
    fmt(r.sinkClan),
    (r.net >= 0 ? '+' : '') + fmt(r.net),
    fmt(r.goldPerPlayer),
    fmt(r.goldClan),
    fmt(r.goldAlone),
    r.levelsPerClan.toFixed(1),
    r.firstBuildDay === null ? '—' : `j${Math.round(r.firstBuildDay)}`,
    r.firstToolDays === null ? '—' : `${r.firstToolDays.toFixed(1)} j`,
    r.day500 === null ? '—' : `${r.day500.toFixed(1)} j`,
  ]);
  return `${opts.players} joueurs, ${opts.days} jours, moyenne de plusieurs graines. Or par joueur et par jour, moyenne des 30 derniers jours.\n\n${table(head, body)}`;
}

export function writeBalance(md: string): string {
  const file = join(ROOT, 'sim', 'reports', 'equilibre.md');
  mkdirSync(join(ROOT, 'sim', 'reports'), { recursive: true });
  writeFileSync(file, `# Équilibre de l'or\n\n> Généré par \`pnpm --filter @bramo/sim sim balance\`.\n\n${md}\n`);
  return file;
}
