import { motion, useReducedMotion } from "framer-motion";
import { useId, useMemo, useState } from "react";
import type { NexusRegistryEntry } from "../../data/nexusRegistry";

export type NetplanMultiverse = "starwars" | "anime" | "gym";
export type NetplanScenario = "destroyer" | "flagship" | "boss-buffer";

const TUNGSTEN_GOLD = "rgba(214, 181, 111, 0.98)";
const TUNGSTEN_GOLD_SOFT = "rgba(184, 148, 48, 0.55)";

const MULTIVERSE = {
  starwars: {
    edge: "rgba(34, 211, 238, 0.82)",
    nodeFill: "rgba(6, 14, 22, 0.92)",
    nodeStroke: "rgba(34, 211, 238, 0.55)",
    glow: "rgba(34, 211, 238, 0.28)",
    label: "rgba(224, 250, 255, 0.92)",
  },
  anime: {
    edge: "rgba(244, 114, 182, 0.88)",
    nodeFill: "rgba(18, 8, 24, 0.92)",
    nodeStroke: "rgba(232, 121, 249, 0.62)",
    glow: "rgba(244, 114, 182, 0.3)",
    label: "rgba(253, 224, 255, 0.94)",
  },
  gym: {
    edge: "rgba(212, 175, 55, 0.5)",
    nodeFill: "rgba(10, 8, 6, 0.94)",
    nodeStroke: "rgba(214, 181, 111, 0.45)",
    glow: "rgba(214, 181, 111, 0.22)",
    label: "rgba(251, 247, 239, 0.9)",
  },
} as const;

type NodeModel = {
  id: string;
  label: string;
  sub: string;
  faz: number;
  fez: number;
  saz: number;
  sez: number;
  buffer?: number;
  critical: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
};

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
  markerId,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  markerId: string;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={2.2}
      markerEnd={`url(#${markerId})`}
      style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.35))" }}
    />
  );
}

