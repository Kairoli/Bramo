/**
 * Moteur du combat automatique (dossier « Le cœur du jeu » v0.2, §3 à §7 et §17) : kit de classe seul.
 *
 * - Horloge en millisecondes entières, pas fixe `rules.tick` : résultat identique pour une même graine.
 * - Le serveur et le simulateur appellent la même fonction `fight`.
 * - Équipe de 1 à N combattants (solo = 1) : chaque protection et chaque soin vise **un** bénéficiaire.
 * - Le ralentissement allonge l'intervalle des attaques ordinaires ; les phases (charge, garde, soin) gardent leur horaire.
 * - Les contributions (dégâts, soins utiles, absorptions, atténuation, Pression, Ruptures, dissipations) sont comptées par
 *   combattant, pour reconnaître plus tard le soutien et le contrôle en donjon ou contre un boss mondial.
 * - Outils de situation (dossier PvE v2 §3) : six familles d'effets d'équipement, une variante active par famille et par
 *   porteur ; aucun ne redéclenche une mécanique de classe. Priorité de cible préparée (`targetPriority`).
 * - Danger (`enemyDamageScale`) et fureur s'appliquent une seule fois à toutes les sources : coups, charges, érosion, aura.
 * Pas encore : statistiques issues de l'équipement, effets des anciens ensembles, gemmes de build, nommés, résistances élémentaires (reportées).
 */
import type { ClassKit, CombatContent, CombatPath, Element, Encounter, PlanEntry, Spell, TargetPriority, Tool, ToolFamily } from '../schemas/combat.js';
import { stream } from './rng.js';

const ms = (s: number) => Math.round(s * 1000);

export interface CombatStats {
  power: number;
  maxHp: number;
  damageReduction: number;
  critChance: number;
  critMultiplier: number;
  haste: number;
}

export interface CombatantSetup {
  id: string;
  classId: string;
  /** null avant le niveau de voie. */
  pathId: string | null;
  plan: PlanEntry[];
  weapon: string;
  /** Élément de l'attaque de base du Runiste (sinon : élément le plus fréquent de son plan). */
  basicElement?: Element;
  /** Statistiques ; par défaut `rules.referenceStats`. */
  stats?: Partial<CombatStats>;
  /** Qui reçoit ses protections et soins : lui-même, ou l'allié le plus bas en PV (identique en solo). */
  beneficiary?: 'self' | 'lowest';
  /** PV au début de la rencontre (par défaut le maximum) : les PV se gardent d'une salle de donjon à l'autre. */
  startHp?: number;
  /**
   * Potions de secours (dossier « Activités et artisanat » §21) : une est bue automatiquement sous `below` des PV maximum,
   * rend `heal` des PV maximum, au plus une toutes les `cooldown` secondes, dans la limite de `count`.
   */
  potions?: { count: number; heal: number; below: number; cooldown: number };
  /** Outils de situation portés (ensembles, gemmes, préparation) : par famille, seul le mieux classé agit. */
  tools?: Tool[];
  /** Cible de chaque action : chef (défaut), renforts d'abord, ou chef sans garde d'abord. */
  targetPriority?: TargetPriority;
}

export interface FightOptions {
  seed: number;
  /** Règle d'ouverture (par défaut celle de rules.yaml). */
  opening?: 'independent' | 'sequence';
  /** Multiplie les dégâts ennemis (essais de danger accru). */
  enemyDamageScale?: number;
  /** Multiplie les PV des ennemis (essais de groupe : PV × N). */
  enemyHpScale?: number;
  /** Multiplie la cadence des attaques ordinaires ennemies (essais de groupe). */
  enemyAttackRateScale?: number;
  /** Qui reçoit les attaques ordinaires : le premier combattant (défaut), ou chacun à tour de rôle. */
  targeting?: 'front' | 'rotate';
  /** Garde le journal détaillé du combat. */
  trace?: boolean;
}

/** Ce qu'un combattant a apporté : sert au résultat, au journal et plus tard aux récompenses de groupe. */
export interface Contributions {
  damage: number;
  /** Soins réellement rendus (sans le sursoin). */
  healing: number;
  /** Dégâts absorbés par les boucliers qu'il a posés (sur lui ou sur un allié). */
  absorbed: number;
  /** Dégâts évités par ses Affaiblissements. */
  mitigated: number;
  pressure: number;
  breaks: number;
  dispels: number;
  cleanses: number;
}

export interface CombatantResult {
  id: string;
  alive: boolean;
  hp: number;
  hpRatio: number;
  minHpRatio: number;
  contributions: Contributions;
  /** Compteurs détaillés : dégâts par origine, Braises dépensées, Angles exploités, runes lues… */
  metrics: Record<string, number>;
}

export type DefeatCause = 'death' | 'timeout';

export interface TraceEntry {
  t: number;
  who: string;
  kind: string;
  text: string;
}

export interface FightResult {
  win: boolean;
  /** Durée en secondes. */
  time: number;
  cause: DefeatCause | null;
  /** Dernière source de dégâts reçue par le combattant tombé. */
  killedBy: 'attack' | 'charge' | 'aura' | null;
  /** PV restants des ennemis, en part de leur total (0 si victoire). */
  enemyHpLeft: number;
  team: CombatantResult[];
  trace?: TraceEntry[];
}

interface PlanSlot {
  spell: Spell;
  ready: number;
  opened: boolean;
}

interface Prep {
  kind: 'damage';
  amount: number;
  until: number;
  born: number;
  eligible: 'direct' | 'auto' | 'skill' | 'heat';
}

interface Shield {
  amount: number;
  source: string;
  owner: Combatant;
  primary: boolean;
  end: number;
  riposte: number;
}

interface Dot {
  owner: Combatant;
  type: 'burn' | 'bleed';
  rate: number;
  end: number;
  next: number;
}

interface Weaken {
  amount: number;
  until: number;
  once: boolean;
  by: Combatant;
}

interface Enemy {
  i: number;
  hp: number;
  maxHp: number;
  boss: boolean;
  guard: number;
  guardUntil: number;
  slow: number;
  slowUntil: number;
  stunUntil: number;
  markUntil: number;
  antiheal: number;
  antihealUntil: number;
  weaken: Weaken[];
  vuln: { amount: number; until: number }[];
  dots: Map<string, Dot>;
  stability: number;
  breakUntil: number;
  breakRecover: number;
  nextHit: number;
  countertraps: Map<Combatant, { amount: number; until: number }>;
  /** Renfort (jamais un boss) ; il n'entre en jeu qu'à `arriveAt`. */
  add: boolean;
  arriveAt: number;
  attack: Encounter['attack'];
  /** Attaques ordinaires déjà portées (série de coups lourds) et prochain allié visé (ciblage à tour de rôle). */
  hits: number;
  aim: number;
}

