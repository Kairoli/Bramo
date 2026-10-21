import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MarketItemSummary, MarketOrderView, MyOrderView, RepairRequestView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { duration, num } from '../format';
import { ItemIcon } from '../components/ui';
import { Scene } from '../components/Scene';

type Tab = 'book' | 'craft' | 'mine' | 'npc';

/** Salle Marché : ordres d'achat et de vente entre joueurs, mes ordres, commandes PNJ du jour. */
export function MarketRoom() {
  const { content, state, act, marketItem } = useGame();
  const [tab, setTab] = useState<Tab>('book');
  const [selected, setSelected] = useState<string | null>(marketItem);
  const [query, setQuery] = useState('');
  const [summary, setSummary] = useState<MarketItemSummary[]>([]);
  const [book, setBook] = useState<MarketOrderView[]>([]);
  const [mine, setMine] = useState<MyOrderView[]>([]);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const { settings } = content;

  useEffect(() => {
    let live = true;
    const load = () => {
      api.marketSummary().then((s) => live && setSummary(s)).catch(() => {});
      api.myOrders().then((m) => live && setMine(m)).catch(() => {});
      if (selected) api.marketItem(selected).then((b) => live && setBook(b)).catch(() => {});
      else setBook([]);
    };
    load();
    const id = window.setInterval(load, 15_000);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, [tick, selected]);

  const run = async (call: () => ReturnType<typeof api.state>) => {
    const ok = await act(call);
    refresh();
    return ok;
  };

  // Les objets du marché : ceux qui ont des ordres, ceux que je possède.
  const rows = useMemo(() => {
    const ids = new Set([...summary.map((s) => s.itemId), ...Object.keys(state.inventory), ...(selected ? [selected] : [])]);
    const q = query.trim().toLowerCase();
    return [...ids]
      .map((id) => ({ item: content.items[id]!, s: summary.find((x) => x.itemId === id) }))
      .filter((x) => x.item && (!q || x.item.name.toLowerCase().includes(q)))
      .sort((a, b) => Number(!!b.s) - Number(!!a.s) || a.item.name.localeCompare(b.item.name));
  }, [summary, state.inventory, selected, query, content.items]);

  const openCount = mine.length;
  return (
    <main className="room market-room">
      <section className="panel band">
        <Scene ids={['market']} />
      </section>
      <section className="panel market-panel">
        <header className="market-head">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'book'} onClick={() => setTab('book')}>
              Marché
            </button>
            <button role="tab" aria-selected={tab === 'craft'} onClick={() => setTab('craft')}>
              Artisans
            </button>
            <button role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>
              Mes ordres{openCount ? ` · ${openCount}` : ''}
            </button>
            <button role="tab" aria-selected={tab === 'npc'} onClick={() => setTab('npc')}>
              Comptoir de la guilde
            </button>
          </div>
          <span className="muted small">
            Entre joueurs, taxe de {Math.round(settings.market.taxShare * 100)} % sur chaque vente · {num(state.gold)} or
          </span>
        </header>

        {tab === 'book' && (
          <div className="market-body">
            <div className="market-items">
              <input className="input" placeholder="Chercher un objet…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="scroll market-item-list">
                {rows.map(({ item, s }) => (
                  <button
                    key={item.id}
                    className={`market-item${selected === item.id ? ' selected' : ''}`}
                    onClick={() => setSelected(item.id)}
                  >
                    <ItemIcon item={item} small />
                    <span className="bag-name">{item.name}</span>
                    <span className="muted small">
                      {s?.bestSell != null ? `dès ${num(s.bestSell)} or` : s?.bestBuy != null ? `cherché ${num(s.bestBuy)} or` : ''}
                    </span>
                    {state.inventory[item.id] ? <span className="chip">×{num(state.inventory[item.id]!)}</span> : <span />}
                  </button>
                ))}
                {rows.length === 0 && <p className="muted">Aucune offre pour le moment : mettez en vente ce que vous produisez.</p>}
              </div>
            </div>
            {selected ? (
              <ItemMarket itemId={selected} book={book} run={run} />
            ) : (
              <div className="market-empty muted">Choisissez un objet pour voir les offres, ou pour passer un ordre.</div>
            )}
          </div>
        )}

        {tab === 'craft' && (
          <ArtisansTab
            summary={summary}
            run={run}
            openItem={(id) => {
              setSelected(id);
              setTab('book');
            }}
          />
        )}

        {tab === 'mine' && (
          <div className="scroll market-mine">
            {mine.length === 0 && <p className="muted">Aucun ordre ouvert.</p>}
            {mine.map((o) => (
              <div key={o.id} className="market-row">
                <ItemIcon item={content.items[o.itemId]} small />
                <span className="bag-name">{content.items[o.itemId]?.name}</span>
                <span className={o.side === 'sell' ? 'sell' : 'buy'}>{o.side === 'sell' ? 'Vente' : 'Achat'}</span>
                <span>
                  {num(o.qty)} × {num(o.price)} or
                </span>
                <span className="muted small">
                  {o.wear > 0 ? `exemplaire usé (${duration(o.wear)})` : ''}
                  {o.waitingGold ? ` +${num(o.waitingGold)} or à recevoir` : ''}
                  {o.waitingQty ? ` ${num(o.waitingQty)} à recevoir` : ''}
                </span>
                <button className="btn btn-sm" onClick={() => run(() => api.cancelOrder(o.id))}>
                  Annuler
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'npc' && (
          <div className="scroll market-npc">
            <p className="muted">
              Le PNJ n’achète pas à la demande : le Comptoir vous passe {settings.npcOrders.perDay} commandes par jour, dans des métiers tirés au hasard
              et adaptées à votre niveau dans chacun, à honorer une fois chacune. Le reste du commerce se fait entre joueurs.
            </p>
            {state.npcOrders.map((o) => {
              const ready = o.items.every((i) => (state.inventory[i.item] ?? 0) >= i.qty);
              return (
                <div key={o.id} className={`npc-order${o.done ? ' done' : ''}`}>
                  <div>
                    <strong>{o.client}</strong>
                    <span className="muted small"> · {content.professions.find((p) => p.id === o.profession)?.name} niv. {o.level}+</span>
                    <p className="muted">{o.text}</p>
                    <div className="npc-items">
                      {o.items.map((i) => (
                        <span key={i.item} className="chip" style={{ color: (state.inventory[i.item] ?? 0) >= i.qty ? 'var(--good)' : undefined }}>
                          {num(state.inventory[i.item] ?? 0)} / {num(i.qty)} {content.items[i.item]?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="npc-reward">
                    <strong style={{ color: 'var(--action)' }}>{num(o.gold)} or</strong>
                    <button className="btn btn-sm" disabled={o.done || !ready} onClick={() => run(() => api.npcComplete(o.id))}>
                      {o.done ? 'Honorée' : 'Remettre'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

/** Offres, demandes et formulaire d'ordre pour un objet. */
function ItemMarket({
  itemId,
  book,
  run,
}: {
  itemId: string;
  book: MarketOrderView[];
  run: (call: () => ReturnType<typeof api.state>) => Promise<boolean>;
}) {
  const { content, state } = useGame();
  const item = content.items[itemId]!;
  const durable = !!item.tool?.durabilityHours;
  const total = (item.tool?.durabilityHours ?? 0) * 3_600_000;
  const sells = book.filter((o) => o.side === 'sell');
  const buys = book.filter((o) => o.side === 'buy').sort((a, b) => b.price - a.price || a.id - b.id);
  const copies = state.durability[itemId]?.copies ?? [];
  const best = sells[0]?.price ?? buys[0]?.price;

  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(best ?? item.value);
  const [copy, setCopy] = useState(0);
  const [touched, setTouched] = useState(false);
  // Le prix proposé suit le meilleur prix du livre tant que le joueur n'y a pas touché.
  useEffect(() => {
    if (!touched && best) setPrice(best);
  }, [best, touched]);
  useEffect(() => {
    setTouched(false);
    setQty(1);
    setCopy(0);
    setPrice(best ?? item.value);
    setSide(durable || (state.inventory[itemId] ?? 0) > 0 ? 'sell' : 'buy');
    // On repart des prix du marché quand on change d'objet seulement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const { taxShare, maxPrice, maxQuantity } = content.settings.market;
  const gross = price * (durable ? 1 : qty);
  const net = gross - Math.ceil(gross * taxShare);
  const valid = price >= 1 && price <= maxPrice && (durable || (qty >= 1 && qty <= maxQuantity));
  const clamp = (n: number, max: number) => Math.max(1, Math.min(max, Math.floor(n) || 1));
  const wearLabel = (wear: number) => (total ? `reste ${duration(Math.max(0, total - wear))} sur ${duration(total)}` : '');

  return (
    <div className="market-item-view">
      <header className="market-item-head">
        <ItemIcon item={item} />
        <div>
          <h2>{item.name}</h2>
          <span className="muted small">Vous en avez {num(state.inventory[itemId] ?? 0)}</span>
        </div>
      </header>

      <div className="market-columns">
        <div>
          <span className="eyebrow">Offres</span>
          <div className="scroll market-list">
            {sells.length === 0 && <p className="muted small">Personne n’en vend.</p>}
            {sells.length === 0 && item.stallPrice && (
              <div className="market-row">
                <strong>{num(item.stallPrice)} or</strong>
                <span className="muted small">Étal de la guilde (neuf, tant que personne n’en vend)</span>
                <span />
                <button className="btn btn-sm" disabled={state.gold < item.stallPrice} onClick={() => run(() => api.stallBuy(itemId, 1))}>
                  Acheter
                </button>
              </div>
            )}
            {sells.map((o) => (
              <div key={o.id} className="market-row">
                <strong>{num(o.price)} or</strong>
                <span>
                  ×{num(o.qty)}
                  {durable && <span className="muted small"> · {wearLabel(o.wear)}</span>}
                </span>
                <span className="muted small">{o.mine ? 'vous' : o.ownerName}</span>
                {o.mine ? (
                  <span />
                ) : (
                  <span className="bag-actions">
                    <button className="btn btn-sm" disabled={state.gold < o.price} onClick={() => run(() => api.fillOrder(o.id, 1))}>
                      Acheter
                    </button>
                    {o.qty > 1 && (
                      <button
                        className="btn btn-sm"
                        disabled={state.gold < o.price * o.qty}
                        onClick={() => run(() => api.fillOrder(o.id, o.qty))}
                      >
                        Tout
                      </button>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div>
          <span className="eyebrow">Demandes</span>
          <div className="scroll market-list">
            {buys.length === 0 && <p className="muted small">Personne n’en cherche.</p>}
            {buys.map((o) => (
              <div key={o.id} className="market-row">
                <strong>{num(o.price)} or</strong>
                <span>×{num(o.qty)}</span>
                <span className="muted small">{o.mine ? 'vous' : o.ownerName}</span>
                <span />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="market-form sunken">
        <div className="tabs tabs-sm" role="tablist">
          <button role="tab" aria-selected={side === 'buy'} disabled={durable} onClick={() => setSide('buy')}>
            Acheter
          </button>
          <button role="tab" aria-selected={side === 'sell'} onClick={() => setSide('sell')}>
            Vendre
          </button>
        </div>
        {durable && side === 'sell' && (
          <label className="field">
            <span className="muted small">Exemplaire</span>
            <select className="input" value={copy} onChange={(e) => setCopy(Number(e.target.value))}>
              {copies.map((left, i) => (
                <option key={i} value={i}>
                  {left > 0 ? `reste ${duration(left)}` : 'usé'}
                </option>
              ))}
            </select>
          </label>
        )}
        {!durable && (
          <label className="field">
            <span className="muted small">Quantité</span>
            <input className="input" type="number" min={1} value={qty} onChange={(e) => setQty(clamp(Number(e.target.value), maxQuantity))} />
          </label>
        )}
        <label className="field">
          <span className="muted small">Prix unitaire (or)</span>
          <input className="input" type="number" min={1} value={price} onChange={(e) => {
              setTouched(true);
              setPrice(clamp(Number(e.target.value), maxPrice));
            }} />
        </label>
        <div className="market-total">
          {side === 'sell' ? (
            <span>
              Vous recevrez <strong style={{ color: 'var(--action)' }}>{num(net)} or</strong> <span className="muted small">après taxe</span>
            </span>
          ) : (
            <span>
              Jusqu’à <strong style={{ color: 'var(--action)' }}>{num(gross)} or</strong> <span className="muted small">mis de côté</span>
            </span>
          )}
        </div>
        <button
          className="btn btn-primary"
          disabled={!valid || (side === 'buy' && (durable || state.gold < gross)) || (side === 'sell' && (durable ? copies.length === 0 : (state.inventory[itemId] ?? 0) < qty))}
          onClick={() => run(() => api.placeOrder({ side, itemId, qty: durable ? 1 : qty, price, ...(durable && side === 'sell' ? { copy } : {}) }))}
        >
          Placer l’ordre
        </button>
      </div>
      {durable && <p className="muted small">Les objets qui s’usent s’achètent à l’étal : l’état de chaque exemplaire compte.</p>}
    </div>
  );
}

/** Artisans : commandes à servir (ordres d'achat d'objets fabriqués, avec une prime d'XP) et réparations d'outils. */
function ArtisansTab({
  summary,
  run,
  openItem,
}: {
  summary: MarketItemSummary[];
  run: (call: () => ReturnType<typeof api.state>) => Promise<boolean>;
  openItem: (itemId: string) => void;
}) {
  const { content, state } = useGame();
  const [requests, setRequests] = useState<RepairRequestView[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    api.openRepairs().then(setRequests).catch(() => {});
  }, [tick, state.gold, state.serverTime]);
  const act = async (call: () => ReturnType<typeof api.state>) => {
    await run(call);
    setTick((t) => t + 1);
  };

  const { commissions } = content.settings;
  const craftable = (id: string) =>
    Object.values(content.recipes).some((r) => !r.trial && r.inputs.length > 0 && r.outputs.length === 1 && r.outputs[0]!.item === id);
  const orders = summary.filter((s) => s.bestBuy !== null && craftable(s.itemId));
  // Outils réparables par un artisan dont au moins un exemplaire est entamé.
  const mineTools = Object.entries(state.durability).filter(([id, d]) => content.items[id]?.repair && d.copies.some((left) => left < d.totalMs));
  const [toolId, setToolId] = useState('');
  const [copy, setCopy] = useState(0);
  const [fee, setFee] = useState(30);
  const tool = mineTools.find(([id]) => id === toolId) ?? mineTools[0];

  return (
    <div className="market-craft scroll">
      <div>
        <span className="eyebrow">Commandes à servir</span>
        <p className="muted small">
          Des joueurs cherchent ces objets fabriqués. Livrer un ordre d’achat d’un objet que vous savez fabriquer rapporte une prime : +
          {Math.round(commissions.primeShare * 100)} % de l’XP de la recette, jusqu’à {commissions.primeUnitsPerDay} unités par jour.
        </p>
        {orders.length === 0 && <p className="muted small">Aucune commande pour le moment.</p>}
        {orders.map((s) => (
          <div key={s.itemId} className="market-row">
            <ItemIcon item={content.items[s.itemId]} small />
            <span className="bag-name">{content.items[s.itemId]?.name}</span>
            <span>
              jusqu’à {num(s.bestBuy!)} or · ×{num(s.buyQty)}
            </span>
            <button className="btn btn-sm" onClick={() => openItem(s.itemId)}>
              Voir
            </button>
          </div>
        ))}
      </div>

      <div>
        <span className="eyebrow">Réparations demandées</span>
        <p className="muted small">
          Réparez l’outil d’un autre joueur avec vos matériaux : vous touchez sa rémunération (moins la taxe) et un peu d’XP.
        </p>
        {requests.length === 0 && <p className="muted small">Aucune demande ouverte.</p>}
        {requests.map((r) => {
          const item = content.items[r.itemId];
          const mats = item?.repair?.materials.map((m) => `${m.qty} × ${content.items[m.item]?.name ?? m.item}`).join(', ');
          return (
            <div key={r.id} className="market-row">
              <ItemIcon item={item} small />
              <span className="bag-name">
                {item?.name} <span className="muted small">· usé de {duration(r.wear)}</span>
              </span>
              <span>
                {num(r.fee)} or <span className="muted small">· matériaux : {mats}</span>
              </span>
              {r.mine ? (
                <button className="btn btn-sm" onClick={() => act(() => api.cancelRepair(r.id))}>
                  Reprendre
                </button>
              ) : (
                <button className="btn btn-sm" onClick={() => act(() => api.takeRepair(r.id))}>
                  Réparer
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="market-form sunken">
        <span className="eyebrow" style={{ width: '100%' }}>
          Confier un outil à un artisan
        </span>
        {mineTools.length === 0 ? (
          <span className="muted small">Aucun de vos outils n’est usé.</span>
        ) : (
          <>
            <label className="field">
              <span className="muted small">Outil</span>
              <select
                className="input"
                value={tool?.[0]}
                onChange={(e) => {
                  setToolId(e.target.value);
                  setCopy(0);
                }}
              >
                {mineTools.map(([id]) => (
                  <option key={id} value={id}>
                    {content.items[id]?.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="muted small">Exemplaire</span>
              <select className="input" value={copy} onChange={(e) => setCopy(Number(e.target.value))}>
                {(tool?.[1].copies ?? []).map((left, i) =>
                  left < (tool?.[1].totalMs ?? 0) ? (
                    <option key={i} value={i}>
                      {left > 0 ? `reste ${duration(left)}` : 'usé'}
                    </option>
                  ) : null,
                )}
              </select>
            </label>
            <label className="field">
              <span className="muted small">Rémunération (or)</span>
              <input
                className="input"
                type="number"
                min={1}
                value={fee}
                onChange={(e) => setFee(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
              />
            </label>
            <button className="btn btn-primary" disabled={!tool || state.gold < fee} onClick={() => tool && act(() => api.requestRepair(tool[0], copy, fee))}>
              Demander
            </button>
            <p className="muted small" style={{ width: '100%' }}>
              L’outil et l’or sont mis de côté ; réparé, il vous revient comme neuf à votre prochain passage. Le PNJ répare aussi, contre de l’or, depuis votre sac.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
