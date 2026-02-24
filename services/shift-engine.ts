export function buildPublicSummary(input: { moduleName: string; whatChanged: string }) {
  return `${input.moduleName}: ${input.whatChanged}`;
}
