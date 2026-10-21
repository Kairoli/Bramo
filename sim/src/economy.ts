import type { Content } from '@bramo/shared';
import { type ChainOptions, bundleCost, workSec } from './chains.js';

/** Hypothèses lues dans economy.yaml d'une proposition. */
export interface EconomyAssumptions {
  archetypes: { id: string; name: string; share: number; hours: number; gather: number; craft: number; combat: number; meals: number }[];
  wear: {
    tool: { item: string; lifeHours: number; repairs: number; repairCost: number };
    weapon: { item: string; lifeHours: number; repairs: number; repairCost: number };
    armor: { items: Record<string, number>; lifeHours: number; repairs: number; repairCost: number };
    recycleReturn: number;
  };
  combat: { enabled: boolean; arrowsPerHour: number; potionsPerHour: number; rangedShare: number };
  meals: { bonus: number; payback: number };
  clan: { membershipShare: number };
  construction: { craftTimeShare: number };
  recycling: { craftedSurplusRecycled: number };
  arrivals: { weeklyShare: number; kitHours: number };
  gold: {
    perWorkHour: number;
    npcBuyback: number;
    npcWeeklyCap: number | null;
    surplusSoldToNpc: number;
    tradedShare: number;
    marketTax: number;
    npcRepairShare: number;
    trialGoldPerDay: number;
    clanUpkeepPerMemberDay: number;
    stationFeesPerDay: number;
  };
  market: { professions: number; mainProfessionShare: number };
}

/** Flux moyens par joueur et par jour, en heures de travail (et en or pour la partie or). */
export interface EconomyFlows {
  hours: { total: number; gather: number; craft: number; combat: number };
  /** Heures de travail que le jeu consomme réellement, par poste. */
  consumption: Record<string, number>;
  consumed: number;
  produced: number;
  /** Part de la production qui trouve un usage réel (usure, consommables, construction, nouveaux). */
  absorption: number;
  surplus: number;
  /** Où finit tout ce qui est produit, en heures de travail par joueur et par jour. */
  destinations: Record<string, number>;
  gold: { faucets: Record<string, number>; sinks: Record<string, number>; net: number };
  /** Unités consommées par joueur et par jour. */
  units: Record<string, number>;
}

const h = (content: Content, opts: ChainOptions, items: Record<string, number>) => workSec(bundleCost(items, content, opts)) / 3600;

/** Part d'un objet consommée par heure d'usage, réparations et recyclage compris (en heures de travail). */
function wearPerHour(costHours: number, w: { lifeHours: number; repairs: number; repairCost: number }, recycle: number): number {
  return (costHours * (1 + w.repairs * w.repairCost - recycle)) / (w.lifeHours * (1 + w.repairs));
}

