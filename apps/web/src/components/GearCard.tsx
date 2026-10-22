import type { CSSProperties, ReactNode } from 'react';
import type { GearItemView } from '@bramo/shared';
import { useGame } from '../game/GameContext';
import { GearIcon } from './GearIcon';
import { Modal } from './ui';

/**
 * Fiche d'une pièce d'équipement, façon jeu de rôle (demande de Louis du 23 octobre) : la pièce en grand dans le cadre de
 * sa rareté, ce qu'elle donne en mots simples, ses bonus, son ensemble, son état ; et, si une autre pièce est portée au
 * même emplacement, la comparaison stat par stat (vert : mieux, rouge : moins bien).
 */

const RARITY: Record<string, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };

/** Les caractéristiques fixes, avec ce qu'elles font en une ligne. */
const STATS: Record<string, { name: string; hint: string; icon: string }> = {
  power: { name: 'Puissance', hint: 'plus de dégâts et de soins', icon: 'M6 18L18 6M14 6h4v4M6 14l4 4' },
  vitality: { name: 'Vitalité', hint: 'plus de points de vie', icon: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z' },
  defense: { name: 'Défense', hint: 'moins de dégâts reçus', icon: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z' },
  haste: { name: 'Cadence', hint: 'attaque plus souvent', icon: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
  crit: { name: 'Critique', hint: 'plus de coups critiques', icon: 'M12 2l2.6 6.2L21 9l-5 4.3L17.5 20 12 16.6 6.5 20 8 13.3 3 9l6.4-.8z' },
  tenacity: { name: 'Ténacité', hint: 'pas encore utilisée en combat', icon: 'M5 20V9l7-5 7 5v11M9 20v-6h6v6' },
};

const SLOT: Record<string, string> = {
  head: 'Tête',
  torso: 'Torse',
  hands: 'Mains',
  legs: 'Jambes',
  feet: 'Pieds',
  weapon: 'Arme',
  cape: 'Cape',
  belt: 'Ceinture',
  necklace: 'Collier',
  ring: 'Anneau',
};

const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n))}`;

export function GearCard({ g, compare, onClose, actions }: { g: GearItemView; compare?: GearItemView | null; onClose: () => void; actions?: ReactNode }) {
  const { content } = useGame();
  const set = g.set ? content.gearSets[g.set] : undefined;
  const classes = g.classes.map((c) => content.classes[c]?.name ?? c);
  // Comparaison : les caractéristiques des deux pièces, et leurs bonus en %.
  const statKeys = [...new Set([...g.stats.map((s) => s.stat), ...(compare?.stats.map((s) => s.stat) ?? [])])];
  const statOf = (x: GearItemView | null | undefined, k: string) => x?.stats.find((s) => s.stat === k)?.value ?? 0;
  const lineOf = (x: GearItemView | null | undefined, n: string) => x?.lines.filter((l) => l.name === n).reduce((s, l) => s + l.value, 0) ?? 0;
  const lineNames = [...new Set([...g.lines.map((l) => l.name), ...(compare?.lines.map((l) => l.name) ?? [])])];
  const gains = compare ? [...statKeys.map((k) => statOf(g, k) - statOf(compare, k)), ...lineNames.map((n) => lineOf(g, n) - lineOf(compare, n))] : [];
  const better = gains.filter((d) => d > 0.05).length;
  const worse = gains.filter((d) => d < -0.05).length;

  return (
    <Modal onClose={onClose} className="gear-card-modal">
      <div className="gear-card" style={{ '--rc': `var(--r-${g.rarity})` } as CSSProperties}>
        <header className="gear-card-head">
          <span className="gear-card-icon">
            <GearIcon slot={g.slot} family={g.family} tier={g.tier} rarity={g.rarity} size={88} />
          </span>
          <div className="gear-card-title">
            <span className="gear-card-rarity">
              {RARITY[g.rarity]} · {SLOT[g.slot] ?? g.slot} · palier {g.tier}
            </span>
            <h2>{g.masterpiece ? `Chef-d’œuvre ${g.name}` : g.name}</h2>
            <span className="muted small">
              {classes.join(', ')}
              {g.bound ? ' · liée à vous' : ''}
              {g.signedBy ? ` · signée ${g.signedBy}` : ''}
            </span>
          </div>
        </header>

        {compare && (
          <div className={`gear-verdict ${better > worse ? 'up' : worse > better ? 'down' : ''}`}>
            {better > worse ? '▲ Meilleure' : worse > better ? '▼ Moins bonne' : '= Équivalente'} que <strong>{compare.name}</strong>, portée maintenant
            <span className="muted"> · {better} en mieux, {worse} en moins bien</span>
          </div>
        )}

        <section className="gear-card-block">
          <span className="eyebrow">Ce qu’elle donne</span>
          {statKeys.map((k) => {
            const s = STATS[k] ?? { name: k, hint: '', icon: STATS.power!.icon };
            const v = statOf(g, k);
            const d = compare ? v - statOf(compare, k) : 0;
            return (
              <div key={k} className="gear-stat-row">
                <span className="gear-stat-icon">
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d={s.icon} />
                  </svg>
                </span>
                <span className="gear-stat-name">
                  <strong>{s.name}</strong>
                  <span className="muted">{s.hint}</span>
                </span>
                <strong className="gear-stat-value">{v ? `+${fmt(v)}` : '—'}</strong>
                {compare && <span className={`gear-delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}`}>{d ? signed(d) : '='}</span>}
              </div>
            );
          })}
        </section>

        {lineNames.length > 0 && (
          <section className="gear-card-block">
            <span className="eyebrow">Bonus</span>
            {lineNames.map((n) => {
              const v = lineOf(g, n);
              const d = compare ? v - lineOf(compare, n) : 0;
              const line = g.lines.find((l) => l.name === n);
              return (
                <div key={n} className={`gear-line-row${line?.bonus ? ' bonus' : ''}${v ? '' : ' absent'}`}>
                  <span>
                    {v ? `+${fmt(v)} % ` : ''}
                    {n}
                    {line?.bonus ? <span className="muted small"> · chef-d’œuvre</span> : null}
                  </span>
                  {line && !line.bonus && line.max > line.min && (
                    <span className="gear-roll" title={`Tirage entre ${fmt(line.min)} et ${fmt(line.max)} %`}>
                      <span style={{ width: `${Math.max(0, Math.min(1, (line.value - line.min) / (line.max - line.min))) * 100}%` }} />
                    </span>
                  )}
                  {compare && <span className={`gear-delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}`}>{d ? signed(d) : '='}</span>}
                </div>
              );
            })}
          </section>
        )}

        {(g.conditional || set) && (
          <section className="gear-card-block special">
            {g.conditional && (
              <p>
                <strong>Effet</strong> · {g.conditional}
              </p>
            )}
            {set && (
              <div className="gear-set">
                <strong>{set.name}</strong>
                <span className="muted small"> · ensemble : plus on en porte, plus il donne</span>
                <ul>
                  {set.bonuses.map((b, i) => (
                    <li key={i}>
                      <span className="gear-set-n">{i + 2} p.</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <footer className="gear-card-foot">
          <span className="gear-wear" title="Usure : une pièce usée ne compte plus jusqu’à sa réparation">
            <span className="muted small">{g.worn ? 'Usée : à réparer' : `État ${Math.round((1 - g.wearShare) * 100)} %`}</span>
            <span className="gear-wear-bar">
              <span style={{ width: `${(1 - g.wearShare) * 100}%` }} />
            </span>
          </span>
          <span className="gear-card-actions">{actions}</span>
        </footer>
      </div>
    </Modal>
  );
}
