import { type Room, useGame } from '../game/GameContext';
import { num } from '../format';
import { EnergyButton } from './EnergyButton';
import { useState } from 'react';
import { Banners } from './Banners';
import { ProfileModal } from './Profile';
import { Avatar } from './Avatar';
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
  const { room, go, state, name, avatar, characterId, look } = useGame();
  const tide = useTide();
  const [tideOpen, setTideOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="logo">Bramo</div>
      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.room} role="tab" data-tour={t.room} aria-selected={room === t.room} onClick={() => go(t.room)}>
            {t.label}
          </button>
        ))}
      </nav>
      <Banners events={[<TideBanner
          key="tide"
          view={tide.view}
          onOpen={() => {
            tide.refresh();
            setTideOpen(true);
          }}
        />]} />
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
      {tideOpen && tide.view && <TideModal view={tide.view} refresh={tide.refresh} onClose={() => setTideOpen(false)} />}
      <div className="topbar-right">
        <div className="status-box">
          <span className="gold">{num(state.gold)} or</span>
          <EnergyButton />
        </div>
        {/* Le profil : la photo du joueur (sinon son personnage) ; la fenêtre a aussi le compte et la déconnexion. */}
        <button className="topbar-profile" onClick={() => setProfileOpen(true)} title="Profil et compte" data-tour="profile">
          <Avatar id={characterId} version={avatar} name={name} classId={look?.classId} appearance={look} size={46} open={false} />
        </button>
      </div>
    </header>
  );
}
