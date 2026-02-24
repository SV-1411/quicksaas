import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createSupabaseServiceClient();

    const userRes = await supabase.auth.getUser(token);
    if (!userRes.data.user) return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });

    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', userRes.data.user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (actorError) return NextResponse.json({ error: actorError.message }, { status: 400 });
    if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let query = supabase
      .from('projects')
      .select('id, title, status, total_price, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (actor.role === 'client') {
      query = query.eq('client_id', actor.id);
    }

    const { data: projects, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ projects: projects ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
