import { useEffect, useState } from 'react';
import { checkSession, logout } from '../lib/adminApi';
import { useAdminData } from '../hooks/useAdminData';
import { deriveStatus } from '../lib/status';
import { StatusHero } from '../components/StatusHero';
import { CalendarTabs } from '../components/CalendarTabs';
import { LoginForm } from './LoginForm';
import { CategoryManager } from './CategoryManager';
import { EventForm } from './EventForm';
import { StatusOverrideControl } from './StatusOverrideControl';
import type { CalendarEvent } from '../types';

export function AdminApp() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const { categories, events, statusOverride, loading, error, refetch } = useAdminData();

  useEffect(() => {
    checkSession()
      .then(setAuthenticated)
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;

  if (!authenticated) {
    return <LoginForm onSuccess={() => setAuthenticated(true)} />;
  }

  const status = deriveStatus(events, categories, statusOverride, new Date());

  async function handleLogout() {
    setLogoutError(null);
    try {
      await logout();
      setAuthenticated(false);
    } catch (err) {
      setLogoutError(err instanceof Error ? err.message : 'Failed to log out');
    }
  }

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-ink">Admin</h1>
        <button
          type="button"
          onClick={() => {
            void handleLogout();
          }}
          className="rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold text-ink"
        >
          Log out
        </button>
      </div>

      {logoutError && <p className="mt-4 text-sm text-terracotta">{logoutError}</p>}
      {loading && <p className="mt-4 text-sm text-stone-500">Loading…</p>}
      {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mt-4">
            <StatusHero status={status} />
          </div>

          <div className="mt-4">
            <StatusOverrideControl current={statusOverride} onChange={refetch} />
          </div>

          <div className="mt-4">
            <CategoryManager categories={categories} onChange={refetch} />
          </div>

          <div className="relative mt-6">
            <CalendarTabs
              events={events}
              categories={categories}
              onEventClick={(event) => {
                setEditingEvent(event);
                setShowEventForm(true);
              }}
            />
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setShowEventForm(true);
              }}
              aria-label="Add event"
              className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-terracotta text-2xl text-white shadow-offset"
            >
              +
            </button>
          </div>

          {showEventForm && (
            <EventForm
              categories={categories}
              initialEvent={editingEvent ?? undefined}
              onSaved={() => {
                setShowEventForm(false);
                refetch();
              }}
              onClose={() => setShowEventForm(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
