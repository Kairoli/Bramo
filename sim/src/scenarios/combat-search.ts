/**
 * Recherche de plans : pour chaque voie, toutes les combinaisons de sorts accessibles au niveau donné (au plus un ultime),
 * sans horaire (tous à 0 s, ordre par cooldown croissant). Sert à comparer les voies sur leur meilleur plan plutôt que sur
 * des plans choisis à la main, et préparera le plan conseillé automatique.
 */
import { type CombatContent, type PlanEntry, type Spell, fight, planErrors, spellSlots } from '@bramo/shared';

export interface SearchOptions {
  level: number;
  /** Graines du criblage (toutes les combinaisons). */
  screenSeeds: number;
  /** Graines de la confirmation des meilleures combinaisons. */
  seeds: number;
  /** Combinaisons confirmées par voie. */
  finalists: number;
  dangers: number[];
  opening?: 'independent' | 'sequence';
}

export const defaultSearchOptions: SearchOptions = { level: 80, screenSeeds: 2, seeds: 12, finalists: 8, dangers: [1, 1.5, 2, 2.5, 3, 4] };

export interface SearchedPlan {
  path: string;
  spells: string[];
  /** Par rencontre et par danger : victoires, temps médian des victoires, PV médians. */
  results: Record<string, Record<string, { winRate: number; medianTime: number | null; medianHp: number }>>;
  /** Moyenne des temps médians sur les rencontres (danger 1), si toutes sont gagnées à 100 %. */
  meanTime: number | null;
  /** Rencontres gagnées à 100 % au danger normal ; et temps médian moyen sur ces rencontres. */
  wins: number;
  meanWonTime: number;
}

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[s.length >> 1]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};

function combinations<T>(list: T[], k: number): T[][] {
  const out: T[][] = [];
  const pick = (start: number, acc: T[]) => {
    if (acc.length === k) return void out.push([...acc]);
    for (let i = start; i < list.length; i++) {
      acc.push(list[i]!);
      pick(i + 1, acc);
      acc.pop();
    }
  };
  pick(0, []);
  return out;
}

export const planOf = (spells: Spell[]): PlanEntry[] =>
  [...spells].sort((a, b) => a.cooldown - b.cooldown).map((s) => ({ spell: s.id, at: 0 }));

/** Sorts accessibles à une voie au niveau donné. */
export function pathSpells(combat: CombatContent, pathId: string, level: number): Spell[] {
  const cls = combat.paths[pathId]!.class;
  return Object.values(combat.spells).filter((s) => s.class === cls && s.level <= level && (!s.path || s.path === pathId));
}

function evaluate(combat: CombatContent, pathId: string, spells: Spell[], level: number, seeds: number, dangers: number[], opening?: SearchOptions['opening']): SearchedPlan {
  const cls = combat.paths[pathId]!.class;
  const weapon = combat.kits[cls]!.weapons[0]!;
  const plan = planOf(spells);
  const results: SearchedPlan['results'] = {};
  for (const enc of Object.values(combat.encounters)) {
    results[enc.id] = {};
    for (const danger of dangers) {
      const rs = Array.from({ length: seeds }, (_, seed) =>
        fight(combat, [{ id: 'p1', classId: cls, pathId, plan, weapon }], enc, { seed, opening, enemyDamageScale: danger }),
      );
      const wins = rs.filter((r) => r.win);
      results[enc.id]![String(danger)] = { winRate: wins.length / seeds, medianTime: median(wins.map((r) => r.time)), medianHp: median(rs.map((r) => r.team[0]!.hpRatio))! };
    }
  }
  const base = Object.values(results).map((r) => r['1']!);
  const meanTime = base.every((r) => r.winRate === 1) ? base.reduce((a, r) => a + r.medianTime!, 0) / base.length : null;
  const won = base.filter((r) => r.winRate === 1);
  const meanWonTime = won.length ? won.reduce((a, r) => a + r.medianTime!, 0) / won.length : Infinity;
  return { path: pathId, spells: plan.map((p) => p.spell), results, meanTime, wins: won.length, meanWonTime };
}

