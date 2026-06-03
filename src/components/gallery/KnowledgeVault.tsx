import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  achievementOrder,
  achievementRegistry,
  type AchievementDefinition,
  type AchievementType,
} from "../../data/achievementRegistry";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import "./knowledgeVault.css";

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
  const { t } = useNexusI18n();
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
    <div className="nx-knowledge-vault">
      {byCategory.map(([category, ids]) => (
        <section key={category} className="nx-knowledge-vault-category">
          <h3 className="nx-knowledge-vault-category-title">{category}</h3>
          <ul className="nx-knowledge-vault-list">
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
                    className={
                      active
                        ? "nx-knowledge-vault-row nx-knowledge-vault-row--active"
                        : "nx-knowledge-vault-row"
                    }
                  >
                    <div>
                      <div className="nx-knowledge-vault-row-title">{def.title}</div>
                      <div className="nx-knowledge-vault-row-sub">{def.subtitle}</div>
                    </div>
                    <span className="nx-knowledge-vault-row-action">
                      {unlocked
                        ? active
                          ? t("vault.closeRow", "Schließen")
                          : t("vault.open", "Öffnen")
                        : t("vault.locked", "Gesperrt")}
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
            className="nx-knowledge-vault-detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="nx-knowledge-vault-detail-kicker" style={{ color: openDef.color }}>
              {CATEGORY[open]}
            </div>
            <h4 className="nx-knowledge-vault-detail-title">{openDef.title}</h4>
            <p className="nx-knowledge-vault-detail-meta">
              {t("vault.unlockedMeta", "Freigeschaltet: {date} · Treffer {count}")
                .replace(
                  "{date}",
                  row.firstUnlocked ? new Date(row.firstUnlocked).toLocaleDateString() : "—"
                )
                .replace("{count}", String(row.count))}
            </p>

            <div className="nx-knowledge-vault-scroll">
              <article className="nx-knowledge-vault-block">
                <div className="nx-knowledge-vault-block-label">
                  {t("vault.definition", "Definition")}
                </div>
                <p>{lx.definition}</p>
              </article>
              <article className="nx-knowledge-vault-block">
                <div className="nx-knowledge-vault-block-label">{t("vault.example", "Beispiel")}</div>
                <p>{lx.example}</p>
              </article>
              <article className="nx-knowledge-vault-block nx-knowledge-vault-block--quiz">
                <div className="nx-knowledge-vault-block-label nx-knowledge-vault-block-label--quiz">
                  {t("vault.quizCheck", "Quiz-Check")}
                </div>
                <p>{lx.quizCheck}</p>
              </article>
            </div>

            <button type="button" className="nx-knowledge-vault-close" onClick={() => setOpen(null)}>
              {t("vault.closeDetail", "Schließen")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default KnowledgeVault;
