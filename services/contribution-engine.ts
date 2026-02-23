import { FreelancerTaskLog, User } from '../types/database.types';

export interface PayoutContext {
  moduleWeight: number;
  reliabilityMultiplier: number;
}

export interface PayoutResult {
  grossAmount: number;
  payoutAmount: number;
}

export function calculatePayout(log: FreelancerTaskLog, context: PayoutContext): PayoutResult {
  const grossAmount = context.moduleWeight * log.completion_percentage;
  const payoutAmount = grossAmount * log.ai_quality_score * context.reliabilityMultiplier - log.penalties;

  return {
    grossAmount: Number(grossAmount.toFixed(4)),
    payoutAmount: Number(Math.max(0, payoutAmount).toFixed(2)),
  };
}

export async function applyPayout(
  log: FreelancerTaskLog,
  context: PayoutContext,
  freelancer: User,
  persist: (result: PayoutResult) => Promise<void>,
  updateWallet: (freelancerId: string, newBalance: number) => Promise<void>,
): Promise<PayoutResult> {
  const result = calculatePayout(log, context);
  await persist(result);
  await updateWallet(freelancer.id, freelancer.wallet_balance + result.payoutAmount);
  return result;
}
