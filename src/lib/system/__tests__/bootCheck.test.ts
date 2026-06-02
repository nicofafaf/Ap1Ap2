import { describe, expect, it } from "vitest";
import {
  evaluatePrecacheManifestPayload,
  isPrecacheManifestHttpAcceptable,
} from "../bootCheck";

describe("bootCheck precache manifest", () => {
  it("treats empty array as OK (slim mode)", () => {
    const r = evaluatePrecacheManifestPayload([]);
    expect(r.ok).toBe(true);
    expect(r.entryCount).toBe(0);
  });

  it("rejects non-array JSON", () => {
    const r = evaluatePrecacheManifestPayload({});
    expect(r.ok).toBe(false);
  });

  it("accepts 200 and 404 for manifest fetch", () => {
    expect(isPrecacheManifestHttpAcceptable(200)).toBe(true);
    expect(isPrecacheManifestHttpAcceptable(404)).toBe(true);
    expect(isPrecacheManifestHttpAcceptable(500)).toBe(false);
  });
});
