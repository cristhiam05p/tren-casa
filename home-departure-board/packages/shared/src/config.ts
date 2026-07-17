export type BoardConfig = {
  originStopName: string;
  originStopId: string;
  destinationStopName: string;
  destinationStopId: string;
  preferredLines: string[];
  walkingMinutes: number;
  bikeMinutes: number;
  departurePollingIntervalMs: number;
  weatherPollingIntervalMs: number;
  mockFallbackEnabled: boolean;
  nightModeStartHour: number;
  nightModeEndHour: number;
  timeZone: string;
  filters: {
    includeDirectionTerms: string[];
    excludeDirectionTerms: string[];
  };
  colors: {
    safe: string;
    warning: string;
    critical: string;
    cancelled: string;
  };
};

export const DEFAULT_BOARD_CONFIG: BoardConfig = {
  originStopName: "Adolf-Ehrmann-Bad",
  originStopId: "7001114",
  destinationStopName: "Karlsruhe Hbf",
  destinationStopId: "7000090",
  preferredLines: ["S1", "S11"],
  walkingMinutes: 8,
  bikeMinutes: 4,
  departurePollingIntervalMs: 30_000,
  weatherPollingIntervalMs: 600_000,
  mockFallbackEnabled: true,
  nightModeStartHour: 20,
  nightModeEndHour: 7,
  timeZone: "Europe/Berlin",
  filters: {
    includeDirectionTerms: [
      "karlsruhe",
      "hauptbahnhof",
      "hbf",
      "bad herrenalb",
      "ittersbach",
      "ettlingen",
      "albgaubad"
    ],
    excludeDirectionTerms: ["hochstetten"]
  },
  colors: {
    safe: "#2f855a",
    warning: "#d97706",
    critical: "#b42318",
    cancelled: "#7a8491"
  }
};

export function createBoardConfig(overrides: Partial<BoardConfig> = {}): BoardConfig {
  return {
    ...DEFAULT_BOARD_CONFIG,
    ...overrides,
    preferredLines: overrides.preferredLines ?? DEFAULT_BOARD_CONFIG.preferredLines,
    filters: {
      ...DEFAULT_BOARD_CONFIG.filters,
      ...overrides.filters
    },
    colors: {
      ...DEFAULT_BOARD_CONFIG.colors,
      ...overrides.colors
    }
  };
}
