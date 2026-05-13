import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import { getBossThumbnailCandidates, mentorPortraitSlug, mentorWaifuUrl, MENTOR_WAIFU_IDS } from "../../data/nexusRegistry";
import { CURRICULUM_BY_LF } from "../../lib/learning/learningRegistry";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { useGameStore } from "../../store/useGameStore";
import type { NexusHubMapExtras } from "../../lib/ui/hubMapNavigation";
import { InitialScan } from "../system/InitialScan";
import { MentorPortrait } from "../ui/MentorPortrait";
import { NexusCitadelBriefing } from "./NexusCitadelBriefing";
import { NexusEdtechDashboard } from "./NexusEdtechDashboard";
import { NexusTopChrome } from "./NexusTopChrome";

export type NeuralInitializerProps = {
  onBeginTraining?: () => void;
  onOpenOverview: () => void;
  /** Optional: gleicher Effekt wie onOpenOverview — SectorMap mit Scale-In aus dem Shell-Wrapper */
  onLaunchNexusMap?: () => void;
  onBeginLearningField: (lf: number) => void;
  /** Nach Hub: Karte öffnen und optional Overlay / Sector-Panels (siehe hubMapNavigation) */
  onNavigateFromHubToMap?: (extras: NexusHubMapExtras) => void;
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
  fontWeight: 780,
  lineHeight: 0.98,
  letterSpacing: "-0.05em",
  color: "var(--nx-learn-ink)",
};

const hubHeadlineStyle: CSSProperties = {
  ...headlineStyle,
  fontSize: "clamp(34px, 4.5vw, 56px)",
  lineHeight: 1.05,
  letterSpacing: "-0.05em",
};

const leadStyle: CSSProperties = {
  margin: "28px 0 0",
  maxWidth: 680,
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(22px, 2.6vw, 30px)",
  fontWeight: 500,
  lineHeight: 1.5,
  color: "var(--nx-learn-muted)",
};

