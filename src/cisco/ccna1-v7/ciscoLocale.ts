import type { CiscoLocaleText } from "../types";

/** Anzeige-Sprache für CCNA-Items (Fragen bleiben 1:1 EN wenn keine DE-Übersetzung hinterlegt). */
export function pickCiscoLocaleText(
  block: CiscoLocaleText,
  locale: "de" | "en"
): string {
  if (locale === "de" && block.de?.trim()) return block.de.trim();
  return block.en.trim();
}
