'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../lib/hooks/use-toast';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

const SPECIALTIES = ['frontend', 'backend', 'integrations', 'deployment', 'ai_automation'];
const SHIFTS = [
  { key: 'A', label: 'Shift A (09:00–18:00 IST)' },
  { key: 'B', label: 'Shift B (18:00–02:00 IST)' },
  { key: 'C', label: 'Shift C (02:00–09:00 IST)' },
];

export default function FreelancerOnboarding() {
  const router = useRouter();
  const { show } = useToast();
  const supabase = createSupabaseBrowserClient();
  
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [skills, setSkills] = useState('');

  const toggleSpecialty = (s: string) => {
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleShift = (s: string) => {
    setSelectedShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (specialties.length === 0 || selectedShifts.length === 0) {
      return show('Error', 'Please select at least one specialty and one shift.');
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Ensure the user exists in public.users first
      const { data: profileRow, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      let targetUserId = profileRow?.id;

      if (!targetUserId) {
        // Create user row if it doesn't exist (failsafe)
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Freelancer',
            role: 'freelancer'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        targetUserId = newUser.id;
      }

      const { error } = await supabase.from('freelancer_profiles').upsert({
        user_id: targetUserId,
        specialties,
        availability: { shifts: selectedShifts },
        skills_vector: { raw: skills },
        timezone: 'Asia/Kolkata',
        kyc_status: 'completed'
      });

      if (error) throw error;

      show('Success', 'Profile updated. You are now eligible for assignments.');
      router.refresh();
    } catch (err: any) {
      show('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Freelancer Onboarding</h2>
      <form onSubmit={onSubmit} className="space-y-8">
        <div>
          <label className="text-sm font-medium mb-3 block">Your Specialties</label>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map(s => (
              <Badge 
                key={s} 
                className={`cursor-pointer px-4 py-2 text-sm ${specialties.includes(s) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                onClick={() => toggleSpecialty(s)}
              >
                {s.replace('_', ' ').toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">Availability (Choose your Shifts)</label>
          <div className="grid gap-3">
            {SHIFTS.map(s => (
              <div 
                key={s.key}
                onClick={() => toggleShift(s.key)}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${selectedShifts.includes(s.key) ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}
              >
                <span className="text-sm font-medium">{s.label}</span>
                {selectedShifts.includes(s.key) && <Badge className="bg-primary text-primary-foreground">Selected</Badge>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Technical Skills & Experience</label>
          <textarea 
            className="min-h-32 w-full rounded-lg border bg-background p-3 text-sm" 
            placeholder="e.g. 5 years of React, Node.js expert, specialized in Supabase RLS..."
            value={skills}
            onChange={e => setSkills(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
          {loading ? 'Saving Profile...' : 'Complete Onboarding'}
        </Button>
      </form>
    </Card>
  );
}
