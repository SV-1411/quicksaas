import { isPastDue, minutesSince } from '../utils/time-helpers';

export interface RiskInput {
  moduleId: string;
  projectId: string;
  freelancerId: string | null;
  lastSnapshotAt: string | null;
  maxSnapshotDelayMinutes: number;
  progress: number;
  expectedProgress: number;
  dueAt: string | null;
}

export interface RiskEvaluation {
  score: number;
  triggers: string[];
}

export function evaluateRisk(input: RiskInput, now = new Date()): RiskEvaluation {
  const triggers: string[] = [];
  let score = 0;

  if (!input.lastSnapshotAt || minutesSince(input.lastSnapshotAt, now) > input.maxSnapshotDelayMinutes) {
    triggers.push('snapshot_delay');
    score += 0.4;
  }

  if (input.progress < input.expectedProgress) {
    triggers.push('progress_lag');
    score += 0.3;
  }

  if (isPastDue(input.dueAt, now)) {
    triggers.push('deadline_deviation');
    score += 0.4;
  }

  return { score: Math.min(1, score), triggers };
}

export async function handleRisk(
  input: RiskInput,
  threshold: number,
  logRisk: (evaluation: RiskEvaluation) => Promise<void>,
  autoReassign: (moduleId: string) => Promise<void>,
  reduceReliability: (freelancerId: string) => Promise<void>,
): Promise<RiskEvaluation> {
  const evaluation = evaluateRisk(input);
  await logRisk(evaluation);

  if (evaluation.score > threshold) {
    await autoReassign(input.moduleId);
    if (input.freelancerId) {
      await reduceReliability(input.freelancerId);
    }
  }

  return evaluation;
}
