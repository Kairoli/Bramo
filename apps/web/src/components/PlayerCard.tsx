import { type CSSProperties, useEffect, useState } from 'react';
import type { PlayerProfile } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { Character } from '../rig/Character';
import { GearIcon } from './GearIcon';
import { OrnamentPlate, ornamentTitle } from './Ornament';
import { Modal } from './ui';
import { Avatar } from './Avatar';

/**
 * Fiche d'un autre joueur (clic sur un personnage du bourg ou du clan, demande de Louis du 23 octobre) : le personnage en
 * pied avec son ornement, sa classe et son niveau, ce qu'il porte, ses meilleurs métiers, son clan. Sans surcharger : les
 * six meilleurs métiers, l'équipement en icônes.
 */

const RANK: Record<string, string> = { leader: 'chef', officer: 'officier', member: 'membre' };
const SLOTS = ['head', 'torso', 'hands', 'legs', 'feet', 'weapon', 'cape', 'belt', 'necklace', 'ring'];

export function PlayerCard({ id, onClose }: { id: number; onClose: () => void }) {
  const { content, characterId, flash } = useGame();
  const [p, setP] = useState<PlayerProfile | null | undefined>(undefined);
  useEffect(() => {
    api.player(id).then(setP).catch(() => setP(null));
  }, [id]);
  const cls = p?.classId ? content.classes[p.classId] : undefined;
  const ornament = p?.ornament ? content.ornaments[p.ornament] : undefined;

  return (
    <Modal onClose={onClose} className="player-modal">
      {p === undefined ? (
        <p className="muted">Chargement…</p>
      ) : p === null ? (
        <p className="muted">Ce joueur est introuvable.</p>
      ) : (
        <div className="player-card" style={{ '--cc': cls?.affinityColor ?? 'var(--magic)' } as CSSProperties}>
          <div className="player-figure">
            {ornament ? <OrnamentPlate ornament={ornament} name={p.name} title={ornamentTitle(ornament, content)} width={260} className="player-plate" /> : <h2>{p.name}</h2>}
            <div className="player-rig">{cls && <Character appearance={{ classId: cls.id, outfit: p.outfit ?? cls.startingOutfit }} lod="scene" centered />}</div>
            <span className="muted small">{p.doing ? `En train de : ${p.doing}` : 'Ne fait rien pour le moment'}</span>
          </div>
          <div className="player-info">
            <div className="player-photo">
              <Avatar id={p.id} version={p.avatar} name={p.name} classId={p.classId} appearance={cls ? { classId: cls.id, outfit: p.outfit ?? cls.startingOutfit } : null} size={72} />
              <span>
                <strong>{p.name}</strong>
                {p.avatar && p.id !== characterId && (
                  <button className="link small" onClick={() => void api.reportAvatar(p.id).then(() => flash('Photo signalée. Merci.'))}>
                    Signaler la photo
                  </button>
                )}
              </span>
            </div>
            {!ornament && p.nickname && <span className="player-nick">{p.nickname}</span>}
            {p.clan && (
              <span className="chip" style={{ color: 'var(--clan)', borderColor: 'var(--clan)' }}>
                {p.clan.name} · {RANK[p.clan.rank]}
              </span>
            )}
            {cls && (
              <div className="class-badge static">
                <span className="class-level">
                  <small>Niv.</small>
                  {p.classLevel}
                </span>
                <span className="class-text">
                  <strong>{cls.name}</strong>
                  <span className="muted">{p.path ?? 'sans voie'}</span>
                </span>
              </div>
            )}
            {p.otherClasses.length > 0 && (
              <span className="muted small">Aussi : {p.otherClasses.map((c) => `${content.classes[c.classId]?.name} ${c.level}`).join(', ')}</span>
            )}

            <span className="eyebrow">Équipement</span>
            <div className="player-gear">
              {SLOTS.flatMap((slot) => {
                const pieces = p.gear.filter((g) => g.slot === slot);
                return (pieces.length ? pieces : [null]).map((g, i) =>
                  g ? (
                    <span key={`${slot}${i}`} className="gear-tile static" style={{ '--rc': `var(--r-${g.rarity})` } as CSSProperties} title={`${g.masterpiece ? 'Chef-d’œuvre ' : ''}${g.name} · palier ${g.tier}`}>
                      <GearIcon slot={g.slot} family={g.family} tier={g.tier} rarity={g.rarity} size={40} />
                    </span>
                  ) : (
                    <span key={slot} className="gear-tile empty static" />
                  ),
                );
              })}
            </div>

            <span className="eyebrow">Métiers · niveau total {p.totalLevel}</span>
            <div className="player-skills">
              {p.skills.length === 0 && <span className="muted small">Pas encore de métier au-delà du niveau 1.</span>}
              {p.skills.slice(0, 6).map((s) => (
                <span key={s.profession} className="player-skill">
                  <strong>{s.level}</strong>
                  <span>{content.professions.find((x) => x.id === s.profession)?.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
