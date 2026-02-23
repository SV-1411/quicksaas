'use client';

import Link from 'next/link';
import { LogoutButton } from '../../components/logout-button';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

interface ModuleCard {
  id: string;
  module_name: string;
  module_status: string;
  project_id: string;
}

export default function FreelancerDashboard() {
  const supabase = createSupabaseBrowserClient();
  const [modules, setModules] = useState<ModuleCard[]>([]);

  async function load() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;

    const res = await fetch('/api/freelancer/modules', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await res.json();
    setModules(payload.modules ?? []);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel('freelancer-modules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_modules' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Freelancer Dashboard</h1><LogoutButton /></div>
      <section className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <article key={module.id} className="rounded-lg border p-4">
            <p className="font-medium">{module.module_name}</p>
            <p className="text-sm text-muted-foreground">{module.module_status}</p>
            <Link href={`/modules/${module.id}`} className="mt-2 inline-block text-sm underline">
              Open module
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
