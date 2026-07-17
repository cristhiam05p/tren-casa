import { Component, Input } from "@angular/core";
import { Bike, Footprints, LucideAngularModule } from "lucide-angular";

@Component({
  selector: "app-mobility-reference",
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: "./mobility-reference.component.html",
  styleUrl: "./mobility-reference.component.css"
})
export class MobilityReferenceComponent {
  @Input({ required: true }) walkingMinutes!: number;
  @Input({ required: true }) bikeMinutes!: number;

  readonly walkingIcon = Footprints;
  readonly bikeIcon = Bike;
}
