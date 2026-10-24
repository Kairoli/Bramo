import type { CSSProperties, ReactNode } from 'react';
import type { CombatView, PoolView, TimelineEvent } from '@bramo/shared';
import { useGame } from '../game/GameContext';
import { useNow } from '../game/useLive';
import { Tip, TipFoot, TipHead, TipLine } from './Tip';

/**
 * Les huit réserves du build, en jauges, à côté du combat rejoué [Louis, 24 octobre : « je les afficherais toutes, c'est le
 * cœur de notre système de combat »]. Toutes, toujours : une réserve que le build ne remplit pas reste vide et le dit au
 * survol. Leur niveau suit le déroulé du combat (le moteur le note à chaque instant) ; une réserve qui se vide d'un coup
 * dans un sort pulse.
 */

/** Couleur et pictogramme de chaque réserve (data/combat/talents.yaml, `pools`). */
export const POOL_LOOK: Record<string, { color: string; icon: string }> = {
  tisons: { color: '#F08A4B', icon: 'M12 3c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-6 0 2 1 3 2 3 0-3 0-5 1-8z' },
  entailles: { color: '#E5484D', icon: 'M5 19L19 5M9 20L20 9M4 15L15 4' },
  frimas: { color: '#8FD8F5', icon: 'M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M12 6l-2-2M12 6l2-2M12 18l-2 2M12 18l2 2' },
  rancoeur: { color: '#B07CE8', icon: 'M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0M8 9l3 1.5M16 9l-3 1.5M8.5 16.5c2-1.5 5-1.5 7 0' },
  ferveur: { color: '#F2C14E', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2' },
  mesure: { color: '#7ED6A2', icon: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
  echos: { color: '#4CC9D6', icon: 'M12 11v2M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13' },
  trophees: { color: '#D9B38C', icon: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 20h8' },
};
const FALLBACK = { color: '#A9B3B5', icon: 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z' };

/** Niveau des réserves à l'instant c, celui de l'instant d'avant (pour voir une réserve se vider) et le dernier instant. */
function poolsAt(timeline: TimelineEvent[], c: number | null) {
  let cur: Record<string, number> = {};
  let prev: Record<string, number> = {};
  let at = -Infinity;
  if (c === null) return { cur, prev, at };
  for (const e of timeline) {
    if (e.t > c) break;
    if (!e.pools) continue;
    prev = cur;
    cur = e.pools;
    at = e.t;
  }
  return { cur, prev, at };
}

export function PoolGauges({ view, compact }: { view: CombatView; compact?: boolean }) {
  const { receivedAt } = useGame();
  const now = useNow(100);
  const a = view.activity;
  if (!a || !a.pools.length) return null;
  const timeline = a.timeline ?? [];
  const c = a.timeline ? (a.progressMs + (now - receivedAt)) / 1000 : null;
  const { cur, prev, at } = poolsAt(timeline, c);
  // Une réserve que le combat en cours ne remplit jamais : rien dans le build ne la nourrit.
  const used = new Set(timeline.flatMap((e) => Object.keys(e.pools ?? {})));
  return (
    <div className={`pool-gauges${compact ? ' compact' : ''}`}>
      {a.pools.map((p) => (
        <Gauge key={p.id} pool={p} n={cur[p.id] ?? 0} spent={c !== null && c - at < 0.6 && (cur[p.id] ?? 0) < (prev[p.id] ?? 0) - 0.5} used={p.build.fill.length > 0 || used.has(p.id)} live={!!a.timeline} />
      ))}
    </div>
  );
}

function Gauge({ pool, n, spent, used, live }: { pool: PoolView; n: number; spent: boolean; used: boolean; live: boolean }) {
  const look = POOL_LOOK[pool.id] ?? FALLBACK;
  const share = Math.max(0, Math.min(1, n / pool.max));
  const shown = Math.floor(n);
  return (
    <Tip
      content={
        <>
          <TipHead
            icon={
              <span className="pool-ring big" style={{ '--pc': look.color, '--share': 1 } as CSSProperties}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d={look.icon} />
                </svg>
              </span>
            }
            title={pool.name}
            sub={live ? `${shown} / ${Math.floor(pool.max)} en ce moment · plafond de ton build` : `Plafond de ton build : ${Math.floor(pool.max)}`}
            color={look.color}
          />
          {pool.text && <div className="tip-body">{pool.text}</div>}
          <PoolGuide pool={pool} />
        </>
      }
    >
      <span className={`pool-gauge${used ? '' : ' unused'}${share >= 1 ? ' full' : ''}${spent ? ' spent' : ''}`} style={{ '--pc': look.color } as CSSProperties}>
        <span className="pool-ring" style={{ '--share': share } as CSSProperties}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d={look.icon} />
          </svg>
        </span>
        {shown > 0 && <span className="pool-n">{shown}</span>}
      </span>
    </Tip>
  );
}

/**
 * Un texte d'effet (talent, ensemble, sort) rendu parlant :
 * - chaque réserve nommée (« Rancœur », « 2 Tisons »…) s'explique au survol [Louis, 24 octobre : « Rancœur devient
 *   Ferveur, c'est quoi même ? »] ;
 * - chaque coefficient de Puissance (« 0,22 P ») devient un nombre, calculé avec la Puissance du personnage, l'écriture
 *   d'origine au survol [Louis : « faire du 0,6 × Puissance n'est pas très parlant pour un joueur »].
 */
export function PoolText({ text }: { text: string }) {
  const { content, state } = useGame();
  const pools = content.pools ?? [];
  const power = state?.combat?.stats.power ?? null;
  // Le nom, au singulier ou au pluriel (« Tison », « Tisons ») ; jamais un mot courant en minuscules (« mesure »).
  const stem = (n: string) => (n.endsWith('s') && n !== 'Frimas' ? n.slice(0, -1) : n);
  const byStem = new Map(pools.map((p) => [stem(p.name), p]));
  // Un coefficient (« 0,22 P », « 1 P ») ou un nom de réserve (des lettres seulement : pas d'échappement à faire).
  const names = [...byStem.keys()];
  const re = new RegExp(`(\\d+(?:,\\d+)?) ?P(?![\\wà-ÿ])${names.length ? `|(${names.join('|')})s?(?![a-zà-ÿ])` : ''}`, 'g');
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    last = m.index! + m[0].length;
    if (m[1] !== undefined) {
      const coef = Number(m[1].replace(',', '.'));
      if (power === null) {
        out.push(`${m[1]} × Puissance`);
        continue;
      }
      out.push(
        <Tip
          key={m.index}
          className="pool-word-tip"
          content={<TipHead title={`≈ ${Math.round(coef * power)}`} sub={`${m[1]} × ta Puissance (${Math.round(power)}) : le nombre suit ta Puissance, donc ton équipement et ton niveau.`} />}
        >
          <strong className="power-num">≈ {Math.round(coef * power)}</strong>
        </Tip>,
      );
      continue;
    }
    const p = byStem.get(m[2]!)!;
    const look = POOL_LOOK[p.id] ?? FALLBACK;
    out.push(
      <Tip
        key={m.index}
        className="pool-word-tip"
        content={
          <>
            <TipHead
              icon={
                <span className="pool-ring big" style={{ '--pc': look.color, '--share': 1 } as CSSProperties}>
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d={look.icon} />
                  </svg>
                </span>
              }
              title={`${p.name} · une réserve`}
              sub={`Jusqu’à ${p.max}, plus selon ton build`}
              color={look.color}
            />
            {p.text && <div className="tip-body">{p.text}</div>}
            <TipFoot>Une jauge vide au début de chaque combat : des pièces la remplissent, d’autres la dépensent. Elle se voit pendant le combat, à côté du personnage.</TipFoot>
          </>
        }
      >
        <span className="pool-word" style={{ '--pc': look.color } as CSSProperties}>
          {m[0]}
        </span>
      </Tip>,
    );
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/**
 * Ce que fait la réserve dans le build : ce qui la remplit, ce qui la vide, et ce qui se passe une fois pleine
 * [Louis, 24 octobre : « des explications claires de ce que font les jauges une fois pleines ; ça aidera pour les builds »].
 * Puis, pour monter un build autour d'elle, les objets nommés et ensembles du jeu qui la remplissent ou la dépensent.
 */
function PoolGuide({ pool }: { pool: PoolView }) {
  const { build, game } = pool;
  const max = Math.floor(pool.max);
  const filled = build.fill.length > 0;
  const spent = build.spend.length > 0;
  const full = !filled
    ? null
    : spent
      ? `Une fois pleine (${max}), elle ne monte plus : ce qui la remplirait est perdu. Tes pièces qui la dépensent la vident : c’est là qu’elle rapporte.`
      : `Une fois pleine (${max}), elle ne sert plus à rien : rien dans ton build ne la dépense. C’est la pièce qui te manque.`;
  // Une pièce déjà décrite plus haut (elle remplit et dépense) ne répète pas son texte.
  const said = (name: string) => build.fill.some((f) => f.name === name);
  const names = (xs: { name: string }[]) => xs.map((x) => x.name.replace(/ \((objet nommé|\d pièces)\)$/, '')).filter((x, i, all) => all.indexOf(x) === i);
  return (
    <>
      <div className="tip-section">Dans ton build</div>
      {filled ? (
        build.fill.map((u) => (
          <TipLine key={`f${u.name}`} mark="+" color="var(--good)">
            <strong>{u.name}</strong> la remplit{u.how ? <span className="muted"> · {u.how}</span> : null}
          </TipLine>
        ))
      ) : (
        <TipLine mark="·" color="var(--text-muted)">
          Rien ne la remplit : elle reste vide.
        </TipLine>
      )}
      {build.spend.map((u) => (
        <TipLine key={`s${u.name}`} mark="−" color={POOL_LOOK[pool.id]?.color ?? 'var(--text)'}>
          <strong>{u.name}</strong> la dépense{u.how && !said(u.name) ? <span className="muted"> · {u.how}</span> : null}
        </TipLine>
      ))}
      {build.use.map((u) => (
        <TipLine key={`u${u.name}`} mark="◆" color="var(--clan)">
          <strong>{u.name}</strong> s’en sert{u.how && !said(u.name) ? <span className="muted"> · {u.how}</span> : null}
        </TipLine>
      ))}
      {full && <TipFoot tone={spent ? 'good' : 'locked'}>{full}</TipFoot>}
      <div className="tip-section">Pour un build autour d’elle</div>
      <TipLine mark="+" color="var(--good)">
        La remplissent : {game.fill.length ? names(game.fill).join(', ') : 'rien encore dans le butin'}
      </TipLine>
      <TipLine mark="−" color={POOL_LOOK[pool.id]?.color ?? 'var(--text)'}>
        La dépensent : {game.spend.length ? names(game.spend).join(', ') : 'rien encore dans le butin'}
      </TipLine>
    </>
  );
}