export function NeuralInitializer({
  onBeginTraining,
  onOpenOverview,
  onLaunchNexusMap,
  onBeginLearningField,
  onNavigateFromHubToMap,
  onReturnToMap,
}: NeuralInitializerProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const [profileDockCompact, setProfileDockCompact] = useState(false);
  const [companionGridCols, setCompanionGridCols] = useState(8);
  const [fieldsExpanded, setFieldsExpanded] = useState(false);
  const [codenameDraft, setCodenameDraft] = useState("");
  const initScrollRef = useRef<HTMLDivElement>(null);
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const playerAvatar = useGameStore((s) => s.playerAvatar);
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerAvatar = useGameStore((s) => s.setPlayerAvatar);
  const clearCompanionSelection = useGameStore((s) => s.clearCompanionSelection);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const initialSkillScanComplete = useGameStore((s) => s.initialSkillScanComplete);
  const submitInitialSkillScan = useGameStore((s) => s.submitInitialSkillScan);
  const nexusChrome = useGameStore((s) => s.nexusChrome);
  const setNexusChrome = useGameStore((s) => s.setNexusChrome);

  const phase = useMemo(() => {
    if (playerAvatar === null) return "avatar" as const;
    if (!playerName || playerName.trim().length < 1) return "codename" as const;
    if (!initialSkillScanComplete) return "scan" as const;
    return "hub" as const;
  }, [playerAvatar, playerName, initialSkillScanComplete]);

  const goNexusMap = onLaunchNexusMap ?? onOpenOverview;

  const openFieldListAndScroll = useCallback(() => {
    setFieldsExpanded(true);
    requestAnimationFrame(() => {
      document.getElementById("nx-field-list-anchor")?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }, [reduceMotion]);

  const toggleNexusChrome = useCallback(() => {
    setNexusChrome(nexusChrome === "edtech" ? "industrial" : "edtech");
  }, [nexusChrome, setNexusChrome]);

  const handleQuickTest = useCallback(() => {
    if (phase === "avatar") {
      const el = document.getElementById("nx-companion-deck");
      el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    } else {
      goNexusMap();
    }
  }, [phase, goNexusMap, reduceMotion]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1020px)");
    const fn = () => setCompanionGridCols(mq.matches ? 4 : 8);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

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
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        pointerEvents: "auto",
        background:
          nexusChrome === "edtech"
            ? "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 45%, #e2e8f0 100%)"
            : "radial-gradient(ellipse 85% 55% at 50% 12%, rgba(34,211,238,0.05), transparent 52%), linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 48%, #050505 100%)",
      }}
    >
      <NexusTopChrome
        mode={nexusChrome}
        onToggleMode={toggleNexusChrome}
        onQuickTest={handleQuickTest}
        onOpenMap={goNexusMap}
      />
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
        ref={initScrollRef}
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          overflow: phase === "scan" ? "hidden" : "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
      <motion.div
        animate={{ opacity: nexusChrome === "edtech" ? [0.04, 0.08, 0.05] : [0.22, 0.3, 0.24] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            nexusChrome === "edtech"
              ? "radial-gradient(circle at 50% 18%, rgba(37, 99, 235, 0.08), transparent 42%), radial-gradient(circle at 12% 88%, rgba(124, 58, 237, 0.06), transparent 38%)"
              : "radial-gradient(circle at 50% 26%, rgba(251,247,239,0.09), transparent 28%), radial-gradient(circle at 18% 82%, rgba(73,112,87,0.18), transparent 34%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          flex: 1,
          width: "100%",
          minHeight: "100dvh",
          display: "flex",
          alignItems: phase === "scan" ? "stretch" : "flex-start",
          justifyContent: "center",
          padding: phase === "scan" ? 0 : "clamp(28px, 5vw, 72px)",
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
              <NexusCitadelBriefing
                scrollParentRef={initScrollRef}
                companionAnchorId="nx-companion-deck"
                onOpenMap={goNexusMap}
                chrome={nexusChrome}
              />
              <div id="nx-companion-deck" style={{ scrollMarginTop: "max(96px, env(safe-area-inset-top))" }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--nx-font-sans)",
                  fontSize: "clamp(32px, 4.2vw, 48px)",
                  fontWeight: 200,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  color: nexusChrome === "edtech" ? "#0f172a" : "rgba(251,247,239,0.96)",
                }}
              >
                {t("profile.pickTitle")}
              </h1>
              <p
                style={{
                  margin: "16px 0 0",
                  maxWidth: 720,
                  fontFamily: "var(--nx-font-sans)",
                  fontSize: "clamp(18px, 2.2vw, 24px)",
                  lineHeight: 1.45,
                  fontWeight: 500,
                  color: nexusChrome === "edtech" ? "#475569" : "rgba(251,247,239,0.72)",
                }}
              >
                {t("profile.pickLead")}
              </p>
              <div
                style={{
                  marginTop: 32,
                  display: "grid",
                  gridTemplateColumns: `repeat(${companionGridCols}, minmax(0, 1fr))`,
                  gap: 14,
                  width: "100%",
                  maxWidth: 1200,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                {MENTOR_WAIFU_IDS.map((id, ix) => (
                  <motion.button
                    key={id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.28,
                      delay: reduceMotion ? 0 : Math.min(0.35, ix * 0.02),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={
                      reduceMotion
                        ? undefined
                        : {
                            scale: 1.03,
                            boxShadow:
                              "0 0 28px rgba(34, 211, 238, 0.22), 0 0 36px rgba(214, 181, 111, 0.2), inset 0 0 0 1px rgba(251,247,239,0.14)",
                          }
                    }
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    onClick={() => setPlayerAvatar(id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 8px 14px",
                      borderRadius: 14,
                      border: nexusChrome === "edtech" ? "1px solid #e2e8f0" : "1px solid rgba(251,247,239,0.12)",
                      cursor: "pointer",
                      background:
                        nexusChrome === "edtech"
                          ? "linear-gradient(145deg, #ffffff 0%, #f8fafc 55%, #eef2ff 100%)"
                          : "linear-gradient(145deg, rgba(34,211,238,0.14) 0%, rgba(8,10,12,0.88) 42%, rgba(214,181,111,0.12) 100%)",
                      backdropFilter: nexusChrome === "edtech" ? "none" : "blur(14px) saturate(118%)",
                      WebkitBackdropFilter: nexusChrome === "edtech" ? "none" : "blur(14px) saturate(118%)",
                      boxShadow:
                        nexusChrome === "edtech"
                          ? "0 10px 28px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)"
                          : "inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                  >
                    <MentorPortrait
                      mentorId={id}
                      variant="pick"
                      size={companionGridCols >= 8 ? 104 : 96}
                      radius={12}
                      border="1px solid rgba(251,247,239,0.14)"
                    />
                    <span
                      style={{
                        fontFamily: "var(--nx-font-mono)",
                        fontSize: companionGridCols >= 8 ? 13 : 12,
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        color: nexusChrome === "edtech" ? "#0f172a" : "rgba(251,247,239,0.9)",
                        textTransform: "lowercase",
                      }}
                    >
                      {mentorPortraitSlug(id)}
                    </span>
                  </motion.button>
                ))}
              </div>
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
                width: "min(1440px, 100%)",
                borderRadius: nexusChrome === "edtech" ? 16 : 8,
                border:
                  nexusChrome === "edtech" ? "1px solid #e2e8f0" : "1px solid rgba(34, 211, 238, 0.22)",
                background:
                  nexusChrome === "edtech"
                    ? "linear-gradient(165deg, #ffffff 0%, #f8fafc 100%)"
                    : "linear-gradient(165deg, rgba(16, 18, 20, 0.92) 0%, rgba(8, 9, 10, 0.94) 100%)",
                backdropFilter: nexusChrome === "edtech" ? "none" : "blur(24px) saturate(120%)",
                WebkitBackdropFilter: nexusChrome === "edtech" ? "none" : "blur(24px) saturate(120%)",
                color: nexusChrome === "edtech" ? "#0f172a" : "var(--nx-learn-ink)",
                padding: profileDockCompact
                  ? "clamp(36px, 5vw, 56px) clamp(28px, 4vw, 48px)"
                  : "clamp(48px, 8dvh, 96px) clamp(36px, 4.8vw, 72px)",
                boxShadow:
                  nexusChrome === "edtech"
                    ? "0 24px 60px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)"
                    : "inset 0 1px 0 rgba(251,247,239,0.06), 0 40px 100px rgba(0,0,0,0.55)",
                pointerEvents: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: profileDockCompact ? "column" : "row",
                  gap: profileDockCompact ? 28 : 36,
                  alignItems: "stretch",
                  width: "100%",
                }}
              >
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  {nexusChrome === "edtech" ? (
                    <NexusEdtechDashboard
                      scrollParentRef={initScrollRef}
                      railCompact={profileDockCompact}
                      onOpenMap={goNexusMap}
                      onOpenFieldList={openFieldListAndScroll}
                      onBeginLearningField={onBeginLearningField}
                      onSwapCompanion={() => clearCompanionSelection()}
                      onNavigateFromHubToMap={onNavigateFromHubToMap}
                      onBlitzTraining={onBeginTraining}
                    />
                  ) : (
                    <div style={{ ...heroGridStyle, gridTemplateColumns: "1fr", maxWidth: 920 }}>
                      <motion.section variants={CARD}>
                        <h1
                          style={{
                            ...hubHeadlineStyle,
                            fontSize: 48,
                            color: hubHeadlineStyle.color,
                          }}
                        >
                          {t("hub.headline")}
                        </h1>
                        <p
                          style={{
                            ...leadStyle,
                            fontSize: 24,
                            color: leadStyle.color,
                          }}
                        >
                          {t("hub.lead")}
                        </p>
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
                          <motion.button
                            type="button"
                            onClick={() => clearCompanionSelection()}
                            whileHover={{ scale: reduceMotion ? 1 : 1.02 }}
                            whileTap={{ scale: reduceMotion ? 1 : 0.98 }}
                            style={companionChangeBtnStyle}
                          >
                            {t("profile.changeCompanion")}
                          </motion.button>
                        </div>
                      </motion.section>
                    </div>
                  )}

                  <div id="nx-field-list-anchor" style={{ scrollMarginTop: 20 }}>
                  {fieldsExpanded ? (
                    <>
                      <motion.button
                        type="button"
                        variants={CARD}
                        onClick={() => setFieldsExpanded(false)}
                        style={
                          nexusChrome === "edtech"
                            ? { ...collapseListBtnStyle, ...collapseListBtnEdtechStyle }
                            : collapseListBtnStyle
                        }
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
                            <motion.button
                              key={field.lf}
                              type="button"
                              onClick={() => onBeginLearningField(field.lf)}
                              style={{
                                ...fieldCardStyle,
                                ...(nexusChrome === "edtech" ? fieldCardEdtechStyle : {}),
                              }}
                              whileHover={
                                reduceMotion
                                  ? undefined
                                  : {
                                      y: -4,
                                      boxShadow:
                                        "inset 0 1px 0 rgba(251,247,239,0.05), 0 0 0 1px rgba(34,211,238,0.45), 0 22px 52px rgba(0,0,0,0.5)",
                                      transition: { type: "spring", stiffness: 420, damping: 26 },
                                    }
                              }
                              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
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
                                    filter: "saturate(0.88) contrast(1.02)",
                                  }}
                                />
                              </span>
                              <span
                                style={{
                                  ...fieldMetaStyle,
                                  ...(nexusChrome === "edtech" ? fieldMetaEdtechStyle : {}),
                                }}
                              >
                                <span>Datenträger</span>
                                <b>
                                  LF{field.lf} · {field.ap}
                                </b>
                              </span>
                              <strong
                                style={{
                                  color: nexusChrome === "edtech" ? "#0f172a" : "var(--nx-learn-ink)",
                                  fontWeight: 800,
                                }}
                              >
                                {field.title}
                              </strong>
                              <span
                                style={{
                                  color: nexusChrome === "edtech" ? "#475569" : undefined,
                                }}
                              >
                                {field.focus}
                              </span>
                              <span
                                style={{
                                  ...fieldProgressStyle,
                                  ...(nexusChrome === "edtech" ? fieldProgressEdtechStyle : {}),
                                }}
                              >
                                Einsteiger · {solved}/{total} Übungen · Starten
                              </span>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </>
                  ) : (
                    <motion.button
                      type="button"
                      variants={CARD}
                      onClick={() => setFieldsExpanded(true)}
                      style={
                        nexusChrome === "edtech"
                          ? { ...showListBtnStyle, ...showListBtnEdtechStyle }
                          : showListBtnStyle
                      }
                    >
                      {t("hub.showList")}
                    </motion.button>
                  )}
                  </div>
                </div>

                <aside
                  data-nx-profile-dock
                  style={{
                    flexShrink: 0,
                    width: profileDockCompact ? "100%" : 300,
                    maxWidth: profileDockCompact ? "100%" : 340,
                    position: profileDockCompact ? "relative" : "sticky",
                    top: profileDockCompact ? undefined : 12,
                    alignSelf: "flex-start",
                  }}
                >
                  <div
                    style={{
                      pointerEvents: "auto",
                      width: "100%",
                      display: "flex",
                      flexDirection: profileDockCompact ? "row" : "column",
                      alignItems: profileDockCompact ? "center" : "stretch",
                      gap: profileDockCompact ? 14 : 12,
                      padding: "18px 18px 20px",
                      borderRadius: nexusChrome === "edtech" ? 14 : 8,
                      border:
                        nexusChrome === "edtech"
                          ? "1px solid #e2e8f0"
                          : "1px solid rgba(214, 181, 111, 0.28)",
                      background:
                        nexusChrome === "edtech"
                          ? "linear-gradient(165deg, #ffffff 0%, #f1f5f9 100%)"
                          : "rgba(6, 8, 10, 0.58)",
                      backdropFilter: nexusChrome === "edtech" ? "none" : "blur(22px) saturate(125%)",
                      WebkitBackdropFilter: nexusChrome === "edtech" ? "none" : "blur(22px) saturate(125%)",
                      boxShadow:
                        nexusChrome === "edtech"
                          ? "0 16px 40px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)"
                          : "inset 0 1px 0 rgba(251,247,239,0.06), 0 0 0 1px rgba(34,211,238,0.12), 0 20px 56px rgba(0,0,0,0.45)",
                    }}
                  >
                    <MentorPortrait
                      mentorId={playerAvatar}
                      variant="idle"
                      size={48}
                      radius={6}
                      border="1px solid rgba(34,211,238,0.25)"
                      boxShadow="0 0 20px rgba(214, 181, 111, 0.18)"
                    />
                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <div
                        style={{
                          marginBottom: 6,
                          fontFamily: "var(--nx-font-mono)",
                          fontSize: 20,
                          fontWeight: 650,
                          letterSpacing: ".1em",
                          color: nexusChrome === "edtech" ? "#94a3b8" : "rgba(210,208,200,0.55)",
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
                          color: nexusChrome === "edtech" ? "#64748b" : "var(--nx-learn-muted)",
                          fontFamily: "var(--nx-font-sans)",
                          lineHeight: 1.25,
                        }}
                      >
                        {t("profile.activeMentor")}
                      </p>
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: 20,
                          letterSpacing: ".12em",
                          color: nexusChrome === "edtech" ? "#94a3b8" : "rgba(210,208,200,0.5)",
                          fontFamily: "var(--nx-font-mono)",
                          fontWeight: 650,
                          textTransform: "uppercase",
                        }}
                      >
                        {t("profile.callsign")}
                      </p>
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontFamily: "var(--nx-font-mono)",
                          fontSize: 26,
                          fontWeight: 750,
                          letterSpacing: ".06em",
                          color: nexusChrome === "edtech" ? "#0f172a" : "var(--nx-learn-ink)",
                        }}
                      >
                        {playerName}
                      </p>
                      <p
                        style={{
                          margin: "12px 0 0",
                          fontFamily: "var(--nx-font-mono)",
                          fontSize: 22,
                          fontWeight: 650,
                          lineHeight: 1.35,
                          color: nexusChrome === "edtech" ? "#475569" : "rgba(210,208,200,0.72)",
                        }}
                      >
                        {t("hub.statsOneLine")}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}

const heroGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
  gap: "clamp(32px, 4.5vw, 64px)",
  alignItems: "stretch",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  marginTop: 36,
};

const ctaStyle: CSSProperties = {
  minWidth: 230,
  borderRadius: 6,
  border: "1px solid rgba(34, 211, 238, 0.35)",
  background: "linear-gradient(135deg, rgba(12, 22, 28, 0.95) 0%, rgba(18, 42, 36, 0.92) 100%)",
  color: "rgba(251,247,239,0.98)",
  letterSpacing: ".04em",
  fontSize: 22,
  fontWeight: 800,
  padding: "20px 26px",
  cursor: "pointer",
  pointerEvents: "auto",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
  boxShadow: "inset 0 1px 0 rgba(251,247,239,0.08), 0 0 0 1px rgba(214,181,111,0.15)",
};

const companionChangeBtnStyle: CSSProperties = {
  minWidth: 200,
  borderRadius: 6,
  border: "1px solid rgba(214, 181, 111, 0.35)",
  background: "linear-gradient(135deg, rgba(24, 18, 10, 0.88) 0%, rgba(12, 10, 8, 0.92) 100%)",
  color: "rgba(251,247,239,0.92)",
  letterSpacing: ".06em",
  fontSize: 18,
  fontWeight: 700,
  padding: "18px 22px",
  cursor: "pointer",
  pointerEvents: "auto",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

const showListBtnStyle: CSSProperties = {
  marginTop: 40,
  width: "100%",
  maxWidth: 520,
  borderRadius: 6,
  border: "1px solid rgba(34, 211, 238, 0.22)",
  background: "rgba(8, 10, 12, 0.45)",
  color: "var(--nx-learn-ink)",
  letterSpacing: ".04em",
  fontSize: 22,
  fontWeight: 750,
  padding: "18px 24px",
  cursor: "pointer",
  pointerEvents: "auto",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const showListBtnEdtechStyle: CSSProperties = {
  marginTop: 28,
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  color: "#0f172a",
  boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const collapseListBtnStyle: CSSProperties = {
  marginTop: 32,
  marginBottom: 0,
  alignSelf: "flex-start",
  borderRadius: 6,
  border: "1px solid rgba(214, 181, 111, 0.22)",
  background: "rgba(8, 10, 12, 0.35)",
  color: "var(--nx-learn-muted)",
  letterSpacing: ".06em",
  fontSize: 18,
  fontWeight: 650,
  padding: "12px 20px",
  cursor: "pointer",
  pointerEvents: "auto",
  touchAction: "manipulation",
};

const collapseListBtnEdtechStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#64748b",
};

const fieldGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
  gap: 24,
  marginTop: 48,
};

const fieldCardStyle: CSSProperties = {
  minHeight: 204,
  position: "relative",
  overflow: "hidden",
  textAlign: "left",
  border: "1px solid rgba(214, 181, 111, 0.28)",
  borderRadius: 6,
  background: "linear-gradient(165deg, rgba(14, 16, 18, 0.88) 0%, rgba(6, 7, 8, 0.92) 100%)",
  color: "var(--nx-learn-muted)",
  padding: 28,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 24,
  lineHeight: 1.32,
  cursor: "pointer",
  boxShadow: "inset 0 1px 0 rgba(251,247,239,0.04), 0 0 0 1px rgba(34,211,238,0.12), 0 16px 44px rgba(0,0,0,0.4)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

const fieldCardEdtechStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "linear-gradient(165deg, #ffffff 0%, #f8fafc 100%)",
  color: "#64748b",
  boxShadow: "0 12px 32px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const fieldVisualStyle: CSSProperties = {
  position: "relative",
  display: "block",
  width: "100%",
  aspectRatio: "16 / 9",
  marginBottom: 4,
  overflow: "hidden",
  borderRadius: 4,
  background:
    "radial-gradient(circle at 50% 42%, rgba(34,211,238,0.08), rgba(8,10,12,0.5) 58%, rgba(4,5,6,0.85))",
  boxShadow: "inset 0 0 0 1px rgba(214,181,111,0.2)",
  pointerEvents: "none",
};

const fieldMetaStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontFamily: "var(--nx-font-mono)",
  fontSize: 20,
  fontWeight: 650,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(210, 208, 200, 0.52)",
};

const fieldMetaEdtechStyle: CSSProperties = {
  color: "#94a3b8",
};

const fieldProgressStyle: CSSProperties = {
  marginTop: "auto",
  alignSelf: "flex-start",
  borderRadius: 6,
  border: "1px solid rgba(34, 211, 238, 0.22)",
  background: "rgba(34, 211, 238, 0.08)",
  color: "var(--nx-learn-ink)",
  fontFamily: "var(--nx-font-mono)",
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: "0.04em",
  padding: "12px 16px",
};

const fieldProgressEdtechStyle: CSSProperties = {
  border: "1px solid rgba(6, 182, 212, 0.35)",
  background: "rgba(6, 182, 212, 0.08)",
  color: "#0f172a",
};

export default NeuralInitializer;
