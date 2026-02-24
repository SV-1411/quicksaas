'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/app-shell';
import { Card } from '../../../components/ui/card';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';
import { useToast } from '../../../lib/hooks/use-toast';
import AiroBuilderWorkspace from '../../../components/freelancer/airobuilder-workspace';

export default function AiroBuilderToolsPage() {
  const supabase = createSupabaseBrowserClient();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'client' | 'freelancer' | 'admin'>('freelancer');
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setLoading(false);
          return;
        }

        const actorRes = await supabase
          .from('users')
          .select('role')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        if (actorRes.data?.role) setRole(actorRes.data.role);

        const res = await fetch('/api/freelancer/modules', { headers: { Authorization: `Bearer ${token}` } });
        const raw = await res.json();
        if (!res.ok) throw new Error(raw.error ?? 'Failed to load modules');
        setModules(raw.modules ?? []);
      } catch (e: any) {
        show('Error', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell role={role} title="AiroBuilder">
      <div className="space-y-8">
        <Card className="p-8 text-foreground bg-white border-border shadow-md">
          <p className="text-2xl font-black text-primary italic underline decoration-accent decoration-4 underline-offset-8">Provision workspaces</p>
          <p className="mt-4 text-lg text-muted-foreground font-medium">
            Launch GoDaddy AiroBuilder sessions for your assigned modules.
          </p>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : modules.length ? (
          <div className="space-y-10">
            {modules.map((m) => (
              <div key={m.id} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <p className="text-xl font-black text-primary uppercase tracking-tight italic">{m.module_name}</p>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1">Assignment ID: {m.id}</p>
                  </div>
                </div>
                <AiroBuilderWorkspace moduleId={m.id} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-12 bg-white border-border shadow-md text-center">
            <p className="text-lg font-bold text-muted-foreground">No active assignments found.</p>
            <p className="text-sm text-muted-foreground mt-1">Modules will appear here once they are assigned to your shift.</p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
