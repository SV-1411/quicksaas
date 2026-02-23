import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, Layers3, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const tiers = [
  { name: 'Growth', price: '₹1.5L+', desc: 'For fast-moving SMB execution pods.' },
  { name: 'Scale', price: '₹6L+', desc: 'For multi-team product execution with governance.' },
  { name: 'Enterprise', price: 'Custom', desc: 'For regulated delivery and bespoke SLAs.' },
];

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-border">
        <div className="container py-24">
          <p className="mb-5 inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">Managed Digital Factory for India</p>
          <h1 className="max-w-4xl font-[var(--font-heading)] text-5xl font-semibold leading-tight md:text-6xl">Ship digital products with enterprise reliability, without managing freelancers.</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">Gigzs converts raw requirements into production-ready execution pipelines with managed delivery, modular handoffs, and contribution-based payouts.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login"><Button size="lg">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/signup"><Button size="lg" variant="outline">Book Enterprise Demo</Button></Link>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <h2 className="font-[var(--font-heading)] text-3xl font-semibold">The Digital Factory</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="p-6"><Layers3 className="mb-3 h-5 w-5 text-primary" />Projects are split into execution modules with resumable snapshots and handoff continuity.</Card>
          <Card className="p-6"><Zap className="mb-3 h-5 w-5 text-primary" />AI-driven requirement intake, matching, pricing and risk scoring keeps throughput high.</Card>
          <Card className="p-6"><ShieldCheck className="mb-3 h-5 w-5 text-primary" />Strict access controls, reliability scoring and managed orchestration by design.</Card>
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="container py-20">
          <h2 className="font-[var(--font-heading)] text-3xl font-semibold">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {['Submit requirements', 'Auto-orchestrated execution', 'Continuous client visibility'].map((step, i) => (
              <Card key={step} className="p-6">
                <p className="text-sm text-primary">0{i + 1}</p>
                <p className="mt-2 text-lg font-medium">{step}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <h2 className="font-[var(--font-heading)] text-3xl font-semibold">Why Gigzs</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[{t:'Speed',d:'Parallelized module pipeline with AI assignment.'},{t:'Managed',d:'No freelancer operations overhead for clients.'},{t:'Reliable',d:'Quality scoring, risk triggers, and recoverable snapshots.'}].map((item) => (
            <Card key={item.t} className="p-6">
              <CheckCircle2 className="mb-3 h-5 w-5 text-primary" />
              <p className="font-medium">{item.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/30">
        <div className="container py-20">
          <h2 className="font-[var(--font-heading)] text-3xl font-semibold">Pricing</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card key={tier.name} className="p-6">
                <p className="text-sm text-muted-foreground">{tier.name}</p>
                <p className="mt-2 text-3xl font-semibold">{tier.price}</p>
                <p className="mt-2 text-sm text-muted-foreground">{tier.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <Card className="flex flex-col items-start justify-between gap-4 p-8 md:flex-row md:items-center">
          <div>
            <p className="font-[var(--font-heading)] text-2xl font-semibold">Enterprise-grade execution for regulated delivery teams.</p>
            <p className="mt-1 text-sm text-muted-foreground">Align procurement, delivery, and quality in one operating layer.</p>
          </div>
          <Button size="lg"><Building2 className="mr-2 h-4 w-4" /> Contact Enterprise</Button>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Gigzs. Managed digital execution platform.</footer>
    </main>
  );
}
