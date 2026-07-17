import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  type DataSource,
  type Departure,
  type DeparturesResponse,
  type WeatherResponse,
  type WeatherSummary
} from "@home-departure-board/shared";
import { catchError, map, of, scan, shareReplay, startWith, switchMap, timer } from "rxjs";
import { API_BASE_URL, BOARD_CONFIG, STALE_AFTER_MS } from "../board-settings";

export type DepartureLoadState = {
  departures: Departure[];
  source: DataSource;
  provider?: string;
  updatedAt?: string;
  loading: boolean;
  stale: boolean;
  error?: string;
};

export type WeatherLoadState = {
  weather: WeatherSummary | null;
  source: DataSource;
  provider?: string;
  updatedAt?: string;
  loading: boolean;
  error?: string;
};

type DeparturePollEvent =
  | { type: "success"; response: DeparturesResponse }
  | { type: "error"; error: unknown };

@Injectable({ providedIn: "root" })
export class DepartureApiService {
  readonly departures$ = timer(0, BOARD_CONFIG.departurePollingIntervalMs).pipe(
    switchMap(() =>
      this.http.get<DeparturesResponse>(`${API_BASE_URL}/departures`).pipe(
        map((response): DeparturePollEvent => ({ type: "success", response })),
        catchError((error) => of({ type: "error", error } satisfies DeparturePollEvent))
      )
    ),
    scan(
      (state, event): DepartureLoadState => {
        if (event.type === "success" && event.response.source !== "unavailable") {
          return {
            departures: event.response.departures ?? [],
            source: event.response.source,
            provider: event.response.provider,
            updatedAt: event.response.updatedAt,
            loading: false,
            stale: isStale(event.response.updatedAt),
            error: event.response.error
          };
        }

        if (event.type === "success") {
          return keepLastUsefulDepartureState(state, event.response.error);
        }

        return keepLastUsefulDepartureState(state, "Abfahrtsdaten aktuell nicht verfügbar.");
      },
      initialDepartureState
    ),
    startWith(initialDepartureState),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly weather$ = timer(0, BOARD_CONFIG.weatherPollingIntervalMs).pipe(
    switchMap(() =>
      this.http.get<WeatherResponse>(`${API_BASE_URL}/weather`).pipe(
        map(
          (response): WeatherLoadState => ({
            weather: response.weather,
            source: response.source,
            provider: response.provider,
            updatedAt: response.updatedAt,
            loading: false,
            error: response.error
          })
        ),
        catchError(() =>
          of({
            weather: null,
            source: "unavailable",
            loading: false,
            error: "Wetter aktuell nicht verfügbar."
          } satisfies WeatherLoadState)
        )
      )
    ),
    startWith(initialWeatherState),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private readonly http: HttpClient) {}
}

const initialDepartureState: DepartureLoadState = {
  departures: [],
  source: "unavailable",
  loading: true,
  stale: false
};

const initialWeatherState: WeatherLoadState = {
  weather: null,
  source: "unavailable",
  loading: true
};

function keepLastUsefulDepartureState(state: DepartureLoadState, error?: string): DepartureLoadState {
  if (state.updatedAt) {
    return {
      ...state,
      loading: false,
      stale: isStale(state.updatedAt),
      error
    };
  }

  return {
    departures: [],
    source: "unavailable",
    loading: false,
    stale: false,
    error
  };
}

function isStale(updatedAt?: string): boolean {
  if (!updatedAt) {
    return false;
  }

  return Date.now() - Date.parse(updatedAt) > STALE_AFTER_MS;
}
