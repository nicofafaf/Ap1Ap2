import { lazy, Suspense, useEffect } from "react";
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
import type { LearningField } from "../../data/nexusRegistry";
import { SkillTree } from "./SkillTree";
import { EdtechLearningRankPanel } from "../navigation/edtech/EdtechLearningRankPanel";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import "./artifactGallery.css";

const AnalyticsDashboardLazy = lazy(() =>
  import("./AnalyticsDashboard").then((m) => ({ default: m.AnalyticsDashboard }))
);

type ArtifactGalleryProps = {
  visible: boolean;
  onClose?: () => void;
};

const DISCOVERY_FLAG_KEY = "nexus.gallery.discoveryPlayed.v1";

function galleryTabClass(active: boolean, variant?: "daily" | "gold") {
  return [
    "nx-artifact-gallery-tab",
    active ? "nx-artifact-gallery-tab--active" : "",
    variant === "daily" ? "nx-artifact-gallery-tab--daily" : "",
    variant === "gold" ? "nx-artifact-gallery-tab--gold" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function ArtifactGallery({ visible, onClose }: ArtifactGalleryProps) {
  const { t } = useNexusI18n();
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
          className="nx-artifact-gallery-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <motion.div className="nx-artifact-gallery-inner" transition={{ duration: 0.35, ease: "easeOut" }}>
            <header className="nx-artifact-gallery-head">
              <div>
                <div className="nx-artifact-gallery-kicker">{t("gallery.kicker", "Sammlung")}</div>
                <div className="nx-artifact-gallery-title">{t("gallery.title", "Wissens-Datenbank")}</div>
              </div>
              <div className="nx-artifact-gallery-tabs">
                <button
                  type="button"
                  className={galleryTabClass(store.overlayOpenState === "GALLERY")}
                  onClick={() => store.setOverlayOpenState("GALLERY")}
                >
                  {t("gallery.tabGallery", "Erfolge")}
                </button>
                <button
                  type="button"
                  className={galleryTabClass(store.overlayOpenState === "LEADERBOARD")}
                  onClick={() => store.setOverlayOpenState("LEADERBOARD")}
                >
                  {t("gallery.tabLeaderboard", "Rangliste")}
                </button>
                <button
                  type="button"
                  className={galleryTabClass(store.overlayOpenState === "DAILY", "daily")}
                  onClick={() => store.setOverlayOpenState("DAILY")}
                >
                  {t("gallery.tabDaily", "Tagesaufgabe")}
                </button>
                <button
                  type="button"
                  className={galleryTabClass(store.overlayOpenState === "SKILL_TREE", "gold")}
                  onClick={() => store.setOverlayOpenState("SKILL_TREE")}
                >
                  {t("gallery.tabSkill", "Skill-Tree")}
                </button>
                <button
                  type="button"
                  className={galleryTabClass(store.overlayOpenState === "ARCHITECT_DATA")}
                  onClick={() => store.setOverlayOpenState("ARCHITECT_DATA")}
                >
                  {t("gallery.tabArchitect", "Analyse")}
                </button>
                <button
                  type="button"
                  className={`${galleryTabClass(false)} nx-artifact-gallery-tab--close`}
                  onClick={onClose}
                >
                  {t("gallery.close", "Schließen")}
                </button>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {store.overlayOpenState === "ARCHITECT_DATA" ? (
                <motion.div
                  key="architect-pane"
                  className="nx-artifact-gallery-pane"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Suspense fallback={null}>
                    <AnalyticsDashboardLazy />
                  </Suspense>
                </motion.div>
              ) : store.overlayOpenState === "LEADERBOARD" ? (
                <motion.div
                  key="leaderboard-pane"
                  className="nx-artifact-gallery-pane"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  <EdtechLearningRankPanel />
                  <LeaderboardSim globalCollection={store.globalCollection} />
                </motion.div>
              ) : store.overlayOpenState === "SKILL_TREE" ? (
                <motion.div
                  key="skill-tree-pane"
                  className="nx-artifact-gallery-pane"
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
                  className="nx-artifact-gallery-pane"
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
                  className="nx-artifact-gallery-pane"
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
