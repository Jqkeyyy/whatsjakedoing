import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE_NAME = 'session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function createSessionCookie(secure: boolean): string {
  const secret = requireEnv('SESSION_SECRET');
  const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: SESSION_MAX_AGE_SECONDS });
  const secureAttr = secure ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly${secureAttr}; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export function clearSessionCookie(secure: boolean): string {
  const secureAttr = secure ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly${secureAttr}; SameSite=Lax; Path=/; Max-Age=0`;
}

export function hasValidSession(req: VercelRequest): boolean {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return false;
  try {
    jwt.verify(token, requireEnv('SESSION_SECRET'));
    return true;
  } catch {
    return false;
  }
}

export function requireSession(req: VercelRequest, res: VercelResponse): boolean {
  if (!hasValidSession(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
