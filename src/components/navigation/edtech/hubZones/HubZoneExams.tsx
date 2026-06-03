import { motion } from "framer-motion";
import { EdtechExamReadinessCard } from "../EdtechExamReadinessCard";
import { EdtechSommer2026ExamCard } from "../EdtechSommer2026ExamCard";
import { EDTECH_CARD } from "../edtechHubTokens";
import type { HubZoneContext } from "./hubZoneTypes";

export function HubZoneExams({ ctx }: { ctx: HubZoneContext }) {
  return (
    <div className="nx-edtech-zone-panel">
      <motion.section variants={EDTECH_CARD} className="nx-edtech-hub-section nx-edtech-hub-section--flush">
        <div className="nx-edtech-hub-exams-stack">
          <EdtechExamReadinessCard onFocusLf={ctx.onBeginLearningField} />
          <EdtechSommer2026ExamCard onStartPack={ctx.beginSommer2026Exam} />
        </div>
      </motion.section>
    </div>
  );
}
