import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import type { LearningField } from "../../data/nexusRegistry";
import lf05Content from "../../lernfelder/lf05/content.json";
import lf08Content from "../../lernfelder/lf08/content.json";
import lf11Content from "../../lernfelder/lf11/content.json";
import { typography } from "../../theme/typography";
import { useGameStore } from "../../store/useGameStore";

const SQL_KEYWORDS = [
  "select",
  "from",
  "where",
  "join",
  "inner",
  "left",
  "right",
  "full",
  "outer",
  "on",
  "group",
  "by",
  "having",
  "order",
  "limit",
  "and",
  "or",
  "as",
  "distinct",
];

function normalizeSqlLike(s: string): string {
  const compact = s
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return compact
    .split(" ")
    .map((token) => {
      const bare = token.toLowerCase();
      return SQL_KEYWORDS.includes(bare) ? bare.toUpperCase() : bare;
    })
    .join(" ");
}

function normalizeCSharpLike(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeBashLike(s: string): string {
  return s
    .replace(/#[^\n]*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export type WorkbenchMultiverseId = "starwars" | "anime" | "gym";

const MULTIVERSE_TABS: readonly { id: WorkbenchMultiverseId; label: string }[] = [
  { id: "starwars", label: "Star Wars" },
  { id: "anime", label: "Anime" },
  { id: "gym", label: "Bodybuilding" },
];

const SQL_STEP_COPY: Record<
  WorkbenchMultiverseId,
  readonly { step: string; title: string; body: string }[]
> = {
  starwars: [
    { step: "1", title: "Hyperraum wählen", body: "FROM bedeutet welche Tabelle dein Datensatz ist" },
    { step: "2", title: "Ziel filtern", body: "WHERE schneidet Zeilen wie ein Traktorstrahl" },
    { step: "3", title: "Signal lesen", body: "SELECT * holt alle Spalten ins Cockpit" },
  ],
  anime: [
    { step: "1", title: "Arc wählen", body: "FROM ist deine Episode die Tabelle" },
    { step: "2", title: "Cliffhanger setzen", body: "WHERE filtert die Szene auf eine Bedingung" },
    { step: "3", title: "Frame füllen", body: "SELECT * zeigt jede Spalte im Panel" },
  ],
  gym: [
    { step: "1", title: "Station wählen", body: "FROM ist die Trainingsfläche die Tabelle" },
    { step: "2", title: "Satz scopen", body: "WHERE grenzt die Wiederholungen ein" },
    { step: "3", title: "Checkliste", body: "SELECT * listet alle Spalten auf" },
  ],
};

const CSHARP_FLAVOR: Record<WorkbenchMultiverseId, string> = {
  starwars: "Halte die Syntax straff wie einen Lichtschwertgriff",
  anime: "Ein sauberer Block pro Idee wie Panels in einem Manga",
  gym: "Jede Zeile zählt wie ein sauberer Satz unter der Langhantel",
};

const BASH_SHELL_FLAVOR: Record<WorkbenchMultiverseId, string> = {
  starwars: "Einzeiler wie auf einem frachter-terminal keine mouse-hilfe",
  anime: "Ein befehl pro zeile wie subtitles ohne overlap",
  gym: "Flags minimal wie ein warm-up vor dem heavy set",
};

type LinuxGuidedStep = { step: string; title: string; body: string };

type Lf8LinuxWorkbenchJson = {
  linuxMultiverseSteps?: Record<string, Partial<Record<WorkbenchMultiverseId, LinuxGuidedStep[]>>>;
  linuxCoachFlair?: Record<string, Partial<Record<WorkbenchMultiverseId, string>>>;
};

const LF8_LINUX = lf08Content as Lf8LinuxWorkbenchJson;

const BASH_FALLBACK_GUIDE: Record<WorkbenchMultiverseId, readonly LinuxGuidedStep[]> = {
  starwars: [
    { step: "1", title: "Pfad", body: "Absolute pfade unter /etc oder /var/log wie auf prod" },
    { step: "2", title: "Flags", body: "Kurzflags an systemd und grep sparen tippfehler" },
    { step: "3", title: "Zeile", body: "Kein trailing noise nach dem befehl" },
  ],
  anime: [
    { step: "1", title: "Panel", body: "Ein befehl pro panel-keystroke" },
    { step: "2", title: "Unit", body: "Unit-namen exakt mit suffix" },
    { step: "3", title: "Cut", body: "Keine wildcards wenn die referenz literal will" },
  ],
  gym: [
    { step: "1", title: "Rack", body: "Server zeilen wie wiederholungen zählen" },
    { step: "2", title: "Grip", body: "sudo nur wenn die referenz es verlangt" },
    { step: "3", title: "Lockout", body: "Quotes um tokens die sonst splitten" },
  ],
};

type Lf05CoachJson = {
  coachWorkbench?: {
    selectSuccess?: Partial<Record<WorkbenchMultiverseId, string>>;
    genericSuccess?: Partial<Record<WorkbenchMultiverseId, string>>;
  };
  bossPhase?: {
    id?: string;
    epicCoach?: Partial<Record<WorkbenchMultiverseId, string>>;
    expected?: Partial<Record<WorkbenchMultiverseId, string>>;
  };
};

const LF5_COACH = lf05Content as Lf05CoachJson;

type Lf11BossCoachJson = {
  bossPhase?: {
    id?: string;
    epicCoach?: Partial<Record<WorkbenchMultiverseId, string>>;
  };
};

const LF11_COACH = lf11Content as Lf11BossCoachJson;
const LF11_BOSS_ID = LF11_COACH.bossPhase?.id?.trim() || "lf11-boss";

export type TerminalCodeWorkbenchProps = {
  lang: "sql" | "csharp" | "bash";
  reference: string;
  milestoneId?: string;
  onSuccess?: () => void;
  /** Cockpit-Effekte außerhalb der Workbench z. B. Panel-Shake */
  onRunSuccessEffects?: () => void;
  initialDraft?: string;
  initialToken?: number;
  coachAvatarSrc?: string | null;
  coachName?: string | null;
  /** LF5 Multivers-Coach aus content.json */
  learningField?: LearningField | null;
};

function CoachDialoguePanel({
  avatarSrc,
  name,
  line,
}: {
  avatarSrc: string | null;
  name: string | null;
  line: string;
}) {
  return (
    <div
      role="status"
      style={{
        marginTop: "var(--nx-space-16)",
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--nx-space-16)",
        padding: "var(--nx-space-16) var(--nx-space-20)",
        borderRadius: 22,
        border: "1px solid rgba(251, 247, 239, 0.12)",
        background:
          "linear-gradient(145deg, rgba(8, 10, 12, 0.92) 0%, rgba(18, 22, 26, 0.88) 100%)",
        boxShadow: "inset 0 1px 0 rgba(251, 247, 239, 0.06)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt=""
          width={56}
          height={56}
          style={{
            flexShrink: 0,
            borderRadius: 16,
            border: "1px solid rgba(214, 181, 111, 0.35)",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            width: 56,
            height: 56,
            flexShrink: 0,
            borderRadius: 16,
            background: "rgba(251, 247, 239, 0.08)",
            border: "1px solid rgba(251, 247, 239, 0.1)",
          }}
        />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: typography.fontMono,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(251, 247, 239, 0.42)",
          }}
        >
          {name?.trim() ? `${name} · Coach` : "Coach"}
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontFamily: typography.fontSans,
            fontSize: 24,
            lineHeight: 1.5,
            fontWeight: 500,
            color: "rgba(251, 247, 239, 0.92)",
          }}
        >
          {line}
        </p>
      </div>
    </div>
  );
}

