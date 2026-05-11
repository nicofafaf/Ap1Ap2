import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { useShallow } from "zustand/react/shallow";
import {
  appendRetentionSnapshot,
  chartDataFromRetention,
  computeLfErrorHeatmap,
  loadRetentionSeries,
} from "../../lib/math/learningAnalytics";

function heatColor(strain: number): string {
  const t = Math.max(0, Math.min(1, strain));
  const h = 210 - t * 168;
  const s = 72 + t * 22;
  const l = 22 + (1 - t) * 18;
  return `hsl(${h.toFixed(0)} ${s}% ${l}%)`;
}

export function AnalyticsDashboard() {
  const { leitner, correctLf } = useGameStore(
    useShallow((s) => ({
      leitner: s.learningLeitnerByExerciseId,
      correctLf: s.learningCorrectByLf,
    }))
  );

  const [chartRows, setChartRows] = useState(() =>
    chartDataFromRetention(loadRetentionSeries())
  );

  useEffect(() => {
    appendRetentionSnapshot(leitner);
    setChartRows(chartDataFromRetention(loadRetentionSeries()));
  }, [leitner]);

  const heat = useMemo(() => computeLfErrorHeatmap(leitner), [leitner]);

  const masteredLf = useMemo(() => {
    let n = 0;
    for (let lf = 1; lf <= 12; lf += 1) {
      const k = `LF${lf}` as const;
      if (correctLf[k]?.length) n += 1;
    }
    return n;
  }, [correctLf]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        fontFamily: 'var(--nx-font-sans, "Inter", system-ui, sans-serif)',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".22em",
            color: "rgba(103, 232, 249, 0.78)",
          }}
        >
          ARCHITECT DATA
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14,
            lineHeight: 1.55,
            color: "rgba(186, 230, 253, 0.85)",
            maxWidth: 720,
          }}
        >
          Retention-Schätzung aus Leitner + Ebbinghaus — und wo die zwölf LFs aktuell den
          meisten Review-Druck erzeugen
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            flex: "2 1 420px",
            minWidth: 280,
            minHeight: 280,
            borderRadius: 14,
            border: "1px solid rgba(51, 65, 85, 0.65)",
            background: "rgba(15, 23, 42, 0.45)",
            padding: "16px 12px 12px",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: ".18em",
              color: "rgba(148, 163, 184, 0.95)",
              marginBottom: 10,
            }}
          >
            RETENTION · ZEIT
          </div>
          {chartRows.length < 2 ? (
            <div
              style={{
                height: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(148, 163, 184, 0.8)",
                fontSize: 13,
              }}
            >
              Mehr Trainings-Sessions sammeln — dann entsteht hier deine Kurve
            </div>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="rgba(51,65,85,0.45)" strokeDasharray="4 6" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(148, 163, 184, 0.85)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(71, 85, 105, 0.5)" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "rgba(148, 163, 184, 0.85)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(71, 85, 105, 0.5)" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.94)",
                      border: "1px solid rgba(34, 211, 238, 0.35)",
                      borderRadius: 10,
                      fontFamily: 'var(--nx-font-sans, "Inter", system-ui, sans-serif)',
                    }}
                    labelStyle={{ color: "rgba(186, 230, 253, 0.9)" }}
                    formatter={(value: number) => [`${value}%`, "Retention"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="retention"
                    stroke="rgba(34, 211, 238, 0.92)"
                    strokeWidth={2.2}
                    dot={{ r: 3, fill: "rgba(250, 204, 21, 0.95)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          style={{
            flex: "1 1 280px",
            minWidth: 260,
            borderRadius: 14,
            border: "1px solid rgba(51, 65, 85, 0.65)",
            background: "rgba(15, 23, 42, 0.45)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: ".18em",
              color: "rgba(148, 163, 184, 0.95)",
              marginBottom: 12,
            }}
          >
            FEHLER-HOTSPOTS · 12 LF
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {heat.map((cell) => (
              <div
                key={cell.lf}
                title={`LF${cell.lf} · Strain ${(cell.strain * 100).toFixed(0)}%`}
                style={{
                  borderRadius: 10,
                  padding: "12px 8px",
                  textAlign: "center",
                  background: heatColor(cell.strain),
                  border: "1px solid rgba(15, 23, 42, 0.35)",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: ".2em",
                    color: "rgba(248, 250, 252, 0.92)",
                  }}
                >
                  LF{cell.lf}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "rgba(15, 23, 42, 0.92)",
                  }}
                >
                  {(cell.strain * 100).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 12,
              lineHeight: 1.5,
              color: "rgba(148, 163, 184, 0.88)",
            }}
          >
            Aktive LF mit Profil: {masteredLf}/12 — hohe Werte = mehr Vergessenskurve + niedrige
            Fächer
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
