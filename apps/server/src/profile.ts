import { and, eq } from 'drizzle-orm';
import { type Content, type PlayerProfile, effectiveLevel, levelForXp, shownNickname } from '@bramo/shared';
import type { Db } from './db/index.js';
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

  return {
    id: r.id,
    name: r.name,
    classId: r.classId,
    outfit: r.outfit,
    look: r.look,
    ornament: r.ornament,
    nickname: best ? shownNickname(best.profession, r.trials, r.shown, content).nickname : '',
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
