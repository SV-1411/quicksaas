'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../lib/hooks/use-toast';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

interface ShiftCheckoutProps {
  moduleId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ShiftCheckout({ moduleId, onSuccess, onCancel }: ShiftCheckoutProps) {
  const { show } = useToast();
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [publicSummary, setPublicSummary] = useState('');
  const [internalSummary, setInternalSummary] = useState('');
  const [percentDelta, setPercentDelta] = useState(10);
  const [deploymentUrl, setDeploymentUrl] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/freelancer/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          moduleId,
          publicSummary,
          internalSummary,
          percentDelta,
          deploymentUrl
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Checkout failed');

      show('Success', 'Shift completed and handoff snapshot saved.');
      onSuccess?.();
    } catch (err: any) {
      show('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Progress Made (%)</label>
        <input 
          type="number" 
          className="w-full rounded-lg border bg-background p-2" 
          value={percentDelta}
          onChange={e => setPercentDelta(parseInt(e.target.value))}
          min="0" max="100"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Public Summary (Client visible)</label>
        <textarea 
          className="w-full rounded-lg border bg-background p-2 min-h-[80px]" 
          placeholder="What did you achieve? (e.g. Implemented login API)"
          value={publicSummary}
          onChange={e => setPublicSummary(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Internal Notes (Handoff for next freelancer)</label>
        <textarea 
          className="w-full rounded-lg border bg-background p-2 min-h-[100px]" 
          placeholder="Technical details, blockers, or next steps..."
          value={internalSummary}
          onChange={e => setInternalSummary(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Deployment/Preview URL (Optional)</label>
        <input 
          className="w-full rounded-lg border bg-background p-2" 
          placeholder="https://..."
          value={deploymentUrl}
          onChange={e => setDeploymentUrl(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Processing...' : 'Complete Shift'}
        </Button>
      </div>
    </form>
  );
}
