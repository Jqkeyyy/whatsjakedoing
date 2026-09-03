import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '../http';
import jwt from 'jsonwebtoken';
import {
  createSessionCookie,
  clearSessionCookie,
  hasValidSession,
  hasAllowedOrigin,
  requireAllowedOrigin,
  requireSession,
} from '../auth';

const TEST_SECRET = 'test-secret-that-is-at-least-32-bytes-long';

function validToken(secret = TEST_SECRET): string {
  return jwt.sign({ role: 'admin' }, secret, {
    algorithm: 'HS256',
    audience: 'whats-jake-doing-admin',
    issuer: 'whats-jake-doing',
    subject: 'admin',
  });
}

function mockRes(): VercelResponse {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

describe('session cookie helpers', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = TEST_SECRET;
  });

  it('createSessionCookie includes hardened attributes and a 7-day Max-Age', () => {
    const cookie = createSessionCookie(true);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('Priority=High');
    expect(cookie).toContain(`Max-Age=${60 * 60 * 24 * 7}`);
  });

  it('createSessionCookie omits Secure when secure=false (local http dev)', () => {
    const cookie = createSessionCookie(false);
    expect(cookie).not.toContain('Secure');
  });

  it('clearSessionCookie sets Max-Age=0', () => {
    expect(clearSessionCookie(true)).toContain('Max-Age=0');
  });

  it('hasValidSession returns true for a token signed with the current secret', () => {
    const token = validToken();
    const req = { cookies: { session: token } } as unknown as VercelRequest;
    expect(hasValidSession(req)).toBe(true);
  });

  it('hasValidSession returns false when there is no cookie', () => {
    const req = { cookies: {} } as unknown as VercelRequest;
    expect(hasValidSession(req)).toBe(false);
  });

  it('hasValidSession returns false for a token signed with a different secret', () => {
    const token = validToken('wrong-secret-that-is-at-least-32-bytes-long');
    const req = { cookies: { session: token } } as unknown as VercelRequest;
    expect(hasValidSession(req)).toBe(false);
  });

  it('hasValidSession rejects a token without the required claims', () => {
    const token = jwt.sign({ role: 'admin' }, TEST_SECRET);
    const req = { cookies: { session: token } } as unknown as VercelRequest;
    expect(hasValidSession(req)).toBe(false);
  });

  it('createSessionCookie rejects a weak session secret', () => {
    process.env.SESSION_SECRET = 'too-short';
    expect(() => createSessionCookie(true)).toThrow(/at least 32/);
  });
});

describe('origin checks', () => {
  it('allows a matching forwarded origin', () => {
    const req = {
      headers: {
        origin: 'https://calendar.example.com',
        'x-forwarded-host': 'calendar.example.com',
        'x-forwarded-proto': 'https',
      },
    } as unknown as VercelRequest;
    expect(hasAllowedOrigin(req)).toBe(true);
  });

  it('blocks a cross-origin request', () => {
    const req = {
      headers: {
        origin: 'https://attacker.example',
        'x-forwarded-host': 'calendar.example.com',
        'x-forwarded-proto': 'https',
      },
    } as unknown as VercelRequest;
    const res = mockRes();
    expect(requireAllowedOrigin(req, res)).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows requests without an Origin header for non-browser clients', () => {
    const req = { headers: {} } as unknown as VercelRequest;
    expect(hasAllowedOrigin(req)).toBe(true);
  });
});

describe('requireSession', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = TEST_SECRET;
  });

  it('returns true and does not touch res when the session is valid', () => {
    const token = validToken();
    const req = { cookies: { session: token }, headers: {} } as unknown as VercelRequest;
    const res = mockRes();
    expect(requireSession(req, res)).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns false and writes a 401 when the session is missing', () => {
    const req = { cookies: {} } as unknown as VercelRequest;
    const res = mockRes();
    expect(requireSession(req, res)).toBe(false);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });
});
