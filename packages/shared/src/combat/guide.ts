/**
 * Ce que le joueur doit comprendre sans lire le code [Louis, 24 octobre : « le combat est tellement simple qu'il est
 * impossible de deviner ce qu'il se passe sans explications »] : à quoi sert chaque réserve dans son build, et ce que fait
 * chaque mécanique d'une rencontre, avec ses réponses. Tout vient des données (talents, outils, rencontres).
 */
import type { CombatContent, Encounter, Talent, TalentAction, TalentCatalog, TalentEffect } from '../schemas/combat.js';
import type { FightResult } from './engine.js';

/** Une pièce (talent) qui touche une réserve, et comment. */
export interface PoolUse {
  name: string;
  how: string;
}

/** Ce qui remplit une réserve, ce qui la dépense, ce qui s'en sert sans la vider. */
export interface PoolLinks {
  fill: PoolUse[];
  spend: PoolUse[];
  use: PoolUse[];
}

const AS: Record<'damage' | 'shield' | 'heal', string> = { damage: 'en dégâts', shield: 'en bouclier', heal: 'en soins' };

const actions = (e: TalentEffect): TalentAction[] => {
  const out: TalentAction[] = [];
  for (let a: TalentAction | undefined = e.do; a; a = a.fallback) out.push(a);
  return out;
};

/** Le texte d'un talent pour le joueur : celui de la gemme, de l'objet nommé, ou du palier de l'ensemble. */
function talentText(catalog: TalentCatalog, t: Talent): string | null {
  const named = catalog.named.find((n) => n.id === t.id) ?? catalog.gems.find((g) => g.id === t.id);
  if (named?.text) return named.text;
  const m = /^(.+)_([234])$/.exec(t.id);
  const set = m ? catalog.sets.find((s) => s.id === m[1]) : undefined;
  const line = set?.text?.find((x) => x.startsWith(`${m![2]} :`));
  return line ? line.slice(line.indexOf(':') + 1).trim() : null;
}

/**
 * Les réserves que ces talents remplissent vraiment : un gain direct, ou une conversion depuis une réserve elle-même
 * remplie [Louis, 24 octobre : « mon talent dit que la Rancœur donne de la Ferveur, mais rien ne remplit la Rancœur »].
 */
export function filledPools(talents: Talent[]): Set<string> {
  const out = new Set<string>();
  for (const t of talents) for (const e of t.effects ?? []) for (const a of actions(e)) if (a.gain) out.add(a.gain.pool);
  for (let more = true; more; ) {
    more = false;
    for (const t of talents) for (const c of t.convert ?? []) if (out.has(c.from) && !out.has(c.to)) (out.add(c.to), (more = true));
  }
  return out;
}

/** Les réserves dont un talent a besoin (qu'il convertit, dépense ou attend) et que rien ne remplit. */
export function missingPools(talent: Talent, filled: Set<string>): string[] {
  const need = new Set<string>((talent.convert ?? []).map((c) => c.from));
  for (const e of talent.effects ?? []) {
    if (e.poolAtLeast) need.add(e.poolAtLeast.pool);
    for (const a of actions(e)) {
      if (a.spendPool) need.add(a.spendPool.pool);
      if (a.scaleBy) need.add(a.scaleBy);
    }
  }
  return [...need].filter((p) => !filled.has(p));
}

/** `filled` : dans un build, une conversion ne remplit que si sa réserve d'origine est remplie. */
function linksOf(pool: string, entries: { name: string; talent: Talent; text: string | null }[], filled?: Set<string>): PoolLinks {
  const links: PoolLinks = { fill: [], spend: [], use: [] };
  for (const { name, talent, text } of entries) {
    let fill = false;
    let spend: string | null = null;
    let use = false;
    for (const e of talent.effects ?? []) {
      if (e.poolAtLeast?.pool === pool) use = true;
      for (const a of actions(e)) {
        if (a.gain?.pool === pool) fill = true;
        if (a.spendPool?.pool === pool) spend = AS[a.spendPool.as];
        if (a.scaleBy === pool) use = true;
      }
    }
    const from = (talent.convert ?? []).find((c) => c.to === pool && (!filled || filled.has(c.from)));
    const how = text ?? '';
    if (fill) links.fill.push({ name, how });
    else if (from) links.fill.push({ name, how: how || `chaque charge de ${from.from} en donne aussi` });
    if (spend) links.spend.push({ name, how: how || `la dépense ${spend}` });
    else if (use) links.use.push({ name, how });
    if (!fill && !from && !spend && !use && talent.pools?.[pool]) links.use.push({ name, how: how || `+${talent.pools[pool]} au plafond` });
  }
  return links;
}

