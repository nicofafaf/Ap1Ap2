import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  achievementOrder,
  achievementRegistry,
  type AchievementDefinition,
  type AchievementType,
} from "../../data/achievementRegistry";
import { typography } from "../../theme/typography";

type GlobalCollection = Record<
  AchievementType,
  { count: number; firstUnlocked: string }
>;

type LxpertBlock = {
  definition: string;
  example: string;
  quizCheck: string;
};

const LXPERT: Record<AchievementType, LxpertBlock> = {
  PERFECT_SYNC: {
    definition:
      "Perfekte Serie: viele richtige Antworten hintereinander ohne lange Pause",
    example:
      "Wenn du konzentriert bleibst, merkst du Muster schneller und machst weniger Flüchtigkeitsfehler",
    quizCheck: "Frage: Was zählt für eine perfekte Serie — nur richtige MC-Antworten in Folge",
  },
  IMMORTAL: {
    definition:
      "Ohne Fehlserie: ein Übungsdurchlauf ohne falsche Antworten",
    example:
      "Lies die Frage, schließe falsche Optionen aus, dann erst klicken",
    quizCheck: "Frage: Zählen nur Multiple-Choice-Aufgaben oder auch Code-Abgaben",
  },
  FAST_TRACK: {
    definition:
      "Schnell fertig: ein Lernfeld in kurzer Zeit mit gutem Ergebnis abgeschlossen",
    example:
      "Kurz die Theorie lesen, dann direkt üben — ohne langes Grübeln bei jeder Zeile",
    quizCheck: "Frage: Was zählt beim Schnell-Durchlauf — Zeit und Mindestquote richtig",
  },
  OVERKILL: {
    definition:
      "Übererfüllung: deutlich mehr richtige Antworten als nötig für den Abschluss",
    example:
      "Extra-Übungen nach dem Pflichtumfang festigen das Wissen für die Prüfung",
    quizCheck: "Frage: Ab wann gilt Übererfüllung — mehr als der Mindestumfang des LF",
  },
  ARCHITECT_BADGE: {
    definition:
      "Lernfeld gemeistert: alle Pflicht-Übungen mindestens einmal richtig gelöst",
    example:
      "Fortschritt kommt aus echtem Verstehen — raten ohne Lesen bringt langfristig wenig",
    quizCheck: "Frage: Reicht einmal richtig pro Übung oder muss jede mehrfach sitzen",
  },
};

const CATEGORY: Record<AchievementType, string> = {
  PERFECT_SYNC: "Integrität & Daten",
  IMMORTAL: "Verteidigung & Schild",
  ARCHITECT_BADGE: "Curriculum & Meisterschaft",
  FAST_TRACK: "Tempo & Routing",
  OVERKILL: "Schaden & Finish",
};

type KnowledgeVaultProps = {
  globalCollection: GlobalCollection;
};