/** État d'un outil de situation : un seul délai et une seule réserve par famille et par porteur. */
interface ToolState<T extends Tool = Tool> {
  tool: T;
  readyAt: number;
  charges: number;
  /** Interstice : cycle de fenêtre de la réserve, réserve par chef, total stocké dans le cycle, cycle déjà restitué. */
  cycle: number;
  bank: Map<number, number>;
  banked: number;
  released: number;
  /** Reprise : réserve et soins rendus récemment (glissant). */
  pool: number;
  healed: { t: number; amount: number }[];
}
type Tools = { [F in ToolFamily]?: ToolState<Extract<Tool, { family: F }>> };
const TOOL_RANK = ['set4', 'gem', 'set3', 'prep', 'set2'] as const;
const NATIVE = new Set(['basic', 'skill', 'class', 'dot']);

interface Combatant {
  setup: CombatantSetup;
  /** PV maximum au début du combat : référence des effets défensifs en part des PV. */
  maxHp0: number;
  tools: Tools;
  /** Réserve personnelle (Repli couvert). */
  cover: { amount: number; end: number } | null;
  kit: ClassKit;
  path: CombatPath | null;
  stats: CombatStats;
  P: number;
  hp: number;
  minHp: number;
  lastHitBy: FightResult['killedBy'];
  rand: () => number;
  plan: PlanSlot[];
  gcdAt: number;
  basicNext: number;
  basicPeriod: number;
  basicCoef: number;
  basicElement: Element;
  target: number;
  action: number;
  preps: Map<string, Prep>;
  counters: Map<string, number>;
  shields: Shield[];
  auraImmuneUntil: number;
  /** Charges d'érosion subies. */
  erosion: number;
  potionsLeft: number;
  potionReadyAt: number;
  heat: number;
  angle: { until: number; target: number } | null;
  orderUntil: number;
  rune: Spell['form'] | null;
  /** Dernières runes écrites (les trois plus récentes). */
  forms: NonNullable<Spell['form']>[];
  runeElement: Element;
  ink: number;
  rebattue: { amount: number; hits: number; until: number };
  contrib: Contributions;
  m: Record<string, number>;
}

const emptyContrib = (): Contributions => ({ damage: 0, healing: 0, absorbed: 0, mitigated: 0, pressure: 0, breaks: 0, dispels: 0, cleanses: 0 });
const ELEMENT_LABEL: Record<Element, string> = { physical: 'Physique', fire: 'Feu', frost: 'Givre', lightning: 'Foudre' };
const RUNE_LABEL = { trait: 'Trait', circle: 'Cercle', seal: 'Sceau' } as const;

