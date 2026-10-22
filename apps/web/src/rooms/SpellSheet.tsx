import { useEffect, useMemo, useState } from 'react';
import type { Appearance, TimelineEvent } from '@bramo/shared';
import { api } from '../api';
import { useContent } from '../game/ContentContext';
import { CombatStage, type StageSpell, fxOf, leadOf } from '../components/CombatStage';
import { Scene } from '../components/Scene';

type SheetSpell = StageSpell & { id: string; class: string; level: number; path: string | null };

/** Instants montrés : pendant le geste, au lâcher, à l'arrivée, après. */
const MOMENTS = [
  { id: 'gesture', name: 'Geste', at: (lead: number, travel: number) => -lead + (lead - travel) * 0.6 },
  { id: 'flight', name: 'Trajet', at: (_: number, travel: number) => -travel * 0.45 },
  { id: 'impact', name: 'Arrivée', at: () => 0.08 },
  { id: 'after', name: 'Après', at: () => 0.45 },
] as const;

/**
 * Planche des sorts (/#planche, développement) : tous les sorts d'une classe côte à côte, figés au même instant de leur
 * effet. Pour relire d'un coup d'œil que chaque sort a sa signature.
 */
export function SpellSheet() {
  const content = useContent();
  const classes = Object.values(content.classes);
  const [classId, setClassId] = useState(classes[0]?.id ?? 'runist');
  const [moment, setMoment] = useState<(typeof MOMENTS)[number]['id']>('impact');
  const [all, setAll] = useState<SheetSpell[]>([]);
  useEffect(() => {
    api.combatSpells().then((r) => setAll(r.spells)).catch(() => setAll([]));
  }, []);
  const spells = useMemo(() => Object.fromEntries(all.map((s) => [s.id, s])), [all]);
  const look: Appearance = useMemo(() => ({ classId, outfit: content.classes[classId]?.startingOutfit ?? content.cosmetics.default.outfit }), [classId, content]);
  const mine = all.filter((s) => s.class === classId).sort((a, b) => (a.path ?? '').localeCompare(b.path ?? '') || a.level - b.level);
  const tiles: { id: string | null; name: string }[] = [{ id: null, name: 'Attaque de base' }, ...mine.map((s) => ({ id: s.id, name: s.name }))];
  const m = MOMENTS.find((x) => x.id === moment)!;
  return (
    <div className="sheet">
      <div className="row-gap sheet-tools">
        {classes.map((c) => (
          <button key={c.id} className={`btn btn-sm${c.id === classId ? ' btn-primary' : ''}`} onClick={() => setClassId(c.id)}>
            {c.name}
          </button>
        ))}
        {MOMENTS.map((x) => (
          <button key={x.id} className={`btn btn-sm${x.id === moment ? ' btn-primary' : ''}`} onClick={() => setMoment(x.id)}>
            {x.name}
          </button>
        ))}
      </div>
      <div className="sheet-grid">
        {tiles.map((tile) => {
          const e: TimelineEvent = tile.id ? { t: 3, kind: 'cast', spell: tile.id, hp: 0.7, dmg: 420, self: 0.9 } : { t: 3, kind: 'basic', hp: 0.7, dmg: 260, self: 0.9 };
          const fx = fxOf(classId, e);
          const at = 3 + m.at(leadOf(fx), fx.travel);
          return (
            <div key={tile.id ?? 'basic'} className="sheet-tile">
              <div className="panel band sheet-band">
                <Scene ids={['combat']} />
                <CombatStage look={look} enemy={{ count: (spells[tile.id ?? '']?.effects?.targets ?? 1) > 1 ? 2 : 1, kind: 'shadow' }} timeline={[e]} clock={() => at} fightTime={null} win={null} spells={spells} timeScale={0} />
              </div>
              <span className="small">{tile.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
