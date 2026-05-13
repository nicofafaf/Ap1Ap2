import { motion, useReducedMotion } from "framer-motion";
import { useId, useMemo } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import { CURRICULUM_BY_LF } from "../../lib/learning/learningRegistry";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { useGameStore } from "../../store/useGameStore";
import { MentorPortrait } from "../ui/MentorPortrait";

const N = 12;
const VB = 300;
const CX = VB / 2;
const CY = VB / 2;
const R = 118;
const LABEL_R = 138;

const TUNGSTEN_GOLD = "rgba(214, 181, 111, 0.98)";
const TUNGSTEN_GOLD_SOFT = "rgba(214, 181, 111, 0.42)";
const NEON_GRID = "rgba(34, 211, 238, 0.55)";
const NEON_FILL = "rgba(34, 211, 238, 0.14)";
const NEON_STROKE = "rgba(34, 211, 238, 0.72)";

function angleForIndex(i: number): number {
  return -Math.PI / 2 + (i * 2 * Math.PI) / N;
}

function polar(ix: number, radius: number): { x: number; y: number } {
  const a = angleForIndex(ix);
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
}

function useRadarSeries(): { values: number[]; mastered: boolean[] } {
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const masteryChecks = useGameStore((s) => s.campaign.masteryChecks);
  const initialSkillScanByLf = useGameStore((s) => s.initialSkillScanByLf);
  const initialSkillScanComplete = useGameStore((s) => s.initialSkillScanComplete);

  return useMemo(() => {
    const values: number[] = [];
    const mastered: boolean[] = [];
    for (let lf = 1; lf <= N; lf += 1) {
      const key = `LF${lf}` as LearningField;
      if (masteryChecks[key]) {
        values.push(1);
        mastered.push(true);
        continue;
      }
      mastered.push(false);
      const curriculum = CURRICULUM_BY_LF[key] ?? [];
      const have = new Set(learningCorrectByLf[key] ?? []);
      const correct = curriculum.filter((e) => have.has(e.id)).length;
      const total = curriculum.length;
      let ratio = total > 0 ? correct / total : 0;
      if (initialSkillScanComplete) {
        const scan = initialSkillScanByLf[key];
        if (scan === false) {
          ratio = Math.max(0.06, ratio * 0.68 - 0.06);
        } else if (scan === true) {
          ratio = Math.max(ratio, 0.36 + ratio * 0.42);
        }
      } else {
        ratio = Math.max(0.1, ratio * 0.92 + 0.04);
      }
      values.push(Math.min(0.98, Math.max(0.07, ratio)));
    }
    return { values, mastered };
  }, [learningCorrectByLf, masteryChecks, initialSkillScanByLf, initialSkillScanComplete]);
}

function weakestLfIndex(values: number[], mastered: boolean[]): number {
  const scored = values.map((v, i) => ({ v, i }));
  const open = scored.filter((_, i) => !mastered[i]);
  const pool = open.length ? open : scored;
  let best = pool[0] ?? { v: 1, i: 0 };
  for (const row of pool) {
    if (row.v < best.v) best = row;
  }
  return best.i;
}

export type SkillRadarProps = {
  epilogueActive?: boolean;
  /** default: floating card · rail: right column on map · compact: bottom dock */
  layoutVariant?: "default" | "rail" | "compact";
};

