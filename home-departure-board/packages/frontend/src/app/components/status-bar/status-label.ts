import type { DataSource } from "@home-departure-board/shared";

export function getSourceLabel(source: DataSource, loading: boolean): string {
  if (loading) {
    return "Daten werden geladen";
  }

  return source === "live" ? "Live data" : source === "mock" ? "Demo data" : "Offline";
}
