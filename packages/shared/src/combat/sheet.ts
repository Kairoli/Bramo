/**
 * La fiche du personnage, comme dans un MMO classique, et ce que chaque pièce change vraiment [Louis, 24 octobre : « un
 * endroit où voir les stats complètes du personnage » ; « le critique devrait être en % » ; « 0,6 × Puissance n'est pas
 * très parlant »]. Tout se calcule avec le moteur de build : les nombres montrés sont ceux du combat.
 */
import type { Content } from '../schemas/content.js';
import type { GearInstance } from '../schemas/gear.js';
import type { TalentMods } from '../schemas/combat.js';
import type { CharacterState } from '../engine/state.js';
import type { CombatStats } from './engine.js';
import { filledPools, missingPools } from './guide.js';
import { wornLoadout } from './loadout.js';
import { wornGear, wornPieces } from './progress.js';
import { activePrep } from './supplies.js';

type Equipment = NonNullable<CharacterState['equipment']>;

const num = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const pct = (x: number, digits = 1) => `${String(Math.round(x * 100 * 10 ** digits) / 10 ** digits).replace('.', ',')} %`;

/** Une ligne de la fiche : le nom, la valeur lisible, une phrase qui dit à quoi elle sert. */
export interface SheetStat {
  key: string;
  label: string;
  value: string;
  hint: string;
}

export interface SheetView {
  /** Statistiques du combat, par groupe. */
  groups: { name: string; stats: SheetStat[] }[];
  /** L'équipement est sous le plancher de son niveau : on combat avec le plancher (et ce que donnerait l'équipement). */
  floored: boolean;
  gear: { power: number; maxHp: number } | null;
  /** Les quatre places de talent : objets nommés d'abord, puis gemmes serties ; au-delà de quatre, rien n'agit. */
  places: { max: number; items: { kind: 'named' | 'gem'; name: string; text: string | null; active: boolean; idle: string | null }[] };
  /** Ensembles portés : pièces, et chaque bonus, actif ou non. */
  sets: { name: string; count: number; bonuses: { pieces: number; text: string; active: boolean }[] }[];
  /** Réponses de situation actives (gemmes, ensembles à 4 pièces, préparation) : contre quelle mécanique. */
  answers: { name: string; against: string }[];
  /** Modificateurs de talent (lignes tirées, ensembles, talents). */
  mods: { label: string; value: string }[];
  /** Plafond de chaque réserve pour ce build. */
  pools: { id: string; name: string; max: number }[];
}

const AGAINST: Record<string, string> = { interstice: 'les fenêtres', rain: 'l’érosion', impact: 'les coups lourds', beat: 'les renforts', fracture: 'les gardes', breath: 'les auras' };

const MOD_LABEL: Record<keyof TalentMods, string> = {
  dotDuration: 'Durée des afflictions',
  dotDamage: 'Dégâts des afflictions',
  markDuration: 'Durée des marques',
  slowDuration: 'Durée des ralentissements',
  shieldPower: 'Puissance des boucliers',
  healPower: 'Puissance des soins',
  pressure: 'Pression sur la Stabilité',
  runeValue: 'Valeur des runes',
  angleDuration: 'Durée de l’Angle',
  shieldDuration: 'Durée des boucliers',
  slowedTakenReduction: 'Dégâts reçus des ennemis ralentis (en moins)',
  defenseScore: 'Défense (score)',
  hasteScore: 'Cadence (score)',
  heatCap: 'Braises au plafond',
  basicDamage: 'Dégâts des attaques de base',
  skillDamage: 'Dégâts des compétences',
  spendPower: 'Dépenses de réserve (dégâts, soins, boucliers)',
  spendKeep: 'Part de réserve gardée en la dépensant',
};

