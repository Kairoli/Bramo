import { useEffect, useState } from 'react';
import type { TownView } from '@bramo/shared';
import { api } from '../api';

/** Le bourg : joueurs récemment actifs et fil du serveur, rafraîchis tant que l'onglet est visible. */
export function useTown(everyMs = 20_000): TownView | null {
  const [town, setTown] = useState<TownView | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => {
      if (document.visibilityState !== 'visible') return;
      api.town().then((t) => live && setTown(t)).catch(() => {});
    };
    load();
    const id = window.setInterval(load, everyMs);
    document.addEventListener('visibilitychange', load);
    return () => {
      live = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', load);
    };
  }, [everyMs]);
  return town;
}
