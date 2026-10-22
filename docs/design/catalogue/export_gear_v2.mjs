// Catalogue des dix paliers (1, 10… 90) pour la proposition coherence-v2 (docs/design/contenu/butin-et-recettes.md).
// Reprend les familles, noms et formes de data.mjs, et ajoute :
// - les paliers 30 à 90, avec une matière par palier (métal, bois, cuir, tissu ; argent et or pour la Joaillerie, décision de
//   Louis du 22 octobre) ;
// - des raretés à +5 % par rang (combat-items.md §5.5), deux lignes fixes dès le Commun, un Légendaire dans chaque orientation ;
// - les 15 ensembles du build v2 (sim/proposals/coherence-v2/talents.yaml), aux paliers 40 à 90, en Épique et Légendaire ;
// - les 12 objets nommés du build v2, de leur premier palier à 90 ;
// - les pièces de départ, inchangées (copiées de data/gear.yaml).
// N'écrit QUE dans la proposition : gear_base.yaml (avant la règle des armes, `sim combat-weapons --write`), gear_sets.yaml,
// et la ligne tierScale de gear_pools.yaml. Usage : node docs/design/catalogue/export_gear_v2.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAMILIES, JEWEL, SHARES, SLOTS, WEAPON_NAMES, WEAPONS, basePoints, statLine } from './data.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const out = join(root, 'sim', 'proposals', 'coherence-v2');
const { parse } = createRequire(join(root, 'packages', 'shared', 'package.json'))('yaml');

export const TIERS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90];
/** +5 % par rang ; deux lignes fixes partout ; lignes aléatoires selon la rareté (inchangé). */
const RARITIES = [
  { id: 'common', mult: 1.0, stats: 2, rolls: [0, 1], socket: 'aucun' },
  { id: 'rare', mult: 1.05, stats: 2, rolls: [1, 2], socket: 'mineur' },
  { id: 'epic', mult: 1.1, stats: 2, rolls: [2, 3], socket: 'oui' },
  { id: 'legendary', mult: 1.15, stats: 2, rolls: [3, 4], socket: 'oui' },
];
const SOURCES = { common: ['craft', 'loot'], rare: ['craft', 'loot', 'plan'], epic: ['craft', 'loot', 'plan'], legendary: ['dungeon', 'plan', 'craft'] };

/** Une matière par palier (butin-et-recettes.md §3.3). */
const LADDERS = {
  metal: ['de bronze', 'de fer', "d'acier", "d'acier trempé", 'de mithril', 'de mithril renforcé', "d'orichalque", "d'azurite", 'de sombracier', "d'astralite"],
  wood: ['de pin', 'de chêne', 'de frêne', "d'if", 'de bois de lune', 'de charme', 'de cèdre', "d'ébène", "de bois d'ombre", "de bois d'aurore"],
  cuirass: ['de cuir bouilli', 'de cuir tanné', 'de cuir durci', 'de cuir de lande', 'de cuir de veille', 'de cuir de voyage', 'de cuir lamellaire', 'de cuir de rafale', 'de cuir nocturne', 'de cuir astral'],
  trail: ['de peau', 'de daim', 'de cuir fin', 'de chamois', 'de daim de veille', 'de peau de voyage', 'de cuir soyeux', 'de daim des brumes', 'de peau nocturne', "de daim d'aurore"],
  cloth: ['de toile', 'de lin', 'de lin sergé', 'de chanvre', 'de coton', 'de coton croisé', 'de soie', 'de toile des brumes', "d'étoffe nocturne", "d'étoffe d'aurore"],
  precious: ['de cuivre', 'de cuivre poli', 'de cuivre ciselé', "d'argent", "d'argent pur", "d'or", "d'or pur", "d'électrum", "d'électrum sombre", "d'électrum astral"],
};
const FAMILY_LADDER = { armor: 'metal', cuirass: 'cuirass', trail: 'trail', robe: 'cloth' };
const WEAPON_LADDER = { hammer: 'metal', sword_shield: 'metal', axe: 'metal', daggers: 'metal', longbow: 'wood', crossbow: 'wood', staff: 'wood', scepter: 'precious', grimoire: 'cloth' };
const PLACES = ['des Murmures', 'de Maldefer', 'des cimes', 'de la Lande', 'des Veilleurs', 'des Archives', 'du Bastion', 'des Trois Vents', 'de la Marée', 'des Lointains'];
const MIXED_PROTECTIVE = new Set(['torso', 'legs', 'cape', 'belt']);

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const models = [];
const ids = new Set();
const push = (m) => {
  if (ids.has(m.id)) throw new Error(`identifiant en double : ${m.id}`);
  ids.add(m.id);
  models.push(m);
};
const rar = (id) => RARITIES.find((r) => r.id === id);

