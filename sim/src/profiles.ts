/**
 * Profils de présence : quand le joueur a le jeu ouvert et visible (le client envoie ses signes de vie).
 * Heures en UTC, durées en minutes. Le reste du temps, le jeu est fermé ou en arrière-plan.
 */
export interface Session {
  /** Heure de début (UTC, décimale : 19.5 = 19 h 30). */
  at: number;
  minutes: number;
}

export interface PresenceProfile {
  id: string;
  name: string;
  sessions: Session[];
}

export const PROFILES: Record<string, PresenceProfile> = {
  casu20: { id: 'casu20', name: 'Casu : 20 min, une session le soir', sessions: [{ at: 19.5, minutes: 20 }] },
  casu2v: {
    id: 'casu2v',
    name: 'Casu : 2 visites (5 min matin, 15 min soir)',
    sessions: [
      { at: 7.5, minutes: 5 },
      { at: 19.5, minutes: 15 },
    ],
  },
  mobile: {
    id: 'mobile',
    name: 'Téléphone : 6 visites de 3 min',
    sessions: [7, 10, 13, 16, 19, 22].map((at) => ({ at, minutes: 3 })),
  },
  regular2h: {
    id: 'regular2h',
    name: 'Régulier : 2 h par jour en deux sessions',
    sessions: [
      { at: 12.5, minutes: 30 },
      { at: 19, minutes: 90 },
    ],
  },
  block2h: { id: 'block2h', name: 'Régulier : 2 h d’un bloc le soir', sessions: [{ at: 18, minutes: 120 }] },
  tab16h: { id: 'tab16h', name: 'Onglet visible toute la journée (7 h–23 h)', sessions: [{ at: 7, minutes: 960 }] },
  tab24h: { id: 'tab24h', name: 'Onglet visible jour et nuit', sessions: [{ at: 0, minutes: 1440 }] },
};

export function profile(id: string): PresenceProfile {
  const p = PROFILES[id];
  if (!p) throw new Error(`Profil inconnu : ${id} (connus : ${Object.keys(PROFILES).join(', ')})`);
  return p;
}
