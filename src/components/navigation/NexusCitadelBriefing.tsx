import { motion, useInView, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { citadelChromeTokens, type CitadelChromeTokens, type NexusChromeMode } from "../../lib/ui/nexusChromeTokens";

export type NexusCitadelBriefingProps = {
  scrollParentRef: RefObject<HTMLElement | null>;
  companionAnchorId: string;
  onOpenMap: () => void;
  chrome: NexusChromeMode;
};

function usePrefersCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const fn = () => setCoarse(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return coarse;
}

function AnimatedStat({
  value,
  label,
  sub,
  reduceMotion,
  tokens,
}: {
  value: number;
  label: string;
  sub: string;
  reduceMotion: boolean | null;
  tokens: CitadelChromeTokens;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) {
      setN(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - (1 - p) ** 3;
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduceMotion, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      style={{
        padding: "22px 20px",
        borderRadius: 18,
        border: `1px solid ${tokens.cardBorder}`,
        background: tokens.card,
        boxShadow: tokens.cardShadow,
      }}
    >
      <div
        style={{
          fontFamily: "var(--nx-font-mono)",
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          background: tokens.statNumber,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {n}
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: "var(--nx-font-sans)",
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: tokens.text,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 15,
          lineHeight: 1.45,
          color: tokens.textSoft,
          fontWeight: 500,
        }}
      >
        {sub}
      </div>
    </motion.div>
  );
}

export function NexusCitadelBriefing({ scrollParentRef, companionAnchorId, onOpenMap, chrome }: NexusCitadelBriefingProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const coarse = usePrefersCoarsePointer();
  const uid = useId();
  const railId = `${uid}-rail`;
  const tk = useMemo(() => citadelChromeTokens(chrome), [chrome]);
  const ed = chrome === "edtech";

  const { scrollYProgress } = useScroll({
    container: scrollParentRef,
    offset: ["start start", "end end"],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.35 });

  const scrollToCompanion = useCallback(() => {
    const el = document.getElementById(companionAnchorId);
    el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [companionAnchorId, reduceMotion]);

  const featureCount = 6;
  const features = useMemo(
    () =>
      Array.from({ length: featureCount }, (_, i) => ({
        title: t(`citadel.features.${i}.title`),
        body: t(`citadel.features.${i}.body`),
      })),
    [t]
  );

  const privacyCount = 5;
  const privacy = useMemo(
    () =>
      Array.from({ length: privacyCount }, (_, i) => ({
        title: t(`citadel.privacy.${i}.title`),
        body: t(`citadel.privacy.${i}.body`),
      })),
    [t]
  );

  const voices = useMemo(
    () =>
      [0, 1, 2].map((i) => ({
        quote: t(`citadel.voices.${i}.quote`),
        name: t(`citadel.voices.${i}.name`),
        role: t(`citadel.voices.${i}.role`),
      })),
    [t]
  );

  const [voiceIx, setVoiceIx] = useState(0);

  return (
    <div style={{ width: "100%", position: "relative", color: tk.text }}>
      <motion.div
        aria-hidden
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          height: 3,
          width: "100%",
          pointerEvents: "none",
          opacity: 0.95,
        }}
      >
        <motion.div
          style={{
            height: "100%",
            width: "100%",
            transformOrigin: "0% 50%",
            scaleX: smoothProgress,
            background: tk.accentLine,
            boxShadow: ed ? "0 0 20px rgba(37, 99, 235, 0.2)" : "0 0 24px rgba(34,211,238,0.35)",
          }}
        />
      </motion.div>

      <div
        style={{
          position: "sticky",
          top: 6,
          zIndex: 6,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          marginBottom: -48,
        }}
      >
        <motion.div
          style={{
            pointerEvents: "auto",
            display: "flex",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 999,
            border: ed ? "1px solid #e2e8f0" : "1px solid rgba(251,247,239,0.14)",
            background: ed ? "rgba(255,255,255,0.92)" : "rgba(6,8,10,0.72)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: ed ? "0 14px 36px rgba(15,23,42,0.08)" : "0 18px 48px rgba(0,0,0,0.45)",
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.15, duration: 0.35 }}
        >
          <motion.button
            type="button"
            onClick={scrollToCompanion}
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            style={{
              borderRadius: 999,
              border: ed ? "1px solid rgba(37, 99, 235, 0.35)" : "1px solid rgba(34,211,238,0.35)",
              background: ed ? "#ffffff" : "linear-gradient(125deg, rgba(34,211,238,0.22) 0%, rgba(8,12,14,0.95) 100%)",
              color: ed ? "#1d4ed8" : "rgba(251,247,239,0.96)",
              fontWeight: 800,
              letterSpacing: "0.08em",
              fontSize: 13,
              padding: "10px 16px",
              cursor: "pointer",
              textTransform: "uppercase",
              fontFamily: "var(--nx-font-mono)",
            }}
          >
            {t("citadel.sticky.link")}
          </motion.button>
          <motion.button
            type="button"
            onClick={onOpenMap}
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            style={{
              borderRadius: 999,
              border: ed ? "1px solid #cbd5e1" : "1px solid rgba(214,181,111,0.35)",
              background: ed ? "#f8fafc" : "rgba(0,0,0,0.25)",
              color: ed ? "#334155" : "rgba(251,247,239,0.9)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              fontSize: 13,
              padding: "10px 16px",
              cursor: "pointer",
              textTransform: "uppercase",
              fontFamily: "var(--nx-font-mono)",
            }}
          >
            {t("citadel.sticky.map")}
          </motion.button>
        </motion.div>
      </div>

      <section
        style={{
          position: "relative",
          padding: "clamp(32px,6vw,88px) clamp(20px,4vw,48px) clamp(48px,8vw,96px)",
          overflow: "hidden",
        }}
      >
        <motion.div
          aria-hidden
          animate={
            reduceMotion
              ? { opacity: 0.12 }
              : { opacity: [0.1, 0.18, 0.12], rotate: [0, 1.5, 0] }
          }
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            width: "140%",
            height: "80%",
            left: "-20%",
            top: "-10%",
            background:
              ed
                ? "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(37, 99, 235, 0.1), transparent 70%), radial-gradient(ellipse 40% 35% at 80% 20%, rgba(124, 58, 237, 0.08), transparent 65%)"
                : "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(34,211,238,0.14), transparent 70%), radial-gradient(ellipse 40% 35% at 80% 20%, rgba(214,181,111,0.12), transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1040, margin: "0 auto", textAlign: "center" }}>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{
              margin: 0,
              fontFamily: "var(--nx-font-mono)",
              fontSize: 14,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: ed ? "#2563eb" : "rgba(34,211,238,0.85)",
              fontWeight: 700,
            }}
          >
            {t("citadel.heroEyebrow")}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              margin: "18px 0 0",
              fontFamily: "var(--nx-font-sans)",
              fontSize: "clamp(36px,5.2vw,64px)",
              fontWeight: 780,
              letterSpacing: "-0.05em",
              lineHeight: 1.02,
              color: tk.text,
            }}
          >
            {t("citadel.heroTitle")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.5 }}
            style={{
              margin: "22px auto 0",
              maxWidth: 760,
              fontSize: "clamp(18px,2.2vw,22px)",
              lineHeight: 1.55,
              fontWeight: 500,
              color: tk.textMuted,
            }}
          >
            {t("citadel.heroLead")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.18, duration: 0.45 }}
            style={{
              marginTop: 32,
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: "center",
            }}
          >
            <motion.button
              type="button"
              onClick={scrollToCompanion}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      scale: 1.03,
                      boxShadow: ed ? "0 12px 36px rgba(37, 99, 235, 0.28)" : "0 0 40px rgba(34,211,238,0.25)",
                    }
              }
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              style={{
                borderRadius: 999,
                border: ed ? "none" : "1px solid rgba(34,211,238,0.45)",
                background: ed ? "linear-gradient(125deg, #2563eb 0%, #1d4ed8 100%)" : "linear-gradient(130deg, rgba(34,211,238,0.35) 0%, rgba(12,18,20,0.95) 100%)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 18,
                padding: "16px 28px",
                cursor: "pointer",
                letterSpacing: "0.02em",
                boxShadow: ed ? "0 10px 28px rgba(37, 99, 235, 0.22)" : undefined,
              }}
            >
              {t("citadel.heroCtaPrimary")}
            </motion.button>
            <motion.button
              type="button"
              onClick={onOpenMap}
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              style={{
                borderRadius: 999,
                border: ed ? "1px solid rgba(37, 99, 235, 0.35)" : "1px solid rgba(251,247,239,0.22)",
                background: ed ? "#ffffff" : "rgba(0,0,0,0.28)",
                color: ed ? "#1d4ed8" : "rgba(251,247,239,0.92)",
                fontWeight: 700,
                fontSize: 18,
                padding: "16px 28px",
                cursor: "pointer",
              }}
            >
              {t("citadel.heroCtaSecondary")}
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.28, duration: 0.5 }}
            style={{
              marginTop: 20,
              fontSize: 15,
              letterSpacing: "0.04em",
              color: tk.textSoft,
              fontWeight: 600,
            }}
          >
            {t("citadel.heroTrust")}
          </motion.p>
        </div>
      </section>

      <section style={{ padding: "0 clamp(20px,4vw,48px) 56px" }}>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          style={{
            maxWidth: 920,
            margin: "0 auto",
            borderRadius: 22,
            overflow: "hidden",
            border: `1px solid ${tk.cardBorder}`,
            boxShadow: tk.cardShadow,
          }}
        >
          <div
            style={{
              padding: "14px 22px",
              background: tk.storyBar,
              fontFamily: "var(--nx-font-mono)",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#ffffff",
            }}
          >
            {t("citadel.storyKicker")}
          </div>
          <div
            style={{
              padding: "clamp(24px,4vw,40px)",
              background: ed ? "#ffffff" : "linear-gradient(180deg, rgba(14,16,18,0.96) 0%, rgba(8,9,10,0.98) 100%)",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "clamp(22px,2.6vw,30px)",
                fontWeight: 700,
                color: tk.text,
                letterSpacing: "-0.02em",
              }}
            >
              {t("citadel.storyTitle")}
            </h3>
            <p style={{ margin: "16px 0 0", fontSize: 18, lineHeight: 1.65, color: tk.textMuted }}>
              {t("citadel.storyP1")}
            </p>
            <p style={{ margin: "14px 0 0", fontSize: 18, lineHeight: 1.65, color: tk.textMuted }}>
              {t("citadel.storyP2")}
            </p>
            <p style={{ margin: "14px 0 0", fontSize: 18, lineHeight: 1.65, color: tk.textMuted }}>
              {t("citadel.storyP3")}
            </p>
          </div>
        </motion.div>
      </section>

      <section style={{ padding: "0 clamp(20px,4vw,48px) 56px" }}>
        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          style={{
            margin: "0 0 8px",
            textAlign: "center",
            fontSize: "clamp(26px,3.2vw,38px)",
            fontWeight: 780,
            letterSpacing: "-0.03em",
            color: tk.text,
          }}
        >
          {t("citadel.privacyTitle")}
        </motion.h3>
        <p
          style={{
            margin: "0 auto 28px",
            maxWidth: 640,
            textAlign: "center",
            fontSize: 18,
            lineHeight: 1.55,
            color: tk.textMuted,
          }}
        >
          {t("citadel.privacyLead")}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {privacy.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: reduceMotion ? 0 : i * 0.05, type: "spring", stiffness: 280, damping: 28 }}
              style={{
                padding: "22px 20px",
                borderRadius: 16,
                border: `1px solid ${tk.cardBorder}`,
                background: tk.card,
                minHeight: 140,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: ed ? "#7c3aed" : "rgba(214,181,111,0.9)",
                  fontWeight: 800,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <h4 style={{ margin: "10px 0 0", fontSize: 19, fontWeight: 800, color: tk.text }}>
                {p.title}
              </h4>
              <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.55, color: tk.textSoft }}>
                {p.body}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 clamp(20px,4vw,48px) 56px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          <AnimatedStat
            value={12}
            label={t("citadel.statFields")}
            sub={t("citadel.statFieldsSub")}
            reduceMotion={reduceMotion}
            tokens={tk}
          />
          <AnimatedStat
            value={8}
            label={t("citadel.statModes")}
            sub={t("citadel.statModesSub")}
            reduceMotion={reduceMotion}
            tokens={tk}
          />
          <AnimatedStat
            value={25}
            label={t("citadel.statWaifu")}
            sub={t("citadel.statWaifuSub")}
            reduceMotion={reduceMotion}
            tokens={tk}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            style={{
              padding: "22px 20px",
              borderRadius: 18,
              border: `1px solid ${tk.cardBorder}`,
              background: ed ? "#ffffff" : "linear-gradient(155deg, rgba(214,181,111,0.1) 0%, rgba(8,10,12,0.92) 55%, rgba(34,211,238,0.06) 100%)",
              boxShadow: ed ? tk.cardShadow : "inset 0 1px 0 rgba(251,247,239,0.05)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--nx-font-mono)",
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: "0.02em",
                lineHeight: 1,
                color: ed ? "#2563eb" : "rgba(214,181,111,0.95)",
              }}
            >
              {t("citadel.statPwaGlyph")}
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: "var(--nx-font-sans)",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: tk.text,
              }}
            >
              {t("citadel.statPwa")}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 15,
                lineHeight: 1.45,
                color: tk.textSoft,
                fontWeight: 500,
              }}
            >
              {t("citadel.statPwaSub")}
            </div>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: "0 clamp(20px,4vw,48px) 64px" }}>
        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          style={{
            margin: "0 0 22px",
            textAlign: "center",
            fontSize: "clamp(26px,3.2vw,38px)",
            fontWeight: 780,
            color: tk.text,
            letterSpacing: "-0.03em",
          }}
        >
          {t("citadel.deckTitle")}
        </motion.h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: coarse ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: 14,
            maxWidth: 1120,
            margin: "0 auto",
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: reduceMotion ? 0 : i * 0.04, type: "spring", stiffness: 280, damping: 26 }}
              style={{
                padding: "22px 20px",
                borderRadius: 18,
                border: `1px solid ${tk.cardBorder}`,
                background:
                  ed && i === 0
                    ? "linear-gradient(145deg, #eef2ff 0%, #ffffff 55%, #faf5ff 100%)"
                    : ed
                      ? "#ffffff"
                      : i === 0
                        ? "linear-gradient(145deg, rgba(34,211,238,0.12) 0%, rgba(8,10,12,0.92) 45%, rgba(214,181,111,0.1) 100%)"
                        : "linear-gradient(165deg, rgba(18,20,22,0.9) 0%, rgba(8,9,10,0.95) 100%)",
                boxShadow: ed ? tk.cardShadow : undefined,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <motion.div
                aria-hidden
                animate={
                  reduceMotion
                    ? { opacity: 0.06 }
                    : { opacity: [0.05, 0.12, 0.07], x: [0, 6, 0] }
                }
                transition={{ duration: 5 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  inset: "-20%",
                  background: ed
                    ? "radial-gradient(circle at 30% 20%, rgba(37, 99, 235, 0.12), transparent 55%)"
                    : "radial-gradient(circle at 30% 20%, rgba(34,211,238,0.2), transparent 55%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--nx-font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: tk.textSoft,
                    fontWeight: 800,
                  }}
                >
                  {t("citadel.featureKicker")}
                </div>
                <h4 style={{ margin: "10px 0 0", fontSize: 22, fontWeight: 800, color: tk.text }}>
                  {f.title}
                </h4>
                <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.55, color: tk.textMuted }}>
                  {f.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 clamp(20px,4vw,48px) 64px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            borderRadius: 20,
            border: ed ? `1px solid ${tk.cardBorder}` : "1px solid rgba(214,181,111,0.28)",
            padding: "clamp(22px,4vw,36px)",
            background: ed
              ? "linear-gradient(125deg, #faf5ff 0%, #ffffff 50%, #eff6ff 100%)"
              : "linear-gradient(125deg, rgba(214,181,111,0.1) 0%, rgba(8,10,12,0.92) 55%, rgba(34,211,238,0.08) 100%)",
            boxShadow: ed ? tk.cardShadow : "inset 0 1px 0 rgba(251,247,239,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ minWidth: 0, flex: "1 1 280px" }}>
              <div
                style={{
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.2em",
                  color: ed ? "#7c3aed" : "rgba(214,181,111,0.9)",
                  fontWeight: 800,
                }}
              >
                {t("citadel.spotlightKicker")}
              </div>
              <h3
                style={{
                  margin: "10px 0 0",
                  fontSize: "clamp(22px,2.8vw,32px)",
                  fontWeight: 800,
                  color: tk.text,
                  letterSpacing: "-0.02em",
                }}
              >
                {t("citadel.spotlightTitle")}
              </h3>
              <p style={{ margin: "12px 0 0", fontSize: 17, lineHeight: 1.6, color: tk.textMuted }}>
                {t("citadel.spotlightBody")}
              </p>
            </div>
            <motion.div
              aria-hidden
              animate={reduceMotion ? {} : { boxShadow: ["0 0 0 rgba(34,211,238,0)", "0 0 48px rgba(34,211,238,0.25)", "0 0 0 rgba(34,211,238,0)"] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                flex: "0 0 auto",
                width: 160,
                height: 160,
                borderRadius: 22,
                border: `1px solid ${tk.cardBorder}`,
                background: ed
                  ? "repeating-linear-gradient(90deg, rgba(15,23,42,0.06) 0 1px, transparent 1px 14px), repeating-linear-gradient(0deg, rgba(15,23,42,0.05) 0 1px, transparent 1px 14px), #f8fafc"
                  : "repeating-linear-gradient(90deg, rgba(251,247,239,0.06) 0 1px, transparent 1px 14px), repeating-linear-gradient(0deg, rgba(251,247,239,0.05) 0 1px, transparent 1px 14px), rgba(0,0,0,0.45)",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--nx-font-mono)",
                fontSize: 13,
                letterSpacing: "0.12em",
                color: ed ? "#2563eb" : "rgba(34,211,238,0.85)",
                textTransform: "uppercase",
                fontWeight: 800,
              }}
            >
              LF
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section style={{ padding: "0 clamp(20px,4vw,48px) 64px" }}>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          style={{
            margin: "0 0 8px",
            textAlign: "center",
            fontSize: "clamp(24px,3vw,34px)",
            fontWeight: 780,
            color: tk.text,
          }}
        >
          {t("citadel.rankTitle")}
        </motion.h3>
        <p
          style={{
            margin: "0 auto 24px",
            maxWidth: 680,
            textAlign: "center",
            fontSize: 17,
            color: tk.textMuted,
            lineHeight: 1.55,
          }}
        >
          {t("citadel.rankLead")}
        </p>
        <div
          id={railId}
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 8,
            scrollSnapType: "x mandatory",
            maxWidth: 1100,
            margin: "0 auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              style={{
                flex: "0 0 min(78vw, 260px)",
                scrollSnapAlign: "start",
                borderRadius: 16,
                border: `1px solid ${tk.cardBorder}`,
                padding: "20px 18px",
                background: tk.card,
                boxShadow: ed ? tk.cardShadow : undefined,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 12,
                  color: ed ? "#7c3aed" : "rgba(214,181,111,0.85)",
                  fontWeight: 800,
                }}
              >
                {t(`citadel.ranks.${i}.tier`)}
              </div>
              <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800, color: tk.text }}>
                {t(`citadel.ranks.${i}.title`)}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.5, color: tk.textSoft }}>
                {t(`citadel.ranks.${i}.body`)}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 clamp(20px,4vw,48px) 72px" }}>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          style={{ margin: "0 0 22px", textAlign: "center", fontSize: "clamp(24px,3vw,34px)", fontWeight: 780, color: tk.text }}
        >
          {t("citadel.voicesTitle")}
        </motion.h3>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <motion.blockquote
            key={voiceIx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              margin: 0,
              fontSize: "clamp(18px,2.2vw,22px)",
              lineHeight: 1.55,
              fontWeight: 500,
              color: tk.textMuted,
            }}
          >
            “{voices[voiceIx]?.quote}”
          </motion.blockquote>
          <div style={{ marginTop: 16, fontSize: 15, color: tk.textSoft }}>
            <strong style={{ color: tk.text }}>{voices[voiceIx]?.name}</strong>
            <span style={{ marginLeft: 8 }}>· {voices[voiceIx]?.role}</span>
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "center" }}>
            {voices.map((v, i) => (
              <button
                key={v.name}
                type="button"
                onClick={() => setVoiceIx(i)}
                aria-label={t("citadel.voiceDotAria")}
                aria-current={i === voiceIx}
                style={{
                  width: i === voiceIx ? 28 : 10,
                  height: 10,
                  borderRadius: 999,
                  border: `1px solid ${tk.cardBorder}`,
                  background: i === voiceIx ? (ed ? "linear-gradient(90deg, #2563eb, #7c3aed)" : "linear-gradient(90deg, #22d3ee, #d6b56f)") : ed ? tk.purpleSoft : "rgba(251,247,239,0.12)",
                  cursor: "pointer",
                  padding: 0,
                  transition: "width 0.25s ease",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 clamp(20px,4vw,48px) 72px" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          style={{
            maxWidth: 920,
            margin: "0 auto",
            borderRadius: 18,
            border: `1px solid ${tk.cardBorder}`,
            padding: "24px 22px",
            background: tk.card,
            boxShadow: ed ? tk.cardShadow : undefined,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div
                style={{
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.14em",
                  color: ed ? "#2563eb" : "rgba(34,211,238,0.75)",
                  fontWeight: 800,
                }}
              >
                {t("citadel.patchKicker")}
              </div>
              <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800, color: tk.text }}>{t("citadel.patchTitle")}</div>
            </div>
            <div style={{ fontFamily: "var(--nx-font-mono)", fontSize: 13, color: tk.textSoft }}>{t("citadel.patchDate")}</div>
          </div>
          <ul style={{ margin: "16px 0 0", paddingLeft: 20, color: tk.textMuted, lineHeight: 1.6, fontSize: 16 }}>
            <li>{t("citadel.patchBullet1")}</li>
            <li style={{ marginTop: 8 }}>{t("citadel.patchBullet2")}</li>
            <li style={{ marginTop: 8 }}>{t("citadel.patchBullet3")}</li>
          </ul>
        </motion.div>
      </section>

      <section style={{ padding: "0 clamp(20px,4vw,48px) clamp(56px,10vw,120px)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          style={{
            maxWidth: 900,
            margin: "0 auto",
            textAlign: "center",
            padding: "clamp(32px,5vw,48px) clamp(24px,4vw,40px)",
            borderRadius: 24,
            border: ed ? `1px solid ${tk.cardBorder}` : "1px solid rgba(34,211,238,0.22)",
            background: ed
              ? "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)"
              : "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,0.12), transparent 55%), rgba(8,10,12,0.9)",
            boxShadow: ed ? tk.cardShadow : "0 40px 120px rgba(0,0,0,0.55)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "clamp(26px,3.2vw,36px)", fontWeight: 800, color: tk.text }}>
            {t("citadel.finalTitle")}
          </h3>
          <p style={{ margin: "14px auto 0", maxWidth: 560, fontSize: 18, lineHeight: 1.55, color: tk.textMuted }}>
            {t("citadel.finalLead")}
          </p>
          <div style={{ marginTop: 26, display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <motion.button
              type="button"
              onClick={scrollToCompanion}
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              style={{
                borderRadius: 999,
                border: ed ? "none" : "1px solid rgba(34,211,238,0.45)",
                background: ed ? "linear-gradient(125deg, #2563eb 0%, #1d4ed8 100%)" : "linear-gradient(130deg, rgba(34,211,238,0.32) 0%, rgba(10,14,16,0.95) 100%)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 17,
                padding: "14px 26px",
                cursor: "pointer",
                boxShadow: ed ? "0 10px 28px rgba(37, 99, 235, 0.22)" : undefined,
              }}
            >
              {t("citadel.finalCtaPrimary")}
            </motion.button>
            <motion.button
              type="button"
              onClick={onOpenMap}
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              style={{
                borderRadius: 999,
                border: ed ? "1px solid rgba(37, 99, 235, 0.35)" : "1px solid rgba(251,247,239,0.2)",
                background: ed ? "#ffffff" : "transparent",
                color: ed ? "#1d4ed8" : "rgba(251,247,239,0.88)",
                fontWeight: 700,
                fontSize: 17,
                padding: "14px 26px",
                cursor: "pointer",
              }}
            >
              {t("citadel.finalCtaSecondary")}
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
