// Adoption du rythme vif et du build v3 dans data/ (docs/design/coherence/rythme.md, build-v3.md), le 24 octobre 2026 au soir
// [Louis : « tu as validation pour tout ; en rentrant je veux jouer à un jeu équilibré avec un vrai bon système »].
// À lancer UNE fois sur les données d'avant (il échoue s'il voit que c'est déjà fait) :
//   node docs/design/coherence/adopter-v3.mjs && node docs/design/gemmes/generer.mjs && pnpm --filter @bramo/sim sim calibrate --data --write
// Ce qu'il fait :
//  1. rencontres de la route : zones 2,5 fois plus courtes et gardiens 1,5 fois, à danger égal (PV ÷, dégâts ×, ennemis deux
//     fois plus fréquents et deux fois moins forts, mécaniques 1,5 fois plus fréquentes) ; limite de temps 20 s en zone, 35 s
//     contre un gardien ; la Marée du soir ne change pas ;
//  2. sorts : recharge × 0,7 ; talents : délais internes et seuils « compétence de N s ou plus » × 0,7 (textes compris) ;
//  3. règles : repos entre deux rencontres 5 -> 2 s, une potion par rencontre, plafond de Cadence 23 % -> 50 % ;
//  4. talents : les gemmes, ensembles et retouches de sim/proposals/build-v3/talents_add.yaml ;
//  5. équipement : les pièces des trois nouveaux ensembles (copies de pièces d'un ensemble de la même mécanique), leur fiche,
//     et les rencontres où elles tombent.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const { parse, parseDocument } = createRequire(join(root, 'packages/shared/package.json'))('yaml');
const path = (p) => join(root, p);
const read = (p) => readFileSync(path(p), 'utf8');
const write = (p, s) => writeFileSync(path(p), s);

// --- 1. Rencontres -------------------------------------------------------------------------------------------------
const Z = { K: 2.5, D: 1.5, limit: 20 };
const G = { K: 1.5, D: 1.3, limit: 35 };
const AR = 2;
const M = 1.5;
const r1 = (x) => Math.round(x * 10) / 10;
const r0 = (x) => Math.round(x);
let enc = read('data/combat/encounters.yaml');
if (enc.includes('"timeLimit"')) throw new Error('Déjà adopté : data/combat/encounters.yaml a des limites de temps.');
enc = enc.replace(/^- (\{.*\})$/gm, (line, json) => {
  const e = JSON.parse(json);
  if (e.kind !== 'zone' && e.kind !== 'gardien') return line;
  const t = e.kind === 'gardien' ? G : Z;
  const hp = 1 / t.K;
  const dmg = t.K * t.D;
  const atk = (a) => {
    a.damage = r1((a.damage * dmg) / AR);
    a.period = r1(a.period / AR);
  };
  e.hp = r0(e.hp * hp);
  atk(e.attack);
  for (const a of e.adds ?? []) {
    a.hp = r0(a.hp * hp);
    atk(a.attack);
    a.arrive = r1(a.arrive / M);
  }
  if (e.charge) Object.assign(e.charge, { damage: r0(e.charge.damage * dmg), period: r1(e.charge.period / M) });
  if (e.guard) Object.assign(e.guard, { amount: r0(e.guard.amount * hp), period: r1(e.guard.period / M), duration: r1(e.guard.duration / M) });
  if (e.regen) Object.assign(e.regen, { amount: r0(e.regen.amount * hp), period: r1(e.regen.period / M) });
  if (e.aura) e.aura.damage = r1(e.aura.damage * dmg);
  if (e.erosion) Object.assign(e.erosion, { damage: r1(e.erosion.damage * dmg), period: r1(e.erosion.period / M) });
  if (e.windows) Object.assign(e.windows, { period: r1(e.windows.period / M), open: r1(e.windows.open / M) });
  if (e.enrage) e.enrage.after = r1(e.enrage.after / M);
  e.timeLimit = t.limit;
  return `- ${JSON.stringify(e)}`;
});
enc = enc.replace(
  '# --- La Marée du soir',
  `# Rythme vif et limite de temps (24 octobre au soir, docs/design/coherence/adopter-v3.mjs) : zones 2,5 fois plus courtes et
# gardiens 1,5 fois, à danger égal ; ennemis deux fois plus fréquents et deux fois moins forts ; mécaniques 1,5 fois plus
# fréquentes ; timeLimit = 20 s en zone, 35 s contre un gardien (au-delà, la rencontre est perdue).
# --- La Marée du soir`,
);
write('data/combat/encounters.yaml', enc);

