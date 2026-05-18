import { useReducedMotion } from "framer-motion";
import type { RefObject } from "react";
import { useCallback } from "react";
import type { NexusHubMapExtras } from "../../lib/ui/hubMapNavigation";
import { useGameStore } from "../../store/useGameStore";
import { EdtechHubSidebar } from "./edtech/EdtechHubSidebar";
import { NexusEdtechHubArena } from "./edtech/NexusEdtechHubArena";

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
}: NexusEdtechDashboardProps) {
  const reduceMotion = useReducedMotion();
  const playerName = useGameStore((s) => s.playerName);

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
    [onNavigateFromHubToMap, onOpenMap]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: railCompact ? "column" : "row",
        gap: railCompact ? 16 : 24,
        width: "100%",
        alignItems: "flex-start",
      }}
    >
      <EdtechHubSidebar
        playerAvatar={playerAvatar}
        playerName={playerName ?? ""}
        scrollHubTop={scrollHubTop}
        onOpenMap={onOpenMap}
        mapWithExtras={mapWithExtras}
        onOpenFieldList={onOpenFieldList}
        onBeginLearningField={onBeginLearningField}
        onSwapCompanion={onSwapCompanion}
        onBlitzTraining={onBlitzTraining}
      />

      <NexusEdtechHubArena
        onOpenMap={onOpenMap}
        onOpenFieldList={onOpenFieldList}
        onBeginLearningField={onBeginLearningField}
        mapWithExtras={mapWithExtras}
      />
    </div>
  );
}
