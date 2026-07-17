import { describe, expect, it } from "vitest";
import { MockDepartureProvider } from "../providers/mock-departure-provider.js";

describe("MockDepartureProvider", () => {
  it("returns realistic sorted departures", async () => {
    const provider = new MockDepartureProvider();
    const departures = await provider.getDepartures(new Date("2026-06-21T12:00:00.000Z"));

    expect(departures.length).toBeGreaterThanOrEqual(6);
    expect(departures[0].line).toBe("S1");
    expect(departures[0].destination).toContain("Bad Herrenalb");
    expect(departures.map((departure) => departure.minutesUntilDeparture)).toEqual(
      [...departures.map((departure) => departure.minutesUntilDeparture)].sort((a, b) => a - b)
    );
    expect(departures.some((departure) => departure.cancelled)).toBe(true);
  });
});
