import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse, stringify } from 'yaml';
import { calibrate } from './calibrate.js';
import { type CombatPatch, ROOT, loadVariant } from './load.js';
import { type SearchedPlan, defaultSearchOptions, recommendedPlan, searchMarkdown, searchPlans } from './scenarios/combat-search.js';
import { miningProgression } from './scenarios/baseline.js';
import { presenceReport } from './scenarios/presence.js';
import { milestonesReport, progressionReport } from './scenarios/progression.js';
import { economyReport } from './scenarios/economy.js';
import { chainsReport, consumablesReport } from './scenarios/chains.js';
import { marketReport, marketText } from './scenarios/market.js';
import { type GoldVariant, balanceMarkdown, runBalance, writeBalance } from './scenarios/balance.js';
import { combatReport, defaultCombatOptions } from './scenarios/combat.js';
import { groupReport } from './scenarios/combat-groups.js';
import { dungeonReport } from './scenarios/combat-dungeon.js';
import { gearGapReport, partyDungeonReport } from './scenarios/combat-dungeon-party.js';

const [command = 'help', ...args] = process.argv.slice(2);
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1]! : fallback;
};

const commands: Record<string, () => string> = {
  balance: () => {
    const opts = { players: Number(opt('players', '60')), days: Number(opt('days', '150')), seed: Number(opt('seed', '1')) };
    const variants: GoldVariant[] = [
      { id: 'before', name: 'Commandes PNJ ×1 (avant)', npc: 1 },
      { id: 'now', name: 'Commandes PNJ ×0,75 (actuel)' },
      { id: 'npc-60', name: 'Commandes PNJ ×0,6', npc: 0.6 },
      { id: 'now-g15', name: 'Actuel, or des bâtiments ×1,5', buildingGold: 1.5 },
      { id: 'now-all', name: 'Actuel, bâtiments ×1,5 (or et matériaux)', buildingGold: 1.5, buildingItems: 1.5 },
    ];
    const seeds = opt('seeds', '1,2,3').split(',').map(Number);
    const md = balanceMarkdown(runBalance(variants, opts, seeds), opts);
    return `${md}

Écrit : ${writeBalance(md)}`;
  },
  combat: () => {
    const proposal = opt('proposal', '') || undefined;
    const o = { ...defaultCombatOptions, seeds: Number(opt('seeds', String(defaultCombatOptions.seeds))) };
    return combatReport(loadVariant(proposal), o, proposal ? { proposal, baseline: loadVariant() } : {});
  },
  'combat-dungeon': () => dungeonReport(loadVariant(opt('proposal', '') || undefined).combat!, Number(opt('seeds', '12'))),
  'combat-dungeon-party': () => {
    const proposal = opt('proposal', '') || undefined;
    const hpExp = Number(opt('hp-exponent', '0'));
    const name = `donjon-groupe${proposal ? `-${proposal}` : ''}${hpExp ? '-pente' : ''}`;
    return partyDungeonReport(loadVariant(proposal).combat!, Number(opt('seeds', '12')), name, hpExp);
  },
  'combat-gear-gap': () => gearGapReport(loadVariant(opt('proposal', 'fureur-v0')).combat!),
  'combat-groups': () => groupReport(loadVariant(opt('proposal', '') || undefined).combat!, Number(opt('seeds', '8'))),
  'combat-search': () => {
    const proposal = opt('proposal', '') || undefined;
    const combat = loadVariant(proposal).combat!;
    const levels = opt('levels', '40,80').split(',').map(Number);
    const byLevel: Record<string, Record<string, SearchedPlan[]>> = {};
    const o = { ...defaultSearchOptions };
    for (const level of levels) byLevel[level] = searchPlans(combat, { ...o, level });
    const dir = join(ROOT, 'sim', 'reports', 'combat', ...(proposal ? [proposal] : []));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'recherche.md'), `${searchMarkdown(combat, byLevel, o)}\n`);
    writeFileSync(join(dir, 'recherche.json'), `${JSON.stringify({ options: o, levels: byLevel })}\n`);
    const out = [`Écrit : ${join(dir, 'recherche.md')}, recherche.json`];
    // --write <proposition> : ajoute à cette proposition un plan conseillé par voie (le plus rapide en moyenne de chaque répertoire).
    const target = opt('write', '');
    if (target) {
      const file = join(ROOT, 'sim', 'proposals', target, 'combat.yaml');
      const patch: CombatPatch = existsSync(file) ? (parse(readFileSync(file, 'utf8')) as CombatPatch) : {};
      patch.addPlans = Object.values(combat.paths).map((p) => {
        const recs = levels.map((level) => recommendedPlan(combat, byLevel[level]![p.id]!, level));
        return { id: `${p.id}_advised`, name: `Plan conseillé ${p.name}`, class: p.class, path: p.id, weapon: recs[0]!.weapon, levels: Object.fromEntries(recs.map((r) => [String(r.level), r.spells.map((spell) => ({ spell, at: 0 }))])) };
      });
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `# Proposition de combat (voir sim/README.md). addPlans est réécrit par \`sim combat-search --write ${target}\`.\n${stringify(patch, { lineWidth: 0 })}`);
      out.push(`Plans conseillés écrits dans ${file}`);
    }
    return out.join('\n');
  },
  market: () => marketText(marketReport({ players: Number(opt('players', '60')), days: Number(opt('days', '120')), seed: Number(opt('seed', '1')) })),
  presence: () => presenceReport(),
  progression: () => progressionReport(opt('proposal', 'boucle-v0'), Number(opt('days', '520'))),
  milestones: () => milestonesReport(opt('proposal', 'boucle-v0')),
  economy: () => economyReport(opt('proposal', 'boucle-v0')),
  chains: () => chainsReport(opt('proposal', 'boucle-v0')),
  calibrate: () => {
    const changes = calibrate(args.includes('--data') ? null : opt('proposal', 'boucle-v0'), args.includes('--write'));
    const lines = changes.map((c) => `${c.file} ${c.id} ${c.field} : ${c.from} → ${c.to}`);
    return `${lines.join('\n')}\n${changes.length} valeur(s) ${args.includes('--write') ? 'réécrite(s)' : 'à recalculer (--write pour écrire)'}.`;
  },
  consumables: () => consumablesReport(opt('proposal', '') || undefined),
  baseline: () => {
    const content = loadVariant(opt('proposal', '') || undefined);
    const profiles = opt('profiles', 'block2h;regular2h;casu20;tab16h').split(/[;,\s]+/);
    return miningProgression(content, profiles, Number(opt('days', '60')));
  },
};