/** Les statistiques du combat, lisibles : la Puissance en nombre, le reste en pourcentages. */
export function statRows(s: CombatStats): SheetView['groups'] {
  const attack: SheetStat[] = [
    { key: 'power', label: 'Puissance', value: num(s.power), hint: `La base de tes dégâts et de tes soins : un sort « 0,6 × Puissance » fait environ ${num(0.6 * s.power)}.` },
    { key: 'critChance', label: 'Chance de critique', value: pct(s.critChance), hint: 'La part de tes coups qui sont critiques.' },
    { key: 'critMultiplier', label: 'Dégâts critiques', value: pct(s.critMultiplier, 0), hint: `Un coup critique fait ${pct(s.critMultiplier, 0)} des dégâts d’un coup normal.` },
  ];
  if (s.penetration) attack.push({ key: 'penetration', label: 'Pénétration', value: pct(s.penetration), hint: 'La part de la Défense ennemie que tes coups ignorent.' });
  for (const [el, v] of Object.entries(s.elementDamage ?? {}))
    attack.push({ key: `el:${el}`, label: `Dégâts ${{ physical: 'physiques', fire: 'de feu', frost: 'de givre', lightning: 'de foudre' }[el] ?? el}`, value: `+${pct(v ?? 0)}`, hint: 'En plus, sur les coups de cet élément.' });
  const defense: SheetStat[] = [
    { key: 'maxHp', label: 'Points de vie', value: num(s.maxHp), hint: 'Ce que tu encaisses avant de tomber.' },
    { key: 'damageReduction', label: 'Réduction des dégâts', value: pct(s.damageReduction), hint: `Chaque coup reçu est réduit de ${pct(s.damageReduction)} (Défense).` },
  ];
  if (s.startShield) defense.push({ key: 'startShield', label: 'Bouclier de départ', value: `${pct(s.startShield.share, 0)} des PV`, hint: `Un bouclier au début du combat, ${s.startShield.duration} s.` });
  const tempo: SheetStat[] = [{ key: 'haste', label: 'Cadence', value: `+${pct(s.haste)}`, hint: 'Attaques de base et recharges des sorts plus rapides d’autant.' }];
  return [
    { name: 'Attaque', stats: attack },
    { name: 'Défense', stats: defense },
    { name: 'Rythme', stats: tempo },
  ];
}

/** La fiche complète du personnage (classe actuelle, équipement porté). */
export function characterSheet(state: CharacterState, content: Content): SheetView | null {
  const combat = content.combat;
  const w = wornGear(state, content);
  if (!combat || !w || !state.equipment) return null;
  const catalog = combat.talents;
  const equipment = state.equipment;
  const raw = wornLoadout(combat.rules, catalog, combat.tools, wornPieces(equipment, content)).stats;
  // Places de talent : les objets nommés d'abord, puis les gemmes (comme le moteur, wornLoadout).
  const named: string[] = [];
  const gems: string[] = [];
  for (const p of equipment) {
    const t = content.gearModels[p.model]?.talent;
    if (t && !named.includes(t)) named.push(t);
    if (p.gem && !gems.includes(p.gem)) gems.push(p.gem);
  }
  // Un talent qui convertit, dépense ou attend une réserve que rien dans le build ne remplit n'agit pas : on le dit.
  const filled = filledPools(w.talents);
  const poolName = (id: string) => catalog?.pools.find((p) => p.id === id)?.name ?? id;
  const idle = (t: Parameters<typeof missingPools>[0] | undefined) => {
    const missing = t ? missingPools(t, filled) : [];
    return missing.length ? `Sans effet pour l’instant : rien dans votre build ne donne de ${missing.map(poolName).join(' ni de ')}.` : null;
  };
  const places: SheetView['places']['items'] = [
    ...named.map((id) => {
      const n = catalog?.named.find((x) => x.id === id);
      return { kind: 'named' as const, name: n?.name ?? id, text: n?.text ?? null, idle: idle(n) };
    }),
    ...gems.map((id) => {
      const g = catalog?.gems.find((x) => x.id === id);
      const tool = combat.tools.find((x) => x.id === id);
      return { kind: 'gem' as const, name: g?.name ?? tool?.name ?? id, text: g?.text ?? (tool ? `Contre ${AGAINST[tool.family] ?? tool.family}.` : null), idle: idle(g) };
    }),
  ].map((x, i) => ({ ...x, active: i < 4, idle: i < 4 ? x.idle : null }));
  // Ensembles portés et leurs bonus.
  const counts: Record<string, number> = {};
  for (const p of equipment) {
    const set = content.gearModels[p.model]?.set;
    if (set) counts[set] = (counts[set] ?? 0) + 1;
  }
  const sets = Object.entries(counts).map(([id, count]) => {
    const def = catalog?.sets.find((x) => x.id === id);
    const texts = def?.text ?? [];
    return {
      name: def?.name ?? content.gearSets[id]?.name ?? id,
      count,
      bonuses: texts.map((t) => {
        const pieces = Number(t.split(' :')[0]);
        return { pieces, text: t.slice(t.indexOf(':') + 1).trim(), active: count >= pieces };
      }),
    };
  });
  // Les réponses de situation : gemmes et ensembles à 4 pièces (le build), et la préparation en cours (Fournitures).
  const prep = activePrep(state, content);
  const prepTool = prep ? combat.tools.find((t) => t.id === prep && t.rank === 'prep') : undefined;
  const answers = [...w.tools, ...(prepTool ? [prepTool] : [])].map((t) => ({ name: t.name, against: AGAINST[t.family] ?? t.family }));
  const mods = Object.entries(w.mods ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => ({ label: MOD_LABEL[k as keyof TalentMods] ?? k, value: k === 'heatCap' ? `+${v}` : `+${pct(v!)}` }));
  const pools = (catalog?.pools ?? []).map((p) => ({ id: p.id, name: p.name, max: Math.floor(w.pools[p.id] ?? p.max) }));
  return { groups: statRows(w.stats), floored: w.floored, gear: w.floored ? { power: raw.power, maxHp: raw.maxHp } : null, places: { max: 4, items: places }, sets, answers, mods, pools };
}

