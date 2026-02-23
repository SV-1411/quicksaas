import { NextRequest, NextResponse } from 'next/server';
import { createSnapshot } from '../../../../../../../services/snapshot-engine';

interface SnapshotBody {
  freelancerId: string;
  workSummary: string;
  structuredProgressJson: Record<string, unknown>;
  fileReferences: string[];
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = (await request.json()) as SnapshotBody;

  if (!body.freelancerId || !body.workSummary) {
    return NextResponse.json({ error: 'Missing required snapshot fields.' }, { status: 400 });
  }

  const snapshot = await createSnapshot(
    {
      moduleId: params.id,
      freelancerId: body.freelancerId,
      workSummary: body.workSummary,
      structuredProgressJson: body.structuredProgressJson ?? {},
      fileReferences: body.fileReferences ?? [],
    },
    async () => 0,
    async (draft) => ({
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }),
    async () => undefined,
  );

  return NextResponse.json({ snapshot });
}
