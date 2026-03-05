import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../../lib/supabase/server';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        const supabase = createSupabaseServiceClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_user_id', user.id)
            .single();

        if (profile?.role !== 'freelancer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { moduleId } = await request.json();

        if (!moduleId) {
            return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
        }

        // 1. Check if it is still available
        const { data: moduleData } = await supabase
            .from('project_modules')
            .select('module_status, project_id, module_name')
            .eq('id', moduleId)
            .single();

        if (!moduleData || moduleData.module_status !== 'queued') {
            return NextResponse.json({ error: 'Module is no longer available' }, { status: 409 });
        }

        // 2. Assign to freelancer
        await supabase
            .from('project_module_assignments')
            .insert({
                module_id: moduleId,
                freelancer_id: profile.id,
                role: 'primary',
            });

        // 3. Mark as assigned
        await supabase
            .from('project_modules')
            .update({ module_status: 'assigned' })
            .eq('id', moduleId);

        // 4. Create an active shift that starts now
        const now = new Date();
        const shiftEnd = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8-hour shift

        await supabase
            .from('shifts')
            .insert({
                module_id: moduleId,
                freelancer_id: profile.id,
                shift_start: now.toISOString(),
                shift_end: shiftEnd.toISOString(),
                status: 'active',
            });

        // 5. Notify the client on the timeline
        await supabase
            .from('client_update_feed')
            .insert({
                project_id: moduleData.project_id,
                update_type: 'milestone',
                visible_to_client: true,
                headline: 'Specialist Deployed',
                detail_md: `A specialist has begun execution on the module: **${moduleData.module_name}**. Shift is active.`,
            });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
