'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { Button } from '../ui/button';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Settings, 
  Wrench, 
  History, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Rocket
} from 'lucide-react';
import { cn } from '../../lib/utils';

const roleHome = {
  client: '/client',
  freelancer: '/freelancer',
  admin: '/admin',
} as const;

const navByRole = {
  client: [
    { href: '/client', label: 'Overview', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  freelancer: [
    { href: '/freelancer', label: 'Workspace', icon: LayoutDashboard },
    { href: '/tools/airobuilder', label: 'AiroBuilder', icon: Rocket },
    { href: '/tools', label: 'Tools', icon: Wrench },
    { href: '/history', label: 'Previous Work', icon: History },
    { href: '/security', label: 'Security', icon: ShieldCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { href: '/admin', label: 'Control Center', icon: LayoutDashboard },
    { href: '/admin#risk', label: 'Risk', icon: ShieldCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
} as const;

export function AppShell({ role, title, children }: { role: 'client' | 'freelancer' | 'admin'; title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMinimized, setIsMinimized] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        const payload = (await res.json()) as any;
        if (payload?.profile?.full_name) setName(payload.profile.full_name);
        if (payload?.profile?.avatar_url) setAvatarUrl(payload.profile.avatar_url);
      } catch {
        // ignore
      }
    })();
  }, []);

  const initials = (name ?? 'Gigzs')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="min-h-screen bg-white">
      <aside 
        className={cn(
          "fixed left-0 top-0 hidden h-screen border-r border-sidebar-border bg-sidebar-background transition-all duration-300 lg:block z-50",
          isMinimized ? "w-20" : "w-72"
        )}
      >
        <div className={cn("flex items-center gap-3 p-6 mb-4", isMinimized && "justify-center px-0")}>
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <span className="text-sidebar-background font-black text-2xl">G</span>
          </div>
          {!isMinimized && (
            <div className="overflow-hidden whitespace-nowrap">
              <p className="text-xl font-black tracking-tight text-white">Gigzs</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Delivery OS</p>
            </div>
          )}
        </div>
        
        <nav className="px-4 space-y-1.5">
          {navByRole[role].map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={cn(
                  'flex items-center rounded-xl transition-all duration-200 group relative',
                  isMinimized ? "justify-center p-3" : "px-4 py-3.5",
                  isActive 
                    ? 'bg-white text-sidebar-background shadow-lg shadow-black/10' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
                title={isMinimized ? item.label : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", !isMinimized && "mr-3.5")} />
                {!isMinimized && <span className="font-bold text-base tracking-tight">{item.label}</span>}
                {isActive && isMinimized && (
                  <div className="absolute left-0 h-6 w-1 bg-white rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-white border border-sidebar-border flex items-center justify-center text-sidebar-background shadow-md hover:scale-110 transition-transform"
        >
          {isMinimized ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      <div 
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          isMinimized ? "lg:pl-20" : "lg:pl-72"
        )}
      >
        <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
          <div className="container flex h-20 items-center justify-between px-8">
            <h1 className="text-3xl font-black text-sidebar-background tracking-tight italic underline decoration-4 decoration-accent underline-offset-8">{title}</h1>
            
            <div className="flex items-center gap-6">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-2 pr-4 hover:bg-gray-100 transition-colors">
                    <Avatar.Root className="h-10 w-10 overflow-hidden rounded-xl border-2 border-white shadow-sm ring-1 ring-gray-100">
                      {avatarUrl ? <Avatar.Image className="h-full w-full object-cover" src={avatarUrl} alt="Profile" /> : null}
                      <Avatar.Fallback className="bg-sidebar-background text-white font-bold text-sm leading-none">{initials || 'GZ'}</Avatar.Fallback>
                    </Avatar.Root>
                    <div className="flex flex-col items-start text-left leading-none shrink-0">
                      <span className="text-sm font-black text-sidebar-background mb-0.5">{name ? `Hi, ${name.split(' ')[0]}` : 'Hi there!'}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{role}</span>
                    </div>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="mr-4 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-3 border-b border-gray-50 mb-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="text-sm font-black text-sidebar-background truncate">{name || 'Guest User'}</p>
                  </div>
                  <DropdownMenu.Item asChild>
                    <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-sidebar-background transition-colors" href={roleHome[role]}>
                      <LayoutDashboard className="h-4 w-4" /> Home
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-sidebar-background transition-colors" href="/settings">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenu.Item>
                  <div className="h-px bg-gray-50 my-1" />
                  <DropdownMenu.Item asChild>
                    <button 
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                      onClick={async () => {
                        const res = await fetch('/api/auth/logout', { method: 'POST' });
                        if (res.ok) window.location.href = '/login';
                      }}
                    >
                      Logout
                    </button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </div>
        </header>

        <motion.main 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }} 
          className="flex-1 container py-10 px-8 max-w-7xl mx-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

