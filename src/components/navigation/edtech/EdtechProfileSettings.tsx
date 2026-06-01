import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BUNDESLAND_OPTIONS,
  DEFAULT_BUNDESLAND,
  TRAINING_TRACK_OPTIONS,
  type BundeslandId,
  type TrainingTrack,
} from "../../../lib/curriculum/trainingProfile";
import { LF02_FEINLERNZIELE, LF02_KMK_GROBZIEL, LF02_KMK_RICHTZIEL } from "../../../lib/curriculum/lf02KmkObjectives";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
import { edtechGhostBtn, edtechPrimaryBtn } from "./edtechHubTokens";
import "./edtechProfileSettings.css";

export type EdtechProfileSettingsProps = {
  open: boolean;
  onClose: () => void;
};

export function EdtechProfileSettings({ open, onClose }: EdtechProfileSettingsProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const trainingTrack = useGameStore((s) => s.trainingTrack);
  const bundeslandId = useGameStore((s) => s.bundeslandId);
  const learningStoryMode = useGameStore((s) => s.learningStoryMode);
  const setTrainingTrack = useGameStore((s) => s.setTrainingTrack);
  const setBundeslandId = useGameStore((s) => s.setBundeslandId);
  const setLearningStoryMode = useGameStore((s) => s.setLearningStoryMode);

  const activeTrack = trainingTrack ?? "ae";
  const activeBl = bundeslandId ?? DEFAULT_BUNDESLAND;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="edtech-profile-settings"
          className="nx-edtech-settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className="nx-edtech-settings-panel"
            initial={reduceMotion ? false : { y: 32, opacity: 0.92 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="nx-edtech-settings-title"
          >
            <header className="nx-edtech-settings-head">
              <div>
                <p className="nx-edtech-settings-kicker">{t("hub.edtech.settings.kicker", "Profil")}</p>
                <h2 id="nx-edtech-settings-title">{t("hub.edtech.settings.title", "Einstellungen")}</h2>
              </div>
              <button type="button" className="nx-edtech-settings-close" onClick={onClose} aria-label={t("common.close", "Schließen")}>
                ×
              </button>
            </header>

            <section className="nx-edtech-settings-block" aria-labelledby="nx-edtech-settings-track">
              <h3 id="nx-edtech-settings-track">{t("hub.edtech.settings.trackTitle", "Ausbildungsrichtung")}</h3>
              <p className="nx-edtech-settings-lead">{t("hub.edtech.settings.trackLead", "AE oder FISI — LF10 bis LF12 passen sich an")}</p>
              <div className="nx-edtech-settings-grid">
                {TRAINING_TRACK_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={[
                      "nx-edtech-settings-card",
                      activeTrack === opt.id ? "nx-edtech-settings-card--active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setTrainingTrack(opt.id as TrainingTrack)}
                  >
                    <span className="nx-edtech-settings-card-title">{t(opt.titleKey)}</span>
                    <span className="nx-edtech-settings-card-sub">{t(opt.leadKey)}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="nx-edtech-settings-block" aria-labelledby="nx-edtech-settings-region">
              <h3 id="nx-edtech-settings-region">{t("hub.edtech.settings.regionTitle", "Bundesland")}</h3>
              <p className="nx-edtech-settings-lead">
                {t("hub.edtech.settings.regionLead", "KMK-Rahmenlehrplan bundesweit — dein Land für Hinweise")}
              </p>
              <label className="nx-edtech-settings-select-wrap">
                <span className="nx-edtech-settings-select-label">{t("onboarding.regionLabel", "Bundesland")}</span>
                <select
                  className="nx-edtech-settings-select"
                  value={activeBl}
                  onChange={(e) => setBundeslandId(e.target.value as BundeslandId)}
                >
                  {BUNDESLAND_OPTIONS.map((bl) => (
                    <option key={bl.id} value={bl.id}>
                      {bl.label}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="nx-edtech-settings-block" aria-labelledby="nx-edtech-settings-story">
              <h3 id="nx-edtech-settings-story">{t("hub.edtech.settings.storyTitle", "Story-Modus")}</h3>
              <p className="nx-edtech-settings-lead">
                {t("hub.edtech.settings.storyLead", "Missionstexte mit Nexus-Rahmen statt neutraler Kurzfassung")}
              </p>
              <label className="nx-edtech-settings-toggle">
                <input
                  type="checkbox"
                  checked={learningStoryMode}
                  onChange={(e) => setLearningStoryMode(e.target.checked)}
                />
                <span>{t("hub.edtech.settings.storyOn", "Story in Lernaufgaben anzeigen")}</span>
              </label>
            </section>

            <section className="nx-edtech-settings-block nx-edtech-settings-block--kmk" aria-labelledby="nx-edtech-settings-lf2">
              <h3 id="nx-edtech-settings-lf2">{t("hub.edtech.settings.lf2Title", "LF2 · Prüfungs-Checkliste")}</h3>
              <p className="nx-edtech-settings-lead nx-edtech-settings-kmk-richt">{LF02_KMK_RICHTZIEL}</p>
              <p className="nx-edtech-settings-lead">{LF02_KMK_GROBZIEL}</p>
              <ul className="nx-edtech-settings-kmk-list">
                {LF02_FEINLERNZIELE.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <footer className="nx-edtech-settings-foot">
              <button type="button" style={edtechGhostBtn} onClick={onClose}>
                {t("common.close", "Schließen")}
              </button>
              <button type="button" style={edtechPrimaryBtn} onClick={onClose}>
                {t("hub.edtech.settings.done", "Fertig")}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
