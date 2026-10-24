import { useEffect, useState } from 'react';
import type { PowerNodeView, PowerSystemView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { useNow } from '../game/useLive';
import { bigNum, duration, num } from '../format';
import { ItemIcon } from '../components/ui';
import { Scene } from '../components/Scene';

/**
 * Salle Puissance (docs/design/puissance.md) : en haut la **Force**, le grand nombre qui résume tout (classe, équipement,
 * build, systèmes) ; en bas un onglet par système de progression (recherches de la Guilde, reliques, lanterne, points forts
 * de la classe), nœud par nœud : son niveau, ce qu'il donne, ce que coûte le suivant, ce qui l'empêche.
 */
export function PowerRoom() {
  const { state } = useGame();
  const power = state.power;
  const [tab, setTab] = useState<string | null>(null);
  if (!power) return <main className="room power-room"><section className="panel pw-panel"><p className="muted">Pas de système de Puissance.</p></section></main>;
  const systems = power.systems;
  const current = systems.find((s) => s.id === tab) ?? systems.find((s) => s.open) ?? systems[0]!;
  const gain = power.force && power.withoutSystems ? power.force / power.withoutSystems : 1;
  return (
    <main className="room power-room">
      <section className="panel band pw-band">
        <Scene ids={['enchanting']} />
        <div className="pw-force">
          <span className="pw-force-label">Force</span>
          <strong className="pw-force-value">{power.force === null ? '—' : bigNum(power.force)}</strong>
          <span className="pw-force-sub">
            {gain > 1.005 && power.withoutSystems !== null
              ? `${bigNum(power.withoutSystems)} par la classe, l'équipement et le build · ×${gain.toFixed(2).replace('.', ',')} grâce aux systèmes`
              : 'Classe, équipement, build : les systèmes ci-dessous la font monter encore.'}
          </span>
        </div>
        <p className="pw-hint">Tout ce qui te rend plus fort, en un seul nombre. Chaque palier de vraie force la multiplie par près de 2.</p>
      </section>
      <section className="panel pw-panel">
        <div className="pw-tabs" role="tablist">
          {systems.map((s) => (
            <button key={s.id} role="tab" aria-selected={s.id === current.id} className={s.open ? '' : 'locked'} onClick={() => setTab(s.id)}>
              {s.name}
              {!s.open && <small> · niv. {s.unlockLevel}</small>}
              {s.nodes.some((n) => n.pendingUntil) && <span className="pw-dot" title="Recherche en cours" />}
            </button>
          ))}
        </div>
        <SystemPane key={current.id} system={current} />
      </section>
    </main>
  );
}

function SystemPane({ system }: { system: PowerSystemView }) {
  if (!system.open) {
    return (
      <div className="pw-locked">
        <p>{system.text}</p>
        <p className="muted">S'ouvre au niveau {system.unlockLevel} de classe.</p>
      </div>
    );
  }
  if (system.kind === 'innate') {
    return (
      <div className="pw-innate">
        {system.text && <p className="muted">{system.text}</p>}
        {system.nodes.map((n) => (
          <div key={n.id} className="pw-innate-row">
            <strong>{n.name}</strong>
            <span>{n.text}</span>
          </div>
        ))}
        {!system.nodes.length && <p className="muted">Ta classe n'a pas de point fort ici.</p>}
      </div>
    );
  }
  // Les nœuds rangés : par branche (recherches), ou les nœuds simples puis les choix par paire.
  const groups = new Map<string, PowerNodeView[]>();
  for (const n of system.nodes) {
    const key = n.group ?? (n.choice ? `choice:${n.choice}` : '');
    groups.set(key, [...(groups.get(key) ?? []), n]);
  }
  return (
    <div className="pw-system">
      {system.text && <p className="muted pw-system-text">{system.text}{system.kind === 'research' ? ` Une recherche à la fois.` : ''}</p>}
      <div className={`pw-groups pw-${system.kind}`}>
        {[...groups].map(([key, nodes]) => (
          <div key={key} className={key.startsWith('choice:') ? 'pw-choice' : 'pw-group'}>
            {key && !key.startsWith('choice:') && <h3>{key}</h3>}
            {key.startsWith('choice:') && <h3>Un choix : l'un ou l'autre</h3>}
            <div className="pw-nodes">
              {nodes.map((n) => (
                <NodeCard key={n.id} system={system} node={n} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeCard({ system, node }: { system: PowerSystemView; node: PowerNodeView }) {
  const { act, state, content } = useGame();
  const now = useNow(1000);
  const pending = node.pendingUntil && node.pendingUntil > now ? node.pendingUntil : null;
  // Une recherche qui vient de finir : on redemande l'état au serveur pour la voir comptée.
  useEffect(() => {
    if (!node.pendingUntil) return;
    const wait = node.pendingUntil - Date.now() + 500;
    if (wait <= 0) return;
    const id = window.setTimeout(() => void act(() => api.state()), wait);
    return () => window.clearTimeout(id);
  }, [node.pendingUntil, act]);
  const maxed = node.level >= node.maxLevel;
  const taken = node.choice ? node.level > 0 : false;
  const timed = !!node.next && node.next.seconds > 0;
  const label = timed ? 'Rechercher' : node.level === 0 && node.choice ? 'Choisir' : node.level === 0 ? 'Débloquer' : 'Améliorer';
  return (
    <article className={`pw-node${maxed ? ' maxed' : ''}${taken ? ' taken' : ''}${node.level === 0 ? ' empty' : ''}`}>
      <header>
        <strong>{node.name}</strong>
        <span className="pw-level">
          {node.maxLevel > 1 ? `${node.level} / ${node.maxLevel}` : node.level ? 'acquis' : ''}
        </span>
      </header>
      {node.maxLevel > 1 && (
        <div className="pw-pips" aria-hidden>
          <span style={{ width: `${(100 * node.level) / node.maxLevel}%` }} />
        </div>
      )}
      {node.text && <p className="pw-text">{node.text}</p>}
      {/* Le texte du nœud dit déjà ce que fait son talent : ici, seulement s'il est actif ou à quel niveau il le sera. */}
      {node.talents.map((t) => (
        <p key={t.name} className={`pw-talent${node.level >= t.level ? ' on' : ''}`}>
          {node.level >= t.level ? '✦ Talent actif' : `Talent au niveau ${t.level}`}
        </p>
      ))}
      {pending ? (
        <div className="pw-pending">
          <span>Recherche en cours · {duration(pending - now)}</span>
        </div>
      ) : node.next && !maxed ? (
        <footer>
          <div className="pw-cost">
            {node.next.gold > 0 && <span className={state.gold < node.next.gold ? 'short' : ''}>{num(node.next.gold)} or</span>}
            {node.next.items.map((c) => (
              <span key={c.item} className={`pw-cost-item${c.have < c.qty ? ' short' : ''}`} title={`${c.name} : ${num(c.have)} / ${num(c.qty)}`}>
                <ItemIcon item={content.items[c.item]} small />
                {num(c.qty)}
              </span>
            ))}
            {timed && <span className="muted">⏱ {duration(node.next.seconds * 1000)}</span>}
          </div>
          <button className="primary" disabled={!!node.blocker} onClick={() => void act(() => api.powerUpgrade(system.id, node.id))}>
            {label}
          </button>
          {node.blocker && <small className="pw-blocker">{node.blocker}</small>}
        </footer>
      ) : null}
    </article>
  );
}
