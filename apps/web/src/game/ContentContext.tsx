import { createContext, useContext } from 'react';
import type { ContentResponse } from '@bramo/shared';

/** Contenu public (données du jeu), disponible avant comme après la connexion. */
export const ContentContext = createContext<ContentResponse | null>(null);

export function useContent(): ContentResponse {
  const content = useContext(ContentContext);
  if (!content) throw new Error('useContent hors de ContentContext');
  return content;
}
