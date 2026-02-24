'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

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
    <AppShell role={role} title="Previous Work">
      <div className="space-y-8">
        <Card className="p-8 bg-white border-border shadow-md">
          <p className="text-2xl font-black text-primary italic underline decoration-accent decoration-4 underline-offset-8">Latest snapshots</p>
          <p className="mt-4 text-lg text-muted-foreground font-medium">Recent check-ins and check-outs across your assigned modules.</p>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length ? (
          <div className="space-y-4">
            {rows.map((r) => (
              <Card key={r.id} className="p-6 bg-white border-border shadow-sm hover:border-primary transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <p className="text-lg font-black text-primary uppercase tracking-tight italic">{r.snapshot_type.replace('_', ' ')}</p>
                  </div>
                  <p className="text-xs font-bold text-muted-foreground bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <p className="text-base text-gray-700 font-medium leading-relaxed">{r.public_summary || 'No summary provided.'}</p>
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Module ID: {r.module_id}</p>
                  <div className="h-6 w-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <div className="h-1 w-1 rounded-full bg-gray-300 group-hover:bg-primary transition-colors" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 bg-white border-border shadow-md text-center">
            <p className="text-lg font-bold text-muted-foreground">No snapshots found.</p>
            <p className="text-sm text-muted-foreground mt-1">Check-in to a module to create your first work snapshot.</p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
