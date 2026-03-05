'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, CalendarPlus } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { useToast } from '../../lib/hooks/use-toast';
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
  const { show } = useToast();
  const supabase = createSupabaseBrowserClient();
  const [modules, setModules] = useState<ModuleCard[]>([]);
  const [availableShifts, setAvailableShifts] = useState<any[]>([]);
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

      const mktRes = await fetch('/api/freelancer/marketplace', { headers: { Authorization: `Bearer ${token}` } });
      if (mktRes.ok) {
        const mktPayload = await mktRes.json();
        setAvailableShifts(mktPayload.modules ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  const claimShift = async (moduleId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/freelancer/marketplace/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ moduleId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to claim shift');
      }

      show('Shift Claimed', 'You have been assigned to this module. Shift timer started.');
      load(); // Reload data
    } catch (err: any) {
      show('Claim Failed', err.message);
    }
  };

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
              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-950 p-12 text-center shadow-2xl">
                {/* Background Animation */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]" />
                <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl animate-pulse delay-700" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <Sparkles className="h-10 w-10 text-emerald-400 animate-pulse" />
                  </div>

                  <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
                    Standby for High-Priority Assignments
                  </h3>
                  <p className="text-emerald-500/60 max-w-md mx-auto mb-8 font-mono text-sm uppercase tracking-widest">
                    Your workstation is active and synchronized
                  </p>

                  <div className="flex gap-4 justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-400/70 font-mono uppercase">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Global Match Engine Online
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/5 border border-cyan-500/10 text-[10px] text-cyan-400/70 font-mono uppercase">
                      <Clock className="h-3 w-3" />
                      Shift Relay Active
                    </div>
                  </div>
                </div>

                {/* Scanning line */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent h-20 w-full animate-wave opacity-30" style={{ animationDuration: '4s' }} />
              </div>
            )}
          </Card>

          <Card className="p-5 border-white/5 bg-[#0a0a0f]">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400">
                <CalendarPlus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Shift Marketplace</p>
                <p className="text-sm text-cyan-400/50 font-mono tracking-widest uppercase">Global Execution Queue</p>
              </div>
            </div>

            {availableShifts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {availableShifts.map((shift, i) => (
                  <motion.div key={shift.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center p-5 rounded-sm border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors gap-4">
                      <div>
                        <div className="font-mono text-[10px] tracking-widest text-emerald-500/80 mb-1 uppercase">Queue ID: {shift.id.split('-')[0]}</div>
                        <h4 className="font-medium text-white text-base">{shift.module_name}</h4>
                        <div className="text-xs text-white/40 mt-1 capitalize">Weight: {shift.module_weight}</div>
                      </div>
                      <button
                        onClick={() => claimShift(shift.id)}
                        className="px-6 py-2.5 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 font-medium tracking-wide text-[11px] uppercase rounded-sm transition-all duration-300 hover:bg-cyan-500/40 hover:-translate-y-0.5"
                      >
                        Claim Shift
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center border border-white/5 rounded-sm bg-white/[0.01]">
                <p className="text-white/30 font-mono text-[11px] tracking-widest uppercase mb-2">No open shifts available</p>
                <p className="text-white/20 text-sm">All required modules are currently assigned to active floor shifts.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
