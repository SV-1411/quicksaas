import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      moduleId: string;
      publicSummary: string;
      internalSummary?: string;
      handoffNotes?: string;
      percentDelta?: number;
      progressPct?: number;
      artifacts?: Record<string, unknown>;
      deploymentUrl?: string;
      buildUrl?: string;
    };

    if (!body.moduleId || !body.publicSummary) {
      return NextResponse.json({ error: 'moduleId and publicSummary are required' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const userRes = await supabase.auth.getUser(token);
    if (!userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: actor } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', userRes.data.user.id)
      .maybeSingle();

    if (!actor || actor.role !== 'freelancer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const moduleRes = await supabase
      .from('project_modules')
      .select('id, project_id, module_name')
      .eq('id', body.moduleId)
      .single();

    if (!moduleRes.data) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const shiftDate = nowIST.toISOString().slice(0, 10);

    // ── 1. Close the daily_shift ──────────────────────────────────────────────
    await supabase
      .from('daily_shifts')
      .update({
        status: 'checked_out',
        checked_out_at: new Date().toISOString(),
        eod_summary: body.internalSummary ?? '',
        handoff_notes: body.handoffNotes ?? '',
      })
      .eq('module_id', body.moduleId)
      .eq('freelancer_id', actor.id)
      .eq('shift_date', shiftDate)
      .eq('status', 'active');

    // ── 2. Work snapshot (check_out) ─────────────────────────────────────────
    const snapshot = await supabase
      .from('work_snapshots')
      .insert({
        module_id: body.moduleId,
        created_by: actor.id,
        snapshot_type: 'check_out',
        public_summary: body.publicSummary,
        internal_summary: body.internalSummary ?? '',
        artifacts: body.artifacts ?? {},
        deployment_url: body.deploymentUrl,
        build_url: body.buildUrl,
      })
      .select('id, created_at')
      .single();

    // ── 3. Internal progress log ──────────────────────────────────────────────
    await supabase.from('progress_logs').insert({
      project_id: moduleRes.data.project_id,
      module_id: body.moduleId,
      created_by: actor.id,
      public_summary: body.publicSummary,
      percent_delta: body.percentDelta ?? 0,
    });

    // ── 4. Write to client_update_feed (anonymised, no freelancer info) ───────
    const progressPct = body.progressPct ?? null;
    await supabase.from('client_update_feed').insert({
      project_id: moduleRes.data.project_id,
      module_id: body.moduleId,
      update_type: 'progress_checkpoint',
      headline: body.publicSummary,
      detail_md: body.handoffNotes ? `Session complete. Work handed off for continuity.` : null,
      progress_pct: progressPct,
    });

    // ── 5. Mark assignment checked_out ────────────────────────────────────────
    await supabase
      .from('project_module_assignments')
      .update({ status: 'checked_out', released_at: new Date().toISOString() })
      .eq('module_id', body.moduleId)
      .eq('freelancer_id', actor.id)
      .eq('status', 'active');

    // ── 6. Set module to handoff (paused until next day) ─────────────────────
    await supabase
      .from('project_modules')
      .update({ module_status: 'handoff' })
      .eq('id', body.moduleId)
      .eq('module_status', 'in_progress');

    return NextResponse.json({ ok: true, snapshot: snapshot.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
