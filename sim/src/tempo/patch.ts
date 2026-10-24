/**
 * Variantes de rythme du combat (docs/design/coherence/rythme.md), appliquées à un contenu de combat déjà chargé.
 * 1 = inchangé partout.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { type CombatContent, talentCatalogSchema } from '@bramo/shared';
import { deepMerge } from '../load.js';

export interface Tempo {
  /** Tous les nombres × X (Puissance, PV, dégâts et soins ennemis). */
  X: number;
  /** Zones : PV ennemis ÷ K, dégâts ennemis × K (combats K fois plus courts à danger égal). */
  K: number;
  /** Gardiens : la même chose avec leur propre facteur. */
  KG: number;
  /** Dégâts ennemis en plus (zones, gardiens). */
  D: number;
  DG: number;
  /** Les ennemis frappent AR fois plus souvent, AR fois moins fort. */
  AR: number;
  /** Mécaniques ennemies M fois plus fréquentes. */
  M: number;
  /** Recharge des sorts × C ; délais internes des talents × TC. */
  C: number;
  TC: number;
  /** Limite de temps des zones et des gardiens (s), 0 = celle des règles. */
  limit: number;
  limitG: number;
  /** La Cadence raccourcit le délai entre deux sorts. */
  gcdHaste: boolean;
}

export const SAME: Tempo = { X: 1, K: 1, KG: 1, D: 1, DG: 1, AR: 1, M: 1, C: 1, TC: 1, limit: 0, limitG: 0, gcdHaste: false };
/** Le réglage « vif » mesuré le 24 octobre (rythme.md §2.2). */
export const VIF: Tempo = { ...SAME, K: 2.5, KG: 1.5, D: 1.5, DG: 1.3, AR: 2, M: 1.5, C: 0.7, TC: 0.7 };

export function applyTempo(combat: CombatContent, t: Tempo): void {
  const R = combat.rules as unknown as Record<string, any>;
  if (t.gcdHaste) R.gcdHaste = true;
  R.referenceStats.power *= t.X;
  R.referenceStats.maxHp *= t.X;
  if (R.gearStats) {
    R.gearStats.power.perPoint *= t.X;
    R.gearStats.power.base *= t.X;
    for (const k of ['base', 'perPoint', 'perDefense']) R.gearStats.maxHp[k] *= t.X;
  }
  for (const e of Object.values(combat.encounters) as any[]) {
    if (e.kind === 'maree') continue;
    const boss = e.kind === 'gardien';
    const k = boss ? t.KG : t.K;
    const hp = t.X / k;
    const dmg = t.X * k * (boss ? t.DG : t.D);
    const atk = (a: any) => a && ((a.damage *= dmg / t.AR), (a.period /= t.AR));
    e.hp *= hp;
    atk(e.attack);
    for (const a of e.adds ?? []) {
      a.hp *= hp;
      atk(a.attack);
      a.arrive /= t.M;
    }
    if (e.charge) { e.charge.damage *= dmg; e.charge.period /= t.M; }
    if (e.guard) { e.guard.amount *= hp; e.guard.period /= t.M; e.guard.duration /= t.M; }
    if (e.regen) { e.regen.amount *= hp; e.regen.period /= t.M; }
    if (e.aura) e.aura.damage *= dmg;
    if (e.erosion) { e.erosion.damage *= dmg; e.erosion.period /= t.M; }
    if (e.windows) { e.windows.period /= t.M; e.windows.open /= t.M; }
    if (e.enrage) e.enrage.after /= t.M;
    const lim = boss ? t.limitG : t.limit;
    if (lim) e.timeLimit = lim;
  }
  for (const s of Object.values(combat.spells) as any[]) s.cooldown *= t.C;
  const walk = (o: any): void => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(walk);
    for (const key of ['cooldown', 'minCooldown', 'noSkillFor']) if (typeof o[key] === 'number') o[key] *= t.TC;
    Object.values(o).forEach(walk);
  };
  walk(combat.talents);
}

/** Lit une variante dans l'environnement : TEMPO=vif, puis des surcharges (K=3, LIMIT=30…). */
export function tempoFromEnv(env = process.env): Tempo {
  const base = env.TEMPO === 'vif' ? VIF : SAME;
  const n = (k: string, d: number) => (env[k] !== undefined ? Number(env[k]) : d);
  return {
    X: n('X', base.X), K: n('K', base.K), KG: n('KG', base.KG), D: n('D', base.D), DG: n('DG', base.DG), AR: n('AR', base.AR),
    M: n('M', base.M), C: n('C', base.C), TC: n('TC', base.TC), limit: n('LIMIT', base.limit), limitG: n('LIMITG', base.limitG),
    gcdHaste: env.GCDHASTE ? env.GCDHASTE === '1' : base.gcdHaste,
  };
}

/**
 * Ajouts d'une proposition au catalogue de talents (`TALENTS_ADD`, ex. sim/proposals/build-v3/talents_add.yaml) : gemmes,
 * ensembles et nommés ajoutés, ou **remplacés** s'ils ont l'identifiant d'un talent existant ; `rules` fusionné avec les règles.
 * Rend l'archétype que nourrit chaque ensemble ajouté (`feeds`).
 */
export function applyAdditions(combat: CombatContent, file: string, dataDir: string): Record<string, string> {
  const add = parse(readFileSync(file, 'utf8')) as { rules?: unknown; gems?: { id: string }[]; sets?: { id: string; feeds?: string }[]; named?: { id: string }[] };
  const raw = parse(readFileSync(join(dataDir, 'combat', 'talents.yaml'), 'utf8')) as Record<string, { id: string }[]>;
  const feedsOf: Record<string, string> = {};
  for (const st of add.sets ?? []) if (st.feeds) feedsOf[st.id] = st.feeds;
  const merge = (base: { id: string }[], extra: { id: string }[] = []) => [...base.filter((b) => !extra.some((x) => x.id === b.id)), ...extra];
  combat.talents = talentCatalogSchema.parse({
    ...raw,
    gems: merge(raw.gems!, add.gems),
    sets: merge(raw.sets!, (add.sets ?? []).map(({ feeds: _f, ...rest }) => rest)),
    named: merge(raw.named!, add.named),
  });
  if (add.rules) (combat as { rules: unknown }).rules = deepMerge(combat.rules, add.rules);
  return feedsOf;
}
