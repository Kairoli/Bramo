/**
 * L'atelier et la vitrine de l'équipement (moteur : packages/shared/src/engine/gearCraft.ts).
 *
 * - Atelier : fabriquer une pièce (niveau et matières), rangée dans le sac d'équipement, signée si chef-d'œuvre.
 * - Vitrine : mettre une pièce en vente à son prix (elle quitte le corps et ne se porte plus), l'acheter (elle change de
 *   propriétaire tout de suite), retirer une offre. L'or du vendeur, taxe déduite, lui arrive à sa prochaine visite.
 *   Le set de départ est lié au personnage : il ne se vend pas.
 */
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { type CharacterState, type Content, type GearListingView, GameError, cloneState, craftGear, netProceeds, stream, viewGear } from '@bramo/shared';
import type { Tx } from './db/index.js';
import { characters, gearItems, gearSales } from './db/schema.js';

export async function craftOwned(tx: Tx, characterId: number, name: string, state: CharacterState, modelId: string, content: Content, now: number) {
  const rand = stream(characterId, `craft:${modelId}:${now}`);
  const r = craftGear(state, modelId, content, rand, name);
  await tx.insert(gearItems).values({ characterId, modelId, lines: r.gear.lines, masterpiece: r.gear.masterpiece, signedBy: r.gear.signedBy, wear: 0, equipped: null });
  return r;
}

export async function listGear(tx: Tx, characterId: number, id: number, price: number, content: Content): Promise<void> {
  const [g] = await tx.select().from(gearItems).where(and(eq(gearItems.id, id), eq(gearItems.characterId, characterId))).for('update');
  if (!g) throw new GameError('unknown_gear', 'Objet introuvable.');
  const m = content.gearModels[g.modelId];
  if (!m || m.bound || m.starter) throw new GameError('bound', 'Cette pièce est liée à votre personnage : elle ne se vend pas.');
  await tx.update(gearItems).set({ price, equipped: null }).where(eq(gearItems.id, id));
}

export async function unlistGear(tx: Tx, characterId: number, id: number): Promise<void> {
  const [g] = await tx.select().from(gearItems).where(and(eq(gearItems.id, id), eq(gearItems.characterId, characterId))).for('update');
  if (!g || g.price === null) throw new GameError('not_listed', 'Cette pièce n’est pas en vitrine.');
  await tx.update(gearItems).set({ price: null }).where(eq(gearItems.id, id));
}

/** Acheter une pièce en vitrine : l'or part tout de suite, la pièce arrive dans le sac ; le vendeur sera payé à sa visite. */
export async function buyGear(tx: Tx, buyerId: number, input: CharacterState, id: number, content: Content, now: number): Promise<{ state: CharacterState; name: string; price: number }> {
  const [g] = await tx.select().from(gearItems).where(eq(gearItems.id, id)).for('update');
  if (!g || g.price === null) throw new GameError('sold', 'Cette pièce n’est plus en vente.');
  if (g.characterId === buyerId) throw new GameError('own_listing', 'C’est votre propre offre.');
  if (input.gold < g.price) throw new GameError('gold', `Il faut ${g.price} or.`);
  const state = cloneState(input);
  state.gold -= g.price;
  await tx.update(gearItems).set({ characterId: buyerId, price: null, equipped: null }).where(eq(gearItems.id, id));
  await tx.insert(gearSales).values({ sellerId: g.characterId, modelId: g.modelId, gold: netProceeds(g.price, content), at: new Date(now) });
  return { state, name: content.gearModels[g.modelId]?.name ?? g.modelId, price: g.price };
}

/** L'or des pièces vendues depuis la dernière visite. */
export async function claimGearSales(tx: Tx, characterId: number, state: CharacterState, content: Content): Promise<string[]> {
  const rows = await tx.select().from(gearSales).where(eq(gearSales.sellerId, characterId)).for('update');
  const lines: string[] = [];
  for (const r of rows) {
    state.gold += r.gold;
    lines.push(`Vitrine : ${content.gearModels[r.modelId]?.name ?? r.modelId} vendue, +${r.gold} or (taxe déduite).`);
    await tx.delete(gearSales).where(eq(gearSales.id, r.id));
  }
  return lines;
}

/** Les pièces en vitrine, filtrées par emplacement, classe et palier, les moins chères d'abord. */
export async function gearListings(tx: Tx, viewerId: number, filter: { slot?: string; classId?: string; tier?: number }, content: Content): Promise<GearListingView[]> {
  const rows = await tx
    .select({ g: gearItems, seller: characters.name })
    .from(gearItems)
    .innerJoin(characters, eq(characters.id, gearItems.characterId))
    .where(isNotNull(gearItems.price))
    .orderBy(asc(gearItems.price))
    .limit(400);
  const out: GearListingView[] = [];
  for (const { g, seller } of rows) {
    const m = content.gearModels[g.modelId];
    if (!m) continue;
    if (filter.slot && m.slot !== filter.slot) continue;
    if (filter.classId && !m.classes.includes(filter.classId)) continue;
    if (filter.tier !== undefined && m.tier !== filter.tier) continue;
    const item = viewGear([{ id: g.id, model: g.modelId, lines: g.lines, masterpiece: g.masterpiece, signedBy: g.signedBy, wear: g.wear, equipped: null, gem: g.gem, price: g.price }], filter.classId ?? null, content).items[0]!;
    out.push({ id: g.id, price: g.price!, seller, mine: g.characterId === viewerId, item });
    if (out.length >= 80) break;
  }
  return out;
}
