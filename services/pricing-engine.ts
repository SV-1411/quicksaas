export interface PricingInput {
  complexityScore: number;
  baseRate: number;
  urgencyMultiplier: number;
  resourceLoadFactor: number;
  integrationWeight: number;
  activeProjects: number;
  capacityThreshold: number;
}

export interface PricingBreakdown {
  base: number;
  urgency: number;
  resourceLoad: number;
  integration: number;
  surge: number;
  total: number;
}

export function calculateDynamicPrice(input: PricingInput): PricingBreakdown {
  const base = input.complexityScore * input.baseRate;
  const urgency = input.urgencyMultiplier;
  const resourceLoad = input.resourceLoadFactor;
  const integration = input.integrationWeight;

  const overCapacityRatio = Math.max(0, (input.activeProjects - input.capacityThreshold) / input.capacityThreshold);
  const surge = overCapacityRatio > 0 ? base * Math.min(0.5, overCapacityRatio) : 0;

  const total = base + urgency + resourceLoad + integration + surge;

  return { base, urgency, resourceLoad, integration, surge, total };
}
