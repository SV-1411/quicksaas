'use client';

import { useEffect, useState, useMemo } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';
import { AppShell } from '../../../components/layout/app-shell';
import { Card } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { History, FileCode, CheckCircle2, Clock } from 'lucide-react';

interface ModuleItem { id: string; module_name: string; module_status: string; }
interface SessionItem { id: string; module_id: string; deployment_url: string; build_url: string; session_status: string; }
interface ProgressLog { id: string; module_id: string; public_summary: string; percent_delta: number; created_at: string; }
interface Snapshot { id: string; module_id: string; public_summary: string; created_at: string; }

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseBrowserClient();
  const [project, setProject] = useState<any>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/projects/${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
    const raw = await res.text();
    const payload = raw ? (JSON.parse(raw) as any) : {};
    
    if (!res.ok) {
      setLoading(false);
      return;
    }

    setProject(payload.project);
    setModules(payload.modules ?? []);
    setSessions(payload.sessions ?? []);
    setLogs(payload.progressLogs ?? []);
    setSnapshots(payload.workSnapshots ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    
    const moduleChannel = supabase.channel(`project-modules-${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_modules', filter: `project_id=eq.${params.id}` }, load)
      .subscribe();

    const projectChannel = supabase.channel(`project-status-${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${params.id}` }, load)
      .subscribe();

    const logChannel = supabase.channel(`project-logs-${params.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'progress_logs', filter: `project_id=eq.${params.id}` }, load)
      .subscribe();

    return () => {
      void supabase.removeChannel(moduleChannel);
      void supabase.removeChannel(projectChannel);
      void supabase.removeChannel(logChannel);
    };
  }, [params.id]);

  const completion = modules.length ? Math.round((modules.filter((m) => m.module_status === 'completed').length / modules.length) * 100) : 0;

  const latestDeploymentUrl = useMemo(() => {
    const readySession = sessions.find(s => s.deployment_url && (s.session_status === 'ready' || s.session_status === 'deployed'));
    return readySession?.deployment_url || null;
  }, [sessions]);

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
            <div className="space-y-6">
              <Card className="p-6">
                <p className="font-semibold mb-4">Live execution pipeline</p>
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div key={module.id} className="rounded-lg border border-border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">{module.module_name}</p>
                        </div>
                        <Badge>{module.module_status}</Badge>
                      </div>
                      <Progress value={module.module_status === 'completed' ? 100 : module.module_status === 'in_progress' ? 55 : 20} />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Execution Timeline</p>
                </div>
                <div className="space-y-6">
                  {logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">Waiting for first execution update...</p>
                  ) : (
                    logs.map((log, i) => (
                      <div key={log.id} className="relative pl-6 border-l border-border pb-6 last:pb-0">
                        <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary" />
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                          {log.percent_delta > 0 && <Badge className="bg-emerald-500/10 text-emerald-500 border-none">+{log.percent_delta}% progress</Badge>}
                        </div>
                        <p className="text-sm">{log.public_summary}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Deployment preview</p>
                  {latestDeploymentUrl && <Badge className="bg-emerald-500/10 text-emerald-500 border-none animate-pulse">LIVE</Badge>}
                </div>
                {latestDeploymentUrl ? (
                  <iframe className="h-[360px] w-full rounded-lg border border-border bg-white" src={latestDeploymentUrl} />
                ) : (
                  <div className="flex h-[360px] w-full flex-col items-center justify-center rounded-lg border border-border bg-muted text-center p-6">
                    <p className="text-sm text-muted-foreground">Environment provisioning...</p>
                    <p className="mt-1 text-xs text-muted-foreground italic">Real-time build will appear here</p>
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <p className="text-sm font-medium mb-3">Managed Resources</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded border border-border bg-card/50">
                    <span className="text-xs">GitHub Repository</span>
                    <Badge variant="outline" className="text-[10px]">PRIVATE</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border border-border bg-card/50">
                    <span className="text-xs">Cloud Environment</span>
                    <Badge variant="outline" className="text-[10px]">ACTIVE</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
