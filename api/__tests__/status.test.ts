import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '../_lib/http';
import handler from '../status';
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

beforeEach(() => {
  vi.spyOn(auth, 'requireSession').mockReturnValue(true);
});

describe('POST /api/status', () => {
  it('creates a status override and returns 201', async () => {
    const row = {
      id: '1',
      status_text: 'Napping',
      is_busy: true,
      starts_at: '2026-07-29T14:00:00.000Z',
      ends_at: '2026-07-29T15:00:00.000Z',
    };
    const insert = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue({ insert, select, single }),
    } as never);

    const req = mockReq({
      method: 'POST',
      body: {
        statusText: 'Napping',
        isBusy: true,
        startsAt: '2026-07-29T14:00:00.000Z',
        endsAt: '2026-07-29T15:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(insert).toHaveBeenCalledWith({
      status_text: 'Napping',
      is_busy: true,
      starts_at: '2026-07-29T14:00:00.000Z',
      ends_at: '2026-07-29T15:00:00.000Z',
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 400 when isBusy, startsAt, or endsAt are missing', async () => {
    const req = mockReq({ method: 'POST', body: { statusText: 'Napping' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when startsAt is not a string', async () => {
    const req = mockReq({
      method: 'POST',
      body: {
        statusText: 'Napping',
        isBusy: true,
        startsAt: 123,
        endsAt: '2026-07-29T15:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when endsAt is not a string', async () => {
    const req = mockReq({
      method: 'POST',
      body: {
        statusText: 'Napping',
        isBusy: true,
        startsAt: '2026-07-29T14:00:00.000Z',
        endsAt: true,
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when statusText is not a string', async () => {
    const req = mockReq({
      method: 'POST',
      body: {
        statusText: 42,
        isBusy: true,
        startsAt: '2026-07-29T14:00:00.000Z',
        endsAt: '2026-07-29T15:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns a generic error message and logs the details when Supabase errors', async () => {
    const insert = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'relation "status_override" does not exist' } });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue({ insert, select, single }),
    } as never);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = mockReq({
      method: 'POST',
      body: {
        statusText: 'Napping',
        isBusy: true,
        startsAt: '2026-07-29T14:00:00.000Z',
        endsAt: '2026-07-29T15:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(consoleError).toHaveBeenCalled();
  });
});

describe('DELETE /api/status', () => {
  it('deletes the override and returns 204', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue({ delete: vi.fn().mockReturnThis(), eq }),
    } as never);

    const req = mockReq({ method: 'DELETE', body: { id: '1' } });
    const res = mockRes();
    await handler(req, res);

    expect(eq).toHaveBeenCalledWith('id', '1');
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('returns 400 when id is missing', async () => {
    const req = mockReq({ method: 'DELETE', body: {} });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when id is not a string', async () => {
    const req = mockReq({ method: 'DELETE', body: { id: 1 } });
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
