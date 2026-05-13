import { highlightCode, type HighlightLang } from "../../lib/learning/codeHighlight";
import type { LearningField } from "../../data/nexusRegistry";
import { useGameStore } from "../../store/useGameStore";

type CodeBlockProps = {
  lf: LearningField;
  title: string;
  lang: Extract<HighlightLang, "sql" | "csharp" | "bash">;
  code: string;
};

export function CodeBlock({ lf, title, lang, code }: CodeBlockProps) {
  const setArchiveWorkbenchSnippet = useGameStore((s) => s.setArchiveWorkbenchSnippet);
  const requestCodexClose = useGameStore((s) => s.requestCodexClose);

  return (
    <section
      style={{
        borderRadius: 10,
        border: "1px solid rgba(255, 214, 165, 0.26)",
        background: "rgba(12, 13, 16, 0.56)",
        backdropFilter: "blur(14px) saturate(120%)",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--nx-bone-50)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <pre
        style={{
          margin: 0,
          padding: "12px",
          borderRadius: 8,
          border: "1px solid rgba(255, 214, 165, 0.22)",
          background: "rgba(5, 5, 7, 0.92)",
          color: "var(--nx-bone-90)",
          overflowX: "auto",
          fontFamily: "var(--nx-font-mono, Geist Mono, monospace)",
          fontSize: 20,
          lineHeight: 1.5,
        }}
      >
        <code>{highlightCode(code, lang)}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          setArchiveWorkbenchSnippet({ lf, lang, code });
          requestCodexClose();
        }}
        style={{
          marginTop: 10,
          borderRadius: 8,
          border: "1px solid rgba(255, 214, 165, 0.55)",
          background: "rgba(255, 214, 165, 0.1)",
          color: "var(--nx-bone-90)",
          fontSize: 20,
          letterSpacing: "0.06em",
          fontWeight: 700,
          padding: "10px 16px",
          cursor: "pointer",
        }}
      >
        In Workbench laden
      </button>
    </section>
  );
}

export default CodeBlock;
