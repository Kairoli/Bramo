import type { Content } from '@bramo/shared';
import { type ChainOptions, type Crop, bundleCost, consumableRatios, totalLabor } from '../chains.js';
import { loadVariant, readProposalFile } from '../load.js';
import { fmt, table } from '../report.js';

/** Chaînes d'exemple de la proposition : un objet final ou un lot, et le métier qui le termine. */
export const EXAMPLES: { name: string; items: Record<string, number>; finisher: string }[] = [
  { name: 'Tenue de lin (capuche, robe, chausses, mitaines)', items: { linen_hood: 1, linen_robe: 1, linen_breeches: 1, linen_gloves: 1 }, finisher: 'tailoring' },
  { name: 'Robe d’adepte runée (textile teint + runes)', items: { warded_adept_robe: 1 }, finisher: 'enchanting' },
  { name: 'Pourpoint de cuir (armure du Traqueur)', items: { leather_jerkin: 1 }, finisher: 'tanning' },
  { name: 'Épée de fer', items: { iron_sword: 1 }, finisher: 'smithing' },
  { name: 'Arc court de frêne', items: { ash_bow: 1 }, finisher: 'carpentry' },
  { name: '150 flèches à pointe de fer', items: { iron_arrow: 150 }, finisher: 'carpentry' },
  { name: 'Anneau d’argent à l’améthyste', items: { amethyst_ring: 1 }, finisher: 'jewelcrafting' },
  { name: 'Pioche de fer', items: { iron_pickaxe: 1 }, finisher: 'smithing' },
  { name: 'Ragoût du traqueur × 12 (24 h de bonus)', items: { hunter_stew: 12 }, finisher: 'cooking' },
  { name: '10 potions de soin mineures', items: { minor_healing_potion: 10 }, finisher: 'alchemy' },
  { name: 'Charpente de chêne (projet de clan)', items: { oak_frame: 1 }, finisher: 'construction' },
];

export function proposalOptions(proposal: string): ChainOptions {
  const plots = readProposalFile<{ crops: Crop[] }>(proposal, 'plots.yaml');
  return { crops: plots.crops };
}

const hm = (sec: number) => {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
};

function professionName(content: Content, id: string): string {
  return content.professions.find((p) => p.id === id)?.name ?? id;
}

export function chainsReport(proposal = 'boucle-v0'): string {
  const content = loadVariant(proposal);
  const opts = proposalOptions(proposal);
  const rows = EXAMPLES.map((ex) => {
    const c = bundleCost(ex.items, content, opts);
    const total = totalLabor(c);
    const own = c.labor[ex.finisher] ?? 0;
    const split = Object.entries(c.labor)
      .sort((a, b) => b[1] - a[1])
      .map(([p, s]) => `${professionName(content, p)} ${hm(s)}`)
      .join(', ');
    const levels = Object.entries(c.levels)
      .filter(([p]) => p !== 'agriculture' || c.plotHours > 0)
      .map(([p, l]) => `${professionName(content, p)} ${l}`)
      .join(', ');
    return [
      ex.name,
      hm(total),
      `${fmt((100 * own) / total, 0)} %`,
      c.steps.size,
      fmt(c.plotHours, 1),
      fmt(c.gold, 0),
      split,
      levels,
    ];
  });
  return table(
    ['Chaîne', 'Temps autonome', 'Part du dernier métier', 'Étapes', 'Parcelle·h', 'Or PNJ', 'Répartition', 'Niveaux requis'],
    rows,
  );
}

export function consumablesReport(proposal?: string): string {
  const content = loadVariant(proposal);
  const opts = proposal ? proposalOptions(proposal) : {};
  const rows = consumableRatios(content, opts).map((r) => [
    r.name,
    `+${fmt(r.bonus * 100, 0)} % × ${hm(r.durationMin * 60)}`,
    `${fmt(r.craftSec, 0)} s`,
    hm(r.chainSec),
    fmt(r.gold, 0),
    fmt(r.bonusHoursPerCraftHour, 0),
    fmt(r.bonusHoursPerChainHour, 0),
    `×${fmt(r.payback, 1)}`,
  ]);
  return table(
    ['Repas', 'Bonus', 'Cuisson', 'Chaîne complète', 'Or PNJ', 'h de bonus / h de cuisson', 'h de bonus / h de chaîne', 'Rendement autonome'],
    rows,
  );
}
