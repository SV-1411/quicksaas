'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';

interface Snapshot {
  id: string;
  version_no: number;
  work_summary: string;
  created_at: string;
}

export default function ModuleDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseBrowserClient();
  const [summary, setSummary] = useState('');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [message, setMessage] = useState('');

  async function loadSnapshots() {
    const { data } = await supabase
      .from('module_snapshots')
      .select('id, version_no, work_summary, created_at')
      .eq('module_id', params.id)
      .order('version_no', { ascending: false });

    setSnapshots((data ?? []) as Snapshot[]);
  }

  async function submitSnapshot(event: FormEvent) {
    event.preventDefault();
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;

    const res = await fetch(`/api/modules/${params.id}/snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workSummary: summary,
        structuredProgressJson: { note: summary },
        fileReferences: [],
        timeSpentMinutes: 60,
        completionPercentage: 0.2,
        aiQualityScore: 0.9,
        penalties: 0,
      }),
    });

    const payload = await res.json();
    if (res.ok) {
      setSummary('');
      setMessage(`Snapshot v${payload.snapshot.versionNo} submitted.`);
      await loadSnapshots();
    } else {
      setMessage(payload.error ?? 'Submission failed');
    }
  }

  useEffect(() => {
    loadSnapshots();

    const channel = supabase
      .channel(`snapshots-${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'module_snapshots', filter: `module_id=eq.${params.id}` }, loadSnapshots)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-8">
      <h1 className="text-2xl font-semibold">Module Workspace</h1>
      <form className="space-y-2 rounded border p-4" onSubmit={submitSnapshot}>
        <textarea
          className="min-h-24 w-full rounded border p-2"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Work summary"
        />
        <button className="rounded bg-black px-4 py-2 text-white">Submit Snapshot</button>
      </form>
      {message && <p className="text-sm">{message}</p>}
      <section className="space-y-2">
        <h2 className="font-medium">Snapshot History</h2>
        {snapshots.map((snapshot) => (
          <article key={snapshot.id} className="rounded border p-3">
            <p>Version {snapshot.version_no}</p>
            <p className="text-sm text-muted-foreground">{snapshot.work_summary}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
