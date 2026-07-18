import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { interval, map, startWith } from "rxjs";

type ClockView = {
  iso: string;
  dateLabel: string;
  timeLabel: string;
};

@Component({
  selector: "app-clock-display",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./clock-display.component.html",
  styleUrl: "./clock-display.component.css"
})
export class ClockDisplayComponent {
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
}
