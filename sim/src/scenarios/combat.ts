/**
 * Banc de combat sur le moteur réel (`fight` de @bramo/shared) : plans d'exemple × rencontres × graines,
 * deux règles d'ouverture, danger accru, tolérance des horaires. Les résultats bruts sont tous gardés (échecs compris).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type CombatContent, type Content, type ExamplePlan, type FightResult, type PlanEntry, buildContent, fight, stream } from '@bramo/shared';
import { parse } from 'yaml';
import { readRawContent } from '@bramo/shared/node';
import { type CombatPatch, DATA_DIR, ROOT, patchCombat } from '../load.js';

export type Opening = 'independent' | 'sequence';
/**
 * plan : horaires du plan ; jitter1/jitter2 : chaque horaire décalé au hasard de ±1 ou ±2 s (au moins 0 s), ce qui peut
 * changer l'ordre des sorts ; zero : aucun horaire (tout à 0 s, ordre du plan).
 */
export type Variant = 'plan' | 'jitter1' | 'jitter2' | 'zero';

export interface CombatCase {
  plan: string;
  level: number;
  encounter: string;
  opening: Opening;
  danger: number;
  variant: Variant;
}

export interface CombatRow extends CombatCase {
  seed: number;
  result: FightResult;
}

export interface CombatOptions {
  seeds: number;
  levels: number[];
  dangers: number[];
  openings: Opening[];
  /** Variantes d'horaires, mesurées au niveau le plus haut, danger 1, ouverture par défaut. */
  variants: Variant[];
}

export const defaultCombatOptions: CombatOptions = { seeds: 12, levels: [40, 80], dangers: [1, 1.5, 2], openings: ['independent', 'sequence'], variants: ['jitter1', 'jitter2', 'zero'] };

/** Horaires d'une variante ; le décalage aléatoire dépend de la graine (un plan différent par graine). */
export function shiftPlan(entries: PlanEntry[], variant: Variant, seed: number, maxAt = Infinity): PlanEntry[] {
  if (variant === 'zero') return entries.map((e) => ({ ...e, at: 0 }));
  if (variant === 'plan') return entries;
  const range = variant === 'jitter1' ? 1 : 2;
  const rand = stream(seed, 'jitter');
  // Pas de 0,25 s, comme l'horloge du combat.
  return entries.map((e) => ({ ...e, at: Math.min(maxAt, Math.max(0, e.at + Math.round((rand() * 2 - 1) * range * 4) / 4)) }));
}

export function runCase(combat: CombatContent, c: CombatCase, seed: number): FightResult {
  const plan = combat.plans[c.plan]!;
  const entries = shiftPlan(plan.levels[String(c.level)]!, c.variant, seed, combat.rules.maxFirstUse);
  return fight(combat, [{ id: 'p1', classId: plan.class, pathId: plan.path, plan: entries, weapon: plan.weapon, basicElement: plan.basicElement }], combat.encounters[c.encounter]!, {
    seed,
    opening: c.opening,
    enemyDamageScale: c.danger,
  });
}

/** Tous les cas du banc, dans un ordre stable. */
export function combatCases(combat: CombatContent, o: CombatOptions): CombatCase[] {
  const cases: CombatCase[] = [];
  const plans = Object.values(combat.plans);
  const encounters = Object.keys(combat.encounters);
  for (const opening of o.openings)
    for (const danger of o.dangers)
      for (const level of o.levels)
        for (const p of plans) {
          if (!p.levels[String(level)]) continue;
          for (const encounter of encounters) cases.push({ plan: p.id, level, encounter, opening, danger, variant: 'plan' });
        }
  const top = Math.max(...o.levels);
  for (const variant of o.variants)
    for (const p of plans)
      for (const encounter of encounters) cases.push({ plan: p.id, level: top, encounter, opening: combat.rules.opening, danger: 1, variant });
  return cases;
}

