// Gemmes de talent : un objet et une recette de Joaillerie pour chacune des gemmes du catalogue (data/combat/talents.yaml).
// [Décidé par Louis le 24 octobre : « rends les gemmes de talent obtenables ; pas trop dur à obtenir, pas trop facile non
// plus ».] Chiffres et raisons : docs/design/gemmes/gemmes-de-talent.md.
// Réécrit le bloc entre les marqueurs dans data/items.yaml et data/recipes/crafting.yaml (relançable).
// Usage : node docs/design/gemmes/generer.mjs, puis pnpm --filter @bramo/sim sim calibrate --data --write (XP et valeurs).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
// Le lecteur YAML du dépôt (dépendance de packages/shared).
const { parse } = createRequire(join(root, 'packages/shared/package.json'))('yaml');
const catalog = parse(readFileSync(join(root, 'data/combat/talents.yaml'), 'utf8'));
// Valeur de référence des ingrédients (data/items.yaml) : la calibration du simulateur ne chiffre ni les vestiges ni la
// poussière de Lointain (sans recette) ; une gemme vaut 40 % de ses ingrédients, comme les gemmes de situation.
const VALUE = Object.fromEntries([...readFileSync(join(root, 'data/items.yaml'), 'utf8').matchAll(/^- \{id: ([a-z0-9_]+),.*?value: (\d+)/gm)].map((m) => [m[1], Number(m[2])]));

/**
 * La région (son vestige) de chaque réserve : là où elle se taille, et là où elle tombe parfois en combat. Seulement les
 * quatre premières régions (atteintes vers le 20e jour) : avec le Bastion et la Cicatrice, les Entailles et la Rancœur ne se
 * taillaient qu'après un mois (simulation de serveur du 24 octobre).
 */
const VESTIGE = {
  frimas: 'galets_du_puits', // Abords : l'eau froide du lavoir
  utility: 'galets_du_puits',
  tisons: 'scorie_de_memoire', // Forges éteintes : le feu
  mesure: 'scorie_de_memoire', // Forges éteintes : le rythme du marteau-pilon
  rancoeur: 'scorie_de_memoire', // Forges éteintes : le Contremaître et ses coups de presse
  ferveur: 'ambre_de_veille', // Lisière des veilleurs : veiller sur les autres
  trophees: 'ambre_de_veille', // Lisière : la chasse
  echos: 'encre_fossile', // Archives englouties : la salle des échos
  entailles: 'encre_fossile', // Archives : l'encre qui ronge, les pages qui coupent
};

/**
 * Trois paliers de taille selon le rôle : remplir tôt, relier ensuite, dépenser (la récompense) un peu plus tard.
 * Équilibrage du 24 octobre (simulation de serveur, 120 joueurs, 90 jours) : avec les gemmes qui dépensent au niveau 40 (puis
 * 35, avec une améthyste), seul un joueur sur trois réunissait une paire, au 45e jour en médiane, et elles se vendaient 4 à 7
 * fois leur référence. Niveaux 15, 25, 30 et matières de la Joaillerie seulement.
 */
const TIER = {
  producer: { level: 15, sec: 60, inputs: [['glass_bead', 4], ['rune_dust', 2]], vestiges: 15, dust: 4 },
  amplifier: { level: 25, sec: 120, inputs: [['silver_bar', 2], ['rune_dust', 3]], vestiges: 20, dust: 8 },
  bridge: { level: 25, sec: 120, inputs: [['silver_bar', 2], ['rune_dust', 3]], vestiges: 20, dust: 8 },
  utility: { level: 25, sec: 120, inputs: [['silver_bar', 2], ['rune_dust', 3]], vestiges: 20, dust: 8 },
  payoff: { level: 25, sec: 180, inputs: [['silver_bar', 4], ['glass_bead', 6]], vestiges: 30, dust: 12 },
};
// XP de la recette : la règle du simulateur (sim/src/rules.ts), artisanat ×1,75 ; recalculée par `sim calibrate`.
const xp = (level, sec) => Math.round(400 * 2 ** ((level - 1) / 55) * 1.75 * (sec / 3600) * 10) / 10;

const q = (s) => (/[:#'"«»]/.test(s) ? JSON.stringify(s) : s);
const items = [];
const recipes = [];
for (const g of catalog.gems) {
  const tier = TIER[g.role ?? 'utility'] ?? TIER.utility;
  const vestige = VESTIGE[g.archetype ?? 'utility'] ?? VESTIGE.utility;
  const id = `talent_${g.id}`;
  const list = [...tier.inputs, [vestige, tier.vestiges], ['lointain_dust', tier.dust]];
  const value = Math.round((list.reduce((a, [i, n]) => a + (VALUE[i] ?? 0) * n, 0) * 0.4) / 10) * 10;
  items.push(`- {id: ${id}, name: ${q(g.name)}, category: gem, value: ${value}, gem: ${g.id}}`);
  const inputs = list.map(([i, n]) => `{item: ${i}, qty: ${n}}`).join(', ');
  recipes.push(`- {id: cut_${id}, name: ${q(g.name)}, profession: jewelcrafting, category: talents, level: ${tier.level}, durationSec: ${tier.sec}, xp: ${xp(tier.level, tier.sec)}, inputs: [${inputs}], outputs: [{item: ${id}, qty: 1}]}`);
}

const BEGIN = '# --- Gemmes de talent (générées par docs/design/gemmes/generer.mjs : ne pas modifier à la main) ---';
const END = '# --- Fin des gemmes de talent ---';
function replaceBlock(file, lines) {
  const path = join(root, file);
  let s = readFileSync(path, 'utf8');
  const block = [BEGIN, ...lines, END].join('\n');
  const a = s.indexOf(BEGIN);
  if (a >= 0) s = s.slice(0, a) + block + s.slice(s.indexOf(END, a) + END.length);
  else s = s.replace(/\n*$/, `\n\n${block}\n`);
  writeFileSync(path, s);
}
replaceBlock('data/items.yaml', items);
replaceBlock('data/recipes/crafting.yaml', recipes);
console.log(`${items.length} gemmes de talent, ${recipes.length} recettes.`);
