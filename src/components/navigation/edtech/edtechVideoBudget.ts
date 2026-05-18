/** Maximal gleichzeitig laufende EdTech-Videos (Lernseite = flüssig, kein Decoder-Stau). */
const MAX_SLOTS = 1;
const active = new Set<string>();

export function acquireEdtechVideoSlot(id: string): boolean {
  if (active.has(id)) return true;
  if (active.size >= MAX_SLOTS) return false;
  active.add(id);
  return true;
}

export function releaseEdtechVideoSlot(id: string): void {
  active.delete(id);
}
