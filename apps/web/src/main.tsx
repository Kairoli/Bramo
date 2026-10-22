import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { ContentResponse, StateResponse } from '@bramo/shared';
import { api, RequestError } from './api';
import { GameProvider, useGame } from './game/GameContext';
import { LoginScreen } from './LoginScreen';
import { TopBar } from './components/TopBar';
import { AbsenceModal } from './components/AbsenceModal';
import { ClanRoom } from './rooms/ClanRoom';
import { MarketRoom } from './rooms/MarketRoom';
import { ClassScreen } from './components/ClassChoice';
import { Home } from './rooms/Home';
import { Professions } from './rooms/Professions';
import { ProfessionRoom } from './rooms/ProfessionRoom';
import { CharacterRoom } from './rooms/CharacterRoom';
import { CombatRoom } from './rooms/CombatRoom';
import { Atelier } from './rooms/Atelier';
import { OrnamentGallery } from './rooms/OrnamentGallery';
import { Arena } from './rooms/Arena';
import { SpellSheet } from './rooms/SpellSheet';
import { GearIcons } from './rooms/GearIcons';
import { BestiaryPage } from './rooms/Bestiary';
import { ContentContext } from './game/ContentContext';
import './styles/global.css';
import './styles/rooms.css';

function Shell() {
  const { state, room, professionId, absence, error } = useGame();
  // Chaque personnage choisit sa classe avant d'entrer, même fraîchement créé.
  if (!state.classId) {
    return (
      <div className="app">
        <ClassScreen />
        {error && <div className="toast">{error}</div>}
      </div>
    );
  }
  return (
    <div className="app">
      <TopBar />
      {room === 'home' && <Home />}
      {room === 'professions' && (professionId ? <ProfessionRoom key={professionId} id={professionId} /> : <Professions />)}
      {room === 'character' && <CharacterRoom />}
      {room === 'clan' && <ClanRoom />}
      {room === 'market' && <MarketRoom />}
      {room === 'combat' && <CombatRoom />}
      {absence && <AbsenceModal summary={absence} />}
      {error && <div className="toast">{error}</div>}
    </div>
  );
}

function App() {
  const [content, setContent] = useState<ContentResponse | null>(null);
  const [session, setSession] = useState<StateResponse | null | undefined>(undefined);
  const [fatal, setFatal] = useState<string | null>(null);
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onHash = () => setHash(location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const loadState = useCallback(() => {
    api
      .state()
      // Le résumé d'absence n'est envoyé qu'une fois : ne pas le perdre si deux réponses se croisent.
      .then((res) => setSession((prev) => (prev && !res.absence ? { ...res, absence: prev.absence } : res)))
      .catch((err) => (err instanceof RequestError && err.status === 401 ? setSession(null) : setFatal(err.message)));
  }, []);

  useEffect(() => {
    api
      .content()
      .then(setContent)
      .catch((err) => setFatal(err.message));
    loadState();
  }, [loadState]);

  if (fatal) return <div className="center-message">{fatal}</div>;
  if (!content || session === undefined) return <div className="center-message muted">Chargement…</div>;
  return (
    <ContentContext.Provider value={content}>
      {hash === '#atelier' ? (
        <Atelier />
      ) : hash === '#ornements' ? (
        <OrnamentGallery />
      ) : hash === '#arene' && import.meta.env.DEV ? (
        <Arena />
      ) : hash === '#planche' && import.meta.env.DEV ? (
        <SpellSheet />
      ) : hash === '#bestiaire' && import.meta.env.DEV ? (
        <BestiaryPage />
      ) : hash === '#icones' && import.meta.env.DEV ? (
        <GearIcons />
      ) : !session ? (
        <LoginScreen onLoggedIn={loadState} />
      ) : (
        <GameProvider content={content} initial={session} onLogout={() => setSession(null)}>
          <Shell />
        </GameProvider>
      )}
    </ContentContext.Provider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