function HologramNode({
  n,
  palette,
  hovered,
  onHover,
  reduceMotion,
}: {
  n: NodeModel;
  palette: (typeof MULTIVERSE)[NetplanMultiverse];
  hovered: string | null;
  onHover: (id: string | null) => void;
  reduceMotion: boolean | null;
}) {
  const stroke = n.critical ? TUNGSTEN_GOLD : palette.nodeStroke;
  const fill = n.critical ? "rgba(24, 20, 12, 0.88)" : palette.nodeFill;
  const strokeW = n.critical ? 2.4 : 1.6;
  const glow = n.critical ? `0 0 18px ${TUNGSTEN_GOLD_SOFT}` : `0 0 14px ${palette.glow}`;
  const showBuffer = hovered === n.id && n.buffer != null && n.buffer > 0;

  return (
    <motion.g
      onPointerEnter={() => onHover(n.id)}
      onPointerLeave={() => onHover(null)}
      whileHover={reduceMotion ? undefined : { scale: 1.03 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      style={{ cursor: n.buffer ? "pointer" : "default" }}
    >
      <rect
        x={n.x}
        y={n.y}
        width={n.w}
        height={n.h}
        rx={14}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeW}
        style={{ filter: `drop-shadow(${glow})` }}
      />
      {showBuffer ? (
        <rect
          x={n.x - 4}
          y={n.y - 4}
          width={n.w + 8}
          height={n.h + 8}
          rx={18}
          fill="none"
          stroke={palette.edge}
          strokeWidth={2}
          strokeDasharray="6 4"
          opacity={0.95}
        />
      ) : null}
      <text
        x={n.x + n.w / 2}
        y={n.y + 22}
        textAnchor="middle"
        fill={n.critical ? TUNGSTEN_GOLD : palette.label}
        style={{
          fontFamily: "var(--nx-font-mono, ui-monospace, monospace)",
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: "0.06em",
        }}
      >
        {n.label}
      </text>
      <text
        x={n.x + n.w / 2}
        y={n.y + 40}
        textAnchor="middle"
        fill={n.critical ? "rgba(251,247,239,0.72)" : "rgba(251,247,239,0.55)"}
        style={{
          fontFamily: "var(--nx-font-sans, system-ui)",
          fontSize: 14,
          fontWeight: 650,
        }}
      >
        {n.sub}
      </text>
      <text
        x={n.x + n.w / 2}
        y={n.y + 62}
        textAnchor="middle"
        fill="rgba(251,247,239,0.58)"
        style={{
          fontFamily: "var(--nx-font-mono, ui-monospace, monospace)",
          fontSize: 14,
          fontWeight: 650,
        }}
      >
        {`FAZ ${n.faz} · FEZ ${n.fez}`}
      </text>
      <text
        x={n.x + n.w / 2}
        y={n.y + 80}
        textAnchor="middle"
        fill="rgba(251,247,239,0.5)"
        style={{
          fontFamily: "var(--nx-font-mono, ui-monospace, monospace)",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {`SAZ ${n.saz} · SEZ ${n.sez}`}
      </text>
      {n.buffer != null && n.buffer > 0 ? (
        <text
          x={n.x + n.w / 2}
          y={n.y + n.h - 8}
          textAnchor="middle"
          fill={hovered === n.id ? palette.edge : "rgba(251,247,239,0.38)"}
          style={{
            fontFamily: "var(--nx-font-mono, ui-monospace, monospace)",
            fontSize: 14,
            fontWeight: 750,
          }}
        >
          {`Puffer ${n.buffer}`}
        </text>
      ) : null}
    </motion.g>
  );
}

function useNodesForScenario(scenario: NetplanScenario): { nodes: NodeModel[]; edges: [string, string][]; merge: { x: number; y: number } | null } {
  return useMemo(() => {
    if (scenario === "destroyer") {
      const nodes: NodeModel[] = [
        {
          id: "triebwerk",
          label: "TRIEBWERK",
          sub: "4 Tage parallel",
          faz: 0,
          fez: 4,
          saz: 1,
          sez: 5,
          buffer: 1,
          critical: false,
          x: 24,
          y: 28,
          w: 148,
          h: 102,
        },
        {
          id: "panzerung",
          label: "PANZERUNG",
          sub: "5 Tage parallel",
          faz: 0,
          fez: 5,
          saz: 0,
          sez: 5,
          critical: true,
          x: 24,
          y: 152,
          w: 148,
          h: 102,
        },
        {
          id: "waffen",
          label: "WAFFEN",
          sub: "3 Tage nach Merge",
          faz: 5,
          fez: 8,
          saz: 5,
          sez: 8,
          critical: true,
          x: 312,
          y: 90,
          w: 168,
          h: 102,
        },
      ];
      return {
        nodes,
        edges: [
          ["triebwerk", "merge"],
          ["panzerung", "merge"],
          ["merge", "waffen"],
        ],
        merge: { x: 228, y: 141 },
      };
    }
    if (scenario === "flagship") {
      const nodes: NodeModel[] = [
        {
          id: "a",
          label: "ABNAHME A",
          sub: "2 Tage parallel",
          faz: 0,
          fez: 2,
          saz: 3,
          sez: 5,
          buffer: 3,
          critical: false,
          x: 24,
          y: 28,
          w: 148,
          h: 102,
        },
        {
          id: "b",
          label: "ABNAHME B",
          sub: "5 Tage parallel",
          faz: 0,
          fez: 5,
          saz: 0,
          sez: 5,
          critical: true,
          x: 24,
          y: 152,
          w: 148,
          h: 102,
        },
        {
          id: "c",
          label: "ABNAHME C",
          sub: "4 Tage nach Merge",
          faz: 5,
          fez: 9,
          saz: 5,
          sez: 9,
          critical: true,
          x: 312,
          y: 90,
          w: 168,
          h: 102,
        },
      ];
      return {
        nodes,
        edges: [
          ["a", "merge"],
          ["b", "merge"],
          ["merge", "c"],
        ],
        merge: { x: 228, y: 141 },
      };
    }
    /* boss-buffer */
    const nodes: NodeModel[] = [
      {
        id: "kritisch",
        label: "KRITISCHER PFAD",
        sub: "12 Tage bis Meilenstein",
        faz: 0,
        fez: 12,
        saz: 0,
        sez: 12,
        critical: true,
        x: 24,
        y: 36,
        w: 200,
        h: 88,
      },
      {
        id: "neben",
        label: "NEBENPFAD",
        sub: "7 Tage Arbeit",
        faz: 0,
        fez: 7,
        saz: 0,
        sez: 12,
        buffer: 5,
        critical: false,
        x: 24,
        y: 152,
        w: 200,
        h: 102,
      },
      {
        id: "ende",
        label: "MEILENSTEIN",
        sub: "Gemeinsames Ende",
        faz: 12,
        fez: 12,
        saz: 12,
        sez: 12,
        critical: true,
        x: 300,
        y: 94,
        w: 168,
        h: 102,
      },
    ];
    return {
      nodes,
      edges: [
        ["kritisch", "ende"],
        ["neben", "ende"],
      ],
      merge: null,
    };
  }, [scenario]);
}

export type NetplanVisualizerProps = {
  scenario: NetplanScenario;
  multiverse: NetplanMultiverse;
};

export function NetplanVisualizer({ scenario, multiverse }: NetplanVisualizerProps) {
  const uid = useId().replace(/:/g, "");
  const markerNeonId = `nx-net-neon-${uid}`;
  const markerGoldId = `nx-net-gold-${uid}`;
  const palette = MULTIVERSE[multiverse];
  const [hovered, setHovered] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const { nodes, edges, merge } = useNodesForScenario(scenario);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const edgeStroke = (a: string, b: string): { color: string; markerId: string } => {
    const na = a === "merge" ? null : byId.get(a);
    const nb = b === "merge" ? null : byId.get(b);
    const touchesMerge = a === "merge" || b === "merge";
    if (touchesMerge) {
      if (a === "merge") {
        return nb?.critical
          ? { color: TUNGSTEN_GOLD, markerId: markerGoldId }
          : { color: palette.edge, markerId: markerNeonId };
      }
      return na?.critical
        ? { color: TUNGSTEN_GOLD, markerId: markerGoldId }
        : { color: palette.edge, markerId: markerNeonId };
    }
    const bothCritical = Boolean(na?.critical && nb?.critical);
    return bothCritical
      ? { color: TUNGSTEN_GOLD, markerId: markerGoldId }
      : { color: palette.edge, markerId: markerNeonId };
  };

  const lineEnds = (from: string, to: string): { x1: number; y1: number; x2: number; y2: number } | null => {
    const anchorOut = (id: string) => {
      if (id === "merge" && merge) return { x: merge.x, y: merge.y };
      const n = byId.get(id);
      if (!n) return { x: 0, y: 0 };
      return { x: n.x + n.w, y: n.y + n.h / 2 };
    };
    const anchorIn = (id: string) => {
      if (id === "merge" && merge) return { x: merge.x, y: merge.y };
      const n = byId.get(id);
      if (!n) return { x: 0, y: 0 };
      return { x: n.x, y: n.y + n.h / 2 };
    };
    if (to === "merge") {
      if (!merge) return null;
      const s = anchorOut(from);
      return { x1: s.x, y1: s.y, x2: merge.x, y2: merge.y };
    }
    if (from === "merge") {
      if (!merge) return null;
      const e = anchorIn(to);
      return { x1: merge.x, y1: merge.y, x2: e.x, y2: e.y };
    }
    const s = anchorOut(from);
    const e = anchorIn(to);
    return { x1: s.x, y1: s.y, x2: e.x, y2: e.y };
  };

  return (
    <section aria-label="Netzplan Hologramm" style={{ width: "100%", maxWidth: 720 }}>
      <div
        style={{
          marginBottom: 10,
          fontFamily: "var(--nx-font-mono, monospace)",
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(22,32,25,0.48)",
        }}
      >
        Netzplan Hologramm
      </div>
      <div
        style={{
          borderRadius: 26,
          border: `1px solid ${palette.nodeStroke}`,
          background: "linear-gradient(165deg, rgba(8,10,12,0.55) 0%, rgba(14,18,22,0.72) 100%)",
          padding: "12px 8px 8px",
          boxShadow: `inset 0 0 40px ${palette.glow}`,
        }}
      >
        <svg viewBox="0 0 520 280" width="100%" height="auto" style={{ display: "block", minHeight: 220 }}>
          <defs>
            <marker id={markerNeonId} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0, 10 5, 0 10" fill={palette.edge} />
            </marker>
            <marker id={markerGoldId} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0, 10 5, 0 10" fill={TUNGSTEN_GOLD} />
            </marker>
          </defs>
          {edges.map(([a, b]) => {
            const geom = lineEnds(a, b);
            if (!geom || ((a === "merge" || b === "merge") && !merge)) return null;
            const { color, markerId } = edgeStroke(a, b);
            return <Arrow key={`${a}-${b}`} {...geom} color={color} markerId={markerId} />;
          })}
          {merge ? (
            <circle cx={merge.x} cy={merge.y} r={9} fill="rgba(251,247,239,0.12)" stroke={palette.edge} strokeWidth={1.5} />
          ) : null}
          {nodes.map((n) => (
            <HologramNode
              key={n.id}
              n={n}
              palette={palette}
              hovered={hovered}
              onHover={setHovered}
              reduceMotion={reduceMotion}
            />
          ))}
        </svg>
      </div>
    </section>
  );
}

export function resolveLf10Netplan(
  exerciseId: string | undefined,
  terminalSemantic?: NexusRegistryEntry["combatPalette"]["semantic"],
): {
  scenario: NetplanScenario;
  multiverse: NetplanMultiverse;
} | null {
  if (!exerciseId) return null;
  if (exerciseId === "lf10-mission-destroyer") return { scenario: "destroyer", multiverse: "starwars" };
  if (exerciseId === "lf10-mission-flagship") return { scenario: "flagship", multiverse: "gym" };
  if (exerciseId === "lf10-boss") {
    const multiverse: NetplanMultiverse =
      terminalSemantic === "HardwareNetworking"
        ? "starwars"
        : terminalSemantic === "SecurityCryptography"
          ? "anime"
          : "gym";
    return { scenario: "boss-buffer", multiverse };
  }
  return null;
}
