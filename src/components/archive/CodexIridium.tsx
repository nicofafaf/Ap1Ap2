import { useMemo, useState } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import { CURRICULUM_BY_LF } from "../../lib/learning/learningRegistry";
import { useGameStore } from "../../store/useGameStore";
import { CodexContent, type CodexReferenceItem } from "./CodexContent";
import lf01 from "../../lernfelder/lf01/content.json";
import lf02 from "../../lernfelder/lf02/content.json";
import lf03 from "../../lernfelder/lf03/content.json";
import lf04 from "../../lernfelder/lf04/content.json";
import lf05 from "../../lernfelder/lf05/content.json";
import lf06 from "../../lernfelder/lf06/content.json";
import lf07 from "../../lernfelder/lf07/content.json";
import lf08 from "../../lernfelder/lf08/content.json";
import lf09 from "../../lernfelder/lf09/content.json";
import lf10 from "../../lernfelder/lf10/content.json";
import lf11 from "../../lernfelder/lf11/content.json";
import lf12 from "../../lernfelder/lf12/content.json";

type LfContent = {
  lf: LearningField;
  title: string;
  reference?: CodexReferenceItem[];
};

const CONTENT: Record<LearningField, LfContent> = {
  LF1: lf01 as LfContent,
  LF2: lf02 as LfContent,
  LF3: lf03 as LfContent,
  LF4: lf04 as LfContent,
  LF5: lf05 as LfContent,
  LF6: lf06 as LfContent,
  LF7: lf07 as LfContent,
  LF8: lf08 as LfContent,
  LF9: lf09 as LfContent,
  LF10: lf10 as LfContent,
  LF11: lf11 as LfContent,
  LF12: lf12 as LfContent,
};

const ALL_LF: LearningField[] = [
  "LF1",
  "LF2",
  "LF3",
  "LF4",
  "LF5",
  "LF6",
  "LF7",
  "LF8",
  "LF9",
  "LF10",
  "LF11",
  "LF12",
];

export function CodexIridium() {
  const [activeLf, setActiveLf] = useState<LearningField>("LF1");
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const codexXp = useGameStore((s) => s.codexXp);
  const meta = CONTENT[activeLf];

  const fallbackCode: CodexReferenceItem[] = useMemo(() => {
    const pool = CURRICULUM_BY_LF[activeLf] ?? [];
    return pool
      .filter((q) => q.lang === "sql" || q.lang === "csharp")
      .slice(0, 2)
      .map((q, idx) => ({
        id: `${activeLf}-fallback-${idx}`,
        chapter: "Mission Snippets",
        title: q.title,
        code: q.solutionCode,
        type: q.lang as "sql" | "csharp",
      }));
  }, [activeLf]);

  const allItems = useMemo(
    () => [
      ...(meta.reference ?? []),
      ...(activeLf === "LF5"
        ? [
            {
              id: "lf5-visual-relations",
              chapter: "Relations",
              type: "visual" as const,
              title: "SQL Flow",
              visual: "sql-relations" as const,
            },
          ]
        : []),
      ...fallbackCode,
    ],
    [meta.reference, fallbackCode, activeLf]
  );

  const chapters = useMemo(() => {
    const set = new Set<string>();
    for (const item of allItems) set.add(item.chapter);
    return [...set];
  }, [allItems]);

  const iconForChapter = (chapter: string): string => {
    const items = allItems.filter((x) => x.chapter === chapter);
    const hasCode = items.some((x) => x.type === "sql" || x.type === "csharp");
    const hasText = items.some((x) => x.type === "note");
    if (hasCode && hasText) return "◈";
    if (hasCode) return "⌬";
    return "◇";
  };

  return (
    <section
      style={{
        width: "100%",
        minHeight: 520,
        borderRadius: 14,
        border: "1px solid rgba(255, 214, 165, 0.42)",
        background:
          "linear-gradient(150deg, rgba(7, 8, 10, 0.94) 0%, rgba(10, 11, 15, 0.92) 56%, rgba(8, 9, 12, 0.96) 100%)",
        boxShadow: "0 16px 56px rgba(0,0,0,0.54)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          minHeight: 520,
        }}
      >
        <aside
          style={{
            borderRight: "1px solid rgba(255, 214, 165, 0.45)",
            background: "rgba(12, 13, 16, 0.62)",
            backdropFilter: "blur(14px) saturate(120%)",
            padding: 14,
          }}
        >
          <div
            style={{
              color: "var(--nx-bone-90)",
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 100,
              marginBottom: 12,
            }}
          >
            Codex Iridium
          </div>
          <div
            style={{
              color: "var(--nx-bone-50)",
              fontSize: 20,
              lineHeight: 1.3,
              marginBottom: 14,
            }}
          >
            XP {codexXp}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ALL_LF.map((lf) => (
              <div key={lf} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveLf(lf);
                    setActiveChapter(null);
                  }}
                  style={{
                    borderRadius: 8,
                    border:
                      lf === activeLf
                        ? "1px solid rgba(255, 214, 165, 0.7)"
                        : "1px solid rgba(255, 214, 165, 0.22)",
                    background: lf === activeLf ? "rgba(255, 214, 165, 0.1)" : "rgba(232, 233, 240, 0.03)",
                    color: "var(--nx-bone-90)",
                    textAlign: "left",
                    padding: "8px 10px",
                    cursor: "pointer",
                    letterSpacing: "0.08em",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  {lf} {CONTENT[lf].title}
                </button>
                {lf === activeLf ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 10 }}>
                    {chapters.map((chapter) => (
                      <button
                        key={chapter}
                        type="button"
                        onClick={() => setActiveChapter(chapter)}
                        style={{
                          borderRadius: 6,
                          border:
                            activeChapter === chapter
                              ? "1px solid rgba(255, 214, 165, 0.65)"
                              : "1px solid rgba(255, 214, 165, 0.18)",
                          background:
                            activeChapter === chapter
                              ? "rgba(255, 214, 165, 0.12)"
                              : "rgba(255, 255, 255, 0.01)",
                          color: "var(--nx-bone-50)",
                          textAlign: "left",
                          padding: "7px 9px",
                          cursor: "pointer",
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {iconForChapter(chapter)} {chapter}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </aside>

        <main
          style={{
            padding: 18,
            background: "rgba(14, 15, 19, 0.56)",
            backdropFilter: "blur(12px) saturate(118%)",
          }}
        >
          <header
            style={{
              borderBottom: "1px solid rgba(255, 214, 165, 0.58)",
              paddingBottom: 10,
              marginBottom: 14,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--nx-font-sans, Inter, system-ui, sans-serif)",
                fontWeight: 100,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--nx-bone-90)",
                fontSize: 42,
              }}
            >
              {activeLf} Wissensbereich
            </h2>
            <div
              style={{
                marginTop: 6,
                fontFamily: "var(--nx-font-sans, Inter, system-ui, sans-serif)",
                fontSize: 20,
                color: "var(--nx-bone-50)",
              }}
            >
              {meta.title}
            </div>
            {activeChapter ? (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 20,
                  color: "var(--nx-bone-90)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Kapitel {activeChapter}
              </div>
            ) : null}
          </header>

          <CodexContent lf={activeLf} chapter={activeChapter} items={allItems} />
        </main>
      </div>
    </section>
  );
}

export default CodexIridium;
