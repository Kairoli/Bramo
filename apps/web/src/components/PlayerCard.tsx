import { type CSSProperties, useEffect, useState } from 'react';
import { PROFILE_BANNERS, type PlayerProfile } from '@bramo/shared';
import { RequestError, api } from '../api';
import { useGame } from '../game/GameContext';
import { Character } from '../rig/Character';
import { Avatar } from './Avatar';
import { Crest } from './Crest';
import { GearIcon } from './GearIcon';
import { OrnamentPlate, ornamentTitle } from './Ornament';
import { Modal } from './ui';
import { FriendActions } from './Social';

/**
 * Page profil d'un joueur [demande de Louis, 23 octobre : « quand on clique sur une photo de profil ou un nom, ça ouvre
 * une page profil, avec la photo, le perso… un truc sympa, visuel, unique à chacun »]. En haut, sa bannière (un décor du
 * jeu qu'il choisit), son personnage debout, sa photo, son nom ou son ornement, sa devise ; puis ses chiffres, sa pièce
 * maîtresse, ce qu'il porte, ses métiers et son palmarès de la Marée. Sur sa propre page : « Modifier ma page ».
 */

const RANK: Record<string, string> = { leader: 'Chef', officer: 'Officier', member: 'Membre' };
const SLOTS = ['head', 'torso', 'hands', 'legs', 'feet', 'weapon', 'cape', 'belt', 'necklace', 'ring'];
const RARITY = ['common', 'rare', 'epic', 'legendary'];
const RARITY_NAME: Record<string, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };
const BANNER_NAME: Record<string, string> = { town: 'Le bourg', clan: 'Place du clan', market: 'Le marché', combat: 'La route' };
const ONLINE_MS = 15 * 60_000;

/** Bannière par défaut : le décor de son meilleur métier, sinon le bourg. */
function bannerOf(p: PlayerProfile): string {
  if (p.banner) return p.banner;
  const best = p.skills[0]?.profession;
  return best && (PROFILE_BANNERS as readonly string[]).includes(best) ? best : 'town';
}

