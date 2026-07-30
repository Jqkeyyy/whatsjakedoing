import type { Category, CalendarEvent, StatusOverride } from '../types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  // For success responses with { ok: true }, return undefined
  if (body?.ok === true && Object.keys(body).length === 1) return undefined as T;
  return body as T;
}

export async function checkSession(): Promise<boolean> {
  const res = await fetch('/api/login', { method: 'GET', credentials: 'include' });
  return res.ok;
}

export function login(password: string): Promise<void> {
  return request('/api/login', { method: 'POST', body: JSON.stringify({ password }) });
}

export function logout(): Promise<void> {
  return request('/api/login', { method: 'DELETE' });
}

export function createCategory(input: Omit<Category, 'id'>): Promise<Category> {
  return request('/api/categories', { method: 'POST', body: JSON.stringify(input) });
}

export function updateCategory(id: string, input: Omit<Category, 'id'>): Promise<Category> {
  return request('/api/categories', { method: 'PUT', body: JSON.stringify({ id, ...input }) });
}

export function deleteCategory(id: string): Promise<void> {
  return request('/api/categories', { method: 'DELETE', body: JSON.stringify({ id }) });
}

export function createEvent(input: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  return request('/api/events', { method: 'POST', body: JSON.stringify(input) });
}

export function updateEvent(id: string, input: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  return request('/api/events', { method: 'PUT', body: JSON.stringify({ id, ...input }) });
}

export function deleteEvent(id: string): Promise<void> {
  return request('/api/events', { method: 'DELETE', body: JSON.stringify({ id }) });
}

export function setStatusOverride(input: Omit<StatusOverride, 'id'>): Promise<StatusOverride> {
  return request('/api/status', { method: 'POST', body: JSON.stringify(input) });
}

export function clearStatusOverride(id: string): Promise<void> {
  return request('/api/status', { method: 'DELETE', body: JSON.stringify({ id }) });
}
