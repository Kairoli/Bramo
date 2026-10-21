import { Town } from './home/Town';
import { JournalPanel } from './home/JournalPanel';
import { ActivityPanel } from './home/ActivityPanel';
import { CharacterCard } from './home/CharacterCard';

export function Home() {
  return (
    <main className="room">
      <Town />
      <div className="home-bottom">
        <JournalPanel />
        <CharacterCard />
        <ActivityPanel />
      </div>
    </main>
  );
}
