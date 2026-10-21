import type { Content, Recipe } from '@bramo/shared';
import { levelForXp } from '@bramo/shared';
import { type GatherOptions, gatherer, runBot } from '../bot.js';
import { unitCost } from '../chains.js';
import { loadVariant } from '../load.js';
import { profile } from '../profiles.js';
import { fmtDays, table } from '../report.js';
import { referenceXpPerHour } from '../rules.js';
import { proposalOptions } from './chains.js';

export const LEVELS = [10, 20, 30, 45, 60, 70, 85, 90, 99];

/** Équipement d'un spécialiste qui achète ses outils au marché, garde un repas actif (garde-manger) et prend ses coups de fouet. */
export const EQUIPPED: GatherOptions = {
  energize: true,
  tools: [
    [5, 'bronze_pickaxe'],
    [15, 'iron_pickaxe'],
    [35, 'steel_pickaxe'],
    [45, 'mithril_pickaxe'],
    [60, 'orichalcum_pickaxe'],
  ],
  autoMeal: [
    [15, 0.05],
    [45, 0.08],
    [65, 0.1],
  ],
};

interface Row {
  name: string;
  levelDay: Record<number, number | undefined>;
}

/** Spécialiste du Minage joué par le vrai moteur, pour un profil de présence. */
function specialist(content: Content, presenceId: string, opts: GatherOptions, days: number): Record<number, number> {
  return runBot(content, profile(presenceId), gatherer('mining', opts), { days, track: { skill: 'mining', levels: LEVELS } }).levelDay;
}

/**
 * Un joueur qui partage son temps également entre k activités (métiers et combat) progresse dans chacune
 * comme un spécialiste dont les journées dureraient 1/k : son niveau au jour t est celui du spécialiste au jour t/k.
 */
function shared(levelDay: Record<number, number>, k: number): Record<number, number> {
  return Object.fromEntries(Object.entries(levelDay).map(([l, d]) => [l, d * k]));
}

/** Ce que l'artisan achète au lieu de le faire : un ingrédient direct de ses recettes, selon son objet et son métier. */
type Buys = (itemId: string, producedBy: string | undefined) => boolean;

/**
 * Artisan : à chaque niveau, il fabrique la recette qui lui rapporte le plus d'XP de son métier
 * par heure de SON travail (ingrédients achetés = 0 seconde). Son temps total est `hoursPerDay`.
 * Au-delà des recettes écrites, on suppose que les paliers suivants gardent la même structure de chaîne :
 * l'XP par heure suit alors la règle R(L) (hypothèse, signalée dans le rapport).
 */
function crafter(content: Content, proposal: string, buys: Buys, hoursPerDay: number, profession = 'smithing'): Record<number, number> {
  const opts = proposalOptions(proposal);
  const recipes = Object.values(content.recipes).filter((r) => r.profession === profession && !r.trial && r.inputs.length);
  const ownSec = (r: Recipe): number => {
    let sec = r.durationSec;
    for (const i of r.inputs) {
      const producer = Object.values(content.recipes).find((x) => x.outputs.some((o) => o.item === i.item));
      if (buys(i.item, producer?.profession)) continue;
      const c = unitCost(i.item, content, opts);
      sec += Object.values(c.labor).reduce((a, b) => a + b, 0) * i.qty;
    }
    return sec;
  };
  const top = Math.max(...recipes.map((r) => r.level));
  const rate = (level: number) => {
    const best = Math.max(...recipes.filter((r) => r.level <= level).map((r) => r.xp / ownSec(r)), 0) * 3600;
    const tier = (l: number) => Math.floor(l / 10) * 10 || 1;
    return level > top + 10 ? (best * referenceXpPerHour(tier(level))) / referenceXpPerHour(tier(top)) : best;
  };
  const out: Record<number, number> = {};
  let xp = 0;
  let hours = 0;
  for (let level = 1; level < 99; ) {
    const next = content.xpTable[level + 1]!;
    hours += (next - xp) / rate(level);
    xp = next;
    level = levelForXp(xp, content.xpTable);
    if (LEVELS.includes(level)) out[level] = hours / hoursPerDay;
  }
  return out;
}

