import { useEffect, useMemo, useRef, useState } from 'react';
import type { Appearance, TimelineEvent } from '@bramo/shared';
import { api } from '../api';
import { useContent } from '../game/ContentContext';
import { CombatStage, type StageSpell, attackLead, fxOf, leadOf } from '../components/CombatStage';
import { Scene } from '../components/Scene';

type ArenaSpell = StageSpell & { id: string; class: string; level: number; path: string | null };

/**
 * Arène (/#arene, développement) : la scène de combat sans serveur de jeu, pour voir et régler chaque sort à l'œil.
 * Les boutons ajoutent des événements au déroulé, comme ceux que le serveur envoie.
 */
export function Arena() {
  const content = useContent();
  const classes = Object.values(content.classes);
  const [classId, setClassId] = useState(classes[0]?.id ?? 'runist');
  const look: Appearance = useMemo(() => ({ classId, outfit: content.classes[classId]?.startingOutfit ?? content.cosmetics.default.outfit }), [classId, content]);
  const [all, setAll] = useState<ArenaSpell[]>([]);
  useEffect(() => {
    api.combatSpells().then((r) => setAll(r.spells)).catch(() => setAll([]));
  }, []);
  const spells = useMemo(() => Object.fromEntries(all.map((s) => [s.id, s])), [all]);
  const mine = all.filter((s) => s.class === classId).sort((a, b) => (a.path ?? '').localeCompare(b.path ?? '') || a.level - b.level);

  // Horloge réglable : vitesse (ralenti, pause) et saut à un instant précis (window.__arena.at(t), pour régler une image).
  const base = useRef({ real: performance.now(), clock: 0, scale: 1 });
  const [scale, setScaleState] = useState(1);
  const clock = () => base.current.clock + ((performance.now() - base.current.real) / 1000) * base.current.scale;
  const setScale = (s: number, at = clock()) => {
    base.current = { real: performance.now(), clock: at, scale: s };
    setScaleState(s);
  };
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [end, setEnd] = useState<{ t: number; win: boolean } | null>(null);
  const [count, setCount] = useState(1);
  (window as unknown as { __arena: unknown }).__arena = {
    at: (t: number) => setScale(0, t),
    play: (s = 1) => setScale(s),
    clock,
    events,
    /** Un seul sort, son coup à t = 2 s : `at(2 - lead + x)` montre l'instant x de son geste. */
    only: (spell: string | null, crit = false) => {
      const e: TimelineEvent = spell ? { t: 2, kind: 'cast', spell, hp: 0.8, dmg: 420, self: 1 } : { t: 2, kind: 'basic', hp: 0.8, dmg: 260, self: 1, ...(crit ? { crit: true } : {}) };
      setEvents([e]);
      setEnd(null);
      return spell ? leadOf(fxOf(classId, e)) : attackLead(classId);
    },
    setClass: (id: string) => setClassId(id),
    setCount: (n: number) => setCount(n),
  };

  const hp = () => events.reduce((h, e) => (e.t <= clock() + 3 && e.hp !== undefined ? e.hp : h), 1);
  const restart = () => {
    base.current = { real: performance.now(), clock: 0, scale: base.current.scale };
    setEnd(null);
  };
  /** Ajoute une action du personnage qui commence maintenant (le coup porte après sa préparation). */
  const cast = (e: Omit<TimelineEvent, 't'>) => {
    const lead = e.kind === 'cast' ? leadOf(fxOf(classId, { ...e, t: 0 })) : attackLead(classId);
    const dmg = Math.round(200 + Math.random() * 300) * (e.crit ? 2 : 1);
    setEvents((xs) => [...xs, { ...e, t: clock() + lead + 0.05, hp: Math.max(0.03, hp() - 0.06), dmg, self: 1 }].sort((a, b) => a.t - b.t));
  };
  const enemyAct = (e: Omit<TimelineEvent, 't'>, delay: number) => setEvents((xs) => [...xs, { ...e, t: clock() + delay }].sort((a, b) => a.t - b.t));
  /** Tous les sorts de la classe l'un après l'autre. */
  const showcase = () => {
    restart();
    const xs: TimelineEvent[] = [];
    let t = 0.4;
    let h = 1;
    for (const s of mine) {
      const fx = fxOf(classId, { t: 0, kind: 'cast', spell: s.id });
      t += leadOf(fx);
      xs.push({ t, kind: 'cast', spell: s.id, hp: (h = Math.max(0.05, h - 0.04)), dmg: Math.round(300 + 400 * Math.random()), self: 1 });
      t += Math.max(1.4, (fx.after ?? 0.9) + 0.6);
    }
    setEvents(xs);
  };
  /** Un combat d'essai : attaques de base, quelques sorts, coups ennemis, une victoire. */
  const demo = () => {
    restart();
    const xs: TimelineEvent[] = [];
    let h = 1;
    let self = 1;
    for (let t = 1.2; t < 15; t += 1.9) xs.push({ t, kind: 'basic', hp: (h = Math.max(0.02, h - 0.06)), dmg: 240, self, ...(Math.round(t * 10) % 3 === 0 ? { crit: true, dmg: 520 } : {}) });
    mine.slice(0, 4).forEach((s, j) => xs.push({ t: 2.6 + j * 3.1, kind: 'cast', spell: s.id, hp: (h = Math.max(0.02, h - 0.08)), dmg: 410, self }));
    for (let t = 2.3; t < 15; t += 2.7) xs.push({ t, kind: 'attack', dmg: 180, self: (self = Math.max(0.2, self - 0.07)) });
    xs.push({ t: 11.5, kind: 'charge', dmg: 420, self: (self = Math.max(0.15, self - 0.15)) });
    xs.push({ t: 16, kind: 'kill', hp: 0 });
    setEvents(xs.sort((a, b) => a.t - b.t));
    setEnd({ t: 16, win: true });
  };
  const reset = () => {
    restart();
    setEvents([]);
  };

  return (
    <div className="arena">
      <section className="panel band arena-band">
        <Scene ids={['combat']} />
        <CombatStage look={look} enemy={{ count, kind: 'shadow' }} timeline={events} clock={clock} fightTime={end?.t ?? null} win={end?.win ?? null} spells={spells} timeScale={scale} />
      </section>
      <section className="panel arena-tools scroll">
        <div className="row-gap">
          {classes.map((c) => (
            <button key={c.id} className={`btn btn-sm${c.id === classId ? ' btn-primary' : ''}`} onClick={() => { setClassId(c.id); reset(); }}>
              {c.name}
            </button>
          ))}
          <span className="muted small">Ennemis</span>
          {[1, 2, 3].map((n) => (
            <button key={n} className={`btn btn-sm${n === count ? ' btn-primary' : ''}`} onClick={() => setCount(n)}>
              {n}
            </button>
          ))}
          <span className="muted small">Vitesse</span>
          {[1, 0.5, 0.25, 0].map((s) => (
            <button key={s} className={`btn btn-sm${s === scale ? ' btn-primary' : ''}`} onClick={() => setScale(s)}>
              {s === 0 ? 'Pause' : `×${String(s).replace('.', ',')}`}
            </button>
          ))}
        </div>
        <div className="row-gap">
          <button className="btn btn-sm" onClick={() => cast({ kind: 'basic' })}>Attaque de base</button>
          <button className="btn btn-sm" onClick={() => cast({ kind: 'basic', crit: true })}>Critique</button>
          <button className="btn btn-sm" onClick={() => enemyAct({ kind: 'attack', dmg: 180, self: 0.8 }, 0.4)}>Coup ennemi</button>
          <button className="btn btn-sm" onClick={() => enemyAct({ kind: 'charge', dmg: 420, self: 0.6 }, 1.3)}>Attaque chargée</button>
          <button className="btn btn-sm" onClick={() => enemyAct({ kind: 'break' }, 0.1)}>Rupture</button>
          <button className="btn btn-sm" onClick={() => enemyAct({ kind: 'kill', hp: 0 }, 0.1)}>Vaincre</button>
          <button className="btn btn-sm btn-primary" onClick={showcase}>Tous les sorts</button>
          <button className="btn btn-sm" onClick={demo}>Combat d’essai</button>
          <button className="btn btn-sm" onClick={reset}>Remettre à zéro</button>
        </div>
        <div className="arena-spells">
          {mine.map((s) => (
            <button key={s.id} className="btn btn-sm" onClick={() => cast({ kind: 'cast', spell: s.id })} title={`${s.id} · niveau ${s.level}${s.path ? ` · ${s.path}` : ''}`}>
              {s.name}
            </button>
          ))}
        </div>
        <p className="muted small">Développement : la scène rejoue un déroulé comme celui du serveur. Le coup porte à l’instant de l’événement ; le geste commence avant (préparation et trajet).</p>
      </section>
    </div>
  );
}