export function runCombat(combat: CombatContent, o: CombatOptions): CombatRow[] {
  const rows: CombatRow[] = [];
  for (const c of combatCases(combat, o)) for (let seed = 0; seed < o.seeds; seed++) rows.push({ ...c, seed, result: runCase(combat, c, seed) });
  return rows;
}

// --- Agrégation ------------------------------------------------------------------------------------------------------

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export interface CombatSummary extends CombatCase {
  path: string;
  role: string;
  class: string;
  n: number;
  wins: number;
  winRate: number;
  /** Médiane des durées des victoires (comme le banc du dossier). */
  medianTime: number | null;
  /** Médiane des PV restants, sur tous les combats de la ligne (victoires et échecs). */
  medianHp: number;
  medianMinHp: number;
  causes: Record<string, number>;
  /** Échecs : part médiane des PV ennemis restants. */
  failureEnemyHpLeft: number | null;
  contributions: Record<string, number>;
  metrics: Record<string, number>;
}

const caseKey = (c: CombatCase) => `${c.opening}|${c.danger}|${c.level}|${c.variant}|${c.plan}|${c.encounter}`;

export function summarize(combat: CombatContent, rows: CombatRow[]): CombatSummary[] {
  const groups = new Map<string, CombatRow[]>();
  for (const r of rows) {
    const k = caseKey(r);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }
  return [...groups.values()].map((g) => {
    const first = g[0]!;
    const plan = combat.plans[first.plan]!;
    const res = g.map((r) => r.result);
    const wins = res.filter((r) => r.win);
    const causes: Record<string, number> = {};
    for (const r of res) if (!r.win) {
      const k = r.cause === 'death' ? `mort (${r.killedBy})` : 'temps écoulé';
      causes[k] = (causes[k] ?? 0) + 1;
    }
    const sumKeys = (pick: (r: FightResult) => Record<string, number>) => {
      const out: Record<string, number> = {};
      for (const r of res) for (const [k, v] of Object.entries(pick(r))) out[k] = (out[k] ?? 0) + v / res.length;
      return out;
    };
    const { plan: _p, level, encounter, opening, danger, variant } = first;
    return {
      plan: plan.id, level, encounter, opening, danger, variant,
      path: plan.path,
      role: combat.paths[plan.path]!.role,
      class: plan.class,
      n: res.length,
      wins: wins.length,
      winRate: wins.length / res.length,
      medianTime: median(wins.map((r) => r.time)),
      medianHp: median(res.map((r) => r.team[0]!.hpRatio))!,
      medianMinHp: median(res.map((r) => r.team[0]!.minHpRatio))!,
      causes,
      failureEnemyHpLeft: median(res.filter((r) => !r.win).map((r) => r.enemyHpLeft)),
      contributions: sumKeys((r) => ({ ...r.team[0]!.contributions, dps: r.team[0]!.contributions.damage / r.time })),
      metrics: sumKeys((r) => r.team[0]!.metrics),
    };
  });
}

// --- Rapport -------------------------------------------------------------------------------------------------------

const fr = (n: number | null, digits = 1) => (n === null ? '—' : n.toFixed(digits).replace('.', ','));
const pct = (n: number | null, digits = 0) => (n === null ? '—' : `${fr(n * 100, digits)} %`);
const ROLE_LABEL: Record<string, string> = { damage: 'dégâts', control: 'contrôle', support: 'soutien' };

interface BancRow {
  level: number;
  plan: string;
  path: string;
  encounter: string;
  winRate: number;
  medianTime: number | null;
  medianHp: number;
}

function provenance(proposal?: string): Record<string, string> {
  const h = (files: string[]) => {
    const hash = createHash('sha256');
    for (const f of files) hash.update(readFileSync(f));
    return hash.digest('hex').slice(0, 16);
  };
  const dataDir = join(ROOT, 'data', 'combat');
  const engineDir = join(ROOT, 'packages', 'shared', 'src', 'combat');
  return {
    data: h(readdirSync(dataDir).sort().map((f) => join(dataDir, f))),
    engine: h(readdirSync(engineDir).sort().map((f) => join(engineDir, f))),
    bench: h([join(ROOT, 'sim', 'src', 'scenarios', 'combat.ts')]),
    ...(proposal ? { proposal: h([join(ROOT, 'sim', 'proposals', proposal, 'combat.yaml')]) } : {}),
  };
}

