import type { VercelRequest, VercelResponse } from './_lib/http';
import bcrypt from 'bcryptjs';
import {
  createSessionCookie,
  clearSessionCookie,
  hasValidSession,
  requireAllowedOrigin,
} from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secure = process.env.VERCEL_ENV !== 'development';
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const authenticated = hasValidSession(req);
    return res.status(authenticated ? 200 : 401).json({ authenticated });
  }

  if (req.method === 'POST') {
    if (!requireAllowedOrigin(req, res)) return;
    const { password } = req.body ?? {};
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Missing password' });
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password is too long' });
    }
    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!hash) {
      console.error('POST /api/login failed: ADMIN_PASSWORD_HASH is not configured');
      return res.status(500).json({ error: 'Internal server error' });
    }
    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    try {
      res.setHeader('Set-Cookie', createSessionCookie(secure));
    } catch (error) {
      console.error('POST /api/login failed: session configuration is invalid', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    if (!requireAllowedOrigin(req, res)) return;
    res.setHeader('Set-Cookie', clearSessionCookie(secure));
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
