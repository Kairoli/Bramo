import type { Lod } from '@bramo/shared';
import { Character } from '../rig/Character';

/**
 * Banc de mesure du coût d'une tenue (page de développement `/#perf`, 23 octobre) : N personnages animés à la taille du
 * bourg, pour comparer les images par seconde d'une tenue à l'autre (`art/perf.mjs` les mesure dans Edge sans fenêtre).
 * Paramètres avant le # : `outfit`, `class`, `n` (20), `lod` (scene).
 */
export function PerfBench() {
  const q = new URLSearchParams(location.search);
  const outfit = q.get('outfit') ?? 'ashes';
  const classId = q.get('class') ?? 'runist';
  const n = Number(q.get('n') ?? 20);
  const lod = (q.get('lod') as Lod) ?? 'scene';
  // Essais : sans lueurs (filtres), sans matières (motifs), ou figés.
  const flags = ['nofx', 'nopat', 'noanim'].filter((k) => q.has(k)).join(' ');
  // crowd : le mode foule du bourg (rig.css).
  const crowd = q.has('crowd');
  const still = q.has('still');
  // drop=cape,robe : retirer des pièces, pour trouver celle qui coûte.
  const overrides = Object.fromEntries((q.get('drop') ?? '').split(',').filter(Boolean).map((slot) => [slot, null]));
  return (
    <div className={`perf-bench ${flags}`}>
      {Array.from({ length: n }, (_, i) => (
        <Character key={i} appearance={{ classId, outfit, overrides }} lod={lod} animate={!still} crowd={crowd} />
      ))}
    </div>
  );
}
