import { useGame } from '../../game/GameContext';
import { Character } from '../../rig/Character';
import { Bar, FAMILY_COLOR } from '../../components/ui';

export function CharacterCard() {
  const { name, content, state, go } = useGame();
  const playable = content.professions.filter((p) => p.status === 'playable');
  const best = playable.map((p) => ({ p, s: state.skills[p.id]! })).sort((a, b) => b.s.xp - a.s.xp)[0]!;
  const totalLevel = content.professions.reduce((sum, p) => sum + (state.skills[p.id]?.level ?? 1), 0);
  const preview = content.classes[content.cosmetics.default.class];

  return (
    <section className="panel character-card">
      <div className="character-head">
        <div className="character-portrait">
          <Character lod="portrait" title={`Portrait de ${name}`} />
        </div>
        <div className="character-id">
          <h3>{name}</h3>
          <div style={{ color: 'var(--clan)' }}>
            {best.s.title} · {best.p.name} {best.s.level}
          </div>
          <span className="chip" style={{ color: 'var(--magic)', borderColor: 'var(--magic)' }}>
            Classe à venir · aperçu {preview?.name}
          </span>
        </div>
      </div>
      <div className="character-skills">
        {playable.map((p) => {
          const s = state.skills[p.id]!;
          const span = s.nextLevelXp ? (s.xp - s.levelXp) / (s.nextLevelXp - s.levelXp) : 1;
          return (
            <button key={p.id} className="character-skill" onClick={() => go('professions', p.id)}>
              <span>{p.name}</span>
              <strong>{s.level}</strong>
              <Bar value={span} color={FAMILY_COLOR[p.family]} />
            </button>
          );
        })}
      </div>
      <div className="character-foot">
        <span className="muted">Niveau total {totalLevel}</span>
        <button className="link" onClick={() => go('character')}>
          Ouvrir le personnage →
        </button>
      </div>
    </section>
  );
}