// --- 2. Sorts et talents -------------------------------------------------------------------------------------------
const C = 0.7;
const half = (x) => Math.round(x * C * 2) / 2;
let spells = read('data/combat/spells.yaml');
spells = spells.replace(/^- (\{.*\})$/gm, (_l, json) => {
  const s = JSON.parse(json);
  s.cooldown = half(s.cooldown);
  return `- ${JSON.stringify(s)}`;
});
spells = spells.replace('# Une ligne par sort', '# Recharges × 0,7 le 24 octobre au soir (rythme vif, adopter-v3.mjs).\n# Une ligne par sort');
write('data/combat/spells.yaml', spells);

const fmt = (x) => String(x).replace('.', ',');
const doc = parseDocument(read('data/combat/talents.yaml'));
/** Les délais d'un talent × 0,7, et les mêmes nombres dans son texte (« délai 8 s » -> « délai 5,5 s »). */
function scaleTalent(node, textPaths) {
  const js = node.toJSON();
  const seen = new Map();
  const walk = (o, at) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach((x, i) => walk(x, [...at, i]));
    for (const k of ['cooldown', 'minCooldown', 'noSkillFor']) {
      if (typeof o[k] === 'number' && o[k] < 999) {
        const v = half(o[k]);
        seen.set(o[k], v);
        node.setIn([...at, k], v);
      }
    }
    for (const [k, v] of Object.entries(o)) if (typeof v === 'object') walk(v, [...at, k]);
  };
  walk(js, []);
  for (const tp of textPaths) {
    const t = node.getIn(tp);
    if (typeof t !== 'string') continue;
    let out = t;
    for (const [from, to] of seen) out = out.replace(new RegExp(`(^|[^0-9,])${from}( ?s)`, 'g'), `$1${fmt(to)}$2`);
    if (out !== t) node.setIn(tp, out);
  }
}
// --- 4. Talents de la proposition build-v3 -------------------------------------------------------------------------
const add = parse(read('sim/proposals/build-v3/talents_add.yaml'));
const upsert = (key, list) => {
  const seq = doc.get(key);
  for (const item of list ?? []) {
    const i = seq.items.findIndex((x) => x.get('id') === item.id);
    const node = doc.createNode(item);
    // Le style du fichier : une ligne par effet, par pièce d'ensemble, par liste courte.
    for (const pair of node.items) {
      const k = pair.key.value ?? pair.key;
      const v = pair.value;
      if (!v || typeof v !== 'object' || !('items' in v)) continue;
      if (k === 'effects' || k === 'pieces') for (const x of v.items) (x.value ?? x).flow = true;
      else v.flow = true;
    }
    if (i >= 0) seq.items[i] = node;
    else seq.items.push(node);
  }
};
upsert('gems', add.gems);
upsert('sets', (add.sets ?? []).map(({ feeds: _f, ...s }) => s));
upsert('named', add.named);
for (const key of ['gems', 'named']) for (const n of doc.get(key).items) scaleTalent(n, [['text']]);
for (const n of doc.get('sets').items) {
  const texts = n.get('text');
  scaleTalent(n, (texts?.items ?? []).map((_x, i) => ['text', i]));
}

