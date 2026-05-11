import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import {
  downloadTextFile,
  NEXUS_DOSSIER_EXPORT_PASSPHRASE,
  sealNexusDossierJson,
} from "../../lib/archive/nexusDossierExport";
import { useHallRecordsHarmony } from "../../lib/audio/menuAudioEngine";
import { useGameStore } from "../../store/useGameStore";
import { CreditsTerminal } from "../navigation/CreditsTerminal";
import { ConstellationMap } from "./ConstellationMap";

export type HallOfRecordsProps = {
  open: boolean;
  onClose: () => void;
};

export function HallOfRecords({ open, onClose }: HallOfRecordsProps) {
  useHallRecordsHarmony(open);

  const history = useGameStore((s) => s.combatArchitectHistory);
  const globalCollection = useGameStore((s) => s.globalCollection);
  const nexusFragments = useGameStore((s) => s.nexusFragments);
  const sRankStreak = useGameStore((s) => s.sRankStreak);
  const menuSystemMood = useGameStore((s) => s.menuSystemMood);
  const sectorAnomalies = useGameStore((s) => s.sectorAnomalies);
  const talentLevels = useGameStore((s) => s.talentLevels);

  const [exportBusy, setExportBusy] = useState(false);

  const onExport = useCallback(async () => {
    setExportBusy(true);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        combatArchitectHistory: history,
        globalCollection,
        nexusFragments,
        talentLevels,
        menuSystemMood,
        sectorAnomalies,
      };
      const sealed = await sealNexusDossierJson(payload);
      downloadTextFile(
        `nexus-sealed-dossier-${Date.now()}.json`,
        sealed,
        "application/json"
      );
    } finally {
      setExportBusy(false);
    }
  }, [globalCollection, history, menuSystemMood, nexusFragments, sectorAnomalies, talentLevels]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background:
          "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(34,211,238,0.14), rgba(2,6,12,0.97))",
        display: "flex",
        flexDirection: "column",
        padding: "16px 18px 20px",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: ".34em",
              color: "rgba(103, 232, 249, 0.78)",
            }}
          >
            Mainframe · Hall of Records
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: ".06em",
              color: "rgba(224, 250, 255, 0.96)",
            }}
          >
            Sternenkarte der Siege
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              opacity: 0.72,
              maxWidth: 520,
              lineHeight: 1.45,
              color: "rgba(186, 230, 253, 0.88)",
            }}
          >
            Archiv: {history.length} Läufe · Export verschlüsselt (
            {NEXUS_DOSSIER_EXPORT_PASSPHRASE})
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <motion.button
            type="button"
            disabled={exportBusy}
            onClick={() => void onExport()}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            style={{
              borderRadius: 10,
              border: "1px solid rgba(167,139,250,0.55)",
              background: "rgba(46,16,80,0.55)",
              color: "rgba(233,213,255,0.96)",
              letterSpacing: ".14em",
              fontSize: 10,
              padding: "10px 14px",
              cursor: exportBusy ? "wait" : "pointer",
              opacity: exportBusy ? 0.65 : 1,
            }}
          >
            {exportBusy ? "SEALING…" : "EXPORT ARCHIVE"}
          </motion.button>
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            style={{
              borderRadius: 10,
              border: "1px solid rgba(34,211,238,0.45)",
              background: "rgba(7,25,36,0.74)",
              color: "rgba(186,230,253,0.97)",
              letterSpacing: ".14em",
              fontSize: 10,
              padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            DISMISS
          </motion.button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
          minHeight: 0,
          alignContent: "stretch",
        }}
      >
        <ConstellationMap history={history} />
        <CreditsTerminal
          history={history}
          globalCollection={globalCollection}
          nexusFragments={nexusFragments}
          sRankStreak={sRankStreak}
        />
      </div>
    </motion.div>
  );
}

export default HallOfRecords;
