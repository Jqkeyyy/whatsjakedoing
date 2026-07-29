import { mockCategories } from './mock/categories';
import { mockEvents } from './mock/events';
import { mockHubLinks } from './mock/hubLinks';
import { mockStatusOverride } from './mock/statusOverride';
import { deriveStatus } from './lib/status';
import { Sidebar } from './components/Sidebar';
import { StatusHero } from './components/StatusHero';
import { CalendarTabs } from './components/CalendarTabs';

function App() {
  const status = deriveStatus(mockEvents, mockCategories, mockStatusOverride, new Date());

  return (
    <div className="flex min-h-screen flex-col bg-cream sm:flex-row">
      <Sidebar
        bio="Building things, moving things, and figuring out what's next."
        hubLinks={mockHubLinks}
      />
      <main className="flex-1 p-4 sm:p-8">
        <StatusHero status={status} />
        <div className="mt-6">
          <CalendarTabs events={mockEvents} categories={mockCategories} />
        </div>
      </main>
    </div>
  );
}

export default App;
