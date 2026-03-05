import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a client
    const { data: profile } = await supabase
      .from('users')
      .select('role, id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile || profile.role !== 'client') {
      return NextResponse.json({ error: 'Forbidden. Only clients can create projects.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, budget } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Insert the project
    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        client_id: profile.id,
        title,
        raw_requirement: description,
        status: 'draft', // Initial status before the system processes it
        structured_requirements: { budget: budget || 'unspecified' },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Project creation error:', insertError);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    // Write to the client feed to acknowledge receipt
    await supabase
      .from('client_update_feed')
      .insert({
        project_id: project.id,
        update_type: 'milestone',
        visible_to_client: true,
        summary: 'Brief submitted. Our system is parsing your requirements into execution modules.',
      });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
