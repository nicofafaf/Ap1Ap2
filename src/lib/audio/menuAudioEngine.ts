import { useEffect } from "react";
import { getAllNexusEntries } from "../../data/nexusRegistry";
import { useGameStore } from "../../store/useGameStore";
import type { MenuSystemMood } from "../../store/useGameStore";
import { waitForAudioUserActivation } from "./audioUserActivation";
import { initNexusUiAudio } from "./nexusUiAudio";

type MenuAmbientState = {
  context: AudioContext | null;
  master: GainNode | null;
  lowpass: BiquadFilterNode | null;
  peaking: BiquadFilterNode | null;
  carrierGain: GainNode | null;
  waveShaper: WaveShaperNode | null;
  harmonicOsc: OscillatorNode | null;
  harmonicGain: GainNode | null;
  noiseSrc: AudioBufferSourceNode | null;
  noiseFilter: BiquadFilterNode | null;
  noiseGain: GainNode | null;
  lfoOsc: OscillatorNode | null;
  lfoGain: GainNode | null;
  oscA: OscillatorNode | null;
  oscB: OscillatorNode | null;
};

const shared: MenuAmbientState = {
  context: null,
  master: null,
  lowpass: null,
  peaking: null,
  carrierGain: null,
  waveShaper: null,
  harmonicOsc: null,
  harmonicGain: null,
  noiseSrc: null,
  noiseFilter: null,
  noiseGain: null,
  lfoOsc: null,
  lfoGain: null,
  oscA: null,
  oscB: null,
};

let hookRefCount = 0;

function linearShaperCurve(): Float32Array {
  const n = 256;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    c[i] = (i / (n - 1)) * 2 - 1;
  }
  return c;
}

function bitcrushCurve(steps: number): Float32Array {
  const n = 2048;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const x = (i / (n - 1)) * 2 - 1;
    const q = Math.round(x * steps) / steps;
    c[i] = Math.max(-1, Math.min(1, q));
  }
  return c;
}

function brownNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < frames; i += 1) {
    const w = (Math.random() * 2 - 1) * 0.12;
    last = (last + w) * 0.985;
    d[i] = Math.max(-1, Math.min(1, last * 3.2));
  }
  return buf;
}

function stopAllOscillators() {
  const s = shared;
  for (const o of [s.oscA, s.oscB, s.harmonicOsc, s.lfoOsc]) {
    if (!o) continue;
    try {
      o.stop();
    } catch {
      // no-op
    }
    try {
      o.disconnect();
    } catch {
      // no-op
    }
  }
  if (s.noiseSrc) {
    try {
      s.noiseSrc.stop();
    } catch {
      // no-op
    }
    try {
      s.noiseSrc.disconnect();
    } catch {
      // no-op
    }
  }
  s.oscA = null;
  s.oscB = null;
  s.harmonicOsc = null;
  s.lfoOsc = null;
  s.noiseSrc = null;
}

function disconnectGraph() {
  const s = shared;
  for (const node of [
    s.noiseFilter,
    s.noiseGain,
    s.harmonicGain,
    s.carrierGain,
    s.waveShaper,
    s.lowpass,
    s.peaking,
    s.master,
    s.lfoGain,
  ]) {
    if (!node) continue;
    try {
      node.disconnect();
    } catch {
      // no-op
    }
  }
  s.noiseFilter = null;
  s.noiseGain = null;
  s.harmonicGain = null;
  s.carrierGain = null;
  s.waveShaper = null;
  s.lowpass = null;
  s.peaking = null;
  s.master = null;
  s.lfoGain = null;
}

function stopMenuAmbientInternal() {
  stopAllOscillators();
  disconnectGraph();
  if (shared.context?.state !== "closed") {
    try {
      void shared.context?.close();
    } catch {
      // no-op
    }
  }
  shared.context = null;
}

