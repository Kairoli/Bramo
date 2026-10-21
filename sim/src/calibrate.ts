import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Document, isMap, isSeq, parseDocument } from 'yaml';
import { unitCost, workSec } from './chains.js';
import { DATA_DIR, PROPOSALS_DIR, loadVariant } from './load.js';
import { GOLD_PER_WORK_HOUR, MEAL_PAYBACK, NPC_BUYBACK, ruleXp } from './rules.js';
import { proposalOptions } from './scenarios/chains.js';

export interface Change {
  file: string;
  id: string;
  field: string;
  from: unknown;
  to: unknown;
}

function eachMap(doc: Document, fn: (map: import('yaml').YAMLMap) => void): void {
  if (!isSeq(doc.contents)) return;
  for (const node of doc.contents.items) if (isMap(node)) fn(node);
}

/**
 * Recalcule les données dérivées d'une proposition à partir des règles (rules.ts) :
 * - l'XP de chaque recette, depuis son niveau et sa durée ;
 * - la durée de chaque repas, pour que son bonus rapporte MEAL_PAYBACK fois son coût de chaîne ;
 * - la valeur (rachat PNJ) de chaque objet, depuis son coût de chaîne.
 * Les commentaires et la mise en forme YAML sont conservés.
 */
export function calibrate(proposal: string | null, write: boolean): Change[] {
  // null : les données du jeu elles-mêmes (data/).
  const dir = proposal ? join(PROPOSALS_DIR, proposal) : DATA_DIR;
  const changes: Change[] = [];

  // 1. XP des recettes.
  for (const file of readdirSync(join(dir, 'recipes')).filter((f) => f.endsWith('.yaml'))) {
    const path = join(dir, 'recipes', file);
    const doc = parseDocument(readFileSync(path, 'utf8'));
    eachMap(doc, (m) => {
      const inputs = m.get('inputs');
      const crafting = isSeq(inputs) && inputs.items.length > 0;
      const xp = ruleXp(Number(m.get('level')), Number(m.get('durationSec')), crafting);
      if (Number(m.get('xp')) !== xp) {
        changes.push({ file: `recipes/${file}`, id: String(m.get('id')), field: 'xp', from: m.get('xp'), to: xp });
        m.set('xp', xp);
      }
    });
    if (write) writeFileSync(path, doc.toString({ lineWidth: 0, flowCollectionPadding: false }));
  }

  // 2. et 3. Repas et valeurs, sur le contenu recalculé.
  const content = loadVariant(proposal ?? undefined);
  const opts = proposal ? proposalOptions(proposal) : {};
  const path = join(dir, 'items.yaml');
  const doc = parseDocument(readFileSync(path, 'utf8'));
  eachMap(doc, (m) => {
    const id = String(m.get('id'));
    let cost;
    try {
      cost = unitCost(id, content, opts);
    } catch {
      return;
    }
    const sec = workSec(cost);
    const meal = m.get('meal');
    if (isMap(meal) && sec > 0) {
      const bonus = Number(meal.get('bonus'));
      const minutes = Math.max(15, Math.round((MEAL_PAYBACK * sec) / bonus / 60 / 15) * 15);
      if (Number(meal.get('durationMin')) !== minutes) {
        changes.push({ file: 'items.yaml', id, field: 'meal.durationMin', from: meal.get('durationMin'), to: minutes });
        meal.set('durationMin', minutes);
      }
    }
    const value = Math.max(1, Math.round(((sec / 3600) * GOLD_PER_WORK_HOUR + cost.gold) * NPC_BUYBACK));
    if (Number(m.get('value')) !== value) {
      changes.push({ file: 'items.yaml', id, field: 'value', from: m.get('value'), to: value });
      m.set('value', value);
    }
  });
  if (write) writeFileSync(path, doc.toString({ lineWidth: 0, flowCollectionPadding: false }));
  return changes;
}