/** Tableau avant / après : meilleur plan de chaque voie par profil, écart au DPS, victoires à danger accru. */
function beforeAfter(before: CombatContent, after: CombatContent, b: CombatSummary[], a: CombatSummary[], o: CombatOptions): string[] {
  const top = Math.max(...o.levels);
  const encounters = Object.values(after.encounters);
  const opening = after.rules.opening;
  const best = (combat: CombatContent, rows: CombatSummary[], path: string, enc: string, danger: number) => {
    const list = rows.filter((s) => s.path === path && s.encounter === enc && s.danger === danger && s.level === top && s.variant === 'plan' && s.opening === opening);
    if (danger !== 1) return list.reduce<CombatSummary | null>((x, s) => (!x || s.winRate > x.winRate ? s : x), null);
    return list.filter((s) => s.winRate === 1).reduce<CombatSummary | null>((x, s) => (!x || s.medianTime! < x.medianTime! ? s : x), null);
  };
  const md: string[] = [`## 0. Avant / après (répertoire ${top}, ouverture « ${opening} »)`, ''];
  md.push('« Avant » = `data/`, « après » = la proposition, mêmes graines. Temps · PV du **meilleur plan de la voie** pour ce profil (PV du même plan) ; entre parenthèses, l\'écart au meilleur plan de dégâts de la classe.', '');
  md.push(`| Voie | ${encounters.map((e) => e.name).join(' | ')} |`, `|---|${encounters.map(() => '---').join('|')}|`);
  const cell = (combat: CombatContent, rows: CombatSummary[], path: string, enc: string) => {
    const s = best(combat, rows, path, enc, 1);
    const kit = combat.kits[combat.paths[path]!.class]!;
    const d = best(combat, rows, kit.paths.find((p) => p.role === 'damage')!.id, enc, 1);
    if (!s) return 'aucun plan sûr';
    const gap = combat.paths[path]!.role !== 'damage' && d?.medianTime ? ` (${s.medianTime! >= d.medianTime ? '+' : ''}${pct(s.medianTime! / d.medianTime - 1)})` : '';
    return `${fr(s.medianTime)} s${gap} · ${pct(s.medianHp)}`;
  };
  for (const path of Object.values(after.paths)) {
    md.push(`| ${path.name} | ${encounters.map((e) => `${cell(before, b, path.id, e.id)} → **${cell(after, a, path.id, e.id)}**`).join(' | ')} |`);
  }
  md.push('');
  for (const danger of o.dangers.filter((d) => d > 1)) {
    md.push(`**Danger ×${fr(danger, 1)}** : meilleur taux de victoire parmi les plans de la voie, avant → après.`, '');
    md.push(`| Voie | ${encounters.map((e) => e.name).join(' | ')} |`, `|---|${encounters.map(() => '---').join('|')}|`);
    for (const path of Object.values(after.paths)) {
      md.push(`| ${path.name} | ${encounters.map((e) => `${pct(best(before, b, path.id, e.id, danger)?.winRate ?? null)} → **${pct(best(after, a, path.id, e.id, danger)?.winRate ?? null)}**`).join(' | ')} |`);
    }
    md.push('');
  }
  return md;
}

export interface ReportTarget {
  /** Proposition mesurée (sinon : data/). */
  proposal?: string;
  /** Données d'avant, pour le tableau avant / après. */
  baseline?: Content;
}