function applyMoodToGraph(mood: MenuSystemMood | null, t: number) {
  const s = shared;
  if (!s.context || !s.master || !s.lowpass || !s.peaking || !s.harmonicGain || !s.noiseGain) {
    return;
  }

  const dir = mood?.direction ?? "stagnating";

  s.lowpass.type = "lowpass";
  s.lowpass.Q.setValueAtTime(0.65, t);

  if (dir === "improving") {
    s.lowpass.frequency.setTargetAtTime(5200, t, 0.35);
    s.peaking.type = "peaking";
    s.peaking.frequency.setTargetAtTime(2800, t, 0.25);
    s.peaking.Q.setValueAtTime(0.9, t);
    s.peaking.gain.setTargetAtTime(4.5, t, 0.3);
    s.harmonicGain.gain.setTargetAtTime(0.02, t, 0.4);
    s.noiseGain.gain.setTargetAtTime(0.0001, t, 0.2);
    if (s.waveShaper) s.waveShaper.curve = linearShaperCurve();
    if (s.lfoGain) s.lfoGain.gain.setTargetAtTime(0.004, t, 0.25);
  } else if (dir === "declining") {
    s.lowpass.frequency.setTargetAtTime(820, t, 0.45);
    s.peaking.type = "peaking";
    s.peaking.frequency.setTargetAtTime(380, t, 0.2);
    s.peaking.Q.setValueAtTime(2.1, t);
    s.peaking.gain.setTargetAtTime(7, t, 0.35);
    s.harmonicGain.gain.setTargetAtTime(0.0001, t, 0.2);
    s.noiseGain.gain.setTargetAtTime(0.032, t, 0.5);
    if (s.waveShaper) s.waveShaper.curve = bitcrushCurve(10);
    if (s.lfoGain) s.lfoGain.gain.setTargetAtTime(0.001, t, 0.2);
  } else {
    s.lowpass.frequency.setTargetAtTime(1650, t, 0.4);
    s.peaking.gain.setTargetAtTime(0.5, t, 0.25);
    s.harmonicGain.gain.setTargetAtTime(0.0001, t, 0.2);
    s.noiseGain.gain.setTargetAtTime(0.0001, t, 0.2);
    if (s.waveShaper) s.waveShaper.curve = linearShaperCurve();
    if (s.lfoGain) s.lfoGain.gain.setTargetAtTime(0.007, t, 0.35);
  }
}

async function startMenuAmbientInternal() {
  await waitForAudioUserActivation();
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;

  if (shared.context && shared.context.state !== "closed") {
    if (shared.context.state === "suspended") await shared.context.resume();
    return;
  }

  const ctx = new Ctor();
  shared.context = ctx;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.11, ctx.currentTime + 0.45);
  master.connect(ctx.destination);
  shared.master = master;

  const carrierGain = ctx.createGain();
  carrierGain.gain.value = 0.055;
  shared.carrierGain = carrierGain;

  const waveShaper = ctx.createWaveShaper();
  waveShaper.curve = linearShaperCurve();
  waveShaper.oversample = "2x";
  shared.waveShaper = waveShaper;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 1650;
  lowpass.Q.value = 0.65;
  shared.lowpass = lowpass;

  const peaking = ctx.createBiquadFilter();
  peaking.type = "peaking";
  peaking.frequency.value = 1200;
  peaking.Q.value = 0.8;
  peaking.gain.value = 1;
  shared.peaking = peaking;

  carrierGain.connect(waveShaper);
  waveShaper.connect(lowpass);
  lowpass.connect(peaking);
  peaking.connect(master);

  const oscA = ctx.createOscillator();
  oscA.type = "triangle";
  oscA.frequency.value = 62;
  const oscB = ctx.createOscillator();
  oscB.type = "sine";
  oscB.frequency.value = 124;
  oscA.connect(carrierGain);
  oscB.connect(carrierGain);
  const now = ctx.currentTime;
  oscA.start(now);
  oscB.start(now);
  shared.oscA = oscA;
  shared.oscB = oscB;

  const harmonicOsc = ctx.createOscillator();
  harmonicOsc.type = "sine";
  harmonicOsc.frequency.value = 330;
  const harmonicGain = ctx.createGain();
  harmonicGain.gain.value = 0.0001;
  harmonicOsc.connect(harmonicGain);
  harmonicGain.connect(lowpass);
  harmonicOsc.start(now);
  shared.harmonicOsc = harmonicOsc;
  shared.harmonicGain = harmonicGain;

  const noiseBuf = brownNoiseBuffer(ctx, 2.4);
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuf;
  noiseSrc.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 95;
  noiseFilter.Q.value = 0.6;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.0001;
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noiseSrc.start(now);
  shared.noiseSrc = noiseSrc;
  shared.noiseFilter = noiseFilter;
  shared.noiseGain = noiseGain;

  const lfoOsc = ctx.createOscillator();
  lfoOsc.type = "sine";
  lfoOsc.frequency.value = 1.14;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.007;
  lfoOsc.connect(lfoGain);
  lfoGain.connect(master);
  lfoOsc.start(now);
  shared.lfoOsc = lfoOsc;
  shared.lfoGain = lfoGain;

  const mood = useGameStore.getState().menuSystemMood;
  applyMoodToGraph(mood, ctx.currentTime);

  if (ctx.state === "suspended") await ctx.resume();
}

/**
 * Ambient-Menü-Schicht: reagiert auf {@link MenuSystemMood} (Filter, Harmonie, Bitcrush, Rauschen, Puls)
 */
