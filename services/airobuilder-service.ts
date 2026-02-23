export interface AiroBuilderCreateSessionInput {
  moduleId: string;
  freelancerId: string;
  projectContext: Record<string, unknown>;
}

export interface AiroBuilderSession {
  externalSessionId: string;
  buildUrl: string;
  deploymentUrl: string;
  sessionStatus: 'pending' | 'ready' | 'deployed' | 'failed' | 'archived';
  payload: Record<string, unknown>;
}

export class AiroBuilderService {
  constructor(private readonly apiUrl: string, private readonly apiKey: string) {}

  async createSession(input: AiroBuilderCreateSessionInput): Promise<AiroBuilderSession> {
    const response = await fetch(`${this.apiUrl}/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moduleId: input.moduleId,
        freelancerId: input.freelancerId,
        context: input.projectContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`AiroBuilder session creation failed: ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;

    return {
      externalSessionId: String(payload.sessionId),
      buildUrl: String(payload.buildUrl),
      deploymentUrl: String(payload.deploymentUrl ?? ''),
      sessionStatus: (payload.status as AiroBuilderSession['sessionStatus']) ?? 'pending',
      payload,
    };
  }
}
