import { buildContent } from '../src/content.js';
import type { CharacterState } from '../src/engine/state.js';
import { emptyCombat } from '../src/combat/progress.js';

/** Contenu de test figé : les tests ne dépendent pas de l'équilibrage de data/. */
export const settings = {
  xp: { maxLevel: 99 },
  ranks: { levels: [20, 40, 60], gatesLevel: true },
  activity: { queueLength: 3, maxQuantity: 10000 },
  presence: { activeTimeoutSec: 120, heartbeatSec: 30 },
  chat: { maxLength: 300, perMinute: 10, minIntervalSec: 2, reportsToHide: 3, blockLinks: true, history: 60 },
  social: { maxFriends: 100, historyDays: 90, thread: 100, onlineMin: 15 },
  avatar: { maxBytes: 300_000, cooldownSec: 60, hideAfterReports: 3 },
  security: { loginFailures: { max: 5, windowMin: 15 }, registrationsPerIpPerDay: 5 },
  rates: { active: 1, offline: 0.25, offlineCapHours: 12 },
  energy: { multiplier: 1.5, charges: 2, durationMin: 30, resetHourUtc: 4 },
  bonusCaps: { tool: 0.3, meal: 0.1, clan: 0.1, season: 0.2 },
  wear: { repairGoldShare: 0.5, recycleShare: 0.4, repairXpShare: 0.5 },
  gear: { lifeHours: 150, masterpiece: { chanceMin: 0.02, chanceMax: 0.05, dailyCap: 1, gapForMax: 40 } },
  commissions: { primeShare: 0.2, primeUnitsPerDay: 10 },
  market: { taxShare: 0.05, maxOpenOrders: 3, maxPrice: 1000, maxQuantity: 100 },
  npcOrders: { perDay: 2 },
  clan: { creationCost: 100, nameMin: 3, nameMax: 24, maxMembers: 3, minMembersForCost: 2, townGuildBonus: 0.03, logSize: 5, activeDays: 14 },
  town: { activeWindowMin: 15, maxWalkers: 10, feedSize: 30, milestoneLevels: [20, 40] },
  absence: { minSummaryMin: 5 },
  character: { startingGold: 100 },
  ornaments: { unlockAll: false },
};