/** Dans le build : les talents de la rencontre en cours (gemmes, objets nommés, paliers d'ensemble). */
export function buildPoolLinks(combat: CombatContent, talents: Talent[], pool: string): PoolLinks {
  const catalog = combat.talents;
  if (!catalog) return { fill: [], spend: [], use: [] };
  return linksOf(
    pool,
    talents.map((t) => {
      const m = /^(.+)_([234])$/.exec(t.id);
      const set = m ? catalog.sets.find((s) => s.id === m[1]) : undefined;
      return { name: set ? `${set.name} (${m![2]} pièces)` : t.name, talent: t, text: talentText(catalog, t) };
    }),
    filledPools(talents),
  );
}

/** Dans le jeu : les objets nommés et les ensembles qu'on peut trouver (les gemmes de talent n'existent pas encore). */
export function gamePoolLinks(combat: CombatContent, pool: string): PoolLinks {
  const catalog = combat.talents;
  if (!catalog) return { fill: [], spend: [], use: [] };
  const entries: { name: string; talent: Talent; text: string | null }[] = catalog.named.map((n) => ({ name: `${n.name} (objet nommé)`, talent: n, text: n.text ?? null }));
  for (const s of catalog.sets)
    for (const tier of ['2', '3'] as const) {
      const b = s.pieces[tier];
      if (b) entries.push({ name: `${s.name} (${tier} pièces)`, talent: { id: `${s.id}_${tier}`, name: s.name, effects: b.effects ?? [], ...(b.pools ? { pools: b.pools } : {}) }, text: s.text?.find((x) => x.startsWith(`${tier} :`))?.slice(4).trim() ?? null });
    }
  return linksOf(pool, entries);
}

// --- Les mécaniques des rencontres -----------------------------------------------------------------------------------

export type MechanicId = 'windows' | 'erosion' | 'guard' | 'adds' | 'heavy' | 'charge' | 'aura' | 'regen' | 'group' | 'enrage';

/** Une mécanique d'une rencontre : ce qui se passe, et ce qui y répond. `live` : de quoi la suivre pendant le combat. */
export interface MechanicView {
  id: MechanicId;
  name: string;
  text: string;
  answers: string[];
  live?: { period?: number; open?: number; duration?: number; max?: number; waves?: { at: number; text: string }[] };
}

/** La famille de réponses (outils de situation) de chaque mécanique. */
const FAMILY: Partial<Record<MechanicId, string>> = { windows: 'interstice', erosion: 'rain', guard: 'fracture', adds: 'beat', heavy: 'impact', charge: 'impact', aura: 'breath' };

const s = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const pct = (x: number) => `${Math.round(x * 100)} %`;
const times = (xs: number[]) => (xs.length > 1 ? `${xs.slice(0, -1).map(s).join(', ')} et ${s(xs.at(-1)!)} s` : `${s(xs[0]!)} s`);

/** Ce qui répond à une mécanique : la gemme, la préparation et les ensembles de sa famille. */
function answersFor(combat: CombatContent, id: MechanicId): string[] {
  const family = FAMILY[id];
  if (!family) return [];
  const out: string[] = [];
  const gem = combat.tools.find((t) => t.family === family && t.rank === 'gem');
  if (gem) out.push(`${gem.name} : une gemme (Joaillerie), à sertir`);
  const prep = combat.tools.find((t) => t.family === family && t.rank === 'prep');
  if (prep) out.push(`${prep.name} : une préparation (Fournitures)`);
  const sets = (combat.talents?.sets ?? []).filter((x) => x.family === family).map((x) => x.name);
  if (sets.length) out.push(`${sets.join(' ou ')} : un ensemble, porté à 4 pièces`);
  return out;
}

