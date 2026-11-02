export const DAY = 86_400_000;

export type ScheduleRow = {
  water_interval_days: number | null;
  fertilizer_interval_days: number | null;
  last_watered_at: string | null;
  last_fertilized_at: string | null;
  created_at: string;
};

export type DueState = "none" | "due" | "overdue" | "upcoming";

/** `days` is a whole-day magnitude: 0 means "today", >0 means overdue or remaining depending on `state`. */
export type DueInfo = { state: DueState; days: number; dueAt: number | null };

const INTERVAL_FIELDS = {
  water: { interval: "water_interval_days", last: "last_watered_at" },
  fertilize: { interval: "fertilizer_interval_days", last: "last_fertilized_at" },
} as const;

export type CareKind = keyof typeof INTERVAL_FIELDS;

/** Next moment a care action is due, or null when the plant has no schedule for it. */
export function nextDueAt(row: ScheduleRow, kind: CareKind): number | null {
  const { interval, last } = INTERVAL_FIELDS[kind];
  const days = row[interval];
  if (days === null || days === undefined || days <= 0) return null;
  const lastRaw = row[last];
  const base = lastRaw ? new Date(lastRaw).getTime() : new Date(row.created_at).getTime();
  if (!Number.isFinite(base)) return null;
  return base + days * DAY;
}

export function dueInfo(row: ScheduleRow, kind: CareKind, now = Date.now()): DueInfo {
  const dueAt = nextDueAt(row, kind);
  if (dueAt === null) return { state: "none", days: 0, dueAt: null };
  const diff = dueAt - now;
  if (diff <= 0) {
    const late = Math.floor(-diff / DAY);
    return late <= 0 ? { state: "due", days: 0, dueAt } : { state: "overdue", days: late, dueAt };
  }
  if (diff <= DAY) return { state: "due", days: 0, dueAt };
  return { state: "upcoming", days: Math.ceil(diff / DAY), dueAt };
}

export function isCareDue(row: ScheduleRow, kind: CareKind, now = Date.now()): boolean {
  const { state } = dueInfo(row, kind, now);
  return state === "due" || state === "overdue";
}

/** Plants that need attention now, water first, then the most overdue action. */
export function plantsDueNow<T extends ScheduleRow>(rows: T[], now = Date.now()): T[] {
  return rows
    .map((row) => ({ row, info: dueInfo(row, "water", now), fert: dueInfo(row, "fertilize", now) }))
    .filter(({ info, fert }) => info.state === "overdue" || info.state === "due" || fert.state === "overdue" || fert.state === "due")
    .sort((a, b) => (a.info.dueAt ?? Infinity) - (b.info.dueAt ?? Infinity))
    .map(({ row }) => row);
}