/** Niveau atteint après 1 semaine, 1, 3, 6 et 12 mois, pour un spécialiste et des joueurs qui partagent leur temps. */
export function milestonesReport(proposal = 'boucle-v0'): string {
  const content = loadVariant(proposal);
  const checkpoints: [string, number][] = [
    ['1 semaine', 7],
    ['1 mois', 30],
    ['3 mois', 91],
    ['6 mois', 182],
    ['1 an', 365],
  ];
  const runs = {
    casu: runBot(content, profile('casu20'), gatherer('mining', { tools: EQUIPPED.tools, energize: true }), { days: 366, track: { skill: 'mining', levels: [] } }),
    regular: runBot(content, profile('regular2h'), gatherer('mining', EQUIPPED), { days: 366, track: { skill: 'mining', levels: [] } }),
  };
  const at = (byDay: number[], day: number) => byDay[Math.max(0, Math.floor(day) - 1)] ?? byDay.at(-1)!;
  const rows: (string | number)[][] = [];
  for (const [who, run] of Object.entries(runs)) {
    const label = who === 'casu' ? 'casu (20 min/j)' : 'régulier (2 visites/j)';
    rows.push([`Spécialiste, ${label}`, ...checkpoints.map(([, d]) => at(run.levelByDay, d))]);
    rows.push([`Un métier principal (½) + combat, ${label}`, ...checkpoints.map(([, d]) => at(run.levelByDay, d / 2))]);
    rows.push([`3 métiers + combat (¼ chacun), ${label}`, ...checkpoints.map(([, d]) => at(run.levelByDay, d / 4))]);
  }
  return table(['Niveau atteint dans un métier', ...checkpoints.map(([n]) => n)], rows);
}

export function progressionReport(proposal = 'boucle-v0', days = 520): string {
  const content = loadVariant(proposal);
  // Tryhard : repas +10 % et bonus de clan +10 % (simulés par un repas à +20 %).
  const tryhardContent = loadVariant(proposal, { bonusCaps: { meal: 0.2 } });
  const regular = specialist(content, 'regular2h', EQUIPPED, days);
  const casu = specialist(content, 'casu20', { tools: EQUIPPED.tools, energize: true }, days);
  const rows: Row[] = [
    { name: 'Spécialiste casu (20 min/j, outils, sans repas)', levelDay: casu },
    { name: 'Spécialiste régulier (2 visites/j, outils, repas)', levelDay: regular },
    {
      name: 'Spécialiste tryhard (+ repas 10 % et clan 10 %)',
      levelDay: specialist(tryhardContent, 'tab16h', { tools: EQUIPPED.tools, autoMeal: [[1, 0.2]], energize: true }, days),
    },
    { name: 'Partagé : 3 métiers + combat, régulier', levelDay: shared(regular, 4) },
    { name: 'Partagé : 3 métiers + combat, casu', levelDay: shared(casu, 4) },
  ];
  // Artisans : 24 h effectives par jour, ×1,25 de bonus moyen (outil et repas).
  const h = 24 * 1.25;
  const bars = new Set(['bronze_bar', 'iron_bar', 'steel_bar']);
  rows.push(
    { name: 'Forgeron autonome (mine son minerai)', levelDay: crafter(content, proposal, () => false, h) },
    { name: 'Forgeron qui achète le minerai', levelDay: crafter(content, proposal, (_, p) => p !== 'smithing', h) },
    { name: 'Forgeron qui achète aussi ses lingots', levelDay: crafter(content, proposal, (i, p) => p !== 'smithing' || bars.has(i), h) },
  );
  return table(
    ['Profil (Minage, sauf forgerons)', ...LEVELS.map((l) => `Niv. ${l}`)],
    rows.map((r) => [r.name, ...LEVELS.map((l) => fmtDays(r.levelDay[l]))]),
  );
}
