import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { moduleId, dailyWageInr } = (await request.json()) as { moduleId: string; dailyWageInr?: number };
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

    // Find the active assignment for this module
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

    // Mark assignment as active
    await supabase
      .from('project_module_assignments')
      .update({ status: 'active' })
      .eq('id', assignment.data.id);

    // ── Write daily_shifts row (the core shift model) ──────────────────────────
    // shift_date is today in IST (UTC+5:30)
    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const shiftDate = nowIST.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    await supabase.from('daily_shifts').upsert(
      {
        module_id: moduleId,
        freelancer_id: actor.id,
        assignment_id: assignment.data.id,
        shift_date: shiftDate,
        daily_wage_inr: dailyWageInr ?? 1500,
        status: 'active',
        checked_in_at: new Date().toISOString(),
      },
      { onConflict: 'module_id,freelancer_id,shift_date' }
    );

    // Work snapshot (check_in)
    const snapshot = await supabase
      .from('work_snapshots')
      .insert({
        module_id: moduleId,
        created_by: actor.id,
        snapshot_type: 'check_in',
        public_summary: 'Work session started',
        internal_summary: '',
      })
      .select('id, created_at')
      .single();

    // Update project module to in_progress
    await supabase
      .from('project_modules')
      .update({ module_status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', moduleId)
      .in('module_status', ['queued', 'assigned', 'handoff', 'reassigned']);

    return NextResponse.json({ ok: true, shiftDate, snapshot: snapshot.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
