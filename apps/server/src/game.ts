import {
  type AdvanceSummary,
  type CharacterState,
  type Content,
  type JournalEntry,
  type StateResponse,
  advance,
  viewState,
} from '@bramo/shared';
import type { Db } from './db/index.js';
import { loadCharacterForUpdate, saveCharacter } from './characters.js';
import { entriesFromSummary, insertEntries } from './journal.js';

export interface ActionResult {
  state: CharacterState;
  /** Ligne de journal à ajouter pour l'action du joueur. */
  log?: string;
  logKind?: JournalEntry['kind'];
}

export type Action = (state: CharacterState, now: number) => ActionResult;

export class NoCharacterError extends Error {}

/**
 * Point d'entrée unique de toute requête de jeu :
 * 1. verrouille le personnage ; 2. calcule la progression jusqu'à maintenant ;
 * 3. applique l'action éventuelle ; 4. marque le joueur présent ; 5. enregistre.
 * Le serveur seul décide de l'heure et des gains.
 */
export async function play(db: Db, content: Content, accountId: number, now: number, action?: Action): Promise<StateResponse> {
  return db.transaction(async (tx) => {
    const loaded = await loadCharacterForUpdate(tx, accountId);
    if (!loaded) throw new NoCharacterError();

    const { state: advanced, summary } = advance(loaded.state, now, content);
    const awayMs = now - loaded.state.lastSeenAt;
    const isAbsence =
      awayMs >= content.settings.absence.minSummaryMin * 60_000 &&
      (summary.workedMs > 0 || summary.finished.length > 0);
    const entries = entriesFromSummary(summary, content, isAbsence, loaded.state.trials);

    let state = advanced;
    if (action) {
      const result = action(advanced, now);
      state = result.state;
      if (result.log) entries.push({ at: now, kind: result.logKind ?? 'info', text: result.log });
    }
    state.lastSeenAt = now;

    await saveCharacter(tx, loaded.id, loaded.state, state);
    const journal = await insertEntries(tx, loaded.id, entries);
    const absence: AdvanceSummary | null = isAbsence ? summary : null;
    return { name: loaded.name, state: viewState(state, now, content), absence, journal };
  });
}
