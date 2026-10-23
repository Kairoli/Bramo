import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import type { GearListingView, MarketItemSummary, MarketOrderView, MyOrderView, RepairRequestView } from '@bramo/shared';
import { GearIcon } from '../components/GearIcon';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { duration, num } from '../format';
import { ItemIcon } from '../components/ui';
import { Scene } from '../components/Scene';

type Tab = 'book' | 'gear' | 'mine' | 'craft' | 'npc';
type Run = (call: () => ReturnType<typeof api.state>) => Promise<boolean>;

/** Rayons du marché : des catégories d'objets regroupées comme sur les étals. */
const SHELVES: { id: string; name: string; cats: string[] }[] = [
  { id: 'all', name: 'Tout', cats: [] },
  { id: 'mine', name: 'Mon sac', cats: [] },
  { id: 'ores', name: 'Minerais et métaux', cats: ['ore', 'stone', 'gem', 'bar'] },
  { id: 'wood', name: 'Bois', cats: ['log', 'plank', 'handle', 'archery'] },
  { id: 'nature', name: 'Herbes, poissons, cultures', cats: ['herb', 'fish', 'crop', 'grain', 'fiber', 'dye'] },
  { id: 'hunt', name: 'Chasse et cuir', cats: ['hide', 'meat', 'feather', 'leather'] },
  { id: 'cloth', name: 'Fils, toiles, vêtements', cats: ['thread', 'cloth', 'garment'] },
  { id: 'arcane', name: 'Potions et runes', cats: ['vial', 'potion', 'reagent', 'rune', 'scroll', 'core'] },
  { id: 'jewels', name: 'Bijoux', cats: ['jewelry'] },
  { id: 'works', name: 'Mécanismes et chantier', cats: ['mechanism', 'powder', 'device', 'element'] },
  { id: 'food', name: 'Repas', cats: ['meal'] },
  { id: 'tools', name: 'Outils et pièces', cats: ['tool', 'tool_part', 'hardware', 'weapon'] },
  { id: 'finds', name: 'Cartes et trouvailles', cats: ['map', 'curio', 'vestige'] },
];

/**
 * Salle Marché, refaite pour être lisible d'un coup d'œil (demande de Louis du 23 octobre) : en haut l'étal (or, ventes à
 * récupérer, ordres ouverts) et les quatre espaces ; au marché, des rayons et des cartes d'objets avec leur prix, puis la
 * fiche de l'objet : acheter ou vendre tout de suite au meilleur prix, ou fixer son prix et attendre.
 */
