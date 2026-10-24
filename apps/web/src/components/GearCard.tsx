import { type CSSProperties, type ReactNode, useState } from 'react';
import type { GearItemView, RefineService } from '@bramo/shared';
import { useGame } from '../game/GameContext';
import { GearIcon } from './GearIcon';
import { ItemIcon, Modal } from './ui';

/**
 * Fiche d'une pièce d'équipement, façon jeu de rôle (demande de Louis du 23 octobre) : la pièce en grand dans le cadre de
 * sa rareté, ce qu'elle donne en mots simples, ses bonus, son ensemble, son état ; et, si une autre pièce est portée au
 * même emplacement, la comparaison stat par stat (vert : mieux, rouge : moins bien).
 */

const RARITY: Record<string, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };

/** Les caractéristiques fixes, avec ce qu'elles font en une ligne. */
export const STATS: Record<string, { name: string; hint: string; icon: string }> = {
  power: { name: 'Puissance', hint: 'plus de dégâts et de soins', icon: 'M6 18L18 6M14 6h4v4M6 14l4 4' },
  vitality: { name: 'Vitalité', hint: 'plus de points de vie', icon: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z' },
  defense: { name: 'Défense', hint: 'moins de dégâts reçus', icon: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z' },
  haste: { name: 'Cadence', hint: 'attaque plus souvent', icon: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
  crit: { name: 'Critique', hint: 'plus de coups critiques', icon: 'M12 2l2.6 6.2L21 9l-5 4.3L17.5 20 12 16.6 6.5 20 8 13.3 3 9l6.4-.8z' },
  tenacity: { name: 'Ténacité', hint: 'pas encore utilisée en combat', icon: 'M5 20V9l7-5 7 5v11M9 20v-6h6v6' },
};

export const SLOT: Record<string, string> = {
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

/** Ce que fait chaque gemme de situation, en une phrase, et contre quoi (docs/design/coherence/build.md §2). */
export const GEM_TEXT: Record<string, { against: string; text: string }> = {
  gem_interstice_opal: { against: 'les fenêtres', text: 'Garde une part des dégâts perdus quand l’ennemi est protégé, et la rend quand il redevient vulnérable.' },
  gem_wash_pearl: { against: 'l’érosion', text: 'Lave régulièrement les cumuls d’érosion qui s’accumulent sur vous.' },
  gem_stop_hematite: { against: 'les coups lourds', text: 'Réduit les gros coups reçus et donne un peu plus de points de vie.' },
  gem_drive_garnet: { against: 'les renforts', text: 'Frappe plus fort les renforts qui arrivent en cours de combat.' },
  gem_fault_eye: { against: 'les gardes', text: 'Brise bien plus vite les gardes et les boucliers ennemis.' },
  gem_recovery_amber: { against: 'les auras', text: 'Rend une part des points de vie perdus à l’usure des auras.' },
};

export function GearCard({
  g,
  compare,
  onClose,
  actions,
  onSocket,
  onSell,
  onRefine,
  onSalvage,
}: {
  g: GearItemView;
  compare?: GearItemView | null;
  onClose: () => void;
  actions?: ReactNode;
  onSocket?: (itemId: string | null) => void;
  /** Mettre la pièce en vitrine au marché, à ce prix. */
  onSell?: (price: number) => void;
  /** L'Affineur du bourg : un rang de plus, affûter une ligne, retailler une ligne ou garder une proposition. */
  onRefine?: (service: RefineService) => void;
  /** Démonter la pièce en poussière (l'Affineur). */
  onSalvage?: () => void;
}) {
  const [price, setPrice] = useState('');
  // Une chose à la fois [Louis, 24 octobre : « la pop-up contient énormément d'infos »] : la fiche d'abord ; la gemme,
  // l'Affineur et la vitrine dans leurs onglets.
  const [tab, setTab] = useState<'sheet' | 'gem' | 'refine' | 'sell'>('sheet');
  const { content, state } = useGame();
  const gemsInBag = Object.entries(state.inventory).filter(([id, n]) => n > 0 && content.items[id]?.gem);
  const set = g.set ? content.gearSets[g.set] : undefined;
  const classes = g.classes.map((c) => content.classes[c]?.name ?? c);
  // Jusqu'où montent les attributs de base : l'Affineur (rangs, sans plafond), ou rien.
  const rankRule = content.gearCrafting?.refine?.rank;
  const perRank = Math.round((rankRule?.statPerRank ?? 0) * 100);
  const baseNote =
    g.rankCost || g.rank > 0
      ? `L’Affineur les monte de ${perRank} % par rang, sans plafond${g.rank > 0 ? ` (rang +${g.rank} : déjà +${perRank * g.rank} %)` : ''}.`
      : (g.rarity === 'epic' || g.rarity === 'legendary') && rankRule && g.tier < rankRule.minTier
        ? `C’est leur maximum ici : l’Affineur ne les monte qu’à partir du palier ${rankRule.minTier}.`
        : 'C’est leur maximum : elles ne bougent pas.';
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
            <h2>
              {g.masterpiece ? `Chef-d’œuvre ${g.name}` : g.name}
              {g.rank > 0 && <span className="gear-rank"> +{g.rank}</span>}
            </h2>
            <span className="muted small">
              {classes.join(', ')}
              {g.bound ? ' · liée à vous' : ''}
              {g.signedBy ? ` · signée ${g.signedBy}` : ''}
            </span>
          </div>
        </header>

        {(() => {
          const tabs: [typeof tab, string][] = [['sheet', 'Fiche']];
          if (g.gemSlot) tabs.push(['gem', g.gem ? 'Gemme ◆' : 'Gemme']);
          if ((onRefine && (g.rankCost || g.honeCost || g.rerollCost || g.rerollOffer)) || (onSalvage && g.salvage)) tabs.push(['refine', 'Affineur']);
          if (onSell) tabs.push(['sell', 'Vendre']);
          return tabs.length > 1 ? (
            <nav className="gear-card-tabs" role="tablist">
              {tabs.map(([id, label]) => (
                <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </nav>
          ) : null;
        })()}

        {tab === 'sheet' && compare && (
          <div className={`gear-verdict ${better > worse ? 'up' : worse > better ? 'down' : ''}`}>
            {better > worse ? '▲ Meilleure' : worse > better ? '▼ Moins bonne' : '= Équivalente'} que <strong>{compare.name}</strong>, portée maintenant
            <span className="muted"> · {better} en mieux, {worse} en moins bien</span>
          </div>
        )}

        {tab === 'sheet' && (
        <section className="gear-card-block attrs-core">
          {/* Comme les attributs de base et les attributs de The Division 2 [Louis, 24 octobre] : ce qui est fixe, puis ce qui est tiré. */}
          <span className="attrs-head">
            <span className="eyebrow">Attributs de base</span>
            <span className="attrs-kind" title="Les mêmes sur toutes les pièces de ce modèle et de ce palier.">fixes</span>
          </span>
          {/* Jusqu'où ça monte [Louis, 24 octobre : « quel est le max ? jusqu'où je peux l'affiner ? »], en une ligne. */}
          <p className="attrs-note">{baseNote}</p>
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
        )}

        {tab === 'sheet' && lineNames.length > 0 && (
          <section className="gear-card-block attrs-rolled">
            <span className="attrs-head">
              <span className="eyebrow">Attributs</span>
              <span className="attrs-kind" title="Tirés au hasard quand la pièce tombe ou se fabrique, dans une plage : la barre montre où tombe le tirage. Ils se retaillent chez l’Affineur.">
                tirés au hasard
              </span>
            </span>
            {lineNames.map((n) => {
              const v = lineOf(g, n);
              const d = compare ? v - lineOf(compare, n) : 0;
              const line = g.lines.find((l) => l.name === n);
              return (
                <div key={n} className={`gear-line-row${line?.bonus ? ' bonus' : ''}${v ? '' : ' absent'}`}>
                  <span>
                    {v ? `+${fmt(v)} % ` : ''}
                    {n}
                    {line?.bonus ? (
                      <span className="muted small"> · chef-d’œuvre</span>
                    ) : line && line.max > line.min ? (
                      line.value >= line.max - 1e-9 ? (
                        <span className="gear-max at">max</span>
                      ) : (
                        <span className="gear-max">max {fmt(line.max)} %</span>
                      )
                    ) : null}
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
            {g.lines.some((l) => !l.bonus && l.value < l.max - 1e-9) && (
              <p className="attrs-note">
                {g.honeable.length
                  ? 'L’Affineur affûte une ligne jusqu’à son max, par petits pas.'
                  : 'Le max d’une ligne ne s’atteint qu’au tirage (ou en retaillant) : l’affûtage ne travaille que les Épiques et Légendaires du palier 40 et plus.'}
              </p>
            )}
          </section>
        )}

        {tab === 'gem' && g.gemSlot && (
          <section className={`gear-card-block gem-block${g.gem ? ' filled' : ''}`}>
            {/* « Chaton » (le terme de joaillier) ne parlait à personne [Louis, 24 octobre]. */}
            <span className="eyebrow">Emplacement de gemme</span>
            {g.gem ? (
              <div className="gem-row">
                <ItemIcon item={content.items[g.gem]} />
                <span className="gem-text">
                  <strong>{content.items[g.gem]?.name}</strong>
                  <span className="muted small">
                    Contre {GEM_TEXT[g.gem]?.against} : {GEM_TEXT[g.gem]?.text}
                  </span>
                </span>
                {onSocket && (
                  <button className="btn btn-sm" onClick={() => onSocket(null)} title="La gemme revient au sac">
                    Retirer
                  </button>
                )}
              </div>
            ) : (
              <p className="muted small">Vide. Une gemme aide contre un type d’ennemi (érosion, coups lourds, renforts…). Elle se taille en Joaillerie avec des vestiges du combat.</p>
            )}
            {onSocket && gemsInBag.length > 0 && (
              <div className="gem-choices">
                {gemsInBag
                  .filter(([id]) => id !== g.gem)
                  .map(([id, n]) => (
                    <button key={id} className="gem-choice" onClick={() => onSocket(id)} title={`${content.items[id]?.name} · contre ${GEM_TEXT[id]?.against}`}>
                      <ItemIcon item={content.items[id]} small />
                      <span>
                        {g.gem ? 'Remplacer par' : 'Sertir'} {content.items[id]?.name} <span className="muted">×{n}</span>
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </section>
        )}

        {tab === 'sheet' && (g.conditional || set) && (
          <section className="gear-card-block special">
            {g.conditional && (
              <p>
                <strong>{g.named ? 'Talent' : 'Effet'}</strong> · {g.conditional}
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

        {tab === 'refine' && onRefine && (g.rankCost || g.honeCost || g.rerollCost || g.rerollOffer) && <Refiner g={g} onRefine={onRefine} />}
        {tab === 'refine' && onSalvage && g.salvage && <Salvage g={g} onSalvage={onSalvage} />}

        {tab === 'sell' && onSell && (
          <section className="gear-card-sell">
            <span className="muted small">Vitrine du marché : une fois en vente, la pièce ne se porte plus ; l’or arrive à votre visite.</span>
            <span className="gear-sell-row">
              <input className="input" inputMode="numeric" placeholder="Prix (or)" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} />
              <button className="btn btn-sm" disabled={!Number(price)} onClick={() => onSell(Number(price))}>
                Mettre en vente
              </button>
            </span>
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

/**
 * Les propositions de la retaille (comme l'enchanteresse de Diablo III) : la ligne actuelle et les nouvelles, côte à côte,
 * avec leur place dans leur plage ; on en garde une. Payé d'avance : garder l'actuelle ne rend rien.
 */
function RerollChoice({ g, onRefine }: { g: GearItemView; onRefine: (service: RefineService) => void }) {
  const current = g.lines[g.rerollLine ?? 0]!;
  const options = [{ line: current, pick: null as number | null, label: 'Garder l’actuelle' }, ...g.rerollOffer!.map((line, i) => ({ line, pick: i, label: 'Prendre celle-ci' }))];
  return (
    <div className="refine-row">
      <span>
        <strong>L’Affineur vous propose</strong>
        <span className="muted small"> · choisissez la ligne que la pièce gardera</span>
      </span>
      <div className="reroll-choices">
        {options.map((o) => {
          const share = o.line.max > o.line.min ? (o.line.value - o.line.min) / (o.line.max - o.line.min) : 1;
          return (
            <button key={o.pick ?? 'keep'} className={`reroll-choice${o.pick === null ? ' current' : ''}`} onClick={() => onRefine({ kind: 'reroll_pick', pick: o.pick })}>
              <span className="muted small">{o.pick === null ? 'Actuelle' : 'Nouvelle'}</span>
              <strong>
                +{fmt(o.line.value)} % {o.line.name}
              </strong>
              <span className="gear-roll" title={`Tirage entre ${fmt(o.line.min)} et ${fmt(o.line.max)} %`}>
                <span style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }} />
              </span>
              <span className="small">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Démonter la pièce : ce qu'elle rend. Un seul clic pour une pièce ordinaire ; une confirmation seulement pour ce qui a
 * de la valeur (Épique, Légendaire, chef-d'œuvre, ensemble, nommée, pièce travaillée) [Louis : « un double clic pour un
 * seul objet »].
 */
function Salvage({ g, onSalvage }: { g: GearItemView; onSalvage: () => void }) {
  const { content } = useGame();
  const [sure, setSure] = useState(false);
  const dust = g.salvage!;
  const precious = g.masterpiece || !!g.set || g.named || g.rank > 0 || g.rerollLine != null || g.rarity === 'epic' || g.rarity === 'legendary';
  return (
    <section className="gear-card-block salvage-block">
      <span>
        <strong>Démonter</strong>
        <span className="muted small">
          {' '}
          · la pièce disparaît et donne <ItemIcon item={content.items[dust.item]} small /> {dust.qty} × {content.items[dust.item]?.name}, qui sert à retailler
        </span>
      </span>
      {sure ? (
        <span className="salvage-confirm">
          <button className="btn btn-sm btn-danger" onClick={onSalvage}>
            Oui, démonter
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setSure(false)}>
            Annuler
          </button>
        </span>
      ) : (
        <button className="btn btn-sm" onClick={() => (precious ? setSure(true) : onSalvage())}>
          Démonter
        </button>
      )}
    </section>
  );
}

/** Ce que coûte un service de l'Affineur, et si on l'a. */
function CostLine({ cost }: { cost: NonNullable<GearItemView['rankCost']> }) {
  const { content, state } = useGame();
  return (
    <span className="refine-cost">
      <span className={state.gold >= cost.gold ? '' : 'short'}>{cost.gold.toLocaleString('fr-FR')} or</span>
      {cost.items.map((i) => (
        <span key={i.item} className={(state.inventory[i.item] ?? 0) >= i.qty ? '' : 'short'} title={`Vous en avez ${(state.inventory[i.item] ?? 0).toLocaleString('fr-FR')}`}>
          <ItemIcon item={content.items[i.item]} small /> {i.qty.toLocaleString('fr-FR')} × {content.items[i.item]?.name ?? i.item}
        </span>
      ))}
    </span>
  );
}

/**
 * L'Affineur du bourg (perfectionnement) : le rang d'affinage, sans plafond [Décidé par Louis, 23 octobre], et l'affûtage
 * d'une ligne vers son maximum. Chaque service coûte plus que le précédent sur la même pièce ; l'or offert disparaît.
 */
function Refiner({ g, onRefine }: { g: GearItemView; onRefine: (service: RefineService) => void }) {
  const { content, state } = useGame();
  const per = content.gearCrafting?.refine?.rank.statPerRank ?? 0;
  const can = (c: NonNullable<GearItemView['rankCost']>) => state.gold >= c.gold && c.items.every((i) => (state.inventory[i.item] ?? 0) >= i.qty);
  return (
    <section className="gear-card-block refine-block">
      <span className="eyebrow">L’Affineur du bourg</span>
      {g.rankCost ? (
        <div className="refine-row">
          <span>
            <strong>Rang +{g.rank + 1}</strong>
            <span className="muted small"> · +{Math.round(per * 100)} % sur ce que donne la pièce, à chaque rang, sans limite</span>
          </span>
          <CostLine cost={g.rankCost} />
          <button className="btn btn-sm btn-primary" disabled={!can(g.rankCost) || g.price != null} onClick={() => onRefine({ kind: 'rank' })}>
            Monter au rang +{g.rank + 1}
          </button>
        </div>
      ) : (
        <p className="muted small">Les rangs d’affinage sont pour les pièces Épiques et Légendaires du palier 40 et plus.</p>
      )}
      {g.rerollOffer ? (
        <RerollChoice g={g} onRefine={onRefine} />
      ) : (
        g.rerollCost && (
          <div className="refine-row">
            <span>
              <strong>Retailler une ligne</strong>
              <span className="muted small">
                {g.rerollLine == null
                  ? ' · deux autres lignes vous sont proposées, vous gardez celle que vous voulez ; ensuite, seule cette ligne pourra l’être encore'
                  : ' · chaque retaille de cette pièce coûte la moitié de plus que la précédente'}
              </span>
            </span>
            <CostLine cost={g.rerollCost} />
            <span className="refine-lines">
              {g.rerollable.map((i) => (
                <button key={i} className="btn btn-sm" disabled={!can(g.rerollCost!) || g.price != null} onClick={() => onRefine({ kind: 'reroll', line: i })}>
                  {g.lines[i]!.name} ({fmt(g.lines[i]!.value)} %)
                </button>
              ))}
            </span>
          </div>
        )
      )}
      {g.honeCost && (
        <div className="refine-row">
          <span>
            <strong>Affûter une ligne</strong>
            <span className="muted small"> · elle monte vers son maximum, jamais au-delà</span>
          </span>
          <CostLine cost={g.honeCost} />
          <span className="refine-lines">
            {g.honeable.map((i) => (
              <button key={i} className="btn btn-sm" disabled={!can(g.honeCost!) || g.price != null} onClick={() => onRefine({ kind: 'hone', line: i })}>
                {g.lines[i]!.name} ({fmt(g.lines[i]!.value)} / {fmt(g.lines[i]!.max)})
              </button>
            ))}
          </span>
        </div>
      )}
    </section>
  );
}
