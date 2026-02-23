import { calculateDynamicPrice } from '../../../services/pricing-engine';
import { evaluateRisk } from '../../../services/risk-engine';

export function healthcheck() {
  return {
    service: 'gigzs-backend',
    status: 'ok',
    pricingSmoke: calculateDynamicPrice({
      complexityScore: 50,
      baseRate: 1000,
      urgencyMultiplier: 5000,
      resourceLoadFactor: 2000,
      integrationWeight: 3000,
      activeProjects: 1100,
      capacityThreshold: 1000,
    }),
    riskSmoke: evaluateRisk({
      moduleId: 'm',
      projectId: 'p',
      freelancerId: 'f',
      lastSnapshotAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      maxSnapshotDelayMinutes: 60,
      progress: 0.2,
      expectedProgress: 0.6,
      dueAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    }),
  };
}
