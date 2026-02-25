'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'freelancer'>('client');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, role }),
    });

    const payload = await response.json();
    if (!response.ok) return setError(payload.error ?? 'Signup failed');
    router.push('/login');
  };

  return (
    <main className="container flex min-h-screen items-center justify-center py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 bg-green-200 rounded-full opacity-10 blur-3xl animate-float" style={{ left: '10%', top: '20%' }} />
        <div className="absolute w-96 h-96 bg-emerald-200 rounded-full opacity-10 blur-3xl animate-float animate-delay-200" style={{ right: '10%', bottom: '20%' }} />
      </div>
      
      <Card className="w-full max-w-md p-8 relative z-10 animate-scale-in border-0 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">G</span>
          </div>
          <h1 className="font-[var(--font-heading)] text-3xl font-bold gradient-text">Create workspace account</h1>
          <p className="mt-2 text-gray-600">Start managed delivery with Gigzs.</p>
        </div>
        
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Full name</label>
            <input 
              className="w-full rounded-lg border border-gray-200 bg-white p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200" 
              placeholder="Enter your full name" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Work email</label>
            <input 
              className="w-full rounded-lg border border-gray-200 bg-white p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input 
              className="w-full rounded-lg border border-gray-200 bg-white p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200" 
              placeholder="Create a password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Account type</label>
            <select 
              className="w-full rounded-lg border border-gray-200 bg-white p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200" 
              value={role} 
              onChange={(e) => setRole(e.target.value as 'client' | 'freelancer')}
            >
              <option value="client">Client - I need work done</option>
              <option value="freelancer">Freelancer - I do the work</option>
            </select>
          </div>
          
          {error && <p className="text-sm text-red-500 animate-slide-up">{error}</p>}
          
          <Button 
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300"
          >
            Create account
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-green-600 hover:text-green-700 font-medium transition-colors">
              Sign in
            </a>
          </p>
        </div>
      </Card>
    </main>
  );
}
