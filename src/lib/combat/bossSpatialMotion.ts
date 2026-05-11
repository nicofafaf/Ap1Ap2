/** Mutable sync from useBossAI rAF — read in BossStage motion loop (no React subscribe). */
export const bossSpatialMotionSync = {
  swayAmpMul: 1,
  swaySpeedMul: 1,
};

export function syncBossSpatialMotion(aggression: number) {
  const a = Math.max(1, Math.min(5, aggression));
  const t = (a - 1) / 4;
  bossSpatialMotionSync.swayAmpMul = 0.78 + t * 0.38;
  bossSpatialMotionSync.swaySpeedMul = 0.82 + t * 0.34;
}
