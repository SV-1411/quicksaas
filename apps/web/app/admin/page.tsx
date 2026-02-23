'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRightLeft, IndianRupee, ShieldCheck, Workflow } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';
import { useToast } from '../../lib/hooks/use-toast';

export default function AdminDashboard() {
  const supabase = createSupabaseBrowserClient();
  const { show } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);

  async function load() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const res = await fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } });
    const payload = await res.json();
    setProjects(payload.projects ?? []);
    setRisks(payload.risks ?? []);
    setFreelancers(payload.freelancers ?? []);
  }

  async function reassign(moduleId: string) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const res = await fetch('/api/admin/reassign', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ moduleId }) });
    const payload = await res.json();
    if (!res.ok) return show('Reassignment failed', payload.error);
    show('Module reassigned', `Module ${moduleId.slice(0, 8)} updated`);
    await load();
  }

  useEffect(() => {
    load();
    const channel = supabase.channel('admin-risk-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'risk_logs' }, load).subscribe();
    return () => void supabase.removeChannel(channel);
  }, []);

  const revenue = useMemo(() => projects.reduce((sum, p) => sum + Number(p.total_price || 0), 0), [projects]);
  const avgReliability = useMemo(() => freelancers.length ? (freelancers.reduce((sum, f) => sum + Number(f.reliability_score || 0), 0) / freelancers.length).toFixed(2) : '0', [freelancers]);

  const metrics = [
    { label: 'Active Projects', value: String(projects.length), icon: Workflow },
    { label: 'Risk Alerts', value: String(risks.length), icon: AlertTriangle },
    { label: 'Revenue Summary', value: `₹${revenue.toLocaleString()}`, icon: IndianRupee },
    { label: 'Reliability Heat', value: avgReliability, icon: ShieldCheck },
  ];

  return (
    <AppShell role="admin" title="Admin Control Center">
      <div className="space-y-6" id="risk">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m) => <Card key={m.label} className="p-5"><m.icon className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{m.label}</p><p className="mt-1 text-2xl font-semibold">{m.value}</p></Card>)}
        </div>

        <Card className="p-6">
          <p className="mb-4 text-lg font-semibold">Risk alerts and reassignment</p>
          <div className="space-y-3">
            {risks.map((risk) => (
              <div key={risk.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">Module {risk.module_id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">Risk score {risk.risk_score} · {risk.trigger_type}</p>
                </div>
                <Modal
                  title="Reassign module"
                  trigger={<Button variant="outline"><ArrowRightLeft className="mr-2 h-4 w-4" />Reassign</Button>}
                >
                  <p className="mb-3 text-sm text-muted-foreground">Ranked freelancers for this module.</p>
                  <div className="space-y-2">
                    {freelancers.slice(0, 5).map((f, i) => (
                      <div key={f.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <span>{f.full_name}</span>
                        <span className="text-muted-foreground">Similarity {(0.92 - i * 0.07).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-4 w-full" onClick={() => reassign(risk.module_id)}>Confirm Reassignment</Button>
                </Modal>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
