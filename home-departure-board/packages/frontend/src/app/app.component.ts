import { Component } from "@angular/core";
import { DepartureBoardComponent } from "./components/departure-board/departure-board.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [DepartureBoardComponent],
  template: "<app-departure-board />"
})
export class AppComponent {}

