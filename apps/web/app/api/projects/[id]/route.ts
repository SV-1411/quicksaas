import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseServiceClient();
  const userRes = await supabase.auth.getUser(token);
  if (!userRes.data.user) return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });

  const { data: actor } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', userRes.data.user.id)
    .maybeSingle();

  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let projectQuery = supabase.from('projects').select('id, title, status, complexity_score, total_price, created_at').eq('id', params.id);

  if (actor.role === 'client') {
    projectQuery = projectQuery.eq('client_id', actor.id);
  }

  const { data: project, error } = await projectQuery.maybeSingle();
  if (error || !project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const modules = await supabase
    .from('project_modules')
    .select('id, module_key, module_name, module_status, structured_progress, module_weight, updated_at')
    .eq('project_id', params.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  const riskLogs = actor.role === 'admin'
    ? await supabase
        .from('risk_logs')
        .select('id, module_id, risk_score, trigger_type, action_taken, created_at')
        .eq('project_id', params.id)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] as any[] };

  return NextResponse.json({ project, modules: modules.data ?? [], risks: riskLogs.data ?? [] });
}
