import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CCNA1_ITN_17_MODULES, CCNA1_ITN_PACKS } from "../../../cisco/ccna1-v7/examCatalog";
import {
  getAllCiscoPacks,
  getQuizItemsForPack,
  totalCiscoQuizCount,
} from "../../../cisco/ccna1-v7/loadPacks";
import type { CiscoPackId } from "../../../cisco/types";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
import "./edtechLearningRank.css";

export type CiscoCcnaHubPanelProps = {
  onSessionStart?: () => void;
};

export function CiscoCcnaHubPanel({ onSessionStart }: CiscoCcnaHubPanelProps) {
  const beginCiscoPack = useGameStore((s) => s.beginCiscoPack);
  const beginCiscoModule = useGameStore((s) => s.beginCiscoModule);
  const { t, locale } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const quizTotal = useMemo(() => totalCiscoQuizCount(), []);
  const packs = useMemo(() => getAllCiscoPacks(), []);
  const finalPacks = useMemo(
    () => packs.filter((p) => p.id === "practice-final" || p.id === "course-final"),
    [packs]
  );

  const packStats = useMemo(() => {
    const map = new Map<CiscoPackId, number>();
    for (const p of packs) map.set(p.id as CiscoPackId, getQuizItemsForPack(p.id as CiscoPackId).length);
    return map;
  }, [packs]);

  return (
    <section className="nx-edtech-rank-panel nx-cisco-hub-panel" aria-labelledby="nx-cisco-hub-title">
      <div className="nx-edtech-rank-head">
        <div>
          <h2 id="nx-cisco-hub-title" className="nx-edtech-rank-title">
            {t("cisco.hubTitle")}
          </h2>
          <p className="nx-edtech-rank-kicker">{t("cisco.courseCode")}</p>
          <p className="nx-edtech-rank-lead">{t("cisco.hubLead")}</p>
          <p className="nx-edtech-rank-stat-label">
            {t("cisco.quizCount").replace("{n}", String(quizTotal))} · {t("cisco.modules17")}
          </p>
        </div>
      </div>

      <div className="nx-cisco-pack-grid">
        {CCNA1_ITN_PACKS.filter((p) => p.id.startsWith("modules-")).map((meta) => (
          <motion.button
            key={meta.id}
            type="button"
            className="nx-cisco-pack-card"
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            onClick={() => {
              beginCiscoPack(meta.id);
              onSessionStart?.();
            }}
          >
            <span className="nx-cisco-pack-range">
              {t("cisco.moduleRange")
                .replace("{from}", String(meta.moduleRange[0]))
                .replace("{to}", String(meta.moduleRange[1]))}
            </span>
            <span className="nx-cisco-pack-title">
              {locale === "de" ? meta.titleDe : meta.titleEn}
            </span>
            <span className="nx-cisco-pack-meta">
              {t("cisco.mcPackCount").replace("{n}", String(packStats.get(meta.id) ?? 0))}
            </span>
          </motion.button>
        ))}
      </div>

      {finalPacks.length > 0 ? (
        <div className="nx-cisco-pack-grid" style={{ marginTop: 0 }}>
          {finalPacks.map((pack) => (
            <motion.button
              key={pack.id}
              type="button"
              className="nx-cisco-pack-card nx-cisco-pack-card--final"
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              onClick={() => {
                beginCiscoPack(pack.id as CiscoPackId);
                onSessionStart?.();
              }}
            >
              <span className="nx-cisco-pack-title">
                {locale === "de" ? pack.title.de : pack.title.en}
              </span>
              <span className="nx-cisco-pack-meta">
                {t("cisco.mcPackCount").replace(
                  "{n}",
                  String(getQuizItemsForPack(pack.id as CiscoPackId).length)
                )}
              </span>
            </motion.button>
          ))}
        </div>
      ) : null}

      <div className="nx-cisco-module-ladder" role="list" aria-label={t("cisco.ladderAria")}>
        {CCNA1_ITN_17_MODULES.map((m) => (
          <motion.button
            key={m.module}
            type="button"
            role="listitem"
            className="nx-cisco-module-chip"
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            onClick={() => {
              beginCiscoModule(m.module);
              onSessionStart?.();
            }}
          >
            <span className="nx-cisco-module-num">{m.module}</span>
            <span className="nx-cisco-module-name">{locale === "de" ? m.title.de : m.title.en}</span>
          </motion.button>
        ))}
      </div>

      <p className="nx-cisco-legal">{t("cisco.verbatimNote")}</p>
    </section>
  );
}
