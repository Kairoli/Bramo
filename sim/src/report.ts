/** Tableau Markdown. */
export function table(head: string[], rows: (string | number)[][]): string {
  const line = (cells: (string | number)[]) => `| ${cells.join(' | ')} |`;
  return [line(head), line(head.map(() => '---')), ...rows.map(line)].join('\n');
}

/** Durée en jours lisible : « 45 min », « 6 h », « 3,5 j », « 4,2 mois ». */
export function fmtDays(days: number | undefined): string {
  if (days === undefined) return '—';
  const h = days * 24;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 24) return `${fmt(h, h < 10 ? 1 : 0)} h`;
  if (days < 60) return `${fmt(days, days < 10 ? 1 : 0)} j`;
  return `${fmt(days / 30.4, 1)} mois`;
}

export function fmt(n: number, digits = 0): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function pct(n: number, digits = 0): string {
  return `${fmt(n * 100, digits)} %`;
}
