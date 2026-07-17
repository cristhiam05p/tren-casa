import { Router } from "express";
import type { HealthResponse } from "@home-departure-board/shared";
import { boardConfig } from "../config/env.js";
import type { DepartureService } from "../services/departure-service.js";
import type { WeatherService } from "../services/weather-service.js";

export function createApiRouter(departureService: DepartureService, weatherService: WeatherService): Router {
  const router = Router();

  router.get("/departures", async (_request, response, next) => {
    try {
      response.json(await departureService.getDepartures());
    } catch (error) {
      next(error);
    }
  });

  router.get("/weather", async (_request, response, next) => {
    try {
      response.json(await weatherService.getWeather());
    } catch (error) {
      next(error);
    }
  });

  router.get("/health", (_request, response) => {
    const health: HealthResponse = {
      status: "ok",
      liveTransportProvider: "KvvEfaDepartureProvider",
      mockFallbackEnabled: boardConfig.mockFallbackEnabled,
      weatherProvider: weatherService.providerName,
      config: {
        originStopName: boardConfig.originStopName,
        originStopId: boardConfig.originStopId,
        destinationStopName: boardConfig.destinationStopName,
        destinationStopId: boardConfig.destinationStopId,
        preferredLines: boardConfig.preferredLines,
        walkingMinutes: boardConfig.walkingMinutes,
        bikeMinutes: boardConfig.bikeMinutes,
        departurePollingIntervalMs: boardConfig.departurePollingIntervalMs,
        weatherPollingIntervalMs: boardConfig.weatherPollingIntervalMs,
        nightModeStartHour: boardConfig.nightModeStartHour,
        nightModeEndHour: boardConfig.nightModeEndHour
      }
    };

    response.json(health);
  });

  return router;
}

