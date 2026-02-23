'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';
import { AppShell } from '../../../components/layout/app-shell';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useToast } from '../../../lib/hooks/use-toast';

interface Snapshot { id: string; version_no: number; work_summary: string; created_at: string; }

export default function ModuleDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseBrowserClient();
  const { show } = useToast();
  const [summary, setSummary] = useState('');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadSnapshots() {
    const { data } = await supabase.from('module_snapshots').select('id, version_no, work_summary, created_at').eq('module_id', params.id).order('version_no', { ascending: false });
    setSnapshots((data ?? []) as Snapshot[]);
  }

  async function submitSnapshot(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/modules/${params.id}/snapshot`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ workSummary: summary, structuredProgressJson: { note: summary }, fileReferences: [], timeSpentMinutes: 60, completionPercentage: 0.2, aiQualityScore: 0.9, penalties: 0 }) });
    const payload = await res.json();
    setLoading(false);
    if (!res.ok) return show('Submission failed', payload.error);
    setSummary('');
    show('Snapshot submitted', `Version ${payload.snapshot.versionNo} saved`);
    await loadSnapshots();
  }

  async function launchAiroBuilder() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const res = await fetch('/api/airobuilder/create-session', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ moduleId: params.id, projectContext: { source: 'workspace' } }) });
    const payload = await res.json();
    if (!res.ok) return show('Launch failed', payload.error);
    show('AiroBuilder ready', 'Build session created');
    if (payload.session?.buildUrl) window.open(payload.session.buildUrl, '_blank');
  }

  useEffect(() => {
    loadSnapshots();
    const channel = supabase.channel(`snapshots-${params.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'module_snapshots', filter: `module_id=eq.${params.id}` }, loadSnapshots).subscribe();
    return () => void supabase.removeChannel(channel);
  }, [params.id]);

  return (
    <AppShell role="freelancer" title="Module Workspace">
      <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
        <Card className="p-4">
          <p className="mb-3 font-semibold">Snapshot history</p>
          <div className="space-y-2">
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between"><p className="text-sm font-medium">v{snapshot.version_no}</p><Badge>{new Date(snapshot.created_at).toLocaleDateString()}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{snapshot.work_summary}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between"><p className="font-semibold">Work submission</p><Button variant="outline" onClick={launchAiroBuilder}><Rocket className="mr-2 h-4 w-4" />Launch AiroBuilder</Button></div>
            <form className="space-y-3" onSubmit={submitSnapshot}>
              <textarea className="min-h-40 w-full rounded-lg border bg-background p-3" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Describe completed work, blockers, and handoff notes." />
              <Button disabled={loading}>{loading ? 'Submitting...' : 'Submit Snapshot'}</Button>
            </form>
          </Card>
          <Card className="p-6">
            <p className="font-semibold">Contribution summary</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Module Status</p><p className="mt-1 font-medium">In Progress</p></div>
              <div><p className="text-xs text-muted-foreground">Estimated Payout</p><p className="mt-1 font-medium">₹18,200</p></div>
              <div><p className="text-xs text-muted-foreground">Quality Trend</p><p className="mt-1 font-medium">0.91</p></div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
