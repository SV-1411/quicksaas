'use client';

import { FormEvent, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Custom cursor state
  const [cursorState, setCursorState] = useState<'default' | 'hover' | 'click'>('default');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  // Custom cursor handlers
  const handleMagneticMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    (e.currentTarget as HTMLElement).style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
  };

  const handleMagneticLeave = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.transform = 'translate(0px, 0px)';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
      
      if (followerRef.current) {
        followerRef.current.style.left = `${e.clientX}px`;
        followerRef.current.style.top = `${e.clientY}px`;
      }
      
      if (trailRef.current) {
        trailRef.current.style.left = `${e.clientX}px`;
        trailRef.current.style.top = `${e.clientY}px`;
      }
    };

    const handleMouseDown = () => setCursorState('click');
    const handleMouseUp = () => setCursorState('default');
    
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('button, a, input, .interactive, .magnetic')) {
        setCursorState('hover');
      }
    };
    
    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('button, a, input, .interactive, .magnetic')) {
        setCursorState('default');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseEnter);
    window.addEventListener('mouseout', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseEnter);
      window.removeEventListener('mouseout', handleMouseLeave);
    };
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) return setError(payload.error ?? 'Login failed');
    router.push(payload.redirectTo ?? '/');
    router.refresh();
  };

  return (
    <>
      {/* Custom Cursor */}
      <div ref={cursorRef} className={`cursor ${cursorState}`} />
      <div ref={followerRef} className={`cursor-follower ${cursorState}`} />
      <div ref={trailRef} className={`cursor-trail ${cursorState}`} />
      
      <main className="container flex min-h-screen items-center justify-center py-12 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute w-96 h-96 bg-green-200 rounded-full opacity-10 blur-3xl animate-float" style={{ left: '10%', top: '20%' }} />
          <div className="absolute w-96 h-96 bg-emerald-200 rounded-full opacity-10 blur-3xl animate-float animate-delay-200" style={{ right: '10%', bottom: '20%' }} />
        </div>
        
        <Card className="w-full max-w-md p-8 relative z-10 animate-scale-in border-0 shadow-xl interactive magnetic" 
          onMouseMove={handleMagneticMove}
          onMouseLeave={handleMagneticLeave}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 interactive hover-lift">
              <span className="text-white text-2xl font-bold">G</span>
            </div>
            <h1 className="font-[var(--font-heading)] text-3xl font-bold gradient-text">Welcome back</h1>
            <p className="mt-2 text-gray-600">Sign in to access your Gigzs workspace.</p>
          </div>
          
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Work email</label>
              <input 
                className="w-full rounded-lg border border-gray-200 bg-white p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 interactive" 
                placeholder="Enter your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input 
                className="w-full rounded-lg border border-gray-200 bg-white p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 interactive" 
                placeholder="Enter your password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            
            {error && <p className="text-sm text-red-500 animate-slide-up">{error}</p>}
            
            <Button 
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 interactive magnetic" 
              disabled={loading}
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/signup" className="text-green-600 hover:text-green-700 font-medium transition-colors interactive hover-glow">
                Sign up
              </a>
            </p>
          </div>
        </Card>
      </main>
    </>
  );
}
