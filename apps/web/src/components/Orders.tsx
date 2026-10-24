import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import type { OrderCatalogView, OrderQuote, OrdersView, OrderTarget, OrderView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { duration, num } from '../format';
import { Avatar } from './Avatar';
import { GearIcon } from './GearIcon';
import { PlayerName } from './ProfileLink';
import { ItemIcon, Modal } from './ui';

/**
 * Les commandes entre joueurs (docs/design/social.md §3 ; demande de Louis du 24 octobre : « lui passer une commande, avec un
 * prix et un délai ; il accepte ou refuse, et livre quand il a fini »). Passer une commande depuis la page profil d'un
 * artisan ; les suivre dans l'onglet Commandes du Marché ; les fabriquer et les livrer depuis la salle du métier.
 * Commandes ouvertes (social.md §4.4) : sans artisan désigné, sur le panneau du clan ou de tout le serveur ; le premier
 * artisan qui sait la faire la prend.
 */

const DELAY: Record<'rush' | 'normal' | 'relaxed', { name: string; hint: string }> = {
  rush: { name: 'Pressé', hint: 'au plus vite : un prix plus haut' },
  normal: { name: 'Normal', hint: 'il le glisse entre ses activités' },
  relaxed: { name: 'Tranquille', hint: 'sans urgence' },
};
const hoursText = (h: number) => (h < 48 ? `${h} h` : `${Math.round(h / 24)} jours`);

function TargetIcon({ t }: { t: Pick<OrderTarget, 'kind' | 'id' | 'gear'> }) {
  const { content } = useGame();
  if (t.kind === 'item') return <ItemIcon item={content.items[t.id]} small />;
  return t.gear ? <GearIcon slot={t.gear.slot} family={t.gear.family} tier={t.gear.tier} rarity={t.gear.rarity} size={34} /> : null;
}

/**
 * Passer une commande à un artisan : quoi, combien, matériaux fournis ou non, délai, prix. Sans `artisanId` : une commande
 * ouverte, affichée pour son clan ou tout le serveur.
 */
export function OrderModal({ artisanId, inClan = false, onClose }: { artisanId?: number; inClan?: boolean; onClose: () => void }) {
  const { content, state, act, flash } = useGame();
  const openMode = artisanId === undefined;
  const [cat, setCat] = useState<OrderCatalogView | null>(null);
  const [found, setFound] = useState<OrderTarget[] | null>(null);
  const [scope, setScope] = useState<'clan' | 'server'>(inClan ? 'clan' : 'server');
  const [query, setQuery] = useState('');
  const [pick, setPick] = useState<OrderTarget | null>(null);
  const [qty, setQty] = useState(1);
  const [supply, setSupply] = useState(false);
  const [quote, setQuote] = useState<(OrderQuote & { supplied: { item: string; qty: number }[] }) | null>(null);
  const [delay, setDelay] = useState<'rush' | 'normal' | 'relaxed'>('normal');
  const [price, setPrice] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (artisanId !== undefined) api.orderCatalog(artisanId).then(setCat).catch(() => setCat(null));
  }, [artisanId]);
  // Commande ouverte : on cherche dans tout ce qui se fabrique (le serveur), tous niveaux confondus.
  useEffect(() => {
    if (!openMode) return;
    if (query.trim().length < 2) return setFound(null);
    const id = window.setTimeout(() => {
      api
        .orderSearch(query.trim())
        .then((r) => setFound(r.targets))
        .catch(() => setFound([]));
    }, 250);
    return () => window.clearTimeout(id);
  }, [openMode, query]);
  useEffect(() => {
    if (!pick) return;
    const id = window.setTimeout(() => {
      api
        .orderQuote({ ...(openMode ? {} : { artisanId }), kind: pick.kind, target: pick.id, qty, supply })
        .then((q) => {
          setQuote(q);
          setPrice(null);
        })
        .catch(() => setQuote(null));
    }, 250);
    return () => window.clearTimeout(id);
  }, [artisanId, openMode, pick, qty, supply]);
  const prof = (id: string) => content.professions.find((p) => p.id === id)?.name ?? id;
  const shown = useMemo(() => {
    if (openMode) return found ?? [];
    const q = query.trim().toLowerCase();
    return (cat?.targets ?? []).filter((t) => !q || t.name.toLowerCase().includes(q) || prof(t.profession).toLowerCase().includes(q)).slice(0, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, found, openMode, query]);
  const d = quote?.delays.find((x) => x.id === delay);
  const value = price ?? d?.advised ?? 0;
  const tax = Math.round(value * content.settings.orders.taxShare);
  const send = async () => {
    if (!pick || !d) return;
    const who = openMode ? { scope } : { artisanId };
    const ok = await act(() => api.orderCreate({ ...who, kind: pick.kind, target: pick.id, qty, supply, price: value, delay, message: message.trim() || undefined }));
    if (ok) {
      flash(openMode ? `Commande affichée ${scope === 'clan' ? 'pour votre clan' : 'pour tout le serveur'}.` : `Commande envoyée à ${cat?.artisan.name}.`);
      onClose();
    }
  };

  return (
    <Modal onClose={onClose} className="ord-modal">
      {openMode ? (
        <>
          <div className="ord-head">
            <span className="ord-open-badge" aria-hidden>
              ✦
            </span>
            <div>
              <span className="eyebrow">Commande ouverte</span>
              <h2>Pour le premier artisan qui la prend</h2>
            </div>
          </div>
          <div className="ord-scope" role="radiogroup" aria-label="Où l’afficher">
            <button role="radio" aria-checked={scope === 'clan'} className={`ord-scope-opt${scope === 'clan' ? ' on' : ''}`} disabled={!inClan} onClick={() => setScope('clan')}>
              <strong>Mon clan</strong>
              <span className="muted small">{inClan ? 'ses membres seulement, et le journal du clan' : 'vous n’avez pas de clan'}</span>
            </button>
            <button role="radio" aria-checked={scope === 'server'} className={`ord-scope-opt${scope === 'server' ? ' on' : ''}`} onClick={() => setScope('server')}>
              <strong>Tout le serveur</strong>
              <span className="muted small">n’importe quel artisan qui a le niveau</span>
            </button>
          </div>
        </>
      ) : (
        <div className="ord-head">
          {cat && <Avatar id={cat.artisan.id} version={cat.artisan.avatar} name={cat.artisan.name} classId={cat.artisan.classId} size={44} />}
          <div>
            <span className="eyebrow">Passer une commande</span>
            <h2>{cat ? cat.artisan.name : '…'}</h2>
          </div>
        </div>
      )}
      {!openMode && cat && !cat.open ? (
        <p className="muted">Ce joueur ne prend pas de commandes pour le moment.</p>
      ) : !pick ? (
        <>
          <input className="input" placeholder="Chercher un objet ou un métier…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
          <div className="ord-targets scroll">
            {openMode ? (
              found === null ? (
                <p className="muted small">Tapez au moins deux lettres : un objet (« lingot », « bottes »), ou un métier (« forge »).</p>
              ) : (
                shown.length === 0 && <p className="muted small">Rien ne correspond.</p>
              )
            ) : (
              <>
                {cat === null && <p className="muted small">Chargement…</p>}
                {cat && shown.length === 0 && <p className="muted small">Rien à son niveau qui corresponde.</p>}
              </>
            )}
            {shown.map((t) => (
              <button key={`${t.kind}${t.id}`} className="ord-target" onClick={() => (setPick(t), setQty(t.kind === 'gear' ? 1 : t.perCraft * 10))}>
                <TargetIcon t={t} />
                <span className="ord-target-text">
                  <strong>{t.name}</strong>
                  <span className="muted small">
                    {prof(t.profession)} · niveau {t.level}
                    {t.kind === 'gear' ? ' · équipement' : ''}
                  </span>
                </span>
                <span className="muted small">{num(t.value)} or</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="ord-form">
          <div className="ord-picked">
            <TargetIcon t={pick} />
            <span className="ord-target-text">
              <strong>{pick.name}</strong>
              <span className="muted small">{prof(pick.profession)}</span>
            </span>
            <button className="link small" onClick={() => (setPick(null), setQuote(null))}>
              Changer
            </button>
          </div>
          <label className="ord-row">
            <span>Quantité</span>
            <span className="ord-qty">
              <button className="btn btn-sm" onClick={() => setQty(Math.max(1, qty - (pick.kind === 'gear' ? 1 : pick.perCraft)))}>
                −
              </button>
              <input className="input" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
              <button className="btn btn-sm" onClick={() => setQty(qty + (pick.kind === 'gear' ? 1 : pick.perCraft))}>
                +
              </button>
            </span>
          </label>
          <label className="ord-check">
            <input type="checkbox" checked={supply} onChange={(e) => setSupply(e.target.checked)} />
            <span>
              Fournir mes matériaux
              <span className="muted small"> · ce que j’ai dans mon sac, à la place d’une partie du prix</span>
            </span>
          </label>
          {supply && quote && (
            <div className="ord-mats small">
              {quote.supplied.length ? (
                quote.supplied.map((m) => (
                  <span key={m.item} className="chip">
                    {num(m.qty)} × {content.items[m.item]?.name ?? m.item}
                  </span>
                ))
              ) : (
                <span className="muted">Vous n’avez aucun de ses matériaux.</span>
              )}
            </div>
          )}
          <div className="ord-delays">
            {(quote?.delays ?? []).map((x) => (
              <button key={x.id} className={`ord-delay${delay === x.id ? ' on' : ''}`} onClick={() => (setDelay(x.id), setPrice(null))}>
                <strong>{DELAY[x.id].name}</strong>
                <span>à livrer en {hoursText(x.hours)}</span>
                <span className="muted small">{DELAY[x.id].hint}</span>
                <span className="ord-advised">conseillé {num(x.advised)} or</span>
              </button>
            ))}
            {!quote && <p className="muted small">Calcul du délai…</p>}
          </div>
          {quote && <p className="muted small">Temps de fabrication estimé : {duration(quote.workSec * 1000)} de travail pour {openMode ? 'l’artisan' : 'lui'}.</p>}
          <label className="ord-row">
            <span>Prix</span>
            <span className="ord-price">
              <input className="input" type="number" min={0} max={d?.cap} value={value} onChange={(e) => setPrice(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
              <span className="muted small">or · {d ? `au plus ${num(d.cap)}` : ''}</span>
            </span>
          </label>
          <input className="input" placeholder="Un mot pour l’artisan (facultatif)" maxLength={200} value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="ord-summary small">
            <span>
              <strong>{num(value)} or</strong> mis de côté maintenant (il vous en reste {num(state.gold - value)}). {supply && quote?.supplied.length ? 'Vos matériaux aussi. ' : ''}
              {openMode ? 'L’artisan' : 'Il'} touchera <strong>{num(value - tax)} or</strong> à la livraison (taxe {Math.round(content.settings.orders.taxShare * 100)} %).{' '}
              {openMode
                ? `Le délai part quand un artisan la prend. Si personne ne la prend en ${hoursText(content.settings.orders.openHours)}, tout vous revient.`
                : `S’il refuse ou ne répond pas en ${content.settings.orders.answerHours} h, tout vous revient.`}
            </span>
          </div>
          <div className="ord-actions">
            <button className="btn btn-primary" disabled={!d || value > (d?.cap ?? 0) || value > state.gold || (value === 0 && !(supply && quote?.supplied.length))} onClick={() => void send()}>
              {openMode ? 'Afficher la commande' : 'Envoyer la commande'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const STATUS: Record<OrderView['status'], { label: string; tone: string }> = {
  open: { label: 'Sur le panneau', tone: 'var(--clan)' },
  proposed: { label: 'En attente de réponse', tone: 'var(--event)' },
  accepted: { label: 'Acceptée', tone: 'var(--action)' },
  delivered: { label: 'Livrée', tone: 'var(--good)' },
  refused: { label: 'Refusée', tone: 'var(--text-muted)' },
  cancelled: { label: 'Annulée', tone: 'var(--text-muted)' },
  expired: { label: 'Expirée', tone: 'var(--text-muted)' },
};

/** Une commande en carte, avec ce qu'on peut en faire. */
export function OrderCard({ o, onDone }: { o: OrderView; onDone: () => void }) {
  const { content, act, flash, openRecipe, go } = useGame();
  const other = o.mine ? o.artisan : o.client;
  const where = o.scope === 'clan' ? 'le panneau du clan' : 'le panneau du serveur';
  const prof = content.professions.find((p) => p.id === o.profession)?.name ?? o.profession;
  const level = o.level;
  const now = Date.now();
  const left = o.dueAt - now;
  const late = o.status === 'accepted' && left < 0;
  const run = async (call: () => Promise<import('@bramo/shared').StateResponse>) => {
    if (await act(call)) onDone();
  };
  const make = () => {
    const r = Object.values(content.recipes).find((x) => x.outputs.some((out) => out.item === o.target));
    if (o.kind === 'item' && r) openRecipe(r.id);
    else go('professions', o.profession);
    flash('Fabriquez ce qui manque, puis revenez livrer.');
  };
  return (
    <div className={`ord-card${late ? ' late' : ''}`} style={{ '--st': STATUS[o.status].tone } as CSSProperties}>
      <div className="ord-card-head">
        <TargetIcon t={{ kind: o.kind, id: o.target, gear: o.gear }} />
        <span className="ord-target-text">
          <strong>
            {num(o.qty)} × {o.name}
          </strong>
          <span className="small muted">
            {other ? (
              <>
                {o.mine ? 'pour vous, par ' : 'pour '}
                <PlayerName id={other.id}>{other.name}</PlayerName>
              </>
            ) : (
              `pour vous, sur ${where}`
            )}
            {!o.mine && o.status === 'open' && <span className="ord-scope-chip">{o.scope === 'clan' ? 'Clan' : 'Serveur'}</span>}
          </span>
        </span>
        {!(o.status === 'open' && !o.mine) && <span className="ord-status">{late ? 'En retard' : STATUS[o.status].label}</span>}
      </div>
      <div className="ord-card-body small">
        <span>
          <strong>{num(o.price)} or</strong>
          {!o.mine && o.status !== 'delivered' ? ` (vous toucherez ${num(o.net)})` : ''}
          {o.materials.length ? ` · matériaux fournis : ${o.materials.map((m) => `${num(m.qty)} ${content.items[m.item]?.name ?? m.item}`).join(', ')}` : ''}
        </span>
        {o.status === 'open' && (
          <span className="muted">
            {o.mine ? `personne ne l’a encore prise · reste ${duration(Math.max(0, left))}` : `${prof}${level ? ` niveau ${level}` : ''} · à livrer ${hoursText(o.delayHours)} après l’avoir prise`}
          </span>
        )}
        {(o.status === 'proposed' || o.status === 'accepted') && (
          <span className="muted">
            {o.status === 'proposed' ? `réponse attendue sous ${duration(Math.max(0, left))}` : late ? `en retard de ${duration(-left)}` : `à livrer dans ${duration(left)}`} · délai {DELAY[o.delay].name.toLowerCase()} ({hoursText(o.delayHours)})
          </span>
        )}
        {o.status === 'delivered' && <span className="muted">{o.onTime ? 'Livrée à temps.' : 'Livrée en retard.'}</span>}
        {o.message && <span className="ord-message">« {o.message} »</span>}
      </div>
      <div className="ord-card-actions">
        {!o.mine && o.status === 'proposed' && (
          <>
            <button className="btn btn-sm btn-primary" onClick={() => void run(() => api.orderAnswer(o.id, true))}>
              Accepter
            </button>
            <button className="btn btn-sm" onClick={() => void run(() => api.orderAnswer(o.id, false))}>
              Refuser
            </button>
          </>
        )}
        {!o.mine && o.status === 'accepted' && (
          <>
            <button className="btn btn-sm btn-primary" disabled={!o.ready} onClick={() => void run(() => api.orderDeliver(o.id))} title={o.ready ? 'Donner les objets et toucher le prix' : 'Il vous manque ce qui est commandé'}>
              Livrer
            </button>
            {!o.ready && (
              <button className="btn btn-sm" onClick={make}>
                Fabriquer
              </button>
            )}
          </>
        )}
        {!o.mine && o.status === 'open' && (
          <button className="btn btn-sm btn-primary" disabled={!o.canTake} onClick={() => void run(() => api.orderTake(o.id))} title={o.canTake ? 'Elle devient la vôtre : le délai part maintenant' : `Il faut ${prof}${level ? ` niveau ${level}` : ''}`}>
            {o.canTake ? 'Prendre' : `${prof}${level ? ` niv. ${level}` : ''} requis`}
          </button>
        )}
        {o.mine && (o.status === 'proposed' || o.status === 'open' || late) && (
          <button className="btn btn-sm" onClick={() => void run(() => api.orderCancel(o.id))}>
            Annuler {late ? '(rembourse l’or)' : ''}
          </button>
        )}
      </div>
    </div>
  );
}

/** L'onglet Commandes du Marché : le panneau des commandes ouvertes, celles qu'on me passe, celles que j'ai passées. */
export function OrdersPanel() {
  const { flash } = useGame();
  const [v, setV] = useState<OrdersView | null>(null);
  const [posting, setPosting] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const load = () => {
    api.orders().then(setV).catch(() => {});
  };
  useEffect(() => {
    load();
    const id = window.setInterval(load, 20_000);
    return () => window.clearInterval(id);
  }, []);
  if (!v) return <p className="muted small">Chargement…</p>;
  const live = (o: OrderView) => o.status === 'open' || o.status === 'proposed' || o.status === 'accepted';
  const active = (xs: OrderView[]) => xs.filter(live);
  const past = (xs: OrderView[]) => xs.filter((o) => !live(o));
  const board = onlyMine ? v.board.filter((o) => o.canTake) : v.board;
  return (
    <div className="ord-panel">
      <section className="panel ord-col">
        <div className="card-head">
          <span className="eyebrow">Le panneau</span>
          <label className="small ord-open">
            <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />À mon niveau
          </label>
        </div>
        <div className="ord-list scroll">
          {board.length === 0 && (
            <p className="muted small">
              {v.board.length ? 'Aucune à votre niveau pour le moment.' : 'Aucune commande ouverte. Quand un joueur cherche un artisan sans savoir qui, sa commande arrive ici : le premier qui la prend la fait.'}
            </p>
          )}
          {board.map((o) => (
            <OrderCard key={o.id} o={o} onDone={load} />
          ))}
        </div>
      </section>
      <section className="panel ord-col">
        <div className="card-head">
          <span className="eyebrow">On me commande</span>
          <label className="small ord-open">
            <input
              type="checkbox"
              checked={v.open}
              onChange={(e) =>
                void api
                  .ordersOpen(e.target.checked)
                  .then((x) => (setV(x), flash(x.open ? 'Vous prenez les commandes.' : 'Vous ne prenez plus de commandes.')))
                  .catch(() => {})
              }
            />
            J’accepte les commandes
          </label>
        </div>
        <div className="ord-list scroll">
          {active(v.asArtisan).length === 0 && <p className="muted small">Personne ne vous a passé commande. Les joueurs vous en passent depuis votre page profil.</p>}
          {active(v.asArtisan).map((o) => (
            <OrderCard key={o.id} o={o} onDone={load} />
          ))}
          {past(v.asArtisan).length > 0 && <div className="eyebrow ord-past">Terminées</div>}
          {past(v.asArtisan).map((o) => (
            <OrderCard key={o.id} o={o} onDone={load} />
          ))}
        </div>
      </section>
      <section className="panel ord-col">
        <div className="card-head">
          <span className="eyebrow">Mes commandes</span>
          <button className="btn btn-sm" onClick={() => setPosting(true)}>
            + Commande ouverte
          </button>
        </div>
        <div className="ord-list scroll">
          {active(v.asClient).length === 0 && (
            <p className="muted small">
              Pour commander à quelqu’un, ouvrez sa page profil (cliquez sur son nom : dans le clan, la discussion, le bourg) et « Passer une commande ». Sans savoir à qui : « + Commande ouverte », pour votre clan ou tout le serveur.
            </p>
          )}
          {active(v.asClient).map((o) => (
            <OrderCard key={o.id} o={o} onDone={load} />
          ))}
          {past(v.asClient).length > 0 && <div className="eyebrow ord-past">Terminées</div>}
          {past(v.asClient).map((o) => (
            <OrderCard key={o.id} o={o} onDone={load} />
          ))}
        </div>
      </section>
      {posting && (
        <OrderModal
          inClan={v.inClan}
          onClose={() => {
            setPosting(false);
            load();
          }}
        />
      )}
    </div>
  );
}

/** Dans la salle d'un métier : les commandes acceptées qui le concernent, à fabriquer puis livrer. */
export function ProfessionOrders({ profession }: { profession: string }) {
  const [v, setV] = useState<OrdersView | null>(null);
  const [open, setOpen] = useState(false);
  const load = () => {
    api.orders().then(setV).catch(() => {});
  };
  useEffect(() => {
    load();
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, []);
  const mine = (v?.asArtisan ?? []).filter((o) => o.status === 'accepted' && o.profession === profession);
  // Les commandes ouvertes du panneau que je peux prendre dans ce métier.
  const board = (v?.board ?? []).filter((o) => o.canTake && o.profession === profession);
  if (!mine.length && !board.length) return null;
  const ready = mine.filter((o) => o.ready).length;
  return (
    <>
      <button className="sunken ord-room-chip" onClick={() => setOpen(true)}>
        <strong>
          {mine.length
            ? `${mine.length} commande${mine.length > 1 ? 's' : ''} à livrer`
            : `${board.length} commande${board.length > 1 ? 's' : ''} ouverte${board.length > 1 ? 's' : ''} à prendre`}
        </strong>
        <span className="small muted">
          {!mine.length
            ? 'sur le panneau : le premier qui la prend la fait'
            : ready
              ? `${ready} prête${ready > 1 ? 's' : ''} : livrez-la`
              : `la plus proche dans ${duration(Math.max(0, Math.min(...mine.map((o) => o.dueAt)) - Date.now()))}`}
          {mine.length && board.length ? ` · ${board.length} à prendre` : ''}
        </span>
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} className="ord-modal">
          <span className="eyebrow">Commandes pour ce métier</span>
          <div className="ord-list scroll">
            {mine.map((o) => (
              <OrderCard key={o.id} o={o} onDone={load} />
            ))}
            {board.length > 0 && <div className="eyebrow ord-past">Sur le panneau</div>}
            {board.map((o) => (
              <OrderCard key={o.id} o={o} onDone={load} />
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
