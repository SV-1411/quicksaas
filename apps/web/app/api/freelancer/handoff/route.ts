import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

/**
 * POST /api/freelancer/handoff
 *
 * Called by a freelancer at end of shift to hand the module off to
 * the next specialist. Closes the daily_shift, writes a client-visible
 * "handoff in progress" update, and marks the module as 'handoff'.
 *
 * The next specialist's assignment is assumed to be scheduled for
 * the following business day by the admin/system.
 */
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = (await request.json()) as {
            moduleId: string;
            handoffNotes: string;        // internal, visible to next freelancer
            publicSummary?: string;      // client-facing message (optional override)
        };

        if (!body.moduleId || !body.handoffNotes) {
            return NextResponse.json({ error: 'moduleId and handoffNotes are required' }, { status: 400 });
        }

        const supabase = createSupabaseServiceClient();
        const userRes = await supabase.auth.getUser(token);
        if (!userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: actor } = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_user_id', userRes.data.user.id)
            .maybeSingle();

        if (!actor || actor.role !== 'freelancer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const moduleRes = await supabase
            .from('project_modules')
            .select('id, project_id, module_name, module_status')
            .eq('id', body.moduleId)
            .single();

        if (!moduleRes.data) return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        if (moduleRes.data.module_status !== 'in_progress') {
            return NextResponse.json({ error: 'Module is not currently in progress' }, { status: 400 });
        }

        const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
        const shiftDate = nowIST.toISOString().slice(0, 10);

        // 1. Record handoff notes on the daily_shift and close it
        await supabase
            .from('daily_shifts')
            .update({
                status: 'checked_out',
                checked_out_at: new Date().toISOString(),
                handoff_notes: body.handoffNotes,
                eod_summary: body.handoffNotes,
            })
            .eq('module_id', body.moduleId)
            .eq('freelancer_id', actor.id)
            .eq('shift_date', shiftDate)
            .in('status', ['active', 'scheduled']);

        // 2. Mark assignment as checked_out
        await supabase
            .from('project_module_assignments')
            .update({ status: 'checked_out', released_at: new Date().toISOString() })
            .eq('module_id', body.moduleId)
            .eq('freelancer_id', actor.id)
            .eq('status', 'active');

        // 3. Set module status to handoff (paused for next day's specialist)
        await supabase
            .from('project_modules')
            .update({ module_status: 'handoff' })
            .eq('id', body.moduleId);

        // 4. Client-facing update (anonymised — no freelancer details)
        const headline = body.publicSummary
            ?? `${moduleRes.data.module_name}: Work session complete — continuity handoff in progress`;

        await supabase.from('client_update_feed').insert({
            project_id: moduleRes.data.project_id,
            module_id: body.moduleId,
            update_type: 'progress_checkpoint',
            headline,
            detail_md: 'Your delivery team has completed today\'s work session. Progress is being handed off to continue tomorrow.',
        });

        return NextResponse.json({ ok: true, status: 'handoff', moduleName: moduleRes.data.module_name });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
