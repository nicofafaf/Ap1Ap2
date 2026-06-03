import type { CiscoModuleDef, CiscoPackId } from "../types";

/** Offizieller Kursname (NetAcad) */
export const CCNA1_ITN_COURSE = {
  code: "2526-E2FI2-CCNA1-ITNg",
  titleEn: "CCNA: Introduction to Networks",
  titleDe: "CCNA: Einführung in Netzwerke",
  version: "ITN v7.02",
} as const;

/** ITN v7.02 — 17 Curriculum-Module; Checkpoint-Prüfungen sind in 6 Pack-Gruppen */
export const CCNA1_ITN_PACKS: ReadonlyArray<{
  id: CiscoPackId;
  moduleRange: [number, number];
  sourceUrl: string;
  titleEn: string;
  titleDe: string;
}> = [
  {
    id: "modules-1-3",
    moduleRange: [1, 3],
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-1-3-basic-network-connectivity-and-communications-exam-answers.html",
    titleEn: "Modules 1–3: Basic Network Connectivity and Communications",
    titleDe: "Module 1–3: Netzwerkgrundlagen und Kommunikation",
  },
  {
    id: "modules-4-7",
    moduleRange: [4, 7],
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-4-7-ethernet-concepts-exam-answers.html",
    titleEn: "Modules 4–7: Ethernet Concepts",
    titleDe: "Module 4–7: Ethernet-Konzepte",
  },
  {
    id: "modules-8-10",
    moduleRange: [8, 10],
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-8-10-communicating-between-networks-exam-answers.html",
    titleEn: "Modules 8–10: Communicating Between Networks",
    titleDe: "Module 8–10: Kommunikation zwischen Netzwerken",
  },
  {
    id: "modules-11-13",
    moduleRange: [11, 13],
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-11-13-ip-addressing-exam-answers-full.html",
    titleEn: "Modules 11–13: IP Addressing",
    titleDe: "Module 11–13: IP-Adressierung",
  },
  {
    id: "modules-14-15",
    moduleRange: [14, 15],
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-14-15-network-application-communications-exam-answers.html",
    titleEn: "Modules 14–15: Network Application Communications",
    titleDe: "Module 14–15: Anwendungen im Netzwerk",
  },
  {
    id: "modules-16-17",
    moduleRange: [16, 17],
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-16-17-building-and-securing-a-small-network-exam-answers.html",
    titleEn: "Modules 16–17: Building and Securing a Small Network",
    titleDe: "Module 16–17: Kleines Netzwerk aufbauen und absichern",
  },
  {
    id: "practice-final",
    moduleRange: [1, 17],
    sourceUrl:
      "https://itexamanswers.net/ccna-1-version-7-00-itnv7-practice-final-exam-answers.html",
    titleEn: "ITNv7 Practice Final Exam",
    titleDe: "Übungs-Abschlussprüfung ITN",
  },
  {
    id: "course-final",
    moduleRange: [1, 17],
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-0-final-exam-answers-full-introduction-to-networks.html",
    titleEn: "CCNA 1 v7 Course Final Exam",
    titleDe: "Kurs-Abschlussprüfung CCNA 1",
  },
  {
    id: "system-test",
    moduleRange: [1, 17],
    sourceUrl:
      "https://itexamanswers.net/ccnav7-system-test-course-version-1-1-system-test-exam-answers.html",
    titleEn: "System Test Exam",
    titleDe: "System-Test",
  },
] as const;

const MODULE_TITLES_EN: Record<number, string> = {
  1: "Networking Today",
  2: "Basic Switch and End Device Configuration",
  3: "Protocols and Models",
  4: "Physical Layer",
  5: "Number Systems",
  6: "Data Link Layer and Ethernet",
  7: "Ethernet Switching",
  8: "Network Layer",
  9: "Address Resolution",
  10: "Basic Router Configuration",
  11: "IPv4 Addressing",
  12: "IPv6 Addressing",
  13: "ICMP",
  14: "Transport Layer",
  15: "Application Layer",
  16: "Network Security Fundamentals",
  17: "Build a Small Network",
};

function packForModule(n: number): CiscoPackId {
  if (n <= 3) return "modules-1-3";
  if (n <= 7) return "modules-4-7";
  if (n <= 10) return "modules-8-10";
  if (n <= 13) return "modules-11-13";
  if (n <= 15) return "modules-14-15";
  return "modules-16-17";
}

/** Alle 17 ITN-Module — jeweils zugeordnet zum Checkpoint-Pack */
export const CCNA1_ITN_17_MODULES: readonly CiscoModuleDef[] = Array.from(
  { length: 17 },
  (_, i) => {
    const module = i + 1;
    return {
      module,
      packId: packForModule(module),
      title: {
        en: `Module ${module}: ${MODULE_TITLES_EN[module] ?? "ITN"}`,
        de: `Modul ${module}: ${MODULE_TITLES_EN[module] ?? "ITN"}`,
      },
    };
  }
);

export function modulesInRange([from, to]: [number, number]): number[] {
  const out: number[] = [];
  for (let m = from; m <= to; m += 1) out.push(m);
  return out;
}
