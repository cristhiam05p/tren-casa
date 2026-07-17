import { describe, expect, it } from "vitest";
import { calculateUrgency, formatDepartureDisplay } from "../time.js";

describe("departure display formatting", () => {
  it("uses relative minutes below ten minutes", () => {
    expect(
      formatDepartureDisplay(
        "2026-06-21T12:07:00.000Z",
        new Date("2026-06-21T12:00:30.000Z"),
        "UTC"
      )
    ).toBe("in 7 min");
  });

  it("uses clock time from ten minutes onward", () => {
    expect(
      formatDepartureDisplay(
        "2026-06-21T12:37:00.000Z",
        new Date("2026-06-21T12:00:00.000Z"),
        "UTC"
      )
    ).toBe("12:37");
  });
});

describe("urgency calculation", () => {
  const config = { walkingMinutes: 8, bikeMinutes: 4 };

  it("marks departures above walking time as safe", () => {
    expect(calculateUrgency(9, false, config)).toBe("safe");
  });

  it("marks departures between walking and bike time as warning", () => {
    expect(calculateUrgency(6, false, config)).toBe("warning");
  });

  it("marks departures below bike time as critical", () => {
    expect(calculateUrgency(3, false, config)).toBe("critical");
  });

  it("keeps cancelled departures separate", () => {
    expect(calculateUrgency(12, true, config)).toBe("cancelled");
  });
});
