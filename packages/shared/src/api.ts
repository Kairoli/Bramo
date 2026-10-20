import { z } from 'zod';
import type { Content } from './schemas/content.js';
import type { AdvanceSummary } from './engine/advance.js';
import type { StateView } from './engine/view.js';

/** Corps de requêtes, validés par le serveur. */
export const credentialsBody = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[\p{L}0-9_-]{3,20}$/u, 'Pseudo : 3 à 20 lettres, chiffres, - ou _.'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum.').max(200),
});

export const startBody = z.object({
  recipeId: z.string(),
  quantity: z.number().int(),
  mode: z.enum(['replace', 'queue']),
});

export const cancelBody = z.object({ index: z.number().int().min(-1) });
export const itemBody = z.object({ itemId: z.string() });
export const tradeBody = z.object({ itemId: z.string(), qty: z.number().int().min(1) });

export interface JournalEntry {
  id: number;
  at: number;
  kind: 'absence' | 'levelup' | 'finished' | 'started' | 'info';
  text: string;
  data?: AdvanceSummary;
}

export interface StateResponse {
  name: string;
  state: StateView;
  /** Présent une seule fois, à la première requête après une absence. */
  absence: AdvanceSummary | null;
  /** Entrées de journal créées par cette requête. */
  journal: JournalEntry[];
}

export type ContentResponse = Omit<Content, 'xpTable'>;

export interface ApiError {
  code: string;
  message: string;
}
