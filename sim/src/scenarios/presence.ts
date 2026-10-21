import { gatherer, runBot } from '../bot.js';
import { loadVariant } from '../load.js';
import { PROFILES } from '../profiles.js';
import { fmt, table } from '../report.js';

/** Variantes de présence étudiées (réglages `data/settings.yaml` modifiés). */
export const PRESENCE_OPTIONS: { id: string; name: string; settings: unknown }[] = [
  { id: 'actuel', name: 'Actuel : 25 % hors ligne 12 h, énergie ×1,5 2 h', settings: {} },
  {
    id: 'h50',
    name: '50 % hors ligne, plafond 16 h, sans énergie',
    settings: { rates: { offline: 0.5, offlineCapHours: 16 }, energy: { multiplier: 1 } },
  },
  {
    id: 'h75',
    name: '75 % hors ligne, plafond 16 h, sans énergie',
    settings: { rates: { offline: 0.75, offlineCapHours: 16 }, energy: { multiplier: 1 } },
  },
  {
    id: 'h100_12',
    name: '100 %, autonomie 12 h, sans énergie',
    settings: { rates: { offline: 1, offlineCapHours: 12 }, energy: { multiplier: 1 } },
  },
  {
    id: 'h100_16',
    name: '100 %, autonomie 16 h, sans énergie',
    settings: { rates: { offline: 1, offlineCapHours: 16 }, energy: { multiplier: 1 } },
  },
  {
    id: 'h100_24',
    name: '100 %, autonomie 24 h, sans énergie',
    settings: { rates: { offline: 1, offlineCapHours: 24 }, energy: { multiplier: 1 } },
  },
];

const COLUMNS = ['casu20', 'casu2v', 'mobile', 'regular2h', 'tab16h', 'tab24h'];

/** Heures effectives par jour (sans bonus) de chaque profil, pour chaque variante. */
export function presenceMatrix(days = 8): { id: string; name: string; eff: Record<string, number> }[] {
  return PRESENCE_OPTIONS.map((o) => {
    const content = loadVariant(undefined, o.settings);
    const eff: Record<string, number> = {};
    for (const id of COLUMNS) {
      // Cuivre seulement : la recette ne change pas, seul le temps effectif compte.
      const r = runBot(content, PROFILES[id]!, gatherer('mining'), { days });
      const steady = r.effHoursByDay.slice(1);
      eff[id] = steady.reduce((a, b) => a + b, 0) / steady.length;
    }
    return { id: o.id, name: o.name, eff };
  });
}

export function presenceReport(): string {
  const m = presenceMatrix();
  const head = ['Variante', ...COLUMNS.map((c) => PROFILES[c]!.name), 'Onglet 24 h / casu 20 min', 'Régulier / casu 20 min', 'Téléphone / onglet 16 h'];
  const rows = m.map((r) => [
    r.name,
    ...COLUMNS.map((c) => fmt(r.eff[c]!, 1)),
    `×${fmt(r.eff.tab24h! / r.eff.casu20!, 2)}`,
    `×${fmt(r.eff.regular2h! / r.eff.casu20!, 2)}`,
    `${fmt((100 * r.eff.mobile!) / r.eff.tab16h!, 0)} %`,
  ]);
  return table(head, rows);
}
