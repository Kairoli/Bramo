import type { Settings } from '../schemas/content.js';

/**
 * Courbe d'XP de RuneScape :
 * XP(L) = floor( Σ_{l=1}^{L-1} floor(l + 300·2^(l/7)) / 4 )
 */
export function xpForLevel(level: number): number {
  let points = 0;
  for (let l = 1; l < level; l++) {
    points += Math.floor(l + 300 * 2 ** (l / 7));
  }
  return Math.floor(points / 4);
}

/** Table indexée par niveau : table[L] = XP requise pour L. table[0] = 0. */
export function buildXpTable(maxLevel: number): number[] {
  const table = [0];
  for (let level = 1; level <= maxLevel; level++) table.push(xpForLevel(level));
  return table;
}

export function levelForXp(xp: number, table: number[]): number {
  let level = 1;
  while (level + 1 < table.length && xp >= table[level + 1]!) level++;
  return level;
}

/** Titre du plus haut palier atteint. */
export function titleForLevel(level: number, titles: Settings['titles']): string {
  let name = titles[0]!.name;
  for (const t of titles) if (level >= t.level) name = t.name;
  return name;
}

/** Prochain palier de titre, ou null au sommet. */
export function nextTitle(level: number, titles: Settings['titles']): Settings['titles'][number] | null {
  return titles.find((t) => t.level > level) ?? null;
}
