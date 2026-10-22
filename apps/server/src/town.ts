import { desc, gte, inArray, sql } from 'drizzle-orm';
import {
  type AdvanceSummary,
  type Content,
  type TownEvent,
  type TownPlayer,
  type TownView,
  effectiveLevel,
  shownNickname,
} from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { characterSkills, characters, serverEvents, serverFirsts } from './db/schema.js';

export interface NewServerEvent {
  kind: TownEvent['kind'];
  text: string;
}

export async function recordEvents(tx: Tx, at: number, events: NewServerEvent[]): Promise<void> {
  if (!events.length) return;
  await tx.insert(serverEvents).values(events.map((e) => ({ at: new Date(at), kind: e.kind, text: e.text })));
}

/**
 * Événements du fil du serveur nés d'un calcul de progression : paliers de niveau (`settings.town.milestoneLevels`)
 * et premières fabrications d'un objet sur le serveur.
 */
export async function eventsFromSummary(
  tx: Tx,
  name: string,
  summary: AdvanceSummary,
  content: Content,
): Promise<NewServerEvent[]> {
  const out: NewServerEvent[] = [];
  const professionName = (id: string) => content.professions.find((p) => p.id === id)?.name ?? id;
  const milestones = content.settings.town.milestoneLevels;
  for (const l of summary.levelUps) {
    for (const m of milestones) {
      if (m > l.from && m <= l.to) out.push({ kind: 'level', text: `${name} atteint le niveau ${m} en ${professionName(l.skill)}.` });
    }
  }
  // Première fois qu'un objet fabriqué (au moins un ingrédient) apparaît sur le serveur.
  const crafted = Object.keys(summary.produced).filter((item) =>
    Object.values(content.recipes).some((r) => r.inputs.length > 0 && !r.trial && r.outputs.some((o) => o.item === item)),
  );
  if (crafted.length) {
    const inserted = await tx
      .insert(serverFirsts)
      .values(crafted.map((itemId) => ({ itemId, characterName: name })))
      .onConflictDoNothing()
      .returning({ itemId: serverFirsts.itemId });
    for (const row of inserted) {
      out.push({ kind: 'first', text: `${name} fabrique le premier ${content.items[row.itemId]?.name ?? row.itemId} du serveur.` });
    }
  }
  return out;
}

export async function townView(db: Db, content: Content, now: number, selfId: number | null): Promise<TownView> {
  const { town } = content.settings;
  const since = new Date(now - town.activeWindowMin * 60_000);
  const rows = await db
    .select()
    .from(characters)
    .where(gte(characters.lastSeenAt, since))
    // À visite égale, le personnage le plus récent d'abord : l'ordre ne dépend pas de la base.
    .orderBy(desc(characters.lastSeenAt), desc(characters.id))
    .limit(town.maxWalkers + 1);
  const skills = rows.length
    ? await db.select().from(characterSkills).where(inArray(characterSkills.characterId, rows.map((r) => r.id)))
    : [];
  const [{ count: total } = { count: 0 }] = await db.select({ count: sql<number>`count(*)::int` }).from(characters);

  const players: TownPlayer[] = rows
    .filter((r) => r.classId)
    .slice(0, town.maxWalkers)
    .map((r) => {
      const mine = skills.filter((s) => s.characterId === r.id);
      const best = mine
        .map((s) => ({ skill: s.skill, level: effectiveLevel(s.xp, s.skill, r.trials, content) }))
        .filter((s) => content.professions.find((p) => p.id === s.skill)?.status === 'playable')
        .sort((a, b) => b.level - a.level)[0];
      const recipe = r.activity ? content.recipes[r.activity.recipeId] : undefined;
      const cls = content.classes[r.classId!];
      return {
        id: r.id,
        name: r.name,
        classId: r.classId!,
        outfit: r.outfit ?? cls?.startingOutfit ?? content.cosmetics.default.outfit,
        doing: recipe?.name ?? null,
        doingProfession: recipe?.profession ?? null,
        profession: best?.skill ?? null,
        level: best?.level ?? 1,
        nickname: best ? shownNickname(best.skill, r.trials, r.shown, content).nickname : '',
        self: r.id === selfId,
      };
    });
  const feed = await db.select().from(serverEvents).orderBy(desc(serverEvents.id)).limit(town.feedSize);
  return {
    online: rows.length,
    total,
    players,
    feed: feed.map((e) => ({ id: e.id, at: e.at.getTime(), kind: e.kind as TownEvent['kind'], text: e.text })),
  };
}

/** Un nouveau personnage arrive dans le bourg. */
export const joinEvent = (name: string): NewServerEvent => ({ kind: 'join', text: `${name} arrive à Bramo.` });

