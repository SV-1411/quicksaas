export interface SnapshotInput {
  moduleId: string;
  freelancerId: string;
  workSummary: string;
  structuredProgressJson: Record<string, unknown>;
  fileReferences: string[];
}

export interface SnapshotRecord extends SnapshotInput {
  id: string;
  versionNo: number;
  createdAt: string;
}

export async function createSnapshot(
  input: SnapshotInput,
  getLatestVersion: (moduleId: string) => Promise<number>,
  persist: (snapshot: Omit<SnapshotRecord, 'id' | 'createdAt'>) => Promise<SnapshotRecord>,
  updateModuleStatus: (moduleId: string, status: string) => Promise<void>,
): Promise<SnapshotRecord> {
  const latestVersion = await getLatestVersion(input.moduleId);
  const snapshot = await persist({
    ...input,
    versionNo: latestVersion + 1,
  });

  await updateModuleStatus(input.moduleId, 'handoff');
  return snapshot;
}

export async function buildHandoffSummary(
  moduleId: string,
  fetchLatestSnapshot: (moduleId: string) => Promise<SnapshotRecord | null>,
  aiSummarizer: (snapshot: SnapshotRecord) => Promise<string>,
): Promise<string> {
  const latestSnapshot = await fetchLatestSnapshot(moduleId);
  if (!latestSnapshot) return 'No prior work exists for this module.';
  return aiSummarizer(latestSnapshot);
}
