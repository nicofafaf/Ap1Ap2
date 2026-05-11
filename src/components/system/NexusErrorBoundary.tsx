import { Component, type ErrorInfo, type ReactNode } from "react";
import { motion } from "framer-motion";

type Props = { children: ReactNode };

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Fängt Render-Fehler auf höchster Ebene — kein weißer Bildschirm
 */
export class NexusErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Nexus] System Fallback", error, info.componentStack);
  }

  private handleRestart = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      const msg = this.state.error?.message ?? "Unbekannter Systemfehler";

      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: "var(--nx-z-system, 10000)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--nx-space-24)",
            background:
              "radial-gradient(ellipse 120% 80% at 50% 20%, rgba(20, 22, 30, 0.97) 0%, var(--nx-obsidian, #050507) 55%, #020203 100%)",
            color: "var(--nx-text-primary)",
            fontFamily: "var(--nx-font-sans)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "min(420px, 100%)",
              border: "1px solid var(--nx-border-readable)",
              borderRadius: 4,
              padding: "var(--nx-space-32)",
              background: "var(--nx-panel-frost)",
              backdropFilter: "blur(40px) saturate(98%)",
              WebkitBackdropFilter: "blur(40px) saturate(98%)",
              boxShadow: "0 var(--nx-space-32) var(--nx-space-64) var(--nx-shadow-deep)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.72rem",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "var(--nx-text-tertiary)",
              }}
            >
              System Fallback
            </p>
            <h1
              style={{
                margin: "12px 0 8px",
                fontWeight: 200,
                fontSize: "1.35rem",
                letterSpacing: "0.06em",
              }}
            >
              Nexus-Session unterbrochen
            </h1>
            <p style={{ margin: "0 0 var(--nx-space-24)", color: "var(--nx-text-muted)", lineHeight: 1.55 }}>
              Ein kritischer Fehler wurde isoliert Die Oberfläche bleibt stabil Starte die Session neu um
              fortzufahren
            </p>
            {isDev ? (
              <pre
                style={{
                  margin: "0 0 var(--nx-space-24)",
                  padding: "var(--nx-space-16)",
                  maxHeight: 140,
                  overflow: "auto",
                  fontSize: "0.75rem",
                  fontFamily: "var(--nx-font-mono)",
                  color: "var(--nx-text-muted)",
                  background: "rgba(5, 5, 7, 0.45)",
                  borderRadius: 2,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg}
              </pre>
            ) : null}
            <motion.button
              type="button"
              onClick={this.handleRestart}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%",
                padding: "14px var(--nx-space-24)",
                border: "1px solid var(--nx-bone-25)",
                borderRadius: 2,
                background:
                  "linear-gradient(145deg, rgba(232,233,240,0.12) 0%, rgba(20,22,27,0.85) 100%)",
                color: "var(--nx-text-primary)",
                fontFamily: "var(--nx-font-sans)",
                fontSize: "0.9rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Session neu starten
            </motion.button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
