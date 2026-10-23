import { type Room, useGame } from '../game/GameContext';
import { num } from '../format';
import { EnergyButton } from './EnergyButton';
import { useState } from 'react';
import { Banners } from './Banners';
import { TideBanner, TideModal, useTide } from './Tide';

const TABS: { room: Room; label: string }[] = [
  { room: 'home', label: 'Accueil' },
  { room: 'professions', label: 'Métiers' },
  { room: 'character', label: 'Personnage' },
  { room: 'clan', label: 'Clan' },
  { room: 'market', label: 'Marché' },
  { room: 'combat', label: 'Combat' },
];

export function TopBar() {
  const { room, go, state, logout } = useGame();
  const tide = useTide();
  const [tideOpen, setTideOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="logo">Bramo</div>
      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.room} role="tab" aria-selected={room === t.room} onClick={() => go(t.room)}>
            {t.label}
          </button>
        ))}
      </nav>
      <Banners events={[<TideBanner key="tide" view={tide.view} onOpen={() => setTideOpen(true)} />]} />
      {tideOpen && tide.view && <TideModal view={tide.view} refresh={tide.refresh} onClose={() => setTideOpen(false)} />}
      <div className="topbar-right">
        <div className="status-box">
          <span className="gold">{num(state.gold)} or</span>
          <EnergyButton />
        </div>
        {import.meta.env.DEV && (
          <a className="btn btn-ghost btn-sm" href="#atelier" title="Atelier de personnages (développement)">
            Atelier
          </a>
        )}
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Quitter
        </button>
      </div>
    </header>
  );
}
