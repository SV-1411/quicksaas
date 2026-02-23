'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';

interface ModuleCard { id: string; module_name: string; module_status: string; }

export default function FreelancerDashboard() {
  const supabase = createSupabaseBrowserClient();
  const [modules, setModules] = useState<ModuleCard[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const res = await fetch('/api/freelancer/modules', { headers: { Authorization: `Bearer ${token}` } });
    const payload = await res.json();
    setModules(payload.modules ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase.channel('freelancer-modules').on('postgres_changes', { event: '*', schema: 'public', table: 'project_modules' }, load).subscribe();
    return () => void supabase.removeChannel(channel);
  }, []);

  const cards = [
    { label: 'Reliability', value: '1.12' },
    { label: 'Earnings (MTD)', value: '₹1,42,400' },
    { label: 'Active Modules', value: String(modules.length) },
    { label: 'Completion Rate', value: '94%' },
  ];

  return (
    <AppShell role="freelancer" title="Freelancer Workspace">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <Card key={card.label} className="p-5"><p className="text-sm text-muted-foreground">{card.label}</p><p className="mt-1 text-2xl font-semibold">{card.value}</p></Card>)}</div>
        <Card className="p-5">
          <p className="mb-4 text-lg font-semibold">Assigned modules</p>
          {loading ? <div className="grid gap-3 md:grid-cols-2"><Skeleton className="h-32" /><Skeleton className="h-32" /></div> : (
            modules.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{modules.map((module, i) => (
              <motion.div key={module.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/modules/${module.id}`}>
                  <Card className="h-full p-4 transition hover:border-primary/40">
                    <p className="font-medium">{module.module_name}</p>
                    <Badge className="mt-3">{module.module_status}</Badge>
                  </Card>
                </Link>
              </motion.div>
            ))}</div> : <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No modules assigned yet.</div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
