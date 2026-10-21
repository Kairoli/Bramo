import { useState } from 'react';
import { type Room, useGame } from '../../game/GameContext';

interface Place {
  id: string;
  name: string;
  letter: string;
  x: number;
  y: number;
  color: string;
  description: string;
  professions?: string[];
  shop?: boolean;
  room?: Room;
}

/** Lieux de la carte. Positions en % de la zone de carte. */
const PLACES: Place[] = [
  {
    id: 'mines',
    name: 'Mines',
    letter: 'M',
    x: 22,
    y: 30,
    color: 'var(--text-muted)',
    description: 'Les galeries des Monts de Brisefer. Cuivre et étain en surface, mithril tout au fond.',
    professions: ['mining'],
  },
  {
    id: 'gardens',
    name: 'Jardins',
    letter: 'J',
    x: 13,
    y: 70,
    color: 'var(--good)',
    description: 'Les Jardins des Brumes, où l’on cueille herbes, racines et fleurs rares.',
    professions: ['herbalism'],
  },
  {
    id: 'camp',
    name: 'Campement',
    letter: 'C',
    x: 44,
    y: 56,
    color: 'var(--action)',
    description: 'Le cœur de Bramo : la forge de Maître Brunhild et les cuisines de Maître Bertin.',
    professions: ['smithing', 'cooking'],
  },
  {
    id: 'woods',
    name: 'Bois',
    letter: 'B',
    x: 30,
    y: 82,
    color: 'var(--good)',
    description: 'Le Bois des Murmures. Les bûcherons y arriveront bientôt.',
    professions: ['woodcutting', 'hunting'],
  },
  {
    id: 'hall',
    name: 'Halle du clan',
    letter: 'H',
    x: 50,
    y: 22,
    color: 'var(--clan)',
    description: 'La future halle des clans : entrepôt commun, commandes et grands projets.',
    room: 'clan',
  },
  {
    id: 'arena',
    name: 'Arène',
    letter: 'A',
    x: 68,
    y: 22,
    color: 'var(--magic)',
    description: 'Les combats et les arènes ouvriront plus tard.',
    room: 'combat',
  },
  {
    id: 'port',
    name: 'Port',
    letter: 'P',
    x: 64,
    y: 72,
    color: 'var(--market)',
    description: 'Le port de la Mer des Lanternes. On y pêche, et la place du marché est toute proche.',
    professions: ['fishing'],
    shop: true,
  },
];

export function WorldMap() {
  const { content, state, go, openMarket } = useGame();
  const [selected, setSelected] = useState('camp');
  const place = PLACES.find((p) => p.id === selected)!;
  const activeProfession = state.activity && content.recipes[state.activity.recipeId]?.profession;

  return (
    <section className="panel world">
      <div className="world-map">
        <svg className="world-bg" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden>
          <path d="M770 0 Q720 90 760 170 Q800 250 730 330 Q700 380 720 400 L1000 400 L1000 0 Z" fill="var(--sunken)" />
          <path d="M770 0 Q720 90 760 170 Q800 250 730 330 Q700 380 720 400" fill="none" stroke="var(--border)" strokeWidth="2" />
          <path d="M120 200 L190 120 L250 190 L310 100 L400 200 Z" fill="none" stroke="var(--border)" strokeWidth="2" />
          <path d="M440 225 Q560 250 640 290" stroke="var(--action)" strokeWidth="2" strokeDasharray="8 8" fill="none" opacity="0.6" />
          <text x="230" y="235" className="world-region">Monts de Brisefer</text>
          <text x="60" y="350" className="world-region">Jardins des Brumes</text>
          <text x="820" y="60" className="world-region">Mer des Lanternes</text>
        </svg>
        <div className="eyebrow world-title">Carte du monde · prototype solo</div>
        {PLACES.map((p) => {
          const busy = p.professions?.includes(activeProfession ?? '');
          return (
            <button
              key={p.id}
              className={`place${selected === p.id ? ' selected' : ''}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, color: p.color }}
              onClick={() => setSelected(p.id)}
            >
              <span className="place-dot">{p.letter}</span>
              <span className="place-name">{p.name}</span>
              {busy && <span className="place-busy" title="Activité en cours ici" />}
            </button>
          );
        })}
      </div>

      <aside className="sunken world-info">
        <div className="eyebrow" style={{ color: place.color }}>
          Lieu
        </div>
        <h2>{place.name}</h2>
        <p className="muted">{place.description}</p>
        <div className="world-actions">
          {place.professions?.map((id) => {
            const p = content.professions.find((x) => x.id === id);
            if (!p) return null;
            const playable = p.status === 'playable';
            return (
              <button key={id} className="btn" disabled={!playable} onClick={() => go('professions', id)}>
                {p.name}
                <span className="muted">{playable ? ` · niv. ${state.skills[id]?.level ?? 1}` : ' · bientôt'}</span>
              </button>
            );
          })}
          {place.shop && (
            <button className="btn btn-primary" onClick={() => openMarket()}>
              Aller au marché
            </button>
          )}
          {place.room && (
            <button className="btn" onClick={() => go(place.room!)}>
              Bientôt
            </button>
          )}
        </div>
      </aside>
    </section>
  );
}
