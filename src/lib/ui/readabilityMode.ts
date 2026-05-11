export const READABILITY_MODE_STORAGE_KEY = "nexus.readabilityMode.v1";

export function loadReadabilityMode(): boolean {
  try {
    return localStorage.getItem(READABILITY_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function persistReadabilityMode(enabled: boolean): void {
  try {
    localStorage.setItem(READABILITY_MODE_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // no-op
  }
}

/**
 * CSS-Hooks: Partikel/Backdrop lesen --nx-readability-particles (0 = aus)
 * und data-nx-readability auf documentElement
 */
export function applyReadabilityToDocument(enabled: boolean): void {
  const root = document.documentElement;
  root.style.setProperty("--nx-readability-particles", enabled ? "0" : "1");
  root.dataset.nxReadability = enabled ? "on" : "off";
}
