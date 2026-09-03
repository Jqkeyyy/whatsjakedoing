import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from './http';

const COOKIE_NAME = 'session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SESSION_ISSUER = 'whats-jake-doing';
const SESSION_AUDIENCE = 'whats-jake-doing-admin';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function requireSessionSecret(): string {
  const secret = requireEnv('SESSION_SECRET');
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
  return secret;
}

export function createSessionCookie(secure: boolean): string {
  const token = jwt.sign({ role: 'admin' }, requireSessionSecret(), {
    algorithm: 'HS256',
    audience: SESSION_AUDIENCE,
    expiresIn: SESSION_MAX_AGE_SECONDS,
    issuer: SESSION_ISSUER,
    subject: 'admin',
  });
  const secureAttr = secure ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly${secureAttr}; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; Priority=High`;
}

export function clearSessionCookie(secure: boolean): string {
  const secureAttr = secure ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly${secureAttr}; SameSite=Strict; Path=/; Max-Age=0; Priority=High`;
}

export function hasValidSession(req: VercelRequest): boolean {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return false;
  try {
    const payload = jwt.verify(token, requireSessionSecret(), {
      algorithms: ['HS256'],
      audience: SESSION_AUDIENCE,
      issuer: SESSION_ISSUER,
      subject: 'admin',
    });
    if (typeof payload === 'string' || payload.role !== 'admin') return false;
    return true;
  } catch {
    return false;
  }
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.split(',')[0]?.trim();
}

export function hasAllowedOrigin(req: VercelRequest): boolean {
  const origin = firstHeader(req.headers?.origin);
  if (!origin) return true;

  const host = firstHeader(req.headers?.['x-forwarded-host']) ?? firstHeader(req.headers?.host);
  if (!host) return false;
  const protocol = firstHeader(req.headers?.['x-forwarded-proto']) ??
    (process.env.VERCEL_ENV === 'development' ? 'http' : 'https');

  try {
    return new URL(origin).origin === `${protocol}://${host}`;
  } catch {
    return false;
  }
}

export function requireAllowedOrigin(req: VercelRequest, res: VercelResponse): boolean {
  if (!hasAllowedOrigin(req)) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

export function requireSession(req: VercelRequest, res: VercelResponse): boolean {
  if (!hasValidSession(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  if (!requireAllowedOrigin(req, res)) return false;
  return true;
}
