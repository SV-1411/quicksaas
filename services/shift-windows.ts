export interface ShiftWindow {
  key: 'A' | 'B' | 'C';
  label: string;
  startHourIST: number;
  endHourIST: number;
}

export const nationwideShiftWindows: ShiftWindow[] = [
  { key: 'A', label: 'Shift A (09:00–18:00 IST)', startHourIST: 9, endHourIST: 18 },
  { key: 'B', label: 'Shift B (18:00–02:00 IST)', startHourIST: 18, endHourIST: 2 },
  { key: 'C', label: 'Shift C (02:00–09:00 IST)', startHourIST: 2, endHourIST: 9 },
];

export function nextShiftWindow(now = new Date()) {
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const h = ist.getHours();

  if (h >= 9 && h < 18) return nationwideShiftWindows[0];
  if (h >= 18 || h < 2) return nationwideShiftWindows[1];
  return nationwideShiftWindows[2];
}
