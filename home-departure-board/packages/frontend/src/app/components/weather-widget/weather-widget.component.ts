import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import type { WeatherSummary } from "@home-departure-board/shared";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  LucideAngularModule,
  Sun,
  type LucideIconData
} from "lucide-angular";

@Component({
  selector: "app-weather-widget",
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: "./weather-widget.component.html",
  styleUrl: "./weather-widget.component.css"
})
export class WeatherWidgetComponent {
  @Input() weather: WeatherSummary | null = null;
  @Input() loading = false;

  get weatherIcon(): LucideIconData {
    switch (this.weather?.icon) {
      case "sun":
        return Sun;
      case "cloud-sun":
        return CloudSun;
      case "rain":
        return CloudRain;
      case "snow":
        return CloudSnow;
      case "fog":
        return CloudFog;
      case "storm":
        return CloudLightning;
      default:
        return Cloud;
    }
  }
}

