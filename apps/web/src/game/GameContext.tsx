import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AdvanceSummary, Appearance, ContentResponse, JournalEntry, StateResponse, StateView } from '@bramo/shared';
import { api, RequestError } from '../api';
import { msUntilActivityEnds } from './useLive';

export type Room = 'home' | 'professions' | 'character' | 'clan' | 'market' | 'combat';

interface Game {
  content: ContentResponse;
  name: string;
  /** Sa photo de profil (version) et l'identifiant de son personnage. */
  avatar: number | null;
  characterId: number;
  state: StateView;
  /** Apparence du personnage (classe et tenue) ; undefined tant que la classe n'est pas choisie. */
  look: Appearance | undefined;
  /** Heure locale de réception de `state`, pour l'affichage interpolé. */
  receivedAt: number;
  journal: JournalEntry[];
  absence: AdvanceSummary | null;
  dismissAbsence: () => void;
  showAbsence: (summary: AdvanceSummary) => void;
  /** Envoie une intention au serveur ; renvoie false si elle est refusée. */
  act: (call: () => Promise<StateResponse>) => Promise<boolean>;
  error: string | null;
  /** Affiche un message d'erreur passager. */
  flash: (message: string) => void;
  room: Room;
  professionId: string | null;
  go: (room: Room, professionId?: string | null) => void;
  /** Objet à afficher en ouvrant le Marché (depuis le sac, une recette…). */
  marketItem: string | null;
  openMarket: (itemId?: string | null) => void;
  /** Recette à montrer en ouvrant la salle de son métier (« où l'obtenir » d'un ingrédient) ; `at` relance le choix. */
  recipeFocus: { id: string; at: number } | null;
  openRecipe: (recipeId: string) => void;
  logout: () => void;
}

const GameCtx = createContext<Game | null>(null);

export function useGame(): Game {
  const game = useContext(GameCtx);
  if (!game) throw new Error('useGame hors de GameProvider');
  return game;
}

export function GameProvider({
  content,
  initial,
  onLogout,
  children,
}: {
  content: ContentResponse;
  initial: StateResponse;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState({ res: initial, receivedAt: Date.now() });
  const [journal, setJournal] = useState<JournalEntry[]>(initial.journal);
  const [absence, setAbsence] = useState<AdvanceSummary | null>(initial.absence);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room>('home');
  const [professionId, setProfessionId] = useState<string | null>(null);
  const [marketItem, setMarketItem] = useState<string | null>(null);
  const errorTimer = useRef<number | undefined>(undefined);

  const apply = useCallback((res: StateResponse) => {
    setSnapshot({ res, receivedAt: Date.now() });
    if (res.journal.length) {
      setJournal((j) => [...[...res.journal].reverse(), ...j.filter((e) => !res.journal.some((n) => n.id === e.id))]);
    }
    if (res.absence) setAbsence(res.absence);
  }, []);

  const flash = useCallback((message: string) => {
    setError(message);
    window.clearTimeout(errorTimer.current);
    errorTimer.current = window.setTimeout(() => setError(null), 4000);
  }, []);

  const act = useCallback(
    async (call: () => Promise<StateResponse>) => {
      try {
        apply(await call());
        return true;
      } catch (err) {
        if (err instanceof RequestError && err.status === 401) onLogout();
        else flash(err instanceof Error ? err.message : 'Erreur inconnue.');
        return false;
      }
    },
    [apply, flash, onLogout],
  );

  // Historique du journal, puis signes de vie réguliers tant que l'onglet est visible.
  useEffect(() => {
    api.journal().then(setJournal).catch(() => {});
    const refresh = () => {
      if (document.visibilityState === 'visible') void act(api.state);
    };
    const id = window.setInterval(refresh, content.settings.presence.heartbeatSec * 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [act, content.settings.presence.heartbeatSec]);

  // Si l'activité doit finir avant le prochain signe de vie, on redemande l'état à ce moment-là.
  const { state } = snapshot.res;
  useEffect(() => {
    const recipe = state.activity && content.recipes[state.activity.recipeId];
    if (!recipe) return;
    const ms = msUntilActivityEnds(state, recipe);
    if (ms > content.settings.presence.heartbeatSec * 1000) return;
    const id = window.setTimeout(() => void act(api.state), Math.max(500, ms + 300));
    return () => window.clearTimeout(id);
  }, [state, content, act]);

  const go = useCallback((r: Room, p: string | null = null) => {
    setRoom(r);
    setProfessionId(p);
  }, []);

  const [recipeFocus, setRecipeFocus] = useState<{ id: string; at: number } | null>(null);
  const openRecipe = useCallback(
    (recipeId: string) => {
      const r = content.recipes[recipeId];
      if (!r) return;
      setRecipeFocus({ id: recipeId, at: Date.now() });
      setRoom('professions');
      setProfessionId(r.profession);
    },
    [content],
  );

  const openMarket = useCallback((itemId: string | null = null) => {
    setMarketItem(itemId);
    setRoom('market');
    setProfessionId(null);
  }, []);

  const logout = useCallback(() => {
    api.logout().finally(onLogout);
  }, [onLogout]);

  const value: Game = {
    content,
    name: snapshot.res.name,
    avatar: snapshot.res.avatar ?? null,
    characterId: snapshot.res.characterId,
    state: snapshot.res.state,
    look: snapshot.res.state.appearance ?? undefined,
    receivedAt: snapshot.receivedAt,
    journal,
    absence,
    dismissAbsence: () => setAbsence(null),
    showAbsence: setAbsence,
    act,
    error,
    flash,
    room,
    professionId,
    go,
    marketItem,
    openMarket,
    recipeFocus,
    openRecipe,
    logout,
  };
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}
