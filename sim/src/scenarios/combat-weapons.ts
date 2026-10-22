/**
 * Armes à valeur égale (docs/design/coherence/classes.md) : dans le catalogue, une arme peut valoir bien moins qu'une autre
 * (les Dagues du Chat maigre n'ont aucune Puissance ; le Critique de l'Arc de la Haie vive plafonne avec celui de l'armure).
 * Règle proposée : **chaque arme garde son caractère** (ses statistiques secondaires : Cadence, Critique, Défense, Vitalité)
 * et **sa Puissance s'ajuste** pour que le kit témoin de sa classe atteigne le même indice de mur, quelle que soit l'arme.
 * Les paliers et raretés gardent la courbe du catalogue (même rapport de points qu'aujourd'hui).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type CombatStats, type GearModel, statsFromGear } from '@bramo/shared';
import { buildKit } from '../coherence/kits.js';
import type { Lab } from '../coherence/lab.js';
import { DATA_DIR } from '../load.js';

type Line = GearModel['stats'][number];

/** Indice de mur d'un équipement : (dégâts × survie)^0,4, la loi mesurée (`budget.md`). */
export function wallIndex(s: CombatStats): number {
  const dmg = s.power * (1 + (s.critMultiplier - 1) * s.critChance) * (1 + s.haste);
  const surv = s.maxHp / (1 - s.damageReduction);
  return (dmg * surv) ** 0.4;
}

const t20Weapon = (models: GearModel[], family: string) => models.find((m) => m.slot === 'weapon' && m.family === family && m.tier === 20 && m.rarity === 'rare' && !m.named && !m.set)!;

const statsOf = (lab: Lab, cls: string, family: string, weapon: Line[]) => {
  const kit = buildKit(lab.content, { classId: cls, tier: 20, rarity: 'rare', orientation: 'mixed', rolls: 'none', weapon: family });
  const stats = { ...kit.totals.stats };
  for (const s of t20Weapon(Object.values(lab.content.gearModels), family).stats) stats[s.stat] = (stats[s.stat] ?? 0) - s.value;
  for (const s of weapon) stats[s.stat] = (stats[s.stat] ?? 0) + s.value;
  return statsFromGear(lab.combat.rules, { stats, lines: {} }, 20);
};

export interface WeaponPlan {
  cls: string;
  family: string;
  name: string;
  before: { stats: Line[]; index: number };
  after: { stats: Line[]; index: number };
}

/** Cible : l'indice médian des neuf armes d'aujourd'hui (les Dagues tireraient la moyenne vers le bas) ; chaque arme y est ramenée par sa seule Puissance. */
export function planWeapons(lab: Lab): { target: number; weapons: WeaponPlan[] } {
  const models = Object.values(lab.content.gearModels);
  const all = Object.entries(lab.combat.kits).flatMap(([cls, k]) => k.weapons.map((family) => ({ cls, family, w: t20Weapon(models, family) })));
  const idx = all.map((x) => wallIndex(statsOf(lab, x.cls, x.family, x.w.stats))).sort((a, b) => a - b);
  const target = idx[idx.length >> 1]!;
  const weapons = all.map(({ cls, family, w }) => {
    const others = w.stats.filter((s) => s.stat !== 'power');
    const at = (p: number) => wallIndex(statsOf(lab, cls, family, [{ stat: 'power', value: p }, ...others]));
    let lo = 0;
    let hi = 1000;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (at(mid) < target) lo = mid;
      else hi = mid;
    }
    const after: Line[] = [{ stat: 'power', value: Math.round(hi) }, ...others];
    return { cls, family, name: w.name, before: { stats: w.stats, index: wallIndex(statsOf(lab, cls, family, w.stats)) }, after: { stats: after, index: at(Math.round(hi)) } };
  });
  return { target, weapons };
}

/** Modèles d'un catalogue au format de data/gear.yaml (une ligne JSON par modèle). */
export const readGearFile = (file: string): GearModel[] =>
  readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('- {'))
    .map((l) => JSON.parse(l.slice(2)) as GearModel);

/** Catalogue de départ : `gear_base.yaml` de la proposition s'il existe (export_gear_v2.mjs), sinon data/gear.yaml. */
export const baseGearFile = (proposalDir: string) => (existsSync(join(proposalDir, 'gear_base.yaml')) ? join(proposalDir, 'gear_base.yaml') : join(DATA_DIR, 'gear.yaml'));

/** Le catalogue de départ, armes réécrites selon la règle (une ligne JSON par modèle, comme l'original). */
export function rewriteGear(plan: { weapons: WeaponPlan[] }, baseFile: string): string {
  const models = readGearFile(baseFile);
  const points = (m: GearModel) => m.stats.reduce((a, s) => a + s.value, 0);
  const out = [
    `# Catalogue des modèles d'équipement, proposition coherence-v2 : ${baseFile.endsWith('gear_base.yaml') ? 'gear_base.yaml (dix paliers, export_gear_v2.mjs)' : 'copie de data/gear.yaml'} dont seules les ARMES changent`,
    '# (règle « armes à valeur égale », sim/src/scenarios/combat-weapons.ts, docs/design/coherence/classes.md). Généré par',
    '# `pnpm --filter @bramo/sim sim combat-weapons --write` : ne pas modifier à la main.',
  ];
  for (const m of models) {
    const p = m.slot === 'weapon' && !m.named && !m.set && plan.weapons.find((w) => w.family === m.family);
    if (p) {
      // Même rapport de points que l'original à son palier et sa rareté.
      const f = points(m) / points(t20Weapon(models, m.family!));
      m.stats = p.after.stats.map((s) => ({ stat: s.stat, value: Math.max(1, Math.round(s.value * f)) }));
    }
    out.push(`- ${JSON.stringify(m)}`);
  }
  return `${out.join('\n')}\n`;
}

export function weaponsMarkdown(plan: { target: number; weapons: WeaponPlan[] }): string {
  const md = ['# Armes à valeur égale', '', '> Généré par `pnpm --filter @bramo/sim sim combat-weapons`. Ne pas modifier à la main.', ''];
  md.push('**Méthode.** Kit témoin de la classe (palier 20, Rare, mixte, sans ligne), arme changée. Indice de mur = (dégâts × survie)^0,4 avec dégâts = P × (1 + 0,6 × critique) × (1 + cadence) et survie = PV / (1 − réduction). Règle : chaque arme garde ses statistiques secondaires ; sa Puissance est ajustée pour atteindre l’indice médian des neuf armes d’aujourd’hui.', '');
  md.push('| Classe | Arme | Aujourd’hui | Écart à la médiane | Proposé | Écart |', '|---|---|---|---|---|---|');
  const st = (xs: Line[]) => xs.map((s) => `${s.stat} ${s.value}`).join(', ');
  const gap = (x: number) => `${x >= plan.target ? '+' : ''}${((x / plan.target - 1) * 100).toFixed(1).replace('.', ',')} %`;
  for (const w of plan.weapons) md.push(`| ${w.cls} | ${w.name} | ${st(w.before.stats)} | ${gap(w.before.index)} | ${st(w.after.stats)} | ${gap(w.after.index)} |`);
  return md.join('\n');
}
