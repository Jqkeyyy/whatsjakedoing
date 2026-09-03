import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '../_lib/http';
import bcrypt from 'bcryptjs';
import handler from '../login';
import * as auth from '../_lib/auth';

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'GET', cookies: {}, body: {}, ...overrides } as VercelRequest;
}

function mockRes(): VercelResponse {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

describe('GET /api/login', () => {
  it('returns 200 when the session is valid', async () => {
    vi.spyOn(auth, 'hasValidSession').mockReturnValue(true);
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 401 when there is no valid session', async () => {
    vi.spyOn(auth, 'hasValidSession').mockReturnValue(false);
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('POST /api/login', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('correct-password', 10);
    process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-bytes-long';
  });

  it('sets a session cookie and returns 200 for the correct password', async () => {
    const req = mockReq({ method: 'POST', body: { password: 'correct-password' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('session='));
  });

  it('returns 401 for the wrong password', async () => {
    const req = mockReq({ method: 'POST', body: { password: 'wrong' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.setHeader).not.toHaveBeenCalledWith('Set-Cookie', expect.anything());
  });

  it('returns 400 when no password is provided', async () => {
    const req = mockReq({ method: 'POST', body: {} });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when password is not a string', async () => {
    const req = mockReq({ method: 'POST', body: { password: 123 } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when the password exceeds bcrypt\'s byte limit', async () => {
    const req = mockReq({ method: 'POST', body: { password: 'a'.repeat(73) } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 403 for a cross-origin login attempt', async () => {
    const req = mockReq({
      method: 'POST',
      body: { password: 'correct-password' },
      headers: {
        origin: 'https://attacker.example',
        'x-forwarded-host': 'calendar.example.com',
        'x-forwarded-proto': 'https',
      },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.setHeader).not.toHaveBeenCalledWith('Set-Cookie', expect.anything());
  });

  it('returns 500 (not 400) when ADMIN_PASSWORD_HASH is not configured, and logs the misconfiguration', async () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const req = mockReq({ method: 'POST', body: { password: 'correct-password' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(consoleError).toHaveBeenCalled();
  });
});

describe('DELETE /api/login', () => {
  it('clears the session cookie and returns 200', async () => {
    const req = mockReq({ method: 'DELETE' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('Max-Age=0')
    );
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
