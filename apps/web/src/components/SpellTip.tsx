import type { ReactElement } from 'react';
import type { SpellView } from '@bramo/shared';
import { SpellIcon } from './SpellIcon';
import { TipFoot, TipHead, TipLine } from './Tip';
import { PoolText } from './PoolGauges';

/** Ce qu'un sort fait, en bulle : élément, recharge, cibles, effets en mots simples ; même s'il n'est pas encore appris. */

const ELEMENT: Record<string, { name: string; color: string }> = {
  physical: { name: 'Physique', color: '#d8cfc0' },
  fire: { name: 'Feu', color: '#ff8a4b' },
  frost: { name: 'Givre', color: '#8fd3ff' },
  lightning: { name: 'Foudre', color: '#c7a6ff' },
};

export function SpellTipContent({ s, classId, level, pathName }: { s: SpellView; classId: string; level: number; pathName?: string | null }) {
  const el = s.element === 'inherit' ? null : ELEMENT[s.element];
  const e = s.effects;
  const ult = s.tags.includes('ultimate');
  const chips = [
    el && (
      <span key="el" className="tip-chip" style={{ color: el.color }}>
        {el.name}
      </span>
    ),
    <span key="cd" className="tip-chip">
      recharge {s.cooldown} s
    </span>,
    e.targets > 1 && (
      <span key="t" className="tip-chip">
        {e.targets} cibles
      </span>
    ),
    ult && (
      <span key="u" className="tip-chip gold">
        Ultime
      </span>
    ),
  ].filter(Boolean) as ReactElement[];
  return (
    <>
      <TipHead
        icon={<SpellIcon id={s.id} classId={classId} element={el ? (s.element as 'fire') : undefined} ultimate={ult} size={40} dim={!s.available} />}
        title={s.name}
        sub={pathName ? `Voie ${pathName} · niveau ${s.level}` : `Niveau ${s.level}`}
        color={el?.color}
        chips={chips}
      />
      <div className="tip-body">
        <TipLine mark="✦">
          <PoolText text={s.text} />
        </TipLine>
        {e.shield !== undefined && <TipLine color="#8fd3ff" mark="◈">Protège pendant {e.shield} s</TipLine>}
        {e.heal && <TipLine color="var(--good)" mark="✚">Soigne</TipLine>}
        {e.dot && <TipLine color="#ff8a4b" mark="♨">{e.dot.type === 'burn' ? 'Brûlure' : 'Saignement'} pendant {e.dot.duration} s</TipLine>}
        {e.slow !== undefined && <TipLine color="#8fd3ff" mark="❄">Ralentit les attaques ennemies {e.slow} s</TipLine>}
        {e.stun !== undefined && <TipLine color="#ffd36b" mark="✶">Étourdit {e.stun} s</TipLine>}
        {e.mark !== undefined && <TipLine color="var(--good)" mark="◎">Marque la cible {e.mark} s : elle subit plus de dégâts</TipLine>}
        {e.weaken !== undefined && <TipLine color="#c7a6ff" mark="↓">Affaiblit la cible {e.weaken} s : elle frappe moins fort</TipLine>}
        {e.antiheal !== undefined && <TipLine color="var(--alert)" mark="⊘">Coupe les soins ennemis {e.antiheal} s</TipLine>}
        {e.dispel && <TipLine mark="✕">Dissipe une protection ennemie</TipLine>}
        {e.cleanse && <TipLine color="var(--good)" mark="✧">Purifie : retire un effet subi</TipLine>}
        {e.pressure && <TipLine mark="▲">Fait monter la Pression (vers une Rupture)</TipLine>}
      </div>
      {!s.available &&
        (level < s.level ? (
          <TipFoot tone="locked">🔒 S’apprend au niveau {s.level} de la classe (vous êtes niveau {level}).</TipFoot>
        ) : (
          <TipFoot tone="locked">🔒 Sort de la voie {pathName ?? ''} : choisissez cette voie pour l’utiliser.</TipFoot>
        ))}
    </>
  );
}
