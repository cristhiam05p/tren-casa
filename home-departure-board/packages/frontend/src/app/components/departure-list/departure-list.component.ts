import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import {
  getUrgencyColor,
  type BoardConfig,
  type Departure
} from "@home-departure-board/shared";

@Component({
  selector: "app-departure-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./departure-list.component.html",
  styleUrl: "./departure-list.component.css"
})
export class DepartureListComponent {
  @Input({ required: true }) departures: Departure[] = [];
  @Input({ required: true }) config!: BoardConfig;

  colorFor(departure: Departure): string {
    return getUrgencyColor(departure.minutesUntilDeparture, departure.cancelled, this.config);
  }

  platformLabel(departure: Departure): string | undefined {
    return formatPlatform(departure.platform);
  }
}

function formatPlatform(platform: string | undefined): string | undefined {
  if (!platform) {
    return undefined;
  }

  return platform.match(/^gleis\s+/i) ? platform : `Gleis ${platform}`;
}
