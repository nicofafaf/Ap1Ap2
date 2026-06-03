import { useReducedMotion } from "framer-motion";
import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import type { NexusHubMapExtras } from "../../lib/ui/hubMapNavigation";
import { useGameStore } from "../../store/useGameStore";
import { EdtechHubSidebar } from "./edtech/EdtechHubSidebar";
import { EdtechProfileSettings } from "./edtech/EdtechProfileSettings";
import {
  edtechHubZoneFromSearch,
  writeEdtechHubZoneToUrl,
  type EdtechHubZoneId,
} from "./edtech/edtechHubZones";
import { NexusEdtechHubArena } from "./edtech/NexusEdtechHubArena";
import "./edtech/edtechDashboardLayout.css";

export type NexusEdtechDashboardProps = {
  scrollParentRef: RefObject<HTMLDivElement | null>;
  railCompact: boolean;
  playerAvatar: number;
  onOpenMap: () => void;
  onOpenFieldList: () => void;
  onBeginLearningField: (lf: number) => void;
  onSwapCompanion: () => void;
  onNavigateFromHubToMap?: (extras: NexusHubMapExtras) => void;
  onBlitzTraining?: () => void;
  onBeginRanked?: () => void;
  onBeginExamField?: (lf: number) => void;
};

export function NexusEdtechDashboard({
  scrollParentRef,
  railCompact,
  playerAvatar,
  onOpenMap,
  onOpenFieldList,
  onBeginLearningField,
  onSwapCompanion,
  onNavigateFromHubToMap,
  onBlitzTraining,
  onBeginRanked,
  onBeginExamField,
}: NexusEdtechDashboardProps) {
  const reduceMotion = useReducedMotion();
  const playerName = useGameStore((s) => s.playerName);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeZone, setActiveZone] = useState<EdtechHubZoneId>(() =>
    edtechHubZoneFromSearch(typeof window !== "undefined" ? window.location.search : ""),
  );

  const scrollHubTop = useCallback(() => {
    const el = scrollParentRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [reduceMotion, scrollParentRef]);

  const mapWithExtras = useCallback(
    (extras: NexusHubMapExtras) => {
      if (onNavigateFromHubToMap) onNavigateFromHubToMap(extras);
      else onOpenMap();
    },
    [onNavigateFromHubToMap, onOpenMap],
  );

  const onZoneChange = useCallback(
    (zone: EdtechHubZoneId) => {
      setActiveZone(zone);
      writeEdtechHubZoneToUrl(zone);
      scrollHubTop();
    },
    [scrollHubTop],
  );

  useEffect(() => {
    const syncFromUrl = () => setActiveZone(edtechHubZoneFromSearch(window.location.search));
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  return (
    <div
      className={railCompact ? "nx-edtech-dashboard nx-edtech-dashboard--stack" : "nx-edtech-dashboard"}
    >
      <div className="nx-edtech-dashboard-rail">
        <EdtechHubSidebar
          playerAvatar={playerAvatar}
          playerName={playerName ?? ""}
          activeZone={activeZone}
          onZoneChange={onZoneChange}
          scrollHubTop={scrollHubTop}
          onOpenMap={onOpenMap}
          mapWithExtras={mapWithExtras}
          onOpenFieldList={onOpenFieldList}
          onBeginLearningField={onBeginLearningField}
          onSwapCompanion={onSwapCompanion}
          onOpenSettings={() => setSettingsOpen(true)}
          onBlitzTraining={onBlitzTraining}
        />
      </div>

      <EdtechProfileSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <div className="nx-edtech-dashboard-main">
        <NexusEdtechHubArena
          activeZone={activeZone}
          onZoneChange={onZoneChange}
          onOpenMap={onOpenMap}
          onBeginLearningField={onBeginLearningField}
          onBeginExamField={onBeginExamField}
          onBlitzTraining={onBlitzTraining}
          onBeginRanked={onBeginRanked}
          mapWithExtras={mapWithExtras}
        />
      </div>
    </div>
  );
}
