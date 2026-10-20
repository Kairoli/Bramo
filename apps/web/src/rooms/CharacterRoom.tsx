import { api } from '../api';
import { useGame } from '../game/GameContext';
import { duration, num, signedPct } from '../format';
import { Character } from '../rig/Character';
import { Bar, FAMILY_COLOR, ItemIcon } from '../components/ui';
import { useNow } from '../game/useLive';

export function CharacterRoom() {
  const { name, content, state, receivedAt, act, setShopOpen } = useGame();
  const now = useNow(1000);
  const items = Object.entries(state.inventory)
    .map(([id, qty]) => ({ item: content.items[id]!, qty }))
    .filter((x) => x.item)
    .sort((a, b) => a.item.category.localeCompare(b.item.category) || a.item.name.localeCompare(b.item.name));
  const totalLevel = content.professions.reduce((s, p) => s + (state.skills[p.id]?.level ?? 1), 0);
  const buff = state.buff;

  return (
    <main className="room">
      <section className="panel band character-band">
        <div className="band-label">[Le personnage, animé]</div>
        <Character className="band-figure" />
        <div className="character-identity">
          <div className="eyebrow" style={{ color: 'var(--magic)' }}>
            Classe · bientôt
          </div>
          <h1>{name}</h1>
          <p className="muted">Niveau total {totalLevel}. Les classes (Forgefeu, Traqueur, Runiste) arriveront avec le combat.</p>
          {buff && (
            <span className="chip" style={{ color: 'var(--good)', borderColor: 'var(--good)' }}>
              {content.items[buff.itemId]?.name} : {signedPct(buff.bonus)} encore {duration(buff.until - (state.serverTime + now - receivedAt))}
            </span>
          )}
        </div>
      </section>

      <div className="character-bottom">
        <section className="panel skills-panel">
          <span className="eyebrow">Métiers</span>
          <div className="skills-list">
            {content.professions.map((p) => {
              const s = state.skills[p.id]!;
              const span = s.nextLevelXp ? (s.xp - s.levelXp) / (s.nextLevelXp - s.levelXp) : 1;
              return (
                <div key={p.id} className={`skill-row${p.status === 'soon' ? ' soon' : ''}`}>
                  <span>{p.name}</span>
                  <span className="muted">{p.status === 'soon' ? 'Bientôt' : s.title}</span>
                  <Bar value={p.status === 'soon' ? 0 : span} color={FAMILY_COLOR[p.family]} />
                  <strong>{s.level}</strong>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel bag-panel">
          <header className="bag-head">
            <span className="eyebrow">Sac</span>
            <button className="btn btn-sm" onClick={() => setShopOpen(true)}>
              Marchand du port
            </button>
          </header>
          <div className="bag scroll">
            {items.length === 0 && <p className="muted">Votre sac est vide.</p>}
            {items.map(({ item, qty }) => (
              <div key={item.id} className="bag-item">
                <ItemIcon item={item} small />
                <span className="bag-name">
                  {item.name}
                  {item.tool && <span className="muted"> · outil {signedPct(item.tool.bonus)}</span>}
                  {item.meal && (
                    <span className="muted">
                      {' '}
                      · repas {signedPct(item.meal.bonus)}, {item.meal.durationMin} min
                    </span>
                  )}
                </span>
                <span className="muted">×{num(qty)}</span>
                {item.meal && (
                  <button className="btn btn-sm" onClick={() => act(() => api.eat(item.id))}>
                    Manger
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
