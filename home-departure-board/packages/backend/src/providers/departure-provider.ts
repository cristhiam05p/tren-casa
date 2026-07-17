import type { Departure } from "@home-departure-board/shared";

export interface DepartureProvider {
  readonly name: string;
  getDepartures(now?: Date): Promise<Departure[]>;
}

