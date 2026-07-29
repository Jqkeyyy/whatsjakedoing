import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { createSessionCookie, clearSessionCookie, hasValidSession } from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secure = process.env.VERCEL_ENV !== 'development';

  if (req.method === 'GET') {
    const authenticated = hasValidSession(req);
    return res.status(authenticated ? 200 : 401).json({ authenticated });
  }

  if (req.method === 'POST') {
    const { password } = req.body ?? {};
    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!password || !hash) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    res.setHeader('Set-Cookie', createSessionCookie(secure));
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSessionCookie(secure));
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
