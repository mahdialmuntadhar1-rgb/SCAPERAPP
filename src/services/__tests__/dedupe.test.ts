import { describe, expect, it } from "vitest";
import { dedupeRecords } from "../dedupe.js";

describe("dedupeRecords", () => {
  it("keeps highest-confidence duplicate", () => {
    const output = dedupeRecords([
      {
        name: "A",
        city: "Baghdad",
        category: "Cafes",
        phone: "+964111",
        source: "gemini",
        sourceUrl: "https://example.com/a",
        address: null,
        notes: null,
        confidenceScore: 0.4
      },
      {
        name: "A",
        city: "Baghdad",
        category: "Cafes",
        phone: "+964111",
        source: "gemini",
        sourceUrl: "https://example.com/a",
        address: "Addr",
        notes: null,
        confidenceScore: 0.6
      }
    ]);

    expect(output).toHaveLength(1);
    expect(output[0]?.confidenceScore).toBe(0.6);
  });
});
