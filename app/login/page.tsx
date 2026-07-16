'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/lib/api';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from') || '/dashboard';
  const denied = params.get('denied') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    denied ? 'Access denied — only superadmin users can sign in.' : null,
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(from);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-4)' }}>
      <form
        onSubmit={handleSubmit}
        className="card elev-md"
        style={{ width: 'min(380px, 100%)', gap: 'var(--space-4)', padding: 'var(--space-6)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ width: 12, height: 12, background: 'var(--color-accent)' }} />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20 }}>
            SynCare Admin
          </span>
        </div>
        <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
          Sign in to continue.
        </p>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-accent-700)' }} role="alert">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" block disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
