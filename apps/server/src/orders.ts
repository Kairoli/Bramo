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
 * - Commande ouverte (social.md §4.4) : sans artisan, sur le panneau du clan ou du serveur ; le premier qui sait la faire
 *   la prend (`takeOrder`) ; sans preneur en `orders.openHours` heures, elle expire.
 * - Ce qui revient au client (objets livrés, remboursement d'un refus ou d'une expiration) lui est versé à son prochain
 *   passage (`claimOrders`), comme les ventes du marché : on ne touche jamais à l'état d'un autre joueur.
 */
import { and, desc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import {
  type CharacterState,
  type Content,
  GameError,
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
import { artisanOrders, blocks, characters, clanMembers, gearItems } from './db/schema.js';
import { loadCharacterById } from './characters.js';
import { logLine } from './clans.js';
import { insertEntries } from './journal.js';
import { people, relation } from './social.js';

type Conn = Tx | Db;
type Row = typeof artisanOrders.$inferSelect;

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

/** Le devis d'une commande (délai le plus court, plafond de prix), avec ce que le client fournirait. */
export async function quote(db: Conn, client: CharacterState, artisanId: number | undefined, kind: OrderKind, target: string, qty: number, supply: boolean, content: Content) {
  const t = orderTarget(kind, target, content);
  if (!t) throw new GameError('unknown', 'On ne peut pas commander cet objet.');
  const supplied = supply ? suppliedBy(client, kind, target, qty, content) : [];
  // Commande ouverte : on ne sait pas encore qui la fera (ni son stock, ni ses niveaux).
  if (artisanId === undefined) return { ...quoteOrder(t, qty, supplied, {}, null, content), supplied };
  const artisan = await artisanState(db, artisanId, content);
  return { ...quoteOrder(t, qty, supplied, artisan.state.inventory, artisan.state, content), supplied };
}

/** Le clan d'un personnage (ou null). */
async function clanOf(db: Conn, id: number): Promise<number | null> {
  const [m] = await db.select({ clanId: clanMembers.clanId }).from(clanMembers).where(eq(clanMembers.characterId, id));
  return m?.clanId ?? null;
}

/** Un blocage entre deux joueurs, dans un sens ou dans l'autre. */
async function blockedBetween(db: Conn, a: number, b: number): Promise<boolean> {
  const [row] = await db
    .select({ id: blocks.blockerId })
    .from(blocks)
    .where(or(and(eq(blocks.blockerId, a), eq(blocks.blockedId, b)), and(eq(blocks.blockerId, b), eq(blocks.blockedId, a))));
  return !!row;
}

/** Passer une commande (action du client). */
export async function createOrder(
  tx: Tx,
  clientId: number,
  clientName: string,
  input: CharacterState,
  req: { artisanId?: number; scope?: 'clan' | 'server'; kind: OrderKind; target: string; qty: number; supply: boolean; price: number; delayHours: number; message?: string },
  now: number,
  content: Content,
): Promise<{ state: CharacterState; log: string }> {
  const rules = content.settings.orders;
  const t = orderTarget(req.kind, req.target, content);
  if (!t) throw new GameError('unknown', 'On ne peut pas commander cet objet.');
  if (req.qty > rules.maxQty) throw new GameError('too_many', `${rules.maxQty} au plus par commande.`);
  // Commande ouverte (social.md §4.4) : pas d'artisan, sur le panneau du clan ou du serveur ; le premier qui sait la faire la prend.
  const open = req.artisanId === undefined;
  let clanId: number | null = null;
  let artisan: Awaited<ReturnType<typeof artisanState>> | null = null;
  let artisanName = '';
  if (open) {
    if (!req.scope) throw new GameError('scope', 'Choisissez où afficher la commande : votre clan ou tout le serveur.');
    if (req.scope === 'clan') {
      clanId = await clanOf(tx, clientId);
      if (clanId === null) throw new GameError('no_clan', 'Vous n’avez pas de clan.');
    }
  } else {
    const artisanId = req.artisanId!;
    if (artisanId === clientId) throw new GameError('self', 'Vous ne pouvez pas vous passer commande.');
    const rel = await relation(tx, clientId, artisanId);
    if (rel.blocked || !rel.canMessage) throw new GameError('closed', 'Ce joueur ne reçoit pas de commande de votre part.');
    const [artisanRow] = await tx.select({ open: characters.ordersOpen, name: characters.name }).from(characters).where(eq(characters.id, artisanId));
    if (!artisanRow) throw new GameError('no_player', 'Cet artisan est introuvable.');
    if (!artisanRow.open) throw new GameError('closed', `${artisanRow.name} ne prend pas de commandes pour le moment.`);
    artisanName = artisanRow.name;
    artisan = await artisanState(tx, artisanId, content);
    if (skillLevel(artisan.state, t.profession, content) < t.level) throw new GameError('level', `${artisanName} n’a pas encore le niveau pour le fabriquer.`);
  }
  const [pending] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(artisanOrders)
    .where(and(eq(artisanOrders.clientId, clientId), inArray(artisanOrders.status, ['proposed', 'open'])));
  if ((pending?.n ?? 0) >= rules.maxPendingPerClient) throw new GameError('too_many', `${rules.maxPendingPerClient} commandes en attente au plus.`);
  const state = cloneState(input);
  const supplied = req.supply ? suppliedBy(state, req.kind, req.target, req.qty, content) : [];
  const q = quoteOrder(t, req.qty, supplied, artisan?.state.inventory ?? {}, artisan?.state ?? null, content);
  // Le délai est libre, mais faisable : au moins le temps de fabrication plus une marge.
  if (req.delayHours < q.minHours) throw new GameError('delay', `Au moins ${q.minHours} h : le temps de le fabriquer.`);
  if (req.delayHours > q.maxHours) throw new GameError('delay', `Au plus ${Math.round(q.maxHours / 24)} jours.`);
  // Le plafond : une commande ne doit pas servir à donner de l'or (multi-comptes, vente d'or).
  if (req.price > q.cap) throw new GameError('cap', `Au plus ${q.cap} or pour cette commande : une commande ne peut pas servir à donner de l’or.`);
  if (req.price > state.gold) throw new GameError('gold', 'Pas assez d’or.');
  if (req.price === 0 && !supplied.length) throw new GameError('free', 'Proposez un prix, ou fournissez les matériaux.');
  state.gold -= req.price;
  for (const m of supplied) addStack(state.inventory, m.item, -m.qty);
  await tx.insert(artisanOrders).values({
    clientId,
    artisanId: open ? null : req.artisanId!,
    scope: open ? req.scope! : 'direct',
    clanId,
    kind: req.kind,
    target: req.target,
    qty: req.qty,
    price: req.price,
    materials: supplied,
    delayHours: req.delayHours,
    message: req.message?.trim() || null,
    status: open ? 'open' : 'proposed',
    createdAt: new Date(now),
  });
  const kept = `${req.price} or mis de côté${supplied.length ? ', matériaux fournis' : ''}`;
  if (open) {
    if (clanId !== null) await logLine(tx, clanId, now, `${clientName} cherche un artisan : ${req.qty} × ${t.name} pour ${req.price} or (Marché, Commandes).`, content.settings.clan.logSize);
    return { state, log: `Commande affichée ${req.scope === 'clan' ? 'pour votre clan' : 'pour tout le serveur'} : ${req.qty} × ${t.name}, ${kept}. Le premier artisan qui la prend la fera.` };
  }
  await insertEntries(tx, req.artisanId!, [{ at: now, kind: 'info', text: `Commande : ${clientName} vous commande ${req.qty} × ${t.name} pour ${req.price} or (onglet Commandes du Marché).` }]);
  return { state, log: `Commande envoyée à ${artisanName} : ${req.qty} × ${t.name}, ${kept}.` };
}

/** Prendre une commande ouverte (action de l'artisan) : elle devient la sienne, acceptée, et sa date limite part. */
export async function takeOrder(tx: Tx, artisanId: number, artisanName: string, input: CharacterState, id: number, now: number, content: Content): Promise<{ state: CharacterState; log: string }> {
  await expire(tx, now, content);
  const row = await rowFor(tx, id);
  if (row.status !== 'open') throw new GameError('taken', 'Cette commande n’est plus sur le panneau (déjà prise, annulée ou expirée).');
  if (row.clientId === artisanId) throw new GameError('self', 'C’est votre propre commande.');
  if (row.scope === 'clan' && (row.clanId === null || (await clanOf(tx, artisanId)) !== row.clanId)) throw new GameError('not_clan', 'Cette commande est réservée au clan du client.');
  if (await blockedBetween(tx, artisanId, row.clientId)) throw new GameError('closed', 'Vous ne pouvez pas prendre la commande de ce joueur.');
  const t = orderTarget(row.kind as OrderKind, row.target, content);
  if (!t) throw new GameError('unknown', 'Cet objet ne se commande plus.');
  if (skillLevel(input, t.profession, content) < t.level) throw new GameError('level', `Il faut ${content.professions.find((p) => p.id === t.profession)?.name ?? t.profession} niveau ${t.level}.`);
  const [busy] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(artisanOrders)
    .where(and(eq(artisanOrders.artisanId, artisanId), eq(artisanOrders.status, 'accepted')));
  if ((busy?.n ?? 0) >= content.settings.orders.maxAcceptedPerArtisan) throw new GameError('too_many', `${content.settings.orders.maxAcceptedPerArtisan} commandes acceptées en même temps au plus.`);
  const deadline = new Date(now + row.delayHours * 3_600_000);
  // Le premier qui la prend : la condition sur le statut évite que deux artisans la prennent en même temps.
  const taken = await tx
    .update(artisanOrders)
    .set({ artisanId, status: 'accepted', acceptedAt: new Date(now), deadline })
    .where(and(eq(artisanOrders.id, id), eq(artisanOrders.status, 'open')))
    .returning({ id: artisanOrders.id });
  if (!taken.length) throw new GameError('taken', 'Un autre artisan vient de la prendre.');
  const state = cloneState(input);
  for (const m of row.materials) addStack(state.inventory, m.item, m.qty);
  await insertEntries(tx, row.clientId, [{ at: now, kind: 'info', text: `Commande : ${artisanName} a pris votre commande de ${row.qty} × ${t.name}, à livrer avant le ${deadline.toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.` }]);
  return { state, log: `Commande prise : ${row.qty} × ${t.name}, ${row.price - Math.round(row.price * content.settings.orders.taxShare)} or à la livraison${row.materials.length ? ' (matériaux reçus)' : ''}.` };
}

/** Les commandes sans réponse depuis trop longtemps expirent (le client est remboursé à son prochain passage). */
async function expire(db: Conn, now: number, content: Content) {
  const rules = content.settings.orders;
  await db
    .update(artisanOrders)
    .set({ status: 'expired', closedAt: new Date(now) })
    .where(
      or(
        and(eq(artisanOrders.status, 'proposed'), lt(artisanOrders.createdAt, new Date(now - rules.answerHours * 3_600_000))),
        // Une commande ouverte que personne n'a prise.
        and(eq(artisanOrders.status, 'open'), lt(artisanOrders.createdAt, new Date(now - rules.openHours * 3_600_000))),
      ),
    );
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
  const waiting = row.status === 'proposed' || row.status === 'open';
  if (!waiting && !late) throw new GameError('closed', row.status === 'accepted' ? 'Elle est acceptée : vous pourrez l’annuler si elle est en retard.' : 'Cette commande est terminée.');
  const state = cloneState(input);
  state.gold += row.price;
  // Pas encore acceptée : les matériaux reviennent ; acceptée, ils sont déjà chez l'artisan.
  if (waiting) for (const m of row.materials) addStack(state.inventory, m.item, m.qty);
  const done = await tx
    .update(artisanOrders)
    .set({ status: 'cancelled', closedAt: new Date(now), clientSettled: true })
    .where(and(eq(artisanOrders.id, id), eq(artisanOrders.status, row.status)))
    .returning({ id: artisanOrders.id });
  if (!done.length) throw new GameError('taken', 'Elle vient d’être prise par un artisan.');
  const name = orderTarget(row.kind as OrderKind, row.target, content)?.name ?? row.target;
  if (row.artisanId !== null) await insertEntries(tx, row.artisanId, [{ at: now, kind: 'info', text: `Commande : la commande de ${row.qty} × ${name} a été annulée par le client.` }]);
  return { state, log: `Commande annulée : ${row.price} or vous reviennent${waiting && row.materials.length ? ', et vos matériaux' : ''}.` };
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

function view(r: Row, me: number, persons: Map<number, import('@bramo/shared').SocialPerson>, ready: boolean, canTake: boolean, content: Content): OrderView {
  const t = orderTarget(r.kind as OrderKind, r.target, content);
  const rules = content.settings.orders;
  const tax = Math.round(r.price * rules.taxShare);
  const due =
    r.status === 'proposed' ? r.createdAt.getTime() + rules.answerHours * 3_600_000 : r.status === 'open' ? r.createdAt.getTime() + rules.openHours * 3_600_000 : (r.deadline?.getTime() ?? 0);
  return {
    id: r.id,
    mine: r.clientId === me,
    client: persons.get(r.clientId)!,
    artisan: r.artisanId === null ? null : (persons.get(r.artisanId) ?? null),
    scope: r.scope as OrderView['scope'],
    canTake,
    kind: r.kind as OrderKind,
    target: r.target,
    name: t?.name ?? r.target,
    profession: t?.profession ?? '',
    level: t?.level ?? 1,
    gear: t?.gear ?? null,
    qty: r.qty,
    price: r.price,
    net: r.price - tax,
    materials: r.materials,
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
    .where(and(or(eq(artisanOrders.clientId, me), eq(artisanOrders.artisanId, me)), or(inArray(artisanOrders.status, ['open', 'proposed', 'accepted']), sql`${artisanOrders.closedAt} > ${since}`)))
    .orderBy(desc(artisanOrders.id))
    .limit(100);
  // Le panneau : les commandes ouvertes de tout le serveur et de mon clan, sauf les miennes et celles d'un joueur bloqué.
  const myClan = await clanOf(db, me);
  const blockedIds = (await db.select().from(blocks).where(or(eq(blocks.blockerId, me), eq(blocks.blockedId, me)))).map((b) => (b.blockerId === me ? b.blockedId : b.blockerId));
  const boardRows = (
    await db
      .select()
      .from(artisanOrders)
      .where(
        and(
          eq(artisanOrders.status, 'open'),
          sql`${artisanOrders.clientId} <> ${me}`,
          myClan === null ? eq(artisanOrders.scope, 'server') : or(eq(artisanOrders.scope, 'server'), and(eq(artisanOrders.scope, 'clan'), eq(artisanOrders.clanId, myClan))),
        ),
      )
      .orderBy(desc(artisanOrders.id))
      .limit(100)
  ).filter((r) => !blockedIds.includes(r.clientId));
  const persons = await people(db, [...rows, ...boardRows].flatMap((r) => (r.artisanId === null ? [r.clientId] : [r.clientId, r.artisanId])), now, content);
  const out: OrdersView = { asClient: [], asArtisan: [], board: [], inClan: myClan !== null, open: true };
  for (const r of rows) {
    let ready = false;
    if (r.artisanId === me && r.status === 'accepted') {
      if (r.kind === 'item') ready = (myState?.inventory[r.target] ?? 0) >= r.qty;
      else ready = (await deliverableGear(db as unknown as Tx, me, r.target)).length >= r.qty;
    }
    (r.clientId === me ? out.asClient : out.asArtisan).push(view(r, me, persons, ready, false, content));
  }
  for (const r of boardRows) {
    const t = orderTarget(r.kind as OrderKind, r.target, content);
    const canTake = !!t && !!myState && skillLevel(myState, t.profession, content) >= t.level;
    out.board.push(view(r, me, persons, false, canTake, content));
  }
  // Celles que je peux faire d'abord.
  out.board.sort((a, b) => Number(b.canTake) - Number(a.canTake));
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

