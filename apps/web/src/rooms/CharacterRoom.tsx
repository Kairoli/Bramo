import { useState } from 'react';
import { api } from '../api';
import { ClassModal, STYLE_NAMES } from '../components/ClassChoice';
import { EnergyButton } from '../components/EnergyButton';
import { useGame } from '../game/GameContext';
import { duration, num, pct, signedPct } from '../format';
import { Bar, FAMILY_COLOR, ItemIcon } from '../components/ui';
import { DOLL_LEFT, DOLL_RIGHT, PaperDoll, PartThumb, useEquipment } from '../components/equipment';

const COMBAT_STATS = ['Points de vie', 'Attaque', 'Défense', 'Puissance magique', 'Précision', 'Esquive'];

/** Salle Personnage : le personnage au centre, tout ce qu'il porte, ses caractéristiques. */
export function CharacterRoom() {
  const { name, content, state, look, act, openMarket } = useGame();
  const equipment = useEquipment();
  const { settings } = content;
  const [classOpen, setClassOpen] = useState(false);
  const outfit = content.cosmetics.outfits.find((o) => o.id === look?.outfit);
  const cls = look && content.classes[look.classId];
  const linked = cls && content.professions.find((p) => p.id === cls.profession);
  const skills = content.professions.map((p) => ({ p, s: state.skills[p.id]! }));
  const best = skills.filter((x) => x.p.status === 'playable').sort((a, b) => b.s.xp - a.s.xp)[0]!;
  const totalLevel = skills.reduce((sum, x) => sum + x.s.level, 0);
  const totalXp = skills.reduce((sum, x) => sum + x.s.xp, 0);
  const rate = state.activity?.rate;
  const activeProfession =
    state.activity && content.professions.find((p) => p.id === content.recipes[state.activity!.recipeId]?.profession);
  const items = Object.entries(state.inventory)
    .map(([id, qty]) => ({ item: content.items[id]!, qty }))
    .filter((x) => x.item)
    .sort((a, b) => a.item.category.localeCompare(b.item.category) || a.item.name.localeCompare(b.item.name));

  const { durability } = state;
  const pantry = Object.entries(state.pantry)
    .map(([id, qty]) => ({ item: content.items[id]!, qty }))
    .filter((x) => x.item)
    .sort((a, b) => a.item.name.localeCompare(b.item.name));

  const bonuses = [
    { label: 'Outil', value: rate?.tool ?? 0, cap: settings.bonusCaps.tool, soon: false },
    { label: 'Repas', value: rate?.meal ?? 0, cap: settings.bonusCaps.meal, soon: false },
    { label: 'Clan', value: 0, cap: settings.bonusCaps.clan, soon: true },
    { label: 'Saison', value: 0, cap: settings.bonusCaps.season, soon: true },
  ];

  return (
    <main className="character-room">
      <section className="panel char-equipment">
        <span className="eyebrow">Équipement et apparence</span>
        <div className="equip-list">
          {[...DOLL_LEFT, ...DOLL_RIGHT].map((id) => {
            const e = equipment[id];
            return (
              <div key={id} className={`equip-row${e.name ? '' : ' empty'}`}>
                <span className={`equip-slot equip-${e.kind}${e.name ? '' : ' empty'}`}>
                  {e.thumb ? (
                    <PartThumb slot={e.thumb.slot} partId={e.thumb.partId} />
                  ) : e.item ? (
                    <ItemIcon item={e.item} small />
                  ) : null}
                </span>
                <span className="equip-text">
                  <span className="eyebrow">{e.label}</span>
                  <strong>{e.name ?? 'Vide'}</strong>
                  <span className="muted">{e.detail}</span>
                </span>
              </div>
            );
          })}
        </div>

        <header className="bag-head">
          <span className="eyebrow">Sac</span>
          <button className="btn btn-sm" onClick={() => openMarket()}>
            Marché
          </button>
        </header>
        <div className="bag scroll">
          {items.length === 0 && <p className="muted">Votre sac est vide.</p>}
          {items.map(({ item, qty }) => (
            <div key={item.id} className="bag-item">
              <ItemIcon item={item} small />
              <span className="bag-name">{item.name}</span>
              <span className="muted">
                ×{num(qty)}
                {durability[item.id] && (
                  <>
                    {' · '}
                    {(() => {
                      const left = durability[item.id]!.copies.find((r) => r > 0);
                      return left === undefined ? 'usé' : `reste ${duration(left)}`;
                    })()}
                  </>
                )}
              </span>
              <span className="bag-actions">
                {item.meal && (
                  <>
                    <button className="btn btn-sm" onClick={() => act(() => api.eat(item.id))}>
                      Manger
                    </button>
                    <button className="btn btn-sm" title="Le personnage en mange un dès que le précédent expire" onClick={() => act(() => api.stockPantry(item.id, qty))}>
                      Garde-manger
                    </button>
                  </>
                )}
                {durability[item.id]?.repair && durability[item.id]!.repairCost > 0 && (
                  <button
                    className="btn btn-sm"
                    disabled={durability[item.id]!.repair!.problem !== null}
                    title={durability[item.id]!.repair!.problem ?? 'Gratuit en or ; un peu d’XP'}
                    onClick={() => act(() => api.repairSelf(item.id))}
                  >
                    Réparer · {durability[item.id]!.repair!.materials.map((m) => `${m.qty} × ${content.items[m.item]?.name ?? m.item}`).join(', ')}
                  </button>
                )}
                {durability[item.id] && durability[item.id]!.repairCost > 0 && (
                  <button
                    className="btn btn-sm"
                    disabled={state.gold < durability[item.id]!.repairCost}
                    title="Rend toute la durabilité ; le maximum ne baisse jamais"
                    onClick={() => act(() => api.repair(item.id))}
                  >
                    PNJ · {durability[item.id]!.repairCost} or
                  </button>
                )}
                <button className="btn btn-sm" title="Proposer aux autres joueurs" onClick={() => openMarket(item.id)}>
                  Vendre
                </button>
                {state.recycle[item.id] && (
                  <button
                    className="btn btn-sm"
                    title={`Rend ${state.recycle[item.id]!.map((y) => `${y.qty} × ${content.items[y.item]?.name ?? y.item}`).join(', ')} par exemplaire`}
                    onClick={() => act(() => api.recycle(item.id, 1))}
                  >
                    Recycler
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
        {pantry.length > 0 && (
          <div className="bag scroll">
            <span className="eyebrow">Garde-manger</span>
            {pantry.map(({ item, qty }) => (
              <div key={item.id} className="bag-item">
                <ItemIcon item={item} small />
                <span className="bag-name">{item.name}</span>
                <span className="muted">×{num(qty)}</span>
                <button className="btn btn-sm" onClick={() => act(() => api.unstockPantry(item.id, qty))}>
                  Reprendre
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel band char-stage">
        <header className="char-stage-head">
          {cls && (
            <div className="eyebrow" style={{ color: cls.affinityColor }}>
              {cls.name} · {STYLE_NAMES[cls.style]} · métier lié {linked?.name}
            </div>
          )}
          <h1>{name}</h1>
          <div style={{ color: 'var(--clan)' }}>
            {best.s.nickname} · {best.p.name} {best.s.level}
          </div>
        </header>
        <PaperDoll size="page" />
        <footer className="char-stage-foot">
          <button className="btn btn-sm" onClick={() => setClassOpen(true)}>
            Changer de classe
          </button>
          {outfit && <span className="chip">Tenue {outfit.name}</span>}
          <span className="chip">Niveau total {totalLevel}</span>
        </footer>
        {classOpen && <ClassModal onClose={() => setClassOpen(false)} />}
      </section>

      <section className="panel char-stats scroll">
        <span className="eyebrow">Caractéristiques</span>
        <dl className="kv">
          <dt>Niveau total</dt>
          <dd>{totalLevel}</dd>
          <dt>XP cumulée</dt>
          <dd>{num(totalXp)}</dd>
          <dt>Or</dt>
          <dd style={{ color: 'var(--action)' }}>{num(state.gold)}</dd>
          <dt>Métier principal</dt>
          <dd>
            {best.p.name} {best.s.level}
          </dd>
        </dl>

        <div className="stat-block">
          <div className="stat-block-head">
            <span className="eyebrow">Rendement</span>
            <span className="muted">{activeProfession ? activeProfession.name : 'aucune activité'}</span>
          </div>
          <dl className="kv">
            <dt>Présence</dt>
            <dd style={{ color: rate?.energized ? 'var(--good)' : undefined }}>
              {rate ? `${pct(rate.presence)}${rate.energized ? ' · coup de fouet' : ''}` : '—'}
            </dd>
            <dt>Hors ligne</dt>
            <dd>
              {pct(settings.rates.offline)}, {settings.rates.offlineCapHours} h d’autonomie
            </dd>
            <dt>Total appliqué</dt>
            <dd style={{ color: 'var(--action)' }}>{rate ? pct(rate.total) : '—'}</dd>
          </dl>
          {bonuses.map((b) => (
            <div key={b.label} className={`bonus-row${b.soon ? ' soon' : ''}`}>
              <span>{b.label}</span>
              <span className="muted">{b.soon ? 'bientôt' : `${signedPct(b.value)} / ${signedPct(b.cap)}`}</span>
              <Bar value={b.cap ? b.value / b.cap : 0} color="var(--good)" />
            </div>
          ))}
        </div>

        <div className="stat-block">
          <div className="stat-block-head">
            <span className="eyebrow">Coups de fouet</span>
            <span className="muted">
              {state.energy.chargesLeft} / {state.energy.charges} aujourd’hui
            </span>
          </div>
          <EnergyButton />
          <p className="muted small">
            Gains à {pct(settings.energy.multiplier)} pendant {duration(state.energy.durationMs)}, quand vous le voulez, en ligne
            comme hors ligne.
          </p>
        </div>

        <div className="stat-block">
          <span className="eyebrow">Métiers</span>
          <div className="skills-compact">
            {skills.map(({ p, s }) => {
              const span = s.nextLevelXp ? (s.xp - s.levelXp) / (s.nextLevelXp - s.levelXp) : 1;
              return (
                <div key={p.id} className={`skill-row${p.status === 'soon' ? ' soon' : ''}`}>
                  <span>{p.name}</span>
                  <span className="muted">{p.status === 'soon' ? 'Bientôt' : s.nickname}</span>
                  <Bar value={p.status === 'soon' ? 0 : span} color={FAMILY_COLOR[p.family]} />
                  <strong>{s.level}</strong>
                </div>
              );
            })}
          </div>
        </div>

        <div className="stat-block soon">
          <div className="stat-block-head">
            <span className="eyebrow">Combat</span>
            <span className="muted">arrive bientôt</span>
          </div>
          <dl className="kv">
            {COMBAT_STATS.map((s) => (
              <div key={s} style={{ display: 'contents' }}>
                <dt>{s}</dt>
                <dd>—</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
