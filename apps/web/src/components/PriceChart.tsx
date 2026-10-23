import { useEffect, useState } from 'react';
import type { PriceHistoryView } from '@bramo/shared';
import { api } from '../api';
import { num } from '../format';
import { ItemIcon, Modal } from './ui';
import { useGame } from '../game/GameContext';

/**
 * Courbe de prix d'un objet sur le dernier mois (demande de Louis du 23 octobre, « comme à Dofus ») : le prix moyen de chaque
 * jour (ligne et aire), la fourchette du plus bas au plus haut (bande), le volume échangé (barres en bas). Les jours sans
 * échange restent vides : la ligne relie les jours où il s'est vendu quelque chose.
 */

const DAY = 86_400_000;
const W = 560;
const H = 220;
const PAD = { left: 44, right: 12, top: 14, bottom: 46 };

export function usePriceHistory(itemId: string | null) {
  const [h, setH] = useState<PriceHistoryView | null>(null);
  useEffect(() => {
    if (!itemId) return;
    let live = true;
    setH(null);
    api
      .marketHistory(itemId)
      .then((x) => live && setH(x))
      .catch(() => live && setH(null));
    return () => {
      live = false;
    };
  }, [itemId]);
  return h;
}

/** « 12 oct. ». */
const dayLabel = (day: number) => new Date(day * DAY).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export function PriceChart({ history, compact = false }: { history: PriceHistoryView; compact?: boolean }) {
  const today = Math.floor(Date.now() / DAY);
  const first = today - history.days + 1;
  const pts = history.points.filter((p) => p.day >= first);
  if (!pts.length) return <p className="muted small">Aucun échange sur les {history.days} derniers jours : pas encore de prix de marché.</p>;
  const hi = Math.max(...pts.map((p) => p.max));
  const lo = Math.min(...pts.map((p) => p.min));
  // Une marge au-dessus et au-dessous, et des repères ronds.
  const top = hi + Math.max(1, (hi - lo) * 0.1);
  const bottom = Math.max(0, lo - Math.max(1, (hi - lo) * 0.1));
  const maxVol = Math.max(...pts.map((p) => p.volume));
  const x = (day: number) => PAD.left + ((day - first + 0.5) / history.days) * (W - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + (1 - (v - bottom) / Math.max(1, top - bottom)) * plotH;
  const volH = 26;
  const ticks = [bottom, (bottom + top) / 2, top].map((v) => Math.round(v));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.avg).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts.at(-1)!.day).toFixed(1)},${y(bottom).toFixed(1)} L${x(pts[0]!.day).toFixed(1)},${y(bottom).toFixed(1)} Z`;
  const band = `${pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.max).toFixed(1)}`).join(' ')} ${[...pts].reverse().map((p) => `L${x(p.day).toFixed(1)},${y(p.min).toFixed(1)}`).join(' ')} Z`;
  const last = pts.at(-1)!;
  const barW = Math.max(2, ((W - PAD.left - PAD.right) / history.days) * 0.6);
  return (
    <div className={`price-chart${compact ? ' compact' : ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Prix moyen sur ${history.days} jours, de ${num(lo)} à ${num(hi)} or`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="pc-grid" />
            <text x={PAD.left - 6} y={y(t) + 4} className="pc-axis" textAnchor="end">
              {num(t)}
            </text>
          </g>
        ))}
        {pts.map((p) => (
          <rect key={`v${p.day}`} x={x(p.day) - barW / 2} y={H - PAD.bottom + 6 + volH - (p.volume / maxVol) * volH} width={barW} height={(p.volume / maxVol) * volH} className="pc-volume">
            <title>{`${dayLabel(p.day)} : ${num(p.volume)} échangés`}</title>
          </rect>
        ))}
        <path d={band} className="pc-band" />
        <path d={area} className="pc-area" />
        <path d={line} className="pc-line" />
        {pts.map((p) => (
          <circle key={`p${p.day}`} cx={x(p.day)} cy={y(p.avg)} r={p === last ? 4 : 2.2} className={p === last ? 'pc-last' : 'pc-dot'}>
            <title>{`${dayLabel(p.day)} : ${num(p.avg)} or en moyenne (de ${num(p.min)} à ${num(p.max)}), ${num(p.volume)} échangés`}</title>
          </circle>
        ))}
        <text x={PAD.left} y={H - 4} className="pc-axis">
          {dayLabel(first)}
        </text>
        <text x={W - PAD.right} y={H - 4} className="pc-axis" textAnchor="end">
          aujourd’hui
        </text>
      </svg>
      <div className="pc-facts">
        <span>
          Dernier prix moyen <strong>{num(last.avg)} or</strong>
        </span>
        <span>
          Moyenne du mois <strong>{history.average != null ? `${num(history.average)} or` : '—'}</strong>
        </span>
        <span>
          Plus bas / plus haut <strong>{num(lo)} / {num(hi)}</strong>
        </span>
        <span>
          Échangés <strong>{num(history.volume)}</strong>
        </span>
      </div>
    </div>
  );
}

/** Fenêtre ouverte par le petit bouton « courbe » d'une carte du marché. */
export function PriceChartModal({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { content } = useGame();
  const item = content.items[itemId]!;
  const history = usePriceHistory(itemId);
  return (
    <Modal onClose={onClose} className="price-modal">
      <header className="price-modal-head">
        <ItemIcon item={item} />
        <div>
          <span className="eyebrow">Prix du marché · 30 derniers jours</span>
          <h2>{item.name}</h2>
        </div>
      </header>
      {history ? <PriceChart history={history} /> : <p className="muted small">Chargement…</p>}
    </Modal>
  );
}
