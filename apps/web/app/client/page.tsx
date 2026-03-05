'use client';

import { FormEvent, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock3, FolderKanban, ShieldCheck, Sparkles } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { calculateDynamicPrice } from '../../../../services/pricing-engine';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import IntakeForm from '../../components/project/intake-form';
import { useToast } from '../../lib/hooks/use-toast';

export default function ClientDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const supabase = createSupabaseBrowserClient();
  const { show } = useToast();
  const [title, setTitle] = useState('');
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);

  const preview = useMemo(() => {
    const complexity = Math.min(100, Math.max(10, Math.floor(requirement.length / 20)));
    return calculateDynamicPrice({ complexityScore: complexity, baseRate: 1200, urgencyMultiplier: requirement.toLowerCase().includes('urgent') ? 15000 : 6000, resourceLoadFactor: 5000, integrationWeight: 7000, activeProjects: 1250, capacityThreshold: 1000 });
  }, [requirement]);

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error('Failed to fetch projects', err);
      }
    };
    fetchProjects();
  }, []);

  const kpis = [
    { label: 'Active Projects', value: '12', icon: FolderKanban },
    { label: 'Avg Delivery', value: '9.2 days', icon: Clock3 },
    { label: 'Total Spend', value: '₹18.4L', icon: Sparkles },
    { label: 'Reliability', value: '97.8%', icon: ShieldCheck },
  ];

  if (projectId) {
    return (
      <AppShell role="client" title="Project Intelligence">
        <ProjectDetailView projectId={projectId} onBack={() => router.push('/client')} />
      </AppShell>
    );
  }

  return (
    <AppShell role="client" title="Client Command Center">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="group p-5 transition hover:-translate-y-0.5 hover:border-primary/40">
                <kpi.icon className="mb-4 h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="mt-1 text-2xl font-semibold">{kpi.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">Project pipeline</p>
              <p className="text-sm text-muted-foreground">Execution visibility across all modules.</p>
            </div>
            <Button onClick={() => router.push('/client/new')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono tracking-widest text-[11px] uppercase rounded-sm h-10 px-6 uppercase">Launch New Project</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3">Project</th><th className="pb-3">Status</th><th className="pb-3">Deadline</th><th className="pb-3">Completion</th><th className="pb-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground/60">No active projects running.</td></tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className="border-t border-border/70 group hover:bg-white/5 cursor-pointer transition-colors" onClick={() => router.push(`/client?project=${p.id}`)}>
                      <td className="py-4 font-medium">{p.title}</td>
                      <td className="py-4"><Badge className="bg-emerald-500/20 text-emerald-400 border-none">{p.status}</Badge></td>
                      <td className="py-4 font-mono text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="py-4 text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{p.raw_requirement}</td>
                      <td className="py-4 flex items-center gap-2">{p.complexity_score} / 100</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function ProjectDetailView({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const [data, setData] = useState<{ project?: any; modules?: any[]; feed?: any[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/feed`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [projectId]);

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground animate-pulse font-mono text-sm tracking-widest uppercase">Syncing with execution engine...</div>;
  }

  if (!data.project) {
    return <div className="p-10 text-center text-red-500">Project not found or access denied.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-muted-foreground hover:text-white mb-2 font-mono text-[10px] tracking-widest uppercase transition-colors">← Return to pipeline</button>
          <h2 className="text-3xl font-light tracking-tight">{data.project.title}</h2>
          <div className="flex items-center gap-3 mt-3">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-3">{data.project.status}</Badge>
            <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">ID: {projectId.split('-')[0]}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Modules / Stats */}
        <Card className="col-span-1 p-6 border-white/5 bg-[#0a0a0f]">
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#0d1a2e]/40 mb-6 border-b border-white/5 pb-2">Execution Modules</h3>
          <div className="space-y-4">
            {data.modules?.length === 0 && <p className="text-sm text-muted-foreground">Parsing requirements...</p>}
            {data.modules?.map((m: any) => (
              <div key={m.id} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/80">{m.module_name}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">{m.module_status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column: Update Feed (Pizza Tracker) */}
        <Card className="col-span-2 p-6 border-white/5 bg-[#0a0a0f] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-emerald-500/50 uppercase">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
              Live Connection
            </div>
          </div>
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-white/40 mb-8 border-b border-white/5 pb-2">Chronological Feed</h3>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/5 before:to-transparent">
            {data.feed?.length === 0 && (
              <div className="text-center py-10 font-mono text-[11px] tracking-widest uppercase text-white/20">Awaiting initial floor updates...</div>
            )}
            {data.feed?.map((item: any, i: number) => (
              <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/10 bg-[#0a0a0f] text-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-sm border border-white/5 bg-white/[0.02] shadow-sm transition-colors hover:bg-white/[0.04]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400/80">{item.update_type}</span>
                    <time className="font-mono text-[9px] uppercase tracking-widest text-white/30">{new Date(item.created_at).toLocaleString()}</time>
                  </div>
                  <h4 className="text-sm font-medium text-white/90">{item.headline || 'System Update'}</h4>
                  {item.detail_md && <p className="text-xs text-white/50 mt-2 font-light">{item.detail_md}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
