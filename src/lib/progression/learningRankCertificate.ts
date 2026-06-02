import type { LearningRankId } from "../../data/learningRankRegistry";
import { getLearningRankDef } from "../../data/learningRankRegistry";

export type LearningRankCertInput = {
  rankId: LearningRankId;
  playerName: string;
  lp: number;
};

export async function downloadLearningRankCertificate(input: LearningRankCertInput): Promise<void> {
  const rank = getLearningRankDef(input.rankId);
  const title = input.rankId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const date = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, w, h, "F");
  doc.setTextColor(250, 204, 21);
  doc.setFontSize(11);
  doc.text("LernenSchule · Lern-Rang", w / 2, 18, { align: "center" });
  doc.setFontSize(28);
  doc.text(title, w / 2, 42, { align: "center" });
  doc.setTextColor(226, 232, 240);
  doc.setFontSize(14);
  doc.text(input.playerName, w / 2, 58, { align: "center" });
  doc.setFontSize(11);
  doc.text(`Lernpunkte: ${input.lp} · ${date}`, w / 2, 72, { align: "center" });
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  const body =
    "Diese Urkunde bestätigt den erreichten Lern-Rang im Nexus Path — Fortschritt aus Übungen und Ranked-Sprints.";
  doc.text(body, w / 2, 88, { align: "center", maxWidth: w - 24 });
  doc.setDrawColor(rank.accent === "#94a3b8" ? 148 : 250, rank.accent === "#fde68a" ? 230 : 204, 21);
  doc.setLineWidth(0.8);
  doc.roundedRect(12, 12, w - 24, h - 24, 4, 4, "S");

  doc.save(`LernenSchule-Rang-${input.rankId}.pdf`);
}
