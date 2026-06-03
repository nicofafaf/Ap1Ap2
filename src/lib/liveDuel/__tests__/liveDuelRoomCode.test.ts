import { describe, expect, it } from "vitest";
import {
  generateLiveDuelRoomCode,
  isValidLiveDuelRoomCode,
  normalizeLiveDuelRoomCode,
} from "../liveDuelRoomCode";

describe("liveDuelRoomCode", () => {
  it("generates 6-char codes", () => {
    const code = generateLiveDuelRoomCode();
    expect(code).toHaveLength(6);
    expect(isValidLiveDuelRoomCode(code)).toBe(true);
  });

  it("normalizes input", () => {
    expect(normalizeLiveDuelRoomCode(" ab-12x ")).toBe("AB12X");
  });
});
