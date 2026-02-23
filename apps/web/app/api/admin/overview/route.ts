import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseServiceClient();
  const userRes = await supabase.auth.getUser(token);
  if (!userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: actor } = await supabase.from('users').select('id, role').eq('auth_user_id', userRes.data.user.id).maybeSingle();
  if (!actor || actor.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [projects, risks, freelancers] = await Promise.all([
    supabase.from('projects').select('id, title, status, total_price, created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(100),
    supabase.from('risk_logs').select('id, module_id, risk_score, trigger_type, created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(50),
    supabase.from('users').select('id, full_name, reliability_score, specialty_tags').eq('role', 'freelancer').is('deleted_at', null).order('reliability_score', { ascending: true }),
  ]);

  return NextResponse.json({ projects: projects.data ?? [], risks: risks.data ?? [], freelancers: freelancers.data ?? [] });
}
