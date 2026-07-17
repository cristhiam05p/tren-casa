import {
  isRelevantDeparture,
  type BoardConfig,
  type Departure
} from "@home-departure-board/shared";
import { runtimeConfig } from "../config/env.js";
import { normalizeDeparture, sortDepartures, type DepartureDraft } from "../services/departure-normalizer.js";
import type { DepartureProvider } from "./departure-provider.js";

type JsonObject = Record<string, unknown>;

export class KvvEfaDepartureProvider implements DepartureProvider {
  readonly name = "KvvEfaDepartureProvider";

  constructor(
    private readonly config: BoardConfig,
    private readonly baseUrl = runtimeConfig.kvvEfaBaseUrl,
    private readonly timeoutMs = runtimeConfig.kvvEfaRequestTimeoutMs
  ) {}

  async getDepartures(now = new Date()): Promise<Departure[]> {
    const url = this.createDepartureMonitorUrl(now);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(this.timeoutMs),
      headers: {
        accept: "application/json,text/json,*/*"
      }
    });

    if (!response.ok) {
      throw new Error(`KVV/EFA request failed with HTTP ${response.status}`);
    }

    const body = await response.text();
    const payload = parseJson(body);
    const items = collectDepartureItems(payload);

    const departures = items
      .map((item) => this.toDepartureDraft(item, now))
      .filter((draft): draft is DepartureDraft => Boolean(draft))
      .map((draft) => normalizeDeparture(draft, this.config, now))
      .filter((departure) => Date.parse(departure.realtimeTime ?? departure.plannedTime) >= now.getTime() - 60_000);

    return sortDepartures(departures).slice(0, 12);
  }

  private createDepartureMonitorUrl(now: Date): URL {
    const endpoint = this.baseUrl.includes("XSLT_DM_REQUEST")
      ? new URL(this.baseUrl)
      : new URL("XSLT_DM_REQUEST", this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`);

    endpoint.searchParams.set("outputFormat", "JSON");
    endpoint.searchParams.set("language", "de");
    endpoint.searchParams.set("type_dm", "stop");
    endpoint.searchParams.set("name_dm", this.config.originStopId || this.config.originStopName);
    endpoint.searchParams.set("itdDate", formatEfaDate(now, this.config.timeZone));
    endpoint.searchParams.set("itdTime", formatEfaTime(now, this.config.timeZone));
    endpoint.searchParams.set("useRealtime", "1");
    endpoint.searchParams.set("mode", "direct");
    endpoint.searchParams.set("limit", "30");
    endpoint.searchParams.set("deleteAssignedStops_dm", "1");

    return endpoint;
  }

  private toDepartureDraft(item: unknown, now: Date): DepartureDraft | undefined {
    if (!isObject(item)) {
      return undefined;
    }

    const line = firstText([
      getValue(item, ["servingLine", "number"]),
      getValue(item, ["servingLine", "symbol"]),
      getValue(item, ["itdServingLine", "number"]),
      getValue(item, ["line"]),
      getValue(item, ["lineName"]),
      getValue(item, ["product"])
    ]);
    const destination = firstText([
      getValue(item, ["servingLine", "direction"]),
      getValue(item, ["itdServingLine", "direction"]),
      getValue(item, ["direction"]),
      getValue(item, ["directionText"]),
      getValue(item, ["destination"]),
      getValue(item, ["name"])
    ]);
    const rawDirection = [
      destination,
      firstText([
        getValue(item, ["servingLine", "directionFrom"]),
        getValue(item, ["servingLine", "routeDescription"]),
        getValue(item, ["routeDescription"]),
        getValue(item, ["routeDescText"]),
        getValue(item, ["itdServingLine", "destination"])
      ])
    ]
      .filter(Boolean)
      .join(" ");
    const plannedTime =
      parseEfaDateTime(getValue(item, ["dateTime"])) ??
      parseEfaDateTime(getValue(item, ["itdDateTime"])) ??
      parseEfaDateTime(item) ??
      parseCountdown(getValue(item, ["countdown"]), now);
    const realtimeTime =
      parseEfaDateTime(getValue(item, ["realDateTime"])) ??
      parseEfaDateTime(getValue(item, ["rtDateTime"])) ??
      parseEfaDateTime(getValue(item, ["realtimeDateTime"]));

    if (!line || !destination || !plannedTime) {
      return undefined;
    }

    if (!isRelevantDeparture({ line, destination, rawDirection }, this.config)) {
      return undefined;
    }

    return {
      line,
      destination,
      plannedTime,
      realtimeTime,
      platform: normalizePlatform(
        firstText([
          getValue(item, ["platformName"]),
          getValue(item, ["platform"]),
          getValue(item, ["platformText"]),
          getValue(item, ["stop", "platformName"])
        ])
      ),
      cancelled: isCancelled(item),
      rawDirection
    };
  }
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`KVV/EFA did not return valid JSON: ${(error as Error).message}`);
  }
}

function collectDepartureItems(payload: unknown): JsonObject[] {
  const found: JsonObject[] = [];

  function visit(value: unknown, depth: number): void {
    if (depth > 10) {
      return;
    }

    if (Array.isArray(value)) {
      const departureLike = value.filter(isDepartureLike);

      if (departureLike.length > 0) {
        found.push(...departureLike);
        return;
      }

      for (const item of value) {
        visit(item, depth + 1);
      }

      return;
    }

    if (!isObject(value)) {
      return;
    }

    if (isDepartureLike(value)) {
      found.push(value);
      return;
    }

    for (const child of Object.values(value)) {
      visit(child, depth + 1);
    }
  }

  visit(payload, 0);
  return found;
}

function isDepartureLike(value: unknown): value is JsonObject {
  if (!isObject(value)) {
    return false;
  }

  return (
    "servingLine" in value ||
    "itdServingLine" in value ||
    "line" in value ||
    "lineName" in value ||
    (("dateTime" in value || "realDateTime" in value) &&
      ("stopID" in value || "platform" in value || "countdown" in value))
  );
}

function parseEfaDateTime(value: unknown): string | undefined {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
  }

  if (!isObject(value)) {
    return undefined;
  }

  const year = numberValue(value.year ?? value.y);
  const month = numberValue(value.month ?? value.mon ?? value.m);
  const day = numberValue(value.day ?? value.d);
  const hour = numberValue(value.hour ?? value.h);
  const minute = numberValue(value.minute ?? value.min);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    return undefined;
  }

  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

function parseCountdown(value: unknown, now: Date): string | undefined {
  const minutes = numberValue(value);

  if (minutes === undefined) {
    return undefined;
  }

  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

function isCancelled(value: JsonObject): boolean {
  const candidates = [
    value.cancelled,
    value.isCancelled,
    value.isCanceled,
    value.cancelledText,
    getValue(value, ["servingLine", "cancelled"]),
    getValue(value, ["servingLine", "isCancelled"])
  ];

  return candidates.some((candidate) => {
    if (typeof candidate === "boolean") {
      return candidate;
    }

    if (typeof candidate === "number") {
      return candidate === 1;
    }

    if (typeof candidate === "string") {
      return ["1", "true", "yes", "cancelled", "canceled", "ausfall"].includes(candidate.trim().toLowerCase());
    }

    return false;
  });
}

function getValue(source: JsonObject, path: string[]): unknown {
  return path.reduce<unknown>((current, key) => {
    if (!isObject(current)) {
      return undefined;
    }

    return current[key];
  }, source);
}

function firstText(values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function normalizePlatform(value: string | undefined): string | undefined {
  return value?.replace(/^gleis\s+/i, "").trim();
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatEfaDate(date: Date, timeZone: string): string {
  const parts = formatParts(date, timeZone);
  return `${parts.year}${parts.month}${parts.day}`;
}

function formatEfaTime(date: Date, timeZone: string): string {
  const parts = formatParts(date, timeZone);
  return `${parts.hour}${parts.minute}`;
}

function formatParts(date: Date, timeZone: string): Record<"year" | "month" | "day" | "hour" | "minute", string> {
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const entries = formatter
    .formatToParts(date)
    .filter((part) => ["year", "month", "day", "hour", "minute"].includes(part.type))
    .map((part) => [part.type, part.value]);

  return Object.fromEntries(entries) as Record<"year" | "month" | "day" | "hour" | "minute", string>;
}
