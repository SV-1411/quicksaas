'use client';

import { useEffect, useState, useMemo } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';
import { AppShell } from '../../../components/layout/app-shell';
import { Card } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { History, FileCode, CheckCircle2, Clock, Cpu } from 'lucide-react';
import { Button } from '../../../components/ui/button';

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
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold uppercase tracking-wider text-gray-500">System Output</p>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none animate-pulse px-3 py-1 font-mono text-[10px]">
                    {latestDeploymentUrl ? 'LIVE_PRODUCTION' : 'SIMULATED_ENVIRONMENT'}
                  </Badge>
                </div>
                {latestDeploymentUrl ? (
                  <div className="relative group">
                    <iframe className="h-[480px] w-full rounded-xl border-2 border-border bg-white shadow-2xl transition-all group-hover:border-primary/30" src={latestDeploymentUrl} />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" onClick={() => window.open(latestDeploymentUrl, '_blank')}>
                        Open External
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-[480px] w-full overflow-hidden rounded-xl border-2 border-slate-800 bg-slate-950 p-0 font-mono text-[11px] text-emerald-400 shadow-2xl">
                    {/* Simulated Browser Header */}
                    <div className="flex items-center gap-3 border-b border-white/5 bg-slate-900/50 px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-500/40" />
                        <div className="h-3 w-3 rounded-full bg-amber-500/40" />
                        <div className="h-3 w-3 rounded-full bg-emerald-500/40" />
                      </div>
                      <div className="flex-1 flex items-center rounded-lg bg-black/40 px-3 py-1.5 text-[10px] text-emerald-500/40 border border-white/5">
                        https://{project?.title?.toLowerCase().replace(/\s+/g, '-') || 'project'}.gigzs.preview
                      </div>
                    </div>
                    
                    {/* Simulated Content */}
                    <div className="relative h-[calc(480px-45px)] p-6 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#020617,0%,#000000_100%)]">
                      <div className="grid grid-cols-12 gap-4 h-full opacity-40">
                        {/* Mock UI layout */}
                        <div className="col-span-3 space-y-4">
                          <div className="h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20" />
                          <div className="space-y-2">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="h-2 w-full rounded bg-emerald-500/5" />
                            ))}
                          </div>
                        </div>
                        <div className="col-span-9 space-y-6">
                          <div className="h-32 rounded-xl bg-emerald-500/5 border border-emerald-500/10 animate-pulse" />
                          <div className="grid grid-cols-2 gap-4">
                            <div className="h-24 rounded-xl border border-emerald-500/10 bg-emerald-500/5" />
                            <div className="h-24 rounded-xl border border-emerald-500/10 bg-emerald-500/5" />
                          </div>
                        </div>
                      </div>

                      {/* Floating Matrix-style status */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center space-y-4 relative z-20">
                          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-bounce">
                            <Cpu className="h-8 w-8 text-emerald-400" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold text-white tracking-tight uppercase">Provisioning Resources</h4>
                            <p className="text-emerald-500/60 text-[10px] uppercase tracking-[0.3em]">Deploying to edge nodes...</p>
                          </div>
                        </div>
                      </div>

                      {/* Log Stream Terminal Overlay */}
                      <div className="absolute bottom-6 left-6 right-6 rounded-lg bg-black/90 border border-emerald-500/20 p-4 font-mono shadow-2xl backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-500/10">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-bold text-emerald-500/80 uppercase">Build Pipeline: Active</span>
                        </div>
                        <div className="space-y-1.5 text-[9px] leading-relaxed">
                          <div className="flex gap-2"><span className="text-emerald-500/30">01:42:09</span> <span className="text-white/70">[cli]</span> initializing docker container...</div>
                          <div className="flex gap-2"><span className="text-emerald-500/30">01:42:11</span> <span className="text-white/70">[cli]</span> pulling image node:20-alpine</div>
                          <div className="flex gap-2"><span className="text-emerald-500/30">01:42:15</span> <span className="text-emerald-500/80">[build]</span> npm install executed successfully</div>
                          <div className="flex gap-2"><span className="text-emerald-500/30">01:42:18</span> <span className="text-emerald-400 animate-pulse">[deploy]</span> binding port 3000 to edge interface...</div>
                        </div>
                      </div>

                      {/* High-tech Scanning Effect */}
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent h-32 w-full animate-wave opacity-20" style={{ animationDuration: '2.5s' }} />
                    </div>
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
