import { useMemo, useState } from 'react';
import type { TownEvent, TownPlayer } from '@bramo/shared';
import { useGame } from '../../game/GameContext';
import { useTown } from '../../game/useTown';
import { Character } from '../../rig/Character';
import { hhmm } from '../../format';
import { Scene } from '../../components/Scene';

/** Où se tient quelqu'un qui pratique ce métier (en % de la largeur ; centre de l'image, jamais recadré). */
const WORKPLACES: Record<string, number> = {
  mining: 24,
  woodcutting: 31,
  herbalism: 38,
  smithing: 46,
  carpentry: 54,
  cooking: 62,
  fishing: 72,
};

const KIND: Record<TownEvent['kind'], { label: string; color: string }> = {
  level: { label: 'Niveau', color: 'var(--good)' },
  trial: { label: 'Épreuve', color: 'var(--clan)' },
  first: { label: 'Première', color: 'var(--event)' },
  join: { label: 'Arrivée', color: 'var(--action)' },
  clan: { label: 'Clan', color: 'var(--clan)' },
};

/** Hachage stable d'un identifiant, pour des mouvements différents d'un joueur à l'autre. */
const spread = (id: number, mod: number) => ((id * 2654435761) >>> 0) % mod;

/** Un joueur dans la scène : au travail près de son lieu, ou en promenade s'il ne fait rien. */
function Walker({ p, slot }: { p: TownPlayer; slot: number }) {
  const place = p.doingProfession ? WORKPLACES[p.doingProfession] : undefined;
  const working = place !== undefined;
  const depth = spread(p.id, 3); // 0, 1, 2 : un peu d'étagement vertical
  const style = {
    '--x': working ? `${Math.min(94, Math.max(3, place! + (slot % 3) * 4 - 4))}%` : `${10 + spread(p.id + 3, 80)}%`,
    '--dur': `${70 + spread(p.id, 50)}s`,
    '--delay': `-${spread(p.id + 7, 100)}s`,
    '--dy': `${depth * 7}px`,
    zIndex: 3 - depth,
  } as React.CSSProperties;
  return (
    <div className={`walker ${working ? 'walker-working' : 'walker-strolling'}`} style={style}>
      <div className="walker-card">
        <strong>{p.name}</strong>
        <span>
          {p.nickname}
          {p.profession ? ` · niveau ${p.level}` : ''}
        </span>
        <span className="muted">{p.doing ?? 'se promène'}</span>
      </div>
      <Character appearance={{ classId: p.classId, outfit: p.outfit }} lod="scene" title={p.name} />
      <span className="walker-name">{p.name}</span>
    </div>
  );
}

export function Town() {
  const { openMarket, name } = useGame();
  const town = useTown();
  const [onlyMine, setOnlyMine] = useState(false);
  const others = useMemo(() => (town?.players ?? []).filter((p) => !p.self), [town]);
  const feed = useMemo(() => (town?.feed ?? []).filter((e) => !onlyMine || e.text.includes(name)), [town, onlyMine, name]);

  return (
    <section className="panel world town">
      <div className="town-scene">
        <Scene ids={['town']} position="50% 50%" shade={false} />
        <div className="town-walkers" aria-label="Joueurs dans le bourg">
          {others.map((p, i) => (
            <Walker key={p.id} p={p} slot={i} />
          ))}
        </div>
        <div className="town-title">
          <strong>Bramo</strong>
          <span className="muted">
            {others.length ? `${others.length} autre${others.length > 1 ? 's' : ''} joueur${others.length > 1 ? 's' : ''} dans le bourg` : 'le bourg est calme'}
          </span>
        </div>
      </div>

      <aside className="sunken world-info town-board">
        <div className="eyebrow" style={{ color: 'var(--clan)' }}>
          Panneau du bourg
        </div>
        <h2>Fil du serveur</h2>
        <div className="muted small">
          {town ? `${town.online} actif${town.online > 1 ? 's' : ''} · ${town.total} personnage${town.total > 1 ? 's' : ''}` : 'Chargement…'}
        </div>
        <div className="town-feed scroll">
          {feed.length === 0 && <p className="muted small">Rien à annoncer pour le moment. Les montées de niveau, les épreuves réussies et les premières fabrications apparaissent ici.</p>}
          {feed.map((e) => (
            <p key={e.id} className="town-line">
              <span className="journal-time">{hhmm(e.at)}</span>
              <span style={{ color: KIND[e.kind].color, fontWeight: 600 }}>{KIND[e.kind].label} </span>
              {e.text}
            </p>
          ))}
        </div>
        <div className="world-actions">
          <label className="small muted town-filter">
            <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> Mes annonces seulement
          </label>
          <button className="btn" onClick={() => openMarket()}>
            Aller au marché
          </button>
        </div>
      </aside>
    </section>
  );
}
