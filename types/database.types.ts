export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = 'client' | 'freelancer' | 'admin' | 'system';
export type ProjectStatus = 'draft' | 'intake' | 'active' | 'at_risk' | 'completed' | 'cancelled';
export type ModuleStatus =
  | 'queued'
  | 'assigned'
  | 'in_progress'
  | 'handoff'
  | 'review'
  | 'completed'
  | 'blocked'
  | 'reassigned';

export interface User {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  specialty_tags: string[];
  skill_vector: Record<string, number>;
  reliability_score: number;
  availability_score: number;
  wallet_balance: number;
}

export interface ProjectModule {
  id: string;
  project_id: string;
  module_key: 'frontend' | 'backend' | 'integrations' | 'deployment' | string;
  module_name: string;
  module_status: ModuleStatus;
  assigned_freelancer_id: string | null;
  module_vector: Record<string, number>;
  module_weight: number;
  expected_progress_rate: number;
  due_at: string | null;
}

export interface FreelancerTaskLog {
  id: string;
  module_id: string;
  freelancer_id: string;
  time_spent_minutes: number;
  completion_percentage: number;
  ai_quality_score: number;
  penalties: number;
}
