import { desc, eq } from 'drizzle-orm';
import { type AdvanceSummary, type Content, type JournalEntry, earnedTitle, previousTrial, trialsOf } from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { journal } from './db/schema.js';

type NewEntry = Omit<JournalEntry, 'id'>;

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');

export function formatDuration(ms: number): string {
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

/**
 * Transforme le résumé d'un calcul de progression en lignes de journal, en français.
 * `trials` : épreuves déjà réussies (un palier avec épreuve n'est acquis qu'une fois l'épreuve passée).
 */
export function entriesFromSummary(
  summary: AdvanceSummary,
  content: Content,
  isAbsence: boolean,
  trials: readonly string[],
): NewEntry[] {
  const at = summary.to;
  const profession = (id: string) => content.professions.find((p) => p.id === id)?.name ?? id;
  const item = (id: string) => content.items[id]?.name ?? id;
  const recipe = (id: string) => content.recipes[id]?.name ?? id;
  const entries: NewEntry[] = [];

  if (isAbsence) {
    const gains = [
      ...Object.entries(summary.xp).map(([s, xp]) => `+${fmt(xp)} XP de ${profession(s)}`),
      ...Object.entries(summary.produced).map(([i, q]) => `${fmt(q)} × ${item(i)}`),
    ];
    entries.push({
      at,
      kind: 'absence',
      text: `Pendant votre absence (${formatDuration(summary.to - summary.from)}) : ${gains.join(', ') || 'rien ne tournait'}.`,
      data: summary,
    });
  }
  for (const f of summary.finished) {
    entries.push({
      at,
      kind: 'finished',
      text:
        f.reason === 'completed'
          ? `Terminé : ${fmt(f.done)} × ${recipe(f.recipeId)}.`
          : `Interrompu faute d’ingrédients : ${recipe(f.recipeId)} (${fmt(f.done)} faits).`,
    });
  }
  for (const id of summary.started) entries.push({ at, kind: 'started', text: `La file enchaîne : ${recipe(id)}.` });
  for (const l of summary.levelUps) {
    const before = earnedTitle(l.skill, l.from, trials, content).name;
    const after = earnedTitle(l.skill, l.to, trials, content).name;
    const title = after !== before ? ` Vous devenez ${after}.` : '';
    entries.push({ at, kind: 'levelup', text: `${profession(l.skill)} passe au niveau ${l.to}.${title}` });
    // Une épreuve s'ouvre : le maître du métier vous attend.
    const opened = trialsOf(l.skill, content).find(
      (t) => t.rank > l.from && t.rank <= l.to && !trials.includes(t.id) && !previousTrial(t, trials, content),
    );
    const master = content.professions.find((p) => p.id === l.skill)?.master?.name;
    if (opened && master) {
      entries.push({ at, kind: 'trial', text: `${master} vous attend pour l’épreuve « ${opened.name} ».` });
    }
  }
  return entries;
}

export async function insertEntries(tx: Tx, characterId: number, entries: NewEntry[]): Promise<JournalEntry[]> {
  if (!entries.length) return [];
  const rows = await tx
    .insert(journal)
    .values(entries.map((e) => ({ characterId, at: new Date(e.at), kind: e.kind, text: e.text, data: e.data })))
    .returning();
  return rows.map(toEntry);
}

export async function recentEntries(db: Db, characterId: number, limit: number): Promise<JournalEntry[]> {
  const rows = await db
    .select()
    .from(journal)
    .where(eq(journal.characterId, characterId))
    .orderBy(desc(journal.at), desc(journal.id))
    .limit(limit);
  return rows.map(toEntry);
}

function toEntry(row: typeof journal.$inferSelect): JournalEntry {
  return {
    id: row.id,
    at: row.at.getTime(),
    kind: row.kind as JournalEntry['kind'],
    text: row.text,
    ...(row.data ? { data: row.data } : {}),
  };
}
