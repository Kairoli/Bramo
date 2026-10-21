import type {
  ApiError,
  ClanListItem,
  ClanView,
  ContentResponse,
  GearModel,
  GearView,
  JournalEntry,
  MarketItemSummary,
  MarketOrderView,
  MyOrderView,
  RepairRequestView,
  StateResponse,
  TownView,
} from '@bramo/shared';

export class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = json as ApiError | null;
    throw new RequestError(res.status, err?.code ?? 'network', err?.message ?? 'Le serveur ne répond pas.');
  }
  return json as T;
}

/** Le client n'envoie que des intentions ; toutes les réponses viennent du serveur. */
export const api = {
  content: () => request<ContentResponse>('GET', '/content'),
  register: (username: string, password: string) => request('POST', '/auth/register', { username, password }),
  login: (username: string, password: string) => request('POST', '/auth/login', { username, password }),
  logout: () => request('POST', '/auth/logout'),
  state: () => request<StateResponse>('GET', '/state'),
  journal: () => request<JournalEntry[]>('GET', '/journal'),
  start: (recipeId: string, quantity: number, mode: 'replace' | 'queue') =>
    request<StateResponse>('POST', '/activity/start', { recipeId, quantity, mode }),
  cancel: (index: number) => request<StateResponse>('POST', '/activity/cancel', { index }),
  energize: () => request<StateResponse>('POST', '/energy/activate'),
  combatStart: (encounter: string | null) => request<StateResponse>('POST', '/combat/start', { encounter }),
  combatStop: () => request<StateResponse>('POST', '/combat/stop'),
  combatPath: (pathId: string) => request<StateResponse>('POST', '/combat/path', { pathId }),
  combatPlan: (plan: { spell: string; at: number }[] | null) => request<StateResponse>('POST', '/combat/plan', { plan }),
  eat: (itemId: string) => request<StateResponse>('POST', '/items/eat', { itemId }),
  buy: (itemId: string, qty: number) => request<StateResponse>('POST', '/shop/buy', { itemId, qty }),
  sell: (itemId: string, qty: number) => request<StateResponse>('POST', '/shop/sell', { itemId, qty }),
  clans: () => request<ClanListItem[]>('GET', '/clans'),
  myClan: () => request<ClanView | null>('GET', '/clan'),
  clanCreate: (name: string, description: string) => request<StateResponse>('POST', '/clan/create', { name, description }),
  clanJoin: (clanId: number) => request<StateResponse>('POST', '/clan/join', { clanId }),
  clanLeave: () => request<StateResponse>('POST', '/clan/leave'),
  clanKick: (characterId: number) => request<StateResponse>('POST', '/clan/kick', { characterId }),
  clanRank: (characterId: number, rank: 'officer' | 'member') => request<StateResponse>('POST', '/clan/rank', { characterId, rank }),
  clanLeader: (characterId: number) => request<StateResponse>('POST', '/clan/leader', { characterId }),
  clanContribute: (buildingId: string, what: string, qty: number) => request<StateResponse>('POST', '/clan/contribute', { buildingId, what, qty }),
  town: () => request<TownView>('GET', '/town'),
  marketSummary: () => request<MarketItemSummary[]>('GET', '/market'),
  marketItem: (itemId: string) => request<MarketOrderView[]>('GET', `/market/item/${itemId}`),
  myOrders: () => request<MyOrderView[]>('GET', '/market/mine'),
  placeOrder: (p: { side: 'buy' | 'sell'; itemId: string; qty: number; price: number; copy?: number }) =>
    request<StateResponse>('POST', '/market/order', p),
  fillOrder: (orderId: number, qty: number) => request<StateResponse>('POST', '/market/fill', { orderId, qty }),
  cancelOrder: (orderId: number) => request<StateResponse>('POST', '/market/cancel', { orderId }),
  npcComplete: (orderId: string) => request<StateResponse>('POST', '/npc/complete', { orderId }),
  stallBuy: (itemId: string, qty: number) => request<StateResponse>('POST', '/stall/buy', { itemId, qty }),
  repairSelf: (itemId: string) => request<StateResponse>('POST', '/items/repair-self', { itemId }),
  openRepairs: () => request<RepairRequestView[]>('GET', '/repairs'),
  requestRepair: (itemId: string, copy: number, fee: number) =>
    request<StateResponse>('POST', '/repairs/request', { itemId, copy, fee }),
  takeRepair: (requestId: number) => request<StateResponse>('POST', '/repairs/take', { requestId }),
  cancelRepair: (requestId: number) => request<StateResponse>('POST', '/repairs/cancel', { requestId }),
  repair: (itemId: string) => request<StateResponse>('POST', '/shop/repair', { itemId }),
  recycle: (itemId: string, qty: number) => request<StateResponse>('POST', '/items/recycle', { itemId, qty }),
  stockPantry: (itemId: string, qty: number) => request<StateResponse>('POST', '/pantry/stock', { itemId, qty }),
  unstockPantry: (itemId: string, qty: number) => request<StateResponse>('POST', '/pantry/unstock', { itemId, qty }),
  gear: () => request<GearView>('GET', '/gear'),
  gearCatalogue: () => request<{ models: GearModel[] }>('GET', '/gear/catalogue'),
  gearEquip: (id: number) => request<GearView>('POST', '/gear/equip', { id }),
  gearUnequip: (id: number) => request<GearView>('POST', '/gear/unequip', { id }),
  devGrantGear: (modelId: string, masterpiece = false) => request<GearView>('POST', '/dev/gear/grant', { modelId, masterpiece }),
  chooseOutfit: (outfitId: string) => request<StateResponse>('POST', '/character/outfit', { outfitId }),
  setLook: (slot: string, partId: string | null) => request<StateResponse>('POST', '/character/look', { slot, partId }),
  chooseClass: (classId: string) => request<StateResponse>('POST', '/character/class', { classId }),
  setNickname: (profession: string, rank: number) => request<StateResponse>('POST', '/nickname', { profession, rank }),
  completeTrial: (trialId: string) => request<StateResponse>('POST', '/trials/complete', { trialId }),
};
