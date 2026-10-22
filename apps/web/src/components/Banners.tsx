import type { ReactNode } from 'react';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { useLiveActivity, useNow } from '../game/useLive';
import { clock, num } from '../format';

/**
 * Bandeaux dans la barre du haut, entre les onglets et l'or : l'activité en cours, puis jusqu'à deux bandeaux
 * d'événement (Marée du soir, Concours des Maîtres…) qui se partageront la place quand il y en aura.
 */
export function Banners({ events = [] }: { events?: ReactNode[] }) {
  return (
    <div className="banners">
      <ActivityBanner />
      {events.slice(0, 2)}
    </div>
  );
}

function Banner({ icon, tone, title, sub, progress, onOpen, action }: { icon: ReactNode; tone: string; title: ReactNode; sub: ReactNode; progress?: number; onOpen: () => void; action?: ReactNode }) {
  return (
    <div className="banner" style={{ ['--tone' as string]: tone }}>
      <button className="banner-main" onClick={onOpen}>
        <span className="banner-icon">{icon}</span>
        <span className="banner-text">
          <strong>{title}</strong>
          <span className="muted">{sub}</span>
        </span>
      </button>
      {action}
      {progress !== undefined && (
        <span className="banner-progress">
          <span style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }} />
        </span>
      )}
    </div>
  );
}

function ActivityBanner() {
  const { content, state, go, act, receivedAt } = useGame();
  const live = useLiveActivity();
  const now = useNow(500);
  const a = state.activity;
  const combat = state.combat?.activity;
  const queued = state.queue?.length ?? 0;

  if (combat) {
    const progress = combat.fightMs ? Math.min(1, (combat.progressMs + (now - receivedAt)) / combat.fightMs) : undefined;
    const title = combat.encounter === null ? 'Terrain d’entraînement' : combat.route ? `Route ${combat.stageLabel ?? ''} · ${combat.name}` : combat.name;
    return (
      <Banner
        icon={<SwordIcon />}
        tone="var(--alert)"
        title={title}
        sub={combat.encounter === null ? `Niveau ${state.combat!.level}` : `${combat.tier ? `Palier ${combat.tier} · ` : ''}${num(combat.wins)} victoire${combat.wins > 1 ? 's' : ''}${combat.route ? ' · en boucle' : ''}`}
        progress={progress}
        onOpen={() => go('combat')}
        action={
          <button className="banner-stop" title="Arrêter le combat" onClick={() => void act(api.combatStop)}>
            ×
          </button>
        }
      />
    );
  }
  const profession = live && content.professions.find((p) => p.id === live.recipe.profession);
  if (live && a && profession) {
    return (
      <Banner
        icon={<HammerIcon />}
        tone="var(--action)"
        title={`${profession.name} · ${live.recipe.name}`}
        sub={`${num(live.done)} / ${num(live.quantity)} · fini à ${clock(live.etaAt)}${queued ? ` · ${queued} en file` : ''}`}
        progress={(live.done + live.fraction) / live.quantity}
        onOpen={() => go('professions', profession.id)}
        action={
          <button className="banner-stop" title="Arrêter l’activité" onClick={() => void act(() => api.cancel(-1))}>
            ×
          </button>
        }
      />
    );
  }
  return <Banner icon={<HammerIcon />} tone="var(--text-muted)" title="Aucune activité" sub="Vos métiers attendent : choisir" onOpen={() => go('professions')} />;
}

function HammerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 6l4 4M12 8l-8 8 2 2 8-8M13 4l7 7-2 2-7-7z" />
    </svg>
  );
}

function SwordIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6L9 21l-3-3L17 7M5 15l4 4M3 21l3-3" />
    </svg>
  );
}
