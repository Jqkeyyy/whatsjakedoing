import { useCalendarData } from './hooks/useCalendarData';
import { mockHubLinks } from './mock/hubLinks';
import { deriveStatus } from './lib/status';
import { Sidebar } from './components/Sidebar';
import { StatusHero } from './components/StatusHero';
import { CalendarTabs } from './components/CalendarTabs';
import { CosmicBackground } from './components/CosmicBackground';

function App() {
  const { categories, events, statusOverride, loading, error } = useCalendarData();
  const status = deriveStatus(events, categories, statusOverride, new Date());

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <CosmicBackground />
      <Sidebar
        bio="Building things, moving things, and figuring out what's next."
        hubLinks={mockHubLinks}
      />
      <main className="flex-1 p-4 sm:p-8">
        {loading && <p className="text-sm text-muted">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && (
          <>
            <StatusHero status={status} />
            <div className="mt-6">
              <CalendarTabs events={events} categories={categories} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
