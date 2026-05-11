import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useId, useMemo, useState } from "react";
import { useBossAudioEngine } from "../../lib/audio/bossAudioEngine";
import {
  getTalentMultiplierForPath,
  talentUpgradeCost,
  useGameStore,
  type TalentPathId,
} from "../../store/useGameStore";
import { ARCHITECT_CHROMA_LABELS } from "../../lib/ui/architectChromas";

type PathMeta = {
  label: string;
  tag: string;
  hue: string;
  cx: number;
  cy: number;
};

const PATH_LAYOUT: Record<TalentPathId, PathMeta> = {
  overclock: { label: "Overclock", tag: "Schaden", hue: "#f472b6", cx: 200, cy: 72 },
  firewall: { label: "Firewall", tag: "Schild", hue: "#22d3ee", cx: 72, cy: 292 },
  throughput: { label: "Throughput", tag: "Zug", hue: "#a78bfa", cx: 328, cy: 292 },
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CoreAugmentations({ open, onClose }: Props) {
  const { playCoreAugment } = useBossAudioEngine();
  const nexusFragments = useGameStore((s) => s.nexusFragments);
  const hardcoreDriftEnabled = useGameStore((s) => s.hardcoreDriftEnabled);
  const setHardcoreDriftEnabled = useGameStore((s) => s.setHardcoreDriftEnabled);
  const talentLevels = useGameStore((s) => s.talentLevels);
  const upgradeTalentPath = useGameStore((s) => s.upgradeTalentPath);
  const architectChromaActive = useGameStore((s) => s.architectChromaActive);
  const architectChromaUnlocks = useGameStore((s) => s.architectChromaUnlocks);
  const setArchitectChroma = useGameStore((s) => s.setArchitectChroma);
  const readabilityMode = useGameStore((s) => s.readabilityMode);
  const setReadabilityMode = useGameStore((s) => s.setReadabilityMode);
  const reactId = useId();
  const filterId = `coreFlow-${reactId.replace(/:/g, "")}`;
  const glowId = `coreGlow-${reactId.replace(/:/g, "")}`;

  const [pulseToken, setPulseToken] = useState<Record<TalentPathId, number>>({
    overclock: 0,
    firewall: 0,
    throughput: 0,
  });

  const onUpgrade = useCallback(
    (path: TalentPathId) => {
      const ok = upgradeTalentPath(path);
      if (ok) {
        void playCoreAugment();
        setPulseToken((p) => ({ ...p, [path]: p[path] + 1 }));
      }
    },
    [upgradeTalentPath, playCoreAugment]
  );

  const circuitPaths = useMemo(() => {
    const hub = { x: 200, y: 200 };
    return (Object.keys(PATH_LAYOUT) as TalentPathId[]).map((id) => {
      const n = PATH_LAYOUT[id];
      const mx = (hub.x + n.cx) / 2 + (id === "overclock" ? 0 : id === "firewall" ? -22 : 22);
      const my = (hub.y + n.cy) / 2 + (id === "throughput" ? 12 : -6);
      return {
        id,
        d: `M ${hub.x} ${hub.y} Q ${mx} ${my} ${n.cx} ${n.cy}`,
        hue: n.hue,
      };
    });
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="core-aug-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            background: "rgba(2, 8, 14, 0.72)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Neural Core Augmentations"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(520px, 100%)",
              maxHeight: "min(640px, 92vh)",
              overflow: "auto",
              borderRadius: 16,
              border: "1px solid rgba(34, 211, 238, 0.38)",
              background:
                "linear-gradient(165deg, rgba(6, 18, 28, 0.96) 0%, rgba(3, 10, 18, 0.98) 100%)",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.55), 0 0 40px rgba(34, 211, 238, 0.12), inset 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 2,
                borderRadius: 8,
                border: "1px solid rgba(148, 163, 184, 0.35)",
                background: "rgba(15, 23, 42, 0.6)",
                color: "rgba(226, 232, 240, 0.95)",
                fontSize: 11,
                letterSpacing: ".14em",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              Schließen
            </button>

            <div style={{ padding: "20px 20px 16px" }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: ".32em",
                  color: "rgba(103, 232, 249, 0.78)",
                }}
              >
                Neural Augmentation System
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  color: "rgba(224, 250, 255, 0.96)",
                }}
              >
                Core-Schaltkreis
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  opacity: 0.76,
                  lineHeight: 1.45,
                  color: "rgba(186, 230, 253, 0.88)",
                }}
              >
                Verbundene Pfade: Overclock, Firewall, Throughput — Nexus-Fragmente für permanente Buffs
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(167, 139, 250, 0.35)",
                  background: "rgba(15, 23, 42, 0.45)",
                }}
              >
                <span style={{ fontSize: 10, letterSpacing: ".2em", opacity: 0.75 }}>Nexus-Fragmente</span>
                <strong style={{ fontSize: 16, letterSpacing: ".06em", color: "#e9d5ff" }}>
                  {nexusFragments}
                </strong>
              </div>
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,55,48,0.48)",
                  background: "rgba(48,10,12,0.55)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: ".24em",
                    color: "rgba(255,130,120,0.95)",
                  }}
                >
                  HARDCORE DRIFT
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    lineHeight: 1.45,
                    color: "rgba(254,226,225,0.82)",
                  }}
                >
                  Niederlage: −5 % permanente Nexus-Fragmente · Sieg: doppelter Fragment-Gewinn
                </div>
                <button
                  type="button"
                  onClick={() => setHardcoreDriftEnabled(!hardcoreDriftEnabled)}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    borderRadius: 8,
                    border: hardcoreDriftEnabled
                      ? "1px solid rgba(255,90,80,0.85)"
                      : "1px solid rgba(255,55,48,0.5)",
                    background: hardcoreDriftEnabled
                      ? "rgba(90,12,14,0.88)"
                      : "rgba(28,6,8,0.72)",
                    color: "rgba(255,230,228,0.96)",
                    fontSize: 11,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    padding: "10px 12px",
                    cursor: "pointer",
                  }}
                >
                  {hardcoreDriftEnabled ? "Modus aktiv — deaktivieren" : "Hardcore aktivieren"}
                </button>
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(34, 211, 238, 0.35)",
                  background: "rgba(15, 23, 42, 0.5)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: ".24em",
                    color: "rgba(186, 230, 253, 0.9)",
                  }}
                >
                  LESEMODUS
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    lineHeight: 1.45,
                    color: "rgba(186, 230, 253, 0.82)",
                  }}
                >
                  Schaltet Partikel und Licht-Sweeps ab — höherer Kontrast, ruhiger Hintergrund
                </div>
                <button
                  type="button"
                  onClick={() => setReadabilityMode(!readabilityMode)}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    borderRadius: 8,
                    border: readabilityMode
                      ? "1px solid rgba(34, 211, 238, 0.65)"
                      : "1px solid rgba(100, 116, 139, 0.45)",
                    background: readabilityMode
                      ? "rgba(8, 44, 58, 0.85)"
                      : "rgba(15, 23, 42, 0.72)",
                    color: "rgba(224, 250, 255, 0.96)",
                    fontSize: 11,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    padding: "10px 12px",
                    cursor: "pointer",
                  }}
                >
                  {readabilityMode ? "Lesemodus aktiv — aus" : "Lesemodus aktivieren"}
                </button>
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid color-mix(in srgb, var(--violet, #a78bfa) 42%, transparent)",
                  background: "rgba(15, 23, 42, 0.5)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: ".24em",
                    color: "color-mix(in srgb, var(--violet, #a78bfa) 90%, transparent)",
                  }}
                >
                  ARCHITECT CHROMAS
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 10,
                    lineHeight: 1.45,
                    color: "rgba(186, 230, 253, 0.78)",
                  }}
                >
                  Global UI via CSS-Variablen — sofort aktiv ohne Re-Render-Welle
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {(["default", "deepsea-neon", "monochrome-glitch"] as const).map((id) => {
                    const unlocked = architectChromaUnlocks[id];
                    const active = architectChromaActive === id;
                    const meta = ARCHITECT_CHROMA_LABELS[id];
                    return (
                      <motion.button
                        key={id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => setArchitectChroma(id)}
                        whileHover={unlocked ? { scale: 1.01 } : undefined}
                        whileTap={unlocked ? { scale: 0.99 } : undefined}
                        style={{
                          textAlign: "left",
                          borderRadius: 10,
                          border: active
                            ? "1px solid color-mix(in srgb, var(--cyan, #22d3ee) 70%, transparent)"
                            : "1px solid rgba(100, 116, 139, 0.35)",
                          background: active
                            ? "color-mix(in srgb, var(--cyan, #22d3ee) 12%, rgba(15,23,42,0.65))"
                            : "rgba(15, 23, 42, 0.42)",
                          padding: "10px 12px",
                          cursor: unlocked ? "pointer" : "not-allowed",
                          opacity: unlocked ? 1 : 0.45,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: ".1em",
                            color: "rgba(248, 250, 252, 0.94)",
                          }}
                        >
                          {meta.title}
                          {active ? " · aktiv" : ""}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 9, color: "rgba(148, 163, 184, 0.88)" }}>
                          {unlocked ? meta.hint : "Noch gesperrt"}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ padding: "0 12px 20px", display: "flex", justifyContent: "center" }}>
              <svg
                width={360}
                height={320}
                viewBox="0 0 400 360"
                style={{ display: "block", maxWidth: "100%" }}
              >
                <defs>
                  <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.042"
                      numOctaves="2"
                      seed="4"
                      result="noise"
                    >
                      <animate
                        attributeName="baseFrequency"
                        dur="7s"
                        values="0.034;0.068;0.034"
                        repeatCount="indefinite"
                      />
                    </feTurbulence>
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="noise"
                      scale="8"
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                  </filter>
                  <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="2.4" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {circuitPaths.map((seg) => (
                  <path
                    key={seg.id}
                    d={seg.d}
                    fill="none"
                    stroke={seg.hue}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    opacity={0.82}
                    filter={`url(#${filterId})`}
                  />
                ))}

                <circle
                  cx={200}
                  cy={200}
                  r={36}
                  fill="rgba(8, 20, 32, 0.92)"
                  stroke="rgba(34, 211, 238, 0.5)"
                  strokeWidth={2}
                  filter={`url(#${glowId})`}
                />
                <text
                  x={200}
                  y={196}
                  textAnchor="middle"
                  fill="rgba(224, 250, 255, 0.92)"
                  style={{ fontSize: 11, letterSpacing: "0.24em" }}
                >
                  NEXUS
                </text>
                <text
                  x={200}
                  y={212}
                  textAnchor="middle"
                  fill="rgba(103, 232, 249, 0.75)"
                  style={{ fontSize: 8, letterSpacing: "0.18em" }}
                >
                  CORE
                </text>

                {(Object.keys(PATH_LAYOUT) as TalentPathId[]).map((pid) => {
                  const n = PATH_LAYOUT[pid];
                  const level = talentLevels[pid];
                  const cost = talentUpgradeCost(level);
                  const affordable = nexusFragments >= cost;
                  const mult = getTalentMultiplierForPath(pid, level);
                  const bonusPct = Math.round((mult - 1) * 100);
                  const progressToNext = Math.min(1, nexusFragments / Math.max(1, cost));
                  const barTarget = Math.min(1, 0.12 + progressToNext * 0.88);

                  return (
                    <g key={pid}>
                      <circle
                        cx={n.cx}
                        cy={n.cy}
                        r={18}
                        fill="rgba(6, 16, 26, 0.95)"
                        stroke={n.hue}
                        strokeWidth={1.6}
                        opacity={0.95}
                      />
                      <foreignObject x={n.cx - 110} y={n.cy + 26} width={220} height={120}>
                        <div
                          style={{
                            fontFamily: "system-ui, sans-serif",
                            color: "#e2e8f0",
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: n.hue }}>
                            {n.label}
                          </div>
                          <div style={{ fontSize: 10, opacity: 0.72, marginTop: 2 }}>{n.tag}</div>
                          <div style={{ marginTop: 8, fontSize: 10, opacity: 0.8 }}>
                            Stufe {level} · Kern +{bonusPct}%
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              height: 8,
                              borderRadius: 999,
                              background: "rgba(15, 23, 42, 0.85)",
                              border: `1px solid ${n.hue}33`,
                              overflow: "hidden",
                              position: "relative",
                            }}
                          >
                            <motion.div
                              key={`${pid}-${pulseToken[pid]}`}
                              initial={{ width: "0%" }}
                              animate={{ width: `${Math.round(barTarget * 100)}%` }}
                              transition={{ type: "spring", stiffness: 200, damping: 22 }}
                              style={{
                                height: "100%",
                                borderRadius: 999,
                                background: `linear-gradient(90deg, ${n.hue}55, ${n.hue})`,
                                boxShadow: `0 0 12px ${n.hue}88`,
                              }}
                            />
                            <motion.div
                              key={`pulse-${pid}-${pulseToken[pid]}`}
                              aria-hidden
                              initial={{ opacity: 0.35, x: "-45%" }}
                              animate={{
                                opacity: [0.25, 0.92, 0.2],
                                x: ["-45%", "130%"],
                              }}
                              transition={{ duration: 0.95, ease: "easeOut" }}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                height: "100%",
                                width: "38%",
                                background: `linear-gradient(90deg, transparent, ${n.hue}cc, transparent)`,
                                pointerEvents: "none",
                              }}
                            />
                          </div>
                          <motion.button
                            type="button"
                            disabled={!affordable}
                            onClick={() => onUpgrade(pid)}
                            whileHover={affordable ? { scale: 1.02 } : undefined}
                            whileTap={affordable ? { scale: 0.98 } : undefined}
                            style={{
                              marginTop: 8,
                              width: "100%",
                              borderRadius: 8,
                              border: `1px solid ${affordable ? n.hue : "rgba(100,116,139,0.4)"}`,
                              background: affordable ? `linear-gradient(180deg, ${n.hue}22, rgba(15,23,42,0.5))` : "rgba(30,41,59,0.45)",
                              color: affordable ? "rgba(248,250,252,0.96)" : "rgba(148,163,184,0.7)",
                              fontSize: 10,
                              letterSpacing: ".14em",
                              padding: "8px 10px",
                              cursor: affordable ? "pointer" : "not-allowed",
                            }}
                          >
                            Upgrade · {cost} NF
                          </motion.button>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default CoreAugmentations;
