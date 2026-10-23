/**
 * Premiers pas d'un nouveau joueur (relevé en jouant, 23 octobre : « après le tour guidé, on ne sait pas quoi faire »).
 * Le client en déduit la plupart de l'état du joueur (métiers, route, photo) ; le serveur répond pour ce qu'il est seul
 * à savoir : un clan, un passage au marché, une inscription à la Marée.
 */
import { eq, or } from 'drizzle-orm';
import type { FirstStepsView } from '@bramo/shared';
import type { Db } from './db/index.js';
import { clanMembers, marketOrders, marketTrades, tideSignups } from './db/schema.js';

export async function firstSteps(db: Db, characterId: number): Promise<FirstStepsView> {
  const [clan] = await db.select({ id: clanMembers.characterId }).from(clanMembers).where(eq(clanMembers.characterId, characterId)).limit(1);
  const [order] = await db.select({ id: marketOrders.id }).from(marketOrders).where(eq(marketOrders.characterId, characterId)).limit(1);
  const [trade] = order ? [order] : await db.select({ id: marketTrades.id }).from(marketTrades).where(or(eq(marketTrades.buyerId, characterId), eq(marketTrades.sellerId, characterId))).limit(1);
  const [tide] = await db.select({ day: tideSignups.day }).from(tideSignups).where(eq(tideSignups.characterId, characterId)).limit(1);
  return { clan: !!clan, market: !!trade, tide: !!tide };
}