export function encounterMechanics(combat: CombatContent, e: Encounter): MechanicView[] {
  const out: MechanicView[] = [];
  const add = (id: MechanicId, name: string, text: string, live?: MechanicView['live']) => out.push({ id, name, text, answers: answersFor(combat, id), ...(live ? { live } : {}) });
  if (e.windows)
    add('windows', 'Fenêtres', `Il ne prend vraiment des dégâts que ${s(e.windows.open)} s toutes les ${s(e.windows.period)} s ; le reste du temps, ${pct(e.windows.closedReduction)} de dégâts en moins. Les gros coups valent plus fenêtre ouverte.`, { period: e.windows.period, open: e.windows.open });
  if (e.guard)
    add(
      'guard',
      'Garde',
      `Toutes les ${s(e.guard.period)} s, ${e.guard.on === 'alternate' ? 'l’un des deux' : e.enemies > 1 ? 'ils lèvent' : 'il lève'}${e.guard.on === 'alternate' ? ' lève' : ''} une garde qui absorbe les dégâts pendant ${s(e.guard.duration)} s${e.guard.empower ? `, et frappe ${s(1 + e.guard.empower)} fois plus fort tant qu’elle tient` : ''}. ${e.guard.on === 'alternate' ? 'Frapper celui qui ne la porte pas.' : 'La briser vite coupe la menace.'}`,
      { period: e.guard.period, duration: e.guard.duration },
    );
  if (e.erosion)
    add('erosion', 'Érosion', `Toutes les ${s(e.erosion.period)} s, une charge de plus sur toi (${e.erosion.maxStacks} au plus) ; chaque charge te ronge un peu chaque seconde. Une purification les retire toutes.`, { period: e.erosion.period, max: e.erosion.maxStacks });
  if (e.adds?.length) {
    const waves = e.adds.map((a) => ({ at: a.arrive, text: `${a.count} ${a.name}` }));
    const byName = new Map<string, number[]>();
    for (const a of e.adds) {
      const key = `${a.count > 1 ? `${a.count} × ` : ''}${a.name}`;
      byName.set(key, [...(byName.get(key) ?? []), a.arrive]);
    }
    const list = [...byName].map(([n, at]) => `${n} à ${times(at)}`).join(' ; ');
    add('adds', 'Renforts', `Des renforts arrivent : ${list}. Les coups qui touchent plusieurs cibles valent cher.`, { waves });
  }
  if (e.attack.heavyEvery && e.attack.heavyMultiplier)
    add('heavy', 'Coups lourds', `Un coup sur ${e.attack.heavyEvery} frappe ${s(e.attack.heavyMultiplier)} fois plus fort. Un bouclier, ou un affaiblissement gardé pour ce coup-là, change tout.`);
  if (e.charge) add('charge', 'Attaque chargée', `Toutes les ${s(e.charge.period)} s, il prépare une attaque très forte, annoncée à l’écran.`, { period: e.charge.period });
  if (e.aura) add('aura', 'Aura', 'Elle te blesse un peu chaque seconde, tout le combat. Une purification t’en protège quelques secondes.');
  if (e.regen)
    add('regen', 'Soins', `Toutes les ${s(e.regen.period)} s, il se soigne${e.regen.uses ? ` (${e.regen.uses} fois au plus)` : ''}${e.regen.requiresAdds ? ', tant qu’un renfort est en vie : le renfort d’abord' : ''}.`, { period: e.regen.period });
  if (e.enemies > 1) add('group', 'Groupe', `${e.enemies} ennemis à la fois : les coups qui touchent plusieurs cibles valent double.`);
  if (e.enrage) add('enrage', 'Fureur', `Après ${s(e.enrage.after)} s, il frappe de plus en plus fort : il faut finir avant.`);
  return out;
}

/**
 * Le détail d'un combat, pour le joueur (« pourquoi j'ai gagné vite, pourquoi j'ai perdu ») : une phrase de verdict, ce qu'il a
 * fait (par source : attaques de base, chaque sort, afflictions, mécanique de classe, talents), ce qu'il a reçu (coups, attaques
 * chargées, aura, érosion), et, après une défaite, ce qui répond à ce qui l'a battu (les réponses de la rencontre).
 */
export interface FightBreakdown {
  verdict: string;
  dps: number;
  dealt: { label: string; amount: number; kind: 'basic' | 'spell' | 'dot' | 'class' | 'talent' }[];
  taken: { label: string; amount: number }[];
  answers: string[];
}

