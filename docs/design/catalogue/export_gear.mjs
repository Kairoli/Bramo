// Exporte le catalogue illustratif (data.mjs) vers les données du jeu : data/gear.yaml, data/gear_slots.yaml, data/gear_sets.yaml,
// puis la fiche lisible docs/design/catalogue/ITEMS.md. Après cet export, data/gear*.yaml fait foi : on les retouche à la main
// (ou on régénère depuis data.mjs, qui écrase). Usage : node docs/design/catalogue/export_gear.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAMILIES, ITEMS, RARITIES, SETS, SLOTS, STATS, TIERS, VARIABLE_LINES } from './data.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', '..', '..', 'data');

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

// --- Modèles ---
const models = [];
const seen = new Set();
const unique = (base) => {
  let id = base;
  let n = 2;
  while (seen.has(id)) id = `${base}_${n++}`;
  seen.add(id);
  return id;
};
for (const it of ITEMS) {
  if (it.kind === 'tool') continue; // les outils de métier restent dans items.yaml
  const base = it.starter ? `starter_${it.classes[0]}_${it.slot}` : it.named || it.set ? `${slug(it.name)}_t${it.tier}` : `${it.family}_${it.slot}_t${it.tier}_${it.rarity}_${it.orientation === 'protective' ? 'prot' : 'off'}`;
  const m = {
    id: unique(base),
    name: it.name,
    kind: it.kind,
    slot: it.slot,
    family: it.family,
    classes: it.classes,
    tier: it.tier,
    rarity: it.rarity,
    orientation: it.orientation,
    material: it.material,
    stats: it.stats,
    rolls: it.rolls,
    socket: it.socket,
    source: it.source,
  };
  if (it.set) m.set = it.set;
  if (it.weaponSpeed) m.weaponSpeed = it.weaponSpeed;
  if (it.conditional) m.conditional = it.conditional;
  if (it.named) m.named = true;
  if (it.starter) m.starter = true;
  if (it.bound) m.bound = true;
  models.push(m);
}

const yamlList = (header, list) => `${header}${list.map((x) => `- ${JSON.stringify(x)}`).join('\n')}\n`;

writeFileSync(
  join(dataDir, 'gear.yaml'),
  yamlList(
    `# Catalogue des modèles d'équipement (un modèle = une rareté fixe ; chaque exemplaire tire ses lignes aléatoires).
# Une ligne par modèle, au format JSON (c'est du YAML valide). Généré par docs/design/catalogue/export_gear.mjs depuis le catalogue
# illustratif, puis retouché à la main : ces valeurs sont provisoires (à équilibrer).
# stats = lignes fixes du modèle ; rolls = nombre de lignes aléatoires tirées [min, max] parmi le groupe de lignes de l'emplacement (gear_pools.yaml).
`,
    models,
  ),
);

writeFileSync(
  join(dataDir, 'gear_pools.yaml'),
  `# Lignes aléatoires possibles par emplacement : plage en % au palier 1 ; elle est multipliée par tierScale du palier de l'objet.
# (La valeur tirée par exemplaire se situe entre min et max, voir engine/equipment.ts.)
tierScale: ${JSON.stringify(Object.fromEntries(TIERS.map((t, i) => [String(t), +(1 + i * 0.45).toFixed(2)])))}
pools:
${Object.entries(VARIABLE_LINES).map(([slot, lines]) => `  ${slot}: ${JSON.stringify(lines.map(([name, min, max]) => ({ name, min, max })))}`).join('\n')}
`,
);

writeFileSync(
  join(dataDir, 'gear_slots.yaml'),
  `# Emplacements d'équipement. capacity = combien d'exemplaires peuvent être portés à la fois (deux anneaux).
${SLOTS.map((s) => `- ${JSON.stringify({ id: s.id, name: s.name, kind: s.kind, capacity: s.id === 'ring' ? 2 : 1, weight: s.w })}`).join('\n')}
`,
);

