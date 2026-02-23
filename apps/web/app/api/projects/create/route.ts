import { NextRequest, NextResponse } from 'next/server';
import { calculateDynamicPrice } from '../../../../../services/pricing-engine';

interface CreateProjectBody {
  title: string;
  rawRequirement: string;
  clientId: string;
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
  const body = (await request.json()) as CreateProjectBody;

  if (!body.clientId || !body.rawRequirement || !body.title) {
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

  const projectId = crypto.randomUUID();
  const modules = buildModules(projectId);

  return NextResponse.json({
    project: {
      id: projectId,
      client_id: body.clientId,
      title: body.title,
      raw_requirement: body.rawRequirement,
      structured_requirements: structured,
      complexity_score: structured.complexityScore,
      total_price: pricing.total,
    },
    modules,
  });
}
