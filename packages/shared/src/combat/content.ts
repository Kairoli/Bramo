import { z } from 'zod';
import {
  type CombatContent,
  type PlanEntry,
  combatRulesSchema,
  encountersFileSchema,
  kitsFileSchema,
  plansFileSchema,
  spellsFileSchema,
} from '../schemas/combat.js';

/** Fichiers bruts de `data/combat/`. */
export interface RawCombat {
  rules: unknown;
  kits: unknown;
  spells: unknown;
  plans?: unknown;
  encounters?: unknown;
}

function parse<T>(schema: z.ZodType<T>, data: unknown, file: string, errors: string[]): T | null {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  errors.push(`combat/${file} invalide :\n${z.prettifyError(result.error)}`);
  return null;
}

/** Nombre de places de sorts au niveau de classe donné. */
export const spellSlots = (combat: Pick<CombatContent, 'slots' | 'pathLevel'>, level: number) =>
  level >= combat.pathLevel ? combat.slots.fromPath : combat.slots.beforePath;

/**
 * Vérifie un plan : sorts de la classe, de la voie choisie (ou communs), accessibles au niveau, places, un seul ultime,
 * pas de doublon. Une place vide est permise (dossier §3 : on n'oblige pas à ajouter un mauvais sort).
 */
export function planErrors(combat: CombatContent, classId: string, pathId: string | null, level: number, entries: PlanEntry[]): string[] {
  const errors: string[] = [];
  const max = spellSlots(combat, level);
  if (entries.length > max) errors.push(`${entries.length} sorts pour ${max} places au niveau ${level}`);
  if (pathId && level < combat.pathLevel) errors.push(`voie ${pathId} choisie avant le niveau ${combat.pathLevel}`);
  const seen = new Set<string>();
  let ultimates = 0;
  for (const e of entries) {
    const s = combat.spells[e.spell];
    if (!s) {
      errors.push(`sort inconnu « ${e.spell} »`);
      continue;
    }
    if (seen.has(s.id)) errors.push(`sort en double « ${s.id} »`);
    seen.add(s.id);
    if (s.class !== classId) errors.push(`${s.id} est un sort de ${s.class}`);
    if (s.path && s.path !== pathId) errors.push(`${s.id} est réservé à la voie ${s.path}`);
    if (s.level > level) errors.push(`${s.id} demande le niveau ${s.level}`);
    if (s.tags.includes('ultimate')) ultimates++;
  }
  if (ultimates > 1) errors.push('un seul ultime par plan');
  return errors;
}

/** Valide `data/combat/` et ses références vers les classes. Renvoie le contenu et les erreurs (vides si tout va bien). */
export function buildCombatContent(raw: RawCombat, classIds: string[]): { combat: CombatContent | null; errors: string[] } {
  const errors: string[] = [];
  const rules = parse(combatRulesSchema, raw.rules, 'rules.yaml', errors);
  const kitsFile = parse(kitsFileSchema, raw.kits, 'kits.yaml', errors);
  const spellList = parse(spellsFileSchema, raw.spells, 'spells.yaml', errors);
  const planList = parse(plansFileSchema, raw.plans ?? [], 'plans.yaml', errors);
  const encounterList = parse(encountersFileSchema, raw.encounters ?? [], 'encounters.yaml', errors);
  if (!rules || !kitsFile || !spellList || !planList || !encounterList) return { combat: null, errors };

  const index = <T extends { id: string }>(list: T[], file: string) => {
    const map: Record<string, T> = {};
    for (const x of list) {
      if (map[x.id]) errors.push(`combat/${file} : identifiant en double « ${x.id} »`);
      map[x.id] = x;
    }
    return map;
  };
  const kits = index(kitsFile.classes, 'kits.yaml');
  const paths: CombatContent['paths'] = {};
  for (const k of kitsFile.classes) {
    if (!classIds.includes(k.id)) errors.push(`combat/kits.yaml : classe inconnue « ${k.id} »`);
    if (new Set(k.paths.map((p) => p.role)).size !== 3) errors.push(`combat/kits.yaml : ${k.id} doit avoir une voie de chaque rôle`);
    for (const w of k.weapons) if (!rules.weaponPeriods[w]) errors.push(`combat/kits.yaml : ${k.id} : arme sans cadence « ${w} » (rules.weaponPeriods)`);
    for (const p of k.paths) {
      if (paths[p.id]) errors.push(`combat/kits.yaml : voie en double « ${p.id} »`);
      paths[p.id] = { ...p, class: k.id };
    }
  }
  const spells = index(spellList, 'spells.yaml');
  for (const s of spellList) {
    const kit = kits[s.class];
    if (!kit) errors.push(`combat/spells.yaml : ${s.id} : classe sans kit « ${s.class} »`);
    if (s.path && paths[s.path]?.class !== s.class) errors.push(`combat/spells.yaml : ${s.id} : voie « ${s.path} » absente de ${s.class}`);
    if (s.path && s.level < kitsFile.pathLevel) errors.push(`combat/spells.yaml : ${s.id} : sort de voie avant le niveau ${kitsFile.pathLevel}`);
    if (kit?.mechanic === 'rune' && !s.form) errors.push(`combat/spells.yaml : ${s.id} : un sort de Runiste écrit une rune (form)`);
    if (kit?.mechanic === 'heat' && s.tags.includes('heat') && !s.heat) errors.push(`combat/spells.yaml : ${s.id} : une Chauffe donne des Braises (heat)`);
  }
  const combat: CombatContent = {
    rules,
    slots: kitsFile.slots,
    pathLevel: kitsFile.pathLevel,
    kits,
    paths,
    spells,
    plans: index(planList, 'plans.yaml'),
    encounters: index(encounterList, 'encounters.yaml'),
  };
  for (const p of planList) {
    if (paths[p.path]?.class !== p.class) errors.push(`combat/plans.yaml : ${p.id} : voie « ${p.path} » absente de ${p.class}`);
    if (!kits[p.class]?.weapons.includes(p.weapon)) errors.push(`combat/plans.yaml : ${p.id} : arme « ${p.weapon} » hors de la classe ${p.class}`);
    for (const [lvl, entries] of Object.entries(p.levels)) {
      const level = Number(lvl);
      if (!Number.isInteger(level) || level < 1 || level > 99) errors.push(`combat/plans.yaml : ${p.id} : niveau « ${lvl} »`);
      for (const e of planErrors(combat, p.class, p.path, level, entries)) errors.push(`combat/plans.yaml : ${p.id} (niveau ${lvl}) : ${e}`);
    }
  }
  return { combat, errors };
}
