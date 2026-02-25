'use client';

import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, Layers3, ShieldCheck, Zap, Sparkles, Rocket, Globe, Users, Code2, Cpu, BarChart3, Star, ArrowDown, MousePointer, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useEffect, useState, useRef, useCallback } from 'react';

const tiers = [
  { name: 'Growth', price: '₹1.5L+', desc: 'For fast-moving SMB execution pods.', features: ['AI-powered matching', 'Managed delivery', 'Quality scoring'] },
  { name: 'Scale', price: '₹6L+', desc: 'For multi-team product execution with governance.', features: ['Multi-team orchestration', 'Advanced analytics', 'Custom workflows'] },
  { name: 'Enterprise', price: 'Custom', desc: 'For regulated delivery and bespoke SLAs.', features: ['Bespoke SLAs', 'Regulatory compliance', 'Dedicated support'] },
];

const features = [
  { icon: Layers3, title: 'Modular Execution', desc: 'Projects split into resumable modules with snapshots and continuity.', color: 'from-green-400 to-emerald-600' },
  { icon: Zap, title: 'AI-Driven', desc: 'Smart requirement intake, matching, pricing and risk scoring.', color: 'from-emerald-400 to-green-600' },
  { icon: ShieldCheck, title: 'Enterprise Grade', desc: 'Strict access controls, reliability scoring and managed orchestration.', color: 'from-green-500 to-emerald-700' },
];

