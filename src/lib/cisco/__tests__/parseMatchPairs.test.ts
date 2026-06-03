import { describe, expect, it } from "vitest";
import { parsePipeMatchPairs } from "../../../cisco/ccna1-v7/parseMatchPairs";

describe("parsePipeMatchPairs", () => {
  it("parses pipe-separated match rows from ITExamAnswers text", () => {
    const text =
      "Match the requirements| fault tolerance | Provide redundant links | scalability | Expand without degrading service";
    const pairs = parsePipeMatchPairs(text);
    expect(pairs).toHaveLength(2);
    expect(pairs[0].left.en).toBe("fault tolerance");
    expect(pairs[0].right.en).toContain("redundant");
  });
});
