import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { PlayerCard } from './PlayerCard';

/**
 * Ouvrir la page profil d'un joueur de n'importe où [demande de Louis, 23 octobre : « quand on clique sur une photo de
 * profil ou un nom, ça ouvre une page profil »]. Une seule page à la fois, rendue au niveau du jeu ; hors du jeu (pages
 * de développement), photos et noms restent de simples images et textes.
 */
const OpenProfile = createContext<((id: number) => void) | null>(null);

export function ProfileOpener({ children }: { children: ReactNode }) {
  const [id, setId] = useState<number | null>(null);
  // Les joueurs d'essai (démonstration de la Marée) ont un identifiant négatif : pas de page.
  const open = useCallback((x: number) => x > 0 && setId(x), []);
  return (
    <OpenProfile.Provider value={open}>
      {children}
      {id !== null && <PlayerCard key={id} id={id} onClose={() => setId(null)} />}
    </OpenProfile.Provider>
  );
}

/** De quoi ouvrir une page profil, ou null hors du jeu. */
export function useOpenProfile(): ((id: number) => void) | null {
  return useContext(OpenProfile);
}

/** Le nom d'un joueur, cliquable : il ouvre sa page profil. */
export function PlayerName({ id, children, className }: { id: number | null | undefined; children: ReactNode; className?: string }) {
  const open = useOpenProfile();
  if (!open || !id || id <= 0) return <strong className={className}>{children}</strong>;
  return (
    <button
      type="button"
      className={`player-link${className ? ` ${className}` : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        open(id);
      }}
      title="Voir sa page profil"
    >
      {children}
    </button>
  );
}
