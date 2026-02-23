'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) return setError(payload.error ?? 'Login failed');
    router.push(payload.redirectTo ?? '/');
    router.refresh();
  };

  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md p-8">
        <h1 className="font-[var(--font-heading)] text-3xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to access your Gigzs workspace.</p>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <input className="w-full rounded-lg border bg-background p-2.5" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-lg border bg-background p-2.5" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
        </form>
      </Card>
    </main>
  );
}
