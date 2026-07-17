import { boardConfig } from "../config/env.js";
import { normalizeDeparture, sortDepartures, type DepartureDraft } from "../services/departure-normalizer.js";
import type { DepartureProvider } from "./departure-provider.js";

export class MockDepartureProvider implements DepartureProvider {
  readonly name = "MockDepartureProvider";

  async getDepartures(now = new Date()) {
    const base = floorToMinute(now);
    const drafts: DepartureDraft[] = [
      {
        line: "S1",
        destination: "Bad Herrenalb",
        plannedTime: addMinutes(base, 7).toISOString(),
        platform: "1",
        rawDirection: "Bad Herrenalb via Karlsruhe Hbf"
      },
      {
        line: "S11",
        destination: "Ittersbach",
        plannedTime: addMinutes(base, 14).toISOString(),
        realtimeTime: addMinutes(base, 16).toISOString(),
        platform: "1",
        rawDirection: "Ittersbach via Karlsruhe Hauptbahnhof"
      },
      {
        line: "S1",
        destination: "Karlsruhe Hbf",
        plannedTime: addMinutes(base, 23).toISOString(),
        cancelled: true,
        platform: "1",
        rawDirection: "Karlsruhe Hbf"
      },
      {
        line: "S11",
        destination: "Ittersbach",
        plannedTime: addMinutes(base, 31).toISOString(),
        platform: "1",
        rawDirection: "Ittersbach via Karlsruhe Hbf"
      },
      {
        line: "S1",
        destination: "Bad Herrenalb",
        plannedTime: addMinutes(base, 46).toISOString(),
        platform: "1",
        rawDirection: "Bad Herrenalb via Karlsruhe Hbf"
      },
      {
        line: "S11",
        destination: "Karlsruhe Hbf",
        plannedTime: addMinutes(base, 58).toISOString(),
        platform: "1",
        rawDirection: "Karlsruhe Hbf"
      }
    ];

    return sortDepartures(drafts.map((draft) => normalizeDeparture(draft, boardConfig, now)));
  }
}

function floorToMinute(date: Date): Date {
  const copy = new Date(date);
  copy.setSeconds(0, 0);
  return copy;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

