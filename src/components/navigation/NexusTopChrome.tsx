import { motion, useReducedMotion } from "framer-motion";
import type { NexusChromeMode } from "../../lib/ui/nexusChromeTokens";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";

export type NexusTopChromeProps = {
  mode: NexusChromeMode;
  onToggleMode: () => void;
  onQuickTest: () => void;
  onOpenMap: () => void;
};

export function NexusTopChrome({ mode, onToggleMode, onQuickTest, onOpenMap }: NexusTopChromeProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const ed = mode === "edtech";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20002,
        width: "100%",
        boxSizing: "border-box",
        paddingTop: "max(10px, env(safe-area-inset-top))",
        paddingBottom: 12,
        paddingLeft: "max(16px, env(safe-area-inset-left))",
        paddingRight: "max(16px, env(safe-area-inset-right))",
        borderBottom: ed ? "1px solid rgba(15,23,42,0.06)" : "1px solid rgba(251,247,239,0.1)",
        background: ed ? "rgba(255,255,255,0.86)" : "rgba(6,8,10,0.82)",
        backdropFilter: "blur(16px) saturate(140%)",
        WebkitBackdropFilter: "blur(16px) saturate(140%)",
        boxShadow: ed ? "0 8px 28px rgba(15,23,42,0.06)" : "0 12px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div
            aria-hidden
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              flexShrink: 0,
              background: ed
                ? "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)"
                : "linear-gradient(135deg, rgba(34,211,238,0.35) 0%, rgba(214,181,111,0.35) 100%)",
              border: ed ? "none" : "1px solid rgba(251,247,239,0.2)",
              boxShadow: ed ? "0 6px 18px rgba(37, 99, 235, 0.25)" : "none",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--nx-font-sans)",
                fontWeight: 800,
                fontSize: 19,
                letterSpacing: "-0.03em",
                color: ed ? "#0f172a" : "rgba(251,247,239,0.96)",
                lineHeight: 1.15,
              }}
            >
              {t("chrome.brand")}
            </div>
            <div
              style={{
                marginTop: 2,
                fontFamily: "var(--nx-font-mono)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: ed ? "#64748b" : "rgba(251,247,239,0.45)",
              }}
            >
              {t("chrome.tagline")}
            </div>
          </div>
        </div>

        <nav
          aria-label={t("chrome.navAria")}
          style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}
        >
          <motion.button
            type="button"
            onClick={onToggleMode}
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            title={ed ? t("chrome.themeIndustrialHint") : t("chrome.themeEdtechHint")}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: ed ? "1px solid #e2e8f0" : "1px solid rgba(251,247,239,0.18)",
              background: ed ? "#f8fafc" : "rgba(0,0,0,0.35)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              display: "grid",
              placeItems: "center",
              color: ed ? "#0f172a" : "rgba(251,247,239,0.9)",
            }}
          >
            {ed ? "☀" : "◐"}
          </motion.button>

          <motion.button
            type="button"
            onClick={onQuickTest}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            style={{
              borderRadius: 999,
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              border: ed ? "1px solid rgba(37, 99, 235, 0.35)" : "1px solid rgba(34,211,238,0.35)",
              background: ed ? "#ffffff" : "rgba(0,0,0,0.22)",
              color: ed ? "#1d4ed8" : "rgba(251,247,239,0.92)",
              fontFamily: "var(--nx-font-sans)",
            }}
          >
            {t("chrome.test")}
          </motion.button>

          <motion.button
            type="button"
            onClick={onOpenMap}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            style={{
              borderRadius: 999,
              padding: "10px 18px",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              border: "none",
              background: ed ? "linear-gradient(125deg, #2563eb 0%, #7c3aed 100%)" : "linear-gradient(125deg, rgba(214,181,111,0.4) 0%, rgba(34,211,238,0.25) 100%)",
              color: "#ffffff",
              fontFamily: "var(--nx-font-sans)",
              boxShadow: ed ? "0 10px 28px rgba(37, 99, 235, 0.28)" : "0 8px 24px rgba(0,0,0,0.35)",
            }}
          >
            {t("chrome.map")}
          </motion.button>
        </nav>
      </div>
    </header>
  );
}
