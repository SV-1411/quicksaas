import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';
import { AiroBuilderService } from '@services/airobuilder-service';

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

    const moduleRes = await supabase
      .from('project_modules')
      .select('id, project_id')
      .eq('id', moduleId)
      .single();

    if (!moduleRes.data) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

    const airoService = new AiroBuilderService(
      process.env.AIROBUILDER_API_URL ?? 'https://api.airobuilder.example.com',
      process.env.AIROBUILDER_API_KEY ?? 'dev-key'
    );

    const session = await airoService.createSession({
      moduleId,
      freelancerId: actor.id,
      projectContext: { projectId: moduleRes.data.project_id }
    });

    const { data: dbSession, error: dbError } = await supabase
      .from('airobuilder_sessions')
      .insert({
        module_id: moduleId,
        freelancer_id: actor.id,
        external_session_id: session.externalSessionId,
        build_url: session.buildUrl,
        deployment_url: session.deploymentUrl,
        session_status: session.sessionStatus,
        payload: session.payload
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ ok: true, session: dbSession });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
