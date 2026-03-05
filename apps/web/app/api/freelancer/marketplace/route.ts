import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('auth_user_id', user.id)
            .single();

        if (profile?.role !== 'freelancer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch queued or unassigned modules
        const { data: modules, error } = await supabase
            .from('project_modules')
            .select('id, module_name, module_weight, due_at, project_id, module_status')
            .eq('module_status', 'queued')
            .is('deleted_at', null)
            .limit(20);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ modules });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
