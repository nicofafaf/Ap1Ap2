/**
 * Leichtgewichtiges i18n — JSON-Kataloge, Punkt-Pfade, optional Fallback
 */

export type NexusLocale = "de" | "en";

export const NEXUS_LOCALE_STORAGE_KEY = "nexus.locale.v1";

export const NEXUS_LOCALES: NexusLocale[] = ["de", "en"];

export function isNexusLocale(v: string): v is NexusLocale {
  return v === "de" || v === "en";
}

export function readStoredLocale(): NexusLocale {
  try {
    const raw = localStorage.getItem(NEXUS_LOCALE_STORAGE_KEY);
    if (raw && isNexusLocale(raw)) return raw;
  } catch {
    // no-op
  }
  return "de";
}

export function persistLocale(locale: NexusLocale): void {
  try {
    localStorage.setItem(NEXUS_LOCALE_STORAGE_KEY, locale);
  } catch {
    // no-op
  }
}

/** Liest verschachtelte Keys inkl. Array-Indizes: dossier.pillars.0.title */
export function resolveMessagePath(root: unknown, path: string): string | undefined {
  let cur: unknown = root;
  for (const part of path.split(".")) {
    if (cur == null) return undefined;
    if (Array.isArray(cur) && /^\d+$/.test(part)) {
      cur = cur[Number(part)];
      continue;
    }
    if (typeof cur === "object" && part in (cur as object)) {
      cur = (cur as Record<string, unknown>)[part];
      continue;
    }
    return undefined;
  }
  return typeof cur === "string" ? cur : undefined;
}

export type NestedMessages = Record<string, unknown>;

export function createTranslator(messages: NestedMessages) {
  return function t(key: string, fallback?: string): string {
    const v = resolveMessagePath(messages, key);
    if (typeof v === "string" && v.length > 0) return v;
    if (fallback !== undefined) return fallback;
    return key;
  };
}
