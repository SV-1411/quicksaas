'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const navByRole = {
  client: [
    { href: '/client', label: 'Overview' },
    { href: '/projects/demo', label: 'Projects' },
  ],
  freelancer: [
    { href: '/freelancer', label: 'Workspace' },
    { href: '/modules/demo', label: 'Snapshots' },
  ],
  admin: [
    { href: '/admin', label: 'Control Center' },
    { href: '/admin#risk', label: 'Risk' },
  ],
} as const;

export function AppShell({ role, title, children }: { role: 'client' | 'freelancer' | 'admin'; title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-border bg-card/40 p-6 lg:block">
        <p className="text-lg font-semibold tracking-tight">Gigzs</p>
        <p className="mt-1 text-xs text-muted-foreground">Digital execution OS</p>
        <nav className="mt-8 space-y-2">
          {navByRole[role].map((item) => (
            <Link key={item.href} href={item.href} className={cn('block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent', pathname === item.href && 'bg-accent text-foreground')}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <h1 className="text-xl font-semibold">{title}</h1>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
                  <Avatar.Root className="h-7 w-7 overflow-hidden rounded-full bg-muted">
                    <Avatar.Fallback className="text-xs">GZ</Avatar.Fallback>
                  </Avatar.Root>
                  <span className="text-xs text-muted-foreground">{role}</span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="mr-4 rounded-lg border border-border bg-card p-1">
                <DropdownMenu.Item asChild>
                  <Link className="block rounded px-3 py-2 text-sm hover:bg-accent" href="/">Home</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <form action="/api/auth/logout" method="post">
                    <Button variant="ghost" size="sm" className="w-full justify-start">Logout</Button>
                  </form>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </header>

        <motion.main initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="container py-8">
          {children}
        </motion.main>
      </div>
    </div>
  );
}