export function fightBreakdown(combat: CombatContent, e: Encounter, r: FightResult, heroId = 'p1'): FightBreakdown {
  const me = r.team.find((x) => x.id === heroId) ?? r.team[0]!;
  const m = me.metrics;
  const dealt: FightBreakdown['dealt'] = [];
  // Les sorts : la part de chacun dans les dégâts des compétences, d'après le déroulé (chaque lancer et ce qu'il a retiré).
  const bySpell = new Map<string, number>();
  for (const x of r.trace ?? []) if (x.who === heroId && x.kind === 'cast' && x.ref && x.dmg) bySpell.set(x.ref, (bySpell.get(x.ref) ?? 0) + x.dmg);
  const castTotal = [...bySpell.values()].reduce((a, b) => a + b, 0);
  const skill = m['damage:skill'] ?? 0;
  for (const [id, v] of bySpell) dealt.push({ label: combat.spells[id]?.name ?? id, amount: Math.round(castTotal ? (skill * v) / castTotal : 0), kind: 'spell' });
  if (!castTotal && skill) dealt.push({ label: 'Sorts', amount: Math.round(skill), kind: 'spell' });
  const other: [string, string, FightBreakdown['dealt'][number]['kind']][] = [
    ['damage:basic', 'Attaques de base', 'basic'],
    ['damage:dot', 'Brûlures et saignements', 'dot'],
    ['damage:class', 'Mécanique de classe et voie', 'class'],
    ['damage:gear', 'Talents (gemmes, ensembles, objets nommés)', 'talent'],
    ['damage:gear_dot', 'Afflictions des talents', 'talent'],
  ];
  for (const [k, label, kind] of other) if (m[k]) dealt.push({ label, amount: Math.round(m[k]!), kind });
  dealt.sort((a, b) => b.amount - a.amount);
  const taken = [
    { label: 'Coups ordinaires', amount: m['taken:attack'] ?? 0 },
    { label: 'Attaques chargées', amount: m['taken:charge'] ?? 0 },
    { label: 'Aura', amount: m.auraDamage ?? 0 },
    { label: 'Érosion', amount: m.erosionDamage ?? 0 },
  ]
    .filter((x) => x.amount > 0)
    .map((x) => ({ ...x, amount: Math.round(x.amount) }))
    .sort((a, b) => b.amount - a.amount);
  const total = dealt.reduce((a, x) => a + x.amount, 0);
  const dps = Math.round(total / Math.max(1, r.time));
  const mech = encounterMechanics(combat, e);
  const answersOf = (ids: MechanicId[]) => mech.filter((x) => ids.includes(x.id)).flatMap((x) => x.answers);
  const limit = e.timeLimit ?? combat.rules.fightLimit;
  const sec = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
  let verdict: string;
  let answers: string[] = [];
  if (r.win) verdict = `Victoire en ${sec(r.time)} s, à ${dps} dégâts par seconde.`;
  else if (r.cause === 'timeout') {
    verdict = `Temps écoulé (${sec(limit)} s) : il lui restait ${Math.round(r.enemyHpLeft * 100)} % de ses PV. Il fallait plus de dégâts.`;
    answers = [...answersOf(['windows', 'guard', 'adds', 'regen']), 'Régler ses minuteurs : les grosses compétences au bon moment', 'Un build d’Ouverture, plus de Puissance (Recherches, Lanterne)'];
  } else {
    const top = taken[0];
    const share = top ? Math.round((100 * top.amount) / Math.max(1, taken.reduce((a, x) => a + x.amount, 0))) : 0;
    verdict = `Tombé à ${sec(r.time)} s${top ? ` : ${top.label.toLowerCase()}, ${share} % des dégâts reçus` : ''} ; il lui restait ${Math.round(r.enemyHpLeft * 100)} % de ses PV.`;
    const ids: MechanicId[] = top?.label === 'Attaques chargées' ? ['charge', 'heavy'] : top?.label === 'Aura' ? ['aura'] : top?.label === 'Érosion' ? ['erosion'] : ['heavy', 'adds', 'guard'];
    answers = [...answersOf(ids), 'Plus de PV ou de Défense (équipement, Le Cuir épais, la Lanterne)'];
  }
  return { verdict, dps, dealt, taken, answers: [...new Set(answers)].slice(0, 4) };
}