export function economyFlows(content: Content, opts: ChainOptions, a: EconomyAssumptions): EconomyFlows {
  const hours = { total: 0, gather: 0, craft: 0, combat: 0 };
  let mealHours = 0;
  for (const x of a.archetypes) {
    hours.total += x.share * x.hours;
    hours.gather += x.share * x.hours * x.gather;
    hours.craft += x.share * x.hours * x.craft;
    hours.combat += a.combat.enabled ? x.share * x.hours * x.combat : 0;
    mealHours += x.share * x.hours * x.meals * (a.combat.enabled ? 1 : 1 - x.combat);
  }
  // Sans combat, le temps de combat retourne aux métiers (même proportion).
  if (!a.combat.enabled) {
    const k = hours.total / (hours.gather + hours.craft);
    hours.gather *= k;
    hours.craft *= k;
  }
  const working = hours.gather + hours.craft;
  const toolH = h(content, opts, { [a.wear.tool.item]: 1 });
  const weaponH = h(content, opts, { [a.wear.weapon.item]: 1 });
  const armorH = h(content, opts, a.wear.armor.items);
  const arrowH = h(content, opts, { iron_arrow: 1 });
  const potionH = h(content, opts, { minor_healing_potion: 1 });
  const r = a.wear.recycleReturn;
  // Construction : pour une heure de pose, les matériaux d'une charpente représentent `inputRatio` heures de travail.
  const frame = bundleCost({ oak_frame: 1 }, content, opts);
  const frameOwn = (frame.labor.construction ?? 0) / 3600;
  const inputRatio = workSec(frame) / 3600 / frameOwn - 1;
  const constructionHours = hours.craft * a.construction.craftTimeShare;

  const consumption: Record<string, number> = {
    'Outils (usure)': working * wearPerHour(toolH, a.wear.tool, r),
    'Repas': (mealHours * a.meals.bonus) / a.meals.payback,
    'Armes (usure)': hours.combat * wearPerHour(weaponH, a.wear.weapon, r),
    'Armures (usure)': hours.combat * wearPerHour(armorH, a.wear.armor, r),
    'Flèches': hours.combat * a.combat.rangedShare * a.combat.arrowsPerHour * arrowH,
    'Potions': hours.combat * a.combat.potionsPerHour * potionH,
    'Construction (pose et matériaux)': constructionHours * (1 + inputRatio),
    'Kits des nouveaux': (a.arrivals.weeklyShare / 7) * a.arrivals.kitHours,
  };
  const consumed = Object.values(consumption).reduce((s, v) => s + v, 0);
  // Tout le temps de métier produit quelque chose ; le combat consomme (le butin n'est pas modélisé).
  const produced = working;
  const surplus = Math.max(0, produced - consumed);
  // Le surplus fabriqué (et non récolté) peut être recyclé : on récupère `r`, le reste disparaît.
  const craftedSurplus = surplus * (hours.craft / working);
  const recycledLost = craftedSurplus * a.recycling.craftedSurplusRecycled * (1 - r);
  const afterRecycling = surplus - recycledLost;
  const g0 = a.gold;
  const npcCapHours = g0.npcWeeklyCap == null ? Infinity : g0.npcWeeklyCap / 7 / (g0.perWorkHour * g0.npcBuyback);
  const soldToNpc = Math.min(afterRecycling * g0.surplusSoldToNpc, npcCapHours);
  const destinations = {
    'Usage réel (usure, consommables, construction, nouveaux)': consumed,
    'Perdu au recyclage': recycledLost,
    'Vendu au marchand PNJ': soldToNpc,
    'Stocké ou invendu': afterRecycling - soldToNpc,
  };

  const g = a.gold;
  const repairHours =
    working * (toolH * a.wear.tool.repairs * a.wear.tool.repairCost) / (a.wear.tool.lifeHours * (1 + a.wear.tool.repairs)) +
    hours.combat * ((weaponH * a.wear.weapon.repairs * a.wear.weapon.repairCost) / (a.wear.weapon.lifeHours * (1 + a.wear.weapon.repairs)) +
      (armorH * a.wear.armor.repairs * a.wear.armor.repairCost) / (a.wear.armor.lifeHours * (1 + a.wear.armor.repairs)));
  const faucets = {
    'Rachat du marchand PNJ': soldToNpc * g.perWorkHour * g.npcBuyback,
    'Épreuves des maîtres': g.trialGoldPerDay,
  };
  const sinks = {
    'Taxe du marché': produced * g.tradedShare * g.perWorkHour * g.marketTax,
    'Réparations au PNJ': repairHours * g.npcRepairShare * g.perWorkHour * 2,
    'Entretien du clan': g.clanUpkeepPerMemberDay * a.clan.membershipShare,
    'Services en or (postes, expéditions)': g.stationFeesPerDay,
  };
  const sum = (o: Record<string, number>) => Object.values(o).reduce((s, v) => s + v, 0);

  const units = {
    'Outils remplacés': working / (a.wear.tool.lifeHours * (1 + a.wear.tool.repairs)),
    'Repas mangés': mealHours / 2,
    'Flèches tirées': hours.combat * a.combat.rangedShare * a.combat.arrowsPerHour,
    'Potions bues': hours.combat * a.combat.potionsPerHour,
  };
  return {
    hours,
    consumption,
    consumed,
    produced,
    absorption: consumed / produced,
    surplus,
    destinations,
    gold: { faucets, sinks, net: sum(faucets) - sum(sinks) },
    units,
  };
}

/** Nombre attendu de métiers sans aucun spécialiste, et avec moins de 3, selon la taille du serveur. */
export function specialistCoverage(players: number, a: EconomyAssumptions): { zero: number; underThree: number; perProfession: number } {
  const n = a.market.professions;
  // Popularité inégale : du métier le plus prisé (×1,8) au moins prisé (×0,4), moyenne 1.
  const weights = Array.from({ length: n }, (_, i) => 1.8 - (1.4 * i) / (n - 1));
  const mean = weights.reduce((s, w) => s + w, 0) / n;
  let zero = 0;
  let underThree = 0;
  const base = (players * a.market.mainProfessionShare) / n;
  for (const w of weights) {
    const lambda = (base * w) / mean;
    const p0 = Math.exp(-lambda);
    const p1 = lambda * p0;
    const p2 = (lambda ** 2 / 2) * p0;
    zero += p0;
    underThree += p0 + p1 + p2;
  }
  return { zero, underThree, perProfession: base };
}

/** Débouchés durables : objets de bas niveau (≤ maxLevel) consommés par des recettes de haut niveau (≥ minUse). */
export function lowTierOutlets(content: Content, maxLevel = 10, minUse = 20): { item: string; uses: string[] }[] {
  const recipes = Object.values(content.recipes);
  const lowItems = new Set(recipes.filter((r) => r.level <= maxLevel).flatMap((r) => r.outputs.map((o) => o.item)));
  const out: { item: string; uses: string[] }[] = [];
  for (const item of lowItems) {
    const uses = recipes.filter((r) => r.level >= minUse && r.inputs.some((i) => i.item === item)).map((r) => r.name);
    out.push({ item, uses });
  }
  return out.sort((x, y) => y.uses.length - x.uses.length);
}
