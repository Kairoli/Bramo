import type { CSSProperties } from 'react';
import { useGame } from '../../game/GameContext';
import { EquipSlot, PaperDoll, useEquipment } from '../../components/equipment';
import { STYLE_NAMES } from '../../components/ClassChoice';
import { OrnamentPlate, ornamentTitle } from '../../components/Ornament';
import { PresetSwitch } from '../../components/Presets';
import { num } from '../../format';

/**
 * Le personnage en entier, avec ce qu'il porte : l'ornement (ou le nom) au-dessus, sur le même axe ; quatre grandes cases
 * de chaque côté ; dessous, la classe avec son niveau et son XP, l'outil et le repas, puis les préréglages en un clic.
 */
export function CharacterCard() {
  const { name, content, state, go } = useGame();
  const equipment = useEquipment();
  const best = content.professions
    .filter((p) => p.status === 'playable')
    .map((p) => ({ p, s: state.skills[p.id]! }))
    .sort((a, b) => b.s.xp - a.s.xp)[0]!;
  const cls = state.classId ? content.classes[state.classId] : undefined;
  const ornament = state.ornament ? content.ornaments[state.ornament] : undefined;
  const combat = state.combat;
  const path = combat?.path ? combat.paths.find((p) => p.id === combat.path)?.name : null;
  const span = combat ? (combat.nextLevelXp ?? combat.xp) - combat.levelXp : 0;
  const share = combat && span > 0 ? (combat.xp - combat.levelXp) / span : 1;

  return (
    <section className="panel character-card" style={{ '--cc': cls?.affinityColor ?? 'var(--magic)' } as CSSProperties}>
      <div className="character-id">
        {ornament ? (
          <OrnamentPlate ornament={ornament} name={name} title={ornamentTitle(ornament, content, state)} width={320} className="card-plate" />
        ) : (
          <>
            <h3>{name}</h3>
            <div style={{ color: 'var(--clan)' }}>
              {best.s.nickname} · {best.p.name} {best.s.level}
            </div>
          </>
        )}
      </div>
      <PaperDoll size="card" />
      <div className="char-strip">
        {cls && (
          <button className="class-badge" onClick={() => go('combat')} title={combat ? `${num(Math.floor(combat.xp - combat.levelXp))} / ${num(span)} XP vers le niveau ${combat.level + 1}` : undefined}>
            <span className="class-level">
              <small>Niv.</small>
              {combat?.level ?? 1}
            </span>
            <span className="class-text">
              <strong>{cls.name}</strong>
              <span className="muted">{path ?? STYLE_NAMES[cls.style]}</span>
              <span className="class-xp">
                <span style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }} />
              </span>
            </span>
          </button>
        )}
        <div className="strip-slots">
          <EquipSlot entry={equipment.tool} side="right" />
          <EquipSlot entry={equipment.meal} side="right" />
        </div>
      </div>
      <PresetSwitch />
      <button className="link character-open" onClick={() => go('character')}>
        Ouvrir le personnage →
      </button>
    </section>
  );
}
