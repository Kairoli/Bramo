import { buildContent } from '../src/content.js';
import type { CharacterState } from '../src/engine/state.js';

/** Contenu de test figé : les tests ne dépendent pas de l'équilibrage de data/. */
export const settings = {
  xp: { maxLevel: 99 },
  titles: [
    { level: 1, name: 'Novice' },
    { level: 30, name: 'Apprenti' },
    { level: 60, name: 'Compagnon' },
    { level: 85, name: 'Maître' },
    { level: 99, name: 'Grand maître' },
  ],
  activity: { queueLength: 3, maxQuantity: 10000 },
  presence: { activeTimeoutSec: 120, heartbeatSec: 30 },
  rates: { active: 1, offline: 0.25, offlineCapHours: 12 },
  energy: { multiplier: 1.5, dailyHours: 2, resetHourUtc: 4 },
  bonusCaps: { tool: 0.3, meal: 0.1, clan: 0.1, season: 0.2 },
  absence: { minSummaryMin: 5 },
  character: { startingGold: 100 },
};

export const content = buildContent({
  settings,
  professions: [
    {
      id: 'mining',
      name: 'Minage',
      family: 'gathering',
      status: 'playable',
      place: 'Mines',
      description: '',
      categories: [{ id: 'ores', name: 'Minerais' }],
    },
    {
      id: 'smithing',
      name: 'Forge',
      family: 'crafting',
      status: 'playable',
      place: 'Forge',
      description: '',
      categories: [{ id: 'bars', name: 'Lingots' }],
    },
    { id: 'fishing', name: 'Pêche', family: 'gathering', status: 'soon', place: 'Port', description: '' },
  ],
  items: [
    { id: 'ore', name: 'Minerai', category: 'ore', value: 1 },
    { id: 'bar', name: 'Lingot', category: 'bar', value: 5 },
    { id: 'pick', name: 'Pioche', category: 'tool', value: 10, tool: { profession: 'mining', bonus: 0.5 } },
    { id: 'stew', name: 'Ragoût', category: 'meal', value: 3, shopPrice: 10, meal: { bonus: 0.1, durationMin: 30 } },
  ],
  classes: [
    { id: 'mage', name: 'Mage', style: 'magic', profession: 'mining', affinityColor: '#B39DF5', pitch: '', startingOutfit: 'plain', pose: 'mage' },
    { id: 'brute', name: 'Brute', style: 'melee', profession: 'smithing', affinityColor: '#F08A4B', pitch: '', startingOutfit: 'plain', pose: 'brute' },
  ],
  trials: [
    // Minage 30 puis 60 : remettre du minerai, puis un lingot.
    { id: 'mining_30', profession: 'mining', rank: 30, name: 'Épreuve 30', intro: '', tasks: [{ item: 'ore', qty: 10 }], reward: { gold: 50 } },
    { id: 'mining_60', profession: 'mining', rank: 60, name: 'Épreuve 60', intro: '', tasks: [{ item: 'bar', qty: 1 }], reward: { gold: 80 } },
  ],
  cosmetics: {
    default: { outfit: 'plain', class: 'mage' },
    outfits: [
      {
        id: 'plain',
        name: 'Simple',
        subtitle: 'Test',
        palette: { coat: '#000000', coatDark: '#000000', mantle: '#000000', under: '#000000', trim: '#000000', metal: '#000000', beard: '#000000' },
        parts: {},
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
        { id: 'hard', name: 'Difficile', profession: 'mining', category: 'ores', level: 50, durationSec: 10, xp: 10, outputs: [{ item: 'ore', qty: 1 }] },
        // Chef-d'œuvre : seulement pendant l'épreuve mining_30.
        { id: 'masterpiece', name: 'Chef-d’œuvre', profession: 'mining', category: 'ores', level: 30, durationSec: 10, xp: 10, trial: 'mining_30', outputs: [{ item: 'ore', qty: 1 }] },
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
    gold: 100,
    skills: {},
    inventory: {},
    activity: null,
    queue: [],
    lastTickAt: T0,
    lastSeenAt: T0,
    // Énergie déjà épuisée par défaut, pour tester le rendement de base.
    energy: { dayKey: '2026-01-10', usedMs: 2 * HOUR },
    buff: null,
    classId: 'mage',
    outfit: null,
    trials: [],
    ...over,
  };
}

export const mining = (quantity = 100000) => ({ recipeId: 'mine_ore', quantity, done: 0, progress: 0, startedAt: T0 });
