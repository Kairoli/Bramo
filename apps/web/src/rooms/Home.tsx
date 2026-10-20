import { WorldMap } from './home/WorldMap';
import { JournalPanel } from './home/JournalPanel';
import { ActivityPanel } from './home/ActivityPanel';
import { CharacterCard } from './home/CharacterCard';

export function Home() {
  return (
    <main className="room">
      <WorldMap />
      <div className="home-bottom">
        <JournalPanel />
        <ActivityPanel />
        <CharacterCard />
      </div>
    </main>
  );
}
