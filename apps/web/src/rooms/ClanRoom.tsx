import { type CSSProperties, type ReactNode, useCallback, useEffect, useState } from 'react';
import type { ClanBuildingView, ClanListItem, ClanMemberView, ClanRank, ClanView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { hhmm, num, signedPct } from '../format';
import { Bar, ItemIcon, Modal } from '../components/ui';
import { Scene } from '../components/Scene';
import { Character } from '../rig/Character';
import { PlayerCard } from '../components/PlayerCard';
import { Avatar } from '../components/Avatar';

type Tab = 'log' | 'members' | 'roads';
type Run = (call: () => ReturnType<typeof api.state>) => Promise<boolean>;

const RANK_NAME: Record<ClanRank, string> = { leader: 'Chef', officer: 'Officier', member: 'Membre' };
/** La fenêtre ouverte est celle des ouvrages (aucun bâtiment ne porte cet identifiant). */
const WORKS_OPEN = '__works';

/**
 * Salle Clan, comme un écran de jeu (retour de Louis : « gros pâté de texte », « ambiance clan ») : en haut la place du
 * clan avec son blason et ses membres debout dans le décor ; en bas le village (un bâtiment par tuile, ses niveaux, ce qu'il
 * manque) et, à côté, le journal, les membres et les Routes franches. Les apports se font dans la fenêtre d'un bâtiment.
 */
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

  if (clan) return <ClanHall clan={clan} run={run} />;
  return (
    <main className="room market-room">
      <section className="panel band">
        <Scene ids={['clan']} />
      </section>
      {clan === undefined ? (
        <section className="panel market-panel">
          <p className="muted">Chargement…</p>
        </section>
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
          {import.meta.env.DEV && (
            <button className="btn btn-sm dev-clan" style={{ width: '100%' }} onClick={() => run(api.devClanTest)} title="Développement : un clan déjà vivant (membres de test, bâtiments, apports en cours)">
              Test : rejoindre le clan d’essai
            </button>
          )}
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

// --- Blason et identité ------------------------------------------------------------------------------------------------

/** Couleur et motif du clan, tirés de son nom (stables) : en attendant des blasons choisis par le chef. */
function heraldry(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hues = [8, 28, 44, 140, 175, 205, 255, 290, 330];
  const hue = hues[h % hues.length]!;
  return { color: `hsl(${hue} 62% 52%)`, dark: `hsl(${hue} 45% 18%)`, motif: (h >> 4) % 4, letter: name.replace(/^(Clan|Les|La|Le|L’)\s+/i, '').charAt(0).toUpperCase() };
}

function Crest({ name, size = 84 }: { name: string; size?: number }) {
  const h = heraldry(name);
  const motif = [
    <path key="m" d="M30 62 L50 30 L70 62" fill="none" stroke="#F3E3B5" strokeOpacity=".35" strokeWidth="3" />,
    <path key="m" d="M24 40 H76 M24 50 H76" stroke="#F3E3B5" strokeOpacity=".25" strokeWidth="4" />,
    <circle key="m" cx="50" cy="50" r="22" fill="none" stroke="#F3E3B5" strokeOpacity=".3" strokeWidth="3" />,
    <path key="m" d="M26 28 L74 76 M74 28 L26 76" stroke="#F3E3B5" strokeOpacity=".22" strokeWidth="4" />,
  ][h.motif];
  return (
    <svg className="clan-crest" viewBox="0 0 100 110" width={size} height={size * 1.1} aria-hidden>
      <path d="M50 4 L92 16 V52 C92 80 72 98 50 106 C28 98 8 80 8 52 V16 Z" fill={h.dark} stroke="#E8C77A" strokeWidth="4" />
      <path d="M50 12 L84 22 V52 C84 74 68 89 50 96 C32 89 16 74 16 52 V22 Z" fill={h.color} opacity=".9" />
      {motif}
      <text x="50" y="66" textAnchor="middle" fontSize="40" fontWeight="800" fill="#FFF6DD" stroke={h.dark} strokeWidth="1.5" fontFamily="inherit">
        {h.letter}
      </text>
      <path d="M38 4 L50 -2 L62 4" fill="none" stroke="#E8C77A" strokeWidth="3" />
    </svg>
  );
}

/** Pour la scène : un membre sans classe (compte ancien ou de test) prend une classe fixe tirée de son identifiant. */
function lookOf(m: ClanMemberView, classes: Record<string, { startingOutfit: string }>) {
  const ids = Object.keys(classes);
  const classId = m.classId ?? ids[m.id % ids.length]!;
  return { classId, outfit: m.outfit ?? classes[classId]!.startingOutfit };
}

// --- La salle ----------------------------------------------------------------------------------------------------------

function ClanHall({ clan, run }: { clan: ClanView; run: Run }) {
  const { content } = useGame();
  const [tab, setTab] = useState<Tab>('log');
  const [open, setOpen] = useState<string | null>(null);
  const [profile, setProfile] = useState<number | null>(null);
  const h = heraldry(clan.name);
  const raw = Object.values(clan.bonuses).reduce((a, b) => Math.max(a, b), 0);
  const built = clan.buildings.reduce((s, b) => s + b.level, 0);
  const maxBuilt = clan.buildings.reduce((s, b) => s + b.maxLevel, 0);
  const building = clan.buildings.find((b) => b.id === open);
  return (
    <main className="room clan-room" style={{ '--hc': h.color } as CSSProperties}>
      <section className="panel band clan-band">
        <Scene ids={['clan']} />
        <ClanYard clan={clan} onOpen={setProfile} />
        <div className="clan-id">
          <Crest name={clan.name} />
          <div className="clan-id-text">
            <span className="eyebrow">Clan · vous êtes {RANK_NAME[clan.myRank].toLowerCase()}</span>
            <h1>{clan.name}</h1>
            <span className="clan-renown" title="Le Renom ne baisse jamais : bâtiments, Marée du soir, gardiens vaincus par les membres. Il ne donne que du prestige.">
              {clan.renown.rank} · {clan.renown.value} de Renom
              {clan.renown.next ? ` · ${clan.renown.next.name} à ${clan.renown.next.at}` : ''}
            </span>
            {clan.description && <p>{clan.description}</p>}
          </div>
        </div>
        <div className="clan-stats">
          <Stat value={`${clan.members.length}/${clan.maxMembers}`} label="membres" />
          <Stat value={String(clan.activeMembers)} label="actifs" />
          <Stat value={`${built}/${maxBuilt}`} label="niveaux bâtis" />
          <Stat value={signedPct(Math.min(raw, content.settings.bonusCaps.clan))} label={`bonus · max ${signedPct(content.settings.bonusCaps.clan)}`} tone="var(--good)" />
        </div>
      </section>
      <div className="clan-hub">
        <section className="panel clan-village">
          <header className="clan-village-head">
            <div>
              <span className="eyebrow">Le village</span>
              <strong>Bâtir ensemble</strong>
            </div>
            <span className="muted small">Chaque niveau accélère des métiers pour tous les membres · coûts selon les {clan.activeMembers} actifs</span>
          </header>
          <div className="building-tiles">
            {clan.buildings.map((b) => (
              <BuildingTile key={b.id} b={b} onOpen={() => setOpen(b.id)} />
            ))}
          </div>
          {clan.works && <WorksStrip works={clan.works} onOpen={() => setOpen(WORKS_OPEN)} run={run} />}
        </section>
        <section className="panel clan-side">
          <div className="tabs" role="tablist">
            {(
              [
                ['log', 'Journal'],
                ['members', `Membres · ${clan.members.length}`],
                ['roads', 'Routes franches'],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'log' && <ClanLog clan={clan} />}
          {tab === 'members' && <Members clan={clan} run={run} onOpen={setProfile} />}
          {tab === 'roads' && (
            <div className="clan-soon">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--clan)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 17h13l3-5h2M5 17V9h9v8M14 12h4M7 20a2 2 0 1 0 0-.01M16 20a2 2 0 1 0 0-.01" />
              </svg>
              <span className="mode-soon static">Bientôt</span>
              <h3>Routes franches</h3>
              <p className="muted small">La caravane du clan, chaque semaine : chacun son poste (éclaireur, escorte, intendant, artisan), étape après étape, et le clan grimpe au classement.</p>
            </div>
          )}
        </section>
      </div>
      {profile !== null && <PlayerCard id={profile} onClose={() => setProfile(null)} />}
      {building && (
        <Modal onClose={() => setOpen(null)} className="building-modal">
          <BuildingSheet b={building} run={run} />
        </Modal>
      )}
      {open === WORKS_OPEN && clan.works && (
        <Modal onClose={() => setOpen(null)} className="building-modal">
          <WorksSheet works={clan.works} run={run} />
        </Modal>
      )}
    </main>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: string }) {
  return (
    <div className="clan-stat">
      <strong style={{ color: tone }}>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

/** La place du clan : ses membres debout dans le décor, le chef au centre ; les absents en retrait, estompés. */
function ClanYard({ clan, onOpen }: { clan: ClanView; onOpen: (id: number) => void }) {
  const { content } = useGame();
  const order: Record<ClanRank, number> = { leader: 0, officer: 1, member: 2 };
  const shown = [...clan.members].sort((a, b) => Number(b.active) - Number(a.active) || order[a.rank] - order[b.rank]).slice(0, 9);
  // Le chef au milieu, puis les autres de part et d'autre, de plus en plus loin.
  const slots = shown.map((_, i) => (i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2)));
  return (
    <div className="clan-yard">
      {shown.map((m, i) => {
        const s = slots[i]!;
        const style = { '--x': `${64 + s * 7.6}%`, '--dy': `${Math.abs(s) * 4}px`, '--shrink': `${Math.min(10, Math.abs(s) * 2.2)}%`, zIndex: 10 - Math.abs(s) } as CSSProperties;
        return (
          <div key={m.id} className={`clan-member-figure${m.active ? '' : ' away'}`} style={style} onClick={() => onOpen(m.id)} role="button" tabIndex={0}>
            <div className="walker-card">
              <strong>{m.name}</strong>
              <span>
                {RANK_NAME[m.rank]} · {content.classes[m.classId ?? '']?.name ?? 'sans classe'} {m.classLevel}
              </span>
              <span className="muted">{m.active ? 'actif' : `absent depuis ${daysSince(m.lastSeenAt)} j`}</span>
            </div>
            <Character appearance={lookOf(m, content.classes)} lod="scene" title={m.name} crowd />
            <span className={`clan-tag rank-${m.rank}`}>
              {m.rank === 'leader' && <Crown />}
              {m.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const daysSince = (at: number) => Math.max(1, Math.floor((Date.now() - at) / 86_400_000));

function Crown() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden>
      <path d="M3 18h18l-1.5-10-4.5 4-3-6-3 6-4.5-4z" fill="#F2C14E" />
    </svg>
  );
}

// --- Le village --------------------------------------------------------------------------------------------------------

/** Dessin et couleur de chaque bâtiment (en attendant des illustrations). */
const BUILDING_ART: Record<string, { color: string; d: string }> = {
  hall: { color: '#E8C77A', d: 'M4 21V10l8-6 8 6v11M9 21v-5h6v5M8 11h2M14 11h2M12 4V2' },
  forge: { color: '#FF8A3D', d: 'M4 21V11h10v10M14 14h6v7M16 11V5h3v6M6 17h6M7 14h4M17 3c0 1 1 1 1 2' },
  sawmill: { color: '#C9A36A', d: 'M3 21h18M5 21V12h9v9M14 15a4 4 0 1 0 8 0 4 4 0 0 0-8 0M18 11v8M14 15h8M7 9l3-4 3 4' },
  fields: { color: '#8DCB6A', d: 'M3 20h18M6 20v-5M6 15c-2 0-3-2-3-3 2 0 3 1 3 3zM6 15c2 0 3-2 3-3-2 0-3 1-3 3M12 20v-7M12 13c-2 0-3-2-3-3 2 0 3 1 3 3zM12 13c2 0 3-2 3-3-2 0-3 1-3 3M18 20v-5M18 15c-2 0-3-2-3-3 2 0 3 1 3 3z' },
  harbor: { color: '#6FB7E8', d: 'M2 19c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M5 15h14l-2 3H7zM12 15V4l6 8h-6M3 15V9h3' },
  lodge: { color: '#B58A5E', d: 'M3 21L12 4l9 17zM12 4v17M9 21l3-6 3 6M6 5l2 2M18 5l-2 2M5 3v3M19 3v3' },
  arcane_tower: { color: '#B39DF5', d: 'M8 21V9h8v12M7 9l5-6 5 6M10 13h4M10 17h4M12 1v1M19 6l1-1M5 6L4 5' },
  tavern: { color: '#F2C14E', d: 'M5 21V9h14v12M4 9l8-5 8 5M9 21v-5h6v5M15 12h3v3h-3zM6 12h3' },
};

function BuildingArt({ id, size = 44 }: { id: string; size?: number }) {
  const art = BUILDING_ART[id] ?? BUILDING_ART.hall!;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={art.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={art.d} />
    </svg>
  );
}

/** Part réunie pour le niveau suivant (moyenne des apports demandés). */
function readiness(b: ClanBuildingView): number {
  if (!b.next) return 1;
  const parts = [b.next.gold, ...b.next.items].filter((p) => p.need > 0);
  return parts.length ? parts.reduce((s, p) => s + Math.min(1, p.have / p.need), 0) / parts.length : 0;
}

/** Ce qu'accélère un bâtiment, en peu de mots. */
function targetsOf(id: string, content: ReturnType<typeof useGame>['content']): string {
  const def = content.buildings[id]!;
  return def.boost.professions.includes('all') ? 'tous les métiers' : def.boost.professions.map((p) => content.professions.find((x) => x.id === p)?.name ?? p).join(', ');
}

function BuildingTile({ b, onOpen }: { b: ClanBuildingView; onOpen: () => void }) {
  const { content } = useGame();
  const def = content.buildings[b.id]!;
  const art = BUILDING_ART[b.id] ?? BUILDING_ART.hall!;
  const ready = readiness(b);
  const maxed = b.level >= b.maxLevel;
  return (
    <button className={`building-tile${b.level === 0 ? ' unbuilt' : ''}${maxed ? ' maxed' : ''}`} style={{ '--bc': art.color } as CSSProperties} onClick={onOpen}>
      <span className="building-art">
        <BuildingArt id={b.id} />
        {!maxed && ready > 0 && <span className="building-ring" style={{ '--p': `${ready * 360}deg` } as CSSProperties} />}
      </span>
      <span className="building-text">
        <strong>{def.name}</strong>
        <span className="building-pips" aria-label={`niveau ${b.level} sur ${b.maxLevel}`}>
          {Array.from({ length: b.maxLevel }, (_, i) => (
            <span key={i} className={i < b.level ? 'on' : ''} />
          ))}
        </span>
        <span className="muted small">
          {b.level > 0 ? `${signedPct(def.boost.perLevel * b.level)} · ` : ''}
          {targetsOf(b.id, content)}
        </span>
      </span>
      <span className="building-state">{maxed ? 'Achevé' : b.level === 0 ? (ready > 0 ? `${Math.round(ready * 100)} %` : 'À bâtir') : `${Math.round(ready * 100)} %`}</span>
    </button>
  );
}

/** Fenêtre d'un bâtiment : ce qu'il fait, son prochain niveau, et les apports. */
function BuildingSheet({ b, run }: { b: ClanBuildingView; run: Run }) {
  const { content } = useGame();
  const def = content.buildings[b.id]!;
  const art = BUILDING_ART[b.id] ?? BUILDING_ART.hall!;
  return (
    <div className="building-sheet" style={{ '--bc': art.color } as CSSProperties}>
      <header className="building-sheet-head">
        <span className="building-art big">
          <BuildingArt id={b.id} size={60} />
        </span>
        <div>
          <h2>{def.name}</h2>
          <p className="muted small">{def.description}</p>
          <div className="row-gap">
            <span className="chip">
              Niveau {b.level} / {b.maxLevel}
            </span>
            <span className="chip" style={{ color: 'var(--good)', borderColor: 'var(--good)' }}>
              {signedPct(def.boost.perLevel)} par niveau · {targetsOf(b.id, content)}
            </span>
          </div>
        </div>
      </header>
      {b.next === null ? (
        <p className="muted">Bâtiment achevé : il donne {signedPct(def.boost.perLevel * b.level)} à tous les membres.</p>
      ) : (
        <div className="building-needs">
          <span className="eyebrow">Pour le niveau {b.level + 1}</span>
          <NeedRows next={b.next} give={(what, n) => run(() => api.clanContribute(b.id, what, n))} />
        </div>
      )}
    </div>
  );
}

type Needs = NonNullable<ClanBuildingView['next']>;

/** Ce que demande un niveau (bâtiment ou ouvrage), ce qui est déjà apporté, et de quoi apporter sa part. */
function NeedRows({ next, give }: { next: Needs; give: (what: string, qty: number) => Promise<boolean> }) {
  const { content, state } = useGame();
  const [amount, setAmount] = useState<Record<string, number>>({});
  const qty = (key: string, max: number) => Math.max(1, Math.min(max, amount[key] ?? max));
  const rows: { key: string; label: string; need: number; have: number; mine: number; item?: string }[] = [
    { key: 'gold', label: 'Or', need: next.gold.need, have: next.gold.have, mine: state.gold },
    ...next.items.map((i) => ({ key: i.item, label: content.items[i.item]?.name ?? i.item, need: i.need, have: i.have, mine: state.inventory[i.item] ?? 0, item: i.item })),
  ].filter((r) => r.need > 0);
  return (
    <>
          {rows.map((r) => {
            const left = Math.max(0, r.need - r.have);
            const n = qty(r.key, Math.min(left, Math.max(1, r.mine)));
            return (
              <div key={r.key} className="building-need">
                <span className="building-need-name">
                  {r.item ? <ItemIcon item={content.items[r.item]} small /> : <span className="gold-dot" />}
                  {r.label}
                </span>
                <Bar value={r.have / r.need} color="var(--bc)" />
                <span className="mono small">
                  {num(r.have)} / {num(r.need)}
                </span>
                {left > 0 ? (
                  <span className="bag-actions">
                    <input className="input" type="number" min={1} aria-label={`Quantité de ${r.label}`} style={{ width: 80 }} value={n} onChange={(e) => setAmount({ ...amount, [r.key]: Math.floor(Number(e.target.value)) || 1 })} />
                    <button className="btn btn-sm btn-primary" disabled={r.mine <= 0} onClick={() => void give(r.key, n)} title={`Vous en avez ${num(r.mine)}`}>
                      Apporter
                    </button>
                  </span>
                ) : (
                  <span className="chip" style={{ color: 'var(--good)', borderColor: 'var(--good)' }}>
                    complet
                  </span>
                )}
              </div>
            );
          })}
          <p className="muted small">Vous avez : {rows.map((r) => `${num(r.mine)} ${r.label.toLowerCase()}`).join(' · ')}.</p>
    </>
  );
}

// --- Ouvrages du clan et Banquet ---------------------------------------------------------------------------------------

const WORKS_ART = { color: '#F0B35A', d: 'M5 21h14M7 21v-3h10v3M9 18V9h6v9M8 9l4-6 4 6M11 12h2M3 21h2M19 21h2' };

/** Part réunie pour l'ouvrage en cours. */
function worksReady(next: Needs): number {
  const parts = [next.gold, ...next.items].filter((p) => p.need > 0);
  return parts.length ? parts.reduce((s, p) => s + Math.min(1, p.have / p.need), 0) / parts.length : 0;
}

/**
 * Les ouvrages [Décidé par Louis, 23 octobre] : le prestige du clan, sans fin. Chaque ouvrage achevé donne un Banquet que le
 * chef ou un officier lance : quelques heures d'XP en plus pour tous les membres.
 */
function WorksStrip({ works, onOpen, run }: { works: NonNullable<ClanView['works']>; onOpen: () => void; run: Run }) {
  const ready = worksReady(works.next);
  const pct = Math.round(works.bonus * 100);
  return (
    <div className="works-strip" style={{ '--bc': WORKS_ART.color } as CSSProperties}>
      <button className="works-main" onClick={onOpen}>
        <span className="building-art">
          <svg viewBox="0 0 24 24" width={40} height={40} fill="none" stroke={WORKS_ART.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={WORKS_ART.d} />
          </svg>
          {ready > 0 && <span className="building-ring" style={{ '--p': `${ready * 360}deg` } as CSSProperties} />}
        </span>
        <span className="building-text">
          <span className="eyebrow">Ouvrages · {works.level} achevé{works.level > 1 ? 's' : ''}</span>
          <strong>{works.next.name}</strong>
          <span className="muted small">{Math.round(ready * 100)} % réuni · chaque ouvrage achevé donne un Banquet</span>
        </span>
      </button>
      <div className="works-banquet">
        <span className="works-stock" aria-label={`${works.banquets} Banquets en réserve sur ${works.maxBanquets}`}>
          {Array.from({ length: works.maxBanquets }, (_, i) => (
            <span key={i} className={i < works.banquets ? 'on' : ''} />
          ))}
        </span>
        {works.banquet ? (
          <span className="works-on">
            Banquet en cours : +{pct} % d’XP jusqu’à {hhmm(works.banquet.until)}
          </span>
        ) : (
          <button className="btn btn-sm btn-primary" disabled={!works.canLaunch} onClick={() => void run(api.clanBanquet)} title={works.canLaunch ? '' : 'Le chef ou un officier lance un Banquet en réserve.'}>
            Lancer le Banquet ({works.hours} h, +{pct} % d’XP)
          </button>
        )}
      </div>
    </div>
  );
}

function WorksSheet({ works, run }: { works: NonNullable<ClanView['works']>; run: Run }) {
  return (
    <div className="building-sheet" style={{ '--bc': WORKS_ART.color } as CSSProperties}>
      <header className="building-sheet-head">
        <span className="building-art big">
          <svg viewBox="0 0 24 24" width={60} height={60} fill="none" stroke={WORKS_ART.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={WORKS_ART.d} />
          </svg>
        </span>
        <div>
          <span className="eyebrow">Ouvrage n° {works.level + 1}</span>
          <h2>{works.next.name}</h2>
          <p className="muted small">{works.next.description}</p>
          <div className="row-gap">
            <span className="chip" style={{ color: 'var(--good)', borderColor: 'var(--good)' }}>
              Achevé : un Banquet de {works.hours} h, +{Math.round(works.bonus * 100)} % d’XP pour tout le clan
            </span>
          </div>
        </div>
      </header>
      <div className="building-needs">
        <span className="eyebrow">Ce qu’il demande</span>
        <NeedRows next={works.next} give={(what, n) => run(() => api.clanWorksContribute(what, n))} />
      </div>
      <p className="muted small">Les ouvrages ne s’arrêtent jamais : le suivant commence dès que celui-ci est achevé. Le clan garde au plus {works.maxBanquets} Banquets en réserve.</p>
    </div>
  );
}

// --- Journal et membres ------------------------------------------------------------------------------------------------

/** Le journal du clan, en lignes à icône (arrivées, apports, niveaux de bâtiment, rangs). */
function ClanLog({ clan }: { clan: ClanView }) {
  const icon = (t: string): { d: string; c: string } =>
    /passe au niveau/.test(t)
      ? { d: 'M12 4l6 7h-4v8h-4v-8H6z', c: 'var(--good)' }
      : /apporte/.test(t)
        ? { d: 'M4 10h16v9H4zM4 10l2-5h12l2 5M11 13h2', c: 'var(--action)' }
        : /rejoint|fonde/.test(t)
          ? { d: 'M15 19v-1a4 4 0 0 0-8 0v1M11 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 8v6M16 11h6', c: 'var(--event)' }
          : /quitte|exclu/.test(t)
            ? { d: 'M15 19v-1a4 4 0 0 0-8 0v1M11 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M16 11h6', c: 'var(--alert)' }
            : { d: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z', c: 'var(--clan)' };
  return (
    <div className="journal-list scroll clan-log">
      {clan.log.length === 0 && <p className="muted small">Rien pour le moment.</p>}
      {[...clan.log].reverse().map((l) => {
        const ic = icon(l.text);
        return (
          <div key={l.id} className="j-line">
            <span className="j-icon" style={{ '--tc': ic.c } as CSSProperties}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d={ic.d} />
              </svg>
            </span>
            <span className="j-body">{l.text}</span>
            <span className="j-time">{hhmm(l.at)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Members({ clan, run, onOpen }: { clan: ClanView; run: Run; onOpen: (id: number) => void }) {
  const { name, content } = useGame();
  const leader = clan.myRank === 'leader';
  const officer = clan.myRank !== 'member';
  return (
    <div className="scroll clan-members">
      {clan.members.map((m) => {
        const me = m.name === name;
        const actions: ReactNode[] = [];
        if (leader && !me && m.rank === 'member') actions.push(<button key="o" className="btn btn-sm" onClick={() => run(() => api.clanRank(m.id, 'officer'))}>Nommer officier</button>);
        if (leader && !me && m.rank === 'officer') {
          actions.push(<button key="r" className="btn btn-sm" onClick={() => run(() => api.clanRank(m.id, 'member'))}>Rétrograder</button>);
          actions.push(<button key="l" className="btn btn-sm" onClick={() => run(() => api.clanLeader(m.id))}>Passer la main</button>);
        }
        if (officer && !me && m.rank !== 'leader' && (leader || m.rank === 'member')) actions.push(<button key="k" className="btn btn-sm" onClick={() => run(() => api.clanKick(m.id))}>Exclure</button>);
        return (
          <div key={m.id} className={`clan-member${m.active ? '' : ' away'}`}>
            <button className="clan-portrait" onClick={() => onOpen(m.id)} title={`Voir la fiche de ${m.name}`}>
              <Avatar id={m.id} version={m.avatar} name={m.name} classId={m.classId} appearance={lookOf(m, content.classes)} size={44} />
              <span className={`clan-dot${m.active ? ' on' : ''}`} />
            </button>
            <span className="clan-member-text">
              <strong>
                {m.name} {me && <span className="muted small">(vous)</span>}
              </strong>
              <span className="muted small">
                {content.classes[m.classId ?? '']?.name ?? 'Sans classe'} {m.classLevel} · {m.active ? 'actif' : `absent ${daysSince(m.lastSeenAt)} j`}
              </span>
            </span>
            <span className={`rank-badge rank-${m.rank}`}>
              {m.rank === 'leader' && <Crown />}
              {RANK_NAME[m.rank]}
            </span>
            {actions.length > 0 && <span className="clan-member-actions">{actions}</span>}
          </div>
        );
      })}
      <div className="clan-leave">
        <button className="btn btn-sm" onClick={() => run(() => api.clanLeave())}>
          {leader && clan.members.length === 1 ? 'Dissoudre le clan' : 'Quitter le clan'}
        </button>
        {leader && clan.members.length > 1 && <span className="muted small">Le chef doit d’abord passer la main.</span>}
      </div>
    </div>
  );
}
