export function minutesSince(isoDate: string, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(isoDate).getTime()) / 60000));
}

export function hoursBetween(startIso: string, endIso: string): number {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3600000);
}

export function isPastDue(isoDate?: string | null, now = new Date()): boolean {
  if (!isoDate) return false;
  return new Date(isoDate).getTime() < now.getTime();
}
