import type { OverlayOpenState } from "../../store/useGameStore";

/** Nach Wechsel Hub → Sektor-Karte: globale Overlays und lokale SectorMap-Panels */
export type NexusHubMapExtras = {
  overlay?: Exclude<OverlayOpenState, "NONE">;
  openDossier?: boolean;
  openHallRecords?: boolean;
  openCodex?: boolean;
  openDailyPanel?: boolean;
};
