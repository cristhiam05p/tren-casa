import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import type { DataSource } from "@home-departure-board/shared";
import { interval, map, startWith } from "rxjs";

type ClockView = {
  iso: string;
  dateLabel: string;
  timeLabel: string;
};

@Component({
  selector: "app-status-bar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./status-bar.component.html",
  styleUrl: "./status-bar.component.css"
})
export class StatusBarComponent {
  @Input({ required: true }) source!: DataSource;
  @Input() updatedAt?: string;
  @Input() stale = false;

  readonly currentClock$ = interval(1000).pipe(
    startWith(0),
    map((): ClockView => {
      const now = new Date();

      return {
        iso: now.toISOString(),
        dateLabel: new Intl.DateTimeFormat("de-DE", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }).format(now),
        timeLabel: new Intl.DateTimeFormat("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }).format(now)
      };
    })
  );

  get sourceLabel(): string {
    return this.source === "live" ? "Live data" : this.source === "mock" ? "Demo data" : "Offline";
  }
}
