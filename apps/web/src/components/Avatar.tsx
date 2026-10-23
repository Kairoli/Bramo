import { type CSSProperties, useState } from 'react';
import type { Appearance } from '@bramo/shared';
import { useContent } from '../game/ContentContext';
import { Character } from '../rig/Character';
import { useOpenProfile } from './ProfileLink';

/**
 * Photo de profil d'un joueur [demande de Louis, 23 octobre : « elle apparaît partout où le personnage est présent »] :
 * un carré aux coins arrondis (on garde plus d'une image d'anime qu'en rond, et il s'accorde aux tuiles du jeu ; un cadre
 * cosmétique pourra l'entourer plus tard). Sans photo, le portrait du personnage, ou à défaut l'initiale dans la couleur
 * de sa classe.
 */
export function Avatar({
  id,
  version,
  name,
  classId,
  appearance,
  size = 40,
  className,
  open = true,
}: {
  id: number | null;
  version: number | null | undefined;
  name: string;
  classId?: string | null;
  appearance?: Appearance | null;
  size?: number;
  className?: string;
  /** Un clic ouvre la page profil du joueur (dans le jeu). */
  open?: boolean;
}) {
  const content = useContent();
  const [broken, setBroken] = useState(false);
  const color = (classId && content.classes[classId]?.affinityColor) || 'var(--text-muted)';
  const opener = useOpenProfile();
  const clickable = open && opener && id !== null && id > 0;
  const style = { '--av': `${size}px`, '--av-color': color } as CSSProperties;
  return (
    <span
      className={`avatar${clickable ? ' clickable' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      title={clickable ? `Voir la page de ${name}` : name}
      {...(clickable && {
        role: 'button',
        tabIndex: 0,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          opener(id);
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter') opener(id);
        },
      })}
    >
      {id !== null && id > 0 && version && !broken ? (
        <img src={`/api/avatars/${id}?v=${version}`} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
      ) : appearance ? (
        <Character appearance={appearance} lod="portrait" animate={false} />
      ) : (
        <span className="avatar-letter">{name.trim().charAt(0).toUpperCase() || '?'}</span>
      )}
    </span>
  );
}
