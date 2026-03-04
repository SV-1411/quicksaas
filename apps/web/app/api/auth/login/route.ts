import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';
import { roleHome } from '../../../../lib/auth/roles';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // createSupabaseServerClient handles cookie setting automatically via @supabase/ssr
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Look up the user's role in our own users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', data.user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (profileError || !profile?.role) {
      return NextResponse.json(
        { error: 'User profile not found. Please sign up first.' },
        { status: 403 }
      );
    }

    const redirectTo = roleHome[profile.role as keyof typeof roleHome] ?? '/';

    // Return both the redirect path AND the access_token.
    // The session cookie is set automatically by the SSR client above.
    return NextResponse.json({
      ok: true,
      redirectTo,
      role: profile.role,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
