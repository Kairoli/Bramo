import { and, eq } from 'drizzle-orm';
import { type CharacterState, type Content, GameError, type PlayerProfile, effectiveLevel, levelForXp, readTide, shownNickname, tideTitles } from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { characterSkills, characters, clanMembers, clans, gearItems } from './db/schema.js';

/**
 * Fiche publique d'un joueur (demande de Louis du 23 octobre) : son apparence, sa classe et son niveau, ce qu'il porte, ses
 * métiers, son clan. Rien de privé (or, sac, ordres). Null si le personnage n'existe pas.
 */
export async function playerProfile(db: Db, content: Content, id: number): Promise<PlayerProfile | null> {
  const [r] = await db.select().from(characters).where(eq(characters.id, id));
  if (!r) return null;
  const skills = await db.select().from(characterSkills).where(eq(characterSkills.characterId, id));
  const worn = await db
    .select()
    .from(gearItems)
    .where(and(eq(gearItems.characterId, id)));
  const [member] = await db.select({ rank: clanMembers.rank, name: clans.name }).from(clanMembers).innerJoin(clans, eq(clans.id, clanMembers.clanId)).where(eq(clanMembers.characterId, id));

  const levels = skills
    .map((s) => ({ profession: s.skill, level: effectiveLevel(s.xp, s.skill, r.trials, content) }))
    .filter((s) => content.professions.some((p) => p.id === s.profession))
    .sort((a, b) => b.level - a.level);
  const best = levels.find((s) => content.professions.find((p) => p.id === s.profession)?.status === 'playable');
  const xp = (r.combat?.xp ?? {}) as Record<string, number>;
  const classLevel = (c: string) => levelForXp(xp[c] ?? 0, content.xpTable);
  const path = r.classId ? (r.combat?.paths?.[r.classId] ?? null) : null;
  const recipe = r.activity ? content.recipes[r.activity.recipeId] : undefined;
  const playable = content.professions.filter((p) => p.status === 'playable');

  // Son palmarès de la Marée (titres compris), lu dans son état de combat.
  const tide = readTide((r.combat as CharacterState['combat'] | undefined)?.tide);
  const titles = tideTitles({ combat: { tide } } as unknown as CharacterState, content);
  return {
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    motto: r.motto,
    banner: r.banner,
    joinedAt: r.createdAt.getTime(),
    tide: { nights: Object.values(tide.counts).reduce((a, b) => a + b, 0), best: tide.nights.reduce((m, n) => Math.max(m, n.points), 0), live: tide.nights.filter((n) => n.live).length, titles, offered: tide.patron },
    classId: r.classId,
    outfit: r.outfit,
    look: r.look,
    ornament: r.ornament,
    nickname: r.title ?? (best ? shownNickname(best.profession, r.trials, r.shown, content).nickname : ''),
    title: r.title,
    clan: member ? { name: member.name, rank: member.rank } : null,
    classLevel: r.classId ? classLevel(r.classId) : 1,
    // La voie ne compte qu'à partir du niveau de voie.
    path: path && r.classId && content.combat && classLevel(r.classId) >= content.combat.pathLevel ? (content.combat.paths[path]?.name ?? null) : null,
    otherClasses: Object.keys(xp)
      .filter((c) => c !== r.classId && content.classes[c])
      .map((c) => ({ classId: c, level: classLevel(c) })),
    gear: worn
      .filter((g) => g.equipped && content.gearModels[g.modelId])
      .map((g) => {
        const m = content.gearModels[g.modelId]!;
        return { slot: m.slot, family: m.family, tier: m.tier, rarity: m.rarity, name: m.name, masterpiece: g.masterpiece };
      }),
    skills: levels.filter((s) => s.level > 1),
    totalLevel: playable.reduce((sum, p) => sum + (levels.find((s) => s.profession === p.id)?.level ?? 1), 0),
    doing: recipe?.name ?? null,
    lastSeenAt: r.lastSeenAt.getTime(),
  };
}

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|fr|net|org|io|gg|ru|xyz|ly|me)\b)/i;

/** Sa page profil : la devise (80 caractères, sans lien ; vide = aucune) et la bannière (un décor du jeu, ou celle par défaut). */
export async function setProfileDetails(tx: Tx, characterId: number, details: { motto?: string | null; banner?: string | null }): Promise<void> {
  const set: { motto?: string | null; banner?: string | null } = {};
  if (details.motto !== undefined) {
    const motto = (details.motto ?? '').replace(/\s+/g, ' ').trim();
    if (LINK.test(motto)) throw new GameError('link', 'Les liens ne sont pas autorisés dans la devise.');
    set.motto = motto || null;
  }
  if (details.banner !== undefined) set.banner = details.banner;
  if (Object.keys(set).length) await tx.update(characters).set(set).where(eq(characters.id, characterId));
}
