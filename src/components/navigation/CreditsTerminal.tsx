import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  achievementOrder,
  achievementRegistry,
  type AchievementType,
} from "../../data/achievementRegistry";
import { getNexusEntryForLF, type LearningField } from "../../data/nexusRegistry";
import type { CombatArchitectReportEntry, GlobalCollectionEntry } from "../../store/useGameStore";

export type CreditsTerminalProps = {
  history: CombatArchitectReportEntry[];
  globalCollection: Record<AchievementType, GlobalCollectionEntry>;
  nexusFragments: number;
  sRankStreak: number;
  className?: string;
};

function uniqueDefeatedBosses(history: CombatArchitectReportEntry[]): string[] {
  const seen = new Set<number>();
  const names: string[] = [];
  const sorted = [...history].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  for (const e of sorted) {
    const lf = Math.max(1, Math.min(12, e.activeLF));
    if (seen.has(lf)) continue;
    seen.add(lf);
    const key = `LF${lf}` as LearningField;
    names.push(getNexusEntryForLF(key).bossDisplayName);
  }
  return names;
}

export function CreditsTerminal({
  history,
  globalCollection,
  nexusFragments,
  sRankStreak,
  className,
}: CreditsTerminalProps) {
  const lines = useMemo(() => {
    const out: string[] = [];
    out.push("> NEXUS MAINFRAME · HALL OF RECORDS — SYSTEM LOG");
    out.push(`> TIMESTAMP_UTC ${new Date().toISOString()}`);

    out.push("> —— GLOBAL BESTLEISTUNGEN ——");

    out.push(`> ARCHIVIERTE_LÄUFE ${history.length}`);

    out.push(`> NEXUS_FRAGMENTS ${nexusFragments}`);

    out.push(`> AKTUELLER_S_RANK_STREAK ${sRankStreak}`);

    const sRuns = history.filter((h) => h.combatRank === "S").length;

    out.push(`> GESAMT_S_RANK_ABSCHLÜSSE ${sRuns}`);

    let bestMs = Infinity;

    let bestLf = 0;

    for (const h of history) {

      if (h.elapsedSec > 0 && h.elapsedSec < bestMs) {

        bestMs = h.elapsedSec;

        bestLf = h.activeLF;

      }

    }

    if (bestMs < Infinity) {

      out.push(

        `> SCHNELLSTER_ARCHITEKT_RUN ${bestMs.toFixed(2)}s · SEKTOR LF${bestLf}`

      );

    }

    out.push("> —— ACHIEVEMENT VAULT ——");

    for (const id of achievementOrder) {

      const row = globalCollection[id];

      const n = row?.count ?? 0;

      if (n <= 0) continue;

      const label = achievementRegistry[id].title;

      out.push(`> ACHV :: ${id} :: ${label} :: x${n}`);

    }

    out.push("> —— BESIEGTE ARCHITEKTEN (CHRONOLOGISCH) ——");

    const bosses = uniqueDefeatedBosses(history);

    if (bosses.length === 0) {

      out.push("> [LEER] Keine Siege im Archiv");

    } else {

      for (const b of bosses) {

        out.push(`> VERNICHTET :: ${b.toUpperCase()}`);

      }

    }

    out.push("> —— ENDLESS BUFFER ——");

    return out;

  }, [history, globalCollection, nexusFragments, sRankStreak]);



  const scrollBody = useMemo(() => [...lines, ...lines, ...lines], [lines]);



  return (

    <motion.div

      className={className}

      initial={{ opacity: 0, y: 8 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.4, ease: "easeOut" }}

      style={{

        position: "relative",

        overflow: "hidden",

        borderRadius: 10,

        border: "1px solid rgba(34,211,238,0.28)",

        background:

          "linear-gradient(180deg, rgba(4,12,20,0.96) 0%, rgba(2,8,14,0.99) 100%)",

        minHeight: 200,

        maxHeight: "min(52vh, 520px)",

        fontFamily: "ui-monospace, monospace",

        fontSize: 10,

        lineHeight: 1.55,

        letterSpacing: ".04em",

        color: "rgba(186, 230, 253, 0.88)",

      }}

    >

      <div

        style={{

          position: "absolute",

          top: 0,

          left: 0,

          right: 0,

          height: 36,

          zIndex: 2,

          display: "flex",

          alignItems: "center",

          paddingLeft: 12,

          fontSize: 9,

          letterSpacing: ".24em",

          textTransform: "uppercase",

          color: "rgba(103, 232, 249, 0.72)",

          borderBottom: "1px solid rgba(34,211,238,0.15)",

          background: "rgba(3,10,16,0.92)",

        }}

      >

        Credits Terminal · Endless Scroll

      </div>

      <div

        style={{

          marginTop: 36,

          padding: "10px 12px 14px",

          height: "calc(100% - 36px)",

          overflow: "hidden",

          maskImage: "linear-gradient(180deg, #000 0%, #000 88%, transparent 100%)",

        }}

      >

        <motion.div

          animate={{ y: ["0%", "-33.333%"] }}

          transition={{

            duration: Math.max(38, scrollBody.length * 1.2),

            ease: "linear",

            repeat: Infinity,

          }}

          style={{ willChange: "transform" }}

        >

          {scrollBody.map((line, i) => (

            <div key={`${i}-${line.slice(0, 24)}`} style={{ whiteSpace: "pre-wrap" }}>

              {line}

            </div>

          ))}

        </motion.div>

      </div>

    </motion.div>

  );

}



export default CreditsTerminal;

