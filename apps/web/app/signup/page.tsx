'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'freelancer'>('client');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, role }),
    });
    let payload;
    try {
      payload = await response.json();
    } catch (err) {
      setLoading(false);
      return setError('Server returned an unexpected response format. Please refresh and try again.');
    }

    setLoading(false);
    if (!response.ok) return setError(payload.error ?? 'Signup failed');
    // Go directly to dashboard (or /login if auto-sign-in failed)
    router.push(payload.redirectTo ?? '/login');
    router.refresh();
  };

  return (
    <main className="relative min-h-screen bg-[#050508] flex items-center justify-center px-4 py-16 overflow-hidden font-sans">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />

      {/* Back to landing */}
      <Link href="/" className="absolute top-8 left-8 font-mono text-[11px] tracking-[0.2em] uppercase text-white/25 hover:text-white/60 transition-colors">
        ← Gigzs
      </Link>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/8 bg-white/3 backdrop-blur">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            <span className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">Create Your Account</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-2">Start your project.</h1>
          <p className="text-white/35 font-light text-sm">Define what you need. We handle everything else.</p>
        </div>

        {/* Role toggle */}
        <div className="mb-6 flex border border-white/8 rounded-sm overflow-hidden">
          {(['client', 'freelancer'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2.5 text-xs font-mono tracking-widest uppercase transition-all duration-200 ${role === r
                ? 'bg-white text-black'
                : 'bg-transparent text-white/30 hover:text-white/50'
                }`}
            >
              {r === 'client' ? 'I need work done' : 'I do the work'}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="border border-white/8 bg-[#0a0a12] rounded-xl p-8">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/35">Full name</label>
              <input
                required
                className="w-full bg-[#0d0d18] border border-white/8 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
                placeholder="Your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/35">Work email</label>
              <input
                type="email"
                required
                className="w-full bg-[#0d0d18] border border-white/8 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/35">Password</label>
              <input
                type="password"
                required
                className="w-full bg-[#0d0d18] border border-white/8 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
                placeholder="Create a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400/80 font-mono border border-red-500/20 bg-red-500/5 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full mt-2 relative py-3.5 bg-white text-black text-sm font-medium tracking-wide rounded-sm overflow-hidden transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'Creating…' : (<>Create account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>)}
              </span>
              <div className="absolute inset-0 bg-slate-100 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 z-0" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-white/25 text-xs font-mono">
              Have an account?{' '}
              <Link href="/login" className="text-emerald-400/80 hover:text-emerald-400 transition-colors">
                Sign in →
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/15 font-mono text-[10px] tracking-widest mt-6 uppercase">
          Gigzs · Managed Digital Factory
        </p>
      </div>
    </main>
  );
}
