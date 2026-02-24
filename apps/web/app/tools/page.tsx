'use client';

import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';

export default function ToolsPage() {
  return (
    <AppShell role="freelancer" title="Tools">
      <div className="space-y-8">
        <Card className="p-8 bg-white border-border shadow-md">
          <p className="text-2xl font-black text-primary italic underline decoration-accent decoration-4 underline-offset-8">Freelancer Tools</p>
          <p className="mt-4 text-lg text-muted-foreground font-medium">Utilities to help you build and deliver faster.</p>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-8 border-2 border-dashed hover:border-primary transition-all cursor-pointer bg-white group shadow-sm hover:shadow-xl">
            <p className="text-xl font-black text-primary italic uppercase tracking-tight">Deployment Automator</p>
            <p className="text-base text-muted-foreground mt-3 font-medium">Quick-launch scripts for common frameworks.</p>
            <div className="mt-6 flex justify-end">
              <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-primary transition-colors" />
              </div>
            </div>
          </Card>
          <Card className="p-8 border-2 border-dashed hover:border-primary transition-all cursor-pointer bg-white group shadow-sm hover:shadow-xl">
            <p className="text-xl font-black text-primary italic uppercase tracking-tight">SQL Schema Generator</p>
            <p className="text-base text-muted-foreground mt-3 font-medium">Visual builder for Supabase tables.</p>
            <div className="mt-6 flex justify-end">
              <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-primary transition-colors" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
