import { waitForAudioUserActivation } from "./audioUserActivation";

let initialized = false;

const HOVER_THROTTLE_MS = 140;

const STRICT = [
  "button",
  "a[href]",
  '[role="button"]',
  '[role="menuitem"]',
  '[role="tab"]',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  "label[for]",
  "[data-sfx-hover]",
].join(",");

const closestInteractive = (el: EventTarget | null, allowPointerDiv: boolean) => {
  const target = el as Element | null;
  if (!target?.closest) return null;
  const strict = target.closest(STRICT);
  if (strict) return strict as HTMLElement;
  if (allowPointerDiv) {
    const cp = target.closest(".cursor-pointer") as HTMLElement | null;
    if (
      cp &&
      cp.dataset.sfxIgnore == null &&
      cp.getAttribute("aria-disabled") !== "true"
    ) {
      return cp;
    }
  }
  return null;
};

const sfxDisabled = (el: HTMLElement | null) => !!el?.dataset && el.dataset.sfx === "off";

let uiCtx: AudioContext | null = null;

async function getUiContext(): Promise<AudioContext | null> {
  await waitForAudioUserActivation();
  if (typeof window === "undefined") return null;
  if (uiCtx) {
    if (uiCtx.state === "suspended") await uiCtx.resume().catch(() => {});
    return uiCtx;
  }
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  uiCtx = new Ctor();
  if (uiCtx.state === "suspended") await uiCtx.resume().catch(() => {});
  return uiCtx;
}

function playTone(
  ctx: AudioContext,
  kind: "hover" | "click" | "heavy" | "glitch"
) {
  const t = ctx.currentTime;
  const root = ctx.createGain();
  root.connect(ctx.destination);

  if (kind === "hover") {
    root.gain.setValueAtTime(0.0001, t);
    root.gain.exponentialRampToValueAtTime(0.14, t + 0.006);
    root.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(1420, t);
    o.frequency.exponentialRampToValueAtTime(2680, t + 0.038);
    o.connect(root);
    o.start(t);
    o.stop(t + 0.05);
    return;
  }

  if (kind === "click") {
    root.gain.setValueAtTime(0.0001, t);
    root.gain.exponentialRampToValueAtTime(0.32, t + 0.004);
    root.gain.exponentialRampToValueAtTime(0.0001, t + 0.072);
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.06);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4200;
    lp.Q.value = 0.7;
    o.connect(lp);
    lp.connect(root);
    o.start(t);
    o.stop(t + 0.08);
    return;
  }

  if (kind === "heavy") {
    root.gain.setValueAtTime(0.0001, t);
    root.gain.exponentialRampToValueAtTime(0.38, t + 0.012);
    root.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    const o1 = ctx.createOscillator();
    o1.type = "triangle";
    o1.frequency.setValueAtTime(240, t);
    o1.frequency.exponentialRampToValueAtTime(960, t + 0.1);
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.setValueAtTime(620, t);
    o2.frequency.exponentialRampToValueAtTime(180, t + 0.09);
    o1.connect(root);
    o2.connect(root);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 0.13);
    o2.stop(t + 0.13);
    return;
  }

  root.gain.setValueAtTime(0.0001, t);
  root.gain.exponentialRampToValueAtTime(0.22, t + 0.003);
  root.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  const carrier = ctx.createOscillator();
  carrier.type = "sawtooth";
  carrier.frequency.setValueAtTime(420, t);
  carrier.frequency.linearRampToValueAtTime(2400, t + 0.08);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800;
  bp.Q.value = 2.2;
  carrier.connect(bp);
  bp.connect(root);
  carrier.start(t);
  carrier.stop(t + 0.1);
}

export async function playNexusUiHoverSound() {
  try {
    const ctx = await getUiContext();
    if (!ctx) return;
    playTone(ctx, "hover");
  } catch {
    // no-op
  }
}

let lastResonancePingAt = 0;
const RESONANCE_PING_THROTTLE_MS = 200;

/**
 * Hover Resonance — extrem leiser HF-Ping (Shard / Glas), Web Audio
 */
export async function playHoverResonancePing() {
  try {
    const now = Date.now();
    if (now - lastResonancePingAt < RESONANCE_PING_THROTTLE_MS) return;
    lastResonancePingAt = now;
    const ctx = await getUiContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0.00008, t);
    master.gain.exponentialRampToValueAtTime(0.011, t + 0.0018);
    master.gain.exponentialRampToValueAtTime(0.00008, t + 0.022);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(6400, t);
    osc.frequency.exponentialRampToValueAtTime(8200, t + 0.016);
    osc.connect(master);
    osc.start(t);
    osc.stop(t + 0.026);
  } catch {
    // no-op
  }
}

export async function playNexusUiClickSound(heavy: boolean) {
  try {
    const ctx = await getUiContext();
    if (!ctx) return;
    playTone(ctx, heavy ? "heavy" : "click");
  } catch {
    // no-op
  }
}

export async function playNexusUiGlitchSound() {
  try {
    const ctx = await getUiContext();
    if (!ctx) return;
    playTone(ctx, "glitch");
  } catch {
    // no-op
  }
}

export const initNexusUiAudio = () => {
  if (initialized || typeof document === "undefined") return;
  initialized = true;

  let reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    // no-op
  }

  let lastHoverAt = 0;

  document.addEventListener(
    "mouseover",
    (e) => {
      if (reduced) return;
      const t = closestInteractive(e.target, false);
      if (!t || sfxDisabled(t)) return;
      const now = Date.now();
      if (now - lastHoverAt < HOVER_THROTTLE_MS) return;
      lastHoverAt = now;
      void playNexusUiHoverSound();
    },
    true
  );

  document.addEventListener(
    "click",
    (e) => {
      if (reduced) return;
      const t = closestInteractive(e.target, true);
      if (!t || sfxDisabled(t)) return;
      const heavy = t.dataset?.sfxClick === "heavy";
      void playNexusUiClickSound(heavy);
    },
    true
  );

  try {
    window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .addEventListener("change", (ev) => {
        reduced = ev.matches;
      });
  } catch {
    // no-op
  }
};
