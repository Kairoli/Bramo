import { useGame } from '../../game/GameContext';
import { PaperDoll } from '../../components/equipment';

/** Le personnage en entier, avec ce qu'il porte ; le détail est dans la salle Personnage. */
export function CharacterCard() {
  const { name, content, state, go } = useGame();
  const best = content.professions
    .filter((p) => p.status === 'playable')
    .map((p) => ({ p, s: state.skills[p.id]! }))
    .sort((a, b) => b.s.xp - a.s.xp)[0]!;
  const preview = content.classes[content.cosmetics.default.class];

  return (
    <section className="panel character-card">
      <PaperDoll size="card" />
      <div className="character-id">
        <h3>{name}</h3>
        <div style={{ color: 'var(--clan)' }}>
          {best.s.title} · {best.p.name} {best.s.level}
        </div>
        <span className="chip" style={{ color: 'var(--magic)', borderColor: 'var(--magic)' }}>
          Classe à venir · aperçu {preview?.name}
        </span>
      </div>
      <button className="link character-open" onClick={() => go('character')}>
        Ouvrir le personnage →
      </button>
    </section>
  );
}
