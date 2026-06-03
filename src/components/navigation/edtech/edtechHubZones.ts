export const EDTECH_HUB_ZONES = ["home", "ccna", "exams", "courses", "progress"] as const;

export type EdtechHubZoneId = (typeof EDTECH_HUB_ZONES)[number];

export function parseEdtechHubZone(raw: string | null): EdtechHubZoneId {
  if (raw && EDTECH_HUB_ZONES.includes(raw as EdtechHubZoneId)) return raw as EdtechHubZoneId;
  return "home";
}

export function edtechHubZoneFromSearch(search: string): EdtechHubZoneId {
  const params = new URLSearchParams(search);
  if (params.get("ccna") === "1") return "ccna";
  return parseEdtechHubZone(params.get("zone"));
}

export function writeEdtechHubZoneToUrl(zone: EdtechHubZoneId): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (zone === "home") {
    params.delete("zone");
    params.delete("ccna");
  } else {
    params.set("zone", zone);
    if (zone === "ccna") params.set("ccna", "1");
    else params.delete("ccna");
  }
  const qs = params.toString();
  const next = qs
    ? `${window.location.pathname}?${qs}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", next);
}