export function TerminalCodeWorkbench({
  lang,
  reference,
  milestoneId,
  onSuccess,
  onRunSuccessEffects,
  initialDraft,
  initialToken,
  coachAvatarSrc = null,
  coachName = null,
  learningField = null,
}: TerminalCodeWorkbenchProps) {
  const [draft, setDraft] = useState("");
  const [checked, setChecked] = useState<"idle" | "ok" | "diff">("idle");
  const [goldGlitch, setGoldGlitch] = useState(false);
  const [multiverse, setMultiverse] = useState<WorkbenchMultiverseId>("starwars");
  const reduceMotion = useReducedMotion();
  const shakeCtl = useAnimation();
  const triggerBossHit = useGameStore((s) => s.triggerBossHit);
  const triggerImpactFrames = useGameStore((s) => s.triggerImpactFrames);

  useEffect(() => {
    if (!initialDraft) return;
    setDraft(initialDraft);
    setChecked("idle");
  }, [initialDraft, initialToken]);

  const norm = useMemo(() => {
    if (lang === "sql") return normalizeSqlLike;
    if (lang === "bash") return normalizeBashLike;
    return normalizeCSharpLike;
  }, [lang]);

  const guidedShellSteps = useMemo(() => {
    if (lang === "sql") return SQL_STEP_COPY[multiverse];
    if (lang === "bash") {
      if (learningField === "LF8" && milestoneId) {
        const pack = LF8_LINUX.linuxMultiverseSteps?.[milestoneId]?.[multiverse];
        if (pack && pack.length > 0) return pack;
      }
      return BASH_FALLBACK_GUIDE[multiverse];
    }
    return SQL_STEP_COPY[multiverse];
  }, [lang, learningField, milestoneId, multiverse]);

  const bossId = useMemo(
    () => (LF5_COACH.bossPhase?.id?.trim() ? LF5_COACH.bossPhase.id.trim() : "lf5-boss"),
    []
  );

  const effectiveReference = useMemo(() => {
    if (learningField === "LF5" && milestoneId === bossId && lang === "sql") {
      return (
        LF5_COACH.bossPhase?.expected?.[multiverse] ??
        "SELECT * FROM Kunden WHERE Stadt = 'Berlin'"
      );
    }
    return reference;
  }, [bossId, lang, learningField, milestoneId, multiverse, reference]);

  const refIsSelect = useMemo(() => {
    if (lang !== "sql") return false;
    const head = normalizeSqlLike(effectiveReference).split(" ")[0]?.toUpperCase();
    return head === "SELECT";
  }, [lang, effectiveReference]);

  const coachLine = useMemo(() => {
    if (checked === "diff") {
      return "Noch nicht gleich übernimm das Beispiel und gleiche Zeichen für Zeichen ab";
    }
    if (checked === "ok") {
      if (learningField === "LF5") {
        const pack = LF5_COACH.coachWorkbench;
        if (milestoneId === bossId) {
          return (
            LF5_COACH.bossPhase?.epicCoach?.[multiverse] ??
            pack?.genericSuccess?.[multiverse] ??
            "Richtig der Nexus hat deine Eingabe bestätigt"
          );
        }
        if (lang === "sql" && refIsSelect) {
          return (
            pack?.selectSuccess?.[multiverse] ?? "Richtig der Nexus hat deine Eingabe bestätigt"
          );
        }
        return pack?.genericSuccess?.[multiverse] ?? "Richtig der Nexus hat deine Eingabe bestätigt";
      }
      return "Richtig der Nexus hat deine Eingabe bestätigt";
    }
    if (lang === "sql") return "Du musst SQL noch nicht können starte mit dem Beispiel unten";
    if (lang === "bash") {
      if (learningField === "LF8" && milestoneId) {
        const flair = LF8_LINUX.linuxCoachFlair?.[milestoneId]?.[multiverse]?.trim();
        if (flair) return flair;
      }
      return BASH_SHELL_FLAVOR[multiverse];
    }
    if (lang === "csharp" && learningField === "LF11" && milestoneId === LF11_BOSS_ID) {
      return LF11_COACH.bossPhase?.epicCoach?.[multiverse] ?? CSHARP_FLAVOR[multiverse];
    }
    return CSHARP_FLAVOR[multiverse];
  }, [checked, lang, multiverse, learningField, refIsSelect, milestoneId, bossId]);

  const runCheck = useCallback(() => {
    const a = norm(draft);
    const b = norm(effectiveReference);
    const ok = a.length > 0 && a === b;
    setChecked(ok ? "ok" : "diff");
    if (!ok) return;
    triggerBossHit(18);
    triggerImpactFrames();
    onSuccess?.();
    onRunSuccessEffects?.();
    setGoldGlitch(true);
    if (!reduceMotion) {
      void shakeCtl
        .start({
          x: [0, -7, 7, -5, 5, -3, 3, 0],
          y: [0, 4, -4, 3, -3, 0, 0, 0],
          transition: { duration: 0.5, ease: "easeInOut" },
        })
        .then(() => shakeCtl.start({ x: 0, y: 0, transition: { duration: 0 } }));
    }
    if (lang === "sql" && milestoneId) {
      window.dispatchEvent(
        new CustomEvent("nx:milestone-sql-success", {
          detail: { milestoneId },
        })
      );
    }
    window.setTimeout(() => setGoldGlitch(false), 720);
  }, [
    draft,
    norm,
    effectiveReference,
    triggerBossHit,
    triggerImpactFrames,
    lang,
    milestoneId,
    onSuccess,
    onRunSuccessEffects,
    reduceMotion,
    shakeCtl,
  ]);

  return (
    <motion.div animate={shakeCtl} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          marginBottom: "var(--nx-space-12)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: 6,
            gap: 4,
            borderRadius: 999,
            border: "1px solid rgba(251, 247, 239, 0.1)",
            background: "rgba(8, 10, 12, 0.55)",
            backdropFilter: "blur(16px) saturate(120%)",
            WebkitBackdropFilter: "blur(16px) saturate(120%)",
            boxShadow: "inset 0 1px 0 rgba(251, 247, 239, 0.06)",
          }}
        >
          {MULTIVERSE_TABS.map((tab) => {
            const active = multiverse === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMultiverse(tab.id)}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "10px 18px",
                  cursor: "pointer",
                  fontFamily: typography.fontSans,
                  fontSize: 20,
                  fontWeight: active ? 800 : 600,
                  letterSpacing: "0.02em",
                  color: active ? "rgba(8, 10, 12, 0.95)" : "rgba(251, 247, 239, 0.55)",
                  background: active
                    ? "linear-gradient(135deg, rgba(251,247,239,0.95) 0%, rgba(214,181,111,0.35) 100%)"
                    : "transparent",
                  boxShadow: active ? "0 4px 18px rgba(214, 181, 111, 0.22)" : "none",
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <span
          style={{
            fontFamily: typography.fontMono,
            fontSize: 20,
            fontWeight: 650,
            letterSpacing: "0.06em",
            color: "var(--nx-learn-muted)",
          }}
        >
          Multivers-Bezug
        </span>
      </div>

      <div
        style={{
          fontFamily: typography.fontSans,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--nx-learn-muted)",
          paddingBottom: "var(--nx-space-8)",
        }}
      >
        {lang === "sql"
          ? "Geführter Datenbank-Start"
          : lang === "bash"
            ? "Geführte Shell-Übung"
            : "Geführte Code-Übung"}
      </div>
      {lang === "sql" || lang === "bash" ? (
        <section
          style={{
            marginBottom: "var(--nx-space-16)",
            borderRadius: 26,
            border: "1px solid var(--nx-learn-line)",
            background: "rgba(251,247,239,0.78)",
            padding: 18,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
              gap: 12,
            }}
          >
            {guidedShellSteps.map(({ step, title, body }) => (
              <div
                key={step}
                style={{
                  borderRadius: 20,
                  border: "1px solid var(--nx-learn-line)",
                  background: "rgba(255,255,255,0.58)",
                  padding: 16,
                  color: "var(--nx-learn-ink)",
                }}
              >
                <div style={{ fontFamily: typography.fontMono, fontSize: 20, opacity: 0.58 }}>
                  Schritt {step}
                </div>
                <strong style={{ display: "block", marginTop: 8, fontSize: 24 }}>{title}</strong>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 20,
                    lineHeight: 1.45,
                    color: "var(--nx-learn-muted)",
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(effectiveReference);
              setChecked("idle");
            }}
            style={{
              marginTop: 14,
              borderRadius: 999,
              border: "1px solid rgba(214,181,111,0.55)",
              background: "rgba(214,181,111,0.2)",
              color: "var(--nx-learn-ink)",
              fontFamily: typography.fontSans,
              fontSize: 22,
              fontWeight: 800,
              padding: "14px 20px",
              cursor: "pointer",
            }}
          >
            Beispiel übernehmen
          </button>
        </section>
      ) : (
        <p
          style={{
            margin: "0 0 var(--nx-space-16)",
            padding: "var(--nx-space-16)",
            borderRadius: 20,
            border: "1px solid var(--nx-learn-line)",
            background: "rgba(251,247,239,0.72)",
            fontFamily: typography.fontSans,
            fontSize: 20,
            lineHeight: 1.5,
            color: "var(--nx-learn-muted)",
          }}
        >
          {CSHARP_FLAVOR[multiverse]}
        </p>
      )}
      <textarea
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setChecked("idle");
        }}
        rows={8}
        style={{
          width: "100%",
          resize: "vertical",
          minHeight: 180,
          margin: 0,
          padding: "var(--nx-space-16)",
          borderRadius: 22,
          border: goldGlitch
            ? "2px solid rgba(255, 214, 165, 0.85)"
            : "1px solid var(--nx-learn-line)",
          background: "rgba(251,247,239,0.92)",
          color: "var(--nx-learn-ink)",
          fontFamily: "var(--nx-font-mono, Geist Mono, monospace)",
          fontSize: 22,
          lineHeight: 1.45,
          outline: "none",
          boxShadow: goldGlitch
            ? "0 0 0 2px rgba(255, 214, 165, 0.35), 0 0 48px rgba(214, 181, 111, 0.45), 0 0 80px rgba(255, 214, 165, 0.2)"
            : "none",
          transition: "box-shadow 220ms ease, border-color 220ms ease",
        }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--nx-space-16)", marginTop: "var(--nx-space-16)" }}>
        <button
          type="button"
          onClick={runCheck}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(214,181,111,0.55)",
            background: "rgba(214,181,111,0.16)",
            color: "var(--nx-learn-ink)",
            fontFamily: typography.fontSans,
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            padding: "14px 20px",
            cursor: "pointer",
          }}
        >
          Abgleich starten
        </button>
      </div>
      <CoachDialoguePanel avatarSrc={coachAvatarSrc} name={coachName} line={coachLine} />
    </motion.div>
  );
}
