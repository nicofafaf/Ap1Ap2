import type { ReactNode } from "react";

export type HighlightLang = "sql" | "csharp" | "javascript" | "bash" | "plain-text" | "markdown";
type Lang = HighlightLang;

const JS_KW =
  /\b(function|return|let|const|var|if|else|for|while|do|switch|case|break|default|class|constructor|extends|new|typeof|instanceof|true|false|null|undefined|async|await|try|catch|finally|throw|import|export|from|this|static|get|set|of|in|yield|void|delete|with|debugger)\b/g;

const SQL_KW =
  /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|ON|GROUP|BY|ORDER|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|AND|OR|NOT|NULL|AS|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|LIKE|IN|BETWEEN|IS|CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|ALTER|DROP|INDEX|VIEW|UNION|ALL|DESC|ASC|LIMIT|OFFSET)\b/gi;

const CS_KW =
  /\b(using|namespace|class|public|private|protected|internal|static|readonly|void|int|string|bool|double|float|decimal|var|new|return|if|else|switch|case|break|default|for|foreach|while|try|catch|finally|throw|async|await|Task|object|interface|enum|struct|get|set|typeof|is|as|null|true|false|this|base)\b/g;

const CS_TYPE = /\b(List|Dictionary|IEnumerable|Action|Func|DateTime|StringBuilder|Console)\b/;

const COL = {
  kw: "#569cd6",
  str: "#ce9178",
  comment: "#6a9955",
  num: "#b5cea8",
  type: "#4ec9b0",
  plain: "#d4d4d4",
} as const;

function pushSpan(out: ReactNode[], text: string, color: string, key: number) {
  if (!text) return;
  out.push(
    <span key={key} style={{ color }}>
      {text}
    </span>
  );
}

function highlightSql(line: string, baseKey: number): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let k = baseKey;
  while (i < line.length) {
    if (line.slice(i, i + 2) === "--") {
      pushSpan(out, line.slice(i), COL.comment, k++);
      break;
    }
    const ch = line[i];
    if (ch === "'" || ch === '"') {
      const q = ch;
      let j = i + 1;
      while (j < line.length && line[j] !== q) j += 1;
      const slice = j < line.length ? line.slice(i, j + 1) : line.slice(i);
      pushSpan(out, slice, COL.str, k++);
      i += slice.length;
      continue;
    }
    const rest = line.slice(i);
    const mStr = /^(\d+\.?\d*)/.exec(rest);
    if (mStr) {
      pushSpan(out, mStr[1], COL.num, k++);
      i += mStr[1].length;
      continue;
    }
    SQL_KW.lastIndex = 0;
    const mKw = SQL_KW.exec(rest);
    if (mKw && mKw.index === 0) {
      pushSpan(out, mKw[0], COL.kw, k++);
      i += mKw[0].length;
      continue;
    }
    pushSpan(out, ch, COL.plain, k++);
    i += 1;
  }
  return out;
}

function highlightCSharp(line: string, baseKey: number): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let k = baseKey;
  while (i < line.length) {
    if (line.slice(i, i + 2) === "//") {
      pushSpan(out, line.slice(i), COL.comment, k++);
      break;
    }
    const ch = line[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1;
      while (j < line.length && line[j] !== q) {
        if (line[j] === "\\") j += 1;
        j += 1;
      }
      const slice = j < line.length ? line.slice(i, j + 1) : line.slice(i);
      pushSpan(out, slice, COL.str, k++);
      i += slice.length;
      continue;
    }
    const rest = line.slice(i);
    const mNum = /^(\d+\.?\d*)/.exec(rest);
    if (mNum) {
      pushSpan(out, mNum[1], COL.num, k++);
      i += mNum[1].length;
      continue;
    }
    CS_KW.lastIndex = 0;
    const mKw = CS_KW.exec(rest);
    if (mKw && mKw.index === 0) {
      pushSpan(out, mKw[0], COL.kw, k++);
      i += mKw[0].length;
      continue;
    }
    CS_TYPE.lastIndex = 0;
    const mTy = CS_TYPE.exec(rest);
    if (mTy && mTy.index === 0) {
      pushSpan(out, mTy[0], COL.type, k++);
      i += mTy[0].length;
      continue;
    }
    pushSpan(out, ch, COL.plain, k++);
    i += 1;
  }
  return out;
}

/** LF1–4: Tabellen & Aufzählungen einfarbig */
function highlightPlainTextLine(line: string, baseKey: number): ReactNode[] {
  const out: ReactNode[] = [];
  pushSpan(out, line.length ? line : " ", COL.plain, baseKey);
  return out;
}

/** Einfache Markdown-Zeilen: Überschriften, Listen, Tabellenzeilen */
function highlightMarkdownLine(line: string, baseKey: number): ReactNode[] {
  const out: ReactNode[] = [];
  let k = baseKey;
  if (/^#{1,6}\s/.test(line)) {
    pushSpan(out, line, COL.kw, k++);
    return out;
  }
  if (/^\|.+\|$/.test(line.trimEnd())) {
    pushSpan(out, line, COL.plain, k++);
    return out;
  }
  const bullet = /^(-|\*)\s+/.exec(line);
  if (bullet) {
    pushSpan(out, bullet[0], COL.type, k++);
    pushSpan(out, line.slice(bullet[0].length), COL.plain, k++);
    return out;
  }
  if (/^\d+\.\s+/.test(line)) {
    const m = /^(\d+\.\s+)/.exec(line)!;
    pushSpan(out, m[1], COL.num, k++);
    pushSpan(out, line.slice(m[1].length), COL.plain, k++);
    return out;
  }
  pushSpan(out, line, COL.plain, k++);
  return out;
}

function highlightJavaScript(line: string, baseKey: number): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let k = baseKey;
  while (i < line.length) {
    if (line.slice(i, i + 2) === "//") {
      pushSpan(out, line.slice(i), COL.comment, k++);
      break;
    }
    const ch = line[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const q = ch;
      let j = i + 1;
      while (j < line.length && line[j] !== q) {
        if (line[j] === "\\" && q !== "`") j += 1;
        j += 1;
      }
      const slice = j < line.length ? line.slice(i, j + 1) : line.slice(i);
      pushSpan(out, slice, COL.str, k++);
      i += slice.length;
      continue;
    }
    const rest = line.slice(i);
    const mNum = /^(\d+\.?\d*)/.exec(rest);
    if (mNum) {
      pushSpan(out, mNum[1], COL.num, k++);
      i += mNum[1].length;
      continue;
    }
    JS_KW.lastIndex = 0;
    const mKw = JS_KW.exec(rest);
    if (mKw && mKw.index === 0) {
      pushSpan(out, mKw[0], COL.kw, k++);
      i += mKw[0].length;
      continue;
    }
    pushSpan(out, ch, COL.plain, k++);
    i += 1;
  }
  return out;
}

export function highlightCode(code: string, lang: Lang): ReactNode[] {
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let key = 0;
  lines.forEach((line, li) => {
    const parts =
      lang === "sql"
        ? highlightSql(line, key)
        : lang === "javascript"
          ? highlightJavaScript(line, key)
          : lang === "markdown"
            ? highlightMarkdownLine(line, key)
            : lang === "plain-text" || lang === "bash"
              ? highlightPlainTextLine(line, key)
              : highlightCSharp(line, key);
    key += parts.length + 1;
    nodes.push(
      <span key={`ln-${li}`} style={{ display: "block", minHeight: "1.5em" }}>
        {parts}
      </span>
    );
  });
  return nodes;
}
