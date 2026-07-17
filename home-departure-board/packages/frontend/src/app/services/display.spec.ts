import { describe, expect, it } from "vitest";
import { formatDepartureDisplay, getUrgencyColor } from "@home-departure-board/shared";

describe("frontend display helpers", () => {
  it("uses shared relative departure formatting", () => {
    expect(
      formatDepartureDisplay(
        "2026-06-21T12:09:00.000Z",
        new Date("2026-06-21T12:00:00.000Z"),
        "UTC"
      )
    ).toBe("in 9 min");
  });

  it("returns a cancelled color separately from the urgency scale", () => {
    expect(getUrgencyColor(20, true)).toBe("#7a8491");
  });
});

