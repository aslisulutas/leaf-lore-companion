import { describe, expect, it } from "vitest";
import { DAY, dueInfo, isCareDue, nextDueAt, plantsDueNow, type ScheduleRow } from "@/lib/plant-schedule";

const NOW = new Date("2026-11-02T09:00:00Z").getTime();

function row(over: Partial<ScheduleRow> = {}): ScheduleRow {
  return {
    water_interval_days: 7,
    fertilizer_interval_days: null,
    last_watered_at: new Date(NOW - 5 * DAY).toISOString(),
    last_fertilized_at: null,
    created_at: new Date(NOW - 30 * DAY).toISOString(),
    ...over,
  };
}

describe("watering schedule", () => {
  it("says a plant watered 5 days ago with a 7-day interval is not due", () => {
    expect(dueInfo(row(), "water", NOW)).toMatchObject({ state: "upcoming", days: 2 });
    expect(isCareDue(row(), "water", NOW)).toBe(false);
  });

  it("marks a plant overdue by whole days once the interval has passed", () => {
    const late = row({ last_watered_at: new Date(NOW - 9 * DAY).toISOString() });
    expect(dueInfo(late, "water", NOW)).toMatchObject({ state: "overdue", days: 2 });
    expect(isCareDue(late, "water", NOW)).toBe(true);
  });

  it("counts the interval from the scan date when the plant was never watered", () => {
    const fresh = row({ last_watered_at: null, created_at: new Date(NOW - 7 * DAY).toISOString() });
    expect(dueInfo(fresh, "water", NOW)).toMatchObject({ state: "due", days: 0 });
  });

  it("keeps a plant unscheduled until an interval is chosen", () => {
    const none = row({ water_interval_days: null });
    expect(nextDueAt(none, "water")).toBeNull();
    expect(dueInfo(none, "water", NOW)).toMatchObject({ state: "none", days: 0 });
  });

  it("lists only plants needing attention now, most overdue first", () => {
    const a = row({ id: "a", last_watered_at: new Date(NOW - 20 * DAY).toISOString() } as Partial<ScheduleRow>);
    const b = row({ id: "b", last_watered_at: new Date(NOW - 1 * DAY).toISOString() } as Partial<ScheduleRow>);
    const c = row({ id: "c", last_watered_at: new Date(NOW - 9 * DAY).toISOString() } as Partial<ScheduleRow>);
    expect(plantsDueNow([b, a, c], NOW).map((r) => (r as ScheduleRow & { id: string }).id)).toEqual(["a", "c"]);
  });
});
