export const EDTECH_HUB_ZONES = ["home", "duel", "ccna", "exams", "courses", "progress"] as const;

export type EdtechHubZoneId = (typeof EDTECH_HUB_ZONES)[number];

export function parseEdtechHubZone(raw: string | null): EdtechHubZoneId {
  if (raw && EDTECH_HUB_ZONES.includes(raw as EdtechHubZoneId)) return raw as EdtechHubZoneId;
  return "home";
}

export function edtechHubZoneFromSearch(search: string): EdtechHubZoneId {
  const params = new URLSearchParams(search);
  if (params.get("duel")) return "duel";
  if (params.get("ccna") === "1") return "ccna";
  return parseEdtechHubZone(params.get("zone"));
}

export function readLiveDuelJoinCodeFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get("duel");
  if (!raw?.trim()) return null;
  return raw.trim().toUpperCase();
}

export function writeEdtechHubZoneToUrl(zone: EdtechHubZoneId): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (zone === "home") {
    params.delete("zone");
    params.delete("ccna");
    params.delete("duel");
  } else {
    params.set("zone", zone);
    if (zone === "ccna") params.set("ccna", "1");
    else params.delete("ccna");
    if (zone !== "duel") params.delete("duel");
  }
  const qs = params.toString();
  const next = qs
    ? `${window.location.pathname}?${qs}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", next);
}
