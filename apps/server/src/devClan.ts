import { eq } from 'drizzle-orm';
import { type CharacterState, type Content, GameError, buildingNeeds, cloneState, memberBonuses, newCharacterState } from '@bramo/shared';
import type { Tx } from './db/index.js';
import { accounts, characterSkills, characters, clanBuildings, clanLog, clanMembers, clanProgress, clans } from './db/schema.js';
import { buildingLevels } from './clans.js';
import type { ClanResult } from './clans.js';

/**
 * Développement seulement : un clan d'essai déjà vivant (membres, bâtiments, apports en cours, journal) pour voir
 * l'intérieur d'un clan sans réunir de vrais joueurs (demande de Louis du 22 octobre). Ses membres sont des personnages
 * sans mot de passe utilisable : personne ne peut s'y connecter.
 */
const NAME = 'Clan d’essai';
const BOTS: { name: string; classId: string; rank: 'officer' | 'member'; skills: Record<string, number>; seenHoursAgo: number }[] = [
  { name: 'Aubépine', classId: 'forgefire', rank: 'officer', skills: { smithing: 42_000, mining: 30_000 }, seenHoursAgo: 1 },
  { name: 'Corvin', classId: 'tracker', rank: 'member', skills: { woodcutting: 26_000, carpentry: 18_000 }, seenHoursAgo: 5 },
  { name: 'Maëlle', classId: 'runist', rank: 'member', skills: { cooking: 22_000, farming: 15_000 }, seenHoursAgo: 30 },
  { name: 'Brandt', classId: 'forgefire', rank: 'member', skills: { fishing: 9_000 }, seenHoursAgo: 24 * 12 },
];

export async function joinTestClan(tx: Tx, content: Content, characterId: number, characterName: string, input: CharacterState, now: number): Promise<ClanResult> {
  const [mine] = await tx.select().from(clanMembers).where(eq(clanMembers.characterId, characterId));
  if (mine) throw new GameError('in_clan', 'Vous êtes déjà dans un clan : quittez-le d’abord.');
  const key = NAME.toLowerCase();
  let [clan] = await tx.select().from(clans).where(eq(clans.nameKey, key));
  const fresh = !clan;
  if (!clan) {
    [clan] = await tx.insert(clans).values({ name: NAME, nameKey: key, description: 'Un clan pour essayer : ses membres sont des personnages de test.' }).returning();
    const log = (hoursAgo: number, text: string) => tx.insert(clanLog).values({ clanId: clan!.id, at: new Date(now - hoursAgo * 3_600_000), text });
    for (const b of BOTS) {
      const username = `essai_${b.name.normalize('NFD').replace(/[^a-zA-Z]/g, '').toLowerCase()}`;
      let [acc] = await tx.select().from(accounts).where(eq(accounts.username, username));
      // « ! » n'est pas un hachage valide : on ne peut pas se connecter à ce compte.
      if (!acc) [acc] = await tx.insert(accounts).values({ username, displayName: b.name, passwordHash: '!' }).returning();
      let [ch] = await tx.select().from(characters).where(eq(characters.accountId, acc!.id));
      if (!ch) {
        const s = newCharacterState(now, content);
        const seen = new Date(now - b.seenHoursAgo * 3_600_000);
        [ch] = await tx
          .insert(characters)
          .values({ accountId: acc!.id, name: b.name, gold: s.gold, activity: null, queue: [], energy: s.energy, buff: null, classId: b.classId, outfit: null, trials: [], lastTickAt: seen, lastSeenAt: seen })
          .returning();
        for (const [skill, xp] of Object.entries(b.skills)) if (content.professions.some((p) => p.id === skill)) await tx.insert(characterSkills).values({ characterId: ch!.id, skill, xp });
      }
      await tx.insert(clanMembers).values({ characterId: ch!.id, clanId: clan!.id, rank: b.rank }).onConflictDoNothing();
      await log(72 + b.seenHoursAgo, `${b.name} rejoint le clan.`);
    }
    // Deux bâtiments déjà montés, un troisième en cours, pour voir les bonus et les apports.
    const ids = Object.keys(content.buildings);
    const built: [string, number][] = [
      [ids[0]!, 2],
      [ids[1]!, 1],
    ];
    for (const [buildingId, level] of built) {
      await tx.insert(clanBuildings).values({ clanId: clan!.id, buildingId, level: Math.min(level, content.buildings[buildingId]!.maxLevel) });
      await log(40 - level * 10, `${content.buildings[buildingId]!.name} passe au niveau ${level}.`);
    }
    const next = ids[2];
    if (next) {
      const needs = buildingNeeds(next, 1, BOTS.length + 1, content);
      if (needs.gold > 0) await tx.insert(clanProgress).values({ clanId: clan!.id, buildingId: next, what: 'gold', qty: Math.floor(needs.gold * 0.6) });
      const first = needs.items[0];
      if (first) await tx.insert(clanProgress).values({ clanId: clan!.id, buildingId: next, what: first.item, qty: Math.floor(first.qty * 0.3) });
      await log(3, `Aubépine apporte ${Math.floor(needs.gold * 0.6)} or : ${content.buildings[next]!.name}.`);
    }
  }
  // Nouveau clan : on en est le chef, pour tout voir (rangs, exclusions) ; sinon, on revient comme membre.
  await tx.insert(clanMembers).values({ characterId, clanId: clan!.id, rank: fresh ? 'leader' : 'member' });
  await tx.insert(clanLog).values({ clanId: clan!.id, at: new Date(now), text: `${characterName} rejoint le clan.` });
  const state = cloneState(input);
  state.clanBonuses = memberBonuses(await buildingLevels(tx, clan!.id), content);
  return { state, log: `Vous rejoignez le ${NAME}${fresh ? ', comme chef' : ''}.` };
}
