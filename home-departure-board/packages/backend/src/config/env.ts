import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createBoardConfig } from "@home-departure-board/shared";

const envFiles = [
  process.env.DOTENV_CONFIG_PATH,
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env")
].filter((candidate): candidate is string => Boolean(candidate));

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    break;
  }
}

export const boardConfig = createBoardConfig({
  originStopName: envString("ORIGIN_STOP_NAME", "Adolf-Ehrmann-Bad"),
  originStopId: envString("ORIGIN_STOP_ID", "7001114"),
  destinationStopName: envString("DESTINATION_STOP_NAME", "Karlsruhe Hbf"),
  destinationStopId: envString("DESTINATION_STOP_ID", "7000090"),
  preferredLines: envList("PREFERRED_LINES", ["S1", "S11"]),
  walkingMinutes: envNumber("WALKING_MINUTES", 8),
  bikeMinutes: envNumber("BIKE_MINUTES", 4),
  departurePollingIntervalMs: envNumber("DEPARTURE_POLLING_INTERVAL_MS", 30_000),
  weatherPollingIntervalMs: envNumber("WEATHER_POLLING_INTERVAL_MS", 600_000),
  mockFallbackEnabled: envBoolean("MOCK_FALLBACK_ENABLED", true),
  nightModeStartHour: envNumber("NIGHT_MODE_START_HOUR", 20),
  nightModeEndHour: envNumber("NIGHT_MODE_END_HOUR", 7),
  timeZone: envString("WEATHER_TIMEZONE", "Europe/Berlin")
});

export const runtimeConfig = {
  port: envNumber("PORT", 3000),
  nodeEnv: envString("NODE_ENV", "development"),
  kvvEfaBaseUrl: envString("KVV_EFA_BASE_URL", "https://projekte.kvv-efa.de/sl3/"),
  kvvEfaRequestTimeoutMs: envNumber("KVV_EFA_REQUEST_TIMEOUT_MS", 8_000),
  weatherLatitude: envNumber("WEATHER_LATITUDE", 49.0069),
  weatherLongitude: envNumber("WEATHER_LONGITUDE", 8.4037),
  weatherTimeZone: envString("WEATHER_TIMEZONE", "Europe/Berlin"),
  staticDir: process.env.STATIC_DIR
};

function envString(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function envBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (value === "true" || value === "1" || value === "yes") {
    return true;
  }

  if (value === "false" || value === "0" || value === "no") {
    return false;
  }

  return fallback;
}

function envList(name: string, fallback: string[]): string[] {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const entries = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return entries.length > 0 ? entries : fallback;
}

