import { useId, useMemo, useState } from 'react';
import type { TownEvent, TownPlayer } from '@bramo/shared';
import { useGame } from '../../game/GameContext';
import { useTown } from '../../game/useTown';
import { Character } from '../../rig/Character';
import { hhmm } from '../../format';

/** Lieux de la scène : où se tient quelqu'un qui pratique ce métier (en % de la largeur). */
const WORKPLACES: Record<string, { x: number; label: string }> = {
  mining: { x: 8, label: 'Mines' },
  woodcutting: { x: 21, label: 'Bois' },
  herbalism: { x: 33, label: 'Jardins' },
  smithing: { x: 46, label: 'Forge' },
  carpentry: { x: 57, label: 'Menuiserie' },
  cooking: { x: 68, label: 'Cuisines' },
  fishing: { x: 90, label: 'Port' },
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

function Backdrop({ onGo }: { onGo: (profession: string) => void }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const place = (profession: string, children: React.ReactNode) => {
    const info = WORKPLACES[profession]!;
    return (
      <g
        className="town-place"
        role="button"
        tabIndex={0}
        aria-label={info.label}
        onClick={() => onGo(profession)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onGo(profession)}
      >
        {children}
        <text x={info.x * 10} y={402} textAnchor="middle" className="town-label">
          {info.label}
        </text>
      </g>
    );
  };
  return (
    <svg className="town-bg" viewBox="0 0 1000 420" preserveAspectRatio="xMidYMax slice" aria-hidden="false">
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sunken)" />
          <stop offset="1" stopColor="color-mix(in srgb, var(--event) 14%, var(--sunken))" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`}>
          <stop offset="0" stopColor="var(--action)" stopOpacity=".8" />
          <stop offset="1" stopColor="var(--action)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="420" fill={`url(#${uid}-sky)`} />
      {/* Montagnes lointaines */}
      <path d="M0 250 L90 170 L170 230 L260 150 L360 240 L450 190 L560 250 L640 180 L740 245 L840 160 L930 230 L1000 200 V300 H0Z" fill="var(--border)" opacity=".55" />
      <path d="M0 290 L120 235 L230 280 L330 225 L440 285 L560 240 L680 290 L800 235 L910 285 L1000 250 V330 H0Z" fill="var(--panel)" opacity=".9" />
      {/* Mer, à droite */}
      <rect x="800" y="318" width="200" height="40" fill="color-mix(in srgb, var(--market) 28%, var(--sunken))" />
      <path d="M800 330 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t20 0" fill="none" stroke="var(--market)" strokeOpacity=".5" strokeWidth="2" />
      {/* Mines */}
      {place('mining', <g>
        <path d="M20 340 L35 270 H125 L140 340Z" fill="var(--panel)" stroke="var(--border)" strokeWidth="2" />
        <path d="M55 340 V305 a25 25 0 0 1 50 0 V340Z" fill="var(--sunken)" />
        <rect x="30" y="262" width="100" height="10" fill="var(--border)" />
      </g>)}
      {/* Bois */}
      {place('woodcutting', <g>
        {[185, 215, 245].map((x, i) => <path key={x} d={`M${x} 340 l-26 0 l22 -48 l-14 0 l24 -56 l24 56 l-14 0 l22 48z`} fill="color-mix(in srgb, var(--good) 35%, var(--panel))" opacity={0.7 + i * 0.1} />)}
      </g>)}
      {/* Jardins */}
      {place('herbalism', <g>
        <rect x="285" y="318" width="95" height="22" rx="4" fill="color-mix(in srgb, var(--good) 22%, var(--panel))" stroke="var(--border)" />
        {[298, 318, 338, 358].map((x) => <circle key={x} cx={x} cy={314} r={9} fill="var(--good)" opacity=".6" />)}
      </g>)}
      {/* Forge : fenêtre qui rougeoie, fumée */}
      {place('smithing', <g>
        <rect x="410" y="268" width="110" height="72" fill="var(--panel)" stroke="var(--border)" strokeWidth="2" />
        <path d="M400 270 L465 224 L530 270Z" fill="var(--border)" />
        <rect x="498" y="212" width="14" height="40" fill="var(--border)" />
        <circle className="town-smoke" cx="505" cy="200" r="7" fill="var(--text-muted)" opacity=".35" />
        <circle className="town-smoke town-smoke-2" cx="508" cy="200" r="5" fill="var(--text-muted)" opacity=".3" />
        <circle cx="438" cy="306" r="30" fill={`url(#${uid}-glow)`} />
        <rect className="town-fire" x="426" y="292" width="24" height="26" rx="3" fill="var(--action)" />
        <rect x="470" y="300" width="30" height="40" fill="var(--sunken)" />
      </g>)}
      {/* Menuiserie */}
      {place('carpentry', <g>
        <rect x="548" y="282" width="90" height="58" fill="var(--panel)" stroke="var(--border)" strokeWidth="2" />
        <path d="M540 284 L593 246 L646 284Z" fill="color-mix(in srgb, var(--action) 25%, var(--border))" />
        <rect x="580" y="304" width="26" height="36" fill="var(--sunken)" />
      </g>)}
      {/* Halle de la guilde, au centre : bannière de clan */}
      <g>
        <rect x="650" y="238" width="86" height="102" fill="var(--panel)" stroke="var(--clan)" strokeWidth="2" strokeOpacity=".7" />
        <path d="M640 240 L693 196 L746 240Z" fill="var(--border)" />
        <path d="M693 196 V170" stroke="var(--border)" strokeWidth="3" />
        <path className="town-banner" d="M693 172 h30 l-8 10 l8 10 h-30z" fill="var(--clan)" />
        <rect x="680" y="296" width="26" height="44" fill="var(--sunken)" />
      </g>
      {/* Cuisines */}
      {place('cooking', <g>
        <rect x="760" y="290" width="70" height="50" fill="var(--panel)" stroke="var(--border)" strokeWidth="2" />
        <path d="M752 292 L795 262 L838 292Z" fill="var(--border)" />
        <rect x="778" y="308" width="22" height="32" fill="var(--sunken)" />
      </g>)}
      {/* Port : mât et lanterne */}
      {place('fishing', <g>
        <path d="M870 342 h80 l-14 -18 h-52z" fill="color-mix(in srgb, var(--action) 20%, var(--panel))" stroke="var(--border)" />
        <path d="M910 324 V262" stroke="var(--border)" strokeWidth="3" />
        <path d="M910 268 l28 36 h-28z" fill="var(--text-muted)" opacity=".5" />
        <circle cx="910" cy="258" r="6" fill="var(--event)" />
        <circle cx="910" cy="258" r="16" fill="var(--event)" opacity=".18" />
      </g>)}
      {/* Sol pavé */}
      <rect x="0" y="340" width="1000" height="80" fill="color-mix(in srgb, var(--panel) 80%, var(--bg))" />
      <path d="M0 340 H1000" stroke="var(--border)" strokeWidth="2" />
      {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${i * 66} 352 h40 M${i * 66 + 24} 372 h40`} stroke="var(--border)" strokeWidth="2" strokeLinecap="round" opacity=".6" />)}
    </svg>
  );
}

/** Un joueur dans la scène : au travail près de son lieu, ou en promenade s'il ne fait rien. */
function Walker({ p, slot }: { p: TownPlayer; slot: number }) {
  const place = p.doingProfession ? WORKPLACES[p.doingProfession] : undefined;
  const working = !!place;
  const depth = spread(p.id, 3); // 0, 1, 2 : un peu d'étagement vertical
  const style = {
    '--x': working ? `${Math.min(94, Math.max(3, place!.x + (slot % 3) * 4 - 4))}%` : `${10 + spread(p.id + 3, 80)}%`,
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
  const { go, openMarket, content, name } = useGame();
  const town = useTown();
  const [onlyMine, setOnlyMine] = useState(false);
  const others = useMemo(() => (town?.players ?? []).filter((p) => !p.self), [town]);
  const feed = useMemo(() => (town?.feed ?? []).filter((e) => !onlyMine || e.text.includes(name)), [town, onlyMine, name]);
  const goWork = (profession: string) => go('professions', content.professions.find((p) => p.id === profession)?.status === 'playable' ? profession : null);

  return (
    <section className="panel world town">
      <div className="town-scene">
        <Backdrop onGo={goWork} />
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
