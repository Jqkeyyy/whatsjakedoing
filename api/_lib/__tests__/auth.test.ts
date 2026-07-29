import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import {
  createSessionCookie,
  clearSessionCookie,
  hasValidSession,
  requireSession,
} from '../auth';

function mockRes(): VercelResponse {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

describe('session cookie helpers', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-secret';
  });

  it('createSessionCookie includes HttpOnly, SameSite=Lax, and a 90-day Max-Age', () => {
    const cookie = createSessionCookie(true);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain(`Max-Age=${60 * 60 * 24 * 90}`);
  });

  it('createSessionCookie omits Secure when secure=false (local http dev)', () => {
    const cookie = createSessionCookie(false);
    expect(cookie).not.toContain('Secure');
  });

  it('clearSessionCookie sets Max-Age=0', () => {
    expect(clearSessionCookie(true)).toContain('Max-Age=0');
  });

  it('hasValidSession returns true for a token signed with the current secret', () => {
    const token = jwt.sign({ role: 'admin' }, 'test-secret');
    const req = { cookies: { session: token } } as unknown as VercelRequest;
    expect(hasValidSession(req)).toBe(true);
  });

  it('hasValidSession returns false when there is no cookie', () => {
    const req = { cookies: {} } as unknown as VercelRequest;
    expect(hasValidSession(req)).toBe(false);
  });

  it('hasValidSession returns false for a token signed with a different secret', () => {
    const token = jwt.sign({ role: 'admin' }, 'wrong-secret');
    const req = { cookies: { session: token } } as unknown as VercelRequest;
    expect(hasValidSession(req)).toBe(false);
  });
});

describe('requireSession', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-secret';
  });

  it('returns true and does not touch res when the session is valid', () => {
    const token = jwt.sign({ role: 'admin' }, 'test-secret');
    const req = { cookies: { session: token } } as unknown as VercelRequest;
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
