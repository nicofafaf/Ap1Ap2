const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateLiveDuelRoomCode(length = 6): string {
  let code = "";
  const cryptoObj = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : null;
  for (let i = 0; i < length; i += 1) {
    if (cryptoObj?.getRandomValues) {
      const buf = new Uint8Array(1);
      cryptoObj.getRandomValues(buf);
      code += CODE_CHARS[buf[0]! % CODE_CHARS.length]!;
    } else {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]!;
    }
  }
  return code;
}

export function normalizeLiveDuelRoomCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function isValidLiveDuelRoomCode(code: string): boolean {
  return /^[A-Z0-9]{4,8}$/.test(code);
}
