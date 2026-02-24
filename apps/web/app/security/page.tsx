'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

export default function SecurityPage() {
  const supabase = createSupabaseBrowserClient();
  const [role, setRole] = useState<'client' | 'freelancer' | 'admin'>('freelancer');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const actorRes = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (actorRes.data?.role) setRole(actorRes.data.role);
    })();
  }, []);

  return (
    <AppShell role={role} title="Security">
      <div className="space-y-8">
        <Card className="p-8 bg-white border-border shadow-md text-foreground">
          <p className="text-2xl font-black text-primary italic underline decoration-accent decoration-4 underline-offset-8">Security Command</p>
          <p className="mt-4 text-lg text-muted-foreground font-medium">Platform security auditing and compliance.</p>
        </Card>

        <div className="grid gap-6">
          <Card className="p-8 bg-white border-border shadow-sm">
            <p className="text-xl font-black text-primary uppercase tracking-tight italic mb-6">Security checklist</p>
            
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 p-6 bg-gray-50/30">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <p className="text-lg font-black text-sidebar-background italic">API Key Rotation</p>
                </div>
                <p className="text-base text-gray-600 font-medium ml-6">Your Supabase keys should be rotated monthly. Last rotation: <span className="font-bold text-primary">Check required</span>.</p>
              </div>

              <div className="rounded-2xl border border-gray-100 p-6 bg-gray-50/30">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <p className="text-lg font-black text-sidebar-background italic">RLS Policy Status</p>
                </div>
                <p className="text-base text-gray-600 font-medium ml-6">Current mode: <span className="text-orange-600 font-black">OPEN ACCESS (DEVELOPMENT)</span>. Security filters are bypassed.</p>
              </div>

              <div className="rounded-2xl border border-gray-100 p-6 bg-gray-50/30">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <p className="text-lg font-black text-sidebar-background italic">Data Anonymization</p>
                </div>
                <p className="text-base text-gray-600 font-medium ml-6">All client-freelancer interactions are strictly anonymized through the proxy layer.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
