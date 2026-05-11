import { useEffect, useMemo, useRef } from "react";
import { readEpilogueUnlocked } from "../../lib/progression/nexusEpilogue";

type LegacyCreditsProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Epilog-only: Credits als GPU-freundlicher Code-Stream (transform-only, 60fps-Ziel)
 */
export function LegacyCredits({ open, onClose }: LegacyCreditsProps) {
  const streamRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);

  const blocks = useMemo(
    () => ({
      header: [
        "// nexus.final.sanctuary — legacy_seal.ts",
        "// build: production · sector_0: cleared",
        "",
        "import { seal } from '@nexus/vision';",
        "",
      ],
      stack: [
        "/* RUNTIME */",
        "React 19",
        "TypeScript 5",
        "Vite 7",
        "Vitest",
        "Zustand",
        "Framer Motion",
        "Web Audio API · SubtleCrypto (AES-GCM-256)",
        "Service Worker · PWA",
        "Recharts",
        "jsPDF · html2canvas",
        "web-vitals",
        "GitHub Actions · CI quality gate",
        "",
        "/* DATA & DOMAIN */",
        "Leitner · Ebbinghaus retention",
        "IHK LF1–LF12 curricula",
        "Nexus registry · combat graph",
        "",
      ],
      vision: [
        "/* ARCHITECT VISION */",
        "",
        "Der Nexus ist kein Skin über Multiple-Choice — er ist ein messbares",
        "Gedächtnis-Raster: jede Antwort speist Intervalle, jede Session",
        "schärft die Kurve R(t). Die Arena bleibt ernst, die Technik bleibt",
        "ehrlich: Versiegelung, Tests, Observer — damit Prüfer und",
        "du dieselbe Wahrheit über den Code teilen.",
        "",
        "— Legacy sealed. Deploy when ready.",
        "",
      ],
    }),
    []
  );

  const flatLines = useMemo(() => {
    const out: string[] = [];
    out.push(...blocks.header, ...blocks.stack, ...blocks.vision);
    out.push(...blocks.header.map((l) => (l.startsWith("//") ? `${l} // echo` : l)));
    out.push(...blocks.stack);
    out.push(...blocks.vision);
    return out;
  }, [blocks]);

  useEffect(() => {
    if (!open) {
      offsetRef.current = 0;
      if (streamRef.current) streamRef.current.style.transform = "translate3d(0,0,0)";
      return;
    }
    offsetRef.current = 0;
    const stream = streamRef.current;
    const lineHeight = 20;
    const maxScroll = Math.max(0, flatLines.length * lineHeight * 0.5);

    const tick = () => {
      offsetRef.current += 0.55;
      if (offsetRef.current > maxScroll) offsetRef.current = 0;
      if (stream) {
        stream.style.transform = `translate3d(0,${-offsetRef.current}px,0)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [open, flatLines.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !readEpilogueUnlocked()) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Legacy credits"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 260,
        background: "rgba(4, 8, 12, 0.92)",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          inset: "4% 6%",
          borderRadius: 12,
          border: "1px solid rgba(212, 175, 55, 0.35)",
          background: "linear-gradient(180deg, rgba(8,12,18,0.97) 0%, rgba(4,8,14,0.99) 100%)",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08)",
          overflow: "hidden",
          pointerEvents: "auto",
          cursor: "default",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            borderBottom: "1px solid rgba(51, 65, 85, 0.45)",
            background: "rgba(6, 10, 16, 0.95)",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: ".2em",
              color: "rgba(250, 204, 21, 0.85)",
            }}
          >
            LEGACY · CREDITS STREAM
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 8,
              border: "1px solid rgba(148, 163, 184, 0.4)",
              background: "rgba(15, 23, 42, 0.7)",
              color: "rgba(226, 232, 240, 0.95)",
              fontSize: 10,
              letterSpacing: ".12em",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            ESC · SCHLIESSEN
          </button>
        </div>
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 0,
            right: 0,
            bottom: 0,
            maskImage: "linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%)",
          }}
        >
          <div
            ref={streamRef}
            style={{
              willChange: "transform",
              padding: "24px 28px 120px",
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              fontSize: 13,
              lineHeight: "20px",
              color: "rgba(186, 230, 253, 0.88)",
              textShadow: "0 0 12px rgba(34, 211, 238, 0.12)",
              transform: "translate3d(0,0,0)",
            }}
          >
            {flatLines.map((line, i) => (
              <div
                key={`${i}-${line.slice(0, 24)}`}
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: line.startsWith("/*")
                    ? "rgba(148, 163, 184, 0.75)"
                    : line.startsWith("//")
                      ? "rgba(52, 211, 153, 0.65)"
                      : line.startsWith("import")
                        ? "rgba(250, 204, 21, 0.8)"
                        : undefined,
                }}
              >
                {line || "\u00A0"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
