import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../../store/useGameStore";
import { RANK_C_STATIC_PATH, RANK_SOUND_PATHS, type CombatRank } from "../../data/rankSoundConfig";
import { waitForAudioUserActivation } from "./audioUserActivation";
import { initNexusUiAudio } from "./nexusUiAudio";
import { getNexusEntryForLF, type LearningField } from "../../data/nexusRegistry";
import {
  anomalyPlaybackPitch,
  anomalyWaveShaperDrive,
} from "../combat/anomalyProcessor";

type AudioState = {
  context: AudioContext | null;
  gain: GainNode | null;
  lowPass: BiquadFilterNode | null;
  bassBoost: BiquadFilterNode | null;
  source: AudioBufferSourceNode | null;
  oneShot: AudioBufferSourceNode | null;
  oneShotGain: GainNode | null;
  encryptionOsc1: OscillatorNode | null;
  encryptionOsc2: OscillatorNode | null;
  encryptionGain: GainNode | null;
  phaseHumOsc1: OscillatorNode | null;
  phaseHumOsc2: OscillatorNode | null;
  phaseHumGain: GainNode | null;
  themeMix: "phase1" | "phase2";
  bufferByPath: Map<string, AudioBuffer>;
  activePath: string | null;
  artifactHumSrc: AudioBufferSourceNode | null;
  artifactHumWhis: OscillatorNode | null;
  artifactHumGain: GainNode | null;
  anomalyShaper: WaveShaperNode | null;
  /** Reaktiver High-Pass: öffnet sich mit steigendem Flow */
  flowHighPass: BiquadFilterNode | null;
};

const createState = (): AudioState => ({
  context: null,
  gain: null,
  lowPass: null,
  bassBoost: null,
  source: null,
  oneShot: null,
  oneShotGain: null,
  encryptionOsc1: null,
  encryptionOsc2: null,
  encryptionGain: null,
  phaseHumOsc1: null,
  phaseHumOsc2: null,
  phaseHumGain: null,
  themeMix: "phase1",
  bufferByPath: new Map<string, AudioBuffer>(),
  activePath: null,
  artifactHumSrc: null,
  artifactHumWhis: null,
  artifactHumGain: null,
  anomalyShaper: null,
  flowHighPass: null,
});

function disconnectAnomalyShaper(state: AudioState) {
  if (state.anomalyShaper) {
    try {
      state.anomalyShaper.disconnect();
    } catch {
      // no-op
    }
    state.anomalyShaper = null;
  }
}

function connectBossThemeSource(
  context: AudioContext,
  state: AudioState,
  source: AudioBufferSourceNode
) {
  disconnectAnomalyShaper(state);
  const dest = state.flowHighPass ?? state.lowPass ?? state.gain;
  if (!dest) return;
  const anomaly = useGameStore.getState().activeCombatAnomaly;
  if (anomaly) {
    const shaper = context.createWaveShaper();
    const n = 1024;
    const curve = new Float32Array(n);
    const w = anomalyWaveShaperDrive(anomaly);
    for (let i = 0; i < n; i += 1) {
      const x = i / (n / 2) - 1;
      curve[i] = Math.tanh(x * w);
    }
    shaper.curve = curve;
    shaper.oversample = "4x";
    state.anomalyShaper = shaper;
    source.connect(shaper);
    shaper.connect(dest);
  } else {
    source.connect(dest);
  }
}

const toAudioContext = () => {
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  return Ctor ? new Ctor() : null;
};

function isBundledSfxWavPath(path: string): boolean {
  return path.endsWith(".wav") && path.includes("/assets/Bluezone");
}

function decodeSyntheticSfxBuffer(context: AudioContext, path: string): AudioBuffer {
  const rate = context.sampleRate;
  let dur = 0.1;
  if (path.includes("glitch") || path.includes("data_glitch")) dur = 0.14;
  else if (path.includes("boom") || path.includes("grand")) dur = 0.2;
  else if (path.includes("transition") || path.includes("alien")) dur = 0.16;
  const frames = Math.max(1, Math.floor(rate * dur));
  const buf = context.createBuffer(1, frames, rate);
  const d = buf.getChannelData(0);
  let f0 = 640;
  if (path.includes("beep") || path.includes("high_tech")) f0 = 1680;
  else if (path.includes("alert")) f0 = 780;
  else if (path.includes("transition")) f0 = 360;
  else if (path.includes("glitch") || path.includes("data_glitch")) f0 = 920;
  else if (path.includes("alien")) f0 = 1100;
  else if (path.includes("impact") || path.includes("cinematic")) f0 = 480;
  else if (path.includes("lever") || path.includes("industrial")) f0 = 620;
  for (let i = 0; i < frames; i += 1) {
    const e = i / frames;
    const env = Math.exp(-3.1 * e) * (0.52 + 0.48 * Math.sin(Math.PI * e));
    d[i] = Math.sin((2 * Math.PI * f0 * (1 + 0.05 * e) * i) / rate) * env * 0.4;
  }
  return buf;
}

const sharedAudioState: AudioState = createState();
let encryptionAudioHookRefCount = 0;
let lastHandledCombatPhaseToken = 0;
let combatPhaseTransitionAudioBusy = false;
let dossierTeletypeIntervalId: ReturnType<typeof setInterval> | null = null;

type MentorAscBundle = {
  o1: OscillatorNode;
  o2: OscillatorNode;
  master: GainNode;
  ownerGen: number;
};

let mentorAscBundle: MentorAscBundle | null = null;
let mentorAscOwnerSeq = 0;

function teardownMentorAscension() {
  const bundle = mentorAscBundle;
  if (!bundle) return;
  try {
    bundle.o1.stop();
    bundle.o2.stop();
    bundle.master.disconnect();
  } catch {
    // no-op
  }
  mentorAscBundle = null;
}

/** Alle Hook-Instanzen teilen eine Engine — Teardown erst wenn der letzte Consumer unmountet */
let bossAudioEngineSubscriberCount = 0;
let latestBossAudioFullTeardown: () => void = () => {};
const CRITICAL_STINGER_SRC =
  "/assets/BluezoneCorp_Modern_Cinematic_Impact/Bluezone_BC0294_modern_cinematic_impact_boom_003.wav";
const ACHIEVEMENT_STINGER_SRC =
  "/assets/BluezoneCorp_Modern_Cinematic_Impact/Bluezone_BC0294_modern_cinematic_impact_022.wav";
const GRAND_SLAM_SUB_DROP_SRC =
  "/assets/BluezoneCorp_Modern_Cinematic_Impact/Bluezone_BC0294_modern_cinematic_impact_boom_003.wav";
const GRAND_SLAM_METAL_IMPACT_SRC =
  "/assets/BluezoneCorp_Industrial_Lever_Switch/Bluezone_BC0302_industrial_lever_switch_039.wav";
const GALLERY_DISCOVERY_SRC =
  "/assets/BluezoneCorp_Futuristic_User_Interface/Bluezone_BC0303_futuristic_user_interface_transition_006.wav";

