import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireSession } from './_lib/auth';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSession(req, res)) return;
  const supabase = getSupabaseAdmin();

  if (req.method === 'POST') {
    const { name, color, icon, isBusy } = req.body ?? {};
    if (typeof name !== 'string' || !name || typeof color !== 'string' || !color || typeof isBusy !== 'boolean') {
      return res.status(400).json({ error: 'name, color, and isBusy are required' });
    }
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color, icon: icon ?? null, is_busy: isBusy })
      .select()
      .single();
    if (error) {
      console.error('POST /api/categories failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, name, color, icon, isBusy } = req.body ?? {};
    if (
      typeof id !== 'string' ||
      !id ||
      typeof name !== 'string' ||
      !name ||
      typeof color !== 'string' ||
      !color ||
      typeof isBusy !== 'boolean' ||
      (icon !== undefined && icon !== null && typeof icon !== 'string')
    ) {
      return res.status(400).json({ error: 'id, name, color, and isBusy are required' });
    }
    const { data, error } = await supabase
      .from('categories')
      .update({ name, color, icon, is_busy: isBusy })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('PUT /api/categories failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {};
    if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'id is required' });
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.error('DELETE /api/categories failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(204).end();
  }

  res.setHeader('Allow', 'POST, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