/** Tous les rapports dans sim/reports/rapport.md (régénéré à chaque appel). */
commands.report = () => {
  const sections: [string, string][] = [
    ['Données du jeu (data/) : Minage seul, sans outil, repas ni coup de fouet', 'baseline'],
    ['Présence : heures effectives par jour selon la variante', 'presence'],
    ['Repas actuels (data/)', 'consumables'],
    ['Progression (boucle-v0, mêmes règles que data/)', 'progression'],
    ['Ce qu’un personnage atteint avec le temps (boucle-v0)', 'milestones'],
    ['Chaînes de production (boucle-v0)', 'chains'],
    ['Repas proposés (boucle-v0)', 'consumables-proposal'],
    ['Économie (boucle-v0)', 'economy'],
  ];
  commands['consumables-proposal'] = () => consumablesReport('boucle-v0');
  const body = sections.map(([title, cmd]) => `## ${title}\n\n${commands[cmd]!()}\n`).join('\n');
  const file = join(ROOT, 'sim', 'reports', 'rapport.md');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `# Rapport du simulateur\n\n> Généré par \`pnpm --filter @bramo/sim sim report\`. Ne pas modifier à la main.\n\n${body}`);
  return `Écrit : ${file}`;
};

const run = commands[command];
if (!run) {
  console.log(`Commandes : ${Object.keys(commands).join(', ')}`);
} else {
  console.log(run());
}
