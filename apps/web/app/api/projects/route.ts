import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../lib/supabase/server';

/**
 * GET /api/projects
 * Returns all projects belonging to the authenticated client,
 * with the latest client_update_feed entry for each.
 */
export async function GET(request: NextRequest) {
  try {
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

    if (!actor) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Admin / system can see all projects; client sees only their own
    const query = supabase
      .from('projects')
      .select('id, title, status, complexity_score, total_price, urgency, created_at, updated_at, deadline_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (actor.role === 'client') {
      query.eq('client_id', actor.id);
    } else if (actor.role !== 'admin' && actor.role !== 'system') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: projects, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (!projects?.length) return NextResponse.json({ projects: [] });

    // Fetch latest feed entry per project (anonymised — no freelancer data)
    const projectIds = projects.map((p) => p.id);
    const { data: feeds } = await supabase
      .from('client_update_feed')
      .select('project_id, update_type, headline, progress_pct, created_at')
      .in('project_id', projectIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    const latestFeedByProject = new Map<string, any>();
    for (const f of feeds ?? []) {
      if (!latestFeedByProject.has(f.project_id)) latestFeedByProject.set(f.project_id, f);
    }

    const result = projects.map((p) => ({
      ...p,
      latest_update: latestFeedByProject.get(p.id) ?? null,
    }));

    return NextResponse.json({ projects: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
