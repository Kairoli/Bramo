/**
 * Kits d'équipement tirés du catalogue (`data/gear.yaml`) pour mesurer la courbe réelle : un modèle par emplacement (onze
 * places, deux anneaux), même palier et même rareté, orientation protectrice, offensive ou mixte. Les lignes aléatoires sont
 * absentes (témoin) ou moyennes (chaque ligne du groupe de l'emplacement au jet moyen, au prorata du nombre de jets).
 */
import type { Content, GearModel, GearTotalsLike, Rarity } from '@bramo/shared';

export const SLOTS = ['head', 'torso', 'hands', 'legs', 'feet', 'cape', 'belt', 'necklace', 'ring', 'ring', 'weapon'] as const;
/** Orientation mixte : torse, jambes, cape et ceinture protecteurs ; coiffe, gants, bottes offensifs. */
const MIXED_PROTECTIVE = new Set(['torso', 'legs', 'cape', 'belt']);

export type Orientation = 'protective' | 'offensive' | 'mixed';
export interface KitSpec {
  classId: string;
  tier: number;
  rarity: Rarity;
  orientation: Orientation;
  rolls: 'none' | 'mean';
  /** Arme (famille) ; par défaut la première arme de la classe. */
  weapon?: string;
}

export interface Kit {
  spec: KitSpec;
  totals: GearTotalsLike;
  models: string[];
  /** Emplacements sans modèle à ce palier et cette rareté (le plus proche en rareté est pris). */
  missing: string[];
}

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export function buildKit(content: Content, spec: KitSpec): Kit {
  const all = Object.values(content.gearModels).filter((m) => !m.starter && !m.set && !m.named && m.tier === spec.tier && m.classes.includes(spec.classId));
  const weapon = spec.weapon ?? content.combat!.kits[spec.classId]!.weapons[0]!;
  const stats: Record<string, number> = {};
  const lines: Record<string, number> = {};
  const models: string[] = [];
  const missing: string[] = [];
  for (const slot of SLOTS) {
    const want = spec.orientation === 'mixed' ? (MIXED_PROTECTIVE.has(slot) ? 'protective' : 'offensive') : spec.orientation;
    const inSlot = all.filter((m) => m.slot === slot && (slot !== 'weapon' || m.family === weapon));
    // Rareté demandée, sinon la plus proche en dessous puis au-dessus.
    const ri = RARITY_ORDER.indexOf(spec.rarity);
    const order = [ri, ...RARITY_ORDER.map((_, i) => i).filter((i) => i !== ri).sort((a, b) => Math.abs(a - ri) - Math.abs(b - ri) || a - b)];
    let pick: GearModel | undefined;
    for (const i of order) {
      const cands = inSlot.filter((m) => m.rarity === RARITY_ORDER[i]);
      pick = cands.find((m) => m.orientation === want) ?? cands[0];
      if (pick) {
        if (i !== ri) missing.push(`${slot}:${RARITY_ORDER[i]}`);
        break;
      }
    }
    if (!pick) {
      missing.push(slot);
      continue;
    }
    models.push(pick.id);
    for (const s of pick.stats) stats[s.stat] = (stats[s.stat] ?? 0) + s.value;
    if (spec.rolls === 'mean') {
      const pool = content.gearPools.pools[pick.slot] ?? [];
      const k = content.gearPools.tierScale[String(pick.tier)] ?? 1;
      const n = (pick.rolls[0] + pick.rolls[1]) / 2;
      for (const l of pool) lines[l.name] = (lines[l.name] ?? 0) + ((l.min + l.max) / 2) * k * (n / pool.length);
    }
  }
  return { spec, totals: { stats, lines }, models, missing };
}
