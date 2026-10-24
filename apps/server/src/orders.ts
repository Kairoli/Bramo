/**
 * Commandes entre joueurs (docs/design/social.md §3 ; demande de Louis du 24 octobre : « je passe une commande à un membre
 * de mon clan, ou à un joueur reconnu, avec un prix et un délai ; il accepte ou refuse, et livre quand il a fini »).
 *
 * - Le client commande un objet (recette de métier) ou une pièce d'équipement à un artisan qui sait la faire. Son or (et,
 *   s'il le veut, ses matériaux : décidé par Louis) est mis de côté tout de suite.
 * - L'artisan accepte (les matériaux passent dans son sac, la date limite part) ou refuse ; sans réponse en
 *   `orders.answerHours` heures, la commande expire.
 * - Livrer : les objets (ou les pièces) passent au client, l'artisan touche le prix moins la taxe (détruite : un puits d'or)
 *   et la prime de commande ; « à temps » si avant la date limite.
 * - Le client annule une commande pas encore acceptée, ou en retard (son or revient ; les matériaux restent à l'artisan).
 * - Ce qui revient au client (objets livrés, remboursement d'un refus ou d'une expiration) lui est versé à son prochain
 *   passage (`claimOrders`), comme les ventes du marché : on ne touche jamais à l'état d'un autre joueur.
 */
