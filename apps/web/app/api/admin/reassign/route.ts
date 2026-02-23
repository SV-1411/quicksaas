import { NextRequest, NextResponse } from 'next/server';
import { rankFreelancers } from '../../../../../../services/matching-engine';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const { moduleId } = (await request.json()) as { moduleId: string };

  if (!token || !moduleId) return NextResponse.json({ error: 'Unauthorized or missing moduleId' }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const userRes = await supabase.auth.getUser(token);
  if (!userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: actor } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', userRes.data.user.id)
    .maybeSingle();

  if (!actor || actor.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const moduleRes = await supabase
    .from('project_modules')
    .select('id, module_key, module_name, module_vector, module_status, project_id, module_weight, expected_progress_rate, assigned_freelancer_id')
    .eq('id', moduleId)
    .single();

  if (moduleRes.error || !moduleRes.data) {
    return NextResponse.json({ error: moduleRes.error?.message ?? 'Module not found' }, { status: 404 });
  }

  const freelancers = await supabase
    .from('users')
    .select('id, role, full_name, email, specialty_tags, skill_vector, reliability_score, availability_score, wallet_balance')
    .eq('role', 'freelancer')
    .is('deleted_at', null);

  const ranked = rankFreelancers(moduleRes.data as any, freelancers.data as any);
  const target = ranked.find((item) => item.freelancerId !== moduleRes.data.assigned_freelancer_id);
  if (!target) return NextResponse.json({ error: 'No replacement freelancer available' }, { status: 400 });

  const updated = await supabase
    .from('project_modules')
    .update({ assigned_freelancer_id: target.freelancerId, module_status: 'reassigned' })
    .eq('id', moduleId)
    .select('id, module_status')
    .single();

  if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 400 });

  await supabase.from('risk_logs').insert({
    project_id: moduleRes.data.project_id,
    module_id: moduleId,
    freelancer_id: target.freelancerId,
    risk_score: 0.75,
    trigger_type: 'manual_reassign',
    details: { reason: 'admin_triggered_reassignment' },
    action_taken: 'reassigned',
  });

  return NextResponse.json({ ok: true, module: updated.data });
}
