import { rankFreelancers } from './matching-engine';
import { nextShiftWindow } from './shift-windows';

export interface ModuleAssignmentPlan {
  moduleId: string;
  primaryFreelancerId: string | null;
  backupFreelancerId: string | null;
  shiftStart: string;
  shiftEnd: string;
  reason: string;
}

function toISTDate(now = new Date()) {
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

export function computeShiftRange(now = new Date()) {
  const shift = nextShiftWindow(now);
  const ist = toISTDate(now);
  const start = new Date(ist);
  start.setHours(shift.startHourIST, 0, 0, 0);

  const end = new Date(ist);
  end.setHours(shift.endHourIST, 0, 0, 0);

  if (shift.endHourIST <= shift.startHourIST) {
    // crosses midnight
    if (ist.getHours() >= shift.startHourIST) {
      end.setDate(end.getDate() + 1);
    } else {
      start.setDate(start.getDate() - 1);
    }
  }

  return { shiftKey: shift.key, shiftLabel: shift.label, start, end };
}

export function planAssignmentsForModule(module: any, freelancers: any[], now = new Date()): ModuleAssignmentPlan {
  const range = computeShiftRange(now);
  const ranked = rankFreelancers(module, freelancers, range.shiftKey);
  const top = ranked[0]?.freelancerId ?? null;
  const backup = ranked[1]?.freelancerId ?? null;

  return {
    moduleId: module.id,
    primaryFreelancerId: top,
    backupFreelancerId: backup,
    shiftStart: range.start.toISOString(),
    shiftEnd: range.end.toISOString(),
    reason: `auto:${range.shiftKey}`,
  };
}