// --- Vêtements classiques : chaque famille, emplacement, palier, rareté et orientation ---
for (const fam of FAMILIES) {
  for (const slot of SLOTS.filter((s) => s.kind === 'clothing')) {
    TIERS.forEach((tier, ti) => {
      for (const r of RARITIES) {
        ['protective', 'offensive'].forEach((orient, oi) => {
          const legend = fam.legendNames[slot.id].replace('{p}', PLACES[ti]);
          const name = r.id === 'legendary' ? (orient === 'protective' ? legend : `${legend} en furie`) : r.id === 'epic' ? `${fam.slotNames[slot.id]} ${fam.epicNames[oi]}` : `${fam.slotNames[slot.id]} ${fam.names[(r.id === 'rare' ? 2 : 0) + oi]}`;
          push({
            id: `${fam.id}_${slot.id}_t${tier}_${r.id}_${orient === 'protective' ? 'prot' : 'off'}`,
            name, kind: 'clothing', slot: slot.id, family: fam.id, classes: fam.classes, tier, rarity: r.id, orientation: orient,
            material: LADDERS[FAMILY_LADDER[fam.id]][ti],
            stats: statLine(basePoints(tier), slot.w, SHARES[orient], fam.bias, r.mult, r.stats),
            rolls: r.rolls, socket: r.socket, source: SOURCES[r.id],
          });
        });
      }
    });
  }
}

// --- Bijoux : chaque rareté en offensif et en protecteur (data.mjs n'en avait qu'un par rareté, dont des protecteurs à la
// Ténacité, une statistique sans effet en combat : remplacée par la Défense ou la Vitalité) ---
const noTenacity = (shares) => {
  const out = { ...shares };
  if (out.tenacity) {
    const into = out.defense ? 'vitality' : 'defense';
    out[into] = (out[into] ?? 0) + out.tenacity;
    delete out.tenacity;
  }
  return out;
};
for (const [slotId, list] of Object.entries(JEWEL)) {
  const slot = SLOTS.find((s) => s.id === slotId);
  const byOrient = { offensive: list.filter((x) => x[1] === 'offensive'), protective: list.filter((x) => x[1] === 'protective') };
  TIERS.forEach((tier, ti) => {
    RARITIES.forEach((r, ri) => {
      for (const orient of ['offensive', 'protective']) {
        const [n, , shares] = byOrient[orient][ri < 2 ? 0 : 1]; // Commun et Rare : premier modèle ; Épique et Légendaire : second
        push({
          id: `jewel_${slotId}_t${tier}_${r.id}_${orient === 'protective' ? 'prot' : 'off'}`,
          name: `${slotId === 'ring' ? 'Anneau' : 'Collier'} ${n}`, kind: 'jewel', slot: slotId, family: 'jewel', classes: ['forgefire', 'tracker', 'runist'],
          tier, rarity: r.id, orientation: orient, material: LADDERS.precious[ti],
          stats: statLine(basePoints(tier), slot.w, noTenacity(shares), {}, r.mult, r.stats),
          rolls: r.rolls, socket: slotId === 'necklace' ? 'majeur' : r.socket, source: SOURCES[r.id],
        });
      }
    });
  });
}

// --- Armes : chaque catégorie, palier et rareté ---
const weaponSlot = SLOTS.find((s) => s.id === 'weapon');
for (const w of WEAPONS) {
  TIERS.forEach((tier, ti) => {
    RARITIES.forEach((r, ri) => {
      const mat = LADDERS[WEAPON_LADDER[w.id]][ti];
      push({
        id: `${w.id}_weapon_t${tier}_${r.id}_off`,
        name: `${WEAPON_NAMES[w.id][ri]}${ri < 2 ? ` ${mat}` : ''}`, kind: 'weapon', slot: 'weapon', family: w.id, classes: [w.cls],
        tier, rarity: r.id, orientation: 'offensive', material: mat,
        stats: statLine(basePoints(tier), weaponSlot.w, w.stats, {}, r.mult, r.stats),
        weaponSpeed: w.speed, rolls: r.rolls, socket: 'majeur', source: SOURCES[r.id],
      });
    });
  });
}

