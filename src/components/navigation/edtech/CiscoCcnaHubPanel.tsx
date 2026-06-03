import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CCNA1_ITN_17_MODULES, CCNA1_ITN_PACKS } from "../../../cisco/ccna1-v7/examCatalog";
import {
  ensureCiscoPacksLoaded,
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
  const [packsReady, setPacksReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quizTotal, setQuizTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void ensureCiscoPacksLoaded()
      .then(() => {
        if (cancelled) return;
        setQuizTotal(totalCiscoQuizCount());
        setPacksReady(true);
        setLoadError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "CCNA load failed");
        setPacksReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!packsReady) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("ccna") !== "1") return;
    window.requestAnimationFrame(() => {
      document.getElementById("nx-ccna-hub")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [packsReady]);

  const packs = useMemo(() => (packsReady ? getAllCiscoPacks() : []), [packsReady]);
  const finalPacks = useMemo(
    () =>
      packs.filter(
        (p) =>
          p.id === "practice-final" ||
          p.id === "course-final" ||
          p.id === "system-test" ||
          p.id === "pt-skills-final"
      ),
    [packs]
  );

  const packStats = useMemo(() => {
    const map = new Map<CiscoPackId, number>();
    for (const p of packs) map.set(p.id as CiscoPackId, getQuizItemsForPack(p.id as CiscoPackId).length);
    return map;
  }, [packs]);

  const startPack = (id: CiscoPackId) => {
    beginCiscoPack(id);
    onSessionStart?.();
  };

  return (
    <section
      id="nx-ccna-hub"
      className="nx-edtech-rank-panel nx-cisco-hub-panel"
      aria-labelledby="nx-cisco-hub-title"
      style={{ scrollMarginTop: 88 }}
    >
      <div className="nx-edtech-rank-head">
        <div>
          <p className="nx-cisco-hero-badge">{t("cisco.heroBadge", "NetAcad · Cisco ITN")}</p>
          <h2 id="nx-cisco-hub-title" className="nx-edtech-rank-title">
            {t("cisco.hubTitle")}
          </h2>
          <p className="nx-edtech-rank-kicker">{t("cisco.courseCode")}</p>
          <p className="nx-edtech-rank-lead">{t("cisco.hubLead")}</p>
          <p className="nx-edtech-rank-stat-label">
            {packsReady
              ? t("cisco.quizCount").replace("{n}", String(quizTotal))
              : t("cisco.loading", "Lade Prüfungsbank…")}{" "}
            · {t("cisco.modules17")}
          </p>
          {loadError ? (
            <p className="nx-cisco-load-error" role="alert">
              {t("cisco.loadError", "CCNA-Inhalt konnte nicht geladen werden.")} ({loadError})
            </p>
          ) : null}
        </div>
      </div>

      {!packsReady && !loadError ? (
        <div className="nx-cisco-skeleton" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="nx-cisco-skeleton-card" />
          ))}
        </div>
      ) : null}

      {packsReady ? (
        <>
          <div className="nx-cisco-pack-grid">
            {CCNA1_ITN_PACKS.filter((p) => p.id.startsWith("modules-")).map((meta) => (
              <motion.button
                key={meta.id}
                type="button"
                className="nx-cisco-pack-card"
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                onClick={() => startPack(meta.id)}
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
            <div className="nx-cisco-pack-grid nx-cisco-pack-grid--finals">
              {finalPacks.map((pack) => (
                <motion.button
                  key={pack.id}
                  type="button"
                  className="nx-cisco-pack-card nx-cisco-pack-card--final"
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  onClick={() => startPack(pack.id as CiscoPackId)}
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
                <span className="nx-cisco-module-name">
                  {locale === "de" ? m.title.de : m.title.en}
                </span>
              </motion.button>
            ))}
          </div>
        </>
      ) : null}

      <p className="nx-cisco-legal">{t("cisco.verbatimNote")}</p>
    </section>
  );
}
