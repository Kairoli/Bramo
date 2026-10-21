import { Scene } from '../components/Scene';

const ROOMS = {
  combat: {
    title: 'Combat',
    place: 'l’arène',
    color: 'var(--magic)',
    text: 'Forgefeu, Traqueur et Runiste, trois voies chacun, un combat entièrement automatique : tout se joue dans la préparation.',
  },
} as const;

export function SoonRoom({ room }: { room: keyof typeof ROOMS }) {
  const r = ROOMS[room];
  return (
    <main className="room">
      <section className="panel band">
        <Scene ids={[room]} />
      </section>
      <section className="panel soon-panel">
        <div className="eyebrow" style={{ color: r.color }}>
          Bientôt
        </div>
        <h1>{r.title}</h1>
        <p className="muted">{r.text}</p>
      </section>
    </main>
  );
}
