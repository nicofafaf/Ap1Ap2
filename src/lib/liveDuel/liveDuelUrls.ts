export function buildLiveDuelJoinUrl(code: string): string {
  if (typeof window === "undefined") return `?zone=duel&duel=${code}`;
  const params = new URLSearchParams(window.location.search);
  params.set("zone", "duel");
  params.set("duel", code);
  const qs = params.toString();
  return `${window.location.origin}${window.location.pathname}?${qs}`;
}

export function buildLiveDuelQrImageUrl(joinUrl: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(joinUrl)}`;
}

export function writeLiveDuelRoomToBrowserUrl(code: string): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  params.set("zone", "duel");
  params.set("duel", code);
  const qs = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}?${qs}${window.location.hash}`
  );
}
