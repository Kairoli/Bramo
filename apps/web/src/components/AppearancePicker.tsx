import { useState } from 'react';
import type { Slot } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { parts } from '../rig/assets';
import { resolveParts } from '../rig/Character';
import { PartThumb } from './equipment';

/** Emplacements d'apparence, dans l'ordre d'affichage (l'arme et l'aura : celles de la classe, ou une pièce à part). */
const SLOTS: { slot: Slot; label: string }[] = [
  { slot: 'headwear', label: 'Coiffe' },
  { slot: 'face', label: 'Visage' },
  { slot: 'shoulder_far', label: 'Épaule (côté sort)' },
  { slot: 'shoulder_near', label: 'Épaule (côté proche)' },
  { slot: 'top', label: 'Torse' },
  { slot: 'gloves', label: 'Gants' },
  { slot: 'belt', label: 'Ceinture' },
  { slot: 'legs', label: 'Jambes' },
  { slot: 'robe', label: 'Bas de robe' },
  { slot: 'boots', label: 'Bottes' },
  { slot: 'cape', label: 'Cape' },
  { slot: 'weapon', label: 'Arme (apparence)' },
  { slot: 'effect', label: 'Aura' },
];

/**
 * Mode Apparence de la salle Personnage : chaque emplacement se choisit à la main, parmi les pièces du style de la classe.
 * Cela ne change ni les statistiques ni l'équipement réel.
 */
export function AppearancePicker() {
  const { content, state, look, act } = useGame();
  const [open, setOpen] = useState<Slot | null>(null);
  if (!look) return null;
  const worn = resolveParts(content, look);
  // L'arme et l'aura ne s'affichent que s'il y a une autre apparence que celle de la classe.
  const rows = SLOTS.filter((s) => (state.lookOptions[s.slot]?.length ?? 0) > 0 || (worn[s.slot] && s.slot !== 'weapon' && s.slot !== 'effect'));

  return (
    <div className="look-picker">
      <p className="muted small">L’apparence ne change ni vos statistiques ni votre équipement. Elle se limite aux styles de votre classe.</p>
      <div className="look-rows">
        {rows.map(({ slot, label }) => {
          const options = state.lookOptions[slot] ?? [];
          const current = worn[slot];
          const part = current ? parts[`${slot}/${current}`] : undefined;
          const overridden = !!look.overrides?.[slot];
          const expanded = open === slot;
          return (
            <div key={slot} className={`look-row${expanded ? ' open' : ''}`}>
              <button className="look-head" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : slot)}>
                <span className="equip-slot equip-cosmetic">{current && part && <PartThumb slot={slot} partId={current} />}</span>
                <span className="equip-text">
                  <span className="eyebrow">{label}</span>
                  <strong>{part?.name ?? 'Aucune'}</strong>
                  <span className="muted">{overridden ? 'Choisie à la main' : 'De la tenue'}</span>
                </span>
              </button>
              {expanded && (
                <div className="look-options">
                  {options.map((id) => {
                    const p = parts[`${slot}/${id}`];
                    return (
                      <button
                        key={id}
                        className={`look-option${id === current ? ' active' : ''}`}
                        aria-pressed={id === current}
                        title={p?.name ?? id}
                        onClick={() => act(() => api.setLook(slot, id))}
                      >
                        <span className="equip-slot equip-cosmetic">
                          <PartThumb slot={slot} partId={id} />
                        </span>
                        <span>{p?.name ?? id}</span>
                      </button>
                    );
                  })}
                  {overridden && (
                    <button className="btn btn-sm" onClick={() => act(() => api.setLook(slot, null))}>
                      Revenir à la tenue
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
