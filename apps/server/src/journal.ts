import { desc, eq } from 'drizzle-orm';
import { type AdvanceSummary, type Content, type JournalEntry, previousTrial, trialsOf } from '@bramo/shared';
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
      ...Object.entries(summary.combat.xp).map(([id, xp]) => `+${fmt(xp)} XP de ${content.classes[id]?.name ?? id}`),
      ...(summary.combat.fights ? [`${fmt(summary.combat.wins)} combat${summary.combat.wins > 1 ? 's' : ''} gagné${summary.combat.wins > 1 ? 's' : ''}`] : []),
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
  for (const id of summary.worn) {
    entries.push({ at, kind: 'info', text: `${item(id)} est usée : elle ne donne plus son bonus. Une réparation lui rend toute sa durabilité.` });
  }
  if (summary.autoMeals.length) {
    const counts: Record<string, number> = {};
    for (const id of summary.autoMeals) counts[id] = (counts[id] ?? 0) + 1;
    const served = Object.entries(counts).map(([id, n]) => `${n} × ${item(id)}`);
    entries.push({ at, kind: 'info', text: `Le garde-manger vous a servi : ${served.join(', ')}.` });
  }
  for (const id of summary.started) entries.push({ at, kind: 'started', text: `La file enchaîne : ${recipe(id)}.` });
  // Combat : bilan des rencontres, niveaux de classe, pause éventuelle.
  const c = summary.combat;
  const className = (id: string) => content.classes[id]?.name ?? id;
  if (c.fights) {
    const xp = Object.entries(c.xp).map(([id, v]) => `+${fmt(v)} XP de ${className(id)}`).join(', ');
    entries.push({ at, kind: 'combat', text: `Combat : ${fmt(c.wins)} victoire${c.wins > 1 ? 's' : ''}${c.losses ? `, ${fmt(c.losses)} défaite${c.losses > 1 ? 's' : ''}` : ''} (${xp}).` });
  } else if (Object.keys(c.xp).length && isAbsence) {
    entries.push({ at, kind: 'combat', text: `Terrain d’entraînement : ${Object.entries(c.xp).map(([id, v]) => `+${fmt(v)} XP de ${className(id)}`).join(', ')}.` });
  }
  for (const l of c.levelUps) entries.push({ at, kind: 'levelup', text: `${className(l.classId)} passe au niveau ${l.to}.` });
  if (c.stopped === 'losses') entries.push({ at, kind: 'info', text: 'Trois défaites de suite : le combat se met en pause. Rien n’est perdu ; changez de plan ou de rencontre.' });
  if (c.stopped === 'training_cap') entries.push({ at, kind: 'info', text: 'Le Terrain d’entraînement s’arrête ici : la suite se gagne en vraies rencontres.' });
  for (const l of summary.levelUps) {
    entries.push({ at, kind: 'levelup', text: `${profession(l.skill)} passe au niveau ${l.to}.` });
    // Un palier est atteint : le niveau s'y arrête jusqu'à la commande du maître, l'XP continue de s'accumuler.
    const reached = trialsOf(l.skill, content).find(
      (t) => t.rank > l.from && t.rank <= l.to && !trials.includes(t.id) && !previousTrial(t, trials, content),
    );
    const master = content.professions.find((p) => p.id === l.skill)?.master?.name;
    if (reached && master) {
      entries.push({
        at,
        kind: 'trial',
        text: content.settings.ranks.gatesLevel
          ? `${master} vous attend pour la commande « ${reached.name} » : le niveau reste au ${reached.rank} jusque-là, mais votre XP continue de s’accumuler.`
          : `${master} vous attend pour la commande « ${reached.name} » : elle vous vaudra le surnom « ${reached.nickname} ».`,
      });
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
