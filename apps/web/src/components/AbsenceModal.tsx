import type { CSSProperties } from 'react';
import type { AdvanceSummary, NotableLoot } from '@bramo/shared';
import { useGame } from '../game/GameContext';
import { duration, num, pct } from '../format';
import { GearIcon } from './GearIcon';
import { SLOT } from './GearCard';
import { ItemIcon, Modal } from './ui';

const RARITY_NAMES: Record<string, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };
const WHY: Record<NotableLoot['why'], string> = { trophy: 'Trophée', named: 'Objet nommé', set: 'Pièce d’ensemble', rarity: 'Trouvaille', gem: 'Gemme de talent' };

/** Le butin qui compte, en tête du résumé [Louis, 24 octobre : « le résumé d'absence doit montrer les loots importants »]. */
function NotableList({ loot }: { loot: NotableLoot[] }) {
  const { content } = useGame();
  // Les plus belles d'abord : trophées et nommés, puis ensembles, puis par rareté et palier.
  const order = { trophy: 0, named: 1, gem: 2, set: 3, rarity: 4 };
  const rank = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const sorted = [...loot].sort((a, b) => order[a.why] - order[b.why] || rank[a.rarity] - rank[b.rarity] || b.tier - a.tier);
  return (
    <div className="absence-loot">
      {sorted.slice(0, 4).map((l, i) => (
        <div key={i} className={`absence-loot-card why-${l.why}`} style={{ '--rc': `var(--r-${l.rarity})` } as CSSProperties}>
          {l.item ? <ItemIcon item={content.items[l.item]} /> : <GearIcon slot={l.slot} family={l.family} tier={l.tier} rarity={l.rarity} size={48} />}
          <span className="absence-loot-text">
            <span className="absence-loot-why">{WHY[l.why]}</span>
            <strong>{l.name}</strong>
            <span className="muted small">
              {l.item ? `à sertir · ${l.where}` : <>{RARITY_NAMES[l.rarity]} · palier {l.tier} · {SLOT[l.slot] ?? l.slot} · {l.why === 'trophy' ? `trophée de ${l.where}` : l.where}</>}
            </span>
            {(l.effect || l.set) && <span className="absence-loot-effect small">{l.effect ?? `Ensemble : ${l.set}`}</span>}
          </span>
        </div>
      ))}
      {sorted.length > 4 && <p className="muted small">Et {sorted.length - 4} autre{sorted.length > 5 ? 's' : ''} : dans le journal et le sac d’équipement.</p>}
    </div>
  );
}

/** S'ouvre seule au retour du joueur ; reste consultable depuis le journal. */
export function AbsenceModal({ summary }: { summary: AdvanceSummary }) {
  const { content, dismissAbsence } = useGame();
  const { settings } = content;
  const profession = (id: string) => content.professions.find((p) => p.id === id)?.name ?? id;

  const stats: { value: number; label: string; color: string }[] = [
    ...Object.entries(summary.produced).map(([id, q]) => ({
      value: q,
      label: content.items[id]?.name ?? id,
      color: 'var(--action)',
    })),
    ...Object.entries(summary.xp).map(([id, xp]) => ({ value: xp, label: `XP de ${profession(id)}`, color: 'var(--text)' })),
    ...summary.levelUps.map((l) => ({ value: l.to, label: `niveau de ${profession(l.skill)}`, color: 'var(--good)' })),
    // Combat (absent des résumés enregistrés avant l'ajout du combat).
    ...(summary.combat?.fights ? [{ value: summary.combat.wins, label: `combat${summary.combat.wins > 1 ? 's' : ''} gagné${summary.combat.wins > 1 ? 's' : ''}`, color: 'var(--alert)' }] : []),
    ...Object.entries(summary.combat?.xp ?? {}).map(([id, xp]) => ({ value: xp, label: `XP de ${content.classes[id]?.name ?? id}`, color: 'var(--text)' })),
    ...(summary.combat?.levelUps ?? []).map((l) => ({ value: l.to, label: `niveau de ${content.classes[l.classId]?.name ?? l.classId}`, color: 'var(--good)' })),
  ].slice(0, 6);

  const capReached = summary.time.capped > 0;
  const explanation = [
    summary.time.offline > 0
      ? `Hors ligne, vos activités ont tourné à ${pct(settings.rates.offline)} de leur vitesse.`
      : 'Vos activités ont tourné à pleine vitesse.',
    capReached
      ? `Le plafond de ${settings.rates.offlineCapHours} h a été atteint : au-delà, rien n’a avancé, mais rien n’a été perdu.`
      : `Le plafond de ${settings.rates.offlineCapHours} h n’est pas atteint : rien n’a été perdu.`,
  ].join(' ');

  return (
    <Modal onClose={dismissAbsence}>
      <div className="eyebrow">Bon retour · absent {duration(summary.to - summary.from)}</div>
      <h2>Pendant votre absence</h2>
      {summary.combat?.notable?.length ? <NotableList loot={summary.combat.notable} /> : null}
      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <strong style={{ color: s.color }}>{num(s.value)}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      {summary.finished.map((f) => (
        <p className="muted" key={f.recipeId}>
          {f.reason === 'completed' ? 'Terminé' : 'Arrêté faute d’ingrédients'} : {content.recipes[f.recipeId]?.name}
          {' '}({num(f.done)}).
        </p>
      ))}
      <p className="muted">{explanation}</p>
      <div>
        <button className="btn btn-primary" onClick={dismissAbsence} autoFocus>
          Continuer
        </button>
      </div>
    </Modal>
  );
}
