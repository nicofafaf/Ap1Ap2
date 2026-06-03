import { motion } from "framer-motion";
import { CiscoCcnaHubPanel } from "../CiscoCcnaHubPanel";
import { EDTECH_CARD } from "../edtechHubTokens";
import type { HubZoneContext } from "./hubZoneTypes";

export function HubZoneCcna({ ctx }: { ctx: HubZoneContext }) {
  return (
    <div className="nx-edtech-zone-panel">
      <motion.section variants={EDTECH_CARD} className="nx-edtech-hub-section nx-edtech-hub-section--flush">
        <CiscoCcnaHubPanel
          onSessionStart={() => {
            ctx.onBeginLearningField(10);
          }}
        />
      </motion.section>
    </div>
  );
}
