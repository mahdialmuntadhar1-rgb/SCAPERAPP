import { describe, expect, it } from "vitest";
import { normalizeRecords } from "../normalization.js";

describe("normalizeRecords", () => {
  it("drops invalid rows and trims junk placeholders", () => {
    const rows = normalizeRecords([
      { source: "web_directory", name: "  Test Biz ", city: " Baghdad ", category: " Cafes ", phone: "N/A" },
      { source: "web_directory", name: "", city: "Baghdad", category: "Cafes" }
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Test Biz");
    expect(rows[0]?.phone).toBeNull();
  });
});
