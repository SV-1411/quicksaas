'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';

export default function ProjectsPage() {
  const supabase = createSupabaseBrowserClient();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    const res = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } });
    const raw = await res.text();
    const payload = raw ? (JSON.parse(raw) as any) : {};

    if (!res.ok) {
      setLoading(false);
      setError(payload.error ?? 'Failed to load projects');
      return;
    }

    setProjects(payload.projects ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell role="client" title="Projects">
      <Card className="p-6">
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p: any) => (
                  <tr key={p.id} className="border-t border-border/70">
                    <td className="py-3">
                      <Link className="font-medium hover:underline" href={`/projects/${p.id}`}>
                        {p.title}
                      </Link>
                    </td>
                    <td className="py-3">
                      <Badge>{p.status}</Badge>
                    </td>
                    <td className="py-3">₹{Number(p.total_price ?? 0).toLocaleString()}</td>
                    <td className="py-3">{p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
