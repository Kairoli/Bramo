/**
 * Moteur du combat automatique (dossier « Le cœur du jeu » v0.2, §3 à §7 et §17) : kit de classe seul.
 *
 * - Horloge en millisecondes entières, pas fixe `rules.tick` : résultat identique pour une même graine.
 * - Le serveur et le simulateur appellent la même fonction `fight`.
 * - Équipe de 1 à N combattants (solo = 1) : chaque protection et chaque soin vise **un** bénéficiaire.
 * - Le ralentissement allonge l'intervalle des attaques ordinaires ; les phases (charge, garde, soin) gardent leur horaire.
 * - Les contributions (dégâts, soins utiles, absorptions, atténuation, Pression, Ruptures, dissipations) sont comptées par
 *   combattant, pour reconnaître plus tard le soutien et le contrôle en donjon ou contre un boss mondial.
 * Pas encore : statistiques issues de l'équipement, ensembles, gemmes, nommés, résistances élémentaires (reportées).
 */
import type { ClassKit, CombatContent, CombatPath, Element, Encounter, PlanEntry, Spell } from '../schemas/combat.js';
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
}

export interface FightOptions {
  seed: number;
  /** Règle d'ouverture (par défaut celle de rules.yaml). */
  opening?: 'independent' | 'sequence';
  /** Multiplie les dégâts ennemis (essais de danger accru). */
  enemyDamageScale?: number;
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
}