/** Résout une rencontre complète. Fonction pure : même contenu, même équipe, même graine → même résultat. */
export function fight(combat: CombatContent, setups: CombatantSetup[], encounter: Encounter, options: FightOptions): FightResult {
  const R = combat.rules;
  const tick = ms(R.tick);
  const limit = ms(R.fightLimit);
  const opening = options.opening ?? R.opening;
  const enemyScale = options.enemyDamageScale ?? 1;
  const enemyRand = stream(options.seed, 'enemy');
  const trace: TraceEntry[] | undefined = options.trace ? [] : undefined;
  let t = 0;

  const log = (who: Combatant | null, kind: string, text: string) => {
    if (trace) trace.push({ t: t / 1000, who: who?.setup.id ?? 'ennemi', kind, text });
  };
  const inc = (c: Combatant, key: string, n = 1) => {
    c.m[key] = (c.m[key] ?? 0) + n;
  };

  // --- Mise en place -------------------------------------------------------------------------------------------
  const team: Combatant[] = setups.map((s) => {
    const kit = combat.kits[s.classId];
    if (!kit) throw new Error(`classe sans kit : ${s.classId}`);
    const path = s.pathId ? (combat.paths[s.pathId] ?? null) : null;
    const stats = { ...R.referenceStats, ...s.stats };
    const plan = s.plan.map((e) => {
      const spell = combat.spells[e.spell];
      if (!spell) throw new Error(`sort inconnu : ${e.spell}`);
      return { spell, ready: ms(e.at), opened: false };
    });
    const period = R.weaponPeriods[s.weapon] ?? R.basicAttack.referencePeriod;
    const counts = new Map<Element, number>();
    for (const p of plan) if (p.spell.element !== 'inherit') counts.set(p.spell.element, (counts.get(p.spell.element) ?? 0) + 1);
    const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'physical';
    const tools: Record<string, ToolState> = {};
    for (const tool of s.tools ?? []) {
      const cur = tools[tool.family];
      if (cur && TOOL_RANK.indexOf(cur.tool.rank) <= TOOL_RANK.indexOf(tool.rank)) continue;
      const charges = tool.family === 'rain' ? (tool.charges ?? Infinity) : Infinity;
      tools[tool.family] = { tool, readyAt: 0, charges, cycle: -1, bank: new Map(), banked: 0, released: -1, pool: 0, healed: [] };
    }
    return {
      setup: s,
      maxHp0: stats.maxHp,
      tools: tools as Tools,
      cover: null,
      kit,
      path,
      stats,
      P: stats.power,
      hp: Math.min(stats.maxHp, s.startHp ?? stats.maxHp),
      minHp: Math.min(stats.maxHp, s.startHp ?? stats.maxHp),
      lastHitBy: null,
      rand: stream(options.seed, `crit:${s.id}`),
      plan,
      gcdAt: 0,
      basicNext: ms(R.firstBasicAt),
      basicPeriod: ms(period / (1 + stats.haste)),
      basicCoef: (R.basicAttack.coefficient * period) / R.basicAttack.referencePeriod,
      basicElement: kit.mechanic === 'rune' ? (s.basicElement ?? dominant) : 'physical',
      target: 0,
      action: 0,
      preps: new Map(),
      counters: new Map(),
      shields: [],
      auraImmuneUntil: -1,
      erosion: 0,
      potionsLeft: s.potions?.count ?? 0,
      potionReadyAt: 0,
      heat: 0,
      angle: null,
      orderUntil: -1,
      rune: null,
      forms: [],
      runeElement: 'lightning',
      ink: 0,
      rebattue: { amount: 0, hits: 0, until: -1 },
      contrib: emptyContrib(),
      m: {},
    };
  });
  const hpScale = options.enemyHpScale ?? 1;
  const rateScale = options.enemyAttackRateScale ?? 1;
  const targeting = options.targeting ?? 'front';
  const groups = [
    { count: encounter.enemies, hp: encounter.hp, attack: encounter.attack, add: false, arrive: 0 },
    ...(encounter.adds ?? []).map((a) => ({ count: a.count, hp: a.hp, attack: a.attack, add: true, arrive: a.arrive })),
  ];
  const roster = groups.flatMap((g) => Array.from({ length: g.count }, () => g));
  const enemies: Enemy[] = roster.map((g, i) => ({
    i,
    hp: g.hp * hpScale,
    maxHp: g.hp * hpScale,
    boss: !g.add && encounter.enemies === 1,
    add: g.add,
    arriveAt: ms(g.arrive),
    attack: g.attack,
    hits: 0,
    aim: 0,
    guard: 0,
    guardUntil: 0,
    slow: 0,
    slowUntil: 0,
    stunUntil: 0,
    markUntil: 0,
    antiheal: 0,
    antihealUntil: 0,
    weaken: [],
    vuln: [],
    dots: new Map(),
    stability: !g.add && encounter.enemies === 1 ? R.stability.max : (R.stability.ordinaryMax ?? R.stability.max),
    breakUntil: -1,
    breakRecover: -1,
    nextHit: ms(g.arrive + R.enemy.firstAttackAt + i * R.enemy.attackStagger),
    countertraps: new Map(),
  }));

  /** Ennemis présents et debout (un renfort n'est là qu'à son heure d'arrivée). */
  const aliveEnemies = () => enemies.filter((e) => e.hp > 0 && e.arriveAt <= t);
  /** La rencontre se gagne quand le groupe principal est vaincu : un renfort ne rend jamais le chef invulnérable. */
  const chiefsAlive = () => enemies.some((e) => !e.add && e.hp > 0);
  let regenUses = 0;
  let guardTurn = 0;
  const aliveTeam = () => team.filter((c) => c.hp > 0);
  const param = (c: Combatant, key: string) => c.path?.params[key] ?? 0;
  const kp = (c: Combatant, key: string) => c.kit.params[key] ?? 0;

  /** Ordre des cibles selon la priorité préparée (puis l'ordre d'apparition) ; un renfort à venir n'est jamais choisi. */
  const ranked = (c: Combatant): Enemy[] => {
    const alive = aliveEnemies();
    const pr = c.setup.targetPriority ?? 'chief';
    if (pr === 'adds_first') return [...alive].sort((a, b) => Number(b.add) - Number(a.add) || (a.add ? a.arriveAt - b.arriveAt : 0) || a.i - b.i);
    if (pr === 'unguarded_first') return [...alive].sort((a, b) => Number(a.add) - Number(b.add) || a.guard - b.guard || a.i - b.i);
    return alive;
  };
  /**
   * Cible courante, réévaluée à chaque action ; avec la priorité `chief`, on garde sa cible jusqu'à sa mort.
   * À la mort de la Proie, un Angle non consommé la suit pour `carryOnKill` s au plus ; changer volontairement de cible
   * le laisse sur l'ancienne (aucun Angle transporté gratuitement).
   */
  const current = (c: Combatant): Enemy => {
    const old = enemies[c.target]!;
    const prioritized = (c.setup.targetPriority ?? 'chief') !== 'chief';
    if (old.hp > 0 && !prioritized) return old;
    const alive = ranked(c);
    if (!alive.length) return old;
    if (old.hp > 0 && alive[0]!.i === old.i) return old;
    c.target = alive[0]!.i;
    if (old.hp > 0) return enemies[c.target]!;
    if (c.kit.mechanic === 'angle' && c.angle && c.angle.until > t && c.angle.target === old.i) {
      c.angle = { until: Math.min(c.angle.until, t + ms(kp(c, 'carryOnKill'))), target: c.target };
    }
    return enemies[c.target]!;
  };
  const beneficiary = (c: Combatant): Combatant => {
    if (c.setup.beneficiary !== 'lowest') return c;
    const alive = aliveTeam();
    return alive.reduce((a, b) => (b.hp / b.stats.maxHp < a.hp / a.stats.maxHp ? b : a), c.hp > 0 ? c : alive[0]!);
  };
  /** Compteur « toutes les N fois » : vrai quand il atteint son seuil (puis repart de zéro). */
  const counter = (c: Combatant, key: string, threshold: number) => {
    const n = Math.min(threshold, (c.counters.get(key) ?? 0) + 1);
    c.counters.set(key, n);
    if (n >= threshold) {
      c.counters.set(key, 0);
      return true;
    }
    return false;
  };
  const prepare = (c: Combatant, key: string, amount: number, duration: number, eligible: Prep['eligible']) => {
    // Une préparation de même nom remplace la précédente (Assise du dossier §5).
    c.preps.set(key, { kind: 'damage', amount, until: t + ms(duration), born: c.action, eligible });
  };

  // --- Effets élémentaires --------------------------------------------------------------------------------------
  const windowPeriod = encounter.windows ? ms(encounter.windows.period) : 0;
  const windowClosed = () => !!encounter.windows && t % windowPeriod < windowPeriod - ms(encounter.windows.open);
  /** Réserve Interstice du porteur pour le cycle de fenêtre en cours (elle expire à la fin de l'ouverture). */
  const intersticeOf = (c: Combatant) => {
    const s = c.tools.interstice;
    if (!s || !windowPeriod) return undefined;
    const cycle = Math.floor(t / windowPeriod);
    if (s.cycle !== cycle) {
      s.cycle = cycle;
      s.bank.clear();
      s.banked = 0;
    }
    return s;
  };
  /**
   * Dégâts sortants. Origines natives : `basic`, `skill`, `class`, `dot` ; `window_release` (restitution Interstice) est un
   * montant déjà calculé : ni défense, ni critique, ni vulnérabilité, ni fenêtre, ni bonus d'outil.
   */
  const damage = (c: Combatant, e: Enemy, amount: number, origin: string, element: Element, crit = false, penetration = 0): number => {
    if (e.hp <= 0 || amount <= 0) return 0;
    const native = NATIVE.has(origin);
    let x = amount;
    if (native) {
      let mult = 1 - R.enemy.defense * (1 - Math.min(1, penetration));
      if (crit) mult *= c.stats.critMultiplier;
      let vuln = 0;
      for (const v of e.vuln) if (v.until > t) vuln = Math.max(vuln, v.amount);
      if (e.breakUntil > t) vuln = Math.max(vuln, R.stability.breakDamageTaken);
      x = amount * mult * (1 + Math.min(R.caps.vulnerability, vuln));
      // Battue : dégâts natifs accrus contre un renfort présent, tant qu'un chef est debout ; jamais contre le chef.
      const beat = c.tools.beat;
      if (beat && e.add && chiefsAlive()) {
        inc(c, 'beatBonus', Math.min(e.hp + e.guard, x * beat.tool.multiplier) - Math.min(e.hp + e.guard, x));
        x *= beat.tool.multiplier;
      }
      // Fenêtres : hors des secondes ouvertes de chaque période, le groupe principal subit moins de dégâts.
      if (!e.add && windowClosed()) {
        const before = x;
        x *= 1 - encounter.windows!.closedReduction;
        // Interstice : une part de la perte réellement imputable à la fenêtre (sans sur-dégât) est mise en réserve.
        const s = intersticeOf(c);
        if (s) {
          const capacity = e.hp + e.guard;
          const loss = Math.max(0, Math.min(before, capacity) - Math.min(x, capacity));
          const add = Math.min(loss * s.tool.store, Math.max(0, s.tool.bankCap * c.P - s.banked));
          if (add > 0) {
            s.banked += add;
            s.bank.set(e.i, (s.bank.get(e.i) ?? 0) + add);
            inc(c, 'bankedDamage', add);
          }
        }
      }
    }
    // Garde ; Fracture multiplie seulement ce qui frappe la garde, le supplément ne déborde jamais sur les PV.
    const g = Math.min(e.guard, x);
    e.guard -= g;
    const fracture = native ? c.tools.fracture : undefined;
    if (fracture && g > 0 && e.guard > 0) {
      const extra = Math.min(e.guard, g * (fracture.tool.multiplier - 1));
      e.guard -= extra;
      inc(c, 'guardDamageBonus', extra);
    }
    x -= g;
    const dealt = Math.min(e.hp, x);
    e.hp -= dealt;
    c.contrib.damage += dealt;
    inc(c, `damage:${origin}`, dealt);
    inc(c, `element:${element}`, dealt);
    if (g) inc(c, 'guardDamage', g);
    if (e.hp <= 0) {
      inc(c, 'kills');
      log(c, 'kill', `ennemi ${e.i + 1} vaincu`);
    }
    return dealt + g;
  };
  const dot = (c: Combatant, e: Enemy, key: string, amount: number, type: Dot['type'], duration: number) => {
    if (e.hp <= 0 || amount <= 0) return;
    const full = `${c.setup.id}:${key}`;
    const d: Dot = { owner: c, type, rate: (amount * c.P) / duration, end: t + ms(duration), next: t + ms(R.dotTick) };
    const same = [...e.dots.entries()].filter(([k, x]) => x.owner === c && x.type === type && k !== full);
    if (same.length >= R.caps.afflictionsPerType) {
      const weakest = same.reduce((a, b) => (b[1].rate < a[1].rate ? b : a));
      if (weakest[1].rate > d.rate) return;
      e.dots.delete(weakest[0]);
    }
    e.dots.set(full, d);
  };
  /** Puissance de soutien (paramètre de voie `supportPower`) : multiplie les soins et protections produits. */
  const supportPower = (c: Combatant) => 1 + param(c, 'supportPower');
  const heal = (c: Combatant, target: Combatant, amount: number): number => {
    if (target.hp <= 0) return 0;
    amount *= supportPower(c);
    inc(c, 'healRequested', amount);
    const eff = Math.min(target.stats.maxHp - target.hp, amount);
    target.hp += eff;
    c.contrib.healing += eff;
    // Aide apportée aux alliés (et non à soi) : ce qui distingue un soutien de groupe.
    if (target !== c) inc(c, 'healingAllies', eff);
    return eff;
  };
  const shield = (c: Combatant, target: Combatant, amount: number, source: string, primary: boolean, duration: number, riposte = 0): number => {
    if (target.hp <= 0) return 0;
    amount *= supportPower(c);
    const key = `${c.setup.id}:${source}`;
    target.shields = target.shields.filter((s) => s.source !== key);
    if (!primary) {
      const sec = target.shields.filter((s) => !s.primary).reduce((a, s) => a + s.amount, 0);
      amount = Math.min(amount, Math.max(0, R.caps.secondaryShield * c.P - sec));
    }
    const total = target.shields.reduce((a, s) => a + s.amount, 0);
    amount = Math.min(amount, Math.max(0, R.caps.totalShield * c.P - total));
    if (amount <= 0) return 0;
    target.shields.push({ amount, source: key, owner: c, primary, end: t + ms(duration), riposte });
    inc(c, 'shieldProduced', amount);
    return amount;
  };
  const weaken = (c: Combatant, e: Enemy, amount: number, duration: number, once: boolean) => {
    e.weaken.push({ amount, until: t + ms(duration), once, by: c });
  };
  /** Retire de la Stabilité ; à zéro, Rupture. Pendant la récupération, la Pression ne prend pas. */
  const pressure = (c: Combatant, e: Enemy, amount: number): boolean => {
    if (amount <= 0 || e.hp <= 0 || e.breakRecover > t) return false;
    const loss = Math.min(e.stability, amount);
    e.stability -= loss;
    c.contrib.pressure += loss;
    if (e.stability <= 0) {
      e.stability = e.boss ? R.stability.max : (R.stability.ordinaryMax ?? R.stability.max);
      // Un ennemi ordinaire peut être brièvement étourdi par sa Rupture ; un boss jamais.
      if (!e.boss && R.stability.ordinaryBreakStun) e.stunUntil = Math.max(e.stunUntil, t + ms(R.stability.ordinaryBreakStun));
      e.breakUntil = t + ms(R.stability.breakDuration);
      e.breakRecover = t + ms(R.stability.recovery);
      weaken(c, e, R.stability.breakNextHitReduction, R.stability.breakDuration, true);
      c.contrib.breaks++;
      log(c, 'break', `Rupture de l'ennemi ${e.i + 1}`);
    }
    return loss > 0;
  };
  /**
   * Ralentit les attaques ordinaires (plafond pour un boss). Vrai si le ralentissement est posé.
   * Une voie peut renforcer ses ralentissements : `slowAmount` (en plus) et `slowDuration` (multiplicateur).
   * Paramètre de voie `weakenAll` : l'Affaiblissement de son passif vaut pour toutes les attaques de la cible pendant sa durée,
   * au lieu de la prochaine seulement.
   */
  const slow = (c: Combatant, e: Enemy, amount: number, duration: number): boolean => {
    amount += param(c, 'slowAmount');
    duration *= c.path?.params.slowDuration ?? 1;
    if (e.boss) amount = Math.min(R.caps.bossSlow, amount);
    if (e.slowUntil <= t || amount >= e.slow) {
      e.slow = amount;
      e.slowUntil = t + ms(duration);
      return true;
    }
    return false;
  };

  /** Effet de la rune lue par un sort du Runiste. Vrai si le Cercle a ralenti. */
  const runeEffect = (c: Combatant, rune: Spell['form'] | null, e: Enemy): boolean => {
    if (!rune) return false;
    inc(c, 'runesRead');
    if (rune === 'trait') damage(c, e, kp(c, 'trait') * c.P, 'class', c.runeElement);
    else if (rune === 'circle') {
      for (const x of aliveEnemies().slice(0, kp(c, 'circleTargets'))) damage(c, x, kp(c, 'circle') * c.P, 'class', c.runeElement);
      if (e.hp > 0) return slow(c, e, kp(c, 'circleSlow'), kp(c, 'circleSlowDuration'));
    } else shield(c, beneficiary(c), kp(c, 'seal') * c.P, 'native_rune', true, kp(c, 'sealDuration'));
    return false;
  };

  const consumePreps = (c: Combatant, spell: Spell | null, e: Enemy) => {
    for (const [key, p] of [...c.preps]) {
      if (p.until <= t) {
        c.preps.delete(key);
        continue;
      }
      // Une préparation acquise pendant cette action attend la suivante.
      if (p.born >= c.action) continue;
      const ok = p.eligible === 'direct' || (p.eligible === 'auto' && !spell) || (p.eligible === 'skill' && !!spell) || (p.eligible === 'heat' && !!spell?.tags.includes('heat'));
      if (!ok) continue;
      c.preps.delete(key);
      damage(c, e, p.amount, 'class', spell ? elementOf(c, spell) : c.basicElement);
      inc(c, `prep:${key}`);
    }
  };
  const elementOf = (c: Combatant, s: Spell): Element => (s.element === 'inherit' ? c.runeElement : s.element);
  /** Interstice : la première attaque de base ou le premier sort qui touche un chef dans la fenêtre ouverte rend sa réserve. */
  const release = (c: Combatant, e: Enemy, element: Element) => {
    const s = intersticeOf(c);
    if (!s || e.add || e.hp <= 0 || windowClosed() || s.released === s.cycle) return;
    const amount = s.bank.get(e.i) ?? 0;
    if (amount <= 0) return;
    s.released = s.cycle;
    s.bank.delete(e.i);
    inc(c, 'releasedDamage', amount);
    damage(c, e, amount, 'window_release', element);
  };

  // --- Une action : attaque de base (spell = null) ou compétence -----------------------------------------------
  const cast = (c: Combatant, spell: Spell | null) => {
    if (!aliveEnemies().length) return;
    c.action++;
    const e = current(c);
    const basic = !spell;
    const element = spell ? elementOf(c, spell) : c.basicElement;
    const tags = spell?.tags ?? [];
    const oldRune = c.rune;
    const oldOrder = c.orderUntil > t;
    const oldAngle = !!c.angle && c.angle.until > t && c.angle.target === e.i;
    const crit = c.rand() < Math.min(R.caps.critChance, c.stats.critChance);
    consumePreps(c, spell, e);
    let coefficient = spell?.damage ?? c.basicCoef;
    let bonus = 0;
    let control = false;
    let consumedAngle = false;
    const notes: string[] = [];

    if (spell) {
      inc(c, 'skillCasts');
      // Forgefeu : une Trempe dépense toutes les Braises.
      if (tags.includes('temper')) {
        const heat = c.heat;
        c.heat = 0;
        bonus += kp(c, 'temperPerHeat') * heat;
        inc(c, 'heatSpent', heat);
        if (heat) notes.push(`${heat} Braise${heat > 1 ? 's' : ''} dépensée${heat > 1 ? 's' : ''}`);
        const id = c.path?.id;
        if (id === 'red_temper') c.rebattue = { amount: param(c, 'perHeat') * c.P * heat, hits: param(c, 'hits'), until: t + ms(param(c, 'duration')) };
        else if (id === 'anvil' && heat) {
          control = pressure(c, e, param(c, 'pressurePerHeat') * heat) || control;
          weaken(c, e, param(c, 'weakenPerHeat') * heat, param(c, 'weakenDuration'), !param(c, 'weakenAll'));
          prepare(c, 'assise', param(c, 'followupPerHeat') * heat * c.P, param(c, 'followupDuration'), 'heat');
        } else if (id === 'whetter' && heat) {
          shield(c, beneficiary(c), param(c, 'shieldPerHeat') * heat * c.P, 'plate', false, param(c, 'duration'), param(c, 'ripostePerHeat') * heat * c.P);
        }
      }
      // Traqueur : une Poursuite exploite l'Angle ouvert sur sa Proie.
      if (tags.includes('exploit') && oldAngle) {
        c.angle = null;
        consumedAngle = true;
        bonus += kp(c, 'bonus');
        inc(c, 'anglesConsumed');
        notes.push('Angle exploité');
        const id = c.path?.id;
        if (id === 'beastslayer') dot(c, e, 'morsure', param(c, 'bleed'), 'bleed', param(c, 'duration'));
        else if (id === 'trapper') {
          weaken(c, e, param(c, 'weaken'), param(c, 'duration'), !param(c, 'weakenAll'));
          e.countertraps.set(c, { amount: param(c, 'damage') * c.P, until: t + ms(param(c, 'duration')) });
          control = pressure(c, e, param(c, 'pressure')) || control;
        } else if (id === 'packleader') c.orderUntil = t + ms(param(c, 'duration'));
      }
      // Runiste : lire la rune précédente.
      if (c.kit.mechanic === 'rune') {
        if (oldRune) notes.push(`rune ${RUNE_LABEL[oldRune]} lue`);
        const slowed = runeEffect(c, oldRune, e);
        if (oldRune === 'circle') control = slowed || control;
        const id = c.path?.id;
        if (id === 'glyphkeeper' && (spell.form === 'trait' || spell.form === 'circle') && c.ink > 0) {
          bonus += c.ink / c.P;
          inc(c, 'inkSpent', c.ink);
          c.ink = 0;
        }
        if (id === 'fulgurant' && counter(c, 'last_word', param(c, 'every'))) {
          let extra = param(c, 'damage') * c.P;
          // Phrase complète : les deux runes écrites avant et celle de ce sort sont toutes différentes.
          const phrase = [...c.forms.slice(-2), spell.form];
          if (param(c, 'fullPhrase') && phrase.length === 3 && new Set(phrase).size === 3) {
            extra += param(c, 'fullPhrase') * c.P;
            inc(c, 'fullPhrases');
          }
          if (oldRune === 'seal') {
            extra -= param(c, 'sealShare') * c.P;
            shield(c, beneficiary(c), param(c, 'sealShare') * c.P, 'last_word', false, 6);
          }
          const other = aliveEnemies().find((x) => x.i !== e.i);
          if (oldRune === 'circle' && other) {
            damage(c, other, extra / 2, 'class', element);
            extra /= 2;
          }
          damage(c, e, extra, 'class', element);
          inc(c, 'lastWords');
        }
      }
      // Meneur de meute : l'Ordre déjà prêt renforce la prochaine compétence de compagnon.
      if (tags.includes('companion') && c.path?.id === 'packleader' && oldOrder) {
        c.orderUntil = consumedAngle ? t + ms(param(c, 'duration')) : -1;
        bonus += param(c, 'damage');
        heal(c, beneficiary(c), param(c, 'heal') * c.P);
        inc(c, 'packOrders');
      }
    } else {
      inc(c, 'basicAttacks');
      if (c.rebattue.hits > 0 && c.rebattue.until > t) {
        coefficient += c.rebattue.amount / c.P;
        c.rebattue.hits--;
        inc(c, 'rebattueHits');
      }
    }

    const targets = [e, ...ranked(c).filter((x) => x.i !== e.i)].slice(0, spell?.targets ?? 1);
    targets.forEach((x, i) => {
      const impact = coefficient * (i === 0 ? 1 : R.secondaryShare) + (i === 0 ? bonus : 0);
      damage(c, x, impact * c.P, basic ? 'basic' : 'skill', element, crit, spell?.penetration ?? 0);
      if (spell?.dot) dot(c, x, `spell:${spell.id}`, spell.dot.amount * (i === 0 ? 1 : R.secondaryShare), spell.dot.type, spell.dot.duration);
    });
    if (c.tools.interstice) for (const x of targets) release(c, x, element);

    if (spell) {
      const who = beneficiary(c);
      if (spell.heal) heal(c, who, spell.heal * c.P);
      if (spell.shield) shield(c, who, spell.shield * c.P, `spell:${spell.id}`, true, spell.duration ?? 6);
      // Repli couvert : réserve personnelle en part des PV maximum de début de combat ; remplace la précédente.
      if (spell.selfPool) {
        c.cover = { amount: spell.selfPool.maxHpFraction * c.maxHp0, end: t + ms(spell.selfPool.duration) };
        inc(c, 'coverGranted', c.cover.amount);
      }
      for (const v of targets) {
        if (v.hp <= 0) continue;
        if (spell.slow) control = slow(c, v, spell.slow, spell.duration ?? 4) || control;
        if (spell.stun) {
          if (v.boss) control = pressure(c, v, spell.stun * R.stability.stunPressurePerSecond) || control;
          else {
            v.stunUntil = t + ms(Math.min(R.caps.hardControl, spell.stun));
            control = true;
          }
        }
        if (spell.pressure) control = pressure(c, v, spell.pressure) || control;
        if (spell.mark) v.markUntil = Math.max(v.markUntil, t + ms(spell.mark));
        if (spell.weaken) weaken(c, v, spell.weaken, spell.duration ?? 6, false);
        if (spell.antiheal) {
          v.antiheal = spell.antiheal;
          v.antihealUntil = t + ms(spell.duration ?? 6);
        }
        if (spell.dispel && v.guard > 0) {
          v.guard = 0;
          c.contrib.dispels++;
          notes.push('garde dissipée');
        }
      }
      if (spell.cleanse && encounter.aura && t > 0 && who.auraImmuneUntil <= t) {
        who.auraImmuneUntil = t + ms(R.cleanse.auraImmunity);
        c.contrib.cleanses++;
      }
      if (spell.cleanse && who.erosion > 0) {
        who.erosion = 0;
        c.contrib.cleanses++;
        notes.push('érosion purifiée');
      }
      if (spell.empowerAuto) prepare(c, 'auto', spell.empowerAuto * c.P, 8, 'auto');
      if (c.kit.mechanic === 'heat' && spell.heat) c.heat = Math.min(kp(c, 'cap'), c.heat + spell.heat);
      if (c.kit.mechanic === 'angle' && tags.includes('setup')) c.angle = { until: t + ms(kp(c, 'duration')), target: e.i };
      if (c.kit.mechanic === 'rune') {
        c.rune = spell.form ?? null;
        if (spell.form) c.forms = [...c.forms.slice(-2), spell.form];
        c.runeElement = element;
      }
      // Sigillaire : une action de classe qui contrôle réellement pose un Scellé ; à trois, Interdit.
      if (c.path?.id === 'sigilbinder' && control && counter(c, 'seals', param(c, 'seals'))) {
        damage(c, e, param(c, 'damage') * c.P, 'class', element);
        weaken(c, e, param(c, 'weaken'), param(c, 'duration'), !param(c, 'weakenAll'));
        if (param(c, 'vulnerability')) e.vuln.push({ amount: param(c, 'vulnerability'), until: t + ms(param(c, 'duration')) });
        inc(c, 'interdicts');
        notes.push('Interdit');
      }
      if (control) inc(c, 'controlActions');
      log(c, 'cast', `${spell.name} (${ELEMENT_LABEL[element]})${notes.length ? ` : ${notes.join(', ')}` : ''}`);
    }
    c.minHp = Math.min(c.minHp, c.hp);
  };

  // --- Coups reçus ------------------------------------------------------------------------------------------------
  /** Allié visé : le premier (défaut), ou chacun à tour de rôle (essais de groupe). */
  const targetOf = (e: Enemy): Combatant | undefined => {
    const alive = aliveTeam();
    if (!alive.length) return undefined;
    return targeting === 'rotate' ? alive[e.aim++ % alive.length] : alive[0];
  };
  const hasHeavy = !!encounter.charge || roster.some((g) => g.attack.heavyEvery);
  const keepForHeavy = R.enemy.onceWeakenTarget === 'heavy' && hasHeavy;
  /**
   * Danger × fureur, appliqués une seule fois à chaque source entrante (coups, charges, érosion, aura). Fureur : au-delà du
   * temps prévu, chaque seconde de plus ajoute `perSecond` (linéaire).
   */
  const threat = () => enemyScale * (encounter.enrage && t > ms(encounter.enrage.after) ? 1 + encounter.enrage.perSecond * ((t - ms(encounter.enrage.after)) / 1000) : 1);
  const incoming = (e: Enemy, raw: number, source: 'attack' | 'charge', heavy = false) => {
    const c = targetOf(e);
    if (!c) return;
    raw *= threat();
    log(null, source, `${source === 'charge' ? 'attaque chargée' : 'attaque'} de l'ennemi ${e.i + 1} sur ${c.setup.id}`);
    const active = e.weaken.filter((w) => w.until > t);
    // Un affaiblissement « une attaque » peut être gardé pour le coup qui compte (attaque lourde ou chargée).
    const usable = keepForHeavy && !heavy ? active.filter((w) => !w.once) : active;
    const strongest = usable.reduce<Weaken | null>((a, w) => (!a || w.amount > a.amount ? w : a), null);
    e.weaken = keepForHeavy && !heavy ? active : active.filter((w) => !w.once);
    const before = raw * (1 - c.stats.damageReduction);
    let amount = before * (1 - (strongest?.amount ?? 0));
    if (strongest) {
      strongest.by.contrib.mitigated += before - amount;
      if (strongest.by !== c) inc(strongest.by, 'mitigatedAllies', before - amount);
    }
    // Impact : atténue un coup lourd ou une charge (part du coup, plafonnée en part des PV maximum), avant les boucliers.
    const impact = c.tools.impact;
    if (heavy && impact && amount > 0 && t >= impact.readyAt) {
      const avoided = Math.min(amount * impact.tool.incoming, c.maxHp0 * impact.tool.maxHp);
      amount -= avoided;
      impact.readyAt = t + ms(impact.tool.cooldown);
      inc(c, 'impactAvoided', avoided);
    }
    for (const sh of [...c.shields].sort((a, b) => a.end - b.end)) {
      if (amount <= 0) break;
      const take = Math.min(sh.amount, amount);
      sh.amount -= take;
      amount -= take;
      if (take > 0) {
        sh.owner.contrib.absorbed += take;
        if (sh.owner !== c) inc(sh.owner, 'absorbedAllies', take);
        if (sh.primary && sh.owner.path?.id === 'glyphkeeper') sh.owner.ink = Math.min(param(sh.owner, 'cap') * sh.owner.P, sh.owner.ink + take);
        if (sh.riposte) {
          damage(sh.owner, e, sh.riposte, 'class', 'physical');
          sh.riposte = 0;
          inc(sh.owner, 'ripostes');
        }
      }
      if (sh.amount <= 1e-8) c.shields = c.shields.filter((s) => s !== sh);
    }
    if (amount > 0 && c.cover && c.cover.end > t) {
      const take = Math.min(c.cover.amount, amount);
      c.cover.amount -= take;
      amount -= take;
      inc(c, 'coverAbsorbed', take);
      if (c.cover.amount <= 1e-8) c.cover = null;
    }
    if (amount > 0) {
      c.hp -= amount;
      c.lastHitBy = source;
      inc(c, 'hpLost', amount);
    }
    for (const [owner, trap] of e.countertraps) {
      if (trap.until > t) {
        damage(owner, e, trap.amount, 'class', 'physical');
        inc(owner, 'countertraps');
      }
      e.countertraps.delete(owner);
    }
    c.minHp = Math.min(c.minHp, c.hp);
  };
  const crossed = (period: number) => t > 0 && Math.floor(t / period) > Math.floor((t - tick) / period);

  // --- Boucle -----------------------------------------------------------------------------------------------------
  while (t <= limit && aliveTeam().length && chiefsAlive()) {
    for (const c of team) c.shields = c.shields.filter((s) => s.end > t);
    for (const e of aliveEnemies()) {
      if (e.guardUntil <= t) e.guard = 0;
      for (const [key, d] of [...e.dots]) {
        while (d.next <= t && d.next <= d.end && e.hp > 0) {
          d.next += ms(R.dotTick);
          damage(d.owner, e, d.rate, 'dot', d.type === 'burn' ? 'fire' : 'physical');
        }
        if (d.end <= t) {
          const fraction = Math.max(0, Math.min(1, (d.end - (d.next - ms(R.dotTick))) / ms(R.dotTick)));
          if (fraction && e.hp > 0) damage(d.owner, e, d.rate * fraction, 'dot', d.type === 'burn' ? 'fire' : 'physical');
          e.dots.delete(key);
        }
      }
    }
    if (!chiefsAlive()) break;

    for (const c of team) {
      if (c.hp <= 0) continue;
      if (t >= c.basicNext) {
        cast(c, null);
        c.basicNext = t + c.basicPeriod;
      }
      if (aliveEnemies().length && t >= c.gcdAt) {
        const openingDone = c.plan.every((p) => p.opened);
        const eligible = c.plan.filter((p) => p.ready <= t && (opening === 'independent' || openingDone || !p.opened));
        if (eligible.length) {
          const slot = eligible.reduce((a, b) => (b.ready < a.ready || (b.ready === a.ready && c.plan.indexOf(b) < c.plan.indexOf(a)) ? b : a));
          cast(c, slot.spell);
          slot.opened = true;
          slot.ready = t + ms(slot.spell.cooldown / (1 + c.stats.haste));
          c.gcdAt = t + ms(R.gcd);
        }
      }
    }

    for (const e of aliveEnemies()) {
      if (t >= e.nextHit) {
        if (e.stunUntil > t) e.nextHit = e.stunUntil;
        else {
          const spread = 1 - R.enemy.damageSpread / 2 + R.enemy.damageSpread * enemyRand();
          e.hits++;
          const heavy = e.attack.heavyEvery && e.hits % e.attack.heavyEvery === 0 ? (e.attack.heavyMultiplier ?? 1) : 1;
          incoming(e, e.attack.damage * spread * heavy, 'attack', heavy > 1);
          const s = e.slowUntil > t ? e.slow : 0;
          e.nextHit = t + ms(e.attack.period / rateScale / (1 - s));
        }
      }
      // Phases à horaire fixe : jamais décalées par un ralentissement. Elles concernent le groupe principal.
      if (!e.add && encounter.charge && crossed(ms(encounter.charge.period))) incoming(e, encounter.charge.damage, 'charge', true);
    }
    const chiefs = aliveEnemies().filter((e) => !e.add);
    if (encounter.guard && crossed(ms(encounter.guard.period)) && chiefs.length) {
      const g = encounter.guard;
      const boost = g.boostedByAdds && aliveEnemies().some((e) => e.add) ? g.boostedByAdds : 1;
      const on = g.on === 'alternate' ? [chiefs[guardTurn++ % chiefs.length]!] : chiefs;
      for (const e of on) {
        e.guard = g.amount * hpScale * boost;
        e.guardUntil = t + ms(g.duration);
      }
      log(null, 'guard', 'garde levée');
    }
    if (encounter.regen && crossed(ms(encounter.regen.period)) && chiefs.length && (!encounter.regen.uses || regenUses < encounter.regen.uses) && (!encounter.regen.requiresAdds || aliveEnemies().some((e) => e.add))) {
      regenUses++;
      for (const e of chiefs) {
        const anti = e.antihealUntil > t ? e.antiheal : 0;
        e.hp = Math.min(e.maxHp, e.hp + encounter.regen.amount * hpScale * (1 - anti));
      }
      log(null, 'regen', 'soin ennemi');
    }
    // Érosion : une charge de plus à chaque période ; chaque charge inflige ses dégâts chaque seconde, sans défense.
    if (encounter.erosion && chiefs.length) {
      if (crossed(ms(encounter.erosion.period))) {
        for (const c of aliveTeam()) {
          c.erosion = Math.min(encounter.erosion.maxStacks, c.erosion + 1);
          // Pluie : à partir de quelques charges, en retire avec un délai ; l'érosion recommence à monter ensuite.
          const rain = c.tools.rain;
          if (rain && c.erosion >= rain.tool.atLeast && t >= rain.readyAt && rain.charges > 0) {
            const removed = Math.min(rain.tool.remove, c.erosion);
            c.erosion -= removed;
            rain.readyAt = t + ms(rain.tool.cooldown);
            rain.charges--;
            inc(c, 'erosionRemoved', removed);
          }
        }
      }
      if (crossed(1000)) {
        for (const c of aliveTeam()) {
          if (!c.erosion) continue;
          const d = c.erosion * encounter.erosion.damage * threat();
          c.hp -= d;
          c.lastHitBy = 'aura';
          inc(c, 'erosionDamage', d);
          c.minHp = Math.min(c.minHp, c.hp);
        }
      }
    }
    if (encounter.aura && chiefsAlive() && crossed(1000)) {
      for (const c of aliveTeam()) {
        if (c.auraImmuneUntil > t) continue;
        const d = encounter.aura.damage * threat();
        c.hp -= d;
        c.lastHitBy = 'aura';
        inc(c, 'auraDamage', d);
        c.minHp = Math.min(c.minHp, c.hp);
        // Reprise : une part de la perte réelle d'aura alimente une réserve (une aura létale tue avant).
        const breath = c.tools.breath;
        if (breath && c.hp > 0) breath.pool = Math.min(breath.tool.pulse * c.maxHp0, breath.pool + d * breath.tool.recover);
      }
    }
    // Reprise : restitution en fin de pas, plafonnée par les PV manquants, la réserve et le plafond glissant.
    for (const c of aliveTeam()) {
      const breath = c.tools.breath;
      if (!breath || breath.pool <= 0 || t < breath.readyAt) continue;
      breath.healed = breath.healed.filter((h) => h.t > t - ms(breath.tool.window));
      const room = breath.tool.rolling * c.maxHp0 - breath.healed.reduce((a, h) => a + h.amount, 0);
      const amount = Math.min(c.stats.maxHp - c.hp, breath.pool, room);
      if (amount <= 0) continue;
      c.hp += amount;
      breath.pool -= amount;
      breath.readyAt = t + ms(breath.tool.cooldown);
      breath.healed.push({ t, amount });
      inc(c, 'breathHealed', amount);
    }
    // Potions : bues automatiquement sous le seuil, en fin de pas (après les coups reçus).
    for (const c of aliveTeam()) {
      const p = c.setup.potions;
      if (!p || c.potionsLeft <= 0 || t < c.potionReadyAt || c.hp >= p.below * c.stats.maxHp) continue;
      c.hp = Math.min(c.stats.maxHp, c.hp + p.heal * c.stats.maxHp);
      c.potionsLeft--;
      c.potionReadyAt = t + ms(p.cooldown);
      inc(c, 'potions');
      log(c, 'potion', 'potion de secours');
    }
    t += tick;
  }

  const win = aliveTeam().length > 0 && !chiefsAlive();
  const fallen = team.find((c) => c.hp <= 0);
  const enemyTotal = enemies.reduce((a, e) => a + e.maxHp, 0);
  return {
    win,
    time: Math.max(tick, t) / 1000,
    cause: win ? null : fallen ? 'death' : 'timeout',
    killedBy: !win && fallen ? fallen.lastHitBy : null,
    enemyHpLeft: enemies.reduce((a, e) => a + Math.max(0, e.hp), 0) / enemyTotal,
    team: team.map((c) => ({
      id: c.setup.id,
      alive: c.hp > 0,
      hp: Math.max(0, c.hp),
      hpRatio: Math.max(0, c.hp / c.stats.maxHp),
      minHpRatio: Math.max(0, c.minHp / c.stats.maxHp),
      contributions: c.contrib,
      metrics: c.m,
    })),
    ...(trace ? { trace } : {}),
  };
}
