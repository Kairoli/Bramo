import { useGame } from '../../game/GameContext';
import { Figure } from '../../components/Figure';
import { Bar } from '../../components/ui';

export function CharacterCard() {
  const { name, content, state, go } = useGame();
  const playable = content.professions.filter((p) => p.status === 'playable');
  const best = playable
    .map((p) => ({ p, s: state.skills[p.id]! }))
    .sort((a, b) => b.s.xp - a.s.xp)[0]!;
  const totalLevel = content.professions.reduce((sum, p) => sum + (state.skills[p.id]?.level ?? 1), 0);
  const span = best.s.nextLevelXp ? (best.s.xp - best.s.levelXp) / (best.s.nextLevelXp - best.s.levelXp) : 1;

  return (
    <section className="panel character-card">
      <div className="character-portrait">
        <Figure className="character-figure" />
      </div>
      <h3>{name}</h3>
      <div style={{ color: 'var(--clan)' }}>
        {best.s.title} · {best.p.name} {best.s.level}
      </div>
      <span className="chip" style={{ color: 'var(--magic)', borderColor: 'var(--magic)' }}>
        Sans classe · voie à venir
      </span>
      <Bar value={span} color="var(--magic)" style={{ width: '100%' }} />
      <div className="muted character-total">Niveau total {totalLevel}</div>
      <button className="link" onClick={() => go('character')}>
        Ouvrir le personnage →
      </button>
    </section>
  );
}
