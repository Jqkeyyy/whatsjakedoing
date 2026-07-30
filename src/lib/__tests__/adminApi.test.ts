import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkSession,
  login,
  logout,
  createCategory,
  deleteEvent,
  setStatusOverride,
} from '../adminApi';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('checkSession', () => {
  it('returns true when /api/login GET responds ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    expect(await checkSession()).toBe(true);
  });

  it('returns false when /api/login GET responds 401', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    expect(await checkSession()).toBe(false);
  });
});

describe('login', () => {
  it('posts the password and resolves on success', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    await expect(login('hunter2')).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      '/api/login',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
  });

  it('throws with the server error message on failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid password' }),
    });
    await expect(login('wrong')).rejects.toThrow('Invalid password');
  });
});

describe('logout', () => {
  it('sends a DELETE to /api/login', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    await logout();
    expect(fetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({ method: 'DELETE' }));
  });
});

describe('createCategory', () => {
  it('posts to /api/categories and returns the created row', async () => {
    const created = { id: '1', name: 'Work', color: '#000', isBusy: true };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => created,
    });
    const result = await createCategory({ name: 'Work', color: '#000', isBusy: true });
    expect(result).toEqual(created);
    expect(fetch).toHaveBeenCalledWith('/api/categories', expect.objectContaining({ method: 'POST' }));
  });
});

describe('deleteEvent', () => {
  it('sends a DELETE with the event id in the body', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 204 });
    await deleteEvent('event-1');
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.method).toBe('DELETE');
    expect(JSON.parse(options.body)).toEqual({ id: 'event-1' });
  });
});

describe('setStatusOverride', () => {
  it('posts to /api/status', async () => {
    const created = { id: '1', isBusy: true, startsAt: 'a', endsAt: 'b' };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => created,
    });
    const result = await setStatusOverride({ isBusy: true, startsAt: 'a', endsAt: 'b' });
    expect(result).toEqual(created);
  });
});
