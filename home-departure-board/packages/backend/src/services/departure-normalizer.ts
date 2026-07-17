import {
  calculateDelayMinutes,
  calculateUrgency,
  formatDepartureDisplay,
  minutesUntil,
  type BoardConfig,
  type Departure
} from "@home-departure-board/shared";

export type DepartureDraft = {
  id?: string;
  line: string;
  destination: string;
  plannedTime: string;
  realtimeTime?: string;
  platform?: string;
  cancelled?: boolean;
  rawDirection?: string;
};

export function normalizeDeparture(
  draft: DepartureDraft,
  config: BoardConfig,
  now = new Date()
): Departure {
  const effectiveTime = draft.realtimeTime ?? draft.plannedTime;
  const remainingMinutes = minutesUntil(effectiveTime, now);
  const cancelled = Boolean(draft.cancelled);

  return {
    id: draft.id ?? createDepartureId(draft),
    line: draft.line,
    destination: draft.destination,
    plannedTime: draft.plannedTime,
    realtimeTime: draft.realtimeTime,
    delayMinutes: calculateDelayMinutes(draft.plannedTime, draft.realtimeTime),
    platform: draft.platform,
    cancelled,
    minutesUntilDeparture: remainingMinutes,
    displayTime: formatDepartureDisplay(effectiveTime, now, config.timeZone),
    urgency: calculateUrgency(remainingMinutes, cancelled, config),
    rawDirection: draft.rawDirection
  };
}

export function sortDepartures(departures: Departure[]): Departure[] {
  return [...departures].sort((left, right) => {
    const leftTime = Date.parse(left.realtimeTime ?? left.plannedTime);
    const rightTime = Date.parse(right.realtimeTime ?? right.plannedTime);
    return leftTime - rightTime;
  });
}

function createDepartureId(draft: DepartureDraft): string {
  return [
    draft.line,
    draft.destination,
    draft.realtimeTime ?? draft.plannedTime,
    draft.platform ?? "no-platform"
  ]
    .join("-")
    .replace(/[^a-z0-9-]+/gi, "-")
    .toLowerCase();
}

