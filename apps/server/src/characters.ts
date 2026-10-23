import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { type CharacterState, type Content, readCombat, readEnergy } from '@bramo/shared';
import { banquetOfCharacter, bonusesOfCharacter } from './clans.js';
import type { Tx } from './db/index.js';
import { characterItems, characterSkills, characters, gearItems } from './db/schema.js';

export interface LoadedCharacter {
  id: number;
  name: string;
  state: CharacterState;
}

/** Charge le personnage d'un compte et verrouille sa ligne jusqu'à la fin de la transaction. */
export async function loadCharacterForUpdate(tx: Tx, accountId: number, content: Content): Promise<LoadedCharacter | null> {
  const [row] = await tx.select().from(characters).where(eq(characters.accountId, accountId)).for('update');
  if (!row) return null;
  return fromRow(tx, row, content);
}

/** Charge un personnage par son identifiant, sans verrou (lecture : règlement de la Marée du soir). */
export async function loadCharacterById(tx: Tx, id: number, content: Content): Promise<LoadedCharacter | null> {
  const [row] = await tx.select().from(characters).where(eq(characters.id, id));
  return row ? fromRow(tx, row, content) : null;
}

async function fromRow(tx: Tx, row: typeof characters.$inferSelect, content: Content): Promise<LoadedCharacter> {
  const skills = await tx.select().from(characterSkills).where(eq(characterSkills.characterId, row.id));
  const items = await tx.select().from(characterItems).where(eq(characterItems.characterId, row.id));
  // Bonus de clan : ceux des bâtiments du clan, sinon ceux de la Guilde du bourg.
  const clanBonuses = await bonusesOfCharacter(tx, row.id, content);
  const banquet = await banquetOfCharacter(tx, row.id, content);
  // Équipement porté : la famille de l'arme règle la cadence de l'attaque de base ; les pièces non usées font les
  // statistiques, les ensembles et les objets nommés du combat.
  const worn = await tx.select().from(gearItems).where(and(eq(gearItems.characterId, row.id), isNotNull(gearItems.equipped)));
  const weapon = worn.find((g) => g.equipped === 'weapon');
  const weaponFamily = weapon ? (content.gearModels[weapon.modelId]?.family ?? null) : null;
  const life = content.settings.gear.lifeHours * 3_600_000;
  const equipment = worn.filter((g) => g.wear < life && content.gearModels[g.modelId]).map((g) => ({ model: g.modelId, lines: g.lines.map((l) => ({ name: l.name, value: l.value })), ...(g.gem ? { gem: g.gem } : {}), ...(g.rank ? { rank: g.rank } : {}) }));
  return {
    id: row.id,
    name: row.name,
    state: {
      seed: row.id,
      clanBonuses,
      banquet,
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
      // Ancien format (un nombre par objet) : un seul exemplaire usé.
      wear: Object.fromEntries(Object.entries(row.wear as Record<string, number | number[]>).map(([k, v]) => [k, Array.isArray(v) ? v : [v]])),
      pantry: row.pantry,
      npc: row.npc,
      prime: row.prime,
      classId: row.classId,
      outfit: row.outfit,
      look: row.look,
      trials: row.trials,
      shown: row.shown,
      ornament: row.ornament,
      tourDone: row.tourDone,
      combat: readCombat(row.combat),
      weaponFamily,
      equipment,
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
      wear: after.wear,
      pantry: after.pantry,
      npc: after.npc,
      prime: after.prime,
      classId: after.classId,
      outfit: after.outfit,
      look: after.look,
      trials: after.trials,
      shown: after.shown,
      ornament: after.ornament,
      tourDone: !!after.tourDone,
      combat: after.combat,
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
