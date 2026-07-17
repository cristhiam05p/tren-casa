import { DEFAULT_BOARD_CONFIG, type BoardConfig } from "./config.js";

export type DepartureFilterInput = {
  line?: string;
  destination?: string;
  rawDirection?: string;
  routeText?: string;
};

export function isRelevantDeparture(
  departure: DepartureFilterInput,
  config: Pick<BoardConfig, "preferredLines" | "filters"> = DEFAULT_BOARD_CONFIG
): boolean {
  const line = normalizeLine(departure.line);
  const preferredLine = config.preferredLines.map(normalizeLine).includes(line);
  const destinationText = normalizeText(departure.destination);
  const supportingText = normalizeText(
    [departure.rawDirection, departure.routeText].filter(Boolean).join(" ")
  );
  const primaryDirectionText = destinationText || supportingText;

  if (!primaryDirectionText) {
    return preferredLine;
  }

  if (containsAny(primaryDirectionText, config.filters.excludeDirectionTerms)) {
    return false;
  }

  const pointsTowardDestination = containsAny(primaryDirectionText, config.filters.includeDirectionTerms);

  return preferredLine ? pointsTowardDestination : pointsTowardDestination;
}

export function normalizeLine(line = ""): string {
  return line.trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizeText(value = ""): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(normalizeText(term)));
}
