'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { motion } from 'framer-motion';
import { Database, Search, History as HistoryIcon, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function HistoryPage() {
  const supabase = createSupabaseBrowserClient();
  const [role, setRole] = useState<'client' | 'freelancer' | 'admin'>('freelancer');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const actorRes = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();
      if (actorRes.data?.role) setRole(actorRes.data.role);

      const actorId = actorRes.data?.id;
      if (!actorId) {
        setLoading(false);
        return;
      }

      const assignments = await supabase
        .from('project_module_assignments')
        .select('module_id')
        .eq('freelancer_id', actorId)
        .is('deleted_at', null);

      const moduleIds = (assignments.data ?? []).map((a: any) => a.module_id);
      if (!moduleIds.length) {
        setRows([]);
        setLoading(false);
        return;
      }

      const snapshots = await supabase
        .from('work_snapshots')
        .select('id, module_id, snapshot_type, public_summary, created_at')
        .in('module_id', moduleIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      setRows(snapshots.data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell role={role} title="Execution Archive">
      <div className="space-y-8 pb-20">
        <Card className="relative overflow-hidden p-10 border-none bg-slate-950 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_-20%,rgba(16,185,129,0.1),transparent_50%)]" />
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <Database className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Neural History Log</span>
            </div>
            <h1 className="text-4xl font-black italic tracking-tight mb-4 uppercase">
              Execution <span className="text-emerald-500">Archive</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Comprehensive immutable record of all neural-linked executions, check-ins, and shift relay handoffs.
            </p>
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length ? (
          <div className="space-y-4">
            {rows.map((r) => (
              <Card key={r.id} className="p-6 bg-white border-border shadow-sm hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-lg font-black text-primary uppercase tracking-tight italic">{r.snapshot_type.replace('_', ' ')}</p>
                  </div>
                  <p className="text-xs font-bold text-muted-foreground bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <p className="text-base text-gray-700 font-medium leading-relaxed">{r.public_summary || 'No summary provided.'}</p>
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Module ID: {r.module_id}</p>
                  <div className="h-6 w-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                    <div className="h-1 w-1 rounded-full bg-gray-300 group-hover:bg-emerald-500 transition-colors" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-950 p-16 text-center shadow-2xl">
            {/* Background Neural Grid */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]" />
            
            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
              >
                <HistoryIcon className="h-12 w-12 text-emerald-400" />
              </motion.div>
              
              <h3 className="text-3xl font-black tracking-tight text-white mb-4 uppercase italic">
                Archive <span className="text-emerald-500">Synchronizing</span>
              </h3>
              <p className="text-emerald-500/60 max-w-sm mx-auto mb-10 font-mono text-xs uppercase tracking-[0.3em] leading-relaxed">
                Immutable ledger is active. Records will manifest upon your first neural-linked execution.
              </p>
              
              <div className="grid grid-cols-3 gap-6 w-full max-w-lg">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <Zap className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instant</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <Sparkles className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural</p>
                </div>
              </div>
            </div>
            
            {/* Scanning line */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent h-20 w-full animate-wave opacity-30" style={{ animationDuration: '5s' }} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
