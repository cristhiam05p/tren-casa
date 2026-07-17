import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import {
  getUrgencyColor,
  type BoardConfig,
  type Departure
} from "@home-departure-board/shared";

@Component({
  selector: "app-next-departure-hero",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./next-departure-hero.component.html",
  styleUrl: "./next-departure-hero.component.css"
})
export class NextDepartureHeroComponent {
  @Input({ required: true }) departure!: Departure;
  @Input({ required: true }) config!: BoardConfig;

  get heroColor(): string {
    return getUrgencyColor(
      this.departure.minutesUntilDeparture,
      this.departure.cancelled,
      this.config
    );
  }

  get platformLabel(): string | undefined {
    return formatPlatform(this.departure.platform);
  }

  get heroDisplayTime(): string {
    return `in ${Math.max(0, this.departure.minutesUntilDeparture)} min`;
  }
}

function formatPlatform(platform: string | undefined): string | undefined {
  if (!platform) {
    return undefined;
  }

  return platform.match(/^gleis\s+/i) ? platform : `Gleis ${platform}`;
}