export function MarketRoom() {
  const { content, state, act, marketItem } = useGame();
  const [tab, setTab] = useState<Tab>('book');
  const [selected, setSelected] = useState<string | null>(marketItem);
  const [shelf, setShelf] = useState(marketItem ? 'all' : 'mine');
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

  const run: Run = async (call) => {
    const ok = await act(call);
    refresh();
    return ok;
  };

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sh = SHELVES.find((s) => s.id === shelf)!;
    return Object.values(content.items)
      .filter((it) => (sh.id === 'mine' ? (state.inventory[it.id] ?? 0) > 0 : sh.id === 'all' || sh.cats.includes(it.category)))
      .filter((it) => !q || it.name.toLowerCase().includes(q))
      .map((item) => ({ item, s: summary.find((x) => x.itemId === item.id) }))
      .sort((a, b) => Number(!!b.s) - Number(!!a.s) || a.item.name.localeCompare(b.item.name));
  }, [content.items, shelf, query, summary, state.inventory]);

  const waiting = mine.reduce((s, o) => s + o.waitingGold, 0);
  const doneNpc = state.npcOrders.filter((o) => o.done).length;
  return (
    <main className="room market-room2">
      <section className="panel band market-band">
        <Scene ids={['market']} />
        <div className="market-hud">
          <div className="market-title">
            <span className="eyebrow">Le marché du bourg</span>
            <h1>Acheter, vendre, commander</h1>
            <span className="muted small">Entre joueurs · taxe de {Math.round(settings.market.taxShare * 100)} % sur chaque vente</span>
          </div>
          <div className="market-stats">
            <MarketStat value={`${num(state.gold)} or`} label="dans votre bourse" tone="var(--action)" />
            <MarketStat value={`${num(mine.length)}`} label="ordres ouverts" />
            <MarketStat value={waiting ? `+${num(waiting)} or` : '—'} label="à récupérer" tone="var(--good)" />
          </div>
        </div>
        <nav className="market-tabs" role="tablist">
          {(
            [
              ['book', 'Acheter et vendre', 'M3 9h18l-2 11H5zM8 9V6a4 4 0 0 1 8 0v3'],
              ['gear', 'Vitrine', 'M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z'],
              ['mine', `Mes ordres${mine.length ? ` · ${mine.length}` : ''}`, 'M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4'],
              ['craft', 'Artisans', 'M14 6l4 4M12 8l-8 8 2 2 8-8M13 4l7 7-2 2-7-7z'],
              ['npc', `Comptoir · ${doneNpc}/${state.npcOrders.length}`, 'M4 20V10l8-6 8 6v10M9 20v-6h6v6'],
            ] as [Tab, string, string][]
          ).map(([id, label, d]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d={d} />
              </svg>
              {label}
            </button>
          ))}
        </nav>
      </section>

      {tab === 'book' && (
        <div className="market-hub">
          <section className="panel market-shelves">
            <div className="market-search">
              <input className="input" placeholder="Chercher un objet…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="shelf-chips">
              {SHELVES.map((s) => (
                <button key={s.id} className={`shelf-chip${shelf === s.id ? ' on' : ''}`} onClick={() => setShelf(s.id)}>
                  {s.name}
                </button>
              ))}
            </div>
            <div className="market-cards scroll">
              {cards.length === 0 && <p className="muted small">Rien sur ce rayon pour le moment.</p>}
              {cards.map(({ item, s }) => (
                <button key={item.id} className={`market-card${selected === item.id ? ' selected' : ''}`} onClick={() => setSelected(item.id)}>
                  <ItemIcon item={item} />
                  <span className="market-card-name">{item.name}</span>
                  <span className="market-card-prices">
                    {s?.bestSell != null ? <span className="p-sell">{num(s.bestSell)} or</span> : <span className="muted">—</span>}
                    {s?.bestBuy != null && <span className="p-buy">cherché {num(s.bestBuy)}</span>}
                  </span>
                  {(state.inventory[item.id] ?? 0) > 0 && <span className="market-card-own">×{num(state.inventory[item.id]!)}</span>}
                </button>
              ))}
            </div>
          </section>
          <section className="panel market-detail">
            {selected ? <ItemMarket itemId={selected} book={book} run={run} /> : <div className="market-empty muted">Choisissez un objet : vous verrez son prix, et vous pourrez l’acheter ou le vendre en un clic.</div>}
          </section>
        </div>
      )}

      {tab === 'mine' && (
        <section className="panel market-page scroll">
          <h2>Mes ordres</h2>
          <p className="muted small">Ce que vous avez mis en vente ou demandé. L’or des ventes et les achats arrivent à votre prochain passage.</p>
          {mine.length === 0 && <p className="muted">Aucun ordre ouvert.</p>}
          <div className="order-cards">
            {mine.map((o) => (
              <div key={o.id} className={`order-card ${o.side}`}>
                <ItemIcon item={content.items[o.itemId]} />
                <div className="order-card-text">
                  <span className={`order-side ${o.side}`}>{o.side === 'sell' ? 'Je vends' : 'Je cherche'}</span>
                  <strong>
                    {num(o.qty)} × {content.items[o.itemId]?.name}
                  </strong>
                  <span className="muted small">
                    à {num(o.price)} or l’unité
                    {o.wear > 0 ? ` · usé de ${duration(o.wear)}` : ''}
                  </span>
                  {(o.waitingGold > 0 || o.waitingQty > 0) && (
                    <span className="order-waiting">
                      {o.waitingGold ? `+${num(o.waitingGold)} or` : ''}
                      {o.waitingQty ? ` ${num(o.waitingQty)} reçus` : ''} à récupérer
                    </span>
                  )}
                </div>
                <button className="btn btn-sm" onClick={() => run(() => api.cancelOrder(o.id))}>
                  Annuler
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'gear' && <GearShowcase />}

      {tab === 'craft' && (
        <section className="panel market-page">
          <ArtisansTab
            summary={summary}
            run={run}
            openItem={(id) => {
              setSelected(id);
              setTab('book');
            }}
          />
        </section>
      )}

      {tab === 'npc' && (
        <section className="panel market-page scroll">
          <h2>Comptoir de la guilde</h2>
          <p className="muted small">
            {settings.npcOrders.perDay} commandes par jour, dans des métiers tirés au hasard et à votre niveau. Chacune ne s’honore qu’une fois ; le reste du commerce se fait entre joueurs.
          </p>
          <div className="npc-cards">
            {state.npcOrders.map((o) => {
              const ready = o.items.every((i) => (state.inventory[i.item] ?? 0) >= i.qty);
              return (
                <div key={o.id} className={`npc-card${o.done ? ' done' : ready ? ' ready' : ''}`}>
                  <div className="npc-card-head">
                    <strong>{o.client}</strong>
                    <span className="muted small">
                      {content.professions.find((p) => p.id === o.profession)?.name} niv. {o.level}+
                    </span>
                  </div>
                  <p className="muted small">{o.text}</p>
                  <div className="npc-card-items">
                    {o.items.map((i) => {
                      const have = state.inventory[i.item] ?? 0;
                      return (
                        <span key={i.item} className={`npc-need${have >= i.qty ? ' ok' : ''}`}>
                          <ItemIcon item={content.items[i.item]} small />
                          {num(Math.min(have, i.qty))}/{num(i.qty)}
                        </span>
                      );
                    })}
                  </div>
                  <div className="npc-card-foot">
                    <strong className="npc-gold">{num(o.gold)} or</strong>
                    <button className="btn btn-sm btn-primary" disabled={o.done || !ready} onClick={() => run(() => api.npcComplete(o.id))}>
                      {o.done ? 'Honorée' : ready ? 'Remettre' : 'Il manque des objets'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

function MarketStat({ value, label, tone }: { value: string; label: string; tone?: string }) {
  return (
    <div className="market-stat">
      <strong style={{ color: tone }}>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

const CATEGORY_NAME: Record<string, string> = {
  ore: 'Minerai',
  stone: 'Pierre',
  gem: 'Gemme',
  bar: 'Lingot',
  log: 'Bois',
  plank: 'Planche',
  handle: 'Manche',
  archery: 'Archerie',
  herb: 'Herbe',
  fish: 'Poisson',
  meal: 'Repas',
  tool: 'Outil',
  tool_part: 'Pièce d’outil',
  hardware: 'Quincaillerie',
  weapon: 'Arme',
  vestige: 'Vestige de combat',
  hide: 'Peau',
  meat: 'Viande',
  feather: 'Plumes',
  crop: 'Récolte',
  grain: 'Grain et farine',
  fiber: 'Fibre',
  dye: 'Teinture',
  leather: 'Cuir',
  thread: 'Fil',
  cloth: 'Toile',
  garment: 'Vêtement',
  vial: 'Verrerie',
  potion: 'Potion',
  reagent: 'Réactif',
  jewelry: 'Bijou',
  rune: 'Rune',
  scroll: 'Parchemin',
  core: 'Noyau',
  mechanism: 'Mécanisme',
  powder: 'Poudre',
  device: 'Engin',
  element: 'Élément de construction',
  map: 'Carte',
  curio: 'Curiosité',
};

/**
 * Fiche d'un objet au marché : ce qu'il coûte maintenant, et deux façons de faire. Tout de suite : acheter la meilleure
 * offre ou vendre à la meilleure demande. Ou fixer son prix : l'ordre attend un acheteur ou un vendeur.
 */
function ItemMarket({ itemId, book, run }: { itemId: string; book: MarketOrderView[]; run: Run }) {
  const { content, state } = useGame();
  const item = content.items[itemId]!;
  const durable = !!item.tool?.durabilityHours;
  const total = (item.tool?.durabilityHours ?? 0) * 3_600_000;
  const sells = book.filter((o) => o.side === 'sell');
  const buys = book.filter((o) => o.side === 'buy').sort((a, b) => b.price - a.price || a.id - b.id);
  const copies = state.durability[itemId]?.copies ?? [];
  const have = state.inventory[itemId] ?? 0;
  const bestSell = sells.find((o) => !o.mine);
  const bestBuy = buys.find((o) => !o.mine);

  const [side, setSide] = useState<'buy' | 'sell'>('sell');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(item.value);
  const [copy, setCopy] = useState(0);
  const [showBook, setShowBook] = useState(false);
  useEffect(() => {
    setQty(1);
    setCopy(0);
    const s = durable || have > 0 ? 'sell' : 'buy';
    setSide(s);
    setPrice((s === 'sell' ? (sells[0]?.price ?? buys[0]?.price) : (buys[0]?.price ?? sells[0]?.price)) ?? item.value);
    // On repart des prix du marché quand on change d'objet seulement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const { taxShare, maxPrice, maxQuantity } = content.settings.market;
  const gross = price * (durable ? 1 : qty);
  const net = gross - Math.ceil(gross * taxShare);
  const clamp = (n: number, max: number) => Math.max(1, Math.min(max, Math.floor(n) || 1));
  const maxQty = side === 'sell' ? Math.max(1, Math.min(maxQuantity, have)) : maxQuantity;
  const valid = price >= 1 && price <= maxPrice && (durable || (qty >= 1 && qty <= maxQuantity));
  const canPlace = valid && (side === 'buy' ? !durable && state.gold >= gross : durable ? copies.length > 0 : have >= qty);
  const wearLabel = (wear: number) => (total ? `reste ${duration(Math.max(0, total - wear))}` : '');
  const sellNowQty = bestBuy ? Math.min(have, bestBuy.qty) : 0;

  return (
    <div className="item-market">
      <header className="item-market-head">
        <ItemIcon item={item} />
        <div>
          <span className="eyebrow">{CATEGORY_NAME[item.category] ?? item.category}</span>
          <h2>{item.name}</h2>
          <span className="muted small">
            Vous en avez <strong>{num(have)}</strong> · valeur de référence {num(item.value)} or
          </span>
        </div>
      </header>

      <div className="quick-trade">
        <div className="quick-box buy">
          <span className="eyebrow">Acheter maintenant</span>
          {bestSell ? (
            <>
              <strong>{num(bestSell.price)} or</strong>
              <span className="muted small">
                {num(sells.filter((o) => !o.mine).reduce((s, o) => s + o.qty, 0))} en vente{durable ? ` · ${wearLabel(bestSell.wear)}` : ''}
              </span>
              <button className="btn btn-primary" disabled={state.gold < bestSell.price} onClick={() => run(() => api.fillOrder(bestSell.id, 1))}>
                Acheter 1
              </button>
            </>
          ) : item.stallPrice ? (
            <>
              <strong>{num(item.stallPrice)} or</strong>
              <span className="muted small">à l’étal de la guilde (neuf)</span>
              <button className="btn btn-primary" disabled={state.gold < item.stallPrice} onClick={() => run(() => api.stallBuy(itemId, 1))}>
                Acheter 1
              </button>
            </>
          ) : (
            <span className="muted small">Personne n’en vend. Fixez votre prix ci-dessous : votre demande attendra un vendeur.</span>
          )}
        </div>
        <div className="quick-box sell">
          <span className="eyebrow">Vendre maintenant</span>
          {bestBuy && !durable ? (
            <>
              <strong>{num(bestBuy.price)} or</strong>
              <span className="muted small">demandé ×{num(bestBuy.qty)} · vous touchez {num(bestBuy.price - Math.ceil(bestBuy.price * taxShare))} or l’unité</span>
              <button className="btn btn-primary" disabled={sellNowQty < 1} onClick={() => run(() => api.placeOrder({ side: 'sell', itemId, qty: sellNowQty, price: bestBuy.price }))}>
                {sellNowQty > 0 ? `Vendre ${num(sellNowQty)}` : 'Vous n’en avez pas'}
              </button>
            </>
          ) : (
            <span className="muted small">Personne n’en cherche. Mettez-le en vente ci-dessous : il partira dès qu’un acheteur passe.</span>
          )}
        </div>
      </div>

      <div className="order-builder">
        <div className="order-builder-head">
          <span className="eyebrow">Ou fixer votre prix</span>
          <div className="seg-toggle">
            <button aria-pressed={side === 'buy'} disabled={durable} onClick={() => setSide('buy')}>
              Je cherche
            </button>
            <button aria-pressed={side === 'sell'} onClick={() => setSide('sell')}>
              Je vends
            </button>
          </div>
        </div>
        {durable && side === 'sell' ? (
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
        ) : (
          !durable && (
            <Stepper label="Quantité" value={qty} onChange={(v) => setQty(clamp(v, maxQuantity))} presets={[1, 10, 100, ...(side === 'sell' && have > 0 ? [maxQty] : [])]} presetLabel={(v) => (side === 'sell' && v === maxQty && have > 0 ? 'Tout' : String(v))} />
          )
        )}
        <Stepper label="Prix de l’unité (or)" value={price} onChange={(v) => setPrice(clamp(v, maxPrice))} presets={[...new Set([bestSell?.price, bestBuy?.price, item.value].filter((x): x is number => !!x))]} presetLabel={(v) => (v === bestSell?.price ? `${v} · offre` : v === bestBuy?.price ? `${v} · demande` : `${v} · réf.`)} />
        <p className="order-sentence">
          {side === 'sell' ? (
            <>
              Je vends <strong>{durable ? 1 : num(qty)} × {item.name}</strong> à <strong>{num(price)} or</strong> : je recevrai <strong className="gold">{num(net)} or</strong> après la taxe.
            </>
          ) : (
            <>
              Je cherche <strong>{num(qty)} × {item.name}</strong> à <strong>{num(price)} or</strong> : <strong className="gold">{num(gross)} or</strong> sont mis de côté en attendant.
            </>
          )}
        </p>
        <button className="btn btn-primary order-go" disabled={!canPlace} onClick={() => run(() => api.placeOrder({ side, itemId, qty: durable ? 1 : qty, price, ...(durable && side === 'sell' ? { copy } : {}) }))}>
          {side === 'sell' ? 'Mettre en vente' : 'Passer la demande'}
        </button>
      </div>

      <button className="link small" onClick={() => setShowBook(!showBook)}>
        {showBook ? 'Masquer' : 'Voir'} toutes les offres ({sells.length}) et demandes ({buys.length})
      </button>
      {showBook && (
        <div className="book-columns">
          <BookList title="Offres (on vend)" orders={sells} tone="sell" wearLabel={durable ? wearLabel : undefined} />
          <BookList title="Demandes (on cherche)" orders={buys} tone="buy" />
        </div>
      )}
    </div>
  );
}

function Stepper({ label, value, onChange, presets, presetLabel }: { label: string; value: number; onChange: (v: number) => void; presets: number[]; presetLabel: (v: number) => ReactNode }) {
  return (
    <div className="stepper">
      <span className="muted small">{label}</span>
      <div className="stepper-row">
        <button className="mini" onClick={() => onChange(value - 1)} aria-label="Moins">
          −
        </button>
        <input className="input" type="number" min={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <button className="mini" onClick={() => onChange(value + 1)} aria-label="Plus">
          +
        </button>
        {presets.map((v) => (
          <button key={v} className={`chip stepper-preset${v === value ? ' on' : ''}`} onClick={() => onChange(v)}>
            {presetLabel(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

function BookList({ title, orders, tone, wearLabel }: { title: string; orders: MarketOrderView[]; tone: 'sell' | 'buy'; wearLabel?: (w: number) => string }) {
  return (
    <div className="book-list">
      <span className="eyebrow">{title}</span>
      {orders.length === 0 && <p className="muted small">Aucune.</p>}
      {orders.map((o) => (
        <div key={o.id} className={`book-row ${tone}`}>
          <strong>{num(o.price)} or</strong>
          <span>×{num(o.qty)}</span>
          <span className="muted small">
            {o.mine ? 'vous' : o.ownerName}
            {wearLabel ? ` · ${wearLabel(o.wear)}` : ''}
          </span>
        </div>
      ))}
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

const RARITY_NAME: Record<string, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };

/**
 * La vitrine : l'équipement que les joueurs vendent (trouvé ou fabriqué), filtré par emplacement et par classe, le moins
 * cher d'abord. On l'achète tout de suite ; on vend ses pièces depuis leur fiche, dans la salle Personnage.
 */
function GearShowcase() {
  const { content, state, act } = useGame();
  const [slot, setSlot] = useState('');
  const [cls, setCls] = useState(state.classId ?? '');
  const [list, setList] = useState<GearListingView[] | null>(null);
  const load = useCallback(() => {
    api
      .gearMarket({ slot: slot || undefined, classId: cls || undefined })
      .then(setList)
      .catch(() => setList([]));
  }, [slot, cls]);
  useEffect(load, [load]);
  return (
    <section className="panel showcase">
      <header className="showcase-head">
        <div>
          <h2>Vitrine de l’équipement</h2>
          <p className="muted small">Pièces trouvées ou fabriquées par les autres joueurs. Pour vendre une des vôtres : sa fiche, dans la salle Personnage.</p>
        </div>
        <div className="workshop-filters">
          <select className="input" value={slot} onChange={(e) => setSlot(e.target.value)}>
            <option value="">Tous les emplacements</option>
            {Object.values(content.gearSlots).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select className="input" value={cls} onChange={(e) => setCls(e.target.value)}>
            <option value="">Toutes les classes</option>
            {Object.values(content.classes).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </header>
      {!list && <p className="muted">Chargement…</p>}
      {list && !list.length && <p className="muted small">La vitrine est vide pour ces filtres.</p>}
      <ul className="showcase-grid scroll">
        {(list ?? []).map((o) => (
          <li key={o.id} className={`showcase-card r-${o.item.rarity}`}>
            <GearIcon slot={o.item.slot} family={o.item.family} tier={o.item.tier} rarity={o.item.rarity} size={52} />
            <span className="showcase-text">
              <strong>{o.item.name}</strong>
              <span className="muted small">
                {RARITY_NAME[o.item.rarity]} · palier {o.item.tier} · {content.gearSlots[o.item.slot]?.name}
                {o.item.masterpiece ? ' · chef-d’œuvre' : ''}
              </span>
              <span className="muted small">
                {o.item.lines.map((l) => `${l.name} ${l.value}`).join(' · ') || 'sans bonus'} · vendu par {o.seller}
              </span>
            </span>
            <button className="btn btn-sm btn-primary" disabled={o.mine || state.gold < o.price} onClick={() => void act(() => api.gearBuy(o.id)).then(load)}>
              {o.mine ? 'Votre offre' : `${num(o.price)} or`}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
