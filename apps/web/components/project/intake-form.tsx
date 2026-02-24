'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../lib/hooks/use-toast';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

const PRODUCT_TYPES = ['web_app', 'mobile_app', 'website', 'platform'] as const;
const URGENCY_LEVELS = ['low', 'medium', 'high'] as const;
const FEATURES = [
  'User Auth', 'Payments', 'Dashboard', 'Admin Panel', 
  'AI Integration', 'Realtime Chat', 'Search', 'Analytics',
  'File Upload', 'Notifications', 'Mobile Responsive'
];
const INTEGRATIONS = ['Stripe', 'WhatsApp', 'Twilio', 'Mailchimp', 'Shopify', 'HubSpot'];

export default function IntakeForm({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter();
  const { show } = useToast();
  const supabase = createSupabaseBrowserClient();
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [productType, setProductType] = useState<typeof PRODUCT_TYPES[number]>('web_app');
  const [urgency, setUrgency] = useState<typeof URGENCY_LEVELS[number]>('medium');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const toggleFeature = (f: string) => {
    setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const toggleIntegration = (i: string) => {
    setSelectedIntegrations(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !notes || selectedFeatures.length === 0) {
      return show('Validation Error', 'Title, notes, and at least one feature are required.');
    }

    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const intake = {
        productType,
        urgency,
        features: selectedFeatures,
        integrations: selectedIntegrations,
        notes,
      };

      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, intake }),
      });

      const raw = await response.text();
      const payload = raw ? JSON.parse(raw) : {};

      if (!response.ok) throw new Error(payload.error || 'Failed to create project');

      show('Success', 'Project created and modules initialized.');
      router.push(payload.redirectTo);
    } catch (err: any) {
      show('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Project Title</label>
          <input 
            className="w-full rounded-lg border bg-background p-2.5 mt-1" 
            placeholder="e.g. B2B Delivery Portal"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Product Type</label>
            <select 
              className="w-full rounded-lg border bg-background p-2.5 mt-1"
              value={productType}
              onChange={e => setProductType(e.target.value as any)}
            >
              {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Urgency</label>
            <select 
              className="w-full rounded-lg border bg-background p-2.5 mt-1"
              value={urgency}
              onChange={e => setUrgency(e.target.value as any)}
            >
              {URGENCY_LEVELS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Core Features</label>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map(f => (
              <Badge 
                key={f} 
                className={`cursor-pointer ${selectedFeatures.includes(f) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                onClick={() => toggleFeature(f)}
              >
                {f}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Third-party Integrations</label>
          <div className="flex flex-wrap gap-2">
            {INTEGRATIONS.map(i => (
              <Badge 
                key={i} 
                className={`cursor-pointer ${selectedIntegrations.includes(i) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                onClick={() => toggleIntegration(i)}
              >
                {i}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Detailed Requirements</label>
          <textarea 
            className="min-h-32 w-full rounded-lg border bg-background p-2.5 mt-1" 
            placeholder="Describe business logic, user flows, and any specific constraints..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Initializing Engine...' : 'Launch Execution'}
        </Button>
      </div>
    </form>
  );
}
