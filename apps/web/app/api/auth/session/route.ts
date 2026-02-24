import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ authenticated: false });

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name, email, avatar_url, bio, ui_prefs')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  return NextResponse.json({ authenticated: true, profile });
}
