import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KnowledgeVault } from "./KnowledgeVault";
import { MasterLeitfadenPanel } from "./MasterLeitfadenPanel";
import { useGameStore } from "../../store/useGameStore";
import { useShallow } from "zustand/react/shallow";
import { useBossAudioEngine } from "../../lib/audio/bossAudioEngine";
import { useMenuAmbientAudio } from "../../lib/audio/menuAudioEngine";
import LeaderboardSim from "./LeaderboardSim";
import { PerformanceGraph } from "../menu/PerformanceGraph";
import { ArchitectInsight } from "../menu/ArchitectInsight";
import { GlobalLeaderboard } from "../menu/GlobalLeaderboard";
import { DAILY_PURPLE_BORDER, DAILY_PURPLE_NEON } from "../../lib/dailyIncursion";
import type { LearningField } from "../../data/nexusRegistry";
import { SkillTree } from "./SkillTree";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

type ArtifactGalleryProps = {
  visible: boolean;
  onClose?: () => void;
};

const DISCOVERY_FLAG_KEY = "nexus.gallery.discoveryPlayed.v1";

export function ArtifactGallery({ visible, onClose }: ArtifactGalleryProps) {
  const { playGalleryDiscovery } = useBossAudioEngine();
  useMenuAmbientAudio(visible);
  const store = useGameStore(
    useShallow((s) => ({
      globalCollection: s.globalCollection,
      learningCorrectByLf: s.learningCorrectByLf,
      activeLF: s.activeLF,
      overlayOpenState: s.overlayOpenState,
      setOverlayOpenState: s.setOverlayOpenState,
    }))
  );

  useEffect(() => {
    if (!visible) return;
    try {
      const seen = localStorage.getItem(DISCOVERY_FLAG_KEY) === "1";
      if (!seen) {
        void playGalleryDiscovery();
        localStorage.setItem(DISCOVERY_FLAG_KEY, "1");
      }
    } catch {
      // no-op
    }
  }, [visible, playGalleryDiscovery]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 95,
            padding: "28px clamp(16px, 2.4vw, 32px)",
            background:
              "radial-gradient(circle at 20% 15%, rgba(34,211,238,0.16), transparent 52%), radial-gradient(circle at 80% 25%, rgba(250,204,21,0.12), transparent 48%), rgba(3,8,14,0.78)",
            backdropFilter: "blur(8px)",
            overflow: "auto",
          }}
        >
          <motion.div
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              maxWidth: 1160,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 12, letterSpacing: ".22em", opacity: 0.85 }}>
                  HALL OF FAME
                </div>
                <div style={{ marginTop: 4, fontSize: 22, fontWeight: 700 }}>
                  Wissens-Datenbank
                </div>
              </div>
              <div style={{ display: "inline-flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => store.setOverlayOpenState("GALLERY")}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(34,211,238,0.45)",
                    background:
                      store.overlayOpenState === "GALLERY"
                        ? "rgba(8,44,58,0.76)"
                        : "rgba(7,25,36,0.74)",
                    color: "rgba(186,230,253,0.97)",
                    letterSpacing: ".1em",
                    fontSize: 11,
                    padding: "9px 12px",
                    cursor: "pointer",
                  }}
                >
                  GALLERY
                </button>
                <button
                  type="button"
                  onClick={() => store.setOverlayOpenState("LEADERBOARD")}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(34,211,238,0.45)",
                    background:
                      store.overlayOpenState === "LEADERBOARD"
                        ? "rgba(8,44,58,0.76)"
                        : "rgba(7,25,36,0.74)",
                    color: "rgba(186,230,253,0.97)",
                    letterSpacing: ".1em",
                    fontSize: 11,
                    padding: "9px 12px",
                    cursor: "pointer",
                  }}
                >
                  LEADERBOARD
                </button>
                <button
                  type="button"
                  onClick={() => store.setOverlayOpenState("DAILY")}
                  style={{
                    borderRadius: 10,
                    border: `1px solid ${DAILY_PURPLE_BORDER}`,
                    background:
                      store.overlayOpenState === "DAILY"
                        ? "rgba(48,20,72,0.82)"
                        : "rgba(24,10,40,0.72)",
                    color: DAILY_PURPLE_NEON,
                    letterSpacing: ".1em",
                    fontSize: 11,
                    padding: "9px 12px",
                    cursor: "pointer",
                  }}
                >
                  DAILY
                </button>
                <button
                  type="button"
                  onClick={() => store.setOverlayOpenState("SKILL_TREE")}
                  style={{
                    borderRadius: 10,
                    border: "1px solid color-mix(in srgb, var(--gold, #facc15) 45%, transparent)",
                    background:
                      store.overlayOpenState === "SKILL_TREE"
                        ? "rgba(40,32,10,0.82)"
                        : "rgba(7,25,36,0.74)",
                    color: "rgba(254, 243, 199, 0.96)",
                    letterSpacing: ".1em",
                    fontSize: 11,
                    padding: "9px 12px",
                    cursor: "pointer",
                  }}
                >
                  SKILL TREE
                </button>
                <button
                  type="button"
                  onClick={() => store.setOverlayOpenState("ARCHITECT_DATA")}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(56, 189, 248, 0.5)",
                    background:
                      store.overlayOpenState === "ARCHITECT_DATA"
                        ? "rgba(12, 48, 72, 0.82)"
                        : "rgba(7,25,36,0.74)",
                    color: "rgba(186, 230, 253, 0.97)",
                    letterSpacing: ".1em",
                    fontSize: 11,
                    padding: "9px 12px",
                    cursor: "pointer",
                  }}
                >
                  ARCHITECT DATA
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(34,211,238,0.45)",
                    background: "rgba(7,25,36,0.74)",
                    color: "rgba(186,230,253,0.97)",
                    letterSpacing: ".1em",
                    fontSize: 11,
                    padding: "9px 12px",
                    cursor: "pointer",
                  }}
                >
                  CLOSE
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {store.overlayOpenState === "ARCHITECT_DATA" ? (
                <motion.div
                  key="architect-pane"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnalyticsDashboard />
                </motion.div>
              ) : store.overlayOpenState === "LEADERBOARD" ? (
                <motion.div
                  key="leaderboard-pane"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <LeaderboardSim globalCollection={store.globalCollection} />
                </motion.div>
              ) : store.overlayOpenState === "SKILL_TREE" ? (
                <motion.div
                  key="skill-tree-pane"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    style={{
                      marginBottom: 14,
                      fontSize: 13,
                      letterSpacing: ".06em",
                      color: "rgba(186, 230, 253, 0.82)",
                    }}
                  >
                    Neural Skill Tree — zwölf Lernfelder, Fortschritt aus dem Curriculum
                  </div>
                  <SkillTree />
                </motion.div>
              ) : store.overlayOpenState === "DAILY" ? (
                <motion.div
                  key="daily-pane"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlobalLeaderboard />
                </motion.div>
              ) : (
                <motion.div
                  key="gallery-pane"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: "1 1 400px", minWidth: 280 }}>
                      <PerformanceGraph />
                    </div>
                    <ArchitectInsight />
                  </div>
                  <MasterLeitfadenPanel
                    learningCorrectByLf={store.learningCorrectByLf}
                    activeLf={`LF${store.activeLF}` as LearningField}
                  />
                  <KnowledgeVault globalCollection={store.globalCollection} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </motion.section>
      )}
    </AnimatePresence>
  );
}

export default ArtifactGallery;
