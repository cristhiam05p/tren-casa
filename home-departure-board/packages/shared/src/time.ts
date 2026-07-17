import { DEFAULT_BOARD_CONFIG, type BoardConfig } from "./config.js";
import type { Urgency } from "./models.js";

const MINUTE_MS = 60_000;

export function minutesUntil(dateTimeIso: string, now = new Date()): number {
  const departureTime = Date.parse(dateTimeIso);

  if (Number.isNaN(departureTime)) {
    return 0;
  }

  return Math.max(0, Math.ceil((departureTime - now.getTime()) / MINUTE_MS));
}

export function formatClockTime(
  dateTimeIso: string,
  timeZone = DEFAULT_BOARD_CONFIG.timeZone
): string {
  const date = new Date(dateTimeIso);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone
  }).format(date);
}

export function formatDepartureDisplay(
  dateTimeIso: string,
  now = new Date(),
  timeZone = DEFAULT_BOARD_CONFIG.timeZone
): string {
  const remainingMinutes = minutesUntil(dateTimeIso, now);

  if (remainingMinutes < 10) {
    return `in ${remainingMinutes} min`;
  }

  return formatClockTime(dateTimeIso, timeZone);
}

export function calculateDelayMinutes(plannedTimeIso: string, realtimeTimeIso?: string): number | undefined {
  if (!realtimeTimeIso) {
    return undefined;
  }

  const planned = Date.parse(plannedTimeIso);
  const realtime = Date.parse(realtimeTimeIso);

  if (Number.isNaN(planned) || Number.isNaN(realtime)) {
    return undefined;
  }

  const delay = Math.round((realtime - planned) / MINUTE_MS);
  return delay === 0 ? undefined : delay;
}

export function calculateUrgency(
  minutes: number,
  cancelled: boolean,
  config: Pick<BoardConfig, "walkingMinutes" | "bikeMinutes"> = DEFAULT_BOARD_CONFIG
): Urgency {
  if (cancelled) {
    return "cancelled";
  }

  if (minutes > config.walkingMinutes) {
    return "safe";
  }

  if (minutes >= config.bikeMinutes) {
    return "warning";
  }

  return "critical";
}

export function isNightMode(date = new Date(), config = DEFAULT_BOARD_CONFIG): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("de-DE", {
      hour: "numeric",
      hour12: false,
      timeZone: config.timeZone
    }).format(date)
  );

  if (config.nightModeStartHour === config.nightModeEndHour) {
    return false;
  }

  if (config.nightModeStartHour > config.nightModeEndHour) {
    return hour >= config.nightModeStartHour || hour < config.nightModeEndHour;
  }

  return hour >= config.nightModeStartHour && hour < config.nightModeEndHour;
}

export function getUrgencyColor(minutes: number, cancelled: boolean, config = DEFAULT_BOARD_CONFIG): string {
  if (cancelled) {
    return config.colors.cancelled;
  }

  if (minutes > config.walkingMinutes) {
    return config.colors.safe;
  }

  if (minutes >= config.bikeMinutes) {
    const ratio = (config.walkingMinutes - minutes) / (config.walkingMinutes - config.bikeMinutes);
    return interpolateHexColor(config.colors.safe, config.colors.warning, ratio);
  }

  const ratio = Math.max(0, Math.min(1, (config.bikeMinutes - minutes) / config.bikeMinutes));
  return interpolateHexColor(config.colors.warning, config.colors.critical, ratio);
}

function interpolateHexColor(from: string, to: string, ratio: number): string {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const clamped = Math.max(0, Math.min(1, ratio));
  const mixed = start.map((channel, index) => Math.round(channel + (end[index] - channel) * clamped));

  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;

  const parsed = Number.parseInt(value, 16);
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
}
