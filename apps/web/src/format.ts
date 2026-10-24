const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export const num = (n: number) => nf.format(n);
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
/** « 3,2 », « 12 » : un chiffre après la virgule au plus (XP des recettes). */
export const decimal = (n: number) => nf1.format(n);
export const pct = (ratio: number) => `${Math.round(ratio * 100)} %`;
/** Les gros nombres de la Force : « 134 450 », « 1,09 M », « 77,3 M », « 1,2 Md ». */
export function bigNum(n: number): string {
  if (n < 1e6) return nf.format(n);
  const [v, unit] = n < 1e9 ? [n / 1e6, 'M'] : [n / 1e9, 'Md'];
  return `${new Intl.NumberFormat('fr-FR', { maximumSignificantDigits: 3 }).format(v)} ${unit}`;
}
export const signedPct = (ratio: number) => `+${Math.round(ratio * 100)} %`;

/** « 1 h 24 », « 12 min », « 40 s ». */
export function duration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  // Au-delà d'un jour (les recherches longues) : « 2 j 4 h ».
  if (h >= 24) return h % 24 ? `${Math.floor(h / 24)} j ${h % 24} h` : `${Math.floor(h / 24)} j`;
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

/** Initiale d'un personnage du jeu (« Maîtresse Aldra » → « A ») : pour un médaillon en attendant un portrait. */
export const initialOf = (name: string) => (name.trim().split(/\s+/).pop() ?? '?').charAt(0).toUpperCase();
