export type CombatRank = "S" | "A" | "B" | "C";

export type RankAudioProfile = {
  gain: number;
  ducking: number;
  playbackRate: number;
  reverb: number;
  label: string;
};

export const RANK_AUDIO_PROFILES: Record<CombatRank, RankAudioProfile> = {
  S: { gain: 1.2, ducking: -6, playbackRate: 1.0, reverb: 0.8, label: "Angelic Digital" },
  A: { gain: 1.0, ducking: -3, playbackRate: 1.0, reverb: 0.4, label: "Power Resonance" },
  B: { gain: 0.8, ducking: 0, playbackRate: 0.9, reverb: 0.2, label: "Mechanical Neutral" },
  C: { gain: 0.7, ducking: 2, playbackRate: 0.8, reverb: 0.1, label: "System Glitch" },
};

export const INITIAL_RANK_AUDIO_PROFILES: Readonly<Record<CombatRank, RankAudioProfile>> =
  Object.freeze({
    S: Object.freeze({ ...RANK_AUDIO_PROFILES.S }),
    A: Object.freeze({ ...RANK_AUDIO_PROFILES.A }),
    B: Object.freeze({ ...RANK_AUDIO_PROFILES.B }),
    C: Object.freeze({ ...RANK_AUDIO_PROFILES.C }),
  });

export const RANK_SOUND_PATHS: Record<CombatRank, string> = {
  S: "/assets/BluezoneCorp_Alien_Interface/Bluezone_BC0300_alien_interface_sci_fi_transition_008.wav",
  A: "/assets/BluezoneCorp_Modern_Cinematic_Impact/Bluezone_BC0294_modern_cinematic_impact_022.wav",
  B: "/assets/BluezoneCorp_Futuristic_User_Interface/Bluezone_BC0303_futuristic_user_interface_high_tech_beep_038.wav",
  C: "/assets/BluezoneCorp_Futuristic_User_Interface/Bluezone_BC0303_futuristic_user_interface_alert_003.wav",
};

export const RANK_C_STATIC_PATH =
  "/assets/BluezoneCorp_Futuristic_User_Interface/Bluezone_BC0303_futuristic_user_interface_data_glitch_003.wav";
