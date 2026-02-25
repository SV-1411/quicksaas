'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Rocket, ExternalLink, RefreshCw, Sparkles, Brain, Zap, Cpu, Terminal, Globe, Shield } from 'lucide-react';
import { useToast } from '../../lib/hooks/use-toast';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { motion, AnimatePresence } from 'framer-motion';

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
      <Card className="relative overflow-hidden border-none bg-slate-950 text-white min-h-[500px] flex flex-col items-center justify-center p-12 shadow-2xl">
        {/* Majestic Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
        
        {/* Animated Neural Mesh Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent w-full"
              initial={{ top: `${i * 25}%`, left: '-100%' }}
              animate={{ left: '100%' }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>

        {/* Central Majestic Orbit */}
        <div className="relative mb-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className="w-48 h-48 rounded-full border border-emerald-500/20 border-dashed" />
            <div className="absolute inset-4 rounded-full border border-emerald-500/10 border-dotted" />
            
            {/* Orbital Icons */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 p-2 bg-slate-900 border border-emerald-500/30 rounded-lg shadow-lg shadow-emerald-500/10">
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 p-2 bg-slate-900 border border-blue-500/30 rounded-lg shadow-lg shadow-blue-500/10">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 p-2 bg-slate-900 border border-cyan-500/30 rounded-lg shadow-lg shadow-cyan-500/10">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 p-2 bg-slate-900 border border-purple-500/30 rounded-lg shadow-lg shadow-purple-500/10">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
          </motion.div>

          {/* Central Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="h-20 w-20 flex items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md shadow-[0_0_40px_rgba(16,185,129,0.2)]"
            >
              <Zap className="h-10 w-10 text-emerald-400 fill-emerald-400/20" />
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center gap-2 mb-4 text-emerald-400 font-mono text-[10px] uppercase tracking-[0.4em]">
            <Sparkles className="w-3 h-3" />
            Neural Engine Standby
            <Sparkles className="w-3 h-3" />
          </div>
          
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">
            Provision <span className="text-emerald-500">AiroBuilder</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 px-4">
            Connect to the GoDaddy AI-powered orchestration engine. Provision a dedicated workspace with neural-linked infrastructure for this module.
          </p>

          <Button 
            onClick={createSession} 
            disabled={loading}
            className="relative group px-10 py-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer group-hover:bg-[length:100%_100%] transition-all" />
            <div className="relative flex items-center gap-3 text-base font-black uppercase tracking-widest">
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
              {loading ? 'Orchestrating...' : 'Initialize Workspace'}
            </div>
          </Button>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute bottom-6 text-[10px] font-mono text-slate-700 tracking-widest uppercase">
          Gigzs Proprietary AI Integration v4.2
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-emerald-500/20 bg-slate-950 shadow-2xl">
        <div className="bg-slate-900/80 p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 mr-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Neural Link Active: {session.external_session_id?.slice(0, 8)}
            </div>
          </div>
          <div className="flex gap-3">
            <a 
              href={session.buildUrl ?? session.build_url} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 bg-white/5 hover:bg-white/10 text-white h-9 px-4"
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" /> Fullscreen Editor
            </a>
          </div>
        </div>
        <div className="relative group">
          <iframe 
            src={session.buildUrl ?? session.build_url} 
            className="w-full h-[700px] bg-white border-none shadow-inner"
            title="AiroBuilder Workspace"
          />
          {/* Overlay scanning effect when not focused */}
          <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-950 opacity-100 group-hover:opacity-0 transition-opacity" />
        </div>
      </Card>
      
      {(session.deploymentUrl ?? session.deployment_url) && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-2xl border bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Globe className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-0.5">Deployment Ready</p>
              <p className="text-xs font-mono text-emerald-700/70">{session.deploymentUrl ?? session.deployment_url}</p>
            </div>
          </div>
          <a 
            href={session.deploymentUrl ?? session.deployment_url} 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            View Live <ExternalLink className="h-3 w-3" />
          </a>
        </motion.div>
      )}
    </div>
  );
}