function seen(at: number, now: number): string {
  const min = Math.floor((now - at) / 60_000);
  if (min < 60) return `vu il y a ${Math.max(1, min)} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vu il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `vu il y a ${d} jour${d > 1 ? 's' : ''}`;
}

const joined = (at: number) => new Date(at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function PlayerCard({ id, onClose }: { id: number; onClose: () => void }) {
  const { content, characterId, flash } = useGame();
  const [p, setP] = useState<PlayerProfile | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    api.player(id).then(setP).catch(() => setP(null));
  }, [id]);

  if (p === undefined || p === null) {
    return (
      <Modal onClose={onClose} className="pp-modal pp-empty">
        <p className="muted">{p === undefined ? 'Chargement…' : 'Ce joueur est introuvable.'}</p>
      </Modal>
    );
  }

  const mine = p.id === characterId;
  const cls = p.classId ? content.classes[p.classId] : undefined;
  const ornament = p.ornament ? content.ornaments[p.ornament] : undefined;
  const appearance = cls ? { classId: cls.id, outfit: p.outfit ?? cls.startingOutfit, overrides: p.look } : null;
  const now = Date.now();
  const online = now - p.lastSeenAt < ONLINE_MS;
  const color = cls?.affinityColor ?? 'var(--magic)';
  // La pièce maîtresse : la plus rare, puis la plus haute, un chef-d'œuvre d'abord.
  const best = [...p.gear].sort((a, b) => RARITY.indexOf(b.rarity) - RARITY.indexOf(a.rarity) || b.tier - a.tier || Number(b.masterpiece) - Number(a.masterpiece))[0];

  return (
    <Modal onClose={onClose} className="pp-modal">
      <div className="pp" style={{ '--cc': color } as CSSProperties}>
        {editing ? (
          <ProfileEditor p={p} onCancel={() => setEditing(false)} onSaved={(next) => (setP(next), setEditing(false), flash('Page profil enregistrée.'))} />
        ) : (
          <Hero p={p} appearance={appearance} ornament={ornament} online={online} now={now} />
        )}

        <div className="pp-actions">
          {mine && !editing && (
            <button className="btn btn-sm pp-edit" onClick={() => setEditing(true)}>
              Modifier ma page
            </button>
          )}
          {!mine && !editing && <FriendActions id={p.id} />}
          {!mine && p.avatar && (
            <button className="link small" onClick={() => void api.reportAvatar(p.id).then(() => flash('Photo signalée. Merci.'))}>
              Signaler la photo
            </button>
          )}
          <button className="pp-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>

        {!editing && (
          <>
            <div className="pp-stats">
              <Stat value={p.classLevel} label={cls ? `Niveau de ${cls.name}${p.path ? ` · ${p.path}` : ''}` : 'Sans classe'} />
              <Stat value={p.totalLevel} label="Niveau total des métiers" />
              <Stat value={p.tide.nights} label={p.tide.nights > 1 ? 'Soirs de Marée' : 'Soir de Marée'} />
              <Stat value={p.tide.best} label="Meilleur soir récent (points)" />
              <Stat value={joined(p.joinedAt)} label="Arrivé à Bramo" small />
              {p.orders.delivered > 0 && <Stat value={p.orders.delivered} label={`Commandes livrées · ${Math.round((p.orders.onTime / p.orders.delivered) * 100)} % à temps`} />}
            </div>

            <div className="pp-body">
              <section className="pp-section pp-gear">
                <h3>Équipement</h3>
                {best ? (
                  <div className="pp-best" style={{ '--rc': `var(--r-${best.rarity})` } as CSSProperties}>
                    <span className="pp-best-icon">
                      <GearIcon slot={best.slot} family={best.family} tier={best.tier} rarity={best.rarity} size={64} />
                    </span>
                    <span>
                      <span className="eyebrow">Pièce maîtresse</span>
                      <strong>
                        {best.masterpiece ? 'Chef-d’œuvre · ' : ''}
                        {best.name}
                      </strong>
                      <span className="muted small">
                        {RARITY_NAME[best.rarity] ?? best.rarity} · palier {best.tier}
                      </span>
                    </span>
                  </div>
                ) : (
                  <p className="muted small">Rien de porté pour le moment.</p>
                )}
                <div className="pp-slots">
                  {SLOTS.flatMap((slot) => {
                    const pieces = p.gear.filter((g) => g.slot === slot);
                    return (pieces.length ? pieces : [null]).map((g, i) =>
                      g ? (
                        <span key={`${slot}${i}`} className="gear-tile static" style={{ '--rc': `var(--r-${g.rarity})` } as CSSProperties} title={`${g.masterpiece ? 'Chef-d’œuvre ' : ''}${g.name} · palier ${g.tier}`}>
                          <GearIcon slot={g.slot} family={g.family} tier={g.tier} rarity={g.rarity} size={38} />
                        </span>
                      ) : (
                        <span key={slot} className="gear-tile empty static" />
                      ),
                    );
                  })}
                </div>
                {p.otherClasses.length > 0 && (
                  <span className="muted small">Joue aussi : {p.otherClasses.map((c) => `${content.classes[c.classId]?.name} ${c.level}`).join(', ')}</span>
                )}
              </section>

              <section className="pp-section">
                <h3>Métiers</h3>
                {p.skills.length === 0 && <p className="muted small">Pas encore de métier au-delà du niveau 1.</p>}
                <div className="pp-skills">
                  {p.skills.slice(0, 6).map((s) => (
                    <div key={s.profession} className="pp-skill">
                      <span className="pp-skill-name">{content.professions.find((x) => x.id === s.profession)?.name}</span>
                      <span className="pp-skill-bar">
                        <span style={{ width: `${Math.min(100, (s.level / 99) * 100)}%` }} />
                      </span>
                      <strong>{s.level}</strong>
                    </div>
                  ))}
                </div>
                {p.skills.length > 6 && <span className="muted small">et {p.skills.length - 6} autre{p.skills.length - 6 > 1 ? 's' : ''}</span>}
              </section>

              <section className="pp-section">
                <h3>Palmarès de la Marée</h3>
                {p.tide.titles.length > 0 ? (
                  <div className="pp-titles">
                    {p.tide.titles.map((t) => (
                      <span key={t} className="pp-title">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="muted small">{p.tide.nights ? 'Pas encore de titre : ils viennent avec les soirs.' : 'Pas encore venu sur la digue.'}</p>
                )}
                <ul className="pp-facts">
                  <li>
                    <strong>{p.tide.live}</strong> soir{p.tide.live > 1 ? 's' : ''} en direct sur les quatorze derniers
                  </li>
                  {p.tide.offered > 0 && (
                    <li>
                      <strong>{p.tide.offered}</strong> Marée{p.tide.offered > 1 ? 's' : ''} offerte{p.tide.offered > 1 ? 's' : ''} au serveur
                    </li>
                  )}
                </ul>
              </section>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function Stat({ value, label, small }: { value: number | string; label: string; small?: boolean }) {
  return (
    <div className="pp-stat">
      <strong className={small ? 'small-value' : ''}>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

/** Le haut de la page : bannière, personnage debout, photo, nom ou ornement, devise, classe, clan, présence. */
function Hero({
  p,
  appearance,
  ornament,
  online,
  now,
}: {
  p: PlayerProfile;
  appearance: { classId: string; outfit: string; overrides?: Record<string, string> } | null;
  ornament: ReturnType<typeof useGame>['content']['ornaments'][string] | undefined;
  online: boolean;
  now: number;
}) {
  const { content } = useGame();
  const cls = p.classId ? content.classes[p.classId] : undefined;
  return (
    <header className="pp-hero" style={{ backgroundImage: `url(/scenes/${bannerOf(p)}.webp)` }}>
      <div className="pp-hero-shade" />
      {appearance && (
        <div className="pp-rig">
          <Character appearance={appearance} lod="scene" centered />
        </div>
      )}
      <div className="pp-id">
        <Avatar id={p.id} version={p.avatar} name={p.name} classId={p.classId} appearance={appearance} size={124} className="pp-avatar" open={false} />
        <div className="pp-id-text">
          {ornament ? <OrnamentPlate ornament={ornament} name={p.name} title={ornamentTitle(ornament, content, undefined, p.title)} width={330} className="pp-plate" /> : <h2 className="pp-name">{p.name}</h2>}
          {!ornament && p.nickname && <span className="pp-nick">{p.nickname}</span>}
          {p.motto && <p className="pp-motto">« {p.motto} »</p>}
          <div className="pp-chips">
            {cls && (
              <span className="pp-chip pp-class">
                {cls.name} · niv. {p.classLevel}
              </span>
            )}
            {p.clan && (
              <span className="pp-chip pp-clan">
                <Crest name={p.clan.name} size={18} />
                {p.clan.name} · {RANK[p.clan.rank]}
              </span>
            )}
            <span className={`pp-chip pp-seen${online ? ' on' : ''}`}>{online ? (p.doing ? `En ligne · ${p.doing}` : 'En ligne') : seen(p.lastSeenAt, now)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Modifier sa page : choisir sa bannière parmi les décors du jeu, écrire sa devise ; l'aperçu suit. */
function ProfileEditor({ p, onCancel, onSaved }: { p: PlayerProfile; onCancel: () => void; onSaved: (p: PlayerProfile) => void }) {
  const { content } = useGame();
  const [banner, setBanner] = useState<string>(bannerOf(p));
  const [motto, setMotto] = useState(p.motto ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cls = p.classId ? content.classes[p.classId] : undefined;
  const appearance = cls ? { classId: cls.id, outfit: p.outfit ?? cls.startingOutfit, overrides: p.look } : null;
  const ornament = p.ornament ? content.ornaments[p.ornament] : undefined;
  const preview = { ...p, banner, motto: motto.trim() || null };
  const label = (b: string) => BANNER_NAME[b] ?? content.professions.find((x) => x.id === b)?.name ?? b;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      onSaved(await api.profileDetails({ banner, motto: motto.trim() || null }));
    } catch (err) {
      setError(err instanceof RequestError || err instanceof Error ? err.message : 'Erreur inattendue.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Hero p={preview} appearance={appearance} ornament={ornament} online now={Date.now()} />
      <div className="pp-editor">
        <label className="pp-motto-field">
          <span className="eyebrow">Ma devise</span>
          <input className="input" value={motto} maxLength={80} placeholder="Une phrase qui vous ressemble (pas de lien)" onChange={(e) => setMotto(e.target.value)} />
          <span className="muted small">{motto.length} / 80</span>
        </label>
        <span className="eyebrow">Ma bannière</span>
        <div className="pp-banners scroll">
          {PROFILE_BANNERS.map((b) => (
            <button key={b} className={`pp-banner${b === banner ? ' on' : ''}`} style={{ backgroundImage: `url(/scenes/${b}.webp)` }} onClick={() => setBanner(b)} aria-pressed={b === banner}>
              <span>{label(b)}</span>
            </button>
          ))}
        </div>
        {error && <p className="small form-error">{error}</p>}
        <div className="pp-editor-actions">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>
            Annuler
          </button>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void save()}>
            Enregistrer ma page
          </button>
        </div>
      </div>
    </>
  );
}
