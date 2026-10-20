import { useState } from 'react';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { num } from '../format';
import { ItemIcon, Modal } from './ui';

/** Marchand PNJ du port : vend le poisson tant que la Pêche n'est pas ouverte, rachète tout. */
export function ShopModal() {
  const { content, state, act, setShopOpen } = useGame();
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const forSale = Object.values(content.items).filter((i) => i.shopPrice);
  const owned = Object.entries(state.inventory)
    .map(([id, qty]) => ({ item: content.items[id], qty }))
    .filter((x) => x.item);

  return (
    <Modal onClose={() => setShopOpen(false)} className="shop">
      <div className="eyebrow" style={{ color: 'var(--market)' }}>
        Port de la Mer des Lanternes
      </div>
      <h2>Le marchand du port</h2>
      <p className="muted">
        « Du poisson frais tous les matins, en attendant que vous sachiez pêcher. Et je rachète à peu près tout. »
      </p>
      <div className="tabs" role="tablist" style={{ justifySelf: 'start' }}>
        <button role="tab" aria-selected={tab === 'buy'} onClick={() => setTab('buy')}>
          Acheter
        </button>
        <button role="tab" aria-selected={tab === 'sell'} onClick={() => setTab('sell')}>
          Vendre
        </button>
      </div>
      <div className="shop-list scroll">
        {tab === 'buy' &&
          forSale.map((item) => (
            <div className="shop-row" key={item.id}>
              <ItemIcon item={item} small />
              <span className="shop-name">{item.name}</span>
              <span className="muted">{state.inventory[item.id] ?? 0} en stock</span>
              <span className="shop-price">{item.shopPrice} or</span>
              {[1, 10].map((q) => (
                <button
                  key={q}
                  className="btn btn-sm"
                  disabled={state.gold < item.shopPrice! * q}
                  onClick={() => act(() => api.buy(item.id, q))}
                >
                  ×{q}
                </button>
              ))}
            </div>
          ))}
        {tab === 'sell' && owned.length === 0 && <p className="muted">Votre sac est vide.</p>}
        {tab === 'sell' &&
          owned.map(({ item, qty }) => (
            <div className="shop-row" key={item!.id}>
              <ItemIcon item={item} small />
              <span className="shop-name">{item!.name}</span>
              <span className="muted">×{num(qty)}</span>
              <span className="shop-price">{item!.value} or</span>
              <button className="btn btn-sm" onClick={() => act(() => api.sell(item!.id, 1))}>
                ×1
              </button>
              <button className="btn btn-sm" onClick={() => act(() => api.sell(item!.id, qty))}>
                Tout
              </button>
            </div>
          ))}
      </div>
      <div className="shop-foot">
        <span className="gold">{num(state.gold)} or</span>
        <button className="btn" onClick={() => setShopOpen(false)}>
          Fermer
        </button>
      </div>
    </Modal>
  );
}
