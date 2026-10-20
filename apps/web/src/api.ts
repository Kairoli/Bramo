import type { ApiError, ContentResponse, JournalEntry, StateResponse } from '@bramo/shared';

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
  eat: (itemId: string) => request<StateResponse>('POST', '/items/eat', { itemId }),
  buy: (itemId: string, qty: number) => request<StateResponse>('POST', '/shop/buy', { itemId, qty }),
  sell: (itemId: string, qty: number) => request<StateResponse>('POST', '/shop/sell', { itemId, qty }),
  chooseClass: (classId: string) => request<StateResponse>('POST', '/character/class', { classId }),
  completeTrial: (trialId: string) => request<StateResponse>('POST', '/trials/complete', { trialId }),
};