/**
 * Criblage d'une voie : toutes ses combinaisons au danger normal, puis les finalistes (les plus rapides en moyenne, les plus
 * sûrs, et le plus rapide et le plus sûr de chaque rencontre).
 */
export function screenPool(combat: CombatContent, pathId: string, o: Pick<SearchOptions, 'level' | 'screenSeeds' | 'finalists' | 'opening'>): Spell[][] {
  const path = combat.paths[pathId]!;
  {
    const pool = pathSpells(combat, path.id, o.level);
    const size = Math.min(spellSlots(combat, o.level), pool.length);
    const combos = combinations(pool, size).filter((c) => planErrors(combat, path.class, path.id, o.level, planOf(c)).length === 0);
    const screened = combos
      .map((c) => ({ c, r: evaluate(combat, path.id, c, o.level, o.screenSeeds, [1], o.opening) }))
      // Un plan qui ne gagne pas tout reste classé (le plus de rencontres gagnées, puis le plus rapide) : une voie n'est jamais retirée du tableau.
      .sort((a, b) => b.r.wins - a.r.wins || a.r.meanWonTime - b.r.meanWonTime);
    // Les finalistes : les plus rapides en moyenne, plus le plus rapide de chaque rencontre (un plan spécialisé peut gagner un profil).
    const chosen = new Set(screened.slice(0, o.finalists).map((x) => x.c));
    // Et les plus sûrs (PV médians au danger normal) : ceux qui franchiront les dangers plus élevés.
    const hp = (x: (typeof screened)[number]) => Object.values(x.r.results).reduce((s, r) => s + r['1']!.medianHp, 0);
    for (const x of [...screened].sort((p, q) => hp(q) - hp(p)).slice(0, o.finalists)) chosen.add(x.c);
    for (const enc of Object.keys(combat.encounters)) {
      const time = (x: (typeof screened)[number]) => (x.r.results[enc]!['1']!.winRate === 1 ? x.r.results[enc]!['1']!.medianTime! : Infinity);
      const best = screened.reduce<(typeof screened)[number] | null>((a, x) => (!a || time(x) < time(a) ? x : a), null);
      if (best) chosen.add(best.c);
      // Et le plus sûr de chaque rencontre : un plan défensif peut franchir un mur que les plans rapides ne passent pas.
      const safest = screened.reduce<(typeof screened)[number] | null>((p, x) => (!p || x.r.results[enc]!['1']!.medianHp > p.r.results[enc]!['1']!.medianHp ? x : p), null);
      if (safest) chosen.add(safest.c);
    }
    return [...chosen];
  }
}

/** Meilleures combinaisons de chaque voie : criblage rapide, puis confirmation sur plus de graines et les dangers demandés. */
export function searchPlans(combat: CombatContent, o: SearchOptions = defaultSearchOptions): Record<string, SearchedPlan[]> {
  const out: Record<string, SearchedPlan[]> = {};
  for (const path of Object.values(combat.paths)) {
    out[path.id] = screenPool(combat, path.id, o).map((c) => evaluate(combat, path.id, c, o.level, o.seeds, o.dangers, o.opening)).sort((a, b) => b.wins - a.wins || a.meanWonTime - b.meanWonTime);
  }
  return out;
}

// --- Rapport et plans conseillés --------------------------------------------------------------------------------------

const fr = (n: number | null, digits = 1) => (n === null ? '—' : n.toFixed(digits).replace('.', ','));

/** Plus haut danger où au moins un plan de la liste gagne 90 % des combats de cette rencontre. */
export function wallOf(list: SearchedPlan[], encounter: string, dangers: number[]): number | null {
  const ok = [...dangers].sort((a, b) => b - a).find((d) => list.some((p) => (p.results[encounter]?.[String(d)]?.winRate ?? 0) >= 0.9));
  return ok ?? null;
}

/** Plan conseillé d'une voie : le plus rapide en moyenne qui gagne tous les profils au danger normal. */
export function recommendedPlan(combat: CombatContent, list: SearchedPlan[], level: number) {
  const best = list.find((p) => p.meanTime !== null) ?? list[0]!;
  const path = combat.paths[best.path]!;
  return { path: best.path, class: path.class, weapon: combat.kits[path.class]!.weapons[0]!, level, spells: best.spells };
}

