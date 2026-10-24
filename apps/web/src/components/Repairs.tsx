import { type CSSProperties, useState } from 'react';
import type { RepairRequestView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { duration, num } from '../format';
import { ItemIcon, Modal } from './ui';

/**
 * Les réparations confiées à un artisan, dans l'onglet Commandes du Marché [Louis, 24 octobre : « l'onglet Artisans et
 * Commandes en double »] : une demande de réparation est une commande ouverte comme une autre (sur le panneau, le premier
 * qui la prend la fait).
 */

/** Une demande de réparation en carte : « Réparer » sur le panneau, « Reprendre » dans mes commandes. */
export function RepairCard({ r, onDone }: { r: RepairRequestView; onDone: () => void }) {
  const { content, act } = useGame();
  const item = content.items[r.itemId];
  const mats = item?.repair?.materials.map((m) => `${m.qty} × ${content.items[m.item]?.name ?? m.item}`).join(', ');
  const tax = Math.round(r.fee * content.settings.market.taxShare);
  const run = async (call: () => ReturnType<typeof api.state>) => {
    if (await act(call)) onDone();
  };
  return (
    <div className="ord-card" style={{ '--st': 'var(--clan)' } as CSSProperties}>
      <div className="ord-card-head">
        <ItemIcon item={item} small />
        <span className="ord-target-text">
          <strong>Réparer : {item?.name ?? r.itemId}</strong>
          <span className="small muted">{r.mine ? 'votre outil, sur le panneau' : `pour ${r.ownerName}`}</span>
        </span>
      </div>
      <div className="ord-card-body small">
        <span>
          <strong>{num(r.fee)} or</strong>
          {r.mine ? '' : ` (vous toucherez ${num(r.fee - tax)})`} · usé de {duration(r.wear)}
        </span>
        {!r.mine && mats && <span className="muted">avec vos matériaux : {mats}</span>}
      </div>
      <div className="ord-card-actions">
        {r.mine ? (
          <button className="btn btn-sm" onClick={() => void run(() => api.cancelRepair(r.id))}>
            Reprendre l’outil
          </button>
        ) : (
          <button className="btn btn-sm btn-primary" onClick={() => void run(() => api.takeRepair(r.id))}>
            Réparer
          </button>
        )}
      </div>
    </div>
  );
}

/** Confier un outil usé au panneau : l'outil et l'or sont mis de côté, le premier artisan qui le répare touche l'or. */
export function RepairModal({ onClose }: { onClose: () => void }) {
  const { content, state, act, flash } = useGame();
  // Outils réparables par un artisan dont au moins un exemplaire est entamé.
  const tools = Object.entries(state.durability).filter(([id, d]) => content.items[id]?.repair && d.copies.some((left) => left < d.totalMs));
  const [toolId, setToolId] = useState('');
  const [copy, setCopy] = useState(0);
  const [fee, setFee] = useState<number | null>(null);
  const tool = tools.find(([id]) => id === toolId) ?? tools[0];
  const send = async () => {
    if (!tool || !fee) return;
    if (await act(() => api.requestRepair(tool[0], copy, fee))) {
      flash('Outil confié : le premier artisan qui le répare touche l’or.');
      onClose();
    }
  };
  return (
    <Modal onClose={onClose} className="ord-modal">
      <div className="ord-head">
        <span className="ord-open-badge" aria-hidden>
          ⚒
        </span>
        <div>
          <span className="eyebrow">Réparation</span>
          <h2>Confier un outil usé</h2>
        </div>
      </div>
      {tools.length === 0 ? (
        <p className="muted">Aucun de vos outils n’est usé.</p>
      ) : (
        <div className="ord-form">
          <label className="ord-row">
            <span>Outil</span>
            <select
              className="input"
              value={tool?.[0]}
              onChange={(e) => {
                setToolId(e.target.value);
                setCopy(0);
              }}
            >
              {tools.map(([id]) => (
                <option key={id} value={id}>
                  {content.items[id]?.name}
                </option>
              ))}
            </select>
          </label>
          <label className="ord-row">
            <span>Exemplaire</span>
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
          <label className="ord-row">
            <span>Prix</span>
            <span className="ord-price">
              <input className="input" type="number" min={1} placeholder="votre prix" value={fee ?? ''} onChange={(e) => setFee(e.target.value === '' ? null : Math.max(1, Math.floor(Number(e.target.value)) || 1))} />
              <span className="muted small">or</span>
            </span>
          </label>
          <div className="ord-summary small">
            <span>L’outil et l’or sont mis de côté ; réparé, l’outil vous revient comme neuf. Vous pouvez le reprendre tant que personne ne l’a réparé.</span>
          </div>
          <div className="ord-actions">
            <button className="btn btn-primary" disabled={!tool || !fee || state.gold < fee} onClick={() => void send()}>
              Afficher la demande
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
