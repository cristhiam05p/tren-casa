import type { DataSource, WeatherResponse, WeatherSummary } from "@home-departure-board/shared";
import { runtimeConfig } from "../config/env.js";

type WeatherCodeInfo = {
  description: string;
  icon: string;
};

export class WeatherService {
  readonly providerName = "OpenMeteoProvider";

  async getWeather(): Promise<WeatherResponse> {
    try {
      const weather = await this.fetchLiveWeather();
      return {
        weather,
        source: "live",
        provider: this.providerName,
        updatedAt: weather.updatedAt
      };
    } catch (error) {
      console.error(`[weather] ${this.providerName} failed`, error);
      const weather = this.createMockWeather();

      return {
        weather,
        source: "mock",
        provider: "MockWeatherProvider",
        updatedAt: weather.updatedAt,
        error: "Live weather data unavailable; using demo data."
      };
    }
  }

  private async fetchLiveWeather(): Promise<WeatherSummary> {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(runtimeConfig.weatherLatitude));
    url.searchParams.set("longitude", String(runtimeConfig.weatherLongitude));
    url.searchParams.set("current", "temperature_2m,weather_code,precipitation");
    url.searchParams.set("hourly", "precipitation_probability");
    url.searchParams.set("forecast_days", "1");
    url.searchParams.set("timezone", runtimeConfig.weatherTimeZone);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(6_000),
      headers: { accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with HTTP ${response.status}`);
    }

    const payload = await response.json() as Record<string, unknown>;
    const current = objectValue(payload.current);
    const hourly = objectValue(payload.hourly);
    const temperature = numberValue(current.temperature_2m);
    const weatherCode = numberValue(current.weather_code) ?? 0;
    const codeInfo = describeWeatherCode(weatherCode);

    if (temperature === undefined) {
      throw new Error("Open-Meteo response did not include current temperature.");
    }

    return {
      temperatureCelsius: Math.round(temperature),
      description: codeInfo.description,
      icon: codeInfo.icon,
      precipitationProbability: currentHourProbability(hourly),
      updatedAt: new Date().toISOString()
    };
  }

  private createMockWeather(): WeatherSummary {
    return {
      temperatureCelsius: 19,
      description: "Leicht bewölkt",
      icon: "cloud-sun",
      precipitationProbability: 20,
      updatedAt: new Date().toISOString()
    };
  }
}

function describeWeatherCode(code: number): WeatherCodeInfo {
  if (code === 0) {
    return { description: "Klar", icon: "sun" };
  }

  if ([1, 2].includes(code)) {
    return { description: "Leicht bewölkt", icon: "cloud-sun" };
  }

  if (code === 3) {
    return { description: "Bewölkt", icon: "cloud" };
  }

  if ([45, 48].includes(code)) {
    return { description: "Nebel", icon: "fog" };
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { description: "Regen", icon: "rain" };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { description: "Schnee", icon: "snow" };
  }

  if ([95, 96, 99].includes(code)) {
    return { description: "Gewitter", icon: "storm" };
  }

  return { description: "Wetter", icon: "cloud" };
}

function currentHourProbability(hourly: Record<string, unknown>): number | undefined {
  const times = arrayValue(hourly.time);
  const probabilities = arrayValue(hourly.precipitation_probability);

  if (times.length === 0 || probabilities.length === 0) {
    return undefined;
  }

  const currentHour = new Date();
  currentHour.setMinutes(0, 0, 0);
  const currentHourText = currentHour.toISOString().slice(0, 13);
  const index = times.findIndex((time) => String(time).startsWith(currentHourText));
  const probability = numberValue(probabilities[index >= 0 ? index : 0]);

  return probability === undefined ? undefined : Math.round(probability);
}

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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

