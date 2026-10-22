import {
  type AdvanceSummary,
  type CharacterState,
  type Content,
  type JournalEntry,
  type StateResponse,
  advance,
  stream,
  viewState,
} from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { grantGear } from './gear.js';
import { claimOrders } from './market.js';
import { claimRepairs } from './repairs.js';
import { type NewServerEvent, eventsFromSummary, recordEvents } from './town.js';
import { loadCharacterForUpdate, saveCharacter } from './characters.js';
import { entriesFromSummary, insertEntries } from './journal.js';

export interface ActionResult {
  state: CharacterState;
  /** Ligne de journal à ajouter pour l'action du joueur. */
  log?: string;
  logKind?: JournalEntry['kind'];
  /** Annonces pour le fil du serveur (public). */
  serverEvents?: NewServerEvent[];
}

/** Contexte d'une action : la transaction en cours et le personnage (le marché lit et écrit d'autres lignes). */
export interface ActionContext {
  tx: Tx;
  characterId: number;
  characterName: string;
}

export type Action = (state: CharacterState, now: number, ctx: ActionContext) => ActionResult | Promise<ActionResult>;

export class NoCharacterError extends Error {}

const RARITY_NAME: Record<string, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };

/**
 * Butin des combats calculé par `advance` : l'équipement tombé entre dans le sac (lignes tirées ici, graine du personnage et
 * de l'instant), les vestiges sont déjà dans l'inventaire. Le journal le raconte ; un objet nommé est annoncé au fil du serveur.
 */
async function grantLoot(tx: Tx, characterId: number, name: string, summary: AdvanceSummary, content: Content, now: number) {
  const entries: Omit<JournalEntry, 'id'>[] = [];
  const events: NewServerEvent[] = [];
  const c = summary.combat;
  const vestiges = Object.entries(c.vestiges).map(([id, n]) => `${n} ${content.items[id]?.name ?? id}`);
  if (vestiges.length) entries.push({ at: now, kind: 'combat', text: `Vestiges : ${vestiges.join(', ')}.` });
  const rand = stream(characterId, `loot-lines:${now}`);
  for (const l of c.loot) {
    const m = content.gearModels[l.model];
    if (!m) continue;
    await grantGear(tx, characterId, m.id, content, rand);
    const where = content.combat?.encounters[l.encounter]?.name ?? l.encounter;
    entries.push({ at: now, kind: 'combat', text: `Butin : ${m.name} (${RARITY_NAME[m.rarity]}, palier ${m.tier}), ${where}.` });
    if (m.named) events.push({ kind: 'loot', text: `${name} trouve ${m.name}${m.conditional?.startsWith('«') ? ` ${m.conditional.split(' — ')[0]}` : ''} (${where}).` });
  }
  return { entries, events };
}

/**
 * Point d'entrée unique de toute requête de jeu :
 * 1. verrouille le personnage ; 2. calcule la progression jusqu'à maintenant ;
 * 3. applique l'action éventuelle ; 4. marque le joueur présent ; 5. enregistre.
 * Le serveur seul décide de l'heure et des gains.
 */
export async function play(db: Db, content: Content, accountId: number, now: number, action?: Action): Promise<StateResponse> {
  return db.transaction(async (tx) => {
    const loaded = await loadCharacterForUpdate(tx, accountId, content);
    if (!loaded) throw new NoCharacterError();

    const { state: advanced, summary } = advance(loaded.state, now, content);
    const loot = await grantLoot(tx, loaded.id, loaded.name, summary, content, now);
    const awayMs = now - loaded.state.lastSeenAt;
    const isAbsence =
      awayMs >= content.settings.absence.minSummaryMin * 60_000 &&
      (summary.workedMs > 0 || summary.finished.length > 0);
    const entries = entriesFromSummary(summary, content, isAbsence, loaded.state.trials);
    entries.push(...loot.entries);

    // Ventes et achats du marché conclus pendant l'absence : l'or et les objets arrivent maintenant.
    const claimed = await claimOrders(tx, loaded.id, advanced, content);
    for (const text of claimed.lines) entries.push({ at: now, kind: 'info', text });

    const repaired = await claimRepairs(tx, loaded.id, claimed.state, content);
    for (const text of repaired.lines) entries.push({ at: now, kind: 'info', text });

    const announce = await eventsFromSummary(tx, loaded.name, summary, content);
    announce.push(...loot.events);

    let state = repaired.state;
    if (action) {
      const result = await action(repaired.state, now, { tx, characterId: loaded.id, characterName: loaded.name });
      state = result.state;
      announce.push(...(result.serverEvents ?? []));
      if (result.log) entries.push({ at: now, kind: result.logKind ?? 'info', text: result.log });
    }
    state.lastSeenAt = now;
    await recordEvents(tx, now, announce);

    await saveCharacter(tx, loaded.id, loaded.state, state);
    const journal = await insertEntries(tx, loaded.id, entries);
    const absence: AdvanceSummary | null = isAbsence ? summary : null;
    return { name: loaded.name, state: viewState(state, now, content), absence, journal };
  });
}