const stats = [
  { value: '10x', label: 'Faster Delivery' },
  { value: '95%', label: 'Client Satisfaction' },
  { value: '500+', label: 'Projects Delivered' },
  { value: '24/7', label: 'Support Available' },
];

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [cursorState, setCursorState] = useState('default');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom cursor functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      setMousePosition({ x: clientX, y: clientY });

      if (cursorRef.current) {
        cursorRef.current.style.left = `${clientX}px`;
        cursorRef.current.style.top = `${clientY}px`;
      }

      if (followerRef.current) {
        followerRef.current.style.left = `${clientX}px`;
        followerRef.current.style.top = `${clientY}px`;
      }

      if (trailRef.current) {
        trailRef.current.style.left = `${clientX}px`;
        trailRef.current.style.top = `${clientY}px`;
      }
    };

    const handleMouseDown = () => setCursorState('click');
    const handleMouseUp = () => setCursorState('default');

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('a, button, input, textarea, select, [role="button"], .interactive')) {
        setCursorState('hover');
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('a, button, input, textarea, select, [role="button"], .interactive')) {
        setCursorState('default');
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, []);

  // Scroll and parallax effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Parallax effects
      const parallaxElements = document.querySelectorAll('.parallax-slow, .parallax-medium, .parallax-fast');
      parallaxElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const speed = el.classList.contains('parallax-slow') ? 0.2 : 
                     el.classList.contains('parallax-medium') ? 0.5 : 0.8;
        const yPos = -(rect.top * speed);
        (el as HTMLElement).style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    setIsLoaded(true);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Magnetic effect for interactive elements
  const handleMagneticMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    target.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  }, []);

  const handleMagneticLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translate(0, 0)';
  }, []);

  return (
    <>
      {/* Custom Cursor */}
      <div ref={cursorRef} className={`cursor ${cursorState}`} />
      <div ref={followerRef} className={`cursor-follower ${cursorState}`} />
      <div ref={trailRef} className={`cursor-trail ${cursorState}`} />
      
      <main className="relative bg-white overflow-hidden" ref={containerRef}>
        {/* Enhanced animated background */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Geometric shapes */}
          <div 
            className="absolute w-80 h-80 bg-gradient-to-br from-cyan-200 to-teal-300 rounded-3xl opacity-10 blur-3xl animate-float parallax-slow"
            style={{ 
              left: '5%', 
              top: '15%',
              transform: `translate(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px) rotate(45deg)`
            }}
          />
          <div 
            className="absolute w-72 h-72 bg-gradient-to-tr from-emerald-200 to-green-300 rounded-full opacity-12 blur-3xl animate-float-reverse animate-delay-300 parallax-medium"
            style={{ 
              right: '8%', 
              bottom: '15%',
              transform: `translate(${-mousePosition.x * 0.015}px, ${-mousePosition.y * 0.015}px)`
            }}
          />
          
          {/* Hexagon-like shapes */}
          <div 
            className="absolute w-64 h-64 bg-gradient-to-bl from-teal-200 to-cyan-300 opacity-8 blur-2xl animate-morph parallax-fast"
            style={{ 
              left: '45%', 
              top: '45%',
              transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px) rotate(30deg)`
            }}
          />
          
          {/* Floating triangles */}
          <div className="absolute w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] border-b-cyan-200 opacity-15 animate-drift animate-delay-500" style={{ left: '65%', top: '25%' }} />
          <div className="absolute w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[50px] border-b-emerald-200 opacity-12 animate-drift animate-delay-700" style={{ right: '15%', top: '55%' }} />
          
          {/* Circular gradients */}
          <div className="absolute w-20 h-20 bg-radial-gradient from-cyan-300 to-transparent rounded-full opacity-20 animate-orbit" style={{ left: '25%', top: '35%' }} />
          <div className="absolute w-16 h-16 bg-radial-gradient from-emerald-300 to-transparent rounded-full opacity-15 animate-orbit animate-delay-1200" style={{ right: '35%', top: '20%' }} />
          
          {/* Subtle background overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-transparent to-emerald-50 opacity-30 animate-breathe" />
          
          {/* Additional floating elements */}
          <div className="absolute w-12 h-12 bg-teal-200 rounded-2xl opacity-18 animate-float animate-delay-900" style={{ left: '12%', top: '65%' }} />
          <div className="absolute w-8 h-8 bg-cyan-200 rounded-full opacity-20 animate-float-reverse animate-delay-1400" style={{ right: '18%', top: '75%' }} />
          <div className="absolute w-14 h-14 bg-emerald-200 rounded-lg opacity-14 animate-drift animate-delay-400" style={{ left: '75%', top: '45%' }} />
          <div className="absolute w-6 h-6 bg-teal-200 rounded-full opacity-22 animate-float animate-delay-600" style={{ right: '8%', top: '35%' }} />
          
          {/* Wave-like elements */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-100 to-transparent opacity-20 animate-wave" />
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-emerald-100 to-transparent opacity-15 animate-wave animate-delay-800" />
        </div>

        {/* Hero Section with extreme interactivity */}
        <section className="relative min-h-screen flex items-center justify-center px-4">
          <div className="container text-center relative z-10">
            <div className={`animate-slide-up ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-300 mb-8 bg-transparent">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 bg-transparent">Managed Digital Factory for India</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              
              <h1 className="max-w-6xl mx-auto mb-16">
                <div className="title-elegant text-6xl md:text-8xl lg:text-9xl mb-24">
                  Ship Digital Products
                </div>
                <div className="subtitle-elegant text-2xl md:text-4xl lg:text-5xl text-gray-800 font-light bg-transparent">
                  With Enterprise Reliability
                </div>
              </h1>
              
              <p className="max-w-3xl mx-auto text-xl md:text-3xl text-gray-600 mb-12 leading-relaxed animate-slide-up animate-delay-200 bg-transparent" style={{ letterSpacing: '0.05em', wordSpacing: '0.2em' }}>
                Convert your concepts into 
                <span className="text-green-600 font-bold interactive hover-glow bg-transparent">enterprise-grade solutions</span>
                through our 
                <span className="text-green-600 font-bold interactive hover-lift bg-transparent">intelligent automation platform</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-slide-up animate-delay-300">
                <Link href="/login">
                  <button className="btn-premium text-gray-900 text-lg font-medium inline-flex items-center gap-3 interactive magnetic" 
                    onMouseMove={handleMagneticMove}
                    onMouseLeave={handleMagneticLeave}>
                    Get Started 
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="btn-premium-outline text-gray-900 text-lg font-medium inline-flex items-center gap-3 interactive magnetic"
                    onMouseMove={handleMagneticMove}
                    onMouseLeave={handleMagneticLeave}>
                    <Play className="w-5 h-5" />
                    Book Demo
                  </button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Enhanced floating elements */}
          <div className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl opacity-20 animate-float animate-delay-100 transform rotate-45 hover-lift interactive parallax-slow glass-subtle" />
          <div className="absolute top-40 right-20 w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full opacity-20 animate-float animate-delay-300 hover-glow interactive parallax-medium glass-accent" />
          <div className="absolute bottom-20 left-1/4 w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-700 rounded-3xl opacity-20 animate-float animate-delay-200 transform rotate-12 hover-rotate interactive parallax-fast glass-subtle" />
          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-gradient-to-br from-green-300 to-emerald-500 rounded-lg opacity-15 animate-morph hover-lift interactive glass-accent" />
          <div className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-green-200 rounded-full opacity-25 animate-drift animate-delay-700 hover-glow interactive" />
          <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-emerald-200 rounded-full opacity-30 animate-float-reverse animate-delay-900 hover-lift interactive" />
        </section>

        {/* Interactive Stats Section */}
        <section className="py-20 relative">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={stat.label} 
                  className={`text-center animate-scale-in animate-delay-${index * 100} interactive hover-lift magnetic`}
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={(e) => {
                    handleMagneticLeave(e);
                    setActiveFeature(null);
                  }}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className={`text-5xl md:text-7xl font-black gradient-text mb-2 transition-all duration-300 ${activeFeature === index ? 'scale-125' : ''}`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-lg font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section className="py-20 relative">
          <div className="container">
            <div className="text-center mb-16 animate-slide-up">
              <h2 className="text-5xl md:text-7xl font-black mb-4 bg-transparent">
                <span className="text-green-600 interactive hover-glow bg-transparent">The Digital Factory</span>
              </h2>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto bg-transparent">
                Next-generation product execution with 
                <span className="text-green-600 font-bold interactive hover-lift bg-transparent">AI-powered orchestration</span>
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={feature.title} 
                  className={`p-8 hover-lift bg-white border-0 shadow-2xl animate-slide-up animate-delay-${index * 200} interactive hover-glow magnetic`}
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={(e) => {
                    handleMagneticLeave(e);
                    setActiveFeature(null);
                  }}
                  onMouseEnter={() => setActiveFeature(index + 10)}
                >
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 transform hover:rotate-12 transition-all duration-500 ${activeFeature === index + 10 ? 'scale-110 rotate-12' : ''}`}>
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-4 text-gray-900 interactive hover-lift">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{feature.desc}</p>
                  <div className="mt-6 flex items-center gap-2 text-green-600 font-bold interactive hover-glow">
                    <span>Learn More</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive How It Works */}
        <section className="py-20 bg-blended-green relative">
          <div className="container">
            <div className="text-center mb-16 animate-slide-up">
              <h2 className="text-5xl md:text-7xl font-black mb-4 text-gray-900 interactive hover-glow bg-transparent">How It Works</h2>
              <p className="text-2xl text-gray-600 bg-transparent">Simple process, extraordinary results</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Submit Requirements', desc: 'Share your vision with our AI-powered intake system', icon: MousePointer },
                { step: '02', title: 'Auto-Orchestrated Execution', desc: 'Watch as AI matches and orchestrates the perfect team', icon: Cpu },
                { step: '03', title: 'Continuous Visibility', desc: 'Track progress in real-time with transparent workflows', icon: BarChart3 },
              ].map((item, index) => (
                <div 
                  key={item.step} 
                  className={`text-center animate-slide-up animate-delay-${index * 200} interactive hover-lift magnetic`}
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={handleMagneticLeave}
                >
                  <div className="relative mb-8 inline-block">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg hover-glow interactive">
                      {item.step}
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce-in">
                      <item.icon className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-gray-900 interactive hover-lift">{item.title}</h3>
                  <p className="text-gray-600 text-lg">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 relative">
          <div className="container">
            <Card className="p-16 border-0 shadow-xl text-white animate-slide-up" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)' }}>
              <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="flex-1">
                  <h2 className="text-4xl md:text-5xl font-semibold mb-6 bg-transparent" style={{ fontWeight: 300, letterSpacing: '-0.01em' }}>
                    Ready to Transform Your Digital Delivery?
                  </h2>
                  <p className="text-xl text-green-50 mb-8 leading-relaxed bg-transparent" style={{ fontWeight: 400 }}>
                    Join enterprises leveraging AI-powered orchestration for reliable, scalable product execution.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button className="btn-premium text-white font-medium inline-flex items-center gap-3">
                      <Building2 className="w-5 h-5" />
                      Contact Enterprise
                    </button>
                    <button className="btn-premium-outline text-white font-medium inline-flex items-center gap-3 bg-transparent" style={{ borderColor: 'rgba(255, 255, 255, 0.5)', color: 'white' }}>
                      <Star className="w-5 h-5" />
                      Schedule Demo
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Interactive Footer */}
        <footer className="border-t border-gray-200 py-12 text-center">
          <div className="container">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-green-600" />
              <span className="text-xl font-semibold text-gray-900 bg-transparent">Gigzs</span>
            </div>
            <p className="text-gray-600 mb-2 bg-transparent">Managed digital execution platform</p>
            <p className="text-sm text-gray-500 bg-transparent">© {new Date().getFullYear()} Gigzs. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
