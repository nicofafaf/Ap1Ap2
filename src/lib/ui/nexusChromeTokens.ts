/** Oberflächen-Modus: helle EdTech-Shell (it-lernapp-Ähnlichkeit) vs industrieller Nexus */
export type NexusChromeMode = "edtech" | "industrial";

export const NEXUS_CHROME_STORAGE_KEY = "nexus.chrome.v1";

export function readStoredNexusChrome(): NexusChromeMode {
  try {
    const v = localStorage.getItem(NEXUS_CHROME_STORAGE_KEY);
    if (v === "industrial" || v === "edtech") return v;
  } catch {
    // ignore
  }
  return "edtech";
}

export function persistNexusChrome(mode: NexusChromeMode) {
  try {
    localStorage.setItem(NEXUS_CHROME_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export type CitadelChromeTokens = {
  text: string;
  textMuted: string;
  textSoft: string;
  card: string;
  cardBorder: string;
  cardShadow: string;
  primary: string;
  primaryFg: string;
  outlineBg: string;
  outlineBorder: string;
  outlineFg: string;
  storyBar: string;
  statNumber: string;
  accentLine: string;
  purpleSoft: string;
};

const EDTECH: CitadelChromeTokens = {
  text: "#0f172a",
  textMuted: "#475569",
  textSoft: "#64748b",
  card: "#ffffff",
  cardBorder: "#e2e8f0",
  cardShadow: "0 22px 48px rgba(15, 23, 42, 0.08)",
  primary: "#2563eb",
  primaryFg: "#ffffff",
  outlineBg: "#ffffff",
  outlineBorder: "rgba(37, 99, 235, 0.45)",
  outlineFg: "#1d4ed8",
  storyBar: "linear-gradient(90deg, #7c3aed 0%, #6366f1 55%, #2563eb 100%)",
  statNumber: "linear-gradient(120deg, #2563eb 0%, #7c3aed 55%, #0f172a 100%)",
  accentLine: "linear-gradient(90deg, #2563eb, #7c3aed, #94a3b8)",
  purpleSoft: "#ede9fe",
};

const INDUSTRIAL: CitadelChromeTokens = {
  text: "rgba(251,247,239,0.96)",
  textMuted: "rgba(251,247,239,0.72)",
  textSoft: "rgba(251,247,239,0.52)",
  card: "linear-gradient(180deg, rgba(14,16,18,0.96) 0%, rgba(8,9,10,0.98) 100%)",
  cardBorder: "rgba(251,247,239,0.12)",
  cardShadow: "0 32px 90px rgba(0,0,0,0.5), inset 0 1px 0 rgba(251,247,239,0.06)",
  primary: "linear-gradient(130deg, rgba(34,211,238,0.35) 0%, rgba(12,18,20,0.95) 100%)",
  primaryFg: "rgba(251,247,239,0.98)",
  outlineBg: "rgba(0,0,0,0.28)",
  outlineBorder: "rgba(251,247,239,0.22)",
  outlineFg: "rgba(251,247,239,0.92)",
  storyBar: "linear-gradient(90deg, rgba(124,58,237,0.55) 0%, rgba(34,211,238,0.35) 100%)",
  statNumber: "linear-gradient(120deg, #22d3ee 0%, #fbf7ef 42%, #d6b56f 100%)",
  accentLine: "linear-gradient(90deg, rgba(34,211,238,0.95), rgba(214,181,111,0.95), rgba(251,247,239,0.65))",
  purpleSoft: "rgba(124,58,237,0.2)",
};

export function citadelChromeTokens(mode: NexusChromeMode): CitadelChromeTokens {
  return mode === "edtech" ? EDTECH : INDUSTRIAL;
}
