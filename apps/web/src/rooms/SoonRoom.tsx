import { useGame } from '../game/GameContext';

const ROOMS = {
  clan: {
    title: 'Clan',
    place: 'la halle du clan',
    color: 'var(--clan)',
    text: 'Entrepôt commun, commandes internes, postes d’experts et grands projets de construction. Personne ne fait tout seul.',
  },
  market: {
    title: 'Marché',
    place: 'la place du marché',
    color: 'var(--market)',
    text: 'Ordres d’achat et de vente entre joueurs, avec une taxe de 5 %. En attendant, le marchand du port vend du poisson et rachète vos surplus.',
  },
  combat: {
    title: 'Combat',
    place: 'l’arène',
    color: 'var(--magic)',
    text: 'Forgefeu, Traqueur et Runiste, trois voies chacun, et le triangle mêlée > tir > magie > mêlée.',
  },
} as const;

export function SoonRoom({ room }: { room: keyof typeof ROOMS }) {
  const { setShopOpen } = useGame();
  const r = ROOMS[room];
  return (
    <main className="room">
      <section className="panel band">
        <div className="band-label">[Illustration : {r.place}]</div>
      </section>
      <section className="panel soon-panel">
        <div className="eyebrow" style={{ color: r.color }}>
          Bientôt
        </div>
        <h1>{r.title}</h1>
        <p className="muted">{r.text}</p>
        {room === 'market' && (
          <button className="btn btn-primary" onClick={() => setShopOpen(true)}>
            Voir le marchand du port
          </button>
        )}
      </section>
    </main>
  );
}
