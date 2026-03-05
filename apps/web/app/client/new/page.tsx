'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

type Step = 'title' | 'scope' | 'budget' | 'processing';

export default function NewProjectPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('title');
    const [formData, setFormData] = useState({ title: '', description: '', budget: '' });
    const [error, setError] = useState('');

    const nextStep = (next: Step) => {
        setError('');
        setStep(next);
    };

    const handleSubmit = async () => {
        setStep('processing');
        try {
            const res = await fetch('/api/projects/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit brief');
            }

            const { project } = await res.json();

            // Artificial delay for dramatic "system parsing" effect
            setTimeout(() => {
                router.push(`/client?project=${project.id}`);
            }, 2500);

        } catch (err: any) {
            setError(err.message);
            setStep('budget');
        }
    };

    // Shared Animation Variants
    const variants = {
        enter: { opacity: 0, y: 20, scale: 0.98 },
        center: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.98 },
    };

    return (
        <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-emerald-500/30">

            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(16,185,129,0.03)_0%,transparent_100%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

            {/* Progress Indicator */}
            {step !== 'processing' && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-6">
                    {['title', 'scope', 'budget'].map((s, i) => (
                        <div key={s} className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase">
                            <div className={`w-8 h-[2px] rounded-full transition-all duration-500 ${s === step ? 'bg-emerald-500' : 'bg-white/10'
                                }`} />
                            <span className={s === step ? 'text-emerald-400' : 'text-white/20'}>0{i + 1}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="w-full max-w-2xl relative z-10">
                <AnimatePresence mode="wait">

                    {step === 'title' && (
                        <motion.div key="title" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col gap-8">
                            <div>
                                <div className="font-mono text-[11px] tracking-[0.2em] text-emerald-500/70 mb-3 uppercase">Step 01 // Identification</div>
                                <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-4">Name your objective.</h1>
                                <p className="text-white/40 font-light text-lg">What is the high-level goal of this deployment?</p>
                            </div>

                            <input
                                autoFocus
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Auth Module Migration"
                                className="w-full bg-white/5 border border-white/10 rounded-sm px-6 py-5 text-xl font-light text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300"
                                onKeyDown={e => e.key === 'Enter' && formData.title && nextStep('scope')}
                            />

                            <div className="flex justify-end">
                                <button
                                    onClick={() => nextStep('scope')}
                                    disabled={!formData.title}
                                    className="group flex items-center gap-3 px-8 py-3 bg-white text-black font-medium tracking-wide text-sm rounded-sm transition-all duration-300 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Proceed <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'scope' && (
                        <motion.div key="scope" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col gap-8">
                            <div>
                                <div className="font-mono text-[11px] tracking-[0.2em] text-emerald-500/70 mb-3 uppercase">Step 02 // Parameters</div>
                                <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-4">Define the scope.</h1>
                                <p className="text-white/40 font-light text-lg">Describe the requirements. Our system will parse this into execution modules.</p>
                            </div>

                            <textarea
                                autoFocus
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="We need a complete rewrite of the authentication flow using Next.js App Router and Supabase SSR. It must include login, signup, and a dashboard protected route..."
                                className="w-full bg-white/5 border border-white/10 rounded-sm px-6 py-5 text-lg font-light text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300 min-h-[200px] resize-y"
                            />

                            <div className="flex justify-between items-center">
                                <button onClick={() => setStep('title')} className="text-white/30 hover:text-white font-mono text-[11px] tracking-widest uppercase transition-colors">Go Back</button>
                                <button
                                    onClick={() => nextStep('budget')}
                                    disabled={!formData.description}
                                    className="group flex items-center gap-3 px-8 py-3 bg-white text-black font-medium tracking-wide text-sm rounded-sm transition-all duration-300 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Proceed <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'budget' && (
                        <motion.div key="budget" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col gap-8">
                            <div>
                                <div className="font-mono text-[11px] tracking-[0.2em] text-emerald-500/70 mb-3 uppercase">Step 03 // Resources</div>
                                <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-4">Allocate budget.</h1>
                                <p className="text-white/40 font-light text-lg">Select a budget range for the execution engine.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { id: '$1k - $5k', label: 'Standard', speed: 'Normal priority' },
                                    { id: '$5k - $15k', label: 'Accelerated', speed: 'High priority queue' },
                                    { id: '$15k+', label: 'Enterprise', speed: 'Dedicated shift lines' }
                                ].map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => setFormData({ ...formData, budget: b.id })}
                                        className={`flex flex-col text-left p-6 border rounded-sm transition-all duration-300 ${formData.budget === b.id
                                                ? 'border-emerald-500 bg-emerald-500/10'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className={`font-mono text-[10px] tracking-widest uppercase mb-4 ${formData.budget === b.id ? 'text-emerald-400' : 'text-white/30'}`}>
                                            {b.label}
                                        </div>
                                        <div className="text-2xl font-light text-white mb-2">{b.id}</div>
                                        <div className="text-[13px] text-white/40">{b.speed}</div>
                                    </button>
                                ))}
                            </div>

                            {error && <div className="text-red-400 font-mono text-[11px] tracking-widest bg-red-500/10 px-4 py-3 border border-red-500/20">{error}</div>}

                            <div className="flex justify-between items-center mt-4">
                                <button onClick={() => setStep('scope')} className="text-white/30 hover:text-white font-mono text-[11px] tracking-widest uppercase transition-colors">Go Back</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!formData.budget}
                                    className="group flex items-center gap-3 px-8 py-4 bg-emerald-500 text-black font-medium tracking-wide text-sm rounded-sm transition-all duration-300 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                                >
                                    <span className="relative z-10 flex items-center gap-2">Initialize Protocol <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'processing' && (
                        <motion.div key="processing" variants={variants} initial="enter" animate="center" className="flex flex-col items-center justify-center text-center py-20 gap-8">
                            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                            <div>
                                <h2 className="text-2xl font-light text-white mb-3">Parsing Requirements</h2>
                                <div className="font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase animate-pulse">
                                    System handshake established.<br />Transmitting specs to the floor...
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

        </div>
    );
}