interface Combatant {
  setup: CombatantSetup;
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
    return {
      setup: s,
      kit,
      path,
      stats,
      P: stats.power,
      hp: stats.maxHp,
      minHp: stats.maxHp,
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
  const enemies: Enemy[] = Array.from({ length: encounter.enemies }, (_, i) => ({
    i,
    hp: encounter.hp,
    maxHp: encounter.hp,
    boss: encounter.enemies === 1,
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
    stability: encounter.enemies === 1 ? R.stability.max : (R.stability.ordinaryMax ?? R.stability.max),
    breakUntil: -1,
    breakRecover: -1,
    nextHit: ms(R.enemy.firstAttackAt + i * R.enemy.attackStagger),
    countertraps: new Map(),
  }));

  const aliveEnemies = () => enemies.filter((e) => e.hp > 0);
  const aliveTeam = () => team.filter((c) => c.hp > 0);
  const param = (c: Combatant, key: string) => c.path?.params[key] ?? 0;
  const kp = (c: Combatant, key: string) => c.kit.params[key] ?? 0;

  /** Cible courante ; à la mort de la Proie, un Angle non consommé la suit pour `carryOnKill` s au plus. */
  const current = (c: Combatant): Enemy => {
    const old = enemies[c.target]!;
    if (old.hp > 0) return old;
    const alive = aliveEnemies();
    if (!alive.length) return old;
    c.target = alive[0]!.i;
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
  const damage = (c: Combatant, e: Enemy, amount: number, origin: string, element: Element, crit = false, penetration = 0): number => {
    if (e.hp <= 0 || amount <= 0) return 0;
    let mult = 1 - R.enemy.defense * (1 - Math.min(1, penetration));
    if (crit) mult *= c.stats.critMultiplier;
    let vuln = 0;
    for (const v of e.vuln) if (v.until > t) vuln = Math.max(vuln, v.amount);
    if (e.breakUntil > t) vuln = Math.max(vuln, R.stability.breakDamageTaken);
    let x = amount * mult * (1 + Math.min(R.caps.vulnerability, vuln));
    const g = Math.min(e.guard, x);
    e.guard -= g;
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
  const heal = (c: Combatant, target: Combatant, amount: number): number => {
    if (target.hp <= 0) return 0;
    const eff = Math.min(target.stats.maxHp - target.hp, amount);
    target.hp += eff;
    c.contrib.healing += eff;
    return eff;
  };
  const shield = (c: Combatant, target: Combatant, amount: number, source: string, primary: boolean, duration: number, riposte = 0): number => {
    if (target.hp <= 0) return 0;
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

    const targets = [e, ...aliveEnemies().filter((x) => x.i !== e.i)].slice(0, spell?.targets ?? 1);
    targets.forEach((x, i) => {
      const impact = coefficient * (i === 0 ? 1 : R.secondaryShare) + (i === 0 ? bonus : 0);
      damage(c, x, impact * c.P, basic ? 'basic' : 'skill', element, crit, spell?.penetration ?? 0);
      if (spell?.dot) dot(c, x, `spell:${spell.id}`, spell.dot.amount * (i === 0 ? 1 : R.secondaryShare), spell.dot.type, spell.dot.duration);
    });

    if (spell) {
      const who = beneficiary(c);
      if (spell.heal) heal(c, who, spell.heal * c.P);
      if (spell.shield) shield(c, who, spell.shield * c.P, `spell:${spell.id}`, true, spell.duration ?? 6);
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
  const front = () => aliveTeam()[0];
  const incoming = (e: Enemy, raw: number, source: 'attack' | 'charge') => {
    const c = front();
    if (!c) return;
    log(null, source, `${source === 'charge' ? 'attaque chargée' : 'attaque'} de l'ennemi ${e.i + 1} sur ${c.setup.id}`);
    const active = e.weaken.filter((w) => w.until > t);
    const strongest = active.reduce<Weaken | null>((a, w) => (!a || w.amount > a.amount ? w : a), null);
    e.weaken = active.filter((w) => !w.once);
    const before = raw * (1 - c.stats.damageReduction);
    let amount = before * (1 - (strongest?.amount ?? 0));
    if (strongest) strongest.by.contrib.mitigated += before - amount;
    for (const sh of [...c.shields].sort((a, b) => a.end - b.end)) {
      if (amount <= 0) break;
      const take = Math.min(sh.amount, amount);
      sh.amount -= take;
      amount -= take;
      if (take > 0) {
        sh.owner.contrib.absorbed += take;
        if (sh.primary && sh.owner.path?.id === 'glyphkeeper') sh.owner.ink = Math.min(param(sh.owner, 'cap') * sh.owner.P, sh.owner.ink + take);
        if (sh.riposte) {
          damage(sh.owner, e, sh.riposte, 'class', 'physical');
          sh.riposte = 0;
          inc(sh.owner, 'ripostes');
        }
      }
      if (sh.amount <= 1e-8) c.shields = c.shields.filter((s) => s !== sh);
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
  while (t <= limit && aliveTeam().length && aliveEnemies().length) {
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
    if (!aliveEnemies().length) break;

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
          incoming(e, encounter.attack.damage * enemyScale * spread, 'attack');
          const s = e.slowUntil > t ? e.slow : 0;
          e.nextHit = t + ms(encounter.attack.period / (1 - s));
        }
      }
      // Phases à horaire fixe : jamais décalées par un ralentissement.
      if (encounter.charge && crossed(ms(encounter.charge.period))) incoming(e, encounter.charge.damage * enemyScale, 'charge');
      if (encounter.guard && crossed(ms(encounter.guard.period))) {
        e.guard = encounter.guard.amount;
        e.guardUntil = t + ms(encounter.guard.duration);
        log(null, 'guard', 'garde levée');
      }
      if (encounter.regen && crossed(ms(encounter.regen.period))) {
        const anti = e.antihealUntil > t ? e.antiheal : 0;
        e.hp = Math.min(e.maxHp, e.hp + encounter.regen.amount * (1 - anti));
      }
    }
    if (encounter.aura && aliveEnemies().length && crossed(1000)) {
      for (const c of aliveTeam()) {
        if (c.auraImmuneUntil > t) continue;
        c.hp -= encounter.aura.damage;
        c.lastHitBy = 'aura';
        inc(c, 'auraDamage', encounter.aura.damage);
        c.minHp = Math.min(c.minHp, c.hp);
      }
    }
    t += tick;
  }

  const win = aliveTeam().length > 0 && !aliveEnemies().length;
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
