let unlocked = false;
let unlockPromise: Promise<void> | null = null;

const resolveAll: Array<() => void> = [];

function attachUnlockListeners() {
  if (typeof window === "undefined") return;
  const onInteract = () => {
    if (unlocked) return;
    unlocked = true;
    while (resolveAll.length) {
      const r = resolveAll.pop();
      r?.();
    }
    window.removeEventListener("pointerdown", onInteract, true);
    window.removeEventListener("keydown", onInteract, true);
    window.removeEventListener("touchstart", onInteract, true);
  };
  window.addEventListener("pointerdown", onInteract, { capture: true });
  window.addEventListener("keydown", onInteract, { capture: true });
  window.addEventListener("touchstart", onInteract, { capture: true });
}

/**
 * Browsers block AudioContext resume / reliable playback until a user gesture.
 * Callers should await this before creating or resuming Web Audio.
 */
export function waitForAudioUserActivation(): Promise<void> {
  if (unlocked) return Promise.resolve();
  if (!unlockPromise) {
    unlockPromise = new Promise<void>((resolve) => {
      resolveAll.push(resolve);
      attachUnlockListeners();
    });
  }
  return unlockPromise;
}

export function isAudioUserActivated(): boolean {
  return unlocked;
}
