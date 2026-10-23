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

/**
 * XP de `n` fabrications d'une recette (`each` par fabrication) pour un métier à `current` XP, avec l'XP doublée du
 * début [Décidé par Louis le 23 octobre : « remets l'XP double jusqu'au 20 »] : chaque fabrication commencée sous le
 * seuil (`threshold`, l'XP du niveau `untilLevel`) compte `multiplier` fois. Exact quel que soit le découpage en lots.
 */
export function boostedXp(each: number, n: number, current: number, threshold: number, multiplier: number): number {
  if (n <= 0 || each <= 0) return 0;
  if (multiplier <= 1 || current >= threshold) return each * n;
  const boosted = Math.min(n, Math.ceil((threshold - current) / (each * multiplier)));
  return boosted * each * multiplier + (n - boosted) * each;
}
