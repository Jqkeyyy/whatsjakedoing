import { useState } from 'react';
import { login } from '../lib/adminApi';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border-2 border-ink bg-white p-6 shadow-offset"
      >
        <h1 className="font-display text-xl text-ink">Admin login</h1>
        <label htmlFor="admin-password" className="mt-4 block text-sm font-semibold text-ink">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-ink px-3 py-2"
        />
        {error && <p className="mt-2 text-sm text-terracotta">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-full border-2 border-ink bg-terracotta px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Log in
        </button>
      </form>
    </div>
  );
}
