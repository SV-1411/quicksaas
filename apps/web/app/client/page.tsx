'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock3, FolderKanban, ShieldCheck, Sparkles } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { calculateDynamicPrice } from '../../../../services/pricing-engine';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { useToast } from '../../lib/hooks/use-toast';

export default function ClientDashboard() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { show } = useToast();
  const [title, setTitle] = useState('');
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);

  const preview = useMemo(() => {
    const complexity = Math.min(100, Math.max(10, Math.floor(requirement.length / 20)));
    return calculateDynamicPrice({ complexityScore: complexity, baseRate: 1200, urgencyMultiplier: requirement.toLowerCase().includes('urgent') ? 15000 : 6000, resourceLoadFactor: 5000, integrationWeight: 7000, activeProjects: 1250, capacityThreshold: 1000 });
  }, [requirement]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    if (!accessToken) return;
    const response = await fetch('/api/projects/create', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ title, rawRequirement: requirement }) });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) return show('Project creation failed', payload.error);
    show('Project created', 'Execution modules initialized.');
    router.push(payload.redirectTo);
  };

  const kpis = [
    { label: 'Active Projects', value: '12', icon: FolderKanban },
    { label: 'Avg Delivery', value: '9.2 days', icon: Clock3 },
    { label: 'Total Spend', value: '₹18.4L', icon: Sparkles },
    { label: 'Reliability', value: '97.8%', icon: ShieldCheck },
  ];

  const rows = [
    { name: 'B2B Fulfillment Portal', status: 'active', deadline: '2026-03-12', completion: 68, risk: 'Low' },
    { name: 'Distributor Ops App', status: 'review', deadline: '2026-02-28', completion: 91, risk: 'Low' },
    { name: 'Channel Pricing Engine', status: 'at_risk', deadline: '2026-02-26', completion: 44, risk: 'Medium' },
  ];

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
            <Modal trigger={<Button>Create Project</Button>} title="Create New Project">
              <form className="space-y-3" onSubmit={onCreate}>
                <input className="w-full rounded-lg border bg-background p-2.5" placeholder="Project title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea className="min-h-36 w-full rounded-lg border bg-background p-2.5" placeholder="Describe business requirement" value={requirement} onChange={(e) => setRequirement(e.target.value)} />
                <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">Price preview: <span className="font-medium text-foreground">₹{preview.total.toLocaleString()}</span></div>
                <Button className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create and launch execution'}</Button>
              </form>
            </Modal>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3">Project</th><th className="pb-3">Status</th><th className="pb-3">Deadline</th><th className="pb-3">Completion</th><th className="pb-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name} className="border-t border-border/70">
                    <td className="py-3">{row.name}</td>
                    <td className="py-3"><Badge>{row.status}</Badge></td>
                    <td className="py-3">{row.deadline}</td>
                    <td className="py-3">{row.completion}%</td>
                    <td className="py-3 flex items-center gap-2">{row.risk === 'Medium' ? <AlertTriangle className="h-4 w-4 text-amber-400" /> : null}{row.risk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
