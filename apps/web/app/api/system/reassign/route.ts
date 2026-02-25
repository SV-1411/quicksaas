import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';
import { computePenalty } from '@services/penalty-engine';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as { moduleId: string; trigger: string };
    if (!body.moduleId) return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });

    const supabase = createSupabaseServiceClient();
    const userRes = await supabase.auth.getUser(token);
    if (!userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: actor } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', userRes.data.user.id)
      .maybeSingle();

    if (!actor || (actor.role !== 'admin' && actor.role !== 'system')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const moduleRes = await supabase
      .from('project_modules')
      .select('id, project_id, assigned_freelancer_id')
      .eq('id', body.moduleId)
      .single();

    if (!moduleRes.data) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

    const fromFreelancerId = moduleRes.data.assigned_freelancer_id;

    const backup = await supabase
      .from('project_module_assignments')
      .select('freelancer_id')
      .eq('module_id', body.moduleId)
      .eq('assignment_role', 'backup')
      .is('deleted_at', null)
      .order('shift_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    const toFreelancerId = backup.data?.freelancer_id;
    if (!toFreelancerId) return NextResponse.json({ error: 'No backup assignee available' }, { status: 400 });

    await supabase
      .from('project_modules')
      .update({ assigned_freelancer_id: toFreelancerId, module_status: 'reassigned' })
      .eq('id', body.moduleId);

    await supabase
      .from('reassignment_events')
      .insert({ module_id: body.moduleId, from_freelancer_id: fromFreelancerId, to_freelancer_id: toFreelancerId, trigger: body.trigger ?? 'manual', notes: '' });

    if (fromFreelancerId) {
      const penalty = computePenalty({ trigger: body.trigger ?? 'manual', baseAmount: 10000 });
      await supabase
        .from('payout_ledger')
        .insert({ module_id: body.moduleId, freelancer_id: fromFreelancerId, base_amount: 0, penalty_amount: penalty, final_amount: -penalty, reason_code: body.trigger ?? 'manual' });
    }

    return NextResponse.json({ ok: true, reassignedTo: toFreelancerId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
