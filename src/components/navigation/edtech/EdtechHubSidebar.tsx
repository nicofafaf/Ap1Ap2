import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import type { NexusHubMapExtras } from "../../../lib/ui/hubMapNavigation";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { MentorPortrait } from "../../ui/MentorPortrait";
import type { EdtechHubZoneId } from "./edtechHubZones";
import { cyanAccent, goldAccent } from "./edtechHubTokens";

export type EdtechHubSidebarProps = {
  playerAvatar: number;
  playerName: string;
  activeZone: EdtechHubZoneId;
  onZoneChange: (zone: EdtechHubZoneId) => void;
  scrollHubTop: () => void;
  onOpenMap: () => void;
  mapWithExtras: (extras: NexusHubMapExtras) => void;
  onOpenFieldList: () => void;
  onBeginLearningField: (lf: number) => void;
  onSwapCompanion: () => void;
  onOpenSettings?: () => void;
  onBlitzTraining?: () => void;
};

export function EdtechHubSidebar({
  playerAvatar,
  playerName,
  activeZone,
  onZoneChange,
  scrollHubTop,
  onOpenMap,
  mapWithExtras,
  onOpenFieldList,
  onBeginLearningField,
  onSwapCompanion,
  onOpenSettings,
  onBlitzTraining,
}: EdtechHubSidebarProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();

  return (
    <aside className="nx-edtech-sidebar" style={shellStyle} aria-label={t("hub.edtech.navAria")}>
      <motion.nav
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "4px 2px" }}
      >
        <div style={brandRowStyle}>
          <span style={brandGlyphStyle} aria-hidden />
          <div>
            <div style={brandTitleStyle}>{t("chrome.brand", "LernenSchule")}</div>
            <div style={brandSubStyle}>{t("chrome.tagline", "AP1 & AP2 üben")}</div>
          </div>
        </div>

        <NavSection title={t("hub.edtech.mega.secStart")} kicker="◆">
          <NavBtn
            active={activeZone === "home"}
            label={t("hub.edtech.zones.home")}
            onClick={() => onZoneChange("home")}
          />
          <NavBtn label={t("hub.edtech.mega.lernStart")} onClick={onOpenMap} />
        </NavSection>

        <NavSection title={t("hub.edtech.mega.secLearn")} kicker="◆">
          <NavBtn
            active={activeZone === "home"}
            label={t("hub.edtech.sectionNav.continue", "Weiterlernen")}
            onClick={() => onZoneChange("home")}
          />
          <NavBtn
            active={activeZone === "duel"}
            label={t("hub.edtech.zones.duel")}
            onClick={() => onZoneChange("duel")}
          />
          <NavBtn
            active={activeZone === "ccna"}
            label={t("hub.edtech.zones.ccna")}
            onClick={() => onZoneChange("ccna")}
          />
          <NavBtn
            active={activeZone === "exams"}
            label={t("hub.edtech.zones.exams")}
            onClick={() => onZoneChange("exams")}
          />
          <NavBtn
            label={t("hub.edtech.mega.blitz")}
            onClick={() => onBlitzTraining?.()}
            disabled={!onBlitzTraining}
          />
          <NavBtn label={t("hub.edtech.mega.exams")} onClick={onOpenMap} />
          <NavBtn
            active={activeZone === "courses"}
            label={t("hub.edtech.zones.courses")}
            onClick={() => onZoneChange("courses")}
          />
          <NavBtn
            active={activeZone === "progress"}
            label={t("hub.edtech.zones.progress")}
            onClick={() => onZoneChange("progress")}
          />
          <NavBtn label={t("hub.edtech.mega.roles")} onClick={() => mapWithExtras({ overlay: "GALLERY" })} />
          <NavBtn label={t("hub.edtech.mega.certs")} onClick={() => mapWithExtras({ openDossier: true })} />
          <NavBtn label={t("hub.edtech.mega.cards")} onClick={() => onBeginLearningField(5)} />
          <NavBtn label={t("hub.edtech.mega.progress")} onClick={() => mapWithExtras({ overlay: "LEADERBOARD" })} />
          <NavBtn label={t("hub.edtech.mega.daily")} onClick={() => mapWithExtras({ openDailyPanel: true })} />
          <NavBtn label={t("hub.edtech.mega.codex")} onClick={() => mapWithExtras({ openCodex: true })} />
        </NavSection>

        <NavSection title={t("hub.edtech.mega.secTools")} kicker="◆">
          <NavBtn label={t("hub.edtech.mega.toolNetwork")} onClick={() => onBeginLearningField(3)} />
          <NavBtn label={t("hub.edtech.mega.toolNetplan")} onClick={() => onBeginLearningField(10)} />
          <NavBtn label={t("hub.edtech.mega.toolDiagrams")} onClick={() => mapWithExtras({ overlay: "ARCHITECT_DATA" })} />
        </NavSection>

        <NavSection title={t("hub.edtech.mega.secAccount")} kicker="◆">
          <NavBtn
            label={t("hub.edtech.mega.profileSettings", "Profil · Einstellungen")}
            onClick={() => onOpenSettings?.()}
            disabled={!onOpenSettings}
          />
          <NavBtn label={t("hub.edtech.mega.profileMentor")} onClick={onSwapCompanion} />
          <NavBtn label={t("hub.edtech.mega.mapContext")} onClick={onOpenMap} />
        </NavSection>
      </motion.nav>

      <div style={mentorDockStyle}>
        <MentorPortrait mentorId={playerAvatar} variant="pick" size={52} radius={14} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={mentorNameStyle}>{playerName}</div>
          <div style={mentorRoleStyle}>{t("profile.activeMentor")}</div>
        </div>
      </div>
    </aside>
  );
}

