import { eq } from 'drizzle-orm';
import {
  type CharacterState,
  type Content,
  type GearInstance,
  GameError,
  addStack,
  cloneState,
  socketGem,
  unsocketGem,
  type Rng,
  dropMismatched,
  equipGear,
  isWorn,
  newInstance,
  unequipGear,
} from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { characters, gearItems } from './db/schema.js';

/** Les exemplaires d'un personnage, dans l'ordre de leur création. */
export async function loadGear(tx: Tx | Db, characterId: number): Promise<GearInstance[]> {
  const rows = await tx.select().from(gearItems).where(eq(gearItems.characterId, characterId));
  return rows
    .map((r) => ({
      id: r.id,
      model: r.modelId,
      lines: r.lines,
      masterpiece: r.masterpiece,
      signedBy: r.signedBy,
      wear: r.wear,
      equipped: r.equipped,
      gem: r.gem,
    }))
    .sort((a, b) => a.id - b.id);
}

/** Écrit les emplacements portés qui ont changé. */
async function saveEquipped(tx: Tx, before: GearInstance[], after: GearInstance[]): Promise<void> {
  for (const g of after) {
    const old = before.find((b) => b.id === g.id);
    if (old && old.equipped !== g.equipped) await tx.update(gearItems).set({ equipped: g.equipped }).where(eq(gearItems.id, g.id));
  }
}

export async function equipOwned(tx: Tx, characterId: number, state: CharacterState, id: number, content: Content): Promise<void> {
  const before = await loadGear(tx, characterId);
  await saveEquipped(tx, before, equipGear(before, id, state.classId, content));
}

export async function unequipOwned(tx: Tx, characterId: number, id: number): Promise<void> {
  const before = await loadGear(tx, characterId);
  await saveEquipped(tx, before, unequipGear(before, id));
}

/**
 * Préréglage : porter exactement ces exemplaires (ceux qui existent encore, du style de la classe et pas usés), le reste
 * retourne au sac. Renvoie l'équipement porté, sous la forme que le combat lit (`CharacterState.equipment`).
 */
export async function wearGearSet(tx: Tx, characterId: number, classId: string | null, ids: number[], content: Content): Promise<{ model: string; lines: { name: string; value: number }[]; gem?: string }[]> {
  const before = await loadGear(tx, characterId);
  let after = before.map((g) => ({ ...g, equipped: null as string | null }));
  for (const id of ids) {
    const g = after.find((x) => x.id === id);
    if (!g || isWorn(g, content)) continue;
    try {
      after = equipGear(after, id, classId, content);
    } catch {
      // Pièce d'une autre classe ou modèle retiré : elle reste au sac.
    }
  }
  await saveEquipped(tx, before, after);
  return after.filter((g) => g.equipped && !isWorn(g, content) && content.gearModels[g.model]).map((g) => ({ model: g.model, lines: g.lines.map((l) => ({ name: l.name, value: l.value })), ...(g.gem ? { gem: g.gem } : {}) }));
}

/**
 * Sertir une gemme du sac dans une de ses pièces (l'ancienne revient au sac), ou la retirer (`itemId` null). Renvoie
 * l'état avec le sac à jour.
 */
export async function socketOwned(tx: Tx, characterId: number, input: CharacterState, id: number, itemId: string | null, content: Content): Promise<{ state: CharacterState; log: string }> {
  const before = await loadGear(tx, characterId);
  const state = cloneState(input);
  const piece = before.find((g) => g.id === id);
  const pieceName = piece ? (content.gearModels[piece.model]?.name ?? 'la pièce') : 'la pièce';
  if (itemId === null) {
    const r = unsocketGem(before, id, content);
    await tx.update(gearItems).set({ gem: null }).where(eq(gearItems.id, id));
    addStack(state.inventory, r.give, 1);
    return { state, log: `Vous dessertissez ${content.items[r.give]?.name} de ${pieceName}.` };
  }
  if ((state.inventory[itemId] ?? 0) < 1) throw new GameError('missing', 'Vous n’avez pas cette gemme.');
  const r = socketGem(before, id, itemId, content);
  await tx.update(gearItems).set({ gem: r.items.find((g) => g.id === id)!.gem }).where(eq(gearItems.id, id));
  addStack(state.inventory, r.take, -1);
  if (r.give) addStack(state.inventory, r.give, 1);
  return { state, log: `Vous sertissez ${content.items[itemId]?.name} dans ${pieceName}.${r.give ? ` ${content.items[r.give]?.name} revient au sac.` : ''}` };
}

/** Changement de classe : les pièces qui ne sont pas du style de la nouvelle classe retournent au sac. */
export async function dropMismatchedOwned(tx: Tx, characterId: number, classId: string | null, content: Content): Promise<void> {
  const before = await loadGear(tx, characterId);
  await saveEquipped(tx, before, dropMismatched(before, classId, content));
}

/**
 * Set de départ d'une classe : donné et équipé la première fois que le personnage choisit cette classe (une fois par classe).
 * Les pièces sont liées au personnage. Renvoie true si le set vient d'être donné.
 */
export async function giveStarterGear(tx: Tx, characterId: number, classId: string | null, content: Content): Promise<boolean> {
  if (!classId) return false;
  const [row] = await tx.select({ given: characters.starterClasses }).from(characters).where(eq(characters.id, characterId));
  if (!row || row.given.includes(classId)) return false;
  for (const m of Object.values(content.gearModels)) {
    if (!m.starter || !m.classes.includes(classId)) continue;
    await tx.insert(gearItems).values({ characterId, modelId: m.id, lines: [], masterpiece: false, signedBy: null, wear: 0, equipped: m.slot });
  }
  await tx.update(characters).set({ starterClasses: [...row.given, classId] }).where(eq(characters.id, characterId));
  return true;
}

export interface GrantOptions {
  masterpiece?: boolean;
  chosen?: string[];
  signedBy?: string | null;
}

/** Crée un exemplaire dans le sac d'un personnage (butin, fabrication, ou obtention de test). */
export async function grantGear(tx: Tx, characterId: number, modelId: string, content: Content, rand: Rng, options: GrantOptions = {}): Promise<GearInstance> {
  const model = content.gearModels[modelId];
  if (!model) throw new GameError('unknown_model', 'Modèle d’équipement inconnu.');
  const g = newInstance(model, content, rand, options);
  const [row] = await tx
    .insert(gearItems)
    .values({ characterId, modelId, lines: g.lines, masterpiece: g.masterpiece, signedBy: g.signedBy, wear: 0, equipped: null })
    .returning();
  return { ...g, id: row!.id };
}
