import { useCallback, useEffect, useState } from 'react';
import type { ClanBuildingView, ClanListItem, ClanRank, ClanView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { hhmm, num, signedPct } from '../format';
import { Bar, ItemIcon } from '../components/ui';

type Tab = 'buildings' | 'members' | 'log';
type Run = (call: () => ReturnType<typeof api.state>) => Promise<boolean>;

const RANK_NAME: Record<ClanRank, string> = { leader: 'Chef', officer: 'Officier', member: 'Membre' };

/** Salle Clan : fonder ou rejoindre, puis construire ses bâtiments ensemble, gérer les membres, lire le journal. */
export function ClanRoom() {
  const { act } = useGame();
  const [clan, setClan] = useState<ClanView | null | undefined>(undefined);
  const [clans, setClans] = useState<ClanListItem[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    const load = () => {
      api.myClan().then((c) => live && setClan(c)).catch(() => {});
      api.clans().then((l) => live && setClans(l)).catch(() => {});
    };
    load();
    const id = window.setInterval(load, 20_000);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, [tick]);
  const run = useCallback<Run>(
    async (call) => {
      const ok = await act(call);
      setTick((t) => t + 1);
      return ok;
    },
    [act],
  );

  return (
    <main className="room market-room">
      <section className="panel band">
        <div className="band-label">[Illustration : la halle du clan]</div>
      </section>
      {clan === undefined ? (
        <section className="panel market-panel">
          <p className="muted">Chargement…</p>
        </section>
      ) : clan ? (
        <ClanHall clan={clan} run={run} />
      ) : (
        <NoClan clans={clans} run={run} />
      )}
    </main>
  );
}

function NoClan({ clans, run }: { clans: ClanListItem[]; run: Run }) {
  const { content, state } = useGame();
  const rules = content.settings.clan;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  return (
    <section className="panel market-panel">
      <header className="market-head">
        <div>
          <span className="eyebrow" style={{ color: 'var(--clan)' }}>
            Clans
          </span>
          <h2>Personne ne fait tout seul</h2>
        </div>
        <span className="muted small">Tout le monde profite de la Guilde du bourg : {signedPct(rules.townGuildBonus)} de production.</span>
      </header>
      <div className="market-body" style={{ gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)' }}>
        <div className="market-form sunken" style={{ alignContent: 'start' }}>
          <h3 style={{ width: '100%' }}>Fonder un clan</h3>
          <label className="field" style={{ width: '100%' }}>
            <span className="muted small">
              Nom ({rules.nameMin} à {rules.nameMax} caractères)
            </span>
            <input className="input" value={name} maxLength={rules.nameMax} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field" style={{ width: '100%' }}>
            <span className="muted small">Présentation (facultatif)</span>
            <input className="input" value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button
            className="btn btn-primary"
            disabled={name.trim().length < rules.nameMin || state.gold < rules.creationCost}
            onClick={() => run(() => api.clanCreate(name, description))}
          >
            Fonder · {num(rules.creationCost)} or
          </button>
          <p className="muted small" style={{ width: '100%' }}>
            Un clan se construit : ses membres apportent de l’or et des matériaux pour bâtir des bâtiments (forge, scierie, jardin…), et chaque niveau accélère le métier concerné pour tous.
          </p>
        </div>
        <div className="scroll market-mine">
          <span className="eyebrow">Clans à rejoindre</span>
          {clans.length === 0 && <p className="muted">Aucun clan sur ce serveur pour le moment : fondez le premier.</p>}
          {clans.map((c) => (
            <div key={c.id} className="market-row" style={{ gridTemplateColumns: 'minmax(0, 1fr) auto auto auto' }}>
              <span>
                <strong>{c.name}</strong>
                <span className="muted small"> · {c.description || 'pas de présentation'}</span>
              </span>
              <span className="muted small">
                {c.members} / {c.maxMembers} membres
              </span>
              <span className="chip">{c.buildingLevels} niveau{c.buildingLevels > 1 ? 'x' : ''} bâti{c.buildingLevels > 1 ? 's' : ''}</span>
              <button className="btn btn-sm" disabled={c.members >= c.maxMembers} onClick={() => run(() => api.clanJoin(c.id))}>
                Rejoindre
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClanHall({ clan, run }: { clan: ClanView; run: Run }) {
  const [tab, setTab] = useState<Tab>('buildings');
  const { content } = useGame();
  const totalAll = clan.bonuses.all ?? 0;
  return (
    <section className="panel market-panel">
      <header className="market-head">
        <div>
          <span className="eyebrow" style={{ color: 'var(--clan)' }}>
            Clan · {RANK_NAME[clan.myRank]}
          </span>
          <h2>{clan.name}</h2>
          {clan.description && <span className="muted small">{clan.description}</span>}
        </div>
        <div className="tabs" role="tablist">
          {(
            [
              ['buildings', 'Bâtiments'],
              ['members', `Membres · ${clan.members.length}`],
              ['log', 'Journal'],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        <span className="chip" style={{ color: 'var(--clan)', borderColor: 'var(--clan)' }}>
          Guilde {signedPct(content.settings.clan.townGuildBonus)}
          {totalAll > 0 ? ` · halle ${signedPct(totalAll)}` : ''} · plafond {signedPct(content.settings.bonusCaps.clan)}
        </span>
      </header>

      {tab === 'buildings' && <Buildings clan={clan} run={run} />}
      {tab === 'members' && <Members clan={clan} run={run} />}
      {tab === 'log' && (
        <div className="scroll market-mine">
          {clan.log.length === 0 && <p className="muted">Rien pour le moment.</p>}
          {clan.log.map((l) => (
            <p key={l.id} className="town-line">
              <span className="journal-time">{hhmm(l.at)}</span>
              {l.text}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

function Buildings({ clan, run }: { clan: ClanView; run: Run }) {
  const { content } = useGame();
  return (
    <div className="scroll building-grid">
      <p className="muted small" style={{ gridColumn: '1 / -1' }}>
        Chaque bâtiment se construit niveau par niveau, avec les apports de tous les membres (or et matériaux). Les coûts croissent avec le nombre de membres actifs sur {content.settings.clan.activeDays} jours ({clan.activeMembers} aujourd’hui) : un petit clan bâtit aussi vite par tête qu’un grand. Les bonus s’appliquent à tous les membres, actifs ou non, dans la limite de {signedPct(content.settings.bonusCaps.clan)}.
      </p>
      {clan.buildings.map((b) => (
        <BuildingCard key={b.id} b={b} run={run} />
      ))}
    </div>
  );
}

function BuildingCard({ b, run }: { b: ClanBuildingView; run: Run }) {
  const { content, state } = useGame();
  const def = content.buildings[b.id]!;
  const professionName = def.boost.profession === 'all' ? 'toute la production' : (content.professions.find((p) => p.id === def.boost.profession)?.name ?? def.boost.profession);
  const [amount, setAmount] = useState<Record<string, number>>({});
  const qty = (key: string, max: number) => Math.max(1, Math.min(max, amount[key] ?? max));

  const rows: { key: string; label: string; need: number; have: number; mine: number; item?: string }[] = b.next
    ? [
        { key: 'gold', label: 'Or', need: b.next.gold.need, have: b.next.gold.have, mine: state.gold },
        ...b.next.items.map((i) => ({ key: i.item, label: content.items[i.item]?.name ?? i.item, need: i.need, have: i.have, mine: state.inventory[i.item] ?? 0, item: i.item })),
      ].filter((r) => r.need > 0)
    : [];

  return (
    <article className={`panel building${b.level >= b.maxLevel ? ' maxed' : ''}`}>
      <header>
        <div>
          <h3>{def.name}</h3>
          <span className="muted small">{def.description}</span>
        </div>
        <span className="chip" style={{ color: b.level ? 'var(--good)' : undefined, borderColor: b.level ? 'var(--good)' : undefined }}>
          niveau {b.level} / {b.maxLevel}
        </span>
      </header>
      <p className="small">
        <strong>{signedPct(def.boost.perLevel)}</strong> par niveau de production pour {professionName}
        {b.level > 0 && <span className="muted"> · actuellement {signedPct(def.boost.perLevel * b.level)}</span>}
      </p>
      {b.next === null ? (
        <p className="muted small">Bâtiment achevé.</p>
      ) : (
        <div className="building-needs">
          <span className="eyebrow">Niveau {b.level + 1} : ce qu’il manque</span>
          {rows.map((r) => {
            const left = Math.max(0, r.need - r.have);
            return (
              <div key={r.key} className="building-need">
                <span className="building-need-name">
                  {r.item && <ItemIcon item={content.items[r.item]} small />}
                  {r.label}
                </span>
                <Bar value={r.have / r.need} color="var(--clan)" />
                <span className="mono small">
                  {num(r.have)} / {num(r.need)}
                </span>
                {left > 0 ? (
                  <span className="bag-actions">
                    <input
                      className="input"
                      type="number"
                      min={1}
                      aria-label={`Quantité de ${r.label}`}
                      style={{ width: 76 }}
                      value={qty(r.key, Math.min(left, Math.max(1, r.mine)))}
                      onChange={(e) => setAmount({ ...amount, [r.key]: Math.floor(Number(e.target.value)) || 1 })}
                    />
                    <button
                      className="btn btn-sm"
                      disabled={r.mine <= 0}
                      onClick={() => run(() => api.clanContribute(b.id, r.key, qty(r.key, Math.min(left, Math.max(1, r.mine)))))}
                    >
                      Apporter
                    </button>
                  </span>
                ) : (
                  <span className="muted small">complet</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function Members({ clan, run }: { clan: ClanView; run: Run }) {
  const { name } = useGame();
  const leader = clan.myRank === 'leader';
  const officer = clan.myRank !== 'member';
  return (
    <div className="scroll market-mine">
      <p className="muted small">
        {clan.activeMembers} membre{clan.activeMembers > 1 ? 's' : ''} actif{clan.activeMembers > 1 ? 's' : ''} sur les 14 derniers jours · {clan.members.length} / {clan.maxMembers}. Aucun bonus n’est retiré à un absent.
      </p>
      {clan.members.map((m) => {
        const me = m.name === name;
        return (
          <div key={m.id} className="market-row" style={{ gridTemplateColumns: 'minmax(0, 1fr) auto auto auto' }}>
            <strong>
              {m.name} {me && <span className="muted small">(vous)</span>}
            </strong>
            <span className={`pill ${m.rank === 'member' ? '' : 'entamé'}`}>{RANK_NAME[m.rank]}</span>
            <span className="muted small">{m.active ? 'actif' : 'inactif'}</span>
            <span className="bag-actions">
              {leader && !me && m.rank === 'member' && (
                <button className="btn btn-sm" onClick={() => run(() => api.clanRank(m.id, 'officer'))}>
                  Nommer officier
                </button>
              )}
              {leader && !me && m.rank === 'officer' && (
                <>
                  <button className="btn btn-sm" onClick={() => run(() => api.clanRank(m.id, 'member'))}>
                    Rétrograder
                  </button>
                  <button className="btn btn-sm" onClick={() => run(() => api.clanLeader(m.id))}>
                    Passer la main
                  </button>
                </>
              )}
              {officer && !me && m.rank !== 'leader' && (leader || m.rank === 'member') && (
                <button className="btn btn-sm" onClick={() => run(() => api.clanKick(m.id))}>
                  Exclure
                </button>
              )}
            </span>
          </div>
        );
      })}
      <div style={{ marginTop: 10 }}>
        <button className="btn btn-sm" onClick={() => run(() => api.clanLeave())}>
          {leader && clan.members.length === 1 ? 'Dissoudre le clan' : 'Quitter le clan'}
        </button>
        {leader && clan.members.length > 1 && <span className="muted small"> Le chef doit d’abord passer la main à un officier.</span>}
      </div>
    </div>
  );
}
