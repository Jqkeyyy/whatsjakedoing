import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '../_lib/http';
import handler from '../categories';
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
  // delete() resolves directly (no .single()) in the handler
  chain.then = undefined;
  return chain;
}

beforeEach(() => {
  vi.spyOn(auth, 'requireSession').mockReturnValue(true);
});

describe('POST /api/categories', () => {
  it('creates a category and returns 201', async () => {
    const row = { id: '1', name: 'Work', color: '#000', icon: null, is_busy: true };
    const chain = mockSupabaseChain({ data: row, error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const req = mockReq({ method: 'POST', body: { name: 'Work', color: '#000', isBusy: true } });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(row);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = mockReq({ method: 'POST', body: { name: 'Work' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when the session is invalid', async () => {
    vi.spyOn(auth, 'requireSession').mockReturnValue(false);
    const req = mockReq({ method: 'POST', body: { name: 'Work', color: '#000', isBusy: true } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).not.toHaveBeenCalledWith(201);
  });

  it('returns a generic error message and logs the details when Supabase errors', async () => {
    const chain = mockSupabaseChain({ data: null, error: { message: 'relation "categories" does not exist' } });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = mockReq({ method: 'POST', body: { name: 'Work', color: '#000', isBusy: true } });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(consoleError).toHaveBeenCalled();
  });
});

describe('PUT /api/categories', () => {
  it('updates a category and returns 200', async () => {
    const row = { id: '1', name: 'Work', color: '#fff', icon: 'briefcase', is_busy: false };
    const chain = mockSupabaseChain({ data: row, error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const req = mockReq({ method: 'PUT', body: { id: '1', name: 'Work', color: '#fff', icon: 'briefcase', isBusy: false } });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(row);
  });

  it('returns 400 when id is missing', async () => {
    const req = mockReq({ method: 'PUT', body: { name: 'Work', color: '#fff', isBusy: false } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when name is not a string', async () => {
    const req = mockReq({ method: 'PUT', body: { id: '1', name: 42, color: '#fff', isBusy: false } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when color is not a string', async () => {
    const req = mockReq({ method: 'PUT', body: { id: '1', name: 'Work', color: 123, isBusy: false } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when isBusy is not a boolean', async () => {
    const req = mockReq({ method: 'PUT', body: { id: '1', name: 'Work', color: '#fff', isBusy: 'yes' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when id is not a string', async () => {
    const req = mockReq({ method: 'PUT', body: { id: { $ne: null }, name: 'Work', color: '#fff', isBusy: false } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when icon is not a string', async () => {
    const req = mockReq({ method: 'PUT', body: { id: '1', name: 'Work', color: '#fff', icon: 42, isBusy: false } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('DELETE /api/categories', () => {
  it('deletes a category and returns 204', async () => {
    const chain = mockSupabaseChain({ data: null, error: null });
    chain.eq = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const req = mockReq({ method: 'DELETE', body: { id: '1' } });
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