import { and, desc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import {
  type CharacterState,
  type Content,
  GameError,
  type OrderDelay,
  type OrderKind,
  type OrderView,
  type OrdersView,
  addStack,
  applyPrime,
  cloneState,
  orderMaterials,
  orderTarget,
  primeFor,
  quoteOrder,
  skillLevel,
} from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { artisanOrders, characters, gearItems } from './db/schema.js';
import { loadCharacterById } from './characters.js';
import { insertEntries } from './journal.js';
import { people, relation } from './social.js';

type Conn = Tx | Db;
type Row = typeof artisanOrders.$inferSelect;

const DELAY_NAME: Record<OrderDelay, string> = { rush: 'pressé', normal: 'normal', relaxed: 'tranquille' };

/** Ce que le client fournit : ses matériaux pour la commande, autant qu'il en a, sans dépasser le besoin. */
function suppliedBy(state: CharacterState, kind: OrderKind, target: string, qty: number, content: Content) {
  const t = orderTarget(kind, target, content);
  if (!t) return [];
  return orderMaterials(t, qty)
    .map((m) => ({ item: m.item, qty: Math.min(m.qty, state.inventory[m.item] ?? 0) }))
    .filter((m) => m.qty > 0);
}

async function artisanState(db: Conn, artisanId: number, content: Content) {
  const loaded = await loadCharacterById(db as Tx, artisanId, content);
  if (!loaded) throw new GameError('no_player', 'Cet artisan est introuvable.');
  return loaded;
}

/** Le devis d'une commande (délais et prix conseillés), avec ce que le client fournirait. */
export async function quote(db: Conn, client: CharacterState, artisanId: number, kind: OrderKind, target: string, qty: number, supply: boolean, content: Content) {
  const t = orderTarget(kind, target, content);
  if (!t) throw new GameError('unknown', 'On ne peut pas commander cet objet.');
  const artisan = await artisanState(db, artisanId, content);
  const supplied = supply ? suppliedBy(client, kind, target, qty, content) : [];
  return { ...quoteOrder(t, qty, supplied, artisan.state.inventory, artisan.state, content), supplied };
}

/** Passer une commande (action du client). */
export async function createOrder(
  tx: Tx,
  clientId: number,
  clientName: string,
  input: CharacterState,
  req: { artisanId: number; kind: OrderKind; target: string; qty: number; supply: boolean; price: number; delay: OrderDelay; message?: string },
  now: number,
  content: Content,
): Promise<{ state: CharacterState; log: string }> {
  const rules = content.settings.orders;
  if (req.artisanId === clientId) throw new GameError('self', 'Vous ne pouvez pas vous passer commande.');
  if (req.qty > rules.maxQty) throw new GameError('too_many', `${rules.maxQty} au plus par commande.`);
  const rel = await relation(tx, clientId, req.artisanId);
  if (rel.blocked || !rel.canMessage) throw new GameError('closed', 'Ce joueur ne reçoit pas de commande de votre part.');
  const [artisanRow] = await tx.select({ open: characters.ordersOpen, name: characters.name }).from(characters).where(eq(characters.id, req.artisanId));
  if (!artisanRow) throw new GameError('no_player', 'Cet artisan est introuvable.');
  if (!artisanRow.open) throw new GameError('closed', `${artisanRow.name} ne prend pas de commandes pour le moment.`);
  const t = orderTarget(req.kind, req.target, content);
  if (!t) throw new GameError('unknown', 'On ne peut pas commander cet objet.');
  const artisan = await artisanState(tx, req.artisanId, content);
  if (skillLevel(artisan.state, t.profession, content) < t.level) throw new GameError('level', `${artisanRow.name} n’a pas encore le niveau pour le fabriquer.`);
  const [pending] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(artisanOrders)
    .where(and(eq(artisanOrders.clientId, clientId), eq(artisanOrders.status, 'proposed')));
  if ((pending?.n ?? 0) >= rules.maxPendingPerClient) throw new GameError('too_many', `${rules.maxPendingPerClient} commandes en attente au plus.`);
  const state = cloneState(input);
  const supplied = req.supply ? suppliedBy(state, req.kind, req.target, req.qty, content) : [];
  const q = quoteOrder(t, req.qty, supplied, artisan.state.inventory, artisan.state, content);
  const d = q.delays.find((x) => x.id === req.delay)!;
  // Le plafond : une commande ne doit pas servir à donner de l'or (multi-comptes, vente d'or).
  if (req.price > d.cap) throw new GameError('cap', `Au plus ${d.cap} or pour cette commande (trois fois le prix conseillé).`);
  if (req.price > state.gold) throw new GameError('gold', 'Pas assez d’or.');
  if (req.price === 0 && !supplied.length) throw new GameError('free', 'Proposez un prix, ou fournissez les matériaux.');
  state.gold -= req.price;
  for (const m of supplied) addStack(state.inventory, m.item, -m.qty);
  await tx.insert(artisanOrders).values({
    clientId,
    artisanId: req.artisanId,
    kind: req.kind,
    target: req.target,
    qty: req.qty,
    price: req.price,
    materials: supplied,
    delay: req.delay,
    delayHours: d.hours,
    message: req.message?.trim() || null,
    status: 'proposed',
    createdAt: new Date(now),
  });
  await insertEntries(tx, req.artisanId, [{ at: now, kind: 'info', text: `Commande : ${clientName} vous commande ${req.qty} × ${t.name} pour ${req.price} or (onglet Commandes du Marché).` }]);
  return { state, log: `Commande envoyée à ${artisanRow.name} : ${req.qty} × ${t.name}, ${req.price} or mis de côté${supplied.length ? ', matériaux fournis' : ''}.` };
}

/** Les commandes sans réponse depuis trop longtemps expirent (le client est remboursé à son prochain passage). */
async function expire(db: Conn, now: number, content: Content) {
  await db
    .update(artisanOrders)
    .set({ status: 'expired', closedAt: new Date(now) })
    .where(and(eq(artisanOrders.status, 'proposed'), lt(artisanOrders.createdAt, new Date(now - content.settings.orders.answerHours * 3_600_000))));
}

async function rowFor(tx: Tx, id: number) {
  const [row] = await tx.select().from(artisanOrders).where(eq(artisanOrders.id, id));
  if (!row) throw new GameError('gone', 'Cette commande n’existe plus.');
  return row;
}

/** Accepter ou refuser (action de l'artisan). */
export async function answerOrder(tx: Tx, artisanId: number, artisanName: string, input: CharacterState, id: number, accept: boolean, now: number, content: Content): Promise<{ state: CharacterState; log: string }> {
  await expire(tx, now, content);
  const row = await rowFor(tx, id);
  if (row.artisanId !== artisanId) throw new GameError('not_yours', 'Cette commande ne vous est pas adressée.');
  if (row.status !== 'proposed') throw new GameError('closed', 'Cette commande n’attend plus de réponse.');
  const name = orderTarget(row.kind as OrderKind, row.target, content)?.name ?? row.target;
  if (!accept) {
    await tx.update(artisanOrders).set({ status: 'refused', closedAt: new Date(now) }).where(eq(artisanOrders.id, id));
    await insertEntries(tx, row.clientId, [{ at: now, kind: 'info', text: `Commande : ${artisanName} a refusé ${row.qty} × ${name}. Votre or vous revient.` }]);
    return { state: input, log: `Commande refusée : ${row.qty} × ${name}.` };
  }
  const [busy] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(artisanOrders)
    .where(and(eq(artisanOrders.artisanId, artisanId), eq(artisanOrders.status, 'accepted')));
  if ((busy?.n ?? 0) >= content.settings.orders.maxAcceptedPerArtisan) throw new GameError('too_many', `${content.settings.orders.maxAcceptedPerArtisan} commandes acceptées en même temps au plus.`);
  const state = cloneState(input);
  for (const m of row.materials) addStack(state.inventory, m.item, m.qty);
  const deadline = new Date(now + row.delayHours * 3_600_000);
  await tx.update(artisanOrders).set({ status: 'accepted', acceptedAt: new Date(now), deadline }).where(eq(artisanOrders.id, id));
  await insertEntries(tx, row.clientId, [{ at: now, kind: 'info', text: `Commande : ${artisanName} a accepté ${row.qty} × ${name}, à livrer avant le ${deadline.toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.` }]);
  return { state, log: `Commande acceptée : ${row.qty} × ${name}${row.materials.length ? ' (matériaux reçus)' : ''}.` };
}

/** Pièces d'équipement de l'artisan qu'il peut livrer pour un modèle : dans le sac, ni portées ni en vitrine. */
async function deliverableGear(tx: Tx, artisanId: number, model: string) {
  return tx
    .select({ id: gearItems.id })
    .from(gearItems)
    .where(and(eq(gearItems.characterId, artisanId), eq(gearItems.modelId, model), isNull(gearItems.equipped), isNull(gearItems.price)))
    .orderBy(desc(gearItems.id));
}

/** Livrer (action de l'artisan) : il faut avoir ce qui est commandé. */
export async function deliverOrder(tx: Tx, artisanId: number, artisanName: string, input: CharacterState, id: number, now: number, content: Content): Promise<{ state: CharacterState; log: string }> {
  const row = await rowFor(tx, id);
  if (row.artisanId !== artisanId) throw new GameError('not_yours', 'Cette commande ne vous est pas adressée.');
  if (row.status !== 'accepted') throw new GameError('closed', 'Cette commande n’est pas à livrer.');
  const name = orderTarget(row.kind as OrderKind, row.target, content)?.name ?? row.target;
  const state = cloneState(input);
  if (row.kind === 'item') {
    if ((state.inventory[row.target] ?? 0) < row.qty) throw new GameError('missing', `Il vous faut ${row.qty} × ${name} dans votre sac.`);
    addStack(state.inventory, row.target, -row.qty);
    // La prime de commande, comme en livrant un ordre d'achat du marché.
    const prime = primeFor(state, row.target, row.qty, now, content);
    if (prime) applyPrime(state, prime, now, content);
  } else {
    const pieces = await deliverableGear(tx, artisanId, row.target);
    if (pieces.length < row.qty) throw new GameError('missing', `Il vous faut ${row.qty} × ${name} dans votre sac d’équipement (ni portée, ni en vitrine).`);
    await tx
      .update(gearItems)
      .set({ characterId: row.clientId, equipped: null, price: null })
      .where(inArray(gearItems.id, pieces.slice(0, row.qty).map((p) => p.id)));
  }
  const tax = Math.round(row.price * content.settings.orders.taxShare);
  state.gold += row.price - tax;
  const onTime = !row.deadline || now <= row.deadline.getTime();
  await tx.update(artisanOrders).set({ status: 'delivered', closedAt: new Date(now), onTime }).where(eq(artisanOrders.id, id));
  await insertEntries(tx, row.clientId, [{ at: now, kind: 'info', text: `Commande : ${artisanName} vous a livré ${row.qty} × ${name}${onTime ? '' : ' (en retard)'}.` }]);
  return { state, log: `Commande livrée : ${row.qty} × ${name}, +${row.price - tax} or (taxe ${tax}).` };
}

/** Annuler (action du client) : une commande pas encore acceptée, ou en retard. */
export async function cancelOrder(tx: Tx, clientId: number, input: CharacterState, id: number, now: number, content: Content): Promise<{ state: CharacterState; log: string }> {
  await expire(tx, now, content);
  const row = await rowFor(tx, id);
  if (row.clientId !== clientId) throw new GameError('not_yours', 'Ce n’est pas votre commande.');
  const late = row.status === 'accepted' && row.deadline && now > row.deadline.getTime();
  if (row.status !== 'proposed' && !late) throw new GameError('closed', row.status === 'accepted' ? 'Elle est acceptée : vous pourrez l’annuler si elle est en retard.' : 'Cette commande est terminée.');
  const state = cloneState(input);
  state.gold += row.price;
  // Pas encore acceptée : les matériaux reviennent ; acceptée, ils sont déjà chez l'artisan.
  if (row.status === 'proposed') for (const m of row.materials) addStack(state.inventory, m.item, m.qty);
  await tx.update(artisanOrders).set({ status: 'cancelled', closedAt: new Date(now), clientSettled: true }).where(eq(artisanOrders.id, id));
  const name = orderTarget(row.kind as OrderKind, row.target, content)?.name ?? row.target;
  await insertEntries(tx, row.artisanId, [{ at: now, kind: 'info', text: `Commande : la commande de ${row.qty} × ${name} a été annulée par le client.` }]);
  return { state, log: `Commande annulée : ${row.price} or vous reviennent${row.status === 'proposed' && row.materials.length ? ', et vos matériaux' : ''}.` };
}

/**
 * Ce qui revient au client, à son passage : les objets d'une commande livrée, le remboursement d'une commande refusée ou
 * expirée. Rend les lignes du journal.
 */
export async function claimOrders(tx: Tx, clientId: number, state: CharacterState, now: number, content: Content): Promise<string[]> {
  await expire(tx, now, content);
  const rows = await tx
    .select()
    .from(artisanOrders)
    .where(and(eq(artisanOrders.clientId, clientId), eq(artisanOrders.clientSettled, false), inArray(artisanOrders.status, ['delivered', 'refused', 'expired'])));
  const lines: string[] = [];
  for (const r of rows) {
    const name = orderTarget(r.kind as OrderKind, r.target, content)?.name ?? r.target;
    if (r.status === 'delivered') {
      if (r.kind === 'item') addStack(state.inventory, r.target, r.qty);
      lines.push(`Commande reçue : ${r.qty} × ${name}${r.kind === 'gear' ? ' (sac d’équipement)' : ''}.`);
    } else {
      state.gold += r.price;
      for (const m of r.materials) addStack(state.inventory, m.item, m.qty);
      lines.push(`Commande ${r.status === 'refused' ? 'refusée' : 'expirée'} : ${r.qty} × ${name}, ${r.price} or${r.materials.length ? ' et vos matériaux' : ''} vous reviennent.`);
    }
    await tx.update(artisanOrders).set({ clientSettled: true }).where(eq(artisanOrders.id, r.id));
  }
  return lines;
}

function view(r: Row, me: number, persons: Map<number, import('@bramo/shared').SocialPerson>, ready: boolean, content: Content): OrderView {
  const t = orderTarget(r.kind as OrderKind, r.target, content);
  const tax = Math.round(r.price * content.settings.orders.taxShare);
  const due = r.status === 'proposed' ? r.createdAt.getTime() + content.settings.orders.answerHours * 3_600_000 : (r.deadline?.getTime() ?? 0);
  return {
    id: r.id,
    mine: r.clientId === me,
    client: persons.get(r.clientId)!,
    artisan: persons.get(r.artisanId)!,
    kind: r.kind as OrderKind,
    target: r.target,
    name: t?.name ?? r.target,
    profession: t?.profession ?? '',
    gear: t?.gear ?? null,
    qty: r.qty,
    price: r.price,
    net: r.price - tax,
    materials: r.materials,
    delay: r.delay as OrderDelay,
    delayHours: r.delayHours,
    message: r.message,
    status: r.status as OrderView['status'],
    createdAt: r.createdAt.getTime(),
    dueAt: due,
    closedAt: r.closedAt?.getTime() ?? null,
    onTime: r.onTime,
    ready,
  };
}

/** Mes commandes : celles que j'ai passées, celles qu'on m'a passées (les terminées des 14 derniers jours). */
export async function ordersView(db: Db, me: number, myState: CharacterState | null, now: number, content: Content): Promise<OrdersView> {
  await expire(db, now, content);
  const since = new Date(now - 14 * 86_400_000);
  const rows = await db
    .select()
    .from(artisanOrders)
    .where(and(or(eq(artisanOrders.clientId, me), eq(artisanOrders.artisanId, me)), or(inArray(artisanOrders.status, ['proposed', 'accepted']), sql`${artisanOrders.closedAt} > ${since}`)))
    .orderBy(desc(artisanOrders.id))
    .limit(100);
  const persons = await people(db, rows.flatMap((r) => [r.clientId, r.artisanId]), now, content);
  const out: OrdersView = { asClient: [], asArtisan: [], open: true };
  for (const r of rows) {
    let ready = false;
    if (r.artisanId === me && r.status === 'accepted') {
      if (r.kind === 'item') ready = (myState?.inventory[r.target] ?? 0) >= r.qty;
      else ready = (await deliverableGear(db as unknown as Tx, me, r.target)).length >= r.qty;
    }
    (r.clientId === me ? out.asClient : out.asArtisan).push(view(r, me, persons, ready, content));
  }
  const [mine] = await db.select({ open: characters.ordersOpen }).from(characters).where(eq(characters.id, me));
  out.open = mine?.open ?? true;
  return out;
}

export async function setOrdersOpen(tx: Tx, me: number, open: boolean): Promise<void> {
  await tx.update(characters).set({ ordersOpen: open }).where(eq(characters.id, me));
}

/** La réputation d'un artisan : commandes livrées, et livrées à temps. */
export async function artisanReputation(db: Conn, id: number): Promise<{ delivered: number; onTime: number }> {
  const [r] = await db
    .select({ delivered: sql<number>`count(*)::int`, onTime: sql<number>`count(*) filter (where ${artisanOrders.onTime})::int` })
    .from(artisanOrders)
    .where(and(eq(artisanOrders.artisanId, id), eq(artisanOrders.status, 'delivered')));
  return { delivered: r?.delivered ?? 0, onTime: r?.onTime ?? 0 };
}

export { DELAY_NAME };
