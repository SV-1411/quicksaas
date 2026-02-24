import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      moduleId: string;
      publicSummary: string;
      internalSummary: string;
      percentDelta?: number;
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

    await supabase
      .from('progress_logs')
      .insert({
        project_id: moduleRes.data.project_id,
        module_id: body.moduleId,
        created_by: actor.id,
        public_summary: body.publicSummary,
        percent_delta: body.percentDelta ?? 0,
      });

    return NextResponse.json({ ok: true, snapshot: snapshot.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
