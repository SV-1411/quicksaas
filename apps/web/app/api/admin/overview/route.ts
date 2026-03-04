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

  if (!actor || actor.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Today's date in IST
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const todayIST = nowIST.toISOString().slice(0, 10);

  const [projects, risks, freelancers, todayShifts] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, status, total_price, created_at, updated_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),

    supabase
      .from('risk_logs')
      .select('id, module_id, risk_score, trigger_type, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50),

    supabase
      .from('users')
      .select('id, full_name, reliability_score, specialty_tags')
      .eq('role', 'freelancer')
      .is('deleted_at', null)
      .order('reliability_score', { ascending: true }),

    // Today's daily shifts — admin can see freelancer names for management purposes
    supabase
      .from('daily_shifts')
      .select(`
        id,
        shift_date,
        status,
        daily_wage_inr,
        checked_in_at,
        checked_out_at,
        eod_summary,
        handoff_notes,
        module_id,
        freelancer_id
      `)
      .eq('shift_date', todayIST)
      .is('deleted_at', null)
      .order('checked_in_at', { ascending: false }),
  ]);

  // Enrich shifts with module name + freelancer name (admin-only, never sent to clients)
  const shiftData = todayShifts.data ?? [];
  const moduleIds = [...new Set(shiftData.map((s) => s.module_id))];
  const freelancerIds = [...new Set(shiftData.map((s) => s.freelancer_id))];

  const [modulesRes, freelancerNamesRes] = await Promise.all([
    moduleIds.length
      ? supabase.from('project_modules').select('id, module_name, project_id').in('id', moduleIds)
      : Promise.resolve({ data: [] as any[] }),
    freelancerIds.length
      ? supabase.from('users').select('id, full_name, email').in('id', freelancerIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const moduleMap = new Map((modulesRes.data ?? []).map((m: any) => [m.id, m]));
  const freelancerMap = new Map((freelancerNamesRes.data ?? []).map((f: any) => [f.id, f]));

  const enrichedShifts = shiftData.map((s) => ({
    ...s,
    module: moduleMap.get(s.module_id) ?? null,
    // freelancer name visible to admin only — NEVER forward this to client APIs
    freelancer: freelancerMap.get(s.freelancer_id) ?? null,
  }));

  return NextResponse.json({
    projects: projects.data ?? [],
    risks: risks.data ?? [],
    freelancers: freelancers.data ?? [],
    todayShifts: enrichedShifts,
    date: todayIST,
  });
}
