import type { AdvanceSummary } from '@bramo/shared';
import { useGame } from '../game/GameContext';
import { duration, num, pct } from '../format';
import { Modal } from './ui';

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
