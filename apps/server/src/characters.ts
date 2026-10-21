import { and, eq, inArray } from 'drizzle-orm';
import { type CharacterState, readEnergy } from '@bramo/shared';
import type { Tx } from './db/index.js';
import { characterItems, characterSkills, characters } from './db/schema.js';

export interface LoadedCharacter {
  id: number;
  name: string;
  state: CharacterState;
}

/** Charge le personnage d'un compte et verrouille sa ligne jusqu'à la fin de la transaction. */
export async function loadCharacterForUpdate(tx: Tx, accountId: number): Promise<LoadedCharacter | null> {
  const [row] = await tx.select().from(characters).where(eq(characters.accountId, accountId)).for('update');
  if (!row) return null;
  const skills = await tx.select().from(characterSkills).where(eq(characterSkills.characterId, row.id));
  const items = await tx.select().from(characterItems).where(eq(characterItems.characterId, row.id));
  return {
    id: row.id,
    name: row.name,
    state: {
      gold: row.gold,
      skills: Object.fromEntries(skills.map((s) => [s.skill, s.xp])),
      inventory: Object.fromEntries(items.map((i) => [i.itemId, i.qty])),
      activity: row.activity ?? null,
      queue: row.queue,
      lastTickAt: row.lastTickAt.getTime(),
      lastSeenAt: row.lastSeenAt.getTime(),
      // Les personnages créés avec l'ancienne énergie quotidienne repartent avec leurs coups de fouet du jour.
      energy: readEnergy(row.energy),
      buff: row.buff ?? null,
      classId: row.classId,
      outfit: row.outfit,
      trials: row.trials,
    },
  };
}

/** Enregistre l'état ; seules les lignes de métiers et d'objets modifiées sont écrites. */
export async function saveCharacter(tx: Tx, id: number, before: CharacterState, after: CharacterState): Promise<void> {
  await tx
    .update(characters)
    .set({
      gold: after.gold,
      activity: after.activity,
      queue: after.queue,
      energy: after.energy,
      buff: after.buff,
      classId: after.classId,
      outfit: after.outfit,
      trials: after.trials,
      lastTickAt: new Date(after.lastTickAt),
      lastSeenAt: new Date(after.lastSeenAt),
    })
    .where(eq(characters.id, id));

  const changedSkills = Object.entries(after.skills).filter(([k, xp]) => before.skills[k] !== xp);
  for (const [skill, xp] of changedSkills) {
    await tx
      .insert(characterSkills)
      .values({ characterId: id, skill, xp })
      .onConflictDoUpdate({ target: [characterSkills.characterId, characterSkills.skill], set: { xp } });
  }

  const changedItems = Object.entries(after.inventory).filter(([k, qty]) => before.inventory[k] !== qty);
  for (const [itemId, qty] of changedItems) {
    await tx
      .insert(characterItems)
      .values({ characterId: id, itemId, qty })
      .onConflictDoUpdate({ target: [characterItems.characterId, characterItems.itemId], set: { qty } });
  }
  const removed = Object.keys(before.inventory).filter((k) => !(k in after.inventory));
  if (removed.length) {
    await tx
      .delete(characterItems)
      .where(and(eq(characterItems.characterId, id), inArray(characterItems.itemId, removed)));
  }
}
