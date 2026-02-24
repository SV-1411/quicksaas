export function computePenalty(params: { trigger: string; baseAmount: number }) {
  const base = params.baseAmount;
  if (params.trigger === 'shift_missed') return Math.min(base * 0.25, 5000);
  if (params.trigger === 'inactivity') return Math.min(base * 0.1, 2500);
  if (params.trigger === 'quality_fail') return Math.min(base * 0.2, 4000);
  return 0;
}
