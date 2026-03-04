import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../../lib/supabase/server';

/**
 * GET /api/projects/[id]/feed
 *
 * Returns the chronological client_update_feed for a project.
 * Freelancer identity is NEVER exposed — only public headline,
 * update type, progress percentage, and timestamp.
 *
 * Supports ?limit=N&before=<ISO timestamp> for cursor-based pagination.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        // Verify project ownership (clients can only see their own projects)
        const projectRes = await supabase
            .from('projects')
            .select('id, title, status, client_id')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single();

        if (!projectRes.data) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        if (actor.role === 'client' && projectRes.data.client_id !== actor.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (actor.role === 'freelancer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
        const before = searchParams.get('before'); // ISO timestamp for pagination

        let feedQuery = supabase
            .from('client_update_feed')
            .select('id, update_type, headline, detail_md, progress_pct, created_at')
            .eq('project_id', params.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (before) {
            feedQuery = feedQuery.lt('created_at', before);
        }

        const { data: feed, error } = await feedQuery;
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // Also return module summaries (no freelancer data)
        const { data: modules } = await supabase
            .from('project_modules')
            .select('id, module_key, module_name, module_status, module_weight, due_at, completed_at')
            .eq('project_id', params.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: true });

        return NextResponse.json({
            project: {
                id: projectRes.data.id,
                title: projectRes.data.title,
                status: projectRes.data.status,
            },
            modules: modules ?? [],
            feed: feed ?? [],
            hasMore: (feed?.length ?? 0) === limit,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
