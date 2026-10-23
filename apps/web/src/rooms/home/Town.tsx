import { useMemo, useState, type CSSProperties } from 'react';
import type { TownEvent, TownPlayer } from '@bramo/shared';
import { useGame } from '../../game/GameContext';
import { useTown } from '../../game/useTown';
import { Character } from '../../rig/Character';
import { hhmm } from '../../format';
import { Scene } from '../../components/Scene';
import { PlayerCard } from '../../components/PlayerCard';
import { Avatar } from '../../components/Avatar';

/** Où se tient quelqu'un qui pratique ce métier (en % de la largeur ; centre de l'image, jamais recadré). */
const WORKPLACES: Record<string, number> = {
  mining: 24,
  woodcutting: 31,
  herbalism: 38,
  smithing: 46,
  carpentry: 54,
  cooking: 62,
  fishing: 72,
};

const KIND: Record<TownEvent['kind'], { label: string; color: string }> = {
  level: { label: 'Niveau', color: 'var(--good)' },
  trial: { label: 'Épreuve', color: 'var(--clan)' },
  first: { label: 'Première', color: 'var(--event)' },
  join: { label: 'Arrivée', color: 'var(--action)' },
  clan: { label: 'Clan', color: 'var(--clan)' },
  loot: { label: 'Trouvaille', color: 'var(--magic)' },
  tide: { label: 'Marée', color: 'var(--event)' },
};

/** Hachage stable d'un identifiant, pour des mouvements différents d'un joueur à l'autre. */
const spread = (id: number, mod: number) => ((id * 2654435761) >>> 0) % mod;

/** Un joueur dans la scène : au travail près de son lieu, ou en promenade s'il ne fait rien. */
function Walker({ p, slot, onOpen }: { p: TownPlayer; slot: number; onOpen: () => void }) {
  const place = p.doingProfession ? WORKPLACES[p.doingProfession] : undefined;
  const working = place !== undefined;
  const depth = spread(p.id, 3); // 0, 1, 2 : un peu d'étagement vertical
  const style = {
    '--x': working ? `${Math.min(94, Math.max(3, place! + (slot % 3) * 4 - 4))}%` : `${10 + spread(p.id + 3, 80)}%`,
    '--dur': `${70 + spread(p.id, 50)}s`,
    '--delay': `-${spread(p.id + 7, 100)}s`,
    '--dy': `${depth * 7}px`,
    zIndex: 3 - depth,
  } as React.CSSProperties;
  return (
    <div className={`walker clickable ${working ? 'walker-working' : 'walker-strolling'}`} style={style} onClick={onOpen} role="button" tabIndex={0} title={`Voir la fiche de ${p.name}`}>
      <div className="walker-card">
        <span className="walker-card-who">
          <Avatar id={p.id} version={p.avatar} name={p.name} classId={p.classId} size={28} />
          <strong>{p.name}</strong>
        </span>
        <span>
          {p.nickname}
          {p.profession ? ` · niveau ${p.level}` : ''}
        </span>
        <span className="muted">{p.doing ?? 'se promène'}</span>
      </div>
      <Character appearance={{ classId: p.classId, outfit: p.outfit }} lod="scene" title={p.name} crowd />
      <span className="walker-name">{p.name}</span>
    </div>
  );
}

/** Habitants de passage : en attendant plus de monde, des silhouettes animent le bourg (client seulement, jamais comptées comme joueurs). */
const VILLAGERS = { standing: 3, strolling: 4 } as const;
const VILLAGER_NAMES = [
  'Aubin', 'Mirelle', 'Garance', 'Thibault', 'Odile', 'Lucan', 'Bérénice', 'Ysmaël', 'Clotilde', 'Hadrien', 'Nérine', 'Baudoin',
  'Solenne', 'Armel', 'Perrine', 'Gaspard', 'Ysaline', 'Cordélia', 'Renaud', 'Maëlys', 'Tancrède', 'Elouan', 'Soline', 'Faustin',
];

interface Villager {
  key: string;
  name: string;
  classId: string;
  outfit: string;
  mode: 'standing' | 'strolling';
  style: CSSProperties;
  pausing: boolean;
}

/**
 * Tire les habitants une fois par visite. Ceux qui restent sur place sont espacés (au moins 16 % de la largeur entre eux
 * et loin des joueurs qui travaillent) ; ceux qui flânent ont des couloirs de profondeur, des vitesses et des départs
 * différents, certains s'arrêtent un moment en chemin.
 */