let talents = doc.toString({ lineWidth: 0, flowCollectionPadding: false });
talents = talents.replace('# L\'idée : huit RÉSERVES', '# Le 24 octobre au soir (adopter-v3.mjs) : délais internes × 0,7 (rythme vif) ; gemmes et ensembles Ouverture, Endurance,\n# Cadence ; retouches de la Ferveur, de la Mesure et du Coup de grâce (docs/design/coherence/build-v3.md).\n#\n# L\'idée : huit RÉSERVES');
write('data/combat/talents.yaml', talents);

// --- 3. Règles -----------------------------------------------------------------------------------------------------
let rules = read('data/combat/rules.yaml');
const swap = (a, b) => {
  if (!rules.includes(a)) throw new Error(`rules.yaml : introuvable « ${a} »`);
  rules = rules.replace(a, b);
};
swap('  rest: 5                 # repos fixe entre deux rencontres (s), non crédité', '  rest: 2                 # repos fixe entre deux rencontres (s), non crédité (5 avant le rythme vif du 24 octobre)');
swap('  potionsPerFight: 2', '  potionsPerFight: 1      # 2 avant le rythme vif : 2,5 fois plus de rencontres par heure');
swap('  haste: {cap: 0.23, base: 0.12, k: {"1": 200}}', '  haste: {cap: 0.5, base: 0.12, k: {"1": 200}}   # plafond 0,23 -> 0,5 le 24 octobre (archétype Cadence)');
write('data/combat/rules.yaml', rules);

// --- 5. Les pièces des nouveaux ensembles --------------------------------------------------------------------------
const SETS = [
  // [nouvel ensemble, ensemble copié (même mécanique), les quatre noms dans l'ordre coiffe, torse, gants, ceinture/bottes]
  ['meche_et_briquet', 'passeurs_de_braise'],
  ['souffle_long', 'veilleurs_du_sceau'],
  ['aiguilles_du_beffroi', 'heures_creuses'],
];
const newSets = Object.fromEntries((add.sets ?? []).map((s) => [s.id, s]));
let gear = read('data/gear.yaml');
let gearSets = read('data/gear_sets.yaml');
const oldSets = parse(gearSets);
for (const [id, from] of SETS) {
  const src = oldSets.find((s) => s.id === from);
  const def = newSets[id];
  const lines = gear.split('\n').filter((l) => l.includes(`"set":"${from}"`));
  const slots = [...new Set(lines.map((l) => JSON.parse(l.slice(2)).slot))];
  const nameOf = Object.fromEntries(slots.map((s, i) => [s, def.items[i] ?? def.items.at(-1)]));
  const copies = lines.map((l) => {
    const m = JSON.parse(l.slice(2));
    m.id = m.id.replace(`set_${from}_`, `set_${id}_`);
    m.name = nameOf[m.slot];
    m.set = id;
    return `- ${JSON.stringify(m)}`;
  });
  gear = `${gear.trimEnd()}\n${copies.join('\n')}\n`;
  const entry = { ...src, id, name: def.name, theme: def.text.at(-1), bonuses: def.text.map((t) => t.replace(/^\d : /, '')), note: src.note };
  gearSets = `${gearSets.trimEnd()}\n- ${JSON.stringify(entry)}\n`;
  // Les rencontres où tombe l'ensemble copié donnent aussi le nouveau.
  enc = read('data/combat/encounters.yaml').replace(/^- (\{.*\})$/gm, (line, json) => {
    const e = JSON.parse(json);
    if (!e.loot?.sets?.includes(from) || e.loot.sets.includes(id)) return line;
    e.loot.sets.push(id);
    return `- ${JSON.stringify(e)}`;
  });
  write('data/combat/encounters.yaml', enc);
}
write('data/gear.yaml', gear);
write('data/gear_sets.yaml', gearSets);
console.log('Adopté : rencontres, sorts, talents, règles, ensembles.');
