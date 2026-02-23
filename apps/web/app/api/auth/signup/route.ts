import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';
import { roleHome } from '../../../../lib/auth/roles';

export async function POST(request: NextRequest) {
  const { email, password, fullName, role } = (await request.json()) as {
    email: string;
    password: string;
    fullName: string;
    role: 'client' | 'freelancer' | 'admin';
  };

  if (!email || !password || !fullName || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { fullName, role },
  });

  if (created.error || !created.data.user) {
    return NextResponse.json({ error: created.error?.message ?? 'Signup failed' }, { status: 400 });
  }

  const profile = await supabase.from('users').insert({
    auth_user_id: created.data.user.id,
    role,
    full_name: fullName,
    email,
  });

  if (profile.error) {
    return NextResponse.json({ error: profile.error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, redirectTo: roleHome[role] });
}
