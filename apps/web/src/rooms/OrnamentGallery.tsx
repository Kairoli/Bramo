import { useState } from 'react';
import { useContent } from '../game/ContentContext';
import { OrnamentPlate, ornamentTitle } from '../components/Ornament';

const WIDTHS = [192, 320, 480];

/** Page de contrôle (/#ornements, hors connexion) : chaque ornement aux trois largeurs de référence. */
export function OrnamentGallery() {
  const content = useContent();
  const [name, setName] = useState('Aldric');
  const ornaments = Object.values(content.ornaments);
  const professions = [...new Set(ornaments.map((o) => o.profession))];
  return (
    <main className="ornament-gallery scroll">
      <header className="ornament-gallery-head">
        <h1>Ornements de métier</h1>
        <span className="muted">
          {ornaments.length} ornements · {ornaments.filter((o) => o.reserved).length} en réserve (palier 90) · largeurs {WIDTHS.join(', ')} px
        </span>
        <label className="muted">
          Pseudo{' '}
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <a className="link" href="#">
          Retour au jeu
        </a>
      </header>
      {professions.map((p) => (
        <section key={p} className="ornament-gallery-row">
          <h2>{content.professions.find((x) => x.id === p)?.name ?? p}</h2>
          {ornaments
            .filter((o) => o.profession === p)
            .map((o) => (
              <div key={o.id} className="ornament-gallery-item">
                <span className="eyebrow">
                  {o.rank}
                  {o.reserved ? ' · réserve' : ''}
                </span>
                {WIDTHS.map((w) => (
                  <OrnamentPlate key={w} ornament={o} name={name} title={ornamentTitle(o, content) || 'Palier 90'} width={w} />
                ))}
              </div>
            ))}
        </section>
      ))}
    </main>
  );
}
