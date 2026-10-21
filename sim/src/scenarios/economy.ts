import { type EconomyAssumptions, type EconomyFlows, economyFlows, lowTierOutlets, specialistCoverage } from '../economy.js';
import { deepMerge, loadVariant, readProposalFile } from '../load.js';
import { fmt, pct, table } from '../report.js';
import { proposalOptions } from './chains.js';

type Assumptions = EconomyAssumptions & { variants: { id: string; name: string; patch: unknown }[] };

function setPath<T>(obj: T, path: string, value: unknown): T {
  const patch: Record<string, unknown> = {};
  let cur = patch;
  const keys = path.split('.');
  keys.slice(0, -1).forEach((k) => (cur = cur[k] = {} as Record<string, unknown>));
  cur[keys.at(-1)!] = value;
  return deepMerge(obj, patch);
}

function get(obj: unknown, path: string): number {
  return Number(path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj));
}

/** Hypothèses dont on mesure l'effet (÷2 et ×2, bornées à 1 pour les parts). */
const SENSITIVE = [
  'wear.tool.lifeHours',
  'wear.armor.lifeHours',
  'meals.bonus',
  'combat.arrowsPerHour',
  'construction.craftTimeShare',
  'recycling.craftedSurplusRecycled',
  'gold.npcBuyback',
  'gold.npcWeeklyCap',
  'gold.tradedShare',
];

export function economyReport(proposal = 'boucle-v0'): string {
  const content = loadVariant(proposal);
  const opts = proposalOptions(proposal);
  const raw = readProposalFile<Assumptions>(proposal, 'economy.yaml');
  const run = (a: EconomyAssumptions): EconomyFlows => economyFlows(content, opts, a);
  const variants = raw.variants.map((v) => ({ ...v, a: deepMerge(raw, v.patch) as EconomyAssumptions }));
  const recommended = variants.find((v) => v.id === 'recommended')!.a;
  const out: string[] = [];

  out.push('### Variantes (avec combat, par joueur et par jour)\n');
  out.push(
    table(
      ['Variante', 'Part utile de la production', 'Perdu au recyclage', 'Vendu au PNJ', 'Stocké', 'Or créé / joueur / jour'],
      variants.map((v) => {
        const f = run(v.a);
        const d = Object.values(f.destinations);
        return [v.name, pct(f.absorption), pct(d[1]! / f.produced), pct(d[2]! / f.produced), pct(d[3]! / f.produced), fmt(f.gold.net)];
      }),
    ),
  );

  const withCombat = run(recommended);
  const noCombat = run(setPath(recommended, 'combat.enabled', false));
  out.push('\n### Variante recommandée : postes de consommation (heures de travail par joueur et par jour)\n');
  const posts = Object.keys(withCombat.consumption);
  out.push(
    table(
      ['Poste', 'Sans combat (aujourd’hui)', 'Avec combat (P4)'],
      [
        ['Heures de métier produites', fmt(noCombat.produced, 1), fmt(withCombat.produced, 1)],
        ...posts.map((p) => [p, fmt(noCombat.consumption[p]!, 2), fmt(withCombat.consumption[p]!, 2)]),
        ['**Total consommé**', fmt(noCombat.consumed, 2), fmt(withCombat.consumed, 2)],
        ['**Part de la production qui sert**', pct(noCombat.absorption), pct(withCombat.absorption)],
      ],
    ),
  );

  out.push('\n### Variante recommandée : or par joueur et par jour\n');
  const g = withCombat.gold;
  out.push(
    table(
      ['Flux', 'Or / jour'],
      [
        ...Object.entries(g.faucets).map(([k, v]) => [`+ ${k}`, fmt(v)]),
        ...Object.entries(g.sinks).map(([k, v]) => [`− ${k}`, fmt(v)]),
        ['**Solde (création nette d’or)**', `**${fmt(g.net)}**`],
      ],
    ),
  );

  out.push('\n### Sensibilité (variante recommandée, avec combat) : chaque hypothèse ÷2 puis ×2\n');
  const rows = SENSITIVE.map((path) => {
    const v = get(recommended, path);
    const cap = path.includes('Share') || path.includes('Recycled') || path.includes('Buyback') ? 1 : Infinity;
    const lo = run(setPath(recommended, path, v / 2));
    const hi = run(setPath(recommended, path, Math.min(cap, v * 2)));
    return [path, String(v), `${pct(lo.absorption)} / ${fmt(lo.gold.net)}`, `${pct(hi.absorption)} / ${fmt(hi.gold.net)}`];
  });
  out.push(table(['Hypothèse', 'Valeur', '÷2 : part utile / or net', '×2 : part utile / or net'], rows));

  out.push('\n### Taille du serveur (variante recommandée)\n');
  out.push(
    table(
      ['Joueurs', 'Spécialistes par métier (moyenne)', 'Métiers sans spécialiste', 'Métiers avec moins de 3', 'Outils réparés / semaine', 'Repas / jour', 'Flèches / jour', 'Or créé / jour'],
      [20, 50, 200].map((n) => {
        const c = specialistCoverage(n, recommended);
        return [
          n,
          fmt(c.perProfession, 1),
          fmt(c.zero, 1),
          fmt(c.underThree, 1),
          fmt(withCombat.units['Outils réparés']! * n * 7, 0),
          fmt(withCombat.units['Repas mangés']! * n, 0),
          fmt(withCombat.units['Flèches tirées']! * n, 0),
          fmt(withCombat.gold.net * n, 0),
        ];
      }),
    ),
  );

  out.push('\n### Débouchés durables des objets de bas niveau (≤ niv. 10, consommés par des recettes ≥ niv. 20)\n');
  const outlets = lowTierOutlets(content);
  out.push(
    table(
      ['Objet', 'Recettes de niveau ≥ 20 qui le consomment'],
      outlets.filter((o) => o.uses.length).map((o) => [content.items[o.item]?.name ?? o.item, o.uses.join(', ')]),
    ),
  );
  const orphans = outlets.filter((o) => !o.uses.length).map((o) => content.items[o.item]?.name ?? o.item);
  out.push(`\nSans débouché de haut niveau dans la proposition (${orphans.length}) : ${orphans.join(', ')}.`);
  return out.join('\n');
}
