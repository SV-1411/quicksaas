import { NextRequest, NextResponse } from 'next/server';
import { calculateDynamicPrice } from '../../../../../../services/pricing-engine';
import { autoAssignTopCandidate } from '../../../../../../services/matching-engine';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

interface CreateProjectBody {
  title: string;
  rawRequirement: string;
}

function inferRequirement(rawRequirement: string) {
  const lowered = rawRequirement.toLowerCase();
  return {
    productType: lowered.includes('app') ? 'web_app' : 'platform',
    integrations: ['payment-gateway', lowered.includes('whatsapp') ? 'whatsapp' : 'email'],
    urgency: lowered.includes('urgent') ? 'high' : 'medium',
    scope: lowered.length > 500 ? 'large' : 'medium',
    complexityScore: Math.min(100, Math.max(10, Math.floor(lowered.length / 20))),
  };
}

function buildModules(projectId: string) {
  return [
    { project_id: projectId, module_key: 'frontend', module_name: 'Frontend', module_weight: 0.25 },
    { project_id: projectId, module_key: 'backend', module_name: 'Backend', module_weight: 0.35 },
    { project_id: projectId, module_key: 'integrations', module_name: 'Integrations', module_weight: 0.25 },
    { project_id: projectId, module_key: 'deployment', module_name: 'Deployment', module_weight: 0.15 },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateProjectBody;
    const supabase = createSupabaseServiceClient();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const authClient = createSupabaseServiceClient();
    const userRes = await authClient.auth.getUser(token);
    if (!userRes.data.user) return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });

    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', userRes.data.user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (actorError) {
      return NextResponse.json({ error: actorError.message }, { status: 400 });
    }

    if (!actor || actor.role !== 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!body.rawRequirement || !body.title) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const structured = inferRequirement(body.rawRequirement);
    const pricing = calculateDynamicPrice({
      complexityScore: structured.complexityScore,
      baseRate: 1200,
      urgencyMultiplier: structured.urgency === 'high' ? 15000 : 6000,
      resourceLoadFactor: 5000,
      integrationWeight: structured.integrations.length * 3500,
      activeProjects: 1250,
      capacityThreshold: 1000,
    });

    const projectInsert = await supabase
      .from('projects')
      .insert({
        client_id: actor.id,
        title: body.title,
        raw_requirement: body.rawRequirement,
        structured_requirements: structured,
        complexity_score: structured.complexityScore,
        pricing_breakdown: pricing,
        urgency: structured.urgency,
        total_price: pricing.total,
        status: 'active',
      })
      .select('id, title, status, complexity_score, total_price')
      .single();

    if (projectInsert.error || !projectInsert.data) {
      return NextResponse.json({ error: projectInsert.error?.message ?? 'Project creation failed' }, { status: 400 });
    }

    const modulesPayload = buildModules(projectInsert.data.id);
    const modulesInsert = await supabase
      .from('project_modules')
      .insert(modulesPayload)
      .select('id, module_key, module_name, module_status, module_weight, project_id');

    if (modulesInsert.error || !modulesInsert.data) {
      return NextResponse.json({ error: modulesInsert.error?.message ?? 'Module creation failed' }, { status: 400 });
    }

    const freelancers = await supabase
      .from('users')
      .select('id, role, full_name, email, specialty_tags, skill_vector, reliability_score, availability_score, wallet_balance')
      .eq('role', 'freelancer')
      .is('deleted_at', null);

    const assignmentMap: Record<string, string> = {};

    if (freelancers.data) {
      for (const module of modulesInsert.data) {
        try {
          const match = await autoAssignTopCandidate(module as any, freelancers.data as any, async (moduleId, freelancerId) => {
            const update = await supabase
              .from('project_modules')
              .update({ assigned_freelancer_id: freelancerId, module_status: 'assigned' })
              .eq('id', moduleId);
            if (update.error) throw update.error;
          });

          if (match) assignmentMap[module.id] = 'assigned';
        } catch {
          // Assignment is best-effort; project creation should still succeed.
        }
      }
    }

    const safeModules = modulesInsert.data.map((m) => ({
      id: m.id,
      module_key: m.module_key,
      module_name: m.module_name,
      module_status: assignmentMap[m.id] ?? m.module_status,
      module_weight: m.module_weight,
    }));

    return NextResponse.json({
      project: projectInsert.data,
      modules: safeModules,
      redirectTo: `/projects/${projectInsert.data.id}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
