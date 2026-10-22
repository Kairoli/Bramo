import { useEffect, useId, useState } from 'react';
import { BESTIARY } from '../combat-fx/bestiary';
import { Scene } from '../components/Scene';

/**
 * Bestiaire (/#bestiaire, développement) : chaque ennemi de la route, animé, sur le décor du combat. Un clic le fait
 * frapper, un autre le fait encaisser.
 */
export function BestiaryPage() {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    let id = 0;
    const loop = (t: number) => {
      setNow(t);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  const [hits, setHits] = useState<Record<string, { at: number; kind: 'strike' | 'hurt' }>>({});
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <div className="sheet">
      <div className={`bestiary-grid${location.search.includes('big') ? ' big' : ''}`}>
        {Object.entries(BESTIARY).map(([id, c]) => {
          const h = hits[id];
          const age = h ? (now - h.at) / 1000 : 9;
          const pulse = age < 0.5 ? Math.sin((age / 0.5) * Math.PI) : 0;
          const strike = h?.kind === 'strike' ? pulse : 0;
          const hurt = h?.kind === 'hurt' ? pulse : 0;
          const sc = 0.95 * (c.scale ?? 1);
          return (
            <div key={id} className="sheet-tile">
              <div className="panel band bestiary-band" onClick={(e) => setHits({ ...hits, [id]: { at: performance.now(), kind: e.shiftKey ? 'hurt' : 'strike' } })}>
                <Scene ids={['combat']} />
                <svg viewBox="0 0 400 300" className="bestiary-svg" preserveAspectRatio="xMidYMax meet">
                  <g transform={`translate(${200 - strike * 30} 292) scale(${sc})`} style={{ filter: hurt ? `brightness(${1 + hurt * 0.9})` : undefined }}>
                    <g transform="translate(-100 -260)">{c.draw({ t: now / 1000, strike, hurt, u: `${uid}${id}` })}</g>
                  </g>
                </svg>
              </div>
              <span className="small">
                <strong>{c.name}</strong> <span className="muted">{id}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
