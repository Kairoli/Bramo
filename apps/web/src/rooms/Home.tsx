import { Town } from './home/Town';
import { JournalPanel } from './home/JournalPanel';
import { RoutePanel } from './home/RoutePanel';
import { CharacterCard } from './home/CharacterCard';

export function Home() {
  return (
    <main className="room home-room">
      <Town />
      <div className="home-bottom">
        <JournalPanel />
        <CharacterCard />
        <RoutePanel />
      </div>
    </main>
  );
}
