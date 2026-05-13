import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import { getBossThumbnailCandidates, mentorWaifuUrl, MENTOR_WAIFU_IDS } from "../../data/nexusRegistry";
import { CURRICULUM_BY_LF } from "../../lib/learning/learningRegistry";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { useGameStore } from "../../store/useGameStore";
import { InitialScan } from "../system/InitialScan";
import { MentorPortrait } from "../ui/MentorPortrait";

export type NeuralInitializerProps = {
  onBeginTraining?: () => void;
  onOpenOverview: () => void;
  /** Optional: gleicher Effekt wie onOpenOverview — SectorMap mit Scale-In aus dem Shell-Wrapper */
  onLaunchNexusMap?: () => void;
  onBeginLearningField: (lf: number) => void;
  /** Wenn gesetzt: schließbare Variante über der Karte (zweiter Besuch) */
  onReturnToMap?: () => void;
};

const STAGGER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.11, delayChildren: 0.08 },
  },
};

const CARD = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 26 },
  },
};

const LEARNING_FIELDS = [
  { lf: 1, ap: "AP1", title: "Wirtschaft & Recht", focus: "Kalkulation, Vertrag, Grundlagen" },
  { lf: 2, ap: "AP1", title: "IT-Systeme", focus: "Client, Server, DNS, DHCP" },
  { lf: 3, ap: "AP1", title: "Netzwerke", focus: "Subnetze, Dienste, Ports" },
  { lf: 4, ap: "AP1", title: "Hardware", focus: "Integration, Treiber, Tests" },
  { lf: 5, ap: "AP1", title: "Datenbanken", focus: "Listen verstehen, filtern, wiederfinden" },
  { lf: 6, ap: "AP1", title: "Skripte", focus: "Abläufe, Bedingungen, Schleifen" },
  { lf: 7, ap: "AP2", title: "OOP", focus: "Klassen, Objekte, Interfaces" },
  { lf: 8, ap: "AP2", title: "Datenmodelle", focus: "ERD, Schlüssel, Normalformen" },
  { lf: 9, ap: "AP2", title: "Schnittstellen", focus: "REST, HTTP, Statuscodes" },
  { lf: 10, ap: "AP2", title: "Projektmanagement", focus: "Netzplan, Scrum, Kanban, Sprint Backlog" },
  { lf: 11, ap: "AP2", title: "Security", focus: "CIA, Risiko, Maßnahmen" },
  { lf: 12, ap: "AP2", title: "Projekt", focus: "Scrum, Planung, Risiken" },
] as const;

const headlineStyle: CSSProperties = {
  margin: 0,
  maxWidth: 720,
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(48px, 6vw, 90px)",
  fontWeight: 100,
  lineHeight: 0.95,
  letterSpacing: "-0.07em",
  color: "var(--nx-learn-ink)",
};

const hubHeadlineStyle: CSSProperties = {
  ...headlineStyle,
  fontSize: "clamp(34px, 4.5vw, 56px)",
  lineHeight: 1.05,
  letterSpacing: "-0.05em",
};

const leadStyle: CSSProperties = {
  margin: "22px 0 0",
  maxWidth: 640,
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(22px, 2.6vw, 30px)",
  fontWeight: 400,
  lineHeight: 1.45,
  color: "var(--nx-learn-muted)",
};

