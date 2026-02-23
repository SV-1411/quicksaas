'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'freelancer'>('client');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, role }),
    });

    const payload = await response.json();
    if (!response.ok) return setError(payload.error ?? 'Signup failed');
    router.push('/login');
  };

  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md p-8">
        <h1 className="font-[var(--font-heading)] text-3xl font-semibold">Create workspace account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start managed delivery with Gigzs.</p>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <input className="w-full rounded-lg border bg-background p-2.5" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input className="w-full rounded-lg border bg-background p-2.5" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-lg border bg-background p-2.5" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <select className="w-full rounded-lg border bg-background p-2.5" value={role} onChange={(e) => setRole(e.target.value as 'client' | 'freelancer')}>
            <option value="client">Client</option>
            <option value="freelancer">Freelancer</option>
          </select>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button className="w-full">Create account</Button>
        </form>
      </Card>
    </main>
  );
}
