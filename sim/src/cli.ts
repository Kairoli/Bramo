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
import { type CellResult, defaultToolsOptions, jobs, runJobs, toolsMarkdown } from './scenarios/combat-tools.js';
import { type Tool, toolsFileSchema } from '@bramo/shared';
import {
  type ComboScore,
  type Inputs,
  type JobResult,
  budgetJobs,
  budgetMarkdown,
  comboWallJobs,
  gearJobs,
  gearMarkdown,
  gemJobs,
  gemsMarkdown,
  kitsReport,
  pairScreen,
  quadScreen,
  runJob,
  setJobs,
  setsMarkdown,
  toolJobs,
  toolsMarkdown as coherenceToolsMarkdown,
  triggersReport,
} from './scenarios/combat-coherence.js';
import { makeLab, seedList, wallOf } from './coherence/lab.js';
import {
  type BaseWall,
  type BuildScore,
  type SituationWall,
  allSpecs,
  baseWall,
  buildsMarkdown,
  catalogueMarkdown,
  farmSpec,
  makeBuild,
  playWays,
  scoreBuild,
  situationMarkdown,
  situationWalls,
  wallPicks,
} from './scenarios/combat-build.js';
import { baseGearFile, planWeapons, readGearFile, rewriteGear, weaponsMarkdown } from './scenarios/combat-weapons.js';
import { poolFor } from './scenarios/combat-coherence.js';

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
  /**
   * Outils de situation (dossier PvE v2) : murs par voie, zone et outil. --shard k/n joue une part des cases et écrit
   * tools-part-k.json ; --merge assemble les parts et écrit le rapport. --overlay <proposition> applique ses sorts en plus.
   */
  'combat-tools': () => {
    const proposal = opt('proposal', 'zones-v2');
    const combat = loadVariant(proposal).combat!;
    const overlay = opt('overlay', '');
    if (overlay) {
      const patch = parse(readFileSync(join(ROOT, 'sim', 'proposals', overlay, 'combat.yaml'), 'utf8')) as CombatPatch;
      for (const [id, p] of Object.entries(patch.spells ?? {})) Object.assign(combat.spells[id]!, p);
    }
    const tools: Tool[] = toolsFileSchema.parse(parse(readFileSync(join(ROOT, 'sim', 'proposals', opt('tools', 'zones-v2'), 'tools.yaml'), 'utf8')));
    const o = { ...defaultToolsOptions, furyScales: !args.includes('--no-fury-scale') };
    const name = opt('out', overlay ? `${proposal}+${overlay}` : proposal);
    const dir = join(ROOT, 'sim', 'reports', 'combat', name);
    mkdirSync(dir, { recursive: true });
    const only = opt('paths', '');
    const encs = opt('encounters', '');
    const all = jobs(combat, tools).filter((j) => (!only || only.split(',').includes(j.path)) && (!encs || encs.split(',').some((e) => j.encounter.startsWith(e))));
    if (args.includes('--merge')) {
      const parts = Number(opt('parts', '4'));
      const results: CellResult[] = Array.from({ length: parts }, (_, k) => JSON.parse(readFileSync(join(dir, `tools-part-${k}.json`), 'utf8')) as CellResult[]).flat();
      writeFileSync(join(dir, 'outils.md'), `${toolsMarkdown(combat, tools, results, o, `Outils de situation · ${name}`, opt('note', ''))}\n`);
      writeFileSync(join(dir, 'outils.json'), `${JSON.stringify({ options: o, results })}\n`);
      return `Écrit : ${join(dir, 'outils.md')} (${results.length} cases sur ${all.length})`;
    }
    const [k, n] = opt('shard', '0/1').split('/').map(Number) as [number, number];
    // Par voie : chaque part ne crible que les plans de ses voies.
    const ids = Object.keys(combat.paths);
    const mine = all.filter((j) => ids.indexOf(j.path) % n === k);
    const t0 = Date.now();
    const results = runJobs(combat, tools, mine, o, (r, i) => console.error(`[${k}] ${i + 1}/${mine.length} ${r.path} ${r.encounter} ${r.tool} ×${r.wall.toFixed(3)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`));
    writeFileSync(join(dir, `tools-part-${k}.json`), JSON.stringify(results));
    return `Écrit : tools-part-${k}.json (${results.length} cases)`;
  },
  /** Cohérence du combat et du contenu (docs/design/coherence/) : --step kits | … ; --proposal coherence-v1 par défaut. */
  'combat-coherence': () => {
    const proposal = opt('proposal', 'coherence-v1');
    const step = opt('step', 'kits');
    const dir = join(ROOT, 'sim', 'reports', 'combat', proposal === 'coherence-v1' ? 'coherence' : proposal);
    mkdirSync(dir, { recursive: true });
    if (step === 'kits') {
      const md = kitsReport(loadVariant(proposal));
      writeFileSync(join(dir, 'kits.md'), `${md}\n`);
      return `Écrit : ${join(dir, 'kits.md')}`;
    }
    // --zones <proposition> : autres rencontres de zone (étape `tools` seulement), rapport dans coherence/<proposition>/.
    const zones = opt('zones', 'zones-v2');
    const lab = makeLab(proposal, zones);
    const io = zones === 'zones-v2' ? dir : join(dir, zones);
    mkdirSync(io, { recursive: true });
    if (step === 'triggers') {
      writeFileSync(join(dir, 'declenchements.md'), `${triggersReport(lab)}\n`);
      return `Écrit : ${join(dir, 'declenchements.md')}`;
    }
    const read = <T,>(name: string): T => JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')) as T;
    const parts = Number(opt('parts', '4'));
    const [k, n] = opt('shard', '0/1').split('/').map(Number) as [number, number];
    const ids = Object.keys(lab.combat.paths);
    const only = opt('paths', '');
    const mineOf = (path: string) => ids.indexOf(path) % n === k && (!only || only.split(',').includes(path));
    const t0 = Date.now();
    const maybe = <T,>(name: string, fallback: T): T => (existsSync(join(dir, `${name}.json`)) ? read<T>(name) : fallback);
    // Criblages (paires d'ensembles, quatre gemmes) : par voie, sans mur.
    if (step === 'pairs' || step === 'quads') {
      if (args.includes('--merge')) {
        const all = Array.from({ length: parts }, (_, i) => JSON.parse(readFileSync(join(dir, `${step}-part-${i}.json`), 'utf8')) as ComboScore[]).flat();
        writeFileSync(join(dir, `${step}.json`), `${JSON.stringify(all)}\n`);
        return `Écrit : ${step}.json (${all.length} combinaisons)`;
      }
      const base = read<JobResult[]>(step === 'pairs' ? 'sets' : 'gems');
      const out = ids.filter(mineOf).flatMap((p) => {
        console.error(`[${k}] ${p} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
        return step === 'pairs' ? pairScreen(lab, base, p) : quadScreen(lab, base, p);
      });
      writeFileSync(join(dir, `${step}-part-${k}.json`), JSON.stringify(out));
      if (n === 1) writeFileSync(join(dir, `${step}.json`), `${JSON.stringify(out)}\n`);
      return `Écrit : ${step}-part-${k}.json (${out.length}, ${((Date.now() - t0) / 1000).toFixed(0)} s)`;
    }
    const inputs = (): Inputs => ({ sets: read('sets'), pairs: read('pairs'), pairWalls: read('pairwalls'), gems: read('gems'), quads: read('quads'), quadWalls: read('quadwalls') });
    const all =
      step === 'gear'
        ? gearJobs(lab)
        : step === 'budget'
          ? budgetJobs(lab)
          : step === 'sets'
          ? setJobs(lab)
          : step === 'pairwalls'
            ? comboWallJobs(lab, read('pairs'), 'pairwalls')
            : step === 'gems'
              ? gemJobs(lab)
              : step === 'quadwalls'
                ? comboWallJobs(lab, read('quads'), 'quadwalls')
                : step === 'tools'
                  ? toolJobs(lab, inputs())
                  : [];
    if (!all.length) return `Étape inconnue : ${step}`;
    const report = (results: JobResult[]) =>
      step === 'gear'
        ? gearMarkdown(lab, results)
        : step === 'budget'
          ? budgetMarkdown(lab, results)
          : step === 'sets' || step === 'pairwalls'
          ? setsMarkdown(lab, step === 'sets' ? results : read('sets'), maybe('pairs', []), step === 'pairwalls' ? results : maybe('pairwalls', []))
          : step === 'tools'
            ? coherenceToolsMarkdown(lab, results, inputs())
            : gemsMarkdown(lab, step === 'gems' ? results : read('gems'), maybe('quads', []), step === 'quadwalls' ? results : maybe('quadwalls', []));
    const out = step === 'quadwalls' || step === 'gems' ? 'gemmes' : step === 'tools' ? 'outils' : step === 'sets' || step === 'pairwalls' ? 'ensembles' : step === 'budget' ? 'budget' : 'equipement';
    if (args.includes('--merge')) {
      const results: JobResult[] = Array.from({ length: parts }, (_, i) => JSON.parse(readFileSync(join(io, `${step}-part-${i}.json`), 'utf8')) as JobResult[]).flat();
      writeFileSync(join(io, `${step}.json`), `${JSON.stringify(results)}\n`);
      writeFileSync(join(io, `${out}.md`), `${report(results)}\n`);
      return `Écrit : ${join(io, `${out}.md`)} (${results.length} cases sur ${all.length})`;
    }
    const encs = opt('encounters', '');
    const mine = all.filter((j) => mineOf(j.path) && (!encs || encs.split(',').some((e) => j.encounter.startsWith(e))));
    const results = mine.map((j, i) => {
      const r = runJob(lab, j);
      if (i % 50 === 0) console.error(`[${k}] ${i + 1}/${mine.length} ${j.path} ${j.build} ${j.encounter} ×${r.wall.toFixed(3)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
      return r;
    });
    writeFileSync(join(io, `${step}-part-${k}.json`), JSON.stringify(results));
    if (n === 1) {
      writeFileSync(join(io, `${step}.json`), `${JSON.stringify(results)}\n`);
      writeFileSync(join(io, `${out}.md`), `${report(results)}\n`);
    }
    return `Écrit : ${step}-part-${k}.json (${results.length} cases, ${((Date.now() - t0) / 1000).toFixed(0)} s)`;
  },
  /**
   * Le build v2 (docs/design/coherence/build.md) : --step base | builds | buildwalls ; --proposal coherence-v2,
   * --zones coherence-zones-v2 ; --shard k/n par voie, puis --merge --parts n.
   */
  'combat-build': () => {
    const proposal = opt('proposal', 'coherence-v2');
    const lab = makeLab(proposal, opt('zones', 'coherence-zones-v2'));
    const step = opt('step', 'base');
    const dir = join(ROOT, 'sim', 'reports', 'combat', lab.reports);
    mkdirSync(dir, { recursive: true });
    const read = <T,>(name: string): T => JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')) as T;
    const parts = Number(opt('parts', '4'));
    const [k, n] = opt('shard', '0/1').split('/').map(Number) as [number, number];
    const ids = Object.keys(lab.combat.paths);
    const only = opt('paths', '');
    const mine = ids.filter((p, i) => i % n === k && (!only || only.split(',').includes(p)));
    const t0 = Date.now();
    const report = () => {
      if (step === 'situation') {
        writeFileSync(join(dir, 'situation.md'), `${situationMarkdown(lab, read<SituationWall[]>('situation'))}\n`);
        return join(dir, 'situation.md');
      }
      const walls = existsSync(join(dir, 'buildwalls.json')) ? read<{ path: string; spec: string; encounter: string; wall: number }[]>('buildwalls') : [];
      writeFileSync(join(dir, 'build.md'), `${buildsMarkdown(lab, read<BuildScore[]>('builds'), walls)}\n`);
      return join(dir, 'build.md');
    };
    if (args.includes('--merge')) {
      const all = Array.from({ length: parts }, (_, i) => JSON.parse(readFileSync(join(dir, `${step}-part-${i}.json`), 'utf8')) as unknown[]).flat();
      writeFileSync(join(dir, `${step}.json`), `${JSON.stringify(all)}\n`);
      return `Écrit : ${step}.json (${all.length})${step === 'base' ? '' : `, ${report()}`}`;
    }
    const log = (msg: string) => console.error(`[${k}] ${msg} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    if (step === 'catalogue') {
      writeFileSync(join(dir, 'catalogue.md'), `${catalogueMarkdown(lab)}\n`);
      return `Écrit : ${join(dir, 'catalogue.md')}`;
    }
    let out: unknown[] = [];
    if (step === 'base') out = mine.flatMap((p) => lab.encounters.map((e) => (log(`${p} ${e.id}`), baseWall(lab, p, e))));
    else if (step === 'builds') {
      const base = read<BaseWall[]>('base');
      out = mine.flatMap((p) => allSpecs(lab, p, Number(opt('random', '200'))).map((s, i) => (i % 20 === 0 && log(`${p} ${i}`), scoreBuild(lab, p, s, base))));
    } else if (step === 'buildwalls') {
      const scores = read<BuildScore[]>('builds');
      out = mine.flatMap((p) =>
        wallPicks(scores, p).flatMap(({ role, spec }) =>
          lab.encounters.map((e) => {
            log(`${p} ${role} ${e.id}`);
            let best = 0;
            for (const w of playWays(lab, p, e)) best = Math.max(best, wallOf(lab, p, { ...makeBuild(lab, p, spec), plan: w.plan, priority: w.priority }, e, seedList(5000, 24)).wall);
            return { path: p, spec: `${role}|${spec.id}`, encounter: e.id, wall: best };
          }),
        ),
      );
    } else if (step === 'situation') {
      // --zones coherence-zones-v2,coherence-bosses-v1 : zones de la route et gardiens de région.
      const scores = read<BuildScore[]>('builds');
      const encs = lab.encounters.filter((e) => /^(z\d\d|b\d)_/.test(e.id));
      out = mine.flatMap((p) => encs.flatMap((e) => (log(`${p} ${e.id}`), situationWalls(lab, p, farmSpec(scores, p), e))));
    } else return `Étape inconnue : ${step}`;
    writeFileSync(join(dir, `${step}-part-${k}.json`), JSON.stringify(out));
    if (n === 1) {
      writeFileSync(join(dir, `${step}.json`), `${JSON.stringify(out)}\n`);
      if (step !== 'base') report();
    }
    return `Écrit : ${step}-part-${k}.json (${out.length}, ${((Date.now() - t0) / 1000).toFixed(0)} s)`;
  },
  /** Armes à valeur égale (docs/design/coherence/classes.md) : --write écrit sim/proposals/<p>/gear.yaml. */
  'combat-weapons': () => {
    const proposal = opt('proposal', 'coherence-v2');
    const pdir = join(ROOT, 'sim', 'proposals', proposal);
    const base = baseGearFile(pdir);
    // La proposition doit se charger avant d'être réécrite : sans gear.yaml cohérent, on part du catalogue de départ.
    if (!existsSync(join(pdir, 'gear.yaml'))) writeFileSync(join(pdir, 'gear.yaml'), readFileSync(base, 'utf8'));
    const lab = makeLab(proposal, opt('zones', 'coherence-zones-v2'));
    lab.content.gearModels = Object.fromEntries(readGearFile(base).map((m) => [m.id, m])); // toujours depuis le catalogue de départ
    const plan = planWeapons(lab);
    const dir = join(ROOT, 'sim', 'reports', 'combat', lab.reports);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'armes.md'), `${weaponsMarkdown(plan)}\n`);
    if (args.includes('--write')) writeFileSync(join(pdir, 'gear.yaml'), rewriteGear(plan, base));
    return `Écrit : ${join(dir, 'armes.md')}${args.includes('--write') ? ` et sim/proposals/${proposal}/gear.yaml` : ''}`;
  },
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
