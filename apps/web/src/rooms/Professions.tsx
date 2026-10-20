import type { ProfessionFamily } from '@bramo/shared';
import { useGame } from '../game/GameContext';
import { Bar, FAMILY_COLOR, FAMILY_NAME } from '../components/ui';
import { Character } from '../rig/Character';

const FAMILIES: ProfessionFamily[] = ['gathering', 'crafting', 'world'];

export function Professions() {
  const { content, state, go } = useGame();
  const active = state.activity && content.recipes[state.activity.recipeId]?.profession;
  const totalLevel = content.professions.reduce((s, p) => s + (state.skills[p.id]?.level ?? 1), 0);
  const masters = content.professions.filter((p) => p.master);

  return (
    <main className="room">
      <section className="panel band professions-band">
        <div className="band-label">[Illustration animée : le quartier des artisans]</div>
        <Character className="band-figure" />
        <div className="professions-title">
          <h1>Métiers</h1>
          <div className="row-gap">
            <span className="chip">
              {content.professions.length} métiers · niveau total {totalLevel}
            </span>
            {active && <span className="chip">Activité en cours : {content.professions.find((p) => p.id === active)?.name}</span>}
          </div>
        </div>
        <div className="masters">
          {masters.map((p) => (
            <button key={p.id} className="master-card" onClick={() => go('professions', p.id)}>
              <span className="npc-avatar" style={{ borderColor: FAMILY_COLOR[p.family] }} />
              <span>
                <strong>{p.master!.name}</strong>
                <span className="muted">{p.name}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel professions-grid">
        {FAMILIES.map((family) => {
          const list = content.professions.filter((p) => p.family === family);
          const open = list.filter((p) => p.status === 'playable').length;
          return (
            <div key={family} className="family">
              <div className="family-head">
                <span className="eyebrow">{FAMILY_NAME[family]}</span>
                <span className="muted">
                  {open} ouverts · {list.length - open} bientôt
                </span>
              </div>
              <div className="family-cards">
                {list.map((p) => {
                  const s = state.skills[p.id]!;
                  const soon = p.status === 'soon';
                  const span = s.nextLevelXp ? (s.xp - s.levelXp) / (s.nextLevelXp - s.levelXp) : 1;
                  return (
                    <button
                      key={p.id}
                      className={`prof-card${soon ? ' soon' : ''}${active === p.id ? ' active' : ''}`}
                      disabled={soon}
                      onClick={() => go('professions', p.id)}
                    >
                      <span className="prof-top">
                        <strong>{p.name}</strong>
                        <span className="prof-level" style={{ color: soon ? undefined : FAMILY_COLOR[family] }}>
                          {soon ? '—' : s.level}
                        </span>
                      </span>
                      <Bar value={soon ? 0 : span} color={FAMILY_COLOR[family]} />
                      <span className="prof-bottom">
                        <span className="muted">{s.title}</span>
                        {soon && <span className="muted">Bientôt</span>}
                        {active === p.id && <span style={{ color: 'var(--action)' }}>En cours</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
