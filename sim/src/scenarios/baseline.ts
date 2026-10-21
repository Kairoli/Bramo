import type { Content } from '@bramo/shared';
import { gatherer, runBot } from '../bot.js';
import { profile } from '../profiles.js';
import { fmt, fmtDays, table } from '../report.js';
import { LEVELS } from './progression.js';

/**
 * Vérification demandée : Minage seul, 2 h de présence par jour, sans outil ni repas,
 * meilleur minerai accessible pour l'XP. Rejoue aussi d'autres profils de présence.
 */
export function miningProgression(content: Content, profiles: string[], days: number): string {
  const rows = profiles.map((id) => {
    const r = runBot(content, profile(id), gatherer('mining'), { days, track: { skill: 'mining', levels: LEVELS } });
    const eff = r.effHoursByDay.slice(1, 8);
    const avgEff = eff.reduce((a, b) => a + b, 0) / eff.length;
    return [profile(id).name, fmt(avgEff, 1), ...LEVELS.map((l) => fmtDays(r.levelDay[l]))];
  });
  return table(['Profil', 'h eff./jour', ...LEVELS.map((l) => `Niv. ${l}`)], rows);
}