export function useMenuAmbientAudio(active: boolean) {
  const mood = useGameStore((s) => s.menuSystemMood);

  useEffect(() => {
    initNexusUiAudio();
  }, []);

  useEffect(() => {
    if (!active) return;
    hookRefCount += 1;
    void startMenuAmbientInternal();
    return () => {
      hookRefCount = Math.max(0, hookRefCount - 1);
      if (hookRefCount === 0) {
        stopMenuAmbientInternal();
      }
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const ctx = shared.context;
    if (!ctx) return;
    applyMoodToGraph(mood, ctx.currentTime);
  }, [mood, active]);
}

/* —— Hall of Records: sphärische Langsam-Harmonie aus allen Boss-Themes —— */

type HallHarmonyState = {
  context: AudioContext | null;
  master: GainNode | null;
  sources: AudioBufferSourceNode[];
  merger: GainNode | null;
};

const hallHarmony: HallHarmonyState = {
  context: null,
  master: null,
  sources: [],
  merger: null,
};

let hallHarmonyRefCount = 0;

function makeDiffuseImpulse(ctx: AudioContext, seconds: number): AudioBuffer {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, frames, ctx.sampleRate);
  for (let ch = 0; ch < buf.numberOfChannels; ch += 1) {
    const d = buf.getChannelData(ch);
    let e = 1;
    for (let i = 0; i < frames; i += 1) {
      const n = (Math.random() * 2 - 1) * 0.22;
      d[i] = n * e;
      e *= 0.99915;
    }
  }
  return buf;
}

function stopHallHarmonyInternal() {
  for (const s of hallHarmony.sources) {
    try {
      s.stop();
    } catch {
      // no-op
    }
    try {
      s.disconnect();
    } catch {
      // no-op
    }
  }
  hallHarmony.sources = [];
  if (hallHarmony.merger) {
    try {
      hallHarmony.merger.disconnect();
    } catch {
      // no-op
    }
    hallHarmony.merger = null;
  }
  if (hallHarmony.master) {
    try {
      hallHarmony.master.disconnect();
    } catch {
      // no-op
    }
    hallHarmony.master = null;
  }
  if (hallHarmony.context && hallHarmony.context.state !== "closed") {
    try {
      void hallHarmony.context.close();
    } catch {
      // no-op
    }
  }
  hallHarmony.context = null;
}

async function startHallHarmonyInternal() {
  await waitForAudioUserActivation();
  const Ctor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;

  if (hallHarmony.context && hallHarmony.context.state !== "closed") {
    if (hallHarmony.context.state === "suspended") await hallHarmony.context.resume();
    return;
  }

  const ctx = new Ctor();
  hallHarmony.context = ctx;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.19, ctx.currentTime + 1.1);
  master.connect(ctx.destination);
  hallHarmony.master = master;

  const conv = ctx.createConvolver();
  conv.buffer = makeDiffuseImpulse(ctx, 2.8);
  const convGain = ctx.createGain();
  convGain.gain.value = 0.42;
  conv.connect(convGain);
  convGain.connect(master);

  const dry = ctx.createGain();
  dry.gain.value = 0.58;
  dry.connect(master);

  const merger = ctx.createGain();
  merger.gain.value = 1;
  hallHarmony.merger = merger;
  merger.connect(conv);
  merger.connect(dry);

  const entries = getAllNexusEntries();
  const paths = [...new Set(entries.map((e) => e.audio.trackPath))];
  const now = ctx.currentTime;

  for (let i = 0; i < paths.length; i += 1) {
    const path = paths[i]!;
    let buffer: AudioBuffer | null = null;
    try {
      const res = await fetch(path);
      if (res.ok) {
        const raw = await res.arrayBuffer();
        buffer = await ctx.decodeAudioData(raw.slice(0));
      }
    } catch {
      buffer = null;
    }
    if (!buffer) continue;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const rate = 0.085 + (i % 5) * 0.014 + (i * 0.007) % 0.02;
    src.playbackRate.setValueAtTime(rate, now);

    const band = ctx.createBiquadFilter();
    band.type = "lowpass";
    band.frequency.value = 420 + i * 180;
    band.Q.value = 0.55;

    const g = ctx.createGain();
    g.gain.value = 0.52 / Math.max(1, paths.length);

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 90;
    hp.Q.value = 0.65;

    src.connect(hp);
    hp.connect(band);
    band.connect(g);
    g.connect(merger);
    src.start(now);
    hallHarmony.sources.push(src);
  }

  if (ctx.state === "suspended") await ctx.resume();
}

/**
 * Final Harmony: extrem verlangsamte Boss-Themes als eine Klangwolke (Dry + diffuser Hall)
 */
export function useHallRecordsHarmony(active: boolean) {
  useEffect(() => {
    initNexusUiAudio();
  }, []);

  useEffect(() => {
    if (!active) return;
    hallHarmonyRefCount += 1;
    void startHallHarmonyInternal();
    return () => {
      hallHarmonyRefCount = Math.max(0, hallHarmonyRefCount - 1);
      if (hallHarmonyRefCount === 0) {
        stopHallHarmonyInternal();
      }
    };
  }, [active]);
}

/** Stern-Klick: Boss-Todes-Log in starker Zeitlupe */
export function playHallVictoryLog(path: string, playbackRate = 0.3) {
  const a = new Audio(path);
  a.preservesPitch = false;
  a.playbackRate = playbackRate;
  a.volume = 0.85;
  void a.play().catch(() => {
    // no-op
  });
}
