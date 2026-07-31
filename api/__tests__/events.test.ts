import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../events';
import * as auth from '../_lib/auth';
import * as supabaseAdmin from '../_lib/supabaseAdmin';

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'POST', body: {}, cookies: {}, ...overrides } as VercelRequest;
}

function mockRes(): VercelResponse {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

function mockSupabaseChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  chain.then = undefined;
  return chain;
}

beforeEach(() => {
  vi.spyOn(auth, 'requireSession').mockReturnValue(true);
});

describe('POST /api/events', () => {
  it('creates a non-recurring event and returns 201', async () => {
    const row = {
      id: '1',
      title: 'Gym',
      category_id: 'cat-1',
      location: null,
      start_at: '2026-07-29T10:00:00.000Z',
      end_at: '2026-07-29T11:00:00.000Z',
      is_recurring: false,
      recurrence: null,
    };
    const chain = mockSupabaseChain({ data: row, error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const req = mockReq({
      method: 'POST',
      body: {
        title: 'Gym',
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
        isRecurring: false,
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(row);
  });

  it('stores the recurrence object as-is (camelCase) when isRecurring is true', async () => {
    const row = {
      id: '2',
      title: 'Standup',
      category_id: 'cat-1',
      location: null,
      start_at: '2026-07-29T09:00:00.000Z',
      end_at: '2026-07-29T09:15:00.000Z',
      is_recurring: true,
      recurrence: { freq: 'weekly', daysOfWeek: [1, 3, 5], until: '2026-12-31' },
    };
    const chain = mockSupabaseChain({ data: row, error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const recurrence = { freq: 'weekly', daysOfWeek: [1, 3, 5], until: '2026-12-31' };
    const req = mockReq({
      method: 'POST',
      body: {
        title: 'Standup',
        categoryId: 'cat-1',
        startAt: '2026-07-29T09:00:00.000Z',
        endAt: '2026-07-29T09:15:00.000Z',
        isRecurring: true,
        recurrence,
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(row);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = mockReq({ method: 'POST', body: { title: 'Gym' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when title is not a string', async () => {
    const req = mockReq({
      method: 'POST',
      body: {
        title: 42,
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when categoryId is not a string', async () => {
    const req = mockReq({
      method: 'POST',
      body: {
        title: 'Gym',
        categoryId: 123,
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when startAt is not a string', async () => {
    const req = mockReq({
      method: 'POST',
      body: {
        title: 'Gym',
        categoryId: 'cat-1',
        startAt: 12345,
        endAt: '2026-07-29T11:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when endAt is not a string', async () => {
    const req = mockReq({
      method: 'POST',
      body: {
        title: 'Gym',
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: true,
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when the session is invalid', async () => {
    vi.spyOn(auth, 'requireSession').mockReturnValue(false);
    const req = mockReq({
      method: 'POST',
      body: {
        title: 'Gym',
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).not.toHaveBeenCalledWith(201);
  });

  it('returns a generic error message and logs the details when Supabase errors', async () => {
    const chain = mockSupabaseChain({ data: null, error: { message: 'relation "events" does not exist' } });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = mockReq({
      method: 'POST',
      body: {
        title: 'Gym',
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(consoleError).toHaveBeenCalled();
  });
});

describe('PUT /api/events', () => {
  it('updates the event identified by id (whole series, never an instance id)', async () => {
    const row = {
      id: 'event-1',
      title: 'Gym (updated)',
      category_id: 'cat-1',
      location: null,
      start_at: '2026-07-29T10:00:00.000Z',
      end_at: '2026-07-29T11:00:00.000Z',
      is_recurring: false,
      recurrence: null,
    };
    const chain = mockSupabaseChain({ data: row, error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const req = mockReq({
      method: 'PUT',
      body: {
        id: 'event-1',
        title: 'Gym (updated)',
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
        isRecurring: false,
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(row);
  });

  it('returns 400 when id is missing', async () => {
    const req = mockReq({
      method: 'PUT',
      body: {
        title: 'Gym (updated)',
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when id is not a string', async () => {
    const req = mockReq({
      method: 'PUT',
      body: {
        id: 123,
        title: 'Gym (updated)',
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when title is not a string', async () => {
    const req = mockReq({
      method: 'PUT',
      body: {
        id: 'event-1',
        title: 42,
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when categoryId is not a string', async () => {
    const req = mockReq({
      method: 'PUT',
      body: {
        id: 'event-1',
        title: 'Gym (updated)',
        categoryId: 123,
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when startAt is not a string', async () => {
    const req = mockReq({
      method: 'PUT',
      body: {
        id: 'event-1',
        title: 'Gym (updated)',
        categoryId: 'cat-1',
        startAt: 12345,
        endAt: '2026-07-29T11:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when endAt is not a string', async () => {
    const req = mockReq({
      method: 'PUT',
      body: {
        id: 'event-1',
        title: 'Gym (updated)',
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: true,
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when location is not a string', async () => {
    const req = mockReq({
      method: 'PUT',
      body: {
        id: 'event-1',
        title: 'Gym (updated)',
        categoryId: 'cat-1',
        location: 42,
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when recurrence is not an object', async () => {
    const req = mockReq({
      method: 'PUT',
      body: {
        id: 'event-1',
        title: 'Gym (updated)',
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
        isRecurring: true,
        recurrence: 'weekly',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('DELETE /api/events', () => {
  it('deletes the event and returns 204', async () => {
    const chain = mockSupabaseChain({ data: null, error: null });
    chain.eq = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const req = mockReq({ method: 'DELETE', body: { id: 'event-1' } });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('returns 400 when id is missing', async () => {
    const req = mockReq({ method: 'DELETE', body: {} });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when id is not a string', async () => {
    const req = mockReq({ method: 'DELETE', body: { id: 42 } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('unsupported method', () => {
  it('returns 405', async () => {
    const req = mockReq({ method: 'PATCH' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