// --- Ensembles du build v2 : paliers 40 à 90, Épique et Légendaire ---
const catalog = parse(readFileSync(join(out, 'talents.yaml'), 'utf8'));
const LAST = { feet: /^(Bottes|Waders|Guêtres|Sabots)/, legs: /^(Jambières|Grèves|Chausses)/, belt: /^(Ceinturon|Ceinture|Lanterne)/ };
const slotOf = (name, i) => (i === 0 ? 'head' : i === 1 ? 'torso' : i === 2 ? 'hands' : Object.entries(LAST).find(([, re]) => re.test(name))?.[0]);
const CLASS_FAMILY = { forgefire: 'armor', tracker: 'trail', runist: 'robe' };
const gearSets = [];
for (const set of catalog.sets) {
  // Un ensemble de toutes les classes existe en cuirasse (Forgefeu, Traqueur) et en tenue de piste (Traqueur, Runiste).
  const families = set.class ? [CLASS_FAMILY[set.class]] : ['cuirass', 'trail'];
  set.items.forEach((name, i) => {
    const slotId = slotOf(name, i);
    if (!slotId) throw new Error(`${set.id} : emplacement introuvable pour « ${name} »`);
    const slot = SLOTS.find((s) => s.id === slotId);
    const orient = MIXED_PROTECTIVE.has(slotId) ? 'protective' : 'offensive';
    for (const famId of families) {
      const fam = FAMILIES.find((f) => f.id === famId);
      TIERS.forEach((tier, ti) => {
        if (tier < 40) return;
        for (const r of [rar('epic'), rar('legendary')]) {
          push({
            id: `set_${set.id}_${slotId}_${famId}_t${tier}_${r.id}`,
            name, kind: 'clothing', slot: slotId, family: famId, classes: fam.classes, tier, rarity: r.id, orientation: orient,
            material: LADDERS[FAMILY_LADDER[famId]][ti],
            stats: statLine(basePoints(tier), slot.w, SHARES[orient], fam.bias, r.mult, r.stats),
            rolls: r.rolls, socket: 'oui', set: set.id, source: ['dungeon', 'loot', 'craft'],
          });
        }
      });
    }
  });
  const text = set.text ?? [];
  gearSets.push({
    id: set.id, name: set.name, ...(set.class ? { class: set.class } : {}), family: set.family ?? CLASS_FAMILY[set.class],
    theme: (text[2] ?? '').replace(/^4 : /, ''), event: false, bonuses: text.map((t) => t.replace(/^\d : /, '')).concat(['', '', '']).slice(0, 3),
    note: set.class ? 'Ensemble de classe : son 4 pièces tord la mécanique de la classe.' : 'Ensemble de situation : 2 et 3 pièces nourrissent un style, 4 pièces répondent à une mécanique ennemie.',
  });
}

// --- Objets nommés du build v2 : de leur premier palier (région de leur porteur) à 90 ---
const FIRST = [['Abords', 10], ['Forges', 20], ['Lisière', 40], ['Archives', 40], ['Bastion', 40], ['Cicatrice', 40]];
const jewelSlot = SLOTS.find((s) => s.id === 'necklace');
for (const n of catalog.named) {
  const first = FIRST.find(([k]) => (n.source ?? '').includes(k))?.[1] ?? 40;
  const w = n.weapon && WEAPONS.find((x) => x.id === n.weapon);
  TIERS.forEach((tier, ti) => {
    if (tier < first) return;
    const r = rar('legendary');
    push({
      id: `named_${n.id}_t${tier}`,
      name: n.name, kind: w ? 'weapon' : 'jewel', slot: w ? 'weapon' : 'necklace', family: w ? w.id : 'jewel',
      classes: n.class ? [n.class] : ['forgefire', 'tracker', 'runist'], tier, rarity: 'legendary', orientation: 'offensive',
      material: w ? LADDERS[WEAPON_LADDER[w.id]][ti] : LADDERS.precious[ti],
      stats: w ? statLine(basePoints(tier), weaponSlot.w, w.stats, {}, r.mult, r.stats) : statLine(basePoints(tier), jewelSlot.w, { power: 1, crit: 0.8 }, {}, r.mult, r.stats),
      ...(w ? { weaponSpeed: w.speed } : {}),
      rolls: r.rolls, socket: 'majeur', source: ['dungeon', 'loot'], conditional: `${n.nickname ? `${n.nickname} — ` : ''}${n.text}`, named: true,
    });
  });
}

// --- Pièces de départ : inchangées ---
const data = readFileSync(join(root, 'data', 'gear.yaml'), 'utf8').split('\n').filter((l) => l.startsWith('- {')).map((l) => JSON.parse(l.slice(2)));
for (const m of data.filter((x) => x.starter)) push(m);

const header = `# Catalogue des dix paliers, proposition coherence-v2, AVANT la règle des armes à valeur égale. Généré par
# docs/design/catalogue/export_gear_v2.mjs : ne pas modifier à la main. \`sim combat-weapons --write\` en tire gear.yaml.
`;
writeFileSync(join(out, 'gear_base.yaml'), `${header}${models.map((m) => `- ${JSON.stringify(m)}`).join('\n')}\n`);
writeFileSync(join(out, 'gear_sets.yaml'), `# Ensembles du build v2 (talents.yaml), au format de data/gear_sets.yaml. Généré par export_gear_v2.mjs.\n${gearSets.map((s) => `- ${JSON.stringify(s)}`).join('\n')}\n`);
// Lignes aléatoires : +12 % par palier, comme la courbe d'équipement.
const pools = join(out, 'gear_pools.yaml');
const scale = Object.fromEntries(TIERS.map((t, i) => [String(t), +(1.12 ** i / 1.12 ** 0).toFixed(2)]));
writeFileSync(pools, readFileSync(pools, 'utf8').replace(/^tierScale: .*$/m, `tierScale: ${JSON.stringify(scale)}`));
const count = (f) => models.filter(f).length;
console.log(`${models.length} modèles : ${count((m) => !m.set && !m.named && !m.starter)} classiques, ${count((m) => m.set)} pièces d'ensemble, ${count((m) => m.named && !m.starter)} nommés, ${count((m) => m.starter)} de départ ; ${gearSets.length} ensembles`);
