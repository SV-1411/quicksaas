import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient, createSupabaseServerClient } from '../../../../lib/supabase/server';
import { roleHome } from '../../../../lib/auth/roles';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role } = (await request.json()) as {
      email: string;
      password: string;
      fullName: string;
      role: 'client' | 'freelancer' | 'admin';
    };

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['client', 'freelancer', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const serviceClient = createSupabaseServiceClient();

    // Create the auth user.
    // The DB trigger (handle_new_auth_user) will auto-insert into public.users.
    // We pass fullName + role in user_metadata so the trigger can read them.
    const created = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (created.error || !created.data.user) {
      return NextResponse.json({ error: created.error?.message ?? 'Signup failed' }, { status: 400 });
    }

    // The trigger inserts the row but uses a simple email-prefix heuristic for role.
    // Update the row with the actual role + full_name the user chose.
    const { error: updateError } = await serviceClient
      .from('users')
      .update({ role, full_name: fullName })
      .eq('auth_user_id', created.data.user.id);

    if (updateError) {
      // Non-fatal — log it but don't fail the signup
      console.error('Profile update error (non-fatal):', updateError.message);
    }

    // Auto-sign-in so the session cookie is set immediately
    const serverClient = await createSupabaseServerClient();
    const { data: signInData, error: signInError } = await serverClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      // Account created but couldn't auto-login — redirect to login
      return NextResponse.json({
        ok: true,
        redirectTo: '/login',
        message: 'Account created. Please sign in.',
      });
    }

    return NextResponse.json({
      ok: true,
      redirectTo: roleHome[role] ?? '/',
      role,
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        expires_at: signInData.session.expires_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