export const content = buildContent({
  settings,
  professions: [
    {
      id: 'mining',
      name: 'Minage',
      nickname: 'Gratte-sol',
      family: 'gathering',
      status: 'playable',
      place: 'Mines',
      description: '',
      categories: [{ id: 'ores', name: 'Minerais' }],
    },
    {
      id: 'smithing',
      name: 'Forge',
      nickname: 'Souffleur',
      family: 'crafting',
      status: 'playable',
      place: 'Forge',
      description: '',
      categories: [{ id: 'bars', name: 'Lingots' }],
    },
    { id: 'fishing', name: 'Pêche', nickname: 'Lanceur', family: 'gathering', status: 'soon', place: 'Port', description: '' },
  ],
  items: [
    { id: 'ore', name: 'Minerai', category: 'ore', value: 1 },
    { id: 'bar', name: 'Lingot', category: 'bar', value: 5 },
    { id: 'pick', name: 'Pioche', category: 'tool', value: 10, tool: { profession: 'mining', bonus: 0.5 } },
    // Usée au bout de 36 s de travail (0,01 h) ; réparée 5 or au prorata de l'usure (valeur 10 × 50 %).
    { id: 'frail_pick', name: 'Pioche fragile', category: 'tool', value: 10, tool: { profession: 'mining', bonus: 0.2, durabilityHours: 0.01 }, repair: { profession: 'smithing', level: 1, materials: [{ item: 'bar', qty: 2 }] } },
    { id: 'block', name: 'Bloc', category: 'bar', value: 8 },
    { id: 'stew', name: 'Ragoût', category: 'meal', value: 3, meal: { bonus: 0.1, durationMin: 30 } },
  ],
  classes: [
    { id: 'mage', name: 'Mage', style: 'magic', profession: 'mining', affinityColor: '#B39DF5', pitch: '', startingOutfit: 'plain', pose: 'mage' },
    { id: 'brute', name: 'Brute', style: 'melee', profession: 'smithing', affinityColor: '#F08A4B', pitch: '', startingOutfit: 'brute_garb', pose: 'brute' },
  ],
  ornaments: [
    { id: 'mining_20', profession: 'mining', rank: 20, trial: 'mining_20' },
    { id: 'mining_90', profession: 'mining', rank: 90, reserved: true },
  ],
  buildings: [
    { id: 'hall', name: 'Halle', description: '', maxLevel: 3, boost: { professions: ['all'], perLevel: 0.01 }, base: { gold: 100, items: [{ item: 'ore', qty: 10 }] } },
    { id: 'mine_gallery', name: 'Forge', description: '', maxLevel: 3, boost: { professions: ['mining', 'smithing'], perLevel: 0.02 }, base: { gold: 50, items: [] } },
  ],
  npcOrders: [
    { id: 'ore_easy', profession: 'mining', level: 1, client: 'Guilde', text: '', items: [{ item: 'ore', qty: 10 }], gold: 30 },
    { id: 'ore_hard', profession: 'mining', level: 20, client: 'Guilde', text: '', items: [{ item: 'ore', qty: 50 }], gold: 90 },
    { id: 'bars_easy', profession: 'smithing', level: 1, client: 'Guilde', text: '', items: [{ item: 'bar', qty: 2 }], gold: 50 },
    { id: 'fish_easy', profession: 'fishing', level: 1, client: 'Guilde', text: '', items: [{ item: 'ore', qty: 1 }], gold: 10 },
  ],
  trials: [
    // Minage 20 puis 40 : remettre du minerai, puis un lingot.
    { id: 'mining_20', profession: 'mining', rank: 20, name: 'Commande 20', nickname: 'Gratteur', intro: '', outro: 'Bravo.', tasks: [{ item: 'ore', qty: 10 }], reward: { gold: 50 } },
    { id: 'mining_40', profession: 'mining', rank: 40, name: 'Commande 40', nickname: 'Chuchoteur', intro: '', outro: '', tasks: [{ item: 'bar', qty: 1 }], reward: { gold: 80 } },
  ],
  cosmetics: {
    default: { outfit: 'plain', class: 'mage' },
    outfits: [
      {
        id: 'plain',
        name: 'Simple',
        subtitle: 'Test',
        classes: ['mage'],
        palette: { coat: '#000000', coatDark: '#000000', mantle: '#000000', under: '#000000', trim: '#000000', metal: '#000000', beard: '#000000' },
        parts: { headwear: 'hood' },
      },
      {
        id: 'plain_alt',
        name: 'Autre',
        subtitle: 'Test',
        classes: ['mage'],
        palette: { coat: '#000000', coatDark: '#000000', mantle: '#000000', under: '#000000', trim: '#000000', metal: '#000000', beard: '#000000' },
        parts: { headwear: 'crown' },
      },
      {
        id: 'brute_garb',
        name: 'Tenue de brute',
        subtitle: 'Test',
        classes: ['brute'],
        palette: { coat: '#000000', coatDark: '#000000', mantle: '#000000', under: '#000000', trim: '#000000', metal: '#000000', beard: '#000000' },
        parts: { headwear: 'helm' },
      },
      {
        id: 'season',
        name: 'Saison',
        subtitle: 'Test',
        classes: ['mage'],
        locked: 'Saison de test',
        palette: { coat: '#000000', coatDark: '#000000', mantle: '#000000', under: '#000000', trim: '#000000', metal: '#000000', beard: '#000000' },
        parts: { headwear: 'tide' },
      },
    ],
  },
  recipes: [
    [
      'test.yaml',
      [
        // 10 s, 10 XP, aucun ingrédient.
        { id: 'mine_ore', name: 'Miner', profession: 'mining', category: 'ores', level: 1, durationSec: 10, xp: 10, outputs: [{ item: 'ore', qty: 1 }] },
        // 10 s, 2 minerais → 1 lingot.
        { id: 'smelt', name: 'Fondre', profession: 'smithing', category: 'bars', level: 1, durationSec: 10, xp: 20, inputs: [{ item: 'ore', qty: 2 }], outputs: [{ item: 'bar', qty: 1 }] },
        { id: 'make_block', name: 'Bloc', profession: 'smithing', category: 'bars', level: 1, durationSec: 10, xp: 5, inputs: [{ item: 'ore', qty: 10 }], outputs: [{ item: 'block', qty: 1 }] },
        { id: 'hard', name: 'Difficile', profession: 'mining', category: 'ores', level: 50, durationSec: 10, xp: 10, outputs: [{ item: 'ore', qty: 1 }] },
        // Chef-d'œuvre : seulement pendant l'commande mining_20.
        { id: 'masterpiece', name: 'Chef-d’œuvre', profession: 'mining', category: 'ores', level: 20, durationSec: 10, xp: 10, trial: 'mining_20', outputs: [{ item: 'ore', qty: 1 }] },
      ],
    ],
  ],
});

/** 2026-01-10 12:00 UTC : loin de la bascule de jour (4 h UTC). */
export const T0 = Date.UTC(2026, 0, 10, 12);
export const SEC = 1000;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;

export function makeState(over: Partial<CharacterState> = {}): CharacterState {
  return {
    seed: 1,
    gold: 100,
    skills: {},
    inventory: {},
    activity: null,
    queue: [],
    lastTickAt: T0,
    lastSeenAt: T0,
    // Aucun coup de fouet en cours par défaut, pour tester le rendement de base.
    energy: { dayKey: '', used: 0, activeUntil: 0 },
    buff: null,
    wear: {},
    pantry: {},
    shown: {},
    ornament: null,
    clanBonuses: {},
    npc: { dayKey: '', done: [] },
    prime: { dayKey: '', units: 0 },
    classId: 'mage',
    outfit: null,
    look: {},
    trials: [],
    combat: emptyCombat(),
    weaponFamily: null,
    ...over,
  };
}

export const mining = (quantity = 100000) => ({ recipeId: 'mine_ore', quantity, done: 0, progress: 0, startedAt: T0 });
