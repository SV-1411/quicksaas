'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';

interface ModuleItem {
  id: string;
  module_key: string;
  module_name: string;
  module_status: string;
  module_weight: number;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseBrowserClient();
  const [project, setProject] = useState<any>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);

  async function load() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;

    const res = await fetch(`/api/projects/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await res.json();
    setProject(payload.project);
    setModules(payload.modules ?? []);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`project-${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_modules', filter: `project_id=eq.${params.id}` }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-8">
      <h1 className="text-2xl font-semibold">Project Detail</h1>
      {project && (
        <article className="rounded border p-4">
          <p className="font-medium">{project.title}</p>
          <p className="text-sm text-muted-foreground">Status: {project.status}</p>
          <p className="text-sm text-muted-foreground">Total Price: ₹{project.total_price}</p>
        </article>
      )}

      <section className="space-y-2">
        <h2 className="font-medium">Modules</h2>
        {modules.map((module) => (
          <article key={module.id} className="rounded border p-3">
            <p>{module.module_name}</p>
            <p className="text-sm text-muted-foreground">{module.module_status}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