export const useBossAudioEngine = () => {
  const stateRef = { current: sharedAudioState };
  const setAudioDebug = useGameStore((state) => state.setAudioDebug);
  const isCriticalPhase = useGameStore((state) => state.isCriticalPhase);
  const activeCombatAnomaly = useGameStore((state) => state.activeCombatAnomaly);
  const isDataEncrypted = useGameStore((state) => state.isDataEncrypted);
  const combatPhaseTransitionToken = useGameStore((state) => state.combatPhaseTransitionToken);
  const prevCriticalRef = useRef(false);
  const audioTuningRevision = useGameStore((state) => state.audioTuningRevision);
  const synapticFlow = useGameStore((state) => state.synapticFlow);
  const learningMentorStreak = useGameStore((state) => state.learningMentorStreak);
  const learningMentorColdToken = useGameStore((state) => state.learningMentorColdToken);
  const isSingularityActive = useGameStore((state) => state.isSingularityActive);
  const bossAdaptivePulseToken = useGameStore((state) => state.bossAdaptivePulseToken);
  const gameState = useGameStore((state) => state.gameState);
  const prevPulseForHeartRef = useRef(0);
  const wasSingularityHeartRef = useRef(false);
  const prevMentorColdRef = useRef(0);

  useEffect(() => {
    initNexusUiAudio();
  }, []);

  const publishAudioDebug = useCallback(() => {
    setAudioDebug(
      stateRef.current.activePath,
      stateRef.current.bufferByPath.size
    );
  }, [setAudioDebug, stateRef]);

  const wait = useCallback((ms: number) => {
    if (ms <= 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }, []);

  const ensureContext = useCallback(async () => {
    await waitForAudioUserActivation();
    const state = stateRef.current;
    if (!state.context) {
      state.context = toAudioContext();
      if (!state.context) return null;
      state.gain = state.context.createGain();
      state.lowPass = state.context.createBiquadFilter();
      state.bassBoost = state.context.createBiquadFilter();
      state.lowPass.type = "lowpass";
      state.lowPass.frequency.value = 18000;
      state.lowPass.Q.value = 0.7;
      state.flowHighPass = state.context.createBiquadFilter();
      state.flowHighPass.type = "highpass";
      state.flowHighPass.frequency.value = 72;
      state.flowHighPass.Q.value = 0.72;
      state.bassBoost.type = "lowshelf";
      state.bassBoost.frequency.value = 140;
      state.bassBoost.gain.value = 0;
      state.gain.gain.value = 0;
      state.flowHighPass.connect(state.lowPass);
      state.lowPass.connect(state.bassBoost);
      state.bassBoost.connect(state.gain);
      state.gain.connect(state.context.destination);
    }
    if (state.context.state === "suspended") {
      await state.context.resume();
    }
    return state.context;
  }, []);

  const fetchBuffer = useCallback(
    async (path: string) => {
      const state = stateRef.current;
      const context = await ensureContext();
      if (!context) return null;
      if (state.bufferByPath.has(path)) return state.bufferByPath.get(path) ?? null;

      const res = await fetch(path);
      if (!res.ok) {
        if (!isBundledSfxWavPath(path)) return null;
        const synth = decodeSyntheticSfxBuffer(context, path);
        state.bufferByPath.set(path, synth);
        publishAudioDebug();
        return synth;
      }
      const arr = await res.arrayBuffer();
      const buffer = await context.decodeAudioData(arr);
      state.bufferByPath.set(path, buffer);
      publishAudioDebug();
      return buffer;
    },
    [ensureContext, publishAudioDebug]
  );

  const stopPhaseHum = useCallback(() => {
    const state = stateRef.current;
    if (state.phaseHumOsc1) {
      try {
        state.phaseHumOsc1.stop();
      } catch {
        // no-op
      }
      try {
        state.phaseHumOsc1.disconnect();
      } catch {
        // no-op
      }
    }
    if (state.phaseHumOsc2) {
      try {
        state.phaseHumOsc2.stop();
      } catch {
        // no-op
      }
      try {
        state.phaseHumOsc2.disconnect();
      } catch {
        // no-op
      }
    }
    if (state.phaseHumGain) {
      try {
        state.phaseHumGain.disconnect();
      } catch {
        // no-op
      }
    }
    state.phaseHumOsc1 = null;
    state.phaseHumOsc2 = null;
    state.phaseHumGain = null;
  }, []);

  const stopCurrent = useCallback((fadeOutSec = 0.2) => {
    const state = stateRef.current;
    stopPhaseHum();
    state.themeMix = "phase1";
    useGameStore.setState({ activeBossThemePath: null });
    if (!state.context || !state.gain || !state.source) {
      publishAudioDebug();
      return;
    }

    disconnectAnomalyShaper(state);
    const now = state.context.currentTime;
    state.gain.gain.cancelScheduledValues(now);
    state.gain.gain.setValueAtTime(state.gain.gain.value, now);
    state.gain.gain.linearRampToValueAtTime(0, now + fadeOutSec);
    try {
      state.source.stop(now + fadeOutSec + 0.01);
    } catch {
      // no-op
    }
    state.source = null;
    state.activePath = null;
    publishAudioDebug();
  }, [publishAudioDebug, stopPhaseHum]);

  const stopOneShot = useCallback(() => {
    const state = stateRef.current;
    if (!state.oneShot) return;
    try {
      state.oneShot.stop();
    } catch {
      // no-op
    }
    state.oneShot = null;
    state.oneShotGain = null;
    publishAudioDebug();
  }, [publishAudioDebug]);

  const stopEncryptionDrone = useCallback(() => {
    const state = stateRef.current;
    if (state.encryptionOsc1) {
      try {
        state.encryptionOsc1.stop();
      } catch {
        // no-op
      }
      try {
        state.encryptionOsc1.disconnect();
      } catch {
        // no-op
      }
    }
    if (state.encryptionOsc2) {
      try {
        state.encryptionOsc2.stop();
      } catch {
        // no-op
      }
      try {
        state.encryptionOsc2.disconnect();
      } catch {
        // no-op
      }
    }
    if (state.encryptionGain) {
      try {
        state.encryptionGain.disconnect();
      } catch {
        // no-op
      }
    }
    state.encryptionOsc1 = null;
    state.encryptionOsc2 = null;
    state.encryptionGain = null;
  }, []);

  const startEncryptionDrone = useCallback(async () => {
    const state = stateRef.current;
    const context = await ensureContext();
    if (!context || state.encryptionOsc1) return;

    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.022, context.currentTime + 0.12);

    const highShelf = context.createBiquadFilter();
    highShelf.type = "highshelf";
    highShelf.frequency.value = 4200;
    highShelf.gain.value = 4.5;

    const o1 = context.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 3020;

    const o2 = context.createOscillator();
    o2.type = "square";
    o2.frequency.value = 3188;

    o1.connect(highShelf);
    o2.connect(highShelf);
    highShelf.connect(master);
    master.connect(context.destination);

    const now = context.currentTime;
    o1.start(now);
    o2.start(now);

    state.encryptionOsc1 = o1;
    state.encryptionOsc2 = o2;
    state.encryptionGain = master;
  }, [ensureContext]);

  const startPhaseEnvironmentHum = useCallback(async () => {
    const state = stateRef.current;
    const context = await ensureContext();
    if (!context || state.phaseHumOsc1) return;

    const master = context.createGain();
    const now = context.currentTime;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.038, now + 0.45);

    const lp = context.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    lp.Q.value = 0.6;

    const o1 = context.createOscillator();
    o1.type = "sawtooth";
    o1.frequency.value = 52;

    const o2 = context.createOscillator();
    o2.type = "sine";
    o2.frequency.value = 78;

    o1.connect(lp);
    o2.connect(lp);
    lp.connect(master);
    master.connect(context.destination);

    o1.start(now);
    o2.start(now);

    state.phaseHumOsc1 = o1;
    state.phaseHumOsc2 = o2;
    state.phaseHumGain = master;
  }, [ensureContext]);

  const performCombatPhaseTransition = useCallback(async () => {
    if (combatPhaseTransitionAudioBusy) return;
    combatPhaseTransitionAudioBusy = true;
    try {
      const state = stateRef.current;
      const context = await ensureContext();
      if (!context || !state.gain || !state.lowPass || !state.bassBoost) return;

      const lfNum = useGameStore.getState().activeLF;
      const lfKey = `LF${Math.max(1, Math.min(12, lfNum))}` as LearningField;
      const entry = getNexusEntryForLF(lfKey);

      if (state.source) {
        const now = context.currentTime;
        const g = Math.max(0.0001, state.gain.gain.value);
        state.gain.gain.cancelScheduledValues(now);
        state.gain.gain.setValueAtTime(g, now);
        state.gain.gain.linearRampToValueAtTime(0.0001, now + 0.1);
      }

      await wait(1200);

      if (state.source) {
        try {
          state.source.stop();
        } catch {
          // no-op
        }
        try {
          state.source.disconnect();
        } catch {
          // no-op
        }
        state.source = null;
        disconnectAnomalyShaper(state);
      }

      let phase2Path = entry.phase2ThemePath;
      let buffer = await fetchBuffer(phase2Path);
      if (!buffer) {
        phase2Path = entry.audio.trackPath;
        buffer = await fetchBuffer(phase2Path);
      }
      if (!buffer) return;

      const critical = useGameStore.getState().isCriticalPhase;
      const nowEq = context.currentTime;

      state.themeMix = "phase2";
      state.lowPass.frequency.cancelScheduledValues(nowEq);
      state.lowPass.frequency.setValueAtTime(state.lowPass.frequency.value, nowEq);
      state.lowPass.frequency.linearRampToValueAtTime(4800, nowEq + 0.38);
      state.bassBoost.gain.cancelScheduledValues(nowEq);
      state.bassBoost.gain.setValueAtTime(state.bassBoost.gain.value, nowEq);
      state.bassBoost.gain.linearRampToValueAtTime(7.2, nowEq + 0.42);

      await startPhaseEnvironmentHum();

      const nowStart = context.currentTime;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      connectBossThemeSource(context, state, source);
      const pitch = anomalyPlaybackPitch(useGameStore.getState().activeCombatAnomaly);
      source.playbackRate.setValueAtTime((critical ? 1.1 : 1.04) * pitch, nowStart);

      state.gain.gain.cancelScheduledValues(nowStart);
      state.gain.gain.setValueAtTime(0.0001, nowStart);
      state.gain.gain.exponentialRampToValueAtTime(0.9, nowStart + 0.42);

      source.start(nowStart);
      state.source = source;
      state.activePath = phase2Path;
      useGameStore.setState({ activeBossThemePath: phase2Path });
      publishAudioDebug();
    } finally {
      combatPhaseTransitionAudioBusy = false;
    }
  }, [ensureContext, fetchBuffer, publishAudioDebug, startPhaseEnvironmentHum, wait]);

  const startBossTheme = useCallback(
    async (path: string, fadeInSec = 2) => {
      const state = stateRef.current;
      const context = await ensureContext();
      if (!context || !state.gain) return false;

      if (state.activePath === path && state.source && state.themeMix === "phase1") {
        return true;
      }
      stopCurrent(0.18);

      const buffer = await fetchBuffer(path);
      if (!buffer) return false;

      state.themeMix = "phase1";
      if (state.lowPass && state.bassBoost) {
        const now = context.currentTime;
        state.lowPass.frequency.cancelScheduledValues(now);
        state.lowPass.frequency.setValueAtTime(18000, now);
        state.bassBoost.gain.cancelScheduledValues(now);
        state.bassBoost.gain.setValueAtTime(0, now);
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      connectBossThemeSource(context, state, source);

      const now = context.currentTime;
      state.gain.gain.cancelScheduledValues(now);
      state.gain.gain.setValueAtTime(0.0001, now);
      state.gain.gain.exponentialRampToValueAtTime(0.9, now + fadeInSec);
      const pitch = anomalyPlaybackPitch(useGameStore.getState().activeCombatAnomaly);
      source.playbackRate.value = (isCriticalPhase ? 1.1 : 1) * pitch;
      source.start(now);

      state.source = source;
      state.activePath = path;
      useGameStore.setState({ activeBossThemePath: path });
      publishAudioDebug();
      return true;
    },
    [ensureContext, fetchBuffer, stopCurrent, publishAudioDebug, isCriticalPhase]
  );

  const playVictory = useCallback(async (path: string) => {
    const state = stateRef.current;
    const context = await ensureContext();
    if (!context || !state.gain) return false;

    const buffer = await fetchBuffer(path);
    if (!buffer) return false;

    stopOneShot();
    const oneShot = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = 0.8;
    oneShot.buffer = buffer;
    oneShot.loop = false;
    oneShot.connect(gain);
    gain.connect(context.destination);
    oneShot.onended = () => {
      if (stateRef.current.oneShot === oneShot) {
        stateRef.current.oneShot = null;
        publishAudioDebug();
      }
    };
    oneShot.start();
    state.oneShot = oneShot;
    state.oneShotGain = gain;
    publishAudioDebug();
    return true;
  }, [ensureContext, fetchBuffer, stopOneShot, publishAudioDebug]);

  const fadeOutThemeAndPlayVictory = useCallback(
    async (victoryPath: string, fadeOutSec = 3, postDelayMs = 120) => {
      stopCurrent(fadeOutSec);
      if (fadeOutSec > 0) {
        await wait(fadeOutSec * 1000);
      }
      await wait(postDelayMs);
      return playVictory(victoryPath);
    },
    [playVictory, stopCurrent, wait]
  );

  const playLootRevealOneShot = useCallback(
    async (path: string, delayMs = 260) => {
      await wait(delayMs);
      return playVictory(path);
    },
    [playVictory, wait]
  );

  const playCriticalStinger = useCallback(async () => {
    const state = stateRef.current;
    const context = await ensureContext();
    if (!context || !state.gain) return false;
    const buffer = await fetchBuffer(CRITICAL_STINGER_SRC);
    if (!buffer) return false;

    const now = context.currentTime;
    // Priority ducking on background theme
    state.gain.gain.cancelScheduledValues(now);
    state.gain.gain.setValueAtTime(Math.max(0.1, state.gain.gain.value), now);
    state.gain.gain.linearRampToValueAtTime(0.35, now + 0.07);
    state.gain.gain.linearRampToValueAtTime(0.9, now + 0.58);

    const src = context.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = 0.96;

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 980;
    filter.Q.value = 4.2;

    const stingerGain = context.createGain();
    stingerGain.gain.setValueAtTime(0.0001, now);
    stingerGain.gain.exponentialRampToValueAtTime(0.95, now + 0.08);
    stingerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);

    src.connect(filter);
    filter.connect(stingerGain);
    stingerGain.connect(context.destination);
    src.start(now);
    return true;
  }, [ensureContext, fetchBuffer]);

  const playRankSound = useCallback(
    async (rank: CombatRank) => {
      const state = stateRef.current;
      const context = await ensureContext();
      if (!context || !state.gain) return false;
      const tuning = useGameStore.getState();
      const profile = tuning.rankAudioProfiles[rank];

      const path = RANK_SOUND_PATHS[rank];
      const mainBuffer = await fetchBuffer(path);
      if (!mainBuffer) return false;
      const staticBuffer =
        rank === "C" && tuning.cRankStaticLayerEnabled
          ? await fetchBuffer(RANK_C_STATIC_PATH)
          : null;
      const now = context.currentTime;
      const duckingDb = rank === "S" ? tuning.sRankDuckingDb : profile.ducking;
      const duckingLinear = Math.max(0.12, Math.min(1, Math.pow(10, duckingDb / 20)));
      const masterGain = tuning.rankSoundMasterGain;
      const dryGain = Math.max(0.1, Math.min(2.4, profile.gain * masterGain));
      const reverbAmount = Math.max(0, Math.min(1, profile.reverb));

      if (duckingDb < 0) {
        // Soft ducking based on profile values
        state.gain.gain.cancelScheduledValues(now);
        state.gain.gain.setValueAtTime(Math.max(0.15, state.gain.gain.value), now);
        state.gain.gain.linearRampToValueAtTime(duckingLinear, now + 0.08);
        state.gain.gain.linearRampToValueAtTime(0.9, now + 1.0);
      }

      stopOneShot();
      const oneShot = context.createBufferSource();
      const oneShotGain = context.createGain();
      const oneShotFilter = context.createBiquadFilter();

      oneShot.buffer = mainBuffer;
      oneShot.loop = false;
      oneShot.playbackRate.value = Math.max(0.5, Math.min(1.5, profile.playbackRate));
      oneShot.connect(oneShotFilter);
      oneShotFilter.connect(oneShotGain);
      oneShotGain.connect(context.destination);

      if (rank === "S") {
        oneShot.playbackRate.value = 1.02;
        oneShotFilter.type = "highshelf";
        oneShotFilter.frequency.value = 3800;
        oneShotFilter.gain.value = 2.2 + reverbAmount * 3.4;
        oneShotGain.gain.setValueAtTime(0.0001, now);
        oneShotGain.gain.exponentialRampToValueAtTime(Math.max(0.001, dryGain), now + 0.09);
        oneShotGain.gain.exponentialRampToValueAtTime(
          Math.max(0.001, dryGain * (0.2 + reverbAmount * 0.2)),
          now + 0.9
        );
      } else if (rank === "A") {
        oneShotFilter.type = "peaking";
        oneShotFilter.frequency.value = 1800;
        oneShotFilter.Q.value = 0.9;
        oneShotFilter.gain.value = 1.4 + reverbAmount * 2.2;
        oneShotGain.gain.setValueAtTime(dryGain, now);
      } else if (rank === "B") {
        oneShotFilter.type = "bandpass";
        oneShotFilter.frequency.value = 1700;
        oneShotFilter.Q.value = 0.9;
        oneShotGain.gain.setValueAtTime(dryGain, now);
      } else {
        oneShotFilter.type = "lowpass";
        oneShotFilter.frequency.value = 1300;
        oneShotFilter.Q.value = 1.1;
        oneShotGain.gain.setValueAtTime(dryGain, now);
      }

      oneShot.onended = () => {
        if (stateRef.current.oneShot === oneShot) {
          stateRef.current.oneShot = null;
          publishAudioDebug();
        }
      };

      oneShot.start(now);
      state.oneShot = oneShot;
      state.oneShotGain = oneShotGain;

      if (rank === "C" && staticBuffer) {
        const staticSrc = context.createBufferSource();
        const staticGain = context.createGain();
        staticSrc.buffer = staticBuffer;
        staticSrc.loop = false;
        staticSrc.playbackRate.value = Math.max(0.5, Math.min(1.5, profile.playbackRate * 1.08));
        staticGain.gain.setValueAtTime(
          Math.max(0.02, Math.min(0.45, 0.12 * masterGain + reverbAmount * 0.08)),
          now + 0.03
        );
        staticSrc.connect(staticGain);
        staticGain.connect(context.destination);
        staticSrc.start(now + 0.03);
      }

      publishAudioDebug();
      return true;
    },
    [ensureContext, fetchBuffer, publishAudioDebug, stopOneShot]
  );

  const playAchievementStinger = useCallback(async (sequenceIndex = 0) => {
    const state = stateRef.current;
    const context = await ensureContext();
    if (!context || !state.gain) return false;
    const buffer = await fetchBuffer(ACHIEVEMENT_STINGER_SRC);
    if (!buffer) return false;
    const now = context.currentTime;

    // Priority lane above other one-shots and theme
    state.gain.gain.cancelScheduledValues(now);
    state.gain.gain.setValueAtTime(Math.max(0.12, state.gain.gain.value), now);
    state.gain.gain.linearRampToValueAtTime(0.45, now + 0.05);
    state.gain.gain.linearRampToValueAtTime(0.9, now + 1.1);

    stopOneShot();
    const src = context.createBufferSource();
    src.buffer = buffer;
    src.loop = false;
    const pitchStep = Math.max(0, Math.min(0.18, sequenceIndex * 0.03));
    src.playbackRate.value = 1.04 + pitchStep;

    const preFilter = context.createBiquadFilter();
    preFilter.type = "highpass";
    preFilter.frequency.value = 280;
    preFilter.Q.value = 0.7;

    const tone = context.createBiquadFilter();
    tone.type = "highshelf";
    tone.frequency.value = 3600 + sequenceIndex * 95;
    tone.gain.value = 5.2;

    const dryGain = context.createGain();
    dryGain.gain.setValueAtTime(0.0001, now);
    dryGain.gain.exponentialRampToValueAtTime(1.08, now + 0.07);
    dryGain.gain.exponentialRampToValueAtTime(0.26, now + 1.25);

    const echoDelay = context.createDelay(1.2);
    echoDelay.delayTime.value = 0.2;
    const echoGain = context.createGain();
    echoGain.gain.setValueAtTime(0.34, now);
    echoGain.gain.linearRampToValueAtTime(0.0001, now + 1.4);

    src.connect(preFilter);
    preFilter.connect(tone);
    tone.connect(dryGain);
    tone.connect(echoDelay);
    echoDelay.connect(echoGain);
    echoGain.connect(context.destination);
    dryGain.connect(context.destination);

    src.onended = () => {
      if (stateRef.current.oneShot === src) {
        stateRef.current.oneShot = null;
        stateRef.current.oneShotGain = null;
        publishAudioDebug();
      }
    };

    src.start(now);
    state.oneShot = src;
    state.oneShotGain = dryGain;
    publishAudioDebug();
    return true;
  }, [ensureContext, fetchBuffer, publishAudioDebug, stopOneShot]);

  const playGrandSlamIntroStinger = useCallback(async () => {
    const state = stateRef.current;
    const context = await ensureContext();
    if (!context || !state.gain) return false;
    const subBuffer = await fetchBuffer(GRAND_SLAM_SUB_DROP_SRC);
    const impactBuffer = await fetchBuffer(GRAND_SLAM_METAL_IMPACT_SRC);
    if (!subBuffer || !impactBuffer) return false;
    const now = context.currentTime;

    // Short sidechain-style compression window before achievement chain starts
    state.gain.gain.cancelScheduledValues(now);
    state.gain.gain.setValueAtTime(Math.max(0.12, state.gain.gain.value), now);
    state.gain.gain.linearRampToValueAtTime(0.56, now + 0.07);
    state.gain.gain.linearRampToValueAtTime(0.56, now + 0.5);
    state.gain.gain.linearRampToValueAtTime(0.9, now + 0.86);

    const subSrc = context.createBufferSource();
    const subGain = context.createGain();
    const subLowPass = context.createBiquadFilter();
    subSrc.buffer = subBuffer;
    subSrc.loop = false;
    subSrc.playbackRate.value = 0.82;
    subLowPass.type = "lowpass";
    subLowPass.frequency.value = 180;
    subLowPass.Q.value = 1.3;
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(1.15, now + 0.1);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
    subSrc.connect(subLowPass);
    subLowPass.connect(subGain);
    subGain.connect(context.destination);

    const impactSrc = context.createBufferSource();
    const impactGain = context.createGain();
    const impactHp = context.createBiquadFilter();
    impactSrc.buffer = impactBuffer;
    impactSrc.loop = false;
    impactSrc.playbackRate.value = 0.93;
    impactHp.type = "highpass";
    impactHp.frequency.value = 760;
    impactHp.Q.value = 1.1;
    impactGain.gain.setValueAtTime(0.0001, now + 0.16);
    impactGain.gain.exponentialRampToValueAtTime(1.05, now + 0.22);
    impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.92);
    impactSrc.connect(impactHp);
    impactHp.connect(impactGain);
    impactGain.connect(context.destination);

    subSrc.start(now);
    impactSrc.start(now + 0.14);
    return true;
  }, [ensureContext, fetchBuffer]);

  const playLegendaryReveal = useCallback(
    async (delayMs = 0) => {
      const context = await ensureContext();
      if (!context) return false;
      const t = context.currentTime + Math.max(0, delayMs) / 1000 + 0.003;
      const master = context.createGain();
      master.gain.setValueAtTime(0.0001, t);
      master.gain.exponentialRampToValueAtTime(0.78, t + 0.12);
      master.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      master.connect(context.destination);

      /** Tiefer Sinus-Gong (nur Legendary-Drops) */
      const gong = context.createOscillator();
      gong.type = "sine";
      gong.frequency.setValueAtTime(41, t);
      gong.frequency.exponentialRampToValueAtTime(28, t + 0.85);
      const gongGain = context.createGain();
      gongGain.gain.setValueAtTime(0.0001, t);
      gongGain.gain.exponentialRampToValueAtTime(0.68, t + 0.14);
      gongGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.75);
      gong.connect(gongGain);
      gongGain.connect(master);

      const sub = context.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(20.5, t);
      sub.frequency.exponentialRampToValueAtTime(14, t + 0.9);
      const subG = context.createGain();
      subG.gain.setValueAtTime(0.0001, t);
      subG.gain.exponentialRampToValueAtTime(0.32, t + 0.18);
      subG.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      sub.connect(subG);
      subG.connect(master);

      const room = context.createConvolver();
      const irLen = Math.floor(context.sampleRate * 1.8);
      const ir = context.createBuffer(1, irLen, context.sampleRate);
      const irCh = ir.getChannelData(0);
      for (let i = 0; i < irLen; i += 1) {
        const d = i / irLen;
        irCh[i] = (Math.random() * 2 - 1) * Math.pow(1 - d, 2.1) * 0.14;
      }
      room.buffer = ir;
      const roomWet = context.createGain();
      roomWet.gain.setValueAtTime(0.0001, t);
      roomWet.gain.exponentialRampToValueAtTime(0.42, t + 0.08);
      roomWet.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      const send = context.createGain();
      send.gain.value = 0.55;
      gongGain.connect(send);
      send.connect(room);
      room.connect(roomWet);
      roomWet.connect(master);

      gong.start(t);
      sub.start(t);
      gong.stop(t + 3.1);
      sub.stop(t + 3.1);
      return true;
    },
    [ensureContext]
  );

  const stopArtifactHum = useCallback(() => {
    const state = stateRef.current;
    if (state.artifactHumSrc) {
      try {
        state.artifactHumSrc.stop();
      } catch {
        // no-op
      }
      try {
        state.artifactHumSrc.disconnect();
      } catch {
        // no-op
      }
    }
    if (state.artifactHumWhis) {
      try {
        state.artifactHumWhis.stop();
      } catch {
        // no-op
      }
      try {
        state.artifactHumWhis.disconnect();
      } catch {
        // no-op
      }
    }
    if (state.artifactHumGain) {
      try {
        state.artifactHumGain.disconnect();
      } catch {
        // no-op
      }
    }
    state.artifactHumSrc = null;
    state.artifactHumWhis = null;
    state.artifactHumGain = null;
  }, []);

  const stopDossierTeletypeTick = useCallback(() => {
    if (dossierTeletypeIntervalId != null) {
      window.clearInterval(dossierTeletypeIntervalId);
      dossierTeletypeIntervalId = null;
    }
  }, []);

  /** Schnelles mechanisches Ticken (Fernschreiber) während Dossier-Zeileneinblendung */
  const playDossierTeletypeTick = useCallback(async () => {
    const context = await ensureContext();
    if (!context) return;
    stopDossierTeletypeTick();

    const click = () => {
      const t = context.currentTime;
      const osc = context.createOscillator();
      osc.type = "square";
      osc.frequency.value = 210;
      const lp = context.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1800;
      lp.Q.value = 0.7;
      const g = context.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.055, t + 0.0015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.024);
      osc.connect(lp);
      lp.connect(g);
      g.connect(context.destination);
      osc.start(t);
      osc.stop(t + 0.028);
    };

    click();
    dossierTeletypeIntervalId = window.setInterval(click, 68);
  }, [ensureContext, stopDossierTeletypeTick]);

  /** Schwerer metallischer Archiv-Stempel mit Hall */
  const playArchiveSealKlunk = useCallback(async () => {
    const context = await ensureContext();
    if (!context) return;
    const t = context.currentTime + 0.004;

    const body = context.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(220, t);
    body.frequency.exponentialRampToValueAtTime(38, t + 0.22);

    const clang = context.createOscillator();
    clang.type = "square";
    clang.frequency.setValueAtTime(480, t);
    clang.frequency.exponentialRampToValueAtTime(120, t + 0.05);

    const nFrames = Math.max(1, Math.floor(context.sampleRate * 0.06));
    const nBuf = context.createBuffer(1, nFrames, context.sampleRate);
    const nd = nBuf.getChannelData(0);
    for (let i = 0; i < nFrames; i += 1) {
      const e = i / nFrames;
      nd[i] = (Math.random() * 2 - 1) * (1 - e) * 0.85;
    }
    const noise = context.createBufferSource();
    noise.buffer = nBuf;

    const dry = context.createGain();
    dry.gain.setValueAtTime(0.0001, t);
    dry.gain.exponentialRampToValueAtTime(0.42, t + 0.008);
    dry.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

    const delay1 = context.createDelay(0.9);
    delay1.delayTime.value = 0.07;
    const delay2 = context.createDelay(0.9);
    delay2.delayTime.value = 0.19;
    const wet1 = context.createGain();
    wet1.gain.setValueAtTime(0.0001, t);
    wet1.gain.exponentialRampToValueAtTime(0.26, t + 0.018);
    wet1.gain.exponentialRampToValueAtTime(0.0001, t + 0.72);
    const wet2 = context.createGain();
    wet2.gain.setValueAtTime(0.0001, t);
    wet2.gain.exponentialRampToValueAtTime(0.18, t + 0.04);
    wet2.gain.exponentialRampToValueAtTime(0.0001, t + 0.88);

    const lp = context.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4200;

    body.connect(lp);
    clang.connect(lp);
    noise.connect(lp);
    lp.connect(dry);
    dry.connect(context.destination);

    lp.connect(delay1);
    delay1.connect(wet1);
    wet1.connect(context.destination);
    lp.connect(delay2);
    delay2.connect(wet2);
    wet2.connect(context.destination);

    body.start(t);
    clang.start(t);
    noise.start(t);
    body.stop(t + 0.28);
    clang.stop(t + 0.08);
    noise.stop(t + 0.055);
  }, [ensureContext]);

  const playArtifactHum = useCallback(async () => {
    const state = stateRef.current;
    const context = await ensureContext();
    if (!context) return;
    stopArtifactHum();
    const frames = Math.floor(context.sampleRate * 1.8);
    const buf = context.createBuffer(1, frames, context.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.22;
    }
    const src = context.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const hp = context.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 720;
    const bp = context.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2800;
    bp.Q.value = 0.42;
    const shelf = context.createBiquadFilter();
    shelf.type = "highshelf";
    shelf.frequency.value = 6200;
    shelf.gain.value = -8;
    const whis = context.createOscillator();
    whis.type = "sine";
    whis.frequency.value = 412;
    const wg = context.createGain();
    wg.gain.value = 0.012;
    whis.connect(wg);
    const master = context.createGain();
    master.gain.value = 0.038;
    src.connect(hp);
    hp.connect(bp);
    bp.connect(shelf);
    shelf.connect(master);
    wg.connect(master);
    master.connect(context.destination);
    const now = context.currentTime;
    whis.start(now);
    src.start(now);
    state.artifactHumSrc = src;
    state.artifactHumWhis = whis;
    state.artifactHumGain = master;
  }, [ensureContext, stopArtifactHum]);

  const playLootPop = useCallback(
    async (delayMs = 0) => {
      const context = await ensureContext();
      if (!context) return false;
      const t = context.currentTime + Math.max(0, delayMs) / 1000 + 0.002;
      const frames = Math.max(1, Math.floor(context.sampleRate * 0.052));
      const buf = context.createBuffer(1, frames, context.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < frames; i += 1) {
        const e = i / frames;
        const env = Math.pow(e, 0.2) * Math.pow(1 - e, 2.6);
        data[i] = (Math.random() * 2 - 1) * env * 1.05;
      }
      const src = context.createBufferSource();
      src.buffer = buf;
      const bp = context.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(1600, t);
      bp.frequency.exponentialRampToValueAtTime(6800, t + 0.035);
      bp.Q.value = 1.28;
      const shelf = context.createBiquadFilter();
      shelf.type = "highshelf";
      shelf.frequency.value = 5200;
      shelf.gain.value = 6.2;
      const main = context.createGain();
      main.gain.setValueAtTime(0.0001, t);
      main.gain.exponentialRampToValueAtTime(0.58, t + 0.007);
      main.gain.exponentialRampToValueAtTime(0.0001, t + 0.088);
      const delay = context.createDelay(0.07);
      delay.delayTime.value = 0.038;
      const wet = context.createGain();
      wet.gain.setValueAtTime(0.0001, t);
      wet.gain.exponentialRampToValueAtTime(0.36, t + 0.01);
      wet.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      src.connect(bp);
      bp.connect(shelf);
      shelf.connect(main);
      main.connect(context.destination);
      const send = context.createGain();
      send.gain.value = 0.42;
      shelf.connect(send);
      send.connect(delay);
      delay.connect(wet);
      wet.connect(context.destination);
      src.start(t);
      src.stop(t + 0.075);
      return true;
    },
    [ensureContext]
  );

  const playVictoryFinisherSequence = useCallback(
    async (signal?: AbortSignal) => {
      const state = stateRef.current;
      const context = await ensureContext();
      if (!context || !state.gain) return;

      const t0 = context.currentTime + 0.02;
      const tCrack = t0 + 0.5;
      const toStop: AudioBufferSourceNode[] = [];

      const onAbort = () => {
        for (const s of toStop) {
          try {
            s.stop();
          } catch {
            // no-op
          }
        }
        toStop.length = 0;
      };
      signal?.addEventListener("abort", onAbort, { once: true });

      const nowGain = Math.max(0.08, Math.min(1, state.gain.gain.value));
      state.gain.gain.cancelScheduledValues(t0);
      state.gain.gain.setValueAtTime(nowGain, t0);
      state.gain.gain.linearRampToValueAtTime(0.055, t0 + 0.14);
      state.gain.gain.linearRampToValueAtTime(0.055, tCrack - 0.02);
      state.gain.gain.linearRampToValueAtTime(0.72, tCrack + 0.35);
      state.gain.gain.linearRampToValueAtTime(0.88, tCrack + 1.8);

      const noiseDur = 0.34;
      const noiseFrames = Math.max(1, Math.floor(context.sampleRate * noiseDur));
      const noiseBuf = context.createBuffer(1, noiseFrames, context.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i += 1) {
        const e = i / nd.length;
        const amp = e * e;
        nd[i] = (Math.random() * 2 - 1) * amp * 0.5;
      }
      const noiseSrc = context.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      const noiseGain = context.createGain();
      noiseGain.gain.setValueAtTime(0.0001, t0);
      noiseGain.gain.exponentialRampToValueAtTime(0.11, t0 + 0.08);
      noiseGain.gain.exponentialRampToValueAtTime(0.2, t0 + 0.28);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + noiseDur);
      noiseSrc.connect(noiseGain);
      noiseGain.connect(context.destination);
      noiseSrc.start(t0);
      noiseSrc.stop(t0 + noiseDur);
      toStop.push(noiseSrc);

      const subBuffer = await fetchBuffer(GRAND_SLAM_SUB_DROP_SRC);
      const impactBuffer = await fetchBuffer(GRAND_SLAM_METAL_IMPACT_SRC);
      const glassBuffer = await fetchBuffer(GALLERY_DISCOVERY_SRC);
      if (signal?.aborted) {
        onAbort();
        return;
      }

      const irLen = Math.floor(context.sampleRate * 2.4);
      const ir = context.createBuffer(2, irLen, context.sampleRate);
      for (let c = 0; c < ir.numberOfChannels; c += 1) {
        const chd = ir.getChannelData(c);
        for (let i = 0; i < irLen; i += 1) {
          const d = i / irLen;
          chd[i] = (Math.random() * 2 - 1) * Math.pow(1 - d, 1.85) * 0.2;
        }
      }
      const conv = context.createConvolver();
      conv.buffer = ir;
      const convGain = context.createGain();
      convGain.gain.value = 0.62;
      conv.connect(convGain);
      convGain.connect(context.destination);

      const dryGain = context.createGain();
      dryGain.gain.value = 1;
      const wetSend = context.createGain();
      wetSend.gain.value = 0.78;

      const scheduleCrack = (
        buffer: AudioBuffer,
        when: number,
        playbackRate: number,
        dryPeak: number,
        wetPeak: number,
        filterSetup?: (f: BiquadFilterNode) => void
      ) => {
        const src = context.createBufferSource();
        src.buffer = buffer;
        src.playbackRate.value = playbackRate;
        const filt = context.createBiquadFilter();
        filt.type = "highpass";
        filt.frequency.value = 140;
        filt.Q.value = 0.7;
        filterSetup?.(filt);
        const gDry = context.createGain();
        gDry.gain.setValueAtTime(0.0001, when);
        gDry.gain.exponentialRampToValueAtTime(dryPeak, when + 0.018);
        gDry.gain.exponentialRampToValueAtTime(0.0001, when + 2.85);
        const gWet = context.createGain();
        gWet.gain.setValueAtTime(0.0001, when);
        gWet.gain.exponentialRampToValueAtTime(wetPeak, when + 0.022);
        gWet.gain.exponentialRampToValueAtTime(0.0001, when + 3.4);
        src.connect(filt);
        filt.connect(gDry);
        filt.connect(gWet);
        gDry.connect(dryGain);
        gWet.connect(wetSend);
        src.start(when);
        toStop.push(src);
      };

      dryGain.connect(context.destination);
      wetSend.connect(conv);

      if (subBuffer) {
        scheduleCrack(subBuffer, tCrack, 0.78, 1.05, 0.55, (f) => {
          f.type = "lowpass";
          f.frequency.value = 420;
        });
      }
      if (impactBuffer) {
        scheduleCrack(impactBuffer, tCrack, 0.94, 0.92, 0.62, (f) => {
          f.type = "highpass";
          f.frequency.value = 720;
          f.Q.value = 1.05;
        });
      }
      if (glassBuffer) {
        scheduleCrack(glassBuffer, tCrack + 0.004, 1.02, 0.38, 0.85, (f) => {
          f.type = "bandpass";
          f.frequency.value = 2800;
          f.Q.value = 0.85;
        });
      }

      window.setTimeout(
        () => {
          signal?.removeEventListener("abort", onAbort);
        },
        5200
      );
    },
    [ensureContext, fetchBuffer]
  );

  const playGalleryDiscovery = useCallback(async () => {
    const state = stateRef.current;
    const context = await ensureContext();
    if (!context) return false;
    const buffer = await fetchBuffer(GALLERY_DISCOVERY_SRC);
    if (!buffer) return false;
    const now = context.currentTime;
    const src = context.createBufferSource();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    src.buffer = buffer;
    src.loop = false;
    src.playbackRate.value = 0.98;
    filter.type = "highshelf";
    filter.frequency.value = 3000;
    filter.gain.value = 3.5;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.85, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    src.start(now);
    state.oneShot = src;
    state.oneShotGain = gain;
    publishAudioDebug();
    return true;
  }, [ensureContext, fetchBuffer, publishAudioDebug]);

  latestBossAudioFullTeardown = () => {
    teardownMentorAscension();
    stopCurrent(0.12);
    stopOneShot();
    stopEncryptionDrone();
    stopArtifactHum();
    stopDossierTeletypeTick();
    const s = sharedAudioState;
    disconnectAnomalyShaper(s);
    try {
      if (s.flowHighPass) {
        try {
          s.flowHighPass.disconnect();
        } catch {
          // no-op
        }
        s.flowHighPass = null;
      }
      if (s.lowPass) {
        try {
          s.lowPass.disconnect();
        } catch {
          // no-op
        }
        s.lowPass = null;
      }
      if (s.bassBoost) {
        try {
          s.bassBoost.disconnect();
        } catch {
          // no-op
        }
        s.bassBoost = null;
      }
      if (s.gain) {
        try {
          s.gain.disconnect();
        } catch {
          // no-op
        }
        s.gain = null;
      }
      if (s.context && s.context.state !== "closed") {
        void s.context.close();
      }
    } catch {
      // no-op
    }
    Object.assign(s, createState());
    encryptionAudioHookRefCount = 0;
    lastHandledCombatPhaseToken = 0;
    combatPhaseTransitionAudioBusy = false;
  };

  useEffect(() => {
    bossAudioEngineSubscriberCount += 1;
    return () => {
      bossAudioEngineSubscriberCount -= 1;
      queueMicrotask(() => {
        if (bossAudioEngineSubscriberCount <= 0) {
          bossAudioEngineSubscriberCount = 0;
          latestBossAudioFullTeardown();
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!isDataEncrypted) {
      encryptionAudioHookRefCount = 0;
      stopEncryptionDrone();
      return;
    }
    encryptionAudioHookRefCount += 1;
    void startEncryptionDrone();
    return () => {
      encryptionAudioHookRefCount = Math.max(0, encryptionAudioHookRefCount - 1);
      if (encryptionAudioHookRefCount === 0) {
        stopEncryptionDrone();
      }
    };
  }, [isDataEncrypted, startEncryptionDrone, stopEncryptionDrone]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state.context || !state.source || !state.lowPass || !state.bassBoost) {
      return;
    }
    const now = state.context.currentTime;
    const phase2 = state.themeMix === "phase2";
    const pitch = anomalyPlaybackPitch(activeCombatAnomaly);
    const flowN = Math.max(0, Math.min(1, synapticFlow / 100));
    const mentorN = Math.max(0, Math.min(1, learningMentorStreak / 10));
    const flowPitchMul = 1 + flowN * 0.11 + mentorN * 0.075;
    const targetRate =
      (isCriticalPhase ? 1.1 : phase2 ? 1.04 : 1) * pitch * flowPitchMul;
    const lowPassFreq = isCriticalPhase ? 1850 : phase2 ? 4800 : 18000;
    const bassGain = isCriticalPhase ? 5.5 : phase2 ? 7.2 : 0;

    state.source.playbackRate.cancelScheduledValues(now);
    state.source.playbackRate.linearRampToValueAtTime(targetRate, now + 0.12);

    state.lowPass.frequency.cancelScheduledValues(now);
    state.lowPass.frequency.linearRampToValueAtTime(lowPassFreq, now + 0.22);
    state.lowPass.Q.cancelScheduledValues(now);
    state.lowPass.Q.linearRampToValueAtTime(isCriticalPhase ? 1.3 : 0.7, now + 0.22);

    state.bassBoost.gain.cancelScheduledValues(now);
    state.bassBoost.gain.linearRampToValueAtTime(bassGain, now + 0.24);

    if (state.flowHighPass) {
      const hpTarget = 58 + flowN * 980 + mentorN * 420;
      state.flowHighPass.frequency.cancelScheduledValues(now);
      state.flowHighPass.frequency.linearRampToValueAtTime(
        Math.max(35, hpTarget),
        now + 0.16
      );
    }
  }, [isCriticalPhase, activeCombatAnomaly, synapticFlow, learningMentorStreak]);

  useEffect(() => {
    const ownerGen = ++mentorAscOwnerSeq;
    let cancelled = false;
    void (async () => {
      const ctx = await ensureContext();
      if (!ctx || cancelled) return;
      const state = stateRef.current;
      const dest = state.gain;
      if (!dest) return;

      teardownMentorAscension();

      const streak = useGameStore.getState().learningMentorStreak;
      const gs = useGameStore.getState().gameState;
      if (streak < 2 || gs === "IDLE") return;

      const master = ctx.createGain();
      const streakN = Math.min(1, streak / 12);
      master.gain.value = 0.0001 + streakN * 0.048;

      const o1 = ctx.createOscillator();
      o1.type = "triangle";
      o1.frequency.value = 174 + streak * 11;

      const o2 = ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.value = o1.frequency.value * 1.498;

      const shim = ctx.createGain();
      shim.gain.value = 0.14;
      o1.connect(master);
      o2.connect(shim);
      shim.connect(master);
      master.connect(dest);
      o1.start();
      o2.start();

      if (cancelled || ownerGen !== mentorAscOwnerSeq) {
        try {
          o1.stop();
        } catch {
          // no-op
        }
        try {
          o2.stop();
        } catch {
          // no-op
        }
        try {
          master.disconnect();
        } catch {
          // no-op
        }
        return;
      }
      mentorAscBundle = { o1, o2, master, ownerGen };
    })();

    return () => {
      cancelled = true;
      if (mentorAscBundle?.ownerGen === ownerGen) {
        teardownMentorAscension();
      }
    };
  }, [learningMentorStreak, gameState, ensureContext]);

  useEffect(() => {
    const t = learningMentorColdToken;
    const prev = prevMentorColdRef.current;
    prevMentorColdRef.current = t;
    if (t <= prev) return;

    void (async () => {
      const ctx = await ensureContext();
      const state = stateRef.current;
      const lp = state.lowPass;
      if (!ctx || !lp) return;
      const now = ctx.currentTime;
      const base = Math.max(320, Math.min(19000, lp.frequency.value));
      lp.frequency.cancelScheduledValues(now);
      lp.frequency.setValueAtTime(base, now);
      lp.frequency.exponentialRampToValueAtTime(1500, now + 0.045);
      lp.frequency.exponentialRampToValueAtTime(13500, now + 0.42);

      const g = state.gain;
      if (g) {
        const gv = Math.max(0.0001, g.gain.value);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(gv, now);
        g.gain.linearRampToValueAtTime(gv * 0.86, now + 0.055);
        g.gain.linearRampToValueAtTime(gv, now + 0.24);
      }
    })();
  }, [learningMentorColdToken, ensureContext]);

  useEffect(() => {
    if (combatPhaseTransitionToken === 0) {
      lastHandledCombatPhaseToken = 0;
      combatPhaseTransitionAudioBusy = false;
      return;
    }
    if (combatPhaseTransitionToken === lastHandledCombatPhaseToken) return;
    lastHandledCombatPhaseToken = combatPhaseTransitionToken;
    void performCombatPhaseTransition();
  }, [combatPhaseTransitionToken, performCombatPhaseTransition]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state.context || !state.gain) return;
    const now = state.context.currentTime;
    const targetThemeGain = state.activePath ? 0.9 : 0;
    state.gain.gain.cancelScheduledValues(now);
    state.gain.gain.setValueAtTime(state.gain.gain.value, now);
    state.gain.gain.linearRampToValueAtTime(targetThemeGain, now + 0.18);
    if (state.oneShotGain) {
      const current = Math.max(0.0001, state.oneShotGain.gain.value);
      state.oneShotGain.gain.cancelScheduledValues(now);
      state.oneShotGain.gain.setValueAtTime(current, now);
      state.oneShotGain.gain.linearRampToValueAtTime(current, now + 0.08);
    }
  }, [audioTuningRevision]);

  useEffect(() => {
    const prev = prevCriticalRef.current;
    if (!prev && isCriticalPhase) {
      void playCriticalStinger();
    }
    prevCriticalRef.current = isCriticalPhase;
  }, [isCriticalPhase, playCriticalStinger]);

  /** Scanner_Chirp: kurzer, heller Sweep wenn die Boss-KI die Strategie anpasst */
  const playScannerChirp = useCallback(async () => {
    const context = await ensureContext();
    if (!context) return;
    const t = context.currentTime + 0.002;
    const root = context.createGain();
    root.gain.setValueAtTime(0.0001, t);
    root.gain.exponentialRampToValueAtTime(0.22, t + 0.014);
    root.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    root.connect(context.destination);

    const carrier = context.createOscillator();
    carrier.type = "sine";
    carrier.frequency.setValueAtTime(1820, t);
    carrier.frequency.exponentialRampToValueAtTime(4820, t + 0.072);

    const mod = context.createOscillator();
    mod.type = "triangle";
    mod.frequency.value = 640;
    const modGain = context.createGain();
    modGain.gain.value = 380;
    mod.connect(modGain);
    modGain.connect(carrier.frequency);

    const bp = context.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3200;
    bp.Q.value = 5.2;

    carrier.connect(bp);
    bp.connect(root);

    const tick = context.createOscillator();
    tick.type = "square";
    tick.frequency.setValueAtTime(4200, t);
    tick.frequency.exponentialRampToValueAtTime(6200, t + 0.05);
    const tickG = context.createGain();
    tickG.gain.setValueAtTime(0.0001, t);
    tickG.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
    tickG.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    tick.connect(tickG);
    tickG.connect(root);

    carrier.start(t);
    mod.start(t);
    tick.start(t);
    carrier.stop(t + 0.12);
    mod.stop(t + 0.12);
    tick.stop(t + 0.1);
  }, [ensureContext]);

  /** Dossier: Persona-Titel — kurzer, „siegelnder“ Oberton */
  const playImpactFrameBlip = useCallback(async () => {
    const context = await ensureContext();
    if (!context) return;
    const t = context.currentTime + 0.001;
    const g = context.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    g.connect(context.destination);
    const o = context.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(4200, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.038);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.05);
  }, [ensureContext]);

  const playArchitectPersonaReveal = useCallback(async () => {
    const context = await ensureContext();
    if (!context) return;
    const t = context.currentTime + 0.002;
    const root = context.createGain();
    root.gain.setValueAtTime(0.0001, t);
    root.gain.exponentialRampToValueAtTime(0.13, t + 0.028);
    root.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    root.connect(context.destination);

    const a = context.createOscillator();
    a.type = "sine";
    a.frequency.setValueAtTime(660, t);
    a.frequency.exponentialRampToValueAtTime(990, t + 0.08);

    const b = context.createOscillator();
    b.type = "triangle";
    b.frequency.setValueAtTime(220, t);
    b.frequency.exponentialRampToValueAtTime(440, t + 0.06);

    const bell = context.createBiquadFilter();
    bell.type = "peaking";
    bell.frequency.value = 880;
    bell.Q.value = 3.2;
    bell.gain.value = 9;

    a.connect(bell);
    b.connect(bell);
    bell.connect(root);

    a.start(t);
    b.start(t);
    a.stop(t + 0.28);
    b.stop(t + 0.28);
  }, [ensureContext]);

  /** Parry: metallischer Ping (klar von Schild-Absorption getrennt) */
  const playParryPing = useCallback(async () => {
    const context = await ensureContext();
    if (!context) return;
    const t = context.currentTime + 0.001;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.42, t + 0.006);
    master.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    master.connect(context.destination);

    const pingMetal = (freq: number, peak: number, peakAt: number) => {
      const o = context.createOscillator();
      o.type = "square";
      o.frequency.setValueAtTime(freq, t);
      const lp = context.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 6200;
      lp.Q.value = 0.6;
      const bp = context.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 3400;
      bp.Q.value = 8.5;
      const g = context.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + peakAt);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(lp);
      lp.connect(bp);
      bp.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.28);
    };

    pingMetal(1820, 0.85, 0.012);
    pingMetal(2730, 0.38, 0.018);
    pingMetal(4150, 0.22, 0.024);

    const strike = context.createOscillator();
    strike.type = "triangle";
    strike.frequency.setValueAtTime(880, t);
    strike.frequency.exponentialRampToValueAtTime(220, t + 0.04);
    const strikeF = context.createBiquadFilter();
    strikeF.type = "highpass";
    strikeF.frequency.value = 700;
    const strikeG = context.createGain();
    strikeG.gain.setValueAtTime(0.0001, t);
    strikeG.gain.exponentialRampToValueAtTime(0.28, t + 0.004);
    strikeG.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    strike.connect(strikeF);
    strikeF.connect(strikeG);
    strikeG.connect(master);
    strike.start(t);
    strike.stop(t + 0.1);
  }, [ensureContext]);

  /** Singularity: hektischer biologischer Puls, am Theme-Bus gemischt (pro Puls-Token) */
  const playSingularityHeartbeat = useCallback(async () => {
    const state = stateRef.current;
    const context = await ensureContext();
    if (!context || !state.gain) return;
    const t = context.currentTime + 0.002;
    const bus = state.gain;

    const out = context.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.22, t + 0.032);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    out.connect(bus);

    const body = context.createOscillator();
    body.type = "sine";
    body.frequency.setValueAtTime(54, t);
    body.frequency.exponentialRampToValueAtTime(36, t + 0.24);
    const bodyF = context.createBiquadFilter();
    bodyF.type = "lowpass";
    bodyF.frequency.value = 260;
    const bodyG = context.createGain();
    bodyG.gain.setValueAtTime(0.0001, t);
    bodyG.gain.exponentialRampToValueAtTime(0.62, t + 0.026);
    bodyG.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    body.connect(bodyF);
    bodyF.connect(bodyG);
    bodyG.connect(out);
    body.start(t);
    body.stop(t + 0.34);

    const knock = context.createOscillator();
    knock.type = "triangle";
    knock.frequency.setValueAtTime(185, t);
    knock.frequency.exponentialRampToValueAtTime(92, t + 0.065);
    const kf = context.createBiquadFilter();
    kf.type = "bandpass";
    kf.frequency.value = 380;
    kf.Q.value = 2.4;
    const kg = context.createGain();
    kg.gain.setValueAtTime(0.0001, t);
    kg.gain.exponentialRampToValueAtTime(0.34, t + 0.01);
    kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    knock.connect(kf);
    kf.connect(kg);
    kg.connect(out);
    knock.start(t);
    knock.stop(t + 0.15);

    const nFrames = Math.max(1, Math.floor(context.sampleRate * 0.028));
    const nBuf = context.createBuffer(1, nFrames, context.sampleRate);
    const nd = nBuf.getChannelData(0);
    for (let i = 0; i < nFrames; i += 1) {
      const e = i / nFrames;
      nd[i] = (Math.random() * 2 - 1) * (1 - e) * 0.55;
    }
    const noise = context.createBufferSource();
    noise.buffer = nBuf;
    const nF = context.createBiquadFilter();
    nF.type = "bandpass";
    nF.frequency.value = 1200;
    nF.Q.value = 1.1;
    const nG = context.createGain();
    nG.gain.setValueAtTime(0.0001, t);
    nG.gain.exponentialRampToValueAtTime(0.12, t + 0.004);
    nG.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    noise.connect(nF);
    nF.connect(nG);
    nG.connect(out);
    noise.start(t);
    noise.stop(t + 0.05);
  }, [ensureContext]);

  useEffect(() => {
    if (!isSingularityActive || gameState !== "FIGHTING") {
      prevPulseForHeartRef.current = bossAdaptivePulseToken;
      if (!isSingularityActive) wasSingularityHeartRef.current = false;
      return;
    }
    if (!wasSingularityHeartRef.current) {
      prevPulseForHeartRef.current = bossAdaptivePulseToken;
      wasSingularityHeartRef.current = true;
      return;
    }
    if (bossAdaptivePulseToken > prevPulseForHeartRef.current) {
      void playSingularityHeartbeat();
    }
    prevPulseForHeartRef.current = bossAdaptivePulseToken;
  }, [bossAdaptivePulseToken, gameState, isSingularityActive, playSingularityHeartbeat]);

  const playShieldBreak = useCallback(async () => {
    const context = await ensureContext();
    if (!context) return;
    const t = context.currentTime + 0.002;
    const root = context.createGain();
    root.gain.setValueAtTime(0.0001, t);
    root.gain.exponentialRampToValueAtTime(0.38, t + 0.012);
    root.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    root.connect(context.destination);

    const o = context.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(3200, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.12);

    const glass = context.createBiquadFilter();
    glass.type = "bandpass";
    glass.frequency.value = 4800;
    glass.Q.value = 9;

    const o2 = context.createOscillator();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(6400, t);
    o2.frequency.exponentialRampToValueAtTime(2100, t + 0.08);

    const nFrames = Math.max(1, Math.floor(context.sampleRate * 0.045));
    const nBuf = context.createBuffer(1, nFrames, context.sampleRate);
    const nd = nBuf.getChannelData(0);
    for (let i = 0; i < nFrames; i += 1) {
      const e = i / nFrames;
      nd[i] = (Math.random() * 2 - 1) * (1 - e) * 0.9;
    }
    const noise = context.createBufferSource();
    noise.buffer = nBuf;
    const nF = context.createBiquadFilter();
    nF.type = "highpass";
    nF.frequency.value = 1800;

    o.connect(glass);
    glass.connect(root);
    o2.connect(root);
    noise.connect(nF);
    nF.connect(root);

    o.start(t);
    o.stop(t + 0.22);
    o2.start(t);
    o2.stop(t + 0.16);
    noise.start(t);
    noise.stop(t + 0.05);
  }, [ensureContext]);

  const playCoreAugment = useCallback(async () => {
    const context = await ensureContext();
    if (!context || !stateRef.current.gain || !stateRef.current.lowPass || !stateRef.current.bassBoost) {
      return;
    }
    const t = context.currentTime + 0.003;
    const master = stateRef.current.gain;
    const lp = stateRef.current.lowPass;
    const bass = stateRef.current.bassBoost;
    const nowG = Math.max(0.0001, master.gain.value);
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(nowG, t);
    master.gain.linearRampToValueAtTime(nowG * 0.12, t + 0.048);
    master.gain.linearRampToValueAtTime(nowG, t + 0.4);

    const lfNow = lp.frequency.value;
    lp.frequency.cancelScheduledValues(t);
    lp.frequency.setValueAtTime(lfNow, t);
    lp.frequency.exponentialRampToValueAtTime(280, t + 0.16);
    lp.frequency.exponentialRampToValueAtTime(Math.min(18000, Math.max(2400, lfNow)), t + 0.46);

    lp.Q.cancelScheduledValues(t);
    lp.Q.setValueAtTime(lp.Q.value, t);
    lp.Q.linearRampToValueAtTime(2.85, t + 0.09);
    lp.Q.linearRampToValueAtTime(0.7, t + 0.42);

    const bNow = bass.gain.value;
    bass.gain.cancelScheduledValues(t);
    bass.gain.setValueAtTime(bNow, t);
    bass.gain.linearRampToValueAtTime(bNow + 10, t + 0.11);
    bass.gain.linearRampToValueAtTime(bNow, t + 0.36);
  }, [ensureContext]);

  return {
    startBossTheme,
    stopCurrent,
    playVictory,
    fadeOutThemeAndPlayVictory,
    playLootRevealOneShot,
    playLootPop,
    playArtifactHum,
    stopArtifactHum,
    playDossierTeletypeTick,
    stopDossierTeletypeTick,
    playArchiveSealKlunk,
    playLegendaryReveal,
    playVictoryFinisherSequence,
    playCriticalStinger,
    playRankSound,
    playAchievementStinger,
    playGrandSlamIntroStinger,
    playGalleryDiscovery,
    playCoreAugment,
    playShieldBreak,
    playScannerChirp,
    playParryPing,
    playSingularityHeartbeat,
    playArchitectPersonaReveal,
    playImpactFrameBlip,
  };
};
