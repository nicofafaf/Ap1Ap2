import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import type { NestedMessages } from "../../lib/i18n/translationEngine";

type Slide = {
  kicker: string;
  title: string;
  body: string;
  tag: string;
};

function readSlides(messages: NestedMessages): Slide[] {
  const slideshow = messages.slideshow;
  if (!slideshow || typeof slideshow !== "object") return [];
  const raw = (slideshow as Record<string, unknown>).slides;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (s): s is Slide =>
      Boolean(s) &&
      typeof s === "object" &&
      typeof (s as Slide).title === "string" &&
      typeof (s as Slide).body === "string"
  ) as Slide[];
}

type ExamSlideshowProps = {
  open: boolean;
  onClose: () => void;
};

export function ExamSlideshow({ open, onClose }: ExamSlideshowProps) {
  const { t, messages } = useNexusI18n();
  const slides = useMemo(() => readSlides(messages), [messages]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(slides.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, slides.length]);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(slides.length - 1, i + 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const slide = slides[index];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t("slideshow.title")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 240,
            background: "rgba(4, 8, 16, 0.88)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(12px, 3vw, 28px)",
          }}
          onClick={onClose}
        >
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(900px, 100%)",
              minHeight: "min(72vh, 520px)",
              borderRadius: 18,
              border: "1px solid rgba(250, 204, 21, 0.35)",
              background:
                "linear-gradient(155deg, rgba(12, 18, 28, 0.94) 0%, rgba(6, 10, 18, 0.97) 100%)",
              boxShadow:
                "0 0 60px rgba(34, 211, 238, 0.12), inset 0 0 80px rgba(15, 23, 42, 0.35)",
              padding: "clamp(22px, 3.5vw, 36px)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: ".28em",
                  color: "rgba(250, 204, 21, 0.85)",
                }}
              >
                {t("slideshow.title")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontVariantNumeric: "tabular-nums",
                    color: "rgba(148, 163, 184, 0.9)",
                  }}
                >
                  {slides.length > 0 ? `${index + 1} / ${slides.length}` : "—"}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(148, 163, 184, 0.45)",
                    background: "rgba(15, 23, 42, 0.65)",
                    color: "rgba(226, 232, 240, 0.95)",
                    letterSpacing: ".12em",
                    fontSize: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  {t("slideshow.close")}
                </button>
              </div>
            </div>

            <div style={{ flex: 1, position: "relative", minHeight: 280 }}>
              <AnimatePresence mode="wait">
                {slide ? (
                  <motion.div
                    key={slide.title + index}
                    role="group"
                    aria-roledescription="slide"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -32 }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: "absolute", inset: 0 }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: ".22em",
                        color: "rgba(103, 232, 249, 0.78)",
                        marginBottom: 10,
                      }}
                    >
                      {slide.kicker}
                    </div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "clamp(24px, 4vw, 34px)",
                        fontWeight: 750,
                        letterSpacing: ".04em",
                        color: "rgba(248, 250, 252, 0.96)",
                        lineHeight: 1.15,
                      }}
                    >
                      {slide.title}
                    </h2>
                    <p
                      style={{
                        margin: "18px 0 0",
                        fontSize: "clamp(15px, 2vw, 17px)",
                        lineHeight: 1.65,
                        color: "rgba(203, 213, 225, 0.9)",
                        maxWidth: 720,
                      }}
                    >
                      {slide.body}
                    </p>
                    <div
                      style={{
                        marginTop: 22,
                        display: "inline-block",
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "1px solid rgba(34, 211, 238, 0.35)",
                        fontSize: 10,
                        letterSpacing: ".16em",
                        color: "rgba(186, 230, 253, 0.9)",
                      }}
                    >
                      {slide.tag}
                    </div>
                  </motion.div>
                ) : (
                  <div style={{ color: "rgba(248, 113, 113, 0.9)", fontSize: 14 }}>No slides</div>
                )}
              </AnimatePresence>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                borderTop: "1px solid rgba(51, 65, 85, 0.45)",
                paddingTop: 14,
              }}
            >
              <div style={{ fontSize: 11, color: "rgba(148, 163, 184, 0.82)" }}>
                {t("slideshow.hint")}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  disabled={index <= 0}
                  onClick={goPrev}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(51, 65, 85, 0.55)",
                    background: "rgba(15, 23, 42, 0.55)",
                    color: "rgba(226, 232, 240, 0.92)",
                    letterSpacing: ".1em",
                    fontSize: 10,
                    padding: "10px 14px",
                    cursor: index <= 0 ? "not-allowed" : "pointer",
                    opacity: index <= 0 ? 0.45 : 1,
                  }}
                >
                  {t("slideshow.prev")}
                </button>
                <button
                  type="button"
                  disabled={index >= slides.length - 1}
                  onClick={goNext}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(250, 204, 21, 0.45)",
                    background: "rgba(40, 32, 8, 0.65)",
                    color: "rgba(253, 230, 138, 0.95)",
                    letterSpacing: ".1em",
                    fontSize: 10,
                    padding: "10px 14px",
                    cursor: index >= slides.length - 1 ? "not-allowed" : "pointer",
                    opacity: index >= slides.length - 1 ? 0.45 : 1,
                  }}
                >
                  {t("slideshow.next")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
