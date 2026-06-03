/** Cisco CCNA — Original MC/Match Items (verbatim, nicht paraphrasieren) */

export type CiscoLocaleText = {
  en: string;
  de?: string | null;
};

export type CiscoMcOption = {
  id: string;
  text: CiscoLocaleText;
  correct: boolean;
};

export type CiscoMatchPair = {
  left: CiscoLocaleText;
  right: CiscoLocaleText;
};

export type CiscoQuestionType = "single" | "multi" | "match" | "unsupported";

export type CiscoQuestion = {
  id: string;
  packId: CiscoPackId;
  /** Curriculum module 1–17 (ITN v7.02) */
  modules: number[];
  number: number;
  type: CiscoQuestionType;
  verbatim: true;
  sourceUrl: string;
  topic?: string;
  question: CiscoLocaleText;
  options?: CiscoMcOption[];
  matchPairs?: CiscoMatchPair[];
  explanation?: CiscoLocaleText;
  /** Exhibit-Grafik (lokal unter /assets/cisco/exhibits/) */
  illustrationSrc?: string;
  /** Router-CLI / Code-Exhibit (itexamanswers <pre>-Block) */
  exhibitCode?: string;
  /** Packet Tracer / Bild-only — später manuell */
  needsManual?: boolean;
};

export type CiscoExamPack = {
  id: CiscoPackId;
  course: "ccna1-itn-v7";
  title: CiscoLocaleText;
  /** Module numbers covered (e.g. [8,9,10]) */
  moduleRange: [number, number];
  sourceUrl: string;
  itemCount: number;
  items: CiscoQuestion[];
};

export type CiscoPackId =
  | "modules-1-3"
  | "modules-4-7"
  | "modules-8-10"
  | "modules-11-13"
  | "modules-14-15"
  | "modules-16-17"
  | "practice-final"
  | "course-final"
  | "system-test"
  | "pt-skills-final";

export type CiscoModuleDef = {
  module: number;
  title: CiscoLocaleText;
  packId: CiscoPackId;
};