export function NeuralInitializer({
  onBeginTraining: _onBeginTraining,
  onOpenOverview,
  onLaunchNexusMap,
  onBeginLearningField,
  onReturnToMap,
}: NeuralInitializerProps) {
  void _onBeginTraining;
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const [profileDockCompact, setProfileDockCompact] = useState(false);
  const [fieldsExpanded, setFieldsExpanded] = useState(false);
  const [codenameDraft, setCodenameDraft] = useState("");
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const playerAvatar = useGameStore((s) => s.playerAvatar);
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerAvatar = useGameStore((s) => s.setPlayerAvatar);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const initialSkillScanComplete = useGameStore((s) => s.initialSkillScanComplete);
  const submitInitialSkillScan = useGameStore((s) => s.submitInitialSkillScan);

  const phase = useMemo(() => {
    if (playerAvatar === null) return "avatar" as const;
    if (!playerName || playerName.trim().length < 1) return "codename" as const;
    if (!initialSkillScanComplete) return "scan" as const;
    return "hub" as const;
  }, [playerAvatar, playerName, initialSkillScanComplete]);

  const goNexusMap = onLaunchNexusMap ?? onOpenOverview;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 780px), (max-height: 640px)");
    const fn = () => setProfileDockCompact(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        background:
          "radial-gradient(ellipse 70% 48% at 50% 18%, rgba(214,181,111,0.16), transparent 58%), linear-gradient(160deg, #121a14 0%, #0b100d 52%, #070a08 100%)",
        display: "flex",
        flexDirection: "column",
        overflow: phase === "scan" ? "hidden" : "auto",
        pointerEvents: "auto",
      }}
    >
      <motion.div
        animate={{ opacity: [0.22, 0.3, 0.24] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 26%, rgba(251,247,239,0.09), transparent 28%), radial-gradient(circle at 18% 82%, rgba(73,112,87,0.18), transparent 34%)",
          pointerEvents: "none",
        }}
      />
      {phase === "hub" && playerAvatar !== null && playerName ? (
        <div
          data-nx-profile-dock
          style={
            profileDockCompact
              ? {
                  position: "fixed",
                  left: 10,
                  right: 10,
                  bottom: "max(88px, calc(env(safe-area-inset-bottom, 0px) + 72px))",
                  top: "auto",
                  zIndex: 20002,
                  maxHeight: "min(36dvh, 340px)",
                  overflowY: "auto",
                  overflowX: "hidden",
                  display: "flex",
                  justifyContent: "center",
                  pointerEvents: "none",
                  paddingBottom: 4,
                }
              : {
                  position: "fixed",
                  top: "clamp(104px, 11.5dvh, 152px)",
                  right: "max(12px, env(safe-area-inset-right))",
                  bottom: "auto",
                  left: "auto",
                  zIndex: 20002,
                  width: "min(360px, calc(100vw - 24px))",
                  pointerEvents: "none",
                }
          }
        >
          <div
            style={{
              pointerEvents: "auto",
              width: "100%",
              display: "flex",
              flexDirection: profileDockCompact ? "row" : "column",
              alignItems: profileDockCompact ? "center" : "stretch",
              gap: profileDockCompact ? 14 : 12,
              padding: "14px 16px 16px",
              borderRadius: 24,
              border: "1px solid rgba(22,32,25,0.12)",
              background:
                "linear-gradient(155deg, rgba(255,255,255,0.92) 0%, rgba(248,244,236,0.88) 50%, rgba(255,252,246,0.9) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 18px 48px rgba(22,32,25,0.12)",
            }}
          >
            <MentorPortrait
              mentorId={playerAvatar}
              size={48}
              radius={24}
              border="1px solid rgba(22,32,25,0.1)"
              boxShadow="0 0 18px rgba(214, 181, 111, 0.2)"
            />
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div
                style={{
                  marginBottom: 4,
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 20,
                  fontWeight: 650,
                  letterSpacing: ".08em",
                  color: "rgba(22,32,25,0.45)",
                  textTransform: "uppercase",
                }}
              >
                {t("hub.eyebrow")}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 650,
                  color: "rgba(22,32,25,0.52)",
                  fontFamily: "var(--nx-font-mono)",
                  lineHeight: 1.25,
                }}
              >
                {t("profile.activeMentor")}
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 20,
                  letterSpacing: ".08em",
                  color: "rgba(22,32,25,0.48)",
                  fontFamily: "var(--nx-font-mono)",
                  fontWeight: 650,
                }}
              >
                {t("profile.callsign")}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  color: "var(--nx-learn-ink)",
                }}
              >
                {playerName}
              </p>
              <p
                style={{
                  margin: "10px 0 0",
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 24,
                  fontWeight: 650,
                  lineHeight: 1.35,
                  color: "rgba(22,32,25,0.62)",
                }}
              >
                {t("hub.statsOneLine")}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {onReturnToMap ? (
        <div
          style={{
            position: "fixed",
            top: "max(16px, env(safe-area-inset-top))",
            right: "max(16px, env(safe-area-inset-right))",
            zIndex: 20001,
            pointerEvents: "auto",
          }}
        >
          <motion.button
            type="button"
            onClick={onReturnToMap}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(251,247,239,0.35)",
              background: "rgba(8, 12, 10, 0.72)",
              color: "rgba(251,247,239,0.96)",
              letterSpacing: ".06em",
              fontSize: 20,
              fontWeight: 700,
              padding: "14px 20px",
              cursor: "pointer",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
            }}
          >
            {t("map.backToMap")}
          </motion.button>
        </div>
      ) : null}
      <div
        style={{
          position: "relative",
          flex: 1,
          width: "100%",
          minHeight: "100dvh",
          display: "flex",
          alignItems: phase === "scan" ? "stretch" : "center",
          justifyContent: "center",
          padding: phase === "scan" ? 0 : "clamp(20px, 4vw, 64px)",
        }}
      >
        <AnimatePresence mode="wait">
          {phase === "avatar" ? (
            <motion.div
              key="nx-avatar"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "min(1180px, 94vw)", margin: "0 auto" }}
            >
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--nx-font-sans)",
                  fontSize: 48,
                  fontWeight: 200,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  color: "rgba(251,247,239,0.96)",
                }}
              >
                {t("profile.pickTitle")}
              </h1>
              <p
                style={{
                  margin: "16px 0 0",
                  maxWidth: 720,
                  fontFamily: "var(--nx-font-sans)",
                  fontSize: 24,
                  lineHeight: 1.45,
                  fontWeight: 500,
                  color: "rgba(251,247,239,0.72)",
                }}
              >
                {t("profile.pickLead")}
              </p>
              <div
                style={{
                  marginTop: 28,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: 16,
                }}
              >
                {MENTOR_WAIFU_IDS.map((id) => (
                  <motion.button
                    key={id}
                    type="button"
                    whileHover={{
                      scale: 1.04,
                      boxShadow:
                        "0 0 32px rgba(214, 181, 111, 0.38), 0 0 1px rgba(184, 148, 48, 0.95)",
                      borderColor: "rgba(212, 175, 55, 0.82)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPlayerAvatar(id)}
                    style={{
                      padding: 8,
                      borderRadius: 22,
                      border: "1px solid rgba(251,247,239,0.1)",
                      cursor: "pointer",
                      background:
                        "linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(8,12,10,0.72) 100%)",
                      backdropFilter: "blur(18px) saturate(120%)",
                      WebkitBackdropFilter: "blur(18px) saturate(120%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                    }}
                  >
                    <MentorPortrait mentorId={id} size={120} radius={16} border="1px solid rgba(251,247,239,0.1)" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : null}

          {phase === "codename" && playerAvatar !== null ? (
            <motion.div
              key="nx-codename"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              style={{
                width: "min(520px, 92vw)",
                margin: "0 auto",
                padding: 40,
                borderRadius: 28,
                border: "1px solid rgba(251,247,239,0.12)",
                background:
                  "linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(6,10,9,0.86) 100%)",
                backdropFilter: "blur(22px) saturate(118%)",
                WebkitBackdropFilter: "blur(22px) saturate(118%)",
                boxShadow: "inset 0 1px 0 rgba(251,247,239,0.08), 0 40px 100px rgba(0,0,0,0.55)",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--nx-font-sans)",
                  fontSize: 48,
                  fontWeight: 200,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  color: "rgba(251,247,239,0.96)",
                }}
              >
                {t("profile.codenameTitle")}
              </h1>
              <p
                style={{
                  margin: "16px 0 0",
                  fontSize: 24,
                  lineHeight: 1.45,
                  fontWeight: 500,
                  color: "rgba(251,247,239,0.72)",
                }}
              >
                {t("profile.codenameLead")}
              </p>
              <input
                value={codenameDraft}
                onChange={(e) => setCodenameDraft(e.target.value.slice(0, 32))}
                placeholder={t("profile.codenamePlaceholder")}
                autoComplete="username"
                style={{
                  marginTop: 28,
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: 16,
                  border: "1px solid rgba(251,247,239,0.18)",
                  background: "rgba(0,0,0,0.35)",
                  color: "rgba(251,247,239,0.95)",
                  fontSize: 24,
                  padding: "16px 18px",
                  outline: "none",
                  fontFamily: "var(--nx-font-sans)",
                }}
              />
              <motion.button
                type="button"
                whileHover={{ scale: codenameDraft.trim().length < 1 ? 1 : 1.02 }}
                whileTap={{ scale: codenameDraft.trim().length < 1 ? 1 : 0.98 }}
                disabled={codenameDraft.trim().length < 1}
                onClick={() => setPlayerName(codenameDraft)}
                style={{
                  marginTop: 22,
                  width: "100%",
                  borderRadius: 999,
                  border: "1px solid rgba(214,181,111,0.4)",
                  background:
                    codenameDraft.trim().length < 1
                      ? "rgba(255,255,255,0.06)"
                      : "linear-gradient(125deg, rgba(214,181,111,0.35) 0%, rgba(24,37,28,0.95) 100%)",
                  color: "rgba(251,247,239,0.96)",
                  fontSize: 24,
                  fontWeight: 800,
                  padding: "16px 22px",
                  cursor: codenameDraft.trim().length < 1 ? "not-allowed" : "pointer",
                }}
              >
                {t("profile.codenameConfirm")}
              </motion.button>
            </motion.div>
          ) : null}

          {phase === "scan" && playerAvatar !== null ? (
            <motion.div
              key="nx-scan"
              style={{ position: "absolute", inset: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              <InitialScan
                mentorAvatarId={playerAvatar}
                onComplete={(m) => submitInitialSkillScan(m)}
                title={t("scan.title")}
                subtitle={t("scan.subtitle")}
                ctaLabel={t("scan.cta")}
                nextLabel={t("scan.next")}
              />
            </motion.div>
          ) : null}

          {phase === "hub" && playerAvatar !== null && playerName ? (
            <motion.div
              key="nx-hub"
              variants={STAGGER}
              initial="hidden"
              animate="show"
              style={{
                position: "relative",
                zIndex: 1,
                width: "min(1340px, 100%)",
                borderRadius: 40,
                border: "1px solid rgba(251,247,239,0.18)",
                background: "rgba(251,247,239,0.96)",
                color: "var(--nx-learn-ink)",
                padding: profileDockCompact
                  ? "clamp(28px, 4vw, 48px) clamp(30px, 4.6vw, 64px) clamp(120px, 28dvh, 200px)"
                  : "clamp(72px, 14dvh, 120px) clamp(30px, 4.6vw, 64px) clamp(30px, 4.6vw, 64px)",
                boxShadow: "0 34px 100px rgba(0,0,0,0.28)",
                pointerEvents: "auto",
              }}
            >
              <div style={{ ...heroGridStyle, gridTemplateColumns: "1fr", maxWidth: 920 }}>
                <motion.section variants={CARD}>
                  <h1 style={{ ...hubHeadlineStyle, fontSize: 48 }}>{t("hub.headline")}</h1>
                  <p style={{ ...leadStyle, fontSize: 24 }}>{t("hub.lead")}</p>
                  <div style={actionRowStyle}>
                    <motion.button
                      type="button"
                      onClick={goNexusMap}
                      whileHover={{ scale: reduceMotion ? 1 : 1.02 }}
                      whileTap={{ scale: reduceMotion ? 1 : 0.98 }}
                      style={ctaStyle}
                    >
                      {t("hub.launchNexusMap")}
                    </motion.button>
                  </div>
                </motion.section>
              </div>

              {fieldsExpanded ? (
                <>
                  <motion.button
                    type="button"
                    variants={CARD}
                    onClick={() => setFieldsExpanded(false)}
                    style={collapseListBtnStyle}
                  >
                    {t("hub.hideList")}
                  </motion.button>
                  <motion.div variants={CARD} style={fieldGridStyle} aria-label="Alle Lernfelder">
                    {LEARNING_FIELDS.map((field) => {
                      const lfKey = `LF${field.lf}` as LearningField;
                      const total = CURRICULUM_BY_LF[lfKey]?.length ?? 0;
                      const solved = new Set(learningCorrectByLf[lfKey] ?? []).size;
                      const thumb =
                        getBossThumbnailCandidates(lfKey)[0] ?? mentorWaifuUrl(playerAvatar);

                      return (
                        <button
                          key={field.lf}
                          type="button"
                          onClick={() => onBeginLearningField(field.lf)}
                          style={fieldCardStyle}
                        >
                          <span style={fieldVisualStyle} aria-hidden="true">
                            <img
                              src={thumb}
                              alt=""
                              style={{
                                display: "block",
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                filter: "saturate(0.85) contrast(0.95)",
                              }}
                            />
                          </span>
                          <span style={fieldMetaStyle}>
                            <span>Datenträger</span>
                            <b>
                              LF{field.lf} · {field.ap}
                            </b>
                          </span>
                          <strong>{field.title}</strong>
                          <span>{field.focus}</span>
                          <span style={fieldProgressStyle}>
                            Einsteiger · {solved}/{total} Übungen · Starten
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              ) : (
                <motion.button
                  type="button"
                  variants={CARD}
                  onClick={() => setFieldsExpanded(true)}
                  style={showListBtnStyle}
                >
                  {t("hub.showList")}
                </motion.button>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

const heroGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
  gap: "clamp(28px, 4vw, 56px)",
  alignItems: "stretch",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 14,
  marginTop: 30,
};

const ctaStyle: CSSProperties = {
  minWidth: 230,
  borderRadius: 999,
  border: "1px solid rgba(22,32,25,0.12)",
  background: "linear-gradient(135deg, #18251c 0%, #314832 100%)",
  color: "rgba(251,247,239,0.98)",
  letterSpacing: ".02em",
  fontSize: 22,
  fontWeight: 800,
  padding: "18px 22px",
  cursor: "pointer",
  pointerEvents: "auto",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

const showListBtnStyle: CSSProperties = {
  marginTop: 36,
  width: "100%",
  maxWidth: 520,
  borderRadius: 999,
  border: "1px solid rgba(22,32,25,0.14)",
  background: "rgba(22,32,25,0.06)",
  color: "var(--nx-learn-ink)",
  letterSpacing: ".04em",
  fontSize: 22,
  fontWeight: 750,
  padding: "16px 22px",
  cursor: "pointer",
  pointerEvents: "auto",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

const collapseListBtnStyle: CSSProperties = {
  marginTop: 28,
  marginBottom: 0,
  alignSelf: "flex-start",
  borderRadius: 999,
  border: "1px solid rgba(22,32,25,0.12)",
  background: "transparent",
  color: "var(--nx-learn-muted)",
  letterSpacing: ".06em",
  fontSize: 18,
  fontWeight: 650,
  padding: "10px 18px",
  cursor: "pointer",
  pointerEvents: "auto",
  touchAction: "manipulation",
};

const fieldGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
  gap: 18,
  marginTop: 42,
};

const fieldCardStyle: CSSProperties = {
  minHeight: 196,
  position: "relative",
  overflow: "hidden",
  textAlign: "left",
  border: "1px solid var(--nx-learn-line)",
  borderRadius: 30,
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.78), rgba(238,229,213,0.68)), radial-gradient(circle at 12% 10%, rgba(214,181,111,0.16), transparent 36%)",
  color: "var(--nx-learn-muted)",
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 24,
  lineHeight: 1.32,
  cursor: "pointer",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 18px 50px rgba(22,32,25,0.08)",
};

const fieldVisualStyle: CSSProperties = {
  position: "relative",
  display: "block",
  width: "100%",
  aspectRatio: "16 / 9",
  marginBottom: 4,
  overflow: "hidden",
  borderRadius: 22,
  background:
    "radial-gradient(circle at 50% 42%, rgba(214,181,111,0.2), rgba(22,32,25,0.08) 58%, rgba(22,32,25,0.16))",
  boxShadow: "inset 0 0 0 1px rgba(22,32,25,0.08)",
  pointerEvents: "none",
};

const fieldMetaStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontFamily: "var(--nx-font-mono)",
  fontSize: 20,
  fontWeight: 650,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "rgba(22,32,25,0.48)",
};

const fieldProgressStyle: CSSProperties = {
  marginTop: "auto",
  alignSelf: "flex-start",
  borderRadius: 999,
  border: "1px solid rgba(214,181,111,0.32)",
  background: "rgba(214,181,111,0.14)",
  color: "var(--nx-learn-ink)",
  fontFamily: "var(--nx-font-mono)",
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: "0.02em",
  padding: "10px 14px",
};

export default NeuralInitializer;
