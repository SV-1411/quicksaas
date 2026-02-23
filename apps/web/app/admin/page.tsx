'use client';

import { LogoutButton } from '../../components/logout-button';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

export default function AdminDashboard() {
  const supabase = createSupabaseBrowserClient();
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

    await fetch('/api/admin/reassign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ moduleId }),
    });

    await load();
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-risk-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'risk_logs' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Admin Dashboard</h1><LogoutButton /></div>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Project Overview</h2>
        {projects.map((project) => (
          <div key={project.id} className="mb-2 rounded border p-2 text-sm">
            {project.title} — {project.status}
          </div>
        ))}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Risk Alerts</h2>
        {risks.map((risk) => (
          <div key={risk.id} className="mb-2 rounded border p-2 text-sm">
            Module {risk.module_id} — score {risk.risk_score}
            <button className="ml-2 rounded border px-2" onClick={() => reassign(risk.module_id)}>
              Reassign
            </button>
          </div>
        ))}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Freelancer Reliability</h2>
        {freelancers.map((freelancer) => (
          <div key={freelancer.id} className="mb-2 rounded border p-2 text-sm">
            {freelancer.full_name} — reliability {freelancer.reliability_score}
          </div>
        ))}
      </section>
    </main>
  );
}
