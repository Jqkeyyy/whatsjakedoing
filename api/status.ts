import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireSession } from './_lib/auth';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSession(req, res)) return;
  const supabase = getSupabaseAdmin();

  if (req.method === 'POST') {
    const { statusText, isBusy, startsAt, endsAt } = req.body ?? {};
    if (typeof isBusy !== 'boolean' || typeof startsAt !== 'string' || !startsAt || typeof endsAt !== 'string' || !endsAt) {
      return res.status(400).json({ error: 'isBusy, startsAt, and endsAt are required' });
    }
    const { data, error } = await supabase
      .from('status_override')
      .insert({
        status_text: statusText ?? null,
        is_busy: isBusy,
        starts_at: startsAt,
        ends_at: endsAt,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { error } = await supabase.from('status_override').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
