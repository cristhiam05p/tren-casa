import { describe, expect, it } from "vitest";
import { getSourceLabel } from "./status-label";

describe("getSourceLabel", () => {
  it("does not report the initial loading state as offline", () => {
    expect(getSourceLabel("unavailable", true)).toBe("Daten werden geladen");
  });

  it("reports live data after a successful transport response", () => {
    expect(getSourceLabel("live", false)).toBe("Live data");
  });
});
