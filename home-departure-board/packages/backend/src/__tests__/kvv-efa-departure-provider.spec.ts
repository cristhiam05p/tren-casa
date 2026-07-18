import { describe, expect, it } from "vitest";
import { parseEfaDateTime } from "../providers/kvv-efa-departure-provider.js";

describe("parseEfaDateTime", () => {
  it("interprets KVV wall-clock times in Berlin summer time", () => {
    expect(
      parseEfaDateTime(
        { year: 2026, month: 7, day: 18, hour: 12, minute: 36 },
        "Europe/Berlin"
      )
    ).toBe("2026-07-18T10:36:00.000Z");
  });

  it("interprets KVV wall-clock times in Berlin winter time", () => {
    expect(
      parseEfaDateTime(
        { year: 2026, month: 1, day: 18, hour: 12, minute: 36 },
        "Europe/Berlin"
      )
    ).toBe("2026-01-18T11:36:00.000Z");
  });

  it("converts local timestamp strings but preserves explicit offsets", () => {
    expect(parseEfaDateTime("2026-07-18T12:36:00", "Europe/Berlin")).toBe(
      "2026-07-18T10:36:00.000Z"
    );
    expect(parseEfaDateTime("2026-07-18T12:36:00+02:00", "Europe/Berlin")).toBe(
      "2026-07-18T10:36:00.000Z"
    );
  });
});
