import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseServiceClient();
  const userRes = await supabase.auth.getUser(token);
  if (!userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: actor } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', userRes.data.user.id)
    .maybeSingle();

  if (!actor || actor.role !== 'freelancer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const modules = await supabase
    .from('project_modules')
    .select('id, project_id, module_key, module_name, module_status, due_at, updated_at')
    .eq('assigned_freelancer_id', actor.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  return NextResponse.json({ modules: modules.data ?? [] });
}