export function SkillRadar({
  epilogueActive = false,
  layoutVariant = "default",
}: SkillRadarProps) {
  const uid = useId().replace(/:/g, "");
  const filterGold = `nx-skill-radar-gold-${uid}`;
  const filterNeon = `nx-skill-radar-neon-${uid}`;
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const playerAvatar = useGameStore((s) => s.playerAvatar);
  const mentorWaifuIndex = useGameStore((s) => s.mentorWaifuIndex);
  const avatarN = playerAvatar ?? mentorWaifuIndex ?? 1;

  const { values, mastered } = useRadarSeries();
  const weakIx = useMemo(() => weakestLfIndex(values, mastered), [values, mastered]);
  const weakLf = weakIx + 1;
  const allMastered = mastered.every(Boolean);

  const coachLine = useMemo(() => {
    if (allMastered) {
      return t("map.skillRadarCoachClear", "Alle zwölf Strahlen im Zielkorridor");
    }
    const lfSpecificKey = `map.skillRadarCoachLF${weakLf}`;
    const specific = t(lfSpecificKey);
    if (specific !== lfSpecificKey && specific.trim().length > 0) {
      return specific;
    }
    const raw = t(
      "map.skillRadarCoachWeak",
      "Schwächster Strahl LF{lf} dort Fokus setzen oder Sektor scannen"
    );
    return raw.replace(/\{lf\}/g, String(weakLf));
  }, [allMastered, t, weakLf]);

  const polygonPoints = useMemo(() => {
    return values
      .map((val, i) => {
        const { x, y } = polar(i, R * val);
        return `${x},${y}`;
      })
      .join(" ");
  }, [values]);

  const vertexDots = useMemo(() => {
    return values.map((val, i) => {
      const { x, y } = polar(i, R * val);
      return { x, y, mastered: mastered[i]!, val };
    });
  }, [values, mastered]);

  const pulseTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const };

  const glassBg = epilogueActive
    ? "linear-gradient(155deg, rgba(255,252,246,0.22) 0%, rgba(250,236,210,0.14) 48%, rgba(255,252,246,0.12) 100%)"
    : "linear-gradient(155deg, rgba(8, 14, 18, 0.78) 0%, rgba(12, 22, 18, 0.62) 52%, rgba(6, 10, 12, 0.72) 100%)";
  const glassBorder = epilogueActive
    ? "1px solid rgba(212, 175, 55, 0.38)"
    : "1px solid rgba(214, 181, 111, 0.26)";
  const labelAp1 = epilogueActive ? "rgba(42, 92, 72, 0.95)" : "rgba(110, 232, 255, 0.92)";
  const labelAp2 = epilogueActive ? "rgba(92, 62, 120, 0.92)" : "rgba(196, 181, 253, 0.9)";
  const coachInk = epilogueActive ? "rgba(55, 44, 26, 0.94)" : "rgba(248, 244, 232, 0.92)";
  const coachBubble = epilogueActive
    ? "rgba(255, 252, 246, 0.82)"
    : "rgba(10, 16, 20, 0.88)";

  const svgHeavyBlur = !reduceMotion;
  const isRail = layoutVariant === "rail";
  const isCompact = layoutVariant === "compact";

  return (
    <div
      aria-label={t("map.skillRadarAria", "Holovektor zwölf Lernfelder")}
      style={{
        pointerEvents: "none",
        display: "flex",
        flexDirection: isRail ? "column" : "row",
        alignItems: isRail ? "stretch" : "flex-start",
        gap: isRail ? 14 : 14,
        maxWidth: isRail ? "100%" : 420,
        width: isRail ? "100%" : undefined,
        padding: isRail ? "10px 8px 12px" : isCompact ? "12px 14px 14px" : "14px 16px 16px",
        borderRadius: isRail ? 18 : 24,
        background: glassBg,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: glassBorder,
        boxShadow: epilogueActive
          ? "inset 0 1px 0 rgba(255,255,255,0.5), 0 16px 48px rgba(120, 90, 40, 0.18)"
          : "inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 52px rgba(0,0,0,0.42)",
      }}
    >
      <div
        style={{
          flex: isRail ? "0 0 auto" : "0 0 220px",
          width: isRail ? "100%" : undefined,
          display: "flex",
          flexDirection: "column",
          alignItems: isRail ? "stretch" : "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            overflow: "hidden",
            border: epilogueActive
              ? "1px solid rgba(212, 175, 55, 0.45)"
              : "1px solid rgba(214, 181, 111, 0.35)",
            boxShadow: epilogueActive
              ? "0 0 18px rgba(212, 175, 55, 0.35)"
              : "0 0 22px rgba(34, 211, 238, 0.18)",
          }}
        >
          <MentorPortrait
            mentorId={avatarN}
            size={56}
            radius={18}
            border={
              epilogueActive
                ? "1px solid rgba(212, 175, 55, 0.45)"
                : "1px solid rgba(214, 181, 111, 0.35)"
            }
            boxShadow={
              epilogueActive
                ? "0 0 18px rgba(212, 175, 55, 0.35)"
                : "0 0 22px rgba(34, 211, 238, 0.18)"
            }
          />
        </div>
        <div
          style={{
            width: "100%",
            padding: "12px 12px 14px",
            borderRadius: 16,
            background: coachBubble,
            border: epilogueActive
              ? "1px solid rgba(202, 165, 80, 0.35)"
              : "1px solid rgba(34, 211, 238, 0.22)",
            fontFamily: "var(--nx-font-mono)",
            fontSize: isRail ? "var(--nx-nexus-map-body-min)" : 20,
            fontWeight: 650,
            lineHeight: 1.38,
            letterSpacing: "-0.02em",
            color: coachInk,
            textAlign: "left",
            hyphens: "auto",
            overflowWrap: "break-word",
          }}
        >
          {coachLine}
        </div>
      </div>

      <div style={{ flex: "1 1 auto", minWidth: 0, width: isRail ? "100%" : undefined }}>
        <div
          style={{
            fontFamily: "var(--nx-font-mono)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: epilogueActive ? "rgba(120, 90, 40, 0.85)" : "var(--nx-nexus-cyan-soft)",
            marginBottom: 6,
          }}
        >
          {t("map.skillRadarTitle", "Holovektor")}
        </div>
        <div
          style={{
            fontFamily: "var(--nx-font-sans)",
            fontSize: isRail ? "var(--nx-nexus-map-body-min)" : 13,
            fontWeight: 600,
            color: epilogueActive ? "rgba(80, 64, 38, 0.78)" : "var(--nx-nexus-map-muted)",
            marginBottom: 8,
            letterSpacing: "0.02em",
          }}
        >
          {t("map.skillRadarSubtitle", "Scan plus Übungen plus Kern")}
        </div>
        <svg
          width="100%"
          viewBox={`0 0 ${VB} ${VB}`}
          style={{ display: "block", maxHeight: isRail ? 200 : 220 }}
          aria-hidden
        >
          {svgHeavyBlur ? (
            <defs>
              <filter id={filterGold} x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="2.4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={filterNeon} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.2" result="n" />
                <feMerge>
                  <feMergeNode in="n" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          ) : null}

          <motion.g
            animate={reduceMotion ? undefined : { opacity: [0.38, 0.72, 0.38] }}
            transition={pulseTransition}
          >
            {[0.25, 0.5, 0.75, 1].map((tRing) => {
              const pts = Array.from({ length: N }, (_, i) => polar(i, R * tRing));
              const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
              return (
                <path
                  key={`ring-${tRing}`}
                  d={d}
                  fill="none"
                  stroke={NEON_GRID}
                  strokeWidth={tRing === 1 ? 1.15 : 0.75}
                  strokeOpacity={tRing === 1 ? 0.55 : 0.35}
                />
              );
            })}
            {Array.from({ length: N }, (_, i) => {
              const { x, y } = polar(i, R);
              return (
                <line
                  key={`spoke-${i}`}
                  x1={CX}
                  y1={CY}
                  x2={x}
                  y2={y}
                  stroke={NEON_GRID}
                  strokeWidth={0.85}
                  strokeOpacity={0.4}
                />
              );
            })}
          </motion.g>

          <motion.polygon
            points={polygonPoints}
            fill={NEON_FILL}
            stroke={NEON_STROKE}
            strokeWidth={1.4}
            filter={svgHeavyBlur ? `url(#${filterNeon})` : undefined}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />

          {vertexDots.map((dot, i) =>
            dot.mastered ? (
              <motion.circle
                key={`gold-${i}`}
                cx={dot.x}
                cy={dot.y}
                r={5.5}
                fill={TUNGSTEN_GOLD}
                stroke={TUNGSTEN_GOLD_SOFT}
                strokeWidth={1.2}
                filter={svgHeavyBlur ? `url(#${filterGold})` : undefined}
                animate={reduceMotion ? undefined : { opacity: [0.82, 1, 0.82], r: [5.2, 6.4, 5.2] }}
                transition={reduceMotion ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : null
          )}

          {Array.from({ length: N }, (_, i) => {
            const { x, y } = polar(i, LABEL_R);
            const label = `LF${i + 1}`;
            return (
              <text
                key={label}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={i < 6 ? labelAp1 : labelAp2}
                style={{
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                }}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
