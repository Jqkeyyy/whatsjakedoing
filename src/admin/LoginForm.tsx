import { useState } from 'react';
import { login } from '../lib/adminApi';
import { CosmicBackground } from '../components/CosmicBackground';

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
    <div className="flex min-h-screen items-center justify-center bg-void">
      <CosmicBackground />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-depth"
      >
        <h1 className="font-display text-xl font-extrabold tracking-tight text-ink">Admin login</h1>
        <label htmlFor="admin-password" className="mt-4 block text-sm font-semibold text-ink">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-3 py-2 text-ink focus:border-ember focus:outline-none"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-full bg-ember px-4 py-2 font-semibold text-void disabled:opacity-50"
        >
          Log in
        </button>
      </form>
    </div>
  );
}
