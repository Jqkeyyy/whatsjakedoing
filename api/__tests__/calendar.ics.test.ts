import { describe, it, expect, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../calendar.ics';
import * as supabaseAdmin from '../_lib/supabaseAdmin';

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'GET', cookies: {}, ...overrides } as VercelRequest;
}

function mockRes(): VercelResponse {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

function mockSupabase(eventsResult: { data: unknown; error: unknown }, categoriesResult: { data: unknown; error: unknown }) {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockResolvedValue(table === 'events' ? eventsResult : categoriesResult),
    })),
  };
}

describe('GET /api/calendar.ics', () => {
  it('returns a text/calendar feed built from events and categories', async () => {
    const events = [
      {
        id: 'event-1',
        title: 'Gym',
        category_id: 'cat-1',
        location: null,
        start_at: '2026-07-29T10:00:00.000Z',
        end_at: '2026-07-29T11:00:00.000Z',
        is_recurring: false,
        recurrence: null,
      },
    ];
    const categories = [{ id: 'cat-1', name: 'Personal' }];
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue(
      mockSupabase({ data: events, error: null }, { data: categories, error: null }) as never
    );

    const req = mockReq();
    const res = mockRes();
    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/calendar; charset=utf-8');
    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(body).toContain('BEGIN:VCALENDAR');
    expect(body).toContain('SUMMARY:Gym');
  });

  it('returns 500 and logs when Supabase errors', async () => {
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue(
      mockSupabase({ data: null, error: { message: 'boom' } }, { data: [], error: null }) as never
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = mockReq();
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(consoleError).toHaveBeenCalled();
  });

  it('returns 405 for non-GET methods', async () => {
    const req = mockReq({ method: 'POST' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
