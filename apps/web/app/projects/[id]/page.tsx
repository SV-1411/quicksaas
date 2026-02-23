'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';
import { AppShell } from '../../../components/layout/app-shell';
import { Card } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';

interface ModuleItem { id: string; module_name: string; module_status: string; }

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseBrowserClient();
  const [project, setProject] = useState<any>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/projects/${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
    const payload = await res.json();
    setProject(payload.project);
    setModules(payload.modules ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase.channel(`project-${params.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'project_modules', filter: `project_id=eq.${params.id}` }, load).subscribe();
    return () => void supabase.removeChannel(channel);
  }, [params.id]);

  const completion = modules.length ? Math.round((modules.filter((m) => m.module_status === 'completed').length / modules.length) * 100) : 0;

  return (
    <AppShell role="client" title="Project Detail">
      {loading ? <Skeleton className="h-80 w-full" /> : (
        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-2xl font-semibold">{project?.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">Live execution pipeline</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Status</p><Badge className="mt-2">{project?.status}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Completion</p><p className="mt-2 text-lg font-medium">{completion}%</p></div>
              <div><p className="text-xs text-muted-foreground">Payment summary</p><p className="mt-2 text-lg font-medium">₹{project?.total_price}</p></div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card className="p-6">
              <p className="font-semibold">Module progress timeline</p>
              <div className="mt-4 space-y-4">
                {modules.map((module) => (
                  <div key={module.id} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium">{module.module_name}</p>
                      <Badge>{module.module_status}</Badge>
                    </div>
                    <Progress value={module.module_status === 'completed' ? 100 : module.module_status === 'in_progress' ? 55 : 20} />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <p className="mb-3 text-sm font-medium">Deployment preview</p>
              <iframe className="h-[360px] w-full rounded-lg border border-border bg-muted" srcDoc="<html><body style='background:#0f1118;color:#d6d8df;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100%'>Deployment preview will appear here</body></html>" />
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
