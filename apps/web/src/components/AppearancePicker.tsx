import type { Slot } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { parts } from '../rig/assets';
import { resolveParts } from '../rig/Character';
import { type EquipSlotId, PartThumb } from './equipment';

/**
 * Emplacements d'apparence, regroupés comme les cases autour du personnage (retour de Louis, 23 octobre : « confus entre
 * les trucs à gauche et les items autour du perso ») : on touche une case autour du personnage, puis on choisit son
 * apparence dans la colonne de gauche. Une case peut couvrir deux emplacements (la coiffe et le visage, l'arme et l'aura…).
 */
export const LOOK_GROUPS: Partial<Record<EquipSlotId, { label: string; slots: { slot: Slot; label: string }[] }>> = {
  headwear: { label: 'Tête', slots: [{ slot: 'headwear', label: 'Coiffe' }, { slot: 'face', label: 'Visage' }] },
  shoulders: { label: 'Épaules', slots: [{ slot: 'shoulder_near', label: 'Côté proche' }, { slot: 'shoulder_far', label: 'Côté sort' }] },
  top: { label: 'Torse', slots: [{ slot: 'top', label: 'Torse' }] },
  gloves: { label: 'Gants', slots: [{ slot: 'gloves', label: 'Gants' }] },
  belt: { label: 'Ceinture', slots: [{ slot: 'belt', label: 'Ceinture' }] },
  weapon: { label: 'Arme et aura', slots: [{ slot: 'weapon', label: 'Arme' }, { slot: 'effect', label: 'Aura' }] },
  cape: { label: 'Cape', slots: [{ slot: 'cape', label: 'Cape' }] },
  robe: { label: 'Bas', slots: [{ slot: 'robe', label: 'Bas de robe' }, { slot: 'legs', label: 'Jambes' }] },
  boots: { label: 'Bottes', slots: [{ slot: 'boots', label: 'Bottes' }] },
};

/** La case autour du personnage qui couvre cet emplacement. */
export const lookGroupOf = (slot: Slot): EquipSlotId | undefined =>
  (Object.entries(LOOK_GROUPS) as [EquipSlotId, NonNullable<(typeof LOOK_GROUPS)[EquipSlotId]>][]).find(([, g]) => g.slots.some((s) => s.slot === slot))?.[0];

/**
 * Mode Apparence de la salle Personnage : les apparences possibles de l'emplacement choisi (case touchée autour du
 * personnage), en grandes vignettes. Cela ne change ni les statistiques ni l'équipement réel.
 */
export function AppearancePicker({ slot, onSlot }: { slot: Slot; onSlot: (slot: Slot) => void }) {
  const { content, state, look, act } = useGame();
  if (!look) return null;
  const groupId = lookGroupOf(slot);
  const group = groupId ? LOOK_GROUPS[groupId] : undefined;
  const worn = resolveParts(content, look);
  // Ce que donne la tenue (ou la classe, pour l'arme et l'aura), sans les retouches.
  const fromOutfit = resolveParts(content, { ...look, overrides: undefined })[slot] ?? null;
  const current = worn[slot] ?? null;
  const overridden = look.overrides?.[slot] !== undefined;
  const options = (state.lookOptions[slot] ?? []).filter((id) => id !== fromOutfit);

  const card = (id: string | null, label: string, sub: string, active: boolean, onClick: () => void) => (
    <button key={id ?? 'outfit'} className={`look-card${active ? ' active' : ''}`} aria-pressed={active} onClick={onClick} disabled={active}>
      <span className="look-card-thumb">{id ? <PartThumb slot={slot} partId={id} /> : <span className="muted small">Aucune</span>}</span>
      <strong>{label}</strong>
      <span className="muted small">{active ? 'Portée' : sub}</span>
    </button>
  );

  return (
    <div className="look-picker">
      <ol className="look-hint">
        <li>
          <span className="look-step">1</span> Touchez une case autour du personnage.
        </li>
        <li>
          <span className="look-step">2</span> Choisissez son apparence ici.
        </li>
      </ol>
      <header className="look-current">
        <span className="eyebrow">{group?.label ?? slot}</span>
        {group && group.slots.length > 1 && (
          <div className="seg-toggle look-subtabs" role="tablist">
            {group.slots.map((s) => (
              <button key={s.slot} aria-pressed={s.slot === slot} onClick={() => onSlot(s.slot)}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </header>
      <div className="look-choices">
        {card(fromOutfit, fromOutfit ? (parts[`${slot}/${fromOutfit}`]?.name ?? fromOutfit) : 'Aucune', slot === 'weapon' || slot === 'effect' ? 'Celle de la classe' : 'Celle de la tenue', !overridden || current === fromOutfit, () => void act(() => api.setLook(slot, null)))}
        {options.map((id) => card(id, parts[`${slot}/${id}`]?.name ?? id, 'Appliquer', current === id && overridden, () => void act(() => api.setLook(slot, id))))}
      </div>
      {options.length === 0 && <p className="muted small">Pas encore d’autre apparence pour cet emplacement avec votre classe.</p>}
      <p className="muted small look-foot">L’apparence ne change ni vos statistiques ni votre équipement.</p>
    </div>
  );
}
