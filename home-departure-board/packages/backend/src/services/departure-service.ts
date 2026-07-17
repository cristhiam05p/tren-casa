import type { DeparturesResponse } from "@home-departure-board/shared";
import { boardConfig } from "../config/env.js";
import type { DepartureProvider } from "../providers/departure-provider.js";

export class DepartureService {
  constructor(
    private readonly liveProvider: DepartureProvider,
    private readonly mockProvider: DepartureProvider
  ) {}

  async getDepartures(): Promise<DeparturesResponse> {
    try {
      const departures = await this.liveProvider.getDepartures();
      return {
        departures,
        source: "live",
        provider: this.liveProvider.name,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[departures] ${this.liveProvider.name} failed`, error);

      if (boardConfig.mockFallbackEnabled) {
        const departures = await this.mockProvider.getDepartures();
        return {
          departures,
          source: "mock",
          provider: this.mockProvider.name,
          updatedAt: new Date().toISOString(),
          error: "Live departure data unavailable; using demo data."
        };
      }

      return {
        departures: [],
        source: "unavailable",
        provider: this.liveProvider.name,
        error: "Departure data is currently unavailable."
      };
    }
  }
}

