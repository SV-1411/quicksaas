'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import FreelancerOnboarding from '../../components/freelancer/onboarding-form';

interface ModuleCard { 
  id: string; 
  module_name: string; 
  module_status: string; 
  shift?: {
    status: string;
    shift_start: string;
    shift_end: string;
  } | null;
}

export default function FreelancerDashboard() {
  const supabase = createSupabaseBrowserClient();
  const [modules, setModules] = useState<ModuleCard[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token || !session.user) {
        setLoading(false);
        return;
      }

      const { data: actor } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      const actorId = actor?.id;

      const { data: profileData } = actorId
        ? await supabase
            .from('freelancer_profiles')
            .select('*')
            .eq('user_id', actorId)
            .maybeSingle()
        : { data: null as any };

      setProfile(profileData);

      const res = await fetch('/api/freelancer/modules', { headers: { Authorization: `Bearer ${token}` } });
      const payload = await res.json();
      setModules(payload.modules ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel('freelancer-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'freelancer_profiles' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_module_assignments' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_modules' }, load)
      .subscribe();

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
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !profile ? (
        <FreelancerOnboarding />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <Card key={card.label} className="p-5"><p className="text-sm text-muted-foreground">{card.label}</p><p className="mt-1 text-2xl font-semibold">{card.value}</p></Card>)}</div>
          <Card className="p-5">
            <p className="mb-4 text-lg font-semibold">Assigned modules</p>
            {modules.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {modules.map((module, i) => (
                  <motion.div key={module.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link href={`/modules/${module.id}`}>
                      <Card className="h-full p-4 transition hover:border-primary/40">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{module.module_name}</p>
                          <Badge>{module.module_status}</Badge>
                        </div>
                        {module.shift && (
                          <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                            <p>Shift: <span className="font-medium text-foreground">{new Date(module.shift.shift_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(module.shift.shift_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                            <p>Status: <Badge className="scale-75 origin-left ml-[-4px] capitalize">{module.shift.status}</Badge></p>
                          </div>
                        )}
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No modules assigned yet.</div>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