function NavSection({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={sectionLabelStyle}>
        <span style={{ color: cyanAccent, marginRight: 6 }}>{kicker}</span>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>
    </div>
  );
}

function NavBtn({
  label,
  onClick,
  active,
  disabled,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { x: 2 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      style={{
        ...navBtnStyle,
        ...(active ? navBtnActiveStyle : {}),
        ...(disabled ? navBtnDisabledStyle : {}),
      }}
    >
      {label}
    </motion.button>
  );
}

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  display: "flex",
  flexDirection: "column",
  maxHeight: "none",
  borderRadius: 18,
  border: "1px solid rgba(214, 181, 111, 0.22)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(241,245,249,0.92) 100%)",
  boxShadow: "0 20px 56px rgba(15,23,42,0.1), inset 0 1px 0 rgba(255,255,255,1)",
  padding: "14px 12px 12px",
  boxSizing: "border-box",
};

const brandRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 8px 16px",
  borderBottom: "1px solid #e2e8f0",
  marginBottom: 12,
};

const brandGlyphStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  background: `linear-gradient(135deg, ${cyanAccent} 0%, ${goldAccent} 100%)`,
  boxShadow: "0 8px 24px rgba(6,182,212,0.25)",
  flexShrink: 0,
};

const brandTitleStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 17,
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

const brandSubStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#64748b",
  marginTop: 2,
};

const sectionLabelStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 12,
  fontWeight: 750,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#64748b",
  padding: "4px 8px 8px",
};

const navBtnStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  borderRadius: 10,
  border: "1px solid transparent",
  background: "transparent",
  color: "#334155",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 650,
  padding: "10px 12px",
  cursor: "pointer",
};

const navBtnActiveStyle: CSSProperties = {
  background: "linear-gradient(90deg, rgba(6,182,212,0.12) 0%, rgba(214,181,111,0.08) 100%)",
  borderColor: "rgba(6,182,212,0.35)",
  color: "#0f172a",
  fontWeight: 750,
};

const navBtnDisabledStyle: CSSProperties = {
  opacity: 0.4,
  cursor: "not-allowed",
};

const mentorDockStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginTop: 12,
  padding: "12px 10px",
  borderRadius: 14,
  border: "1px solid rgba(214, 181, 111, 0.28)",
  background: "linear-gradient(135deg, rgba(240,253,250,0.9) 0%, rgba(255,251,235,0.85) 100%)",
};

const mentorNameStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 16,
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "0.02em",
};

const mentorRoleStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 14,
  fontWeight: 600,
  color: "#64748b",
  marginTop: 2,
};
