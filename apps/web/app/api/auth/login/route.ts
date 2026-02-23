import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';
import { roleHome } from '../../../../lib/auth/roles';

export async function POST(request: NextRequest) {
  const { email, password } = (await request.json()) as { email: string; password: string };
  const supabase = await createSupabaseServerClient();

  const session = await supabase.auth.signInWithPassword({ email, password });
  if (session.error || !session.data.user) {
    return NextResponse.json({ error: session.error?.message ?? 'Invalid credentials' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', session.data.user.id)
    .maybeSingle();

  if (error || !profile?.role) {
    return NextResponse.json({ error: 'Role profile not found' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, redirectTo: roleHome[profile.role as keyof typeof roleHome] });
}
