import { eq } from 'drizzle-orm';
import {
  type CharacterState,
  type Content,
  type GearInstance,
  GameError,
  type Rng,
  dropMismatched,
  equipGear,
  newInstance,
  unequipGear,
} from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { gearItems } from './db/schema.js';

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

/** Changement de classe : les pièces qui ne sont pas du style de la nouvelle classe retournent au sac. */
export async function dropMismatchedOwned(tx: Tx, characterId: number, classId: string | null, content: Content): Promise<void> {
  const before = await loadGear(tx, characterId);
  await saveEquipped(tx, before, dropMismatched(before, classId, content));
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
