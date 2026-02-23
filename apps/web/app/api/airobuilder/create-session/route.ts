import { NextRequest, NextResponse } from 'next/server';
import { AiroBuilderService } from '../../../../../../services/airobuilder-service';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

interface CreateSessionBody {
  moduleId: string;
  projectContext: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const body = (await request.json()) as CreateSessionBody;

  if (!token || !body.moduleId) {
    return NextResponse.json({ error: 'Unauthorized or missing moduleId.' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const userRes = await supabase.auth.getUser(token);
  if (!userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: actor } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', userRes.data.user.id)
    .maybeSingle();

  if (!actor || (actor.role !== 'freelancer' && actor.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const moduleRes = await supabase
    .from('project_modules')
    .select('id, assigned_freelancer_id')
    .eq('id', body.moduleId)
    .single();

  if (moduleRes.error || !moduleRes.data) return NextResponse.json({ error: 'Module not found' }, { status: 404 });
  if (actor.role === 'freelancer' && moduleRes.data.assigned_freelancer_id !== actor.id) {
    return NextResponse.json({ error: 'Module not assigned to you' }, { status: 403 });
  }

  const service = new AiroBuilderService(
    process.env.AIROBUILDER_API_URL ?? 'https://api.airobuilder.example.com',
    process.env.AIROBUILDER_API_KEY ?? 'dev-key',
  );

  const session = await service.createSession({
    moduleId: body.moduleId,
    freelancerId: moduleRes.data.assigned_freelancer_id,
    projectContext: body.projectContext ?? {},
  });

  await supabase.from('airobuilder_sessions').insert({
    module_id: body.moduleId,
    freelancer_id: moduleRes.data.assigned_freelancer_id,
    external_session_id: session.externalSessionId,
    build_url: session.buildUrl,
    deployment_url: session.deploymentUrl,
    session_status: session.sessionStatus,
    payload: session.payload,
  });

  return NextResponse.json({ session });
}
