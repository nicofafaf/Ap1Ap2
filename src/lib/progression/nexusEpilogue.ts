/** Epilog: Sektor Ø besiegt — dauerhaftes „System Restored“-Thema (neue Storage-Version) */

export const NEXUS_EPILOGUE_STORAGE_KEY = "nexus.epilogue.systemRestored.v2";

const LEGACY_SEAL_KEY = "nexus.masterCertificate.sealed.v1";

export function readEpilogueUnlocked(): boolean {
  try {
    if (localStorage.getItem(NEXUS_EPILOGUE_STORAGE_KEY) === "1") return true;
    if (localStorage.getItem(LEGACY_SEAL_KEY)) {
      localStorage.setItem(NEXUS_EPILOGUE_STORAGE_KEY, "1");
      return true;
    }
  } catch {
    // no-op
  }
  return false;
}

export function persistEpilogueUnlocked(): void {
  try {
    localStorage.setItem(NEXUS_EPILOGUE_STORAGE_KEY, "1");
  } catch {
    // no-op
  }
}
