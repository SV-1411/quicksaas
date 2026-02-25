import { NextRequest, NextResponse } from 'next/server';
import { createSnapshot } from '@services/snapshot-engine';
import { calculatePayout } from '@services/contribution-engine';
import { createSupabaseServiceClient } from '../../../../../lib/supabase/server';

interface SnapshotBody {
  workSummary: string;
  structuredProgressJson: Record<string, unknown>;
  fileReferences: string[];
  timeSpentMinutes: number;
  completionPercentage: number;
  aiQualityScore: number;
  penalties: number;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as SnapshotBody;
  if (!body.workSummary) {
    return NextResponse.json({ error: 'Missing required snapshot fields.' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const userRes = await supabase.auth.getUser(token);
  if (!userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: freelancer } = await supabase
    .from('users')
    .select('id, role, reliability_score, wallet_balance')
    .eq('auth_user_id', userRes.data.user.id)
    .maybeSingle();

  if (!freelancer || freelancer.role !== 'freelancer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const moduleRes = await supabase
    .from('project_modules')
    .select('id, project_id, assigned_freelancer_id, module_weight')
    .eq('id', params.id)
    .single();

  if (moduleRes.error || !moduleRes.data || moduleRes.data.assigned_freelancer_id !== freelancer.id) {
    return NextResponse.json({ error: 'Module not assigned to you' }, { status: 403 });
  }

  const snapshot = await createSnapshot(
    {
      moduleId: params.id,
      freelancerId: freelancer.id,
      workSummary: body.workSummary,
      structuredProgressJson: body.structuredProgressJson ?? {},
      fileReferences: body.fileReferences ?? [],
    },
    async (moduleId) => {
      const latest = await supabase
        .from('module_snapshots')
        .select('version_no')
        .eq('module_id', moduleId)
        .order('version_no', { ascending: false })
        .limit(1)
        .maybeSingle();
      return latest.data?.version_no ?? 0;
    },
    async (draft) => {
      const insert = await supabase
        .from('module_snapshots')
        .insert({
          module_id: draft.moduleId,
          freelancer_id: draft.freelancerId,
          version_no: draft.versionNo,
          work_summary: draft.workSummary,
          structured_progress_json: draft.structuredProgressJson,
          file_references: draft.fileReferences,
        })
        .select('id, version_no, created_at')
        .single();

      if (insert.error || !insert.data) throw insert.error;

      return {
        ...draft,
        id: insert.data.id,
        versionNo: insert.data.version_no,
        createdAt: insert.data.created_at,
      };
    },
    async (moduleId, status) => {
      await supabase
        .from('project_modules')
        .update({ module_status: status, structured_progress: body.structuredProgressJson ?? {} })
        .eq('id', moduleId);
    },
  );

  const logInsert = await supabase
    .from('freelancer_task_logs')
    .insert({
      module_id: params.id,
      freelancer_id: freelancer.id,
      time_spent_minutes: body.timeSpentMinutes ?? 30,
      completion_percentage: body.completionPercentage ?? 0.1,
      ai_quality_score: body.aiQualityScore ?? 0.8,
      penalties: body.penalties ?? 0,
      log_meta: { source: 'snapshot_submit' },
    })
    .select('id, completion_percentage, ai_quality_score, penalties')
    .single();

  if (logInsert.error || !logInsert.data) {
    return NextResponse.json({ error: logInsert.error?.message ?? 'Failed to create task log' }, { status: 400 });
  }

  const payout = calculatePayout(
    {
      id: logInsert.data.id,
      module_id: params.id,
      freelancer_id: freelancer.id,
      time_spent_minutes: body.timeSpentMinutes ?? 30,
      completion_percentage: logInsert.data.completion_percentage,
      ai_quality_score: logInsert.data.ai_quality_score,
      penalties: logInsert.data.penalties,
    },
    {
      moduleWeight: moduleRes.data.module_weight,
      reliabilityMultiplier: freelancer.reliability_score,
    },
  );

  await supabase.from('revenue_distribution').insert({
    project_id: moduleRes.data.project_id,
    module_id: params.id,
    freelancer_id: freelancer.id,
    task_log_id: logInsert.data.id,
    gross_amount: payout.grossAmount,
    payout_amount: payout.payoutAmount,
    payout_status: 'pending',
  });

  await supabase
    .from('wallets')
    .upsert({ user_id: freelancer.id, balance: Number(freelancer.wallet_balance) + payout.payoutAmount, currency: 'INR' }, { onConflict: 'user_id' });

  return NextResponse.json({ snapshot, payout });
}