export function searchMarkdown(combat: CombatContent, byLevel: Record<string, Record<string, SearchedPlan[]>>, o: SearchOptions): string {
  const encounters = Object.values(combat.encounters);
  const md: string[] = ['# Recherche de plans', '', '> Généré par `pnpm --filter @bramo/sim sim combat-search`. Ne pas modifier à la main.', ''];
  md.push(
    `Toutes les combinaisons de ${spellSlots(combat, Math.max(...Object.keys(byLevel).map(Number)))} sorts accessibles à chaque voie (au plus un ultime), sans horaire (tous à 0 s, par cooldown croissant), arme : la première de la classe. Criblage à ${o.screenSeeds} graines au danger normal ; les plus rapides en moyenne, les plus sûrs (PV) et le plus rapide de chaque rencontre sont rejoués à ${o.seeds} graines aux dangers ${o.dangers.map((d) => `×${fr(d)}`).join(', ')}. Kit seul, statistiques normalisées.`,
    '',
    '**Lecture.** Temps : médiane des victoires du **plan le plus rapide de la voie pour ce profil** ; PV : ceux **de ce même plan**. Écart : par rapport au même calcul pour la voie de dégâts de la classe. **Mur** : plus haut danger où au moins un plan rejoué de la voie gagne 90 % des combats (≥ signifie que le plus haut danger essayé est franchi).',
    '',
  );
  for (const [level, res] of Object.entries(byLevel)) {
    md.push(`## Répertoire ${level}`, '');
    md.push(`| Voie | Plan le plus rapide en moyenne | Moyenne | ${encounters.map((e) => e.name).join(' | ')} |`, `|---|---|---|${encounters.map(() => '---').join('|')}|`);
    const top = Math.max(...o.dangers);
    for (const kit of Object.values(combat.kits)) {
      const dps = res[kit.paths.find((p) => p.role === 'damage')!.id] ?? [];
      const fastest = (list: SearchedPlan[], e: string) =>
        list.filter((x) => x.results[e]?.['1']?.winRate === 1).reduce<SearchedPlan | null>((a, x) => (!a || x.results[e]!['1']!.medianTime! < a.results[e]!['1']!.medianTime! ? x : a), null);
      for (const p of kit.paths) {
        const list = res[p.id] ?? [];
        const best = list[0];
        const cells = encounters.map((e) => {
          const f = fastest(list, e.id);
          const d = fastest(dps, e.id);
          const wall = wallOf(list, e.id, o.dangers);
          if (!f) return `aucune victoire sûre · mur ${wall === null ? '—' : `×${fr(wall)}`}`;
          const r = f.results[e.id]!['1']!;
          const gap = p.role !== 'damage' && d ? ` (${r.medianTime! >= d.results[e.id]!['1']!.medianTime! ? '+' : ''}${fr((r.medianTime! / d.results[e.id]!['1']!.medianTime! - 1) * 100, 0)} %)` : '';
          return `${fr(r.medianTime)} s${gap} · ${fr(r.medianHp * 100, 0)} % · mur ${wall === null ? '—' : `${wall === top ? '≥ ' : ''}×${fr(wall)}`}`;
        });
        md.push(`| ${p.name} | ${best ? best.spells.map((s) => combat.spells[s]!.name).join(', ') : '—'} | ${fr(best?.meanTime ?? null)} s | ${cells.join(' | ')} |`);
      }
    }
    md.push('');
    md.push('Sorts de voie dans le plan le plus rapide en moyenne :', '');
    for (const path of Object.values(combat.paths)) {
      const best = res[path.id]?.[0];
      const own = best ? best.spells.filter((s) => combat.spells[s]!.path === path.id) : [];
      md.push(`- ${path.name} : ${own.length ? own.map((s) => combat.spells[s]!.name).join(', ') : '**aucun**'}`);
    }
    md.push('');
  }
  return md.join('\n');
}
