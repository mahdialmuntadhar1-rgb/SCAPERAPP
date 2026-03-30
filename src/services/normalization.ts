import type { NormalizedBusiness, RawBusiness } from "../types.js";

const JUNK_VALUES = new Set(["n/a", "na", "none", "null", "unknown", "-"]);

function cleanText(input: string | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  if (JUNK_VALUES.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

function normalizePhone(phone: string | undefined): string | null {
  const cleaned = cleanText(phone);
  if (!cleaned) return null;
  const normalized = cleaned.replace(/[^\d+]/g, "");
  return normalized.length >= 7 ? normalized : null;
}

function confidenceForRecord(record: {
  name: string;
  phone: string | null;
  sourceUrl: string | null;
  address: string | null;
  notes: string | null;
}): number {
  let score = 0.35;
  if (record.phone) score += 0.2;
  if (record.sourceUrl) score += 0.2;
  if (record.address) score += 0.15;
  if (record.notes) score += 0.1;
  return Number(Math.min(score, 0.95).toFixed(2));
}

export function normalizeRecords(records: RawBusiness[]): NormalizedBusiness[] {
  const normalized: NormalizedBusiness[] = [];

  for (const record of records) {
    const name = cleanText(record.name);
    const city = cleanText(record.city);
    const category = cleanText(record.category);

    if (!name || !city || !category) continue;

    const phone = normalizePhone(record.phone);
    const sourceUrl = cleanText(record.sourceUrl);
    const address = cleanText(record.address);
    const notes = cleanText(record.notes);

    const confidenceScore = confidenceForRecord({ name, phone, sourceUrl, address, notes });

    normalized.push({
      name,
      city,
      category,
      phone,
      source: record.source,
      sourceUrl,
      address,
      notes,
      confidenceScore
    });
  }

  return normalized;
}
