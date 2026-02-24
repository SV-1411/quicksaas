export interface ProjectIntake {
  productType: 'web_app' | 'mobile_app' | 'website' | 'platform';
  industry?: string;
  urgency: 'low' | 'medium' | 'high';
  launchDate?: string;
  features: string[];
  integrations: string[];
  notes: string;
  brandRefs?: string[];
}

export function validateIntake(intake: Partial<ProjectIntake>) {
  const missing: string[] = [];
  if (!intake.productType) missing.push('productType');
  if (!intake.urgency) missing.push('urgency');
  if (!intake.features || intake.features.length === 0) missing.push('features');
  if (!intake.integrations) missing.push('integrations');
  if (!intake.notes) missing.push('notes');
  return missing;
}

export function intakeToStructuredRequirements(intake: ProjectIntake) {
  const complexityScore = Math.min(100, Math.max(10, 10 + intake.features.length * 6 + intake.integrations.length * 8));
  return {
    productType: intake.productType,
    industry: intake.industry ?? 'general',
    urgency: intake.urgency,
    launchDate: intake.launchDate ?? null,
    features: intake.features,
    integrations: intake.integrations,
    scope: intake.features.length >= 10 ? 'large' : intake.features.length >= 5 ? 'medium' : 'small',
    complexityScore,
  };
}

export function structuredToGml(structured: any) {
  return {
    version: 'gml.v1',
    modules: {
      frontend: { done: ['Responsive UI', 'Auth', 'Client dashboard', 'Freelancer workspace'] },
      backend: { done: ['RLS policies', 'Assignment engine', 'Shift snapshots', 'Realtime feeds'] },
      integrations: { done: structured.integrations ?? [] },
      deployment: { done: ['AiroBuilder session', 'Deployment URL surfaced'] },
    },
    structured,
  };
}
