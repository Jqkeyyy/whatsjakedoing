import type { VercelRequest, VercelResponse } from './_lib/http';
import { requireSession } from './_lib/auth';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSession(req, res)) return;
  const supabase = getSupabaseAdmin();

  if (req.method === 'POST') {
    const { title, categoryId, location, startAt, endAt, isRecurring, recurrence } = req.body ?? {};
    if (
      typeof title !== 'string' ||
      !title ||
      typeof categoryId !== 'string' ||
      !categoryId ||
      typeof startAt !== 'string' ||
      !startAt ||
      typeof endAt !== 'string' ||
      !endAt
    ) {
      return res.status(400).json({ error: 'title, categoryId, startAt, and endAt are required' });
    }
    const { data, error } = await supabase
      .from('events')
      .insert({
        title,
        category_id: categoryId,
        location: location ?? null,
        start_at: startAt,
        end_at: endAt,
        is_recurring: Boolean(isRecurring),
        recurrence: isRecurring ? recurrence ?? null : null,
      })
      .select()
      .single();
    if (error) {
      console.error('POST /api/events failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, title, categoryId, location, startAt, endAt, isRecurring, recurrence } = req.body ?? {};
    if (
      typeof id !== 'string' ||
      !id ||
      typeof title !== 'string' ||
      !title ||
      typeof categoryId !== 'string' ||
      !categoryId ||
      typeof startAt !== 'string' ||
      !startAt ||
      typeof endAt !== 'string' ||
      !endAt ||
      (location !== undefined && location !== null && typeof location !== 'string') ||
      (recurrence !== undefined && recurrence !== null && typeof recurrence !== 'object')
    ) {
      return res.status(400).json({ error: 'id, title, categoryId, startAt, and endAt are required' });
    }
    const { data, error } = await supabase
      .from('events')
      .update({
        title,
        category_id: categoryId,
        location: location ?? null,
        start_at: startAt,
        end_at: endAt,
        is_recurring: Boolean(isRecurring),
        recurrence: isRecurring ? recurrence ?? null : null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('PUT /api/events failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {};
    if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'id is required' });
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      console.error('DELETE /api/events failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(204).end();
  }

  res.setHeader('Allow', 'POST, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