// --- Ce que change une pièce ---------------------------------------------------------------------------------------

/** Ce que chaque statistique fixe d'une pièce change vraiment au combat, pour ce personnage (« ≈ +3,1 % de critique »). */
export interface StatEffect {
  stat: string;
  text: string;
}

const toEquip = (g: GearInstance): Equipment[number] => ({ model: g.model, lines: g.lines.map((l) => ({ name: l.name, value: l.value })), ...(g.gem ? { gem: g.gem } : {}), ...(g.rank ? { rank: g.rank } : {}) });

function effectText(stat: string, d: CombatStats): string | null {
  const z = (x: number) => Math.abs(x) < 1e-4;
  switch (stat) {
    case 'power':
      return z(d.power) ? null : `≈ ${d.power > 0 ? '+' : '−'}${num(Math.abs(d.power))} de Puissance au combat`;
    case 'vitality':
      return z(d.maxHp) ? null : `≈ +${num(d.maxHp)} PV`;
    case 'defense':
      return z(d.damageReduction) ? (z(d.maxHp) ? null : `≈ +${num(d.maxHp)} PV`) : `≈ +${pct(d.damageReduction)} de dégâts reçus en moins${z(d.maxHp) ? '' : `, +${num(d.maxHp)} PV`}`;
    case 'crit':
      return z(d.critChance) ? 'au plafond : n’ajoute plus rien' : `≈ +${pct(d.critChance)} de chance de critique`;
    case 'haste':
      return z(d.haste) ? 'au plafond : n’ajoute plus rien' : `≈ +${pct(d.haste)} de cadence`;
    default:
      return null;
  }
}

/**
 * Pour chaque pièce, l'effet réel de ses statistiques fixes : portée, ce qu'elle apporte ; dans le sac, ce qu'elle
 * apporterait à la place de celle de son emplacement. Sans le plancher : c'est la valeur de l'équipement lui-même.
 */
export function gearEffects(items: GearInstance[], content: Content): Record<number, StatEffect[]> {
  const combat = content.combat;
  if (!combat?.rules.gearStats) return {};
  const slotOf = (g: GearInstance) => content.gearModels[g.model]?.slot;
  const worn = items.filter((g) => g.equipped);
  const statsOf = (pieces: ReturnType<typeof wornPieces>) => wornLoadout(combat.rules, combat.talents, combat.tools, pieces).stats;
  const out: Record<number, StatEffect[]> = {};
  for (const g of items) {
    const m = content.gearModels[g.model];
    if (!m || !m.stats.length) continue;
    let removed = false;
    const others = g.equipped
      ? worn.filter((x) => x.id !== g.id)
      : worn.filter((x) => {
          if (!removed && slotOf(x) === m.slot) return !(removed = true);
          return true;
        });
    const with_ = wornPieces([...others, g].map(toEquip), content);
    const full = statsOf(with_);
    const effects: StatEffect[] = [];
    for (const s of m.stats) {
      // La même pièce sans cette statistique : la différence est ce qu'elle apporte.
      const without = with_.map((p, i) => (i === with_.length - 1 ? { ...p, stats: p.stats.filter((x) => x.stat !== s.stat) } : p));
      const lower = statsOf(without);
      const d: CombatStats = { power: full.power - lower.power, maxHp: full.maxHp - lower.maxHp, damageReduction: full.damageReduction - lower.damageReduction, critChance: full.critChance - lower.critChance, critMultiplier: full.critMultiplier - lower.critMultiplier, haste: full.haste - lower.haste };
      const text = effectText(s.stat, d);
      if (text) effects.push({ stat: s.stat, text });
    }
    out[g.id] = effects;
  }
  return out;
}
