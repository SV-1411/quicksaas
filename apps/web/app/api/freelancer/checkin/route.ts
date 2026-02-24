import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { moduleId } = (await request.json()) as { moduleId: string };
    if (!moduleId) return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });

    const supabase = createSupabaseServiceClient();
    const userRes = await supabase.auth.getUser(token);
    if (!userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: actor } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', userRes.data.user.id)
      .maybeSingle();

    if (!actor || actor.role !== 'freelancer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const assignment = await supabase
      .from('project_module_assignments')
      .select('id, status, shift_start, shift_end, assignment_role')
      .eq('module_id', moduleId)
      .eq('freelancer_id', actor.id)
      .is('deleted_at', null)
      .order('shift_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!assignment.data) return NextResponse.json({ error: 'No active assignment' }, { status: 403 });

    await supabase
      .from('project_module_assignments')
      .update({ status: 'active' })
      .eq('id', assignment.data.id);

    const snapshot = await supabase
      .from('work_snapshots')
      .insert({ module_id: moduleId, created_by: actor.id, snapshot_type: 'check_in', public_summary: 'Shift started', internal_summary: '' })
      .select('id, created_at')
      .single();

    return NextResponse.json({ ok: true, snapshot: snapshot.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
