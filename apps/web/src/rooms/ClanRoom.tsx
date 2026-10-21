import { useCallback, useEffect, useState } from 'react';
import type { ClanListItem, ClanMemberView, ClanRank, ClanView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { hhmm, num, signedPct } from '../format';
import { Bar, ItemIcon } from '../components/ui';

type Tab = 'warehouse' | 'members' | 'project' | 'log';

const RANK_NAME: Record<ClanRank, string> = { leader: 'Chef', officer: 'Officier', member: 'Membre' };

/** Salle Clan : fonder ou rejoindre, puis entrepôt commun, membres, projet de bonus et journal. */
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
  const run = useCallback(
    async (call: () => ReturnType<typeof api.state>) => {
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

function NoClan({ clans, run }: { clans: ClanListItem[]; run: (call: () => ReturnType<typeof api.state>) => Promise<boolean> }) {
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
        <span className="muted small">
          Sans clan, vous êtes dans la Guilde du bourg : {signedPct(rules.townGuildBonus)} de production.
        </span>
      </header>
      <div className="market-body" style={{ gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)' }}>
        <div className="market-form sunken" style={{ alignContent: 'start' }}>
          <h3 style={{ width: '100%' }}>Fonder un clan</h3>
          <label className="field" style={{ width: '100%' }}>
            <span className="muted small">Nom ({rules.nameMin} à {rules.nameMax} caractères)</span>
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
            Un clan donne un entrepôt commun et un projet de bonus de production : jusqu’à +{Math.round(rules.maxLevel * rules.bonusPerLevel * 100)} % pour tous ses membres.
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
              <span className="chip">niveau {c.level} · {signedPct(c.bonus)}</span>
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

function ClanHall({ clan, run }: { clan: ClanView; run: (call: () => ReturnType<typeof api.state>) => Promise<boolean> }) {
  const [tab, setTab] = useState<Tab>('warehouse');
  const { content, state } = useGame();
  const canWithdraw = clan.myRank !== 'member';
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
              ['warehouse', 'Entrepôt'],
              ['members', `Membres · ${clan.members.length}`],
              ['project', 'Projet'],
              ['log', 'Journal'],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        <span className="chip" style={{ color: 'var(--clan)', borderColor: 'var(--clan)' }}>
          niveau {clan.level} · {signedPct(clan.bonus)} de production
        </span>
      </header>

      {tab === 'warehouse' && <Warehouse clan={clan} run={run} canWithdraw={canWithdraw} />}
      {tab === 'members' && <Members clan={clan} run={run} />}
      {tab === 'project' && <Project clan={clan} run={run} gold={state.gold} maxLevel={content.settings.clan.maxLevel} />}
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

function Warehouse({ clan, run, canWithdraw }: { clan: ClanView; run: (call: () => ReturnType<typeof api.state>) => Promise<boolean>; canWithdraw: boolean }) {
  const { content, state } = useGame();
  const stock = Object.entries(clan.warehouse).sort((a, b) => (content.items[a[0]]?.name ?? '').localeCompare(content.items[b[0]]?.name ?? ''));
  const bag = Object.entries(state.inventory)
    .filter(([id, qty]) => qty > 0 && content.items[id] && !content.items[id]!.tool?.durabilityHours)
    .sort((a, b) => (content.items[a[0]]?.name ?? '').localeCompare(content.items[b[0]]?.name ?? ''));
  const [amount, setAmount] = useState<Record<string, number>>({});
  const qtyOf = (id: string, max: number) => Math.max(1, Math.min(max, amount[id] ?? max));
  return (
    <div className="market-columns" style={{ minHeight: 0 }}>
      <div>
        <span className="eyebrow">
          Entrepôt du clan · {stock.length} / {clan.warehouseKinds} types
        </span>
        <div className="scroll market-list">
          {stock.length === 0 && <p className="muted small">L’entrepôt est vide. Déposez ce que vous voulez partager.</p>}
          {stock.map(([id, qty]) => (
            <div key={id} className="market-row" style={{ gridTemplateColumns: 'auto 1fr auto auto' }}>
              <ItemIcon item={content.items[id]} small />
              <span className="bag-name">
                {content.items[id]?.name} <span className="muted">×{num(qty)}</span>
              </span>
              <input className="input" type="number" min={1} max={qty} style={{ width: 80 }} value={qtyOf(id, qty)} onChange={(e) => setAmount({ ...amount, [id]: Number(e.target.value) })} disabled={!canWithdraw} />
              <button className="btn btn-sm" disabled={!canWithdraw} title={canWithdraw ? '' : 'Réservé aux officiers et au chef'} onClick={() => run(() => api.clanWithdraw(id, qtyOf(id, qty)))}>
                Retirer
              </button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <span className="eyebrow">Votre sac</span>
        <div className="scroll market-list">
          {bag.length === 0 && <p className="muted small">Votre sac est vide.</p>}
          {bag.map(([id, qty]) => (
            <div key={id} className="market-row" style={{ gridTemplateColumns: 'auto 1fr auto auto' }}>
              <ItemIcon item={content.items[id]} small />
              <span className="bag-name">
                {content.items[id]?.name} <span className="muted">×{num(qty)}</span>
              </span>
              <input className="input" type="number" min={1} max={qty} style={{ width: 80 }} value={qtyOf('bag:' + id, qty)} onChange={(e) => setAmount({ ...amount, ['bag:' + id]: Number(e.target.value) })} />
              <button className="btn btn-sm" onClick={() => run(() => api.clanDeposit(id, qtyOf('bag:' + id, qty)))}>
                Déposer
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Members({ clan, run }: { clan: ClanView; run: (call: () => ReturnType<typeof api.state>) => Promise<boolean> }) {
  const { name } = useGame();
  const leader = clan.myRank === 'leader';
  const officer = clan.myRank !== 'member';
  const lastSeen = (m: ClanMemberView) => (m.active ? 'actif' : 'inactif');
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
            <span className="muted small">{lastSeen(m)}</span>
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

function Project({
  clan,
  run,
  gold,
  maxLevel,
}: {
  clan: ClanView;
  run: (call: () => ReturnType<typeof api.state>) => Promise<boolean>;
  gold: number;
  maxLevel: number;
}) {
  const { content } = useGame();
  const rules = content.settings.clan;
  const [amount, setAmount] = useState(500);
  const done = clan.nextCost === null;
  return (
    <div className="scroll market-mine">
      <div>
        <h3>Bonus de clan</h3>
        <p className="muted small">
          Chaque niveau donne {signedPct(rules.bonusPerLevel)} de production à tous les membres, actifs ou non. Le coût suit le nombre de membres actifs sur {rules.activeDays} jours (au moins {rules.minMembersForCost}) : un petit clan avance aussi vite par tête qu’un grand.
        </p>
      </div>
      <div className="market-row" style={{ gridTemplateColumns: '1fr' }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <span>
            Niveau {clan.level} / {maxLevel} · {signedPct(clan.bonus)}
          </span>
          {done ? (
            <span className="muted">Le projet est terminé.</span>
          ) : (
            <>
              <Bar value={clan.fund / clan.nextCost!} color="var(--clan)" />
              <span className="muted small">
                {num(clan.fund)} / {num(clan.nextCost!)} or pour le niveau {clan.level + 1}
              </span>
            </>
          )}
        </div>
      </div>
      {!done && (
        <div className="market-form sunken">
          <label className="field">
            <span className="muted small">Verser (or)</span>
            <input className="input" type="number" min={1} value={amount} onChange={(e) => setAmount(Math.max(1, Math.floor(Number(e.target.value)) || 1))} />
          </label>
          <button className="btn btn-primary" disabled={gold < amount} onClick={() => run(() => api.clanDonate(amount))}>
            Verser au projet
          </button>
          <span className="muted small">Vous avez {num(gold)} or. L’or versé est dépensé pour le clan.</span>
        </div>
      )}
      <div>
        <h3>Les niveaux</h3>
        {Array.from({ length: maxLevel }, (_, i) => i + 1).map((l) => (
          <div key={l} className="market-row" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
            <span className="chip" style={l <= clan.level ? { color: 'var(--good)', borderColor: 'var(--good)' } : undefined}>
              niveau {l}
            </span>
            <span className="muted small">{signedPct(l * rules.bonusPerLevel)} de production</span>
            <span className="muted small">{l <= clan.level ? 'atteint' : `${num(l * rules.levelCostPerMember * Math.max(rules.minMembersForCost, clan.activeMembers))} or`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