writeFileSync(
  join(dataDir, 'gear_sets.yaml'),
  `# Ensembles d'équipement : bonus à 2, 3 et 4 pièces portées (indépendants de la rareté). Les pièces d'un ensemble sont les modèles de gear.yaml dont "set" est cet identifiant.
${SETS.map((s) => `- ${JSON.stringify({ id: s.id, name: s.name, class: s.cls, family: s.family, theme: s.theme, event: s.event, bonuses: s.bonuses, note: s.note })}`).join('\n')}
`,
);

// --- Fiche lisible ---
const rarityName = Object.fromEntries(RARITIES.map((r) => [r.id, r.name]));
const slotName = Object.fromEntries(SLOTS.map((s) => [s.id, s.name]));
const famName = { ...Object.fromEntries(FAMILIES.map((f) => [f.id, f.name])), jewel: 'Bijou' };
const className = { forgefire: 'Forgefeu', tracker: 'Traqueur', runist: 'Runiste' };
const classes = (cl) => (cl.length === 3 ? 'toutes' : cl.map((c) => className[c]).join(', '));
const stats = (m) => m.stats.map((s) => `${STATS[s.stat]} ${s.value}`).join(', ');
const scale = (t) => +(1 + TIERS.indexOf(t) * 0.45).toFixed(2);
const pool = (m) => VARIABLE_LINES[m.slot].map(([n, lo, hi]) => `${n} ${+(lo * scale(m.tier)).toFixed(1)}-${+(hi * scale(m.tier)).toFixed(1)} %`).join(' ; ');

let md = `# Équipement : tous les modèles du catalogue

Généré par \`docs/design/catalogue/export_gear.mjs\` à partir de \`data/gear.yaml\` (source de vérité du jeu). **${models.length} modèles.** Valeurs provisoires, à équilibrer.

- **Lignes fixes** : propres au modèle (1 en Commun, 2 sinon). **Lignes aléatoires** : tirées par exemplaire parmi la liste de la famille, en nombre variable selon la rareté (Commun 0-1, Rare 1-2, Épique 2-3, Légendaire 3-4), valeurs selon le palier.
- **Chef-d'œuvre** : tirage rare à la fabrication, lignes au maximum. Jamais obtenu par perfectionnement.
- Les raretés ne varient pas pour un même modèle : un modèle est Commun, Rare, Épique ou Légendaire.

Fichiers de données : \`data/gear.yaml\` (modèles), \`data/gear_pools.yaml\` (lignes aléatoires par emplacement), \`data/gear_slots.yaml\` (emplacements), \`data/gear_sets.yaml\` (ensembles).

`;

md += `## Ensembles\n\n`;
for (const s of SETS) {
  md += `### ${s.name}${s.event ? ' (événement)' : ''}\n${className[s.cls]} · ${famName[s.family]} · ${s.theme}\n\n`;
  s.bonuses.forEach((b, i) => (md += `- **${i + 2} pièces** : ${b}\n`));
  md += `\nPièces : ${models.filter((m) => m.set === s.id).map((m) => `${m.name} (${slotName[m.slot]})`).join(' ; ')}\n\n${s.note}\n\n`;
}

for (const tier of [...new Set(models.map((m) => m.tier))].sort((a, b) => a - b)) {
  md += `## Palier ${tier}\n\n`;
  for (const slot of SLOTS.map((s) => s.id)) {
    const list = models.filter((m) => m.tier === tier && m.slot === slot);
    if (!list.length) continue;
    md += `### ${slotName[slot]}, palier ${tier}\n\n| Nom | Famille | Classes | Rareté | Lignes fixes | Lignes aléatoires possibles | Emplacement de gemme |\n| --- | --- | --- | --- | --- | --- | --- |\n`;
    for (const m of list) {
      md += `| ${m.name}${m.named ? ' *' : ''}${m.set ? ' (ens.)' : ''} | ${famName[m.family] ?? m.family} | ${classes(m.classes)} | ${rarityName[m.rarity]} | ${stats(m)} | ${m.rolls[0]}-${m.rolls[1]} parmi : ${pool(m)} | ${m.socket} |\n`;
    }
    md += '\n';
  }
}
md += `\\* pièce nommée, avec un effet unique.\n`;
writeFileSync(join(here, 'ITEMS.md'), md);
console.log(models.length, 'modèles ;', 'ITEMS.md', (md.length / 1024).toFixed(0), 'Ko');
