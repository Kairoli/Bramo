import { eq, inArray } from 'drizzle-orm';
import {
  type CharacterState,
  type Content,
  type GearInstance,
  GameError,
  addStack,
  cloneState,
  socketGem,
  honeLine,
  chooseReroll,
  rerollLine,
  salvageGear,
  rankUp,
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
      price: r.price,
      rank: r.rank,
      hones: r.hones,
      rerollLine: r.rerollLine,
      rerolls: r.rerolls,
      rerollOffer: r.rerollOffer,
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
  if (before.find((g) => g.id === id)?.price != null) throw new GameError('listed', 'Cette pièce est en vitrine : retirez-la d’abord.');
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
export async function wearGearSet(tx: Tx, characterId: number, classId: string | null, ids: number[], content: Content): Promise<{ model: string; lines: { name: string; value: number }[]; gem?: string; rank?: number }[]> {
  const before = await loadGear(tx, characterId);
  let after = before.map((g) => ({ ...g, equipped: null as string | null }));
  for (const id of ids) {
    const g = after.find((x) => x.id === id);
    if (!g || isWorn(g, content) || g.price != null) continue;
    try {
      after = equipGear(after, id, classId, content);
    } catch {
      // Pièce d'une autre classe ou modèle retiré : elle reste au sac.
    }
  }
  await saveEquipped(tx, before, after);
  return after.filter((g) => g.equipped && !isWorn(g, content) && content.gearModels[g.model]).map((g) => ({ model: g.model, lines: g.lines.map((l) => ({ name: l.name, value: l.value })), ...(g.gem ? { gem: g.gem } : {}), ...(g.rank ? { rank: g.rank } : {}) }));
}

/**
 * Sertir une gemme du sac dans une de ses pièces (l'ancienne revient au sac), ou la retirer (`itemId` null). Renvoie
 * l'état avec le sac à jour.
 */
export async function socketOwned(tx: Tx, characterId: number, input: CharacterState, id: number, itemId: string | null, content: Content): Promise<{ state: CharacterState; log: string }> {
  const before = await loadGear(tx, characterId);
  const state = cloneState(input);
  const piece = before.find((g) => g.id === id);
  if (piece?.price != null) throw new GameError('listed', 'Cette pièce est en vitrine : retirez-la d’abord.');
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

/**
 * L'Affineur du bourg : monter une pièce d'un rang (sans plafond), ou affûter une de ses lignes vers son maximum. Son or
 * est détruit ; la matière de la pièce est prise dans le sac.
 */
export async function refineOwned(
  tx: Tx,
  characterId: number,
  input: CharacterState,
  id: number,
  service: { kind: 'rank' } | { kind: 'hone'; line: number } | { kind: 'reroll'; line: number } | { kind: 'reroll_pick'; pick: number | null },
  content: Content,
  rand: Rng = Math.random,
): Promise<{ state: CharacterState; log: string; gold: number }> {
  const g = (await loadGear(tx, characterId)).find((x) => x.id === id);
  if (!g) throw new GameError('unknown_gear', 'Objet introuvable.');
  const name = content.gearModels[g.model]?.name ?? 'la pièce';
  if (service.kind === 'rank') {
    const r = rankUp(input, g, content);
    await tx.update(gearItems).set({ rank: r.gear.rank ?? 0 }).where(eq(gearItems.id, id));
    return { state: r.state, gold: r.cost.gold, log: `L’Affineur monte ${name} au rang +${r.gear.rank} (${r.cost.gold} or).` };
  }
  if (service.kind === 'reroll') {
    const r = rerollLine(input, g, service.line, content, rand);
    await tx.update(gearItems).set({ rerollLine: r.gear.rerollLine ?? null, rerolls: r.gear.rerolls ?? 0, rerollOffer: r.gear.rerollOffer ?? null }).where(eq(gearItems.id, id));
    const dust = r.cost.items.map((i) => `${i.qty} × ${content.items[i.item]?.name ?? i.item}`).join(', ');
    return { state: r.state, gold: r.cost.gold, log: `L’Affineur retaille ${name} : ${g.lines[service.line]?.name} (${r.cost.gold} or, ${dust}).` };
  }
  if (service.kind === 'reroll_pick') {
    const next = chooseReroll(g, service.pick);
    await tx.update(gearItems).set({ lines: next.lines, rerollOffer: null }).where(eq(gearItems.id, id));
    const l = next.lines[g.rerollLine ?? 0];
    return { state: input, gold: 0, log: service.pick === null ? `Vous gardez la ligne de ${name}.` : `${name} : nouvelle ligne ${l?.name} ${l?.value}.` };
  }
  const r = honeLine(input, g, service.line, content);
  await tx.update(gearItems).set({ lines: r.gear.lines, hones: r.gear.hones ?? 0 }).where(eq(gearItems.id, id));
  const l = r.gear.lines[service.line]!;
  return { state: r.state, gold: r.cost.gold, log: `L’Affineur affûte ${name} : ${l.name} ${l.value} (sur ${l.max}).` };
}

/**
 * Démonter des pièces du sac chez l'Affineur : elles disparaissent et leur poussière va au sac (docs/design/eclats.md §3).
 */
export async function salvageOwned(tx: Tx, characterId: number, input: CharacterState, ids: number[], content: Content): Promise<{ state: CharacterState; log: string }> {
  const owned = await loadGear(tx, characterId);
  const pieces = [...new Set(ids)].map((id) => owned.find((g) => g.id === id));
  if (pieces.some((g) => !g)) throw new GameError('unknown_gear', 'Objet introuvable.');
  const r = salvageGear(input, pieces as GearInstance[], content);
  await tx.delete(gearItems).where(inArray(gearItems.id, pieces.map((g) => g!.id)));
  const what = pieces.length === 1 ? (content.gearModels[pieces[0]!.model]?.name ?? 'une pièce') : `${pieces.length} pièces`;
  return { state: r.state, log: `L’Affineur démonte ${what} : ${r.qty} × ${content.items[r.item]?.name ?? r.item}.` };
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