function useVillagers(classes: Record<string, { startingOutfit: string }>, outfits: { id: string; classes?: string[]; locked?: unknown }[], busy: number[]): Villager[] {
  return useMemo(() => {
    const ids = Object.keys(classes);
    if (!ids.length) return [];
    const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]!;
    const between = (a: number, b: number) => a + Math.random() * (b - a);
    const names = [...VILLAGER_NAMES].sort(() => Math.random() - 0.5);
    // Les classes tournent dans un ordre mélangé : pas de bourg peuplé d'une seule classe.
    const order = [...ids].sort(() => Math.random() - 0.5);
    let turn = 0;
    const look = () => {
      const classId = order[turn++ % order.length]!;
      const pool = outfits.filter((o) => !o.locked && !o.id.startsWith('sketch_') && o.classes?.includes(classId)).map((o) => o.id);
      return { classId, outfit: Math.random() < 0.6 || !pool.length ? classes[classId]!.startingOutfit : pick(pool) };
    };
    const out: Villager[] = [];

    // Sur place : des emplacements espacés, mélangés, que les joueurs au travail ne gênent pas.
    const slots: number[] = [];
    for (let x = 18; x <= 84; x += 16) if (busy.every((b) => Math.abs(b - x) > 10)) slots.push(x);
    slots.sort(() => Math.random() - 0.5);
    const taken = [...busy];
    slots.slice(0, VILLAGERS.standing).forEach((x, i) => {
      taken.push(x);
      out.push({
        key: `s${i}`,
        name: names.pop()!,
        ...look(),
        mode: 'standing',
        pausing: false,
        style: { '--x': `${x + between(-3, 3)}%`, '--dy': `${(i % 3) * 11}px`, '--shrink': `${(i % 3) * 2.5}%`, zIndex: 3 - (i % 3) } as CSSProperties,
      });
    });

    // Position de repos d'un flâneur (sans animation) : la plus éloignée possible des autres.
    const restSpot = () => {
      const free = [];
      for (let x = 10; x <= 90; x += 4) free.push(x);
      free.sort((a, b) => Math.min(...taken.map((t) => Math.abs(t - b)), 99) - Math.min(...taken.map((t) => Math.abs(t - a)), 99) + (Math.random() - 0.5) * 6);
      const x = free[0]!;
      taken.push(x);
      return x;
    };

    // En promenade : un couloir chacun, des durées et des départs différents.
    for (let i = 0; i < VILLAGERS.strolling; i++) {
      const lane = i % 3;
      const dur = between(60, 130);
      out.push({
        key: `w${i}`,
        name: names.pop()!,
        ...look(),
        mode: 'strolling',
        pausing: i % 2 === 0,
        style: {
          '--x': `${restSpot()}%`,
          '--stop': `${between(24, 76)}%`,
          '--dur': `${dur}s`,
          '--delay': `-${between(0, dur)}s`,
          '--dy': `${lane * 11}px`,
          '--shrink': `${lane * 2.5}%`,
          zIndex: 3 - lane,
        } as CSSProperties,
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(classes).join(), busy.join()]);
}

function VillagerFigure({ v }: { v: Villager }) {
  return (
    <div className={`walker walker-${v.mode === 'standing' ? 'working' : 'strolling'}${v.pausing ? ' walker-pause' : ''}`} style={v.style}>
      <div className="walker-card">
        <strong>{v.name}</strong>
        <span className="muted">Habitant du bourg</span>
      </div>
      <Character appearance={{ classId: v.classId, outfit: v.outfit }} lod="scene" title={v.name} crowd />
      <span className="walker-name">{v.name}</span>
    </div>
  );
}

export function Town() {
  const { openMarket, name, content } = useGame();
  const town = useTown();
  const [onlyMine, setOnlyMine] = useState(false);
  const [profile, setProfile] = useState<number | null>(null);
  const others = useMemo(() => (town?.players ?? []).filter((p) => !p.self), [town]);
  // Positions (en %) des vrais joueurs qui travaillent, pour que les habitants ne se mettent pas dessus.
  const busy = useMemo(() => others.flatMap((p, i) => (p.doingProfession && WORKPLACES[p.doingProfession] !== undefined ? [WORKPLACES[p.doingProfession]! + (i % 3) * 4 - 4] : [])), [others]);
  const villagers = useVillagers(content.classes, content.cosmetics.outfits, busy);
  const feed = useMemo(() => (town?.feed ?? []).filter((e) => !onlyMine || e.text.includes(name)), [town, onlyMine, name]);

  return (
    <section className="panel world town">
      <div className="town-scene">
        <Scene ids={['town']} position="50% 50%" shade={false} />
        <div className="town-walkers" aria-label="Joueurs dans le bourg">
          {others.map((p, i) => (
            <Walker key={p.id} p={p} slot={i} onOpen={() => setProfile(p.id)} />
          ))}
          {villagers.map((v) => (
            <VillagerFigure key={v.key} v={v} />
          ))}
        </div>
        <div className="town-title">
          <strong>Bramo</strong>
          <span className="muted">
            {others.length ? `${others.length} autre${others.length > 1 ? 's' : ''} joueur${others.length > 1 ? 's' : ''} dans le bourg` : 'le bourg est tranquille'}
          </span>
        </div>
      </div>

      <aside className="sunken world-info town-board">
        <div className="eyebrow" style={{ color: 'var(--clan)' }}>
          Panneau du bourg
        </div>
        <h2>Fil du serveur</h2>
        <div className="muted small">
          {town ? `${town.online} actif${town.online > 1 ? 's' : ''} · ${town.total} personnage${town.total > 1 ? 's' : ''}` : 'Chargement…'}
        </div>
        <div className="town-feed scroll">
          {feed.length === 0 && <p className="muted small">Rien à annoncer pour le moment. Les montées de niveau, les épreuves réussies et les premières fabrications apparaissent ici.</p>}
          {feed.map((e) => (
            <p key={e.id} className="town-line">
              <span className="journal-time">{hhmm(e.at)}</span>
              <span style={{ color: KIND[e.kind].color, fontWeight: 600 }}>{KIND[e.kind].label} </span>
              {e.text}
            </p>
          ))}
        </div>
        <div className="world-actions">
          <label className="small muted town-filter">
            <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> Mes annonces seulement
          </label>
          <button className="btn" onClick={() => openMarket()}>
            Aller au marché
          </button>
        </div>
      </aside>
      {profile !== null && <PlayerCard id={profile} onClose={() => setProfile(null)} />}
    </section>
  );
}