export function KnowledgeVault({ globalCollection }: KnowledgeVaultProps) {
  const [open, setOpen] = useState<AchievementType | null>(null);

  const byCategory = useMemo(() => {
    const map = new Map<string, AchievementType[]>();
    for (const id of achievementOrder) {
      const cat = CATEGORY[id];
      const arr = map.get(cat) ?? [];
      arr.push(id);
      map.set(cat, arr);
    }
    return Array.from(map.entries());
  }, []);

  const openDef: AchievementDefinition | null = open ? achievementRegistry[open] : null;
  const lx = open ? LXPERT[open] : null;
  const row = open ? globalCollection[open] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {byCategory.map(([category, ids]) => (
        <section key={category}>
          <h3
            style={{
              margin: "0 0 12px",
              fontFamily: typography.fontSans,
              fontSize: "max(13px, 0.82rem)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: typography.fgMuted,
            }}
          >
            {category}
          </h3>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {ids.map((id) => {
              const def = achievementRegistry[id];
              const unlocked = globalCollection[id].count > 0;
              const active = open === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => setOpen(active ? null : id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      cursor: unlocked ? "pointer" : "not-allowed",
                      opacity: unlocked ? 1 : 0.5,
                      borderRadius: 12,
                      border: active
                        ? "1px solid rgba(34, 211, 238, 0.55)"
                        : "1px solid rgba(51, 65, 85, 0.55)",
                      background: active
                        ? "rgba(15, 23, 42, 0.92)"
                        : "rgba(15, 23, 42, 0.72)",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      fontFamily: typography.fontSans,
                      color: typography.fg,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "max(15px, 0.95rem)" }}>
                        {def.title}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: "max(13px, 0.82rem)",
                          color: typography.fgMuted,
                          lineHeight: 1.45,
                        }}
                      >
                        {def.subtitle}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: typography.fgMuted }}>
                      {unlocked ? (active ? "Schließen" : "Öffnen") : "Gesperrt"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <AnimatePresence>
        {open && openDef && lx && row && (
          <motion.div
            key={open}
            role="dialog"
            aria-modal="true"
            aria-label={openDef.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              position: "relative",
              borderRadius: 16,
              border: "1px solid rgba(148, 163, 184, 0.4)",
              background: "rgba(2, 6, 23, 0.92)",
              padding: "20px 22px 22px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                fontFamily: typography.fontSans,
                fontSize: "max(12px, 0.75rem)",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: openDef.color,
              }}
            >
              {CATEGORY[open]}
            </div>
            <h4
              style={{
                margin: "10px 0 0",
                fontFamily: typography.fontSans,
                fontSize: "clamp(18px, 2.2vw, 22px)",
                fontWeight: 700,
                color: typography.fg,
              }}
            >
              {openDef.title}
            </h4>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: typography.bodySize,
                lineHeight: typography.bodyLineHeight,
                color: typography.fgMuted,
              }}
            >
              Freigeschaltet:{" "}
              {row.firstUnlocked
                ? new Date(row.firstUnlocked).toLocaleDateString()
                : "—"}{" "}
              · Treffer {row.count}
            </p>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                maxHeight: "min(52vh, 420px)",
                overflowY: "auto",
                scrollSnapType: "y proximity",
                paddingRight: 4,
              }}
              className="nx-vault-scroll"
            >
              <article
                style={{
                  scrollSnapAlign: "start",
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "rgba(15, 23, 42, 0.65)",
                  border: "1px solid rgba(51, 65, 85, 0.5)",
                }}
              >
                <div
                  style={{
                    fontSize: "max(11px, 0.7rem)",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: typography.fgMuted,
                    marginBottom: 8,
                  }}
                >
                  Definition
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: typography.bodySize,
                    lineHeight: typography.bodyLineHeight,
                    color: typography.fg,
                  }}
                >
                  {lx.definition}
                </p>
              </article>
              <article
                style={{
                  scrollSnapAlign: "start",
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "rgba(15, 23, 42, 0.65)",
                  border: "1px solid rgba(51, 65, 85, 0.5)",
                }}
              >
                <div
                  style={{
                    fontSize: "max(11px, 0.7rem)",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: typography.fgMuted,
                    marginBottom: 8,
                  }}
                >
                  Beispiel
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: typography.bodySize,
                    lineHeight: typography.bodyLineHeight,
                    color: typography.fg,
                  }}
                >
                  {lx.example}
                </p>
              </article>
              <article
                style={{
                  scrollSnapAlign: "start",
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "rgba(15, 23, 42, 0.65)",
                  border: "1px solid rgba(34, 211, 238, 0.22)",
                }}
              >
                <div
                  style={{
                    fontSize: "max(11px, 0.7rem)",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "rgba(34, 211, 238, 0.9)",
                    marginBottom: 8,
                  }}
                >
                  Quiz-Check
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: typography.bodySize,
                    lineHeight: typography.bodyLineHeight,
                    color: typography.fg,
                  }}
                >
                  {lx.quizCheck}
                </p>
              </article>
            </div>

            <button
              type="button"
              onClick={() => setOpen(null)}
              style={{
                marginTop: 16,
                borderRadius: 10,
                border: "1px solid rgba(148, 163, 184, 0.45)",
                background: "rgba(15, 23, 42, 0.8)",
                color: typography.fg,
                fontFamily: typography.fontSans,
                fontSize: "max(13px, 0.82rem)",
                padding: "10px 14px",
                cursor: "pointer",
              }}
            >
              Schließen
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default KnowledgeVault;
