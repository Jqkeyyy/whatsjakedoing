// src/hooks/useAdminData.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { mapCategoryRow, mapEventRow, mapStatusOverrideRow } from '../lib/mappers';
import type { Category, CalendarEvent, StatusOverride } from '../types';

interface AdminData {
  categories: Category[];
  events: CalendarEvent[];
  statusOverride: StatusOverride | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdminData(): AdminData {
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [statusOverride, setStatusOverride] = useState<StatusOverride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      const [categoriesRes, eventsRes, overrideRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('events').select('*'),
        supabase
          .from('status_override')
          .select('*')
          .gte('ends_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(1),
      ]);

      if (cancelled) return;

      const firstError = categoriesRes.error ?? eventsRes.error ?? overrideRes.error;
      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      setCategories((categoriesRes.data ?? []).map(mapCategoryRow));
      setEvents((eventsRes.data ?? []).map(mapEventRow));
      const overrideRows = overrideRes.data ?? [];
      setStatusOverride(overrideRows.length > 0 ? mapStatusOverrideRow(overrideRows[0]) : null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { categories, events, statusOverride, loading, error, refetch };
}
