import { cosineSimilarity } from '../utils/vector-similarity';
import { ProjectModule, User } from '../types/database.types';

export interface MatchResult {
  freelancerId: string;
  similarity: number;
  reliabilityMultiplier: number;
  availabilityMultiplier: number;
  score: number;
}

export function scoreFreelancerForModule(module: ProjectModule, freelancer: User): MatchResult {
  const similarity = cosineSimilarity(freelancer.skill_vector, module.module_vector);
  const reliabilityMultiplier = Math.max(0.5, Math.min(1.5, freelancer.reliability_score));
  const availabilityMultiplier = Math.max(0.3, Math.min(1.2, freelancer.availability_score));
  const score = similarity * reliabilityMultiplier * availabilityMultiplier;

  return {
    freelancerId: freelancer.id,
    similarity,
    reliabilityMultiplier,
    availabilityMultiplier,
    score,
  };
}

export function rankFreelancers(module: ProjectModule, freelancers: User[]): MatchResult[] {
  return freelancers
    .filter((f) => f.role === 'freelancer' && f.specialty_tags.includes(module.module_key))
    .map((f) => scoreFreelancerForModule(module, f))
    .sort((a, b) => b.score - a.score);
}

export async function autoAssignTopCandidate(
  module: ProjectModule,
  freelancers: User[],
  assigner: (moduleId: string, freelancerId: string) => Promise<void>,
): Promise<MatchResult | null> {
  const ranked = rankFreelancers(module, freelancers);
  const top = ranked[0];
  if (!top) return null;
  await assigner(module.id, top.freelancerId);
  return top;
}
