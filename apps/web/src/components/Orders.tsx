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

/** Passer une commande à un artisan : quoi, combien, matériaux fournis ou non, délai, prix. */
export function OrderModal({ artisanId, onClose }: { artisanId: number; onClose: () => void }) {
  const { content, state, act, flash } = useGame();
  const [cat, setCat] = useState<OrderCatalogView | null>(null);
  const [query, setQuery] = useState('');
  const [pick, setPick] = useState<OrderTarget | null>(null);
  const [qty, setQty] = useState(1);
  const [supply, setSupply] = useState(false);
  const [quote, setQuote] = useState<(OrderQuote & { supplied: { item: string; qty: number }[] }) | null>(null);
  const [delay, setDelay] = useState<'rush' | 'normal' | 'relaxed'>('normal');
  const [price, setPrice] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    api.orderCatalog(artisanId).then(setCat).catch(() => setCat(null));
  }, [artisanId]);
  useEffect(() => {
    if (!pick) return;
    const id = window.setTimeout(() => {
      api
        .orderQuote({ artisanId, kind: pick.kind, target: pick.id, qty, supply })
        .then((q) => {
          setQuote(q);
          setPrice(null);
        })
        .catch(() => setQuote(null));
    }, 250);
    return () => window.clearTimeout(id);
  }, [artisanId, pick, qty, supply]);
  const prof = (id: string) => content.professions.find((p) => p.id === id)?.name ?? id;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (cat?.targets ?? []).filter((t) => !q || t.name.toLowerCase().includes(q) || prof(t.profession).toLowerCase().includes(q)).slice(0, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, query]);
  const d = quote?.delays.find((x) => x.id === delay);
  const value = price ?? d?.advised ?? 0;
  const tax = Math.round(value * content.settings.orders.taxShare);
  const send = async () => {
    if (!pick || !d) return;
    const ok = await act(() => api.orderCreate({ artisanId, kind: pick.kind, target: pick.id, qty, supply, price: value, delay, message: message.trim() || undefined }));
    if (ok) {
      flash(`Commande envoyée à ${cat?.artisan.name}.`);
      onClose();
    }
  };

  return (
    <Modal onClose={onClose} className="ord-modal">
      <div className="ord-head">
        {cat && <Avatar id={cat.artisan.id} version={cat.artisan.avatar} name={cat.artisan.name} classId={cat.artisan.classId} size={44} />}
        <div>
          <span className="eyebrow">Passer une commande</span>
          <h2>{cat ? cat.artisan.name : '…'}</h2>
        </div>
      </div>
      {cat && !cat.open ? (
        <p className="muted">Ce joueur ne prend pas de commandes pour le moment.</p>
      ) : !pick ? (
        <>
          <input className="input" placeholder="Chercher un objet ou un métier…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
          <div className="ord-targets scroll">
            {cat === null && <p className="muted small">Chargement…</p>}
            {cat && shown.length === 0 && <p className="muted small">Rien à son niveau qui corresponde.</p>}
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
          {quote && <p className="muted small">Temps de fabrication estimé : {duration(quote.workSec * 1000)} de travail pour lui.</p>}
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
              Il touchera <strong>{num(value - tax)} or</strong> à la livraison (taxe {Math.round(content.settings.orders.taxShare * 100)} %). S’il refuse ou ne répond pas en 24 h, tout vous revient.
            </span>
          </div>
          <div className="ord-actions">
            <button className="btn btn-primary" disabled={!d || value > (d?.cap ?? 0) || value > state.gold || (value === 0 && !(supply && quote?.supplied.length))} onClick={() => void send()}>
              Envoyer la commande
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const STATUS: Record<OrderView['status'], { label: string; tone: string }> = {
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
            {o.mine ? 'pour vous, par ' : 'pour '}
            <PlayerName id={other.id}>{other.name}</PlayerName>
          </span>
        </span>
        <span className="ord-status">{late ? 'En retard' : STATUS[o.status].label}</span>
      </div>
      <div className="ord-card-body small">
        <span>
          <strong>{num(o.price)} or</strong>
          {!o.mine && o.status !== 'delivered' ? ` (vous toucherez ${num(o.net)})` : ''}
          {o.materials.length ? ` · matériaux fournis : ${o.materials.map((m) => `${num(m.qty)} ${content.items[m.item]?.name ?? m.item}`).join(', ')}` : ''}
        </span>
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
        {o.mine && (o.status === 'proposed' || late) && (
          <button className="btn btn-sm" onClick={() => void run(() => api.orderCancel(o.id))}>
            Annuler {late ? '(rembourse l’or)' : ''}
          </button>
        )}
      </div>
    </div>
  );
}

/** L'onglet Commandes du Marché : celles qu'on me passe, celles que j'ai passées. */
export function OrdersPanel() {
  const { flash } = useGame();
  const [v, setV] = useState<OrdersView | null>(null);
  const load = () => {
    api.orders().then(setV).catch(() => {});
  };
  useEffect(() => {
    load();
    const id = window.setInterval(load, 20_000);
    return () => window.clearInterval(id);
  }, []);
  if (!v) return <p className="muted small">Chargement…</p>;
  const active = (xs: OrderView[]) => xs.filter((o) => o.status === 'proposed' || o.status === 'accepted');
  const past = (xs: OrderView[]) => xs.filter((o) => o.status !== 'proposed' && o.status !== 'accepted');
  return (
    <div className="ord-panel">
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
        </div>
        <div className="ord-list scroll">
          {active(v.asClient).length === 0 && <p className="muted small">Pour commander, ouvrez la page profil d’un artisan (cliquez sur son nom : dans le clan, la discussion, le bourg) et « Passer une commande ».</p>}
          {active(v.asClient).map((o) => (
            <OrderCard key={o.id} o={o} onDone={load} />
          ))}
          {past(v.asClient).length > 0 && <div className="eyebrow ord-past">Terminées</div>}
          {past(v.asClient).map((o) => (
            <OrderCard key={o.id} o={o} onDone={load} />
          ))}
        </div>
      </section>
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
  if (!mine.length) return null;
  const ready = mine.filter((o) => o.ready).length;
  return (
    <>
      <button className="sunken ord-room-chip" onClick={() => setOpen(true)}>
        <strong>
          {mine.length} commande{mine.length > 1 ? 's' : ''} à livrer
        </strong>
        <span className="small muted">{ready ? `${ready} prête${ready > 1 ? 's' : ''} : livrez-la` : `la plus proche dans ${duration(Math.max(0, Math.min(...mine.map((o) => o.dueAt)) - Date.now()))}`}</span>
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} className="ord-modal">
          <span className="eyebrow">Commandes pour ce métier</span>
          <div className="ord-list scroll">
            {mine.map((o) => (
              <OrderCard key={o.id} o={o} onDone={load} />
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
