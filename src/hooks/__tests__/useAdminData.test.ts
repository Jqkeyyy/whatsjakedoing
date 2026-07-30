// src/hooks/__tests__/useAdminData.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminData } from '../useAdminData';
import { supabase } from '../../lib/supabaseClient';

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}));

function chainResolving(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue(result);
  // categories/events resolve directly off .select()
  chain.then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

beforeEach(() => {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'categories') {
      return chainResolving({
        data: [{ id: 'c1', name: 'Work', color: '#000', icon: null, is_busy: true }],
        error: null,
      }) as never;
    }
    if (table === 'events') {
      return chainResolving({ data: [], error: null }) as never;
    }
    return chainResolving({ data: [], error: null }) as never;
  });
});

describe('useAdminData', () => {
  it('loads categories, events, and the active status override', async () => {
    const { result } = renderHook(() => useAdminData());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.categories).toEqual([
      { id: 'c1', name: 'Work', color: '#000', icon: undefined, isBusy: true },
    ]);
    expect(result.current.events).toEqual([]);
    expect(result.current.statusOverride).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
