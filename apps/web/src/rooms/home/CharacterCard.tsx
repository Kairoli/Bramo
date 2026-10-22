import { useGame } from '../../game/GameContext';
import { PaperDoll } from '../../components/equipment';
import { STYLE_NAMES } from '../../components/ClassChoice';
import { OrnamentPlate, ornamentTitle } from '../../components/Ornament';
import { PresetSwitch } from '../../components/Presets';

/** Le personnage en entier, avec ce qu'il porte ; le détail est dans la salle Personnage. */
export function CharacterCard() {
  const { name, content, state, go } = useGame();
  const best = content.professions
    .filter((p) => p.status === 'playable')
    .map((p) => ({ p, s: state.skills[p.id]! }))
    .sort((a, b) => b.s.xp - a.s.xp)[0]!;
  const cls = state.classId ? content.classes[state.classId] : undefined;
  const ornament = state.ornament ? content.ornaments[state.ornament] : undefined;

  return (
    <section className="panel character-card">
      {/* L'ornement (ou le nom) au-dessus du personnage, sur le même axe que lui. */}
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
      <div className="character-id">
        <div className="character-chips">
          {cls && (
            <span className="chip" style={{ color: cls.affinityColor, borderColor: cls.affinityColor }}>
              {cls.name} · {STYLE_NAMES[cls.style]}
            </span>
          )}
          <PresetSwitch />
        </div>
      </div>
      <button className="link character-open" onClick={() => go('character')}>
        Ouvrir le personnage →
      </button>
    </section>
  );
}
