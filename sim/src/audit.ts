/**
 * Audit du contenu (data/) : tout ce qui est censé exister existe-t-il, et chaque chose sert-elle ? Demande de Louis du
 * 23 octobre, après le branchement des 17 métiers. `pnpm --filter @bramo/sim exec tsx src/audit.ts`.
 * Liste par sujet : objets sans source, objets sans débouché, ingrédients plus hauts que la recette, métiers sans outil,
 * sans commande de maître ou sans commande du Comptoir, outils sans recette, réparations impossibles, butin des rencontres,
 * bâtiments du clan, catégories déclarées et utilisées.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '@bramo/shared/node';

const root = fileURLToPath(new URL('../../', import.meta.url));
const content = loadContent(join(root, 'data'));
const items = content.items;
const recipes = Object.values(content.recipes);
const professions = content.professions;
const name = (id: string) => items[id]?.name ?? `?${id}`;

const findings: Record<string, string[]> = {};
const note = (topic: string, text: string) => (findings[topic] ??= []).push(text);

// Sources : recettes (avec le niveau minimal), butin des rencontres (vestiges), étal de la guilde.
const producedAt = new Map<string, { level: number; prof: string }>();
for (const r of recipes)
  for (const o of r.outputs) {
    const cur = producedAt.get(o.item);
    if (!cur || r.level < cur.level) producedAt.set(o.item, { level: r.level, prof: r.profession });
  }
const looted = new Set<string>();
for (const e of Object.values(content.combat?.encounters ?? {})) if (e.loot?.vestige) looted.add(e.loot.vestige);
const used = new Set<string>();
for (const r of recipes) for (const i of r.inputs) used.add(i.item);
for (const t of Object.values(content.trials)) for (const i of t.tasks) used.add(i.item);
for (const o of Object.values(content.npcOrders)) for (const i of o.items) used.add(i.item);
for (const b of Object.values(content.buildings)) for (const i of b.base.items) used.add(i.item);
for (const list of Object.values(content.gearCrafting?.materials ?? {})) for (const m of list) used.add(m.item);
for (const t of content.combat?.tide?.tides ?? []) for (const w of t.work.items) used.add(w.item);
for (const it of Object.values(items)) for (const m of it.repair?.materials ?? []) used.add(m.item);

// 1. Objets sans source, ou sans débouché.
for (const it of Object.values(items)) {
  // La poussière de l'Affineur vient du démontage des pièces et sert à la retaille (gear_crafting.yaml, refine).
  const dust = it.id === content.gearCrafting?.refine?.salvage?.item;
  const source = producedAt.has(it.id) || looted.has(it.id) || !!it.stallPrice || it.id === content.combat?.tide?.shards.item || dust;
  if (!source) note('Objets impossibles à obtenir', `${it.name} (${it.id}, ${it.category})`);
  const use = used.has(it.id) || !!it.meal || !!it.tool || !!it.gem || !!it.potion || !!it.prep || it.id === content.combat?.tide?.shards.item || (dust && !!content.gearCrafting?.refine?.reroll);
  if (!use) note('Objets sans débouché (ne servent qu’à la vente)', `${it.name} (${it.category})`);
}

// 2. Recettes : ingrédients obtenus plus haut que la recette (dans un autre métier, c'est normal ; signalé à titre d'info).
for (const r of recipes) {
  for (const i of r.inputs) {
    const src = producedAt.get(i.item);
    if (!src && !looted.has(i.item)) note('Ingrédients sans source', `${r.name} (${r.id}) demande ${name(i.item)}`);
    else if (src && src.prof === r.profession && src.level > r.level)
      note('Ingrédient du même métier plus haut que la recette', `${r.name} niv. ${r.level} demande ${name(i.item)} (niv. ${src.level})`);
  }
  const prof = professions.find((p) => p.id === r.profession);
  if (!prof) note('Recettes d’un métier inconnu', r.id);
  else if (prof.categories.length && !prof.categories.some((c) => c.id === r.category)) note('Recettes dans une catégorie non déclarée', `${r.id} → ${r.category} (${prof.name})`);
}

// 3. Métiers : outil, outil fabricable, commandes de maître, commandes du Comptoir, catégories vides, décor.
for (const p of professions) {
  const own = recipes.filter((r) => r.profession === p.id && !r.trial);
  const tools = Object.values(items).filter((i) => i.tool?.profession === p.id);
  if (!tools.length) note('Métiers sans outil', p.name);
  for (const t of tools) if (!producedAt.has(t.id)) note('Outils sans recette', `${t.name}${t.stallPrice ? ' (vendu à l’étal)' : ''}`);
  const trials = Object.values(content.trials).filter((t) => t.profession === p.id).map((t) => t.rank).sort((a, b) => a - b);
  if (trials.join() !== '20,40,60,80,99') note('Commandes de maître incomplètes', `${p.name} : ${trials.join(', ') || 'aucune'} (attendu 20, 40, 60, 80, 99)`);
  const orders = Object.values(content.npcOrders).filter((o) => o.profession === p.id);
  if (!orders.length) note('Métiers sans commande du Comptoir', p.name);
  for (const c of p.categories) if (!own.some((r) => r.category === c.id)) note('Catégories de métier vides', `${p.name} → ${c.name}`);
  const top = Math.max(0, ...own.map((r) => r.level));
  if (top < 60) note('Métiers sans recette au-delà du niveau 60', `${p.name} : dernière recette au niveau ${top}`);
  if (!existsSync(join(root, 'apps/web/public/scenes', `${p.id}.webp`))) note('Métiers sans décor', p.name);
  if (!p.master) note('Métiers sans maître', p.name);
  if (p.status !== 'playable') note('Métiers pas encore jouables', p.name);
}

// 4. Réparations : matériaux obtenables, métier jouable.
for (const it of Object.values(items)) {
  if (!it.repair) continue;
  for (const m of it.repair.materials) if (!producedAt.has(m.item)) note('Réparations impossibles', `${it.name} demande ${name(m.item)}`);
}

// 5. Commandes : maître et Comptoir, objets obtenables à leur niveau.
for (const t of Object.values(content.trials))
  for (const i of t.tasks) {
    const src = producedAt.get(i.item);
    if (!src) note('Commandes de maître impossibles', `${t.id} demande ${name(i.item)}`);
    else if (src.prof === t.profession && src.level > t.rank) note('Commandes de maître trop hautes', `${t.id} (rang ${t.rank}) demande ${name(i.item)} (niv. ${src.level})`);
  }
for (const o of Object.values(content.npcOrders))
  for (const i of o.items) {
    const src = producedAt.get(i.item);
    if (!src) note('Commandes du Comptoir impossibles', `${o.id} demande ${name(i.item)}`);
    else if (src.prof === o.profession && src.level > o.level) note('Commandes du Comptoir trop hautes', `${o.id} (niv. ${o.level}) demande ${name(i.item)} (niv. ${src.level})`);
  }

// 6. Bâtiments du clan : matériaux obtenables, métiers boostés existants.
for (const b of Object.values(content.buildings)) {
  for (const i of b.base.items) if (!producedAt.has(i.item)) note('Bâtiments impossibles', `${b.name} demande ${name(i.item)}`);
  for (const p of b.boost.professions) if (p !== 'all' && !professions.some((x) => x.id === p)) note('Bâtiments qui boostent un métier inconnu', `${b.name} → ${p}`);
}
const boosted = new Set(Object.values(content.buildings).flatMap((b) => b.boost.professions));
for (const p of professions) if (!boosted.has(p.id)) note('Métiers sans bâtiment de clan', p.name);

// 7. Combat : butin des rencontres, objets nommés et ensembles qui existent.
const models = Object.values(content.gearModels);
for (const e of Object.values(content.combat?.encounters ?? {})) {
  if (e.kind === 'profil') continue;
  if (e.loot?.vestige && !items[e.loot.vestige]) note('Butin : vestige inconnu', `${e.id} → ${e.loot.vestige}`);
  for (const n of e.loot?.named ?? []) if (!models.some((m) => m.talent === n)) note('Butin : objet nommé sans modèle', `${e.id} → ${n}`);
  for (const s of e.loot?.sets ?? []) if (!content.gearSets[s]) note('Butin : ensemble inconnu', `${e.id} → ${s}`);
  if (!e.loot && e.kind !== 'maree') note('Rencontres sans butin', e.id);
}
const craftable = models.filter((m) => (m as { source?: string[] }).source?.includes('craft')).length;
if (craftable) note('Équipement « fabricable » sans recette', `${craftable} modèles d’équipement ont la source « craft », mais aucune recette ne fabrique d’équipement de combat`);
const vestigeUsers = recipes.filter((r) => r.inputs.some((i) => looted.has(i.item)));
if (!vestigeUsers.length) note('Vestiges sans usage', `${looted.size} vestiges tombent en combat, aucune recette ne les utilise`);

// 8. Repas : bonus et durée.
for (const it of Object.values(items)) if (it.meal && (!it.meal.durationMin || !it.meal.bonus)) note('Repas sans effet', it.name);

const order = Object.keys(findings);
console.log(`Contenu : ${Object.keys(items).length} objets, ${recipes.length} recettes, ${professions.length} métiers, ${Object.keys(content.trials).length} commandes de maître, ${Object.values(content.npcOrders).length} commandes du Comptoir, ${models.length} modèles d’équipement.\n`);
for (const t of order) {
  console.log(`## ${t} (${findings[t]!.length})`);
  for (const line of findings[t]!.slice(0, 60)) console.log(`- ${line}`);
  if (findings[t]!.length > 60) console.log(`- … et ${findings[t]!.length - 60} autres`);
  console.log('');
}
