'use client';

import { useState } from 'react';
import { Button, ButtonProps } from '../ui/button';
import { Card } from '../ui/card';
import { Rocket, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '../../lib/hooks/use-toast';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

interface AiroBuilderWorkspaceProps {
  moduleId: string;
  initialSession?: any;
}

export default function AiroBuilderWorkspace({ moduleId, initialSession }: AiroBuilderWorkspaceProps) {
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const supabase = createSupabaseBrowserClient();

  const createSession = async () => {
    setLoading(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/airobuilder/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ moduleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create session');

      const s = data.session;
      setSession({
        ...s,
        buildUrl: s.buildUrl ?? s.build_url,
        deploymentUrl: s.deploymentUrl ?? s.deployment_url,
      });
      show('Success', 'AiroBuilder session ready.');
    } catch (err: any) {
      show('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center space-y-4 bg-primary/5 border-dashed border-primary/20">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Vibe Coding Environment</p>
          <p className="text-sm text-muted-foreground mt-1">Initialize GoDaddy AiroBuilder to start building this module.</p>
        </div>
        <Button onClick={createSession} disabled={loading}>
          {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
          Provision Workspace
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-muted/50 p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Active AiroBuilder Session: {session.external_session_id}
          </div>
          <div className="flex gap-2">
            <a 
              href={session.buildUrl ?? session.build_url} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg text-[10px] font-medium transition-all border border-border bg-card hover:bg-accent h-7 px-3"
            >
              <ExternalLink className="mr-1 h-3 w-3" /> External Editor
            </a>
          </div>
        </div>
        <iframe 
          src={session.buildUrl ?? session.build_url} 
          className="w-full h-[600px] bg-white"
          title="AiroBuilder Workspace"
        />
      </Card>
      
      {(session.deploymentUrl ?? session.deployment_url) && (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20">
          <span className="text-xs font-medium text-emerald-700">Preview Live At:</span>
          <a 
            href={session.deploymentUrl ?? session.deployment_url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
          >
            {session.deploymentUrl ?? session.deployment_url} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
