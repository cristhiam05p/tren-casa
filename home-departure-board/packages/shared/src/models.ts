export type Urgency = "safe" | "warning" | "critical" | "cancelled";

export type Departure = {
  id: string;
  line: string;
  destination: string;
  plannedTime: string;
  realtimeTime?: string;
  delayMinutes?: number;
  platform?: string;
  cancelled: boolean;
  minutesUntilDeparture: number;
  displayTime: string;
  urgency: Urgency;
  rawDirection?: string;
};

export type WeatherSummary = {
  temperatureCelsius: number;
  description: string;
  icon: string;
  precipitationProbability?: number;
  updatedAt: string;
};

export type DataSource = "live" | "mock" | "unavailable";

export type DeparturesResponse = {
  departures: Departure[];
  source: DataSource;
  provider: string;
  updatedAt?: string;
  error?: string;
};

export type WeatherResponse = {
  weather: WeatherSummary | null;
  source: DataSource;
  provider: string;
  updatedAt?: string;
  error?: string;
};

export type HealthResponse = {
  status: "ok";
  liveTransportProvider: string;
  mockFallbackEnabled: boolean;
  weatherProvider: string;
  config: {
    originStopName: string;
    originStopId: string;
    destinationStopName: string;
    destinationStopId: string;
    preferredLines: string[];
    walkingMinutes: number;
    bikeMinutes: number;
    departurePollingIntervalMs: number;
    weatherPollingIntervalMs: number;
    nightModeStartHour: number;
    nightModeEndHour: number;
  };
};

