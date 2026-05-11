const canVibrate = (): boolean =>
  typeof navigator !== "undefined" &&
  typeof navigator.vibrate === "function";

/** Kurzer harter Treffer */
export function playImpactVibration(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(50);
  } catch {
    /* no-op */
  }
}

/** Doppelimpuls für Perfect Parry */
export function playParryVibration(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate([30, 10, 30]);
  } catch {
    /* no-op */
  }
}

/** Sanfter Puls — Singularity / Boss-Herzschlag */
export function playSingularityHeartbeatVibration(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(100);
  } catch {
    /* no-op */
  }
}
