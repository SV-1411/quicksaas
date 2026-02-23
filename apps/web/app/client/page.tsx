'use client';

import Link from 'next/link';
import { LogoutButton } from '../../components/logout-button';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { calculateDynamicPrice } from '../../../../services/pricing-engine';

export default function ClientDashboard() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [title, setTitle] = useState('');
  const [requirement, setRequirement] = useState('');
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    const complexity = Math.min(100, Math.max(10, Math.floor(requirement.length / 20)));
    return calculateDynamicPrice({
      complexityScore: complexity,
      baseRate: 1200,
      urgencyMultiplier: requirement.toLowerCase().includes('urgent') ? 15000 : 6000,
      resourceLoadFactor: 5000,
      integrationWeight: 7000,
      activeProjects: 1250,
      capacityThreshold: 1000,
    });
  }, [requirement]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    if (!accessToken) {
      setError('No active session. Please login again.');
      return;
    }

    const response = await fetch('/api/projects/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ title, rawRequirement: requirement }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? 'Failed to create project');
      return;
    }

    router.push(payload.redirectTo);
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Client Dashboard</h1><LogoutButton /></div>
      <form className="space-y-3 rounded-lg border p-4" onSubmit={onCreate}>
        <h2 className="font-medium">Create Project</h2>
        <input className="w-full rounded border p-2" placeholder="Project title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className="min-h-40 w-full rounded border p-2"
          placeholder="Describe requirements"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">Dynamic Price Preview: ₹{preview.total.toFixed(2)}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="rounded bg-black px-4 py-2 text-white">Create Project</button>
      </form>
      <Link href="/" className="text-sm underline">
        Back to Home
      </Link>
    </main>
  );
}
