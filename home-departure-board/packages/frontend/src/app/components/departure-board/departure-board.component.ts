import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { combineLatest, interval, map, shareReplay, startWith } from "rxjs";
import { isNightMode, type Departure } from "@home-departure-board/shared";
import { BOARD_CONFIG } from "../../board-settings";
import { DepartureApiService } from "../../services/departure-api.service";
import { ClockDisplayComponent } from "../clock-display/clock-display.component";
import { DepartureListComponent } from "../departure-list/departure-list.component";
import { MobilityReferenceComponent } from "../mobility-reference/mobility-reference.component";
import { NextDepartureHeroComponent } from "../next-departure-hero/next-departure-hero.component";
import { StatusBarComponent } from "../status-bar/status-bar.component";
import { WeatherWidgetComponent } from "../weather-widget/weather-widget.component";

@Component({
  selector: "app-departure-board",
  standalone: true,
  imports: [
    CommonModule,
    ClockDisplayComponent,
    DepartureListComponent,
    MobilityReferenceComponent,
    NextDepartureHeroComponent,
    StatusBarComponent,
    WeatherWidgetComponent
  ],
  templateUrl: "./departure-board.component.html",
  styleUrl: "./departure-board.component.css"
})
export class DepartureBoardComponent {
  readonly config = BOARD_CONFIG;

  readonly viewModel$ = combineLatest([
    this.api.departures$,
    this.api.weather$,
    interval(60_000).pipe(startWith(0), map(() => isNightMode(new Date(), this.config)))
  ]).pipe(
    map(([departuresState, weatherState, nightMode]) => {
      const nextDeparture = pickNextDeparture(departuresState.departures);

      return {
        departuresState,
        weatherState,
        nightMode,
        nextDeparture,
        followingDepartures: departuresState.departures
          .filter((departure) => departure.id !== nextDeparture?.id)
          .slice(0, 6)
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private readonly api: DepartureApiService) {}

  noServiceMessage(source: string): string {
    return source === "unavailable"
      ? "Abfahrtsdaten aktuell nicht verfügbar."
      : "Aktuell fahren keine Bahnen Richtung Karlsruhe Hbf.";
  }
}

function pickNextDeparture(departures: Departure[]): Departure | undefined {
  return departures.find((departure) => !departure.cancelled) ?? departures[0];
}

