import { NextRequest, NextResponse } from 'next/server';
import { AiroBuilderService } from '../../../../../../services/airobuilder-service';

interface CreateSessionBody {
  moduleId: string;
  freelancerId: string;
  projectContext: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateSessionBody;

  if (!body.moduleId || !body.freelancerId) {
    return NextResponse.json({ error: 'moduleId and freelancerId are required.' }, { status: 400 });
  }

  const service = new AiroBuilderService(
    process.env.AIROBUILDER_API_URL ?? 'https://api.airobuilder.example.com',
    process.env.AIROBUILDER_API_KEY ?? 'dev-key',
  );

  const session = await service.createSession({
    moduleId: body.moduleId,
    freelancerId: body.freelancerId,
    projectContext: body.projectContext ?? {},
  });

  return NextResponse.json({ session });
}
