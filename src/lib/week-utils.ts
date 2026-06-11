export function getSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekStart(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getCurrentWeekStart(): string {
  return formatWeekStart(getSunday(new Date()));
}

export function getWeekDates(weekStart: string): Date[] {
  const start = new Date(weekStart + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function shiftWeek(weekStart: string, direction: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + direction * 7);
  return formatWeekStart(d);
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
