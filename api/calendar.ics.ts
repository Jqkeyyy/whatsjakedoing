import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';
import { buildIcsFeed } from './_lib/ics';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabaseAdmin();
  const [eventsRes, categoriesRes] = await Promise.all([
    supabase.from('events').select('*'),
    supabase.from('categories').select('*'),
  ]);

  const firstError = eventsRes.error ?? categoriesRes.error;
  if (firstError) {
    console.error('GET /api/calendar.ics failed', firstError);
    return res.status(500).json({ error: 'Internal server error' });
  }

  const ics = buildIcsFeed(eventsRes.data ?? [], categoriesRes.data ?? []);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  if (req.method === 'HEAD') return res.status(200).end();
  return res.status(200).send(ics);
}
