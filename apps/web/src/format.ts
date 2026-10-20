const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export const num = (n: number) => nf.format(n);
export const pct = (ratio: number) => `${Math.round(ratio * 100)} %`;
export const signedPct = (ratio: number) => `+${Math.round(ratio * 100)} %`;

/** « 1 h 24 », « 12 min », « 40 s ». */
export function duration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

/** « 21 h 04 ». */
export function clock(t: number): string {
  const d = new Date(t);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
}

/** « 19:42 » pour le journal. */
export function hhmm(t: number): string {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const seconds = (s: number) => (Number.isInteger(s) ? `${s} s` : `${s.toFixed(1).replace('.', ',')} s`);
