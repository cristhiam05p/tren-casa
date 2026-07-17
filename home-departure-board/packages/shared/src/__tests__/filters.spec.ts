import { describe, expect, it } from "vitest";
import { isRelevantDeparture } from "../filters.js";

describe("departure filtering", () => {
  it("keeps preferred S-Bahn lines toward Karlsruhe Hbf", () => {
    expect(
      isRelevantDeparture({
        line: "S1",
        destination: "Bad Herrenalb",
        rawDirection: "via Karlsruhe Hbf"
      })
    ).toBe(true);
  });

  it("keeps other routes only when they clearly point toward Karlsruhe Hbf", () => {
    expect(
      isRelevantDeparture({
        line: "SEV",
        destination: "Karlsruhe Hauptbahnhof"
      })
    ).toBe(true);
  });

  it("keeps southbound S1/S11 directions that pass Karlsruhe Hbf", () => {
    expect(
      isRelevantDeparture({
        line: "S1",
        destination: "Ettlingen Albgaubad"
      })
    ).toBe(true);
  });

  it("filters obvious opposite-direction departures", () => {
    expect(
      isRelevantDeparture({
        line: "S11",
        destination: "Hochstetten"
      })
    ).toBe(false);
  });

  it("does not reject southbound trains just because Hochstetten is the origin", () => {
    expect(
      isRelevantDeparture({
        line: "S1",
        destination: "Bad Herrenalb",
        rawDirection: "Bad Herrenalb Hochstetten"
      })
    ).toBe(true);
  });

  it("does not keep unrelated lines without destination evidence", () => {
    expect(
      isRelevantDeparture({
        line: "S2",
        destination: "Rheinstetten"
      })
    ).toBe(false);
  });
});