export function combatReport(content: Content, o: CombatOptions = defaultCombatOptions, target: ReportTarget = {}): string {
  const combat = content.combat;
  if (!combat) throw new Error('data/combat/ absent');
  const started = Date.now();
  const rows = runCombat(combat, o);
  const elapsed = (Date.now() - started) / 1000;
  const summary = summarize(combat, rows);
  const prov = provenance(target.proposal);
  const dir = join(ROOT, 'sim', 'reports', 'combat', ...(target.proposal ? [target.proposal] : []));
  mkdirSync(dir, { recursive: true });

  // Résultats bruts : une ligne par combat, colonnes nommées (échecs compris).
  const columns = ['opening', 'danger', 'level', 'variant', 'plan', 'encounter', 'seed', 'win', 'time', 'cause', 'killedBy', 'enemyHpLeft', 'hp', 'minHp', 'damage', 'healing', 'absorbed', 'mitigated', 'pressure', 'breaks', 'dispels', 'cleanses'];
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  const raw = rows.map((r) => {
    const x = r.result;
    const c = x.team[0]!;
    const k = c.contributions;
    return [r.opening, r.danger, r.level, r.variant, r.plan, r.encounter, r.seed, x.win ? 1 : 0, x.time, x.cause, x.killedBy, r3(x.enemyHpLeft), r3(c.hpRatio), r3(c.minHpRatio), Math.round(k.damage), Math.round(k.healing), Math.round(k.absorbed), Math.round(k.mitigated), Math.round(k.pressure), k.breaks, k.dispels, k.cleanses];
  });
  writeFileSync(join(dir, 'combats.json'), `${JSON.stringify({ provenance: prov, options: o, columns })}\n${raw.map((x) => JSON.stringify(x)).join('\n')}\n`);
  // Une ligne par cas, pour relire ou comparer deux versions ligne à ligne.
  writeFileSync(join(dir, 'resume.json'), `{"provenance":${JSON.stringify(prov)},"options":${JSON.stringify(o)},"rows":[\n${summary.map((s) => JSON.stringify(s)).join(',\n')}\n]}\n`);

  const find = (c: Partial<CombatSummary>) => summary.filter((s) => Object.entries(c).every(([k, v]) => (s as unknown as Record<string, unknown>)[k] === v));
  const encounters = Object.values(combat.encounters);
  const plansByPath = (path: string) => Object.values(combat.plans).filter((p) => p.path === path);
  const top = Math.max(...o.levels);
  const defOpening = combat.rules.opening;
  const md: string[] = [];
  md.push(`# Banc de combat sur le moteur réel${target.proposal ? ` : proposition \`${target.proposal}\`` : ''}`, '');
  md.push(`> Généré par \`pnpm --filter @bramo/sim sim combat${target.proposal ? ` --proposal ${target.proposal}` : ''}\`. Ne pas modifier à la main.`, '');
  md.push(`**${rows.length} combats** en ${fr(elapsed)} s (${o.seeds} graines par cas). Empreintes : données \`${prov.data}\`, moteur \`${prov.engine}\`, banc \`${prov.bench}\`.`, '');
  md.push('**Portée.** Kit de classe seul : sorts, mécanique de classe et passif de voie. Statistiques normalisées du dossier (P = 100, 2 800 PV, 25 % de réduction, 20 % de critique, 12 % de Cadence) : **pas encore d\'équipement, d\'ensembles, de gemmes ni de nommés**, ni de résistances élémentaires (reportées). Les répertoires 40 et 80 changent les sorts accessibles, pas les statistiques. Rencontres isolées, solo. Les fichiers `combats.json` (un combat par ligne) et `resume.json` (une ligne par cas) gardent tout, échecs compris.', '');
  md.push('**Lecture.** Dans chaque cellule « temps · PV », le temps est la médiane des **victoires** et les PV la médiane de **tous les combats de la même ligne** (même plan, même profil, mêmes graines). Quand une cellule retient « le meilleur plan de la voie », le PV affiché est celui **de ce plan-là**, pas une moyenne d\'autres plans.', '');

  // 1. Comparaison au banc du dossier.
  const bancFile = join(ROOT, 'sim', 'reference', 'banc-coeur-v0.2.json');
  const banc = JSON.parse(readFileSync(bancFile, 'utf8')) as { baselines: BancRow[] };
  if (target.baseline?.combat) md.push(...beforeAfter(target.baseline.combat, combat, summarize(target.baseline.combat, runCombat(target.baseline.combat, o)), summary, o));
  if (!target.proposal && o.openings.includes('sequence') && o.dangers.includes(1)) {
    // Le banc a joué les règles du dossier v0.2 : on les rejoue (sim/reference/dossier-v0.2-combat.yaml), pas data/.
    const ref = dossierCombat();
    const refRows = summarize(ref, runCombat(ref, { ...o, dangers: [1], openings: ['sequence'], variants: [] }));
    md.push('## 1. Moteur réel et banc du dossier (kit seul, ouverture « séquence », règles du dossier v0.2)', '');
    md.push('Le banc Python a joué les mêmes plans en kit seul avec la règle d\'ouverture « séquence » et les chiffres du dossier v0.2 ; le moteur les rejoue avec ces mêmes chiffres (`sim/reference/dossier-v0.2-combat.yaml`), pas avec l\'équilibrage actuel de `data/`. Les tirages ne sont pas les mêmes (générateurs différents) : on attend des écarts de quelques pour cent, pas une égalité.', '');
    md.push('| Niveau | Plan | Rencontre | Banc : temps · PV | Moteur : temps · PV | Écart de temps |', '|---|---|---|---|---|---|');
    const deltas: number[] = [];
    for (const b of banc.baselines) {
      const s = refRows.find((x) => x.level === b.level && x.plan === b.plan && x.encounter === b.encounter);
      if (!s) continue;
      const d = s.medianTime && b.medianTime ? s.medianTime / b.medianTime - 1 : null;
      if (d !== null) deltas.push(Math.abs(d));
      md.push(`| ${b.level} | ${b.plan} | ${b.encounter} | ${fr(b.medianTime, 2)} s · ${pct(b.medianHp)} | ${fr(s.medianTime, 2)} s · ${pct(s.medianHp)} | ${d === null ? '—' : `${d > 0 ? '+' : ''}${pct(d, 1)}`} |`);
    }
    md.push('', `Écart absolu de temps : médian ${pct(median(deltas), 1)}, maximal ${pct(Math.max(...deltas), 1)}.`, '');
  }

  // 2. Les voies au répertoire le plus haut.
  md.push(`## 2. Les neuf voies, répertoire ${top}, danger normal, ouverture « ${defOpening} »`, '');
  md.push('Chaque cellule : **meilleur plan de la voie** pour ce profil (temps médian le plus court parmi ses plans qui gagnent tout), puis les PV médians **de ce même plan**.', '');
  md.push(`| Voie | Rôle | ${encounters.map((e) => e.name).join(' | ')} |`, `|---|---|${encounters.map(() => '---').join('|')}|`);
  const bestOf = (path: string, encounter: string, filter: Partial<CombatSummary>) => {
    const list = plansByPath(path).flatMap((p) => find({ ...filter, plan: p.id, encounter }));
    const ok = list.filter((s) => s.winRate === 1 && s.medianTime !== null);
    return ok.length ? ok.reduce((a, b) => (b.medianTime! < a.medianTime! ? b : a)) : list.reduce((a, b) => (b.winRate > a.winRate ? b : a), list[0]!);
  };
  const base = { opening: defOpening, danger: 1, level: top, variant: 'plan' as Variant };
  for (const k of Object.values(combat.kits)) {
    for (const p of k.paths) {
      const cells = encounters.map((e) => {
        const s = bestOf(p.id, e.id, base);
        return s ? `${fr(s.medianTime)} s · ${pct(s.medianHp)}${s.winRate < 1 ? ` (${pct(s.winRate)} de victoires)` : ''}` : '—';
      });
      md.push(`| ${combat.kits[k.id]!.label.replace(/^Le |^La /, '')} · ${p.name} | ${ROLE_LABEL[p.role]} | ${cells.join(' | ')} |`);
    }
  }
  md.push('');

  // 3. Avantage du DPS sur les autres voies de sa classe.
  md.push('## 3. Rendement des voies de dégâts', '');
  md.push('Temps du meilleur plan de contrôle et de soutien **rapporté** au meilleur plan de dégâts de la même classe, profil par profil (+20 % = 20 % plus lent que le DPS). Cible de conception du dossier : soutien 10 à 30 % plus lent à danger normal.', '');
  md.push(`| Classe | Voie | ${encounters.map((e) => e.name).join(' | ')} |`, `|---|---|${encounters.map(() => '---').join('|')}|`);
  for (const k of Object.values(combat.kits)) {
    const dps = k.paths.find((p) => p.role === 'damage')!;
    for (const p of k.paths.filter((x) => x.role !== 'damage')) {
      const cells = encounters.map((e) => {
        const a = bestOf(dps.id, e.id, base);
        const b = bestOf(p.id, e.id, base);
        return a?.medianTime && b?.medianTime ? `${b.medianTime >= a.medianTime ? '+' : ''}${pct(b.medianTime / a.medianTime - 1)}` : '—';
      });
      md.push(`| ${k.id} | ${p.name} | ${cells.join(' | ')} |`);
    }
  }
  md.push('');

  // 4. Danger accru.
  for (const danger of o.dangers.filter((d) => d > 1)) {
    md.push(`## 4. Danger ×${fr(danger, 1)} (dégâts ennemis), répertoire ${top}, ouverture « ${defOpening} »`, '');
    md.push('Taux de victoire de **chaque plan** (12 graines). Les échecs restent dans `combats.json`.', '');
    md.push(`| Plan | Voie | ${encounters.map((e) => e.name).join(' | ')} |`, `|---|---|${encounters.map(() => '---').join('|')}|`);
    for (const p of Object.values(combat.plans)) {
      const cells = encounters.map((e) => {
        const s = find({ ...base, danger, plan: p.id, encounter: e.id })[0];
        if (!s) return '—';
        const why = Object.entries(s.causes).map(([c, n]) => `${n} ${c}`).join(', ');
        return `${pct(s.winRate)}${why ? ` (${why})` : ''}`;
      });
      md.push(`| ${p.name} | ${combat.paths[p.path]!.name} | ${cells.join(' | ')} |`);
    }
    md.push('');
  }

  // 5. Ouverture.
  if (o.openings.length > 1) {
    md.push(`## 5. Règle d'ouverture : « independent » contre « sequence » (répertoire ${top}, danger normal)`, '');
    md.push('Écart de temps médian de chaque plan (négatif : « independent » plus rapide), moyenne sur les six profils.', '');
    md.push('| Plan | Voie | Écart moyen | Plus grand écart |', '|---|---|---|---|');
    for (const p of Object.values(combat.plans)) {
      const d = encounters
        .map((e) => {
          const a = find({ ...base, opening: 'independent', plan: p.id, encounter: e.id })[0];
          const b = find({ ...base, opening: 'sequence', plan: p.id, encounter: e.id })[0];
          return a?.medianTime && b?.medianTime ? a.medianTime / b.medianTime - 1 : null;
        })
        .filter((x): x is number => x !== null);
      md.push(`| ${p.name} | ${combat.paths[p.path]!.name} | ${pct(mean(d), 1)} | ${pct(d.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0), 1)} |`);
    }
    md.push('');
  }

  // 6. Tolérance des horaires.
  if (o.variants.length) {
    md.push(`## 6. Tolérance des horaires (répertoire ${top}, danger normal, ouverture « ${defOpening} »)`, '');
    md.push('Écart de temps médian par rapport au plan réglé, moyenne sur les six profils ; entre parenthèses, les profils qui ne gagnent plus tout. « ±1 s » et « ±2 s » : chaque horaire décalé au hasard (un tirage par graine), ce qui peut changer l\'ordre des sorts. « Sans horaire » : tous les sorts à 0 s, dans l\'ordre du plan.', '');
    const names: Record<Variant, string> = { plan: 'plan', jitter1: 'Chaque sort ±1 s', jitter2: 'Chaque sort ±2 s', zero: 'Sans horaire' };
    md.push(`| Plan | ${o.variants.map((v) => names[v]).join(' | ')} |`, `|---|${o.variants.map(() => '---').join('|')}|`);
    for (const p of Object.values(combat.plans)) {
      const cells = o.variants.map((v) => {
        let lost = 0;
        const d = encounters
          .map((e) => {
            const a = find({ ...base, variant: v, plan: p.id, encounter: e.id })[0];
            const b = find({ ...base, plan: p.id, encounter: e.id })[0];
            if (a && a.winRate < 1) lost++;
            return a?.medianTime && b?.medianTime ? a.medianTime / b.medianTime - 1 : null;
          })
          .filter((x): x is number => x !== null);
        return `${d.length ? `${mean(d) >= 0 ? '+' : ''}${pct(mean(d), 1)}` : '—'}${lost ? ` (${lost} profil${lost > 1 ? 's' : ''} perdu${lost > 1 ? 's' : ''})` : ''}`;
      });
      md.push(`| ${p.name} | ${cells.join(' | ')} |`);
    }
    md.push('');
  }

  // 7. Contributions.
  md.push(`## 7. Contributions moyennes par combat (répertoire ${top}, danger normal, ouverture « ${defOpening} », tous profils)`, '');
  md.push('Ce que chaque voie apporte au-delà des dégâts : soins réellement rendus, dégâts absorbés par ses boucliers, dégâts évités par ses Affaiblissements, Pression retirée. Base des futures récompenses de groupe et de boss mondial. En solo, les dégâts totaux d\'une victoire valent les PV ennemis : on montre donc les dégâts par seconde.', '');
  md.push('| Voie | Dégâts par seconde | Soins utiles | Absorbé | Atténué | Pression | Ruptures | Dissipations |', '|---|---|---|---|---|---|---|---|');
  for (const path of Object.values(combat.paths)) {
    const list = plansByPath(path.id).flatMap((p) => find({ ...base, plan: p.id }));
    const avg = (k: string) => mean(list.map((s) => s.contributions[k] ?? 0));
    md.push(`| ${path.name} | ${fr(avg('dps'), 1)} | ${fr(avg('healing'), 0)} | ${fr(avg('absorbed'), 0)} | ${fr(avg('mitigated'), 0)} | ${fr(avg('pressure'), 0)} | ${fr(avg('breaks'), 1)} | ${fr(avg('dispels'), 1)} |`);
  }
  md.push('');

  const failures = summary.filter((s) => s.winRate < 1);
  md.push('## 8. Tous les cas avec au moins un échec', '');
  md.push(`${failures.length} cas sur ${summary.length}.`, '');
  if (failures.length) {
    md.push('| Ouverture | Danger | Niveau | Horaires | Plan | Rencontre | Victoires | Causes | PV ennemis restants (médiane des échecs) |', '|---|---|---|---|---|---|---|---|---|');
    for (const s of failures) {
      md.push(`| ${s.opening} | ×${fr(s.danger, 1)} | ${s.level} | ${s.variant} | ${s.plan} | ${s.encounter} | ${s.wins}/${s.n} | ${Object.entries(s.causes).map(([c, n]) => `${n} ${c}`).join(', ')} | ${pct(s.failureEnemyHpLeft)} |`);
    }
    md.push('');
  }
  writeFileSync(join(dir, 'rapport.md'), `${md.join('\n')}\n`);
  return `${rows.length} combats en ${fr(elapsed)} s ; ${failures.length} cas avec échec sur ${summary.length}.\nÉcrit : ${join(dir, 'rapport.md')}, resume.json, combats.json`;
}

export type { ExamplePlan };

/** Contenu de combat avec les chiffres du dossier v0.2 (ceux du banc Python), pour vérifier la fidélité du moteur. */
export function dossierCombat(): CombatContent {
  const raw = readRawContent(DATA_DIR);
  raw.combat = patchCombat(raw.combat, parse(readFileSync(join(ROOT, 'sim', 'reference', 'dossier-v0.2-combat.yaml'), 'utf8')) as CombatPatch);
  return buildContent(raw).combat!;
}
