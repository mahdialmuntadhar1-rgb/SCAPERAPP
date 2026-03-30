import type { NormalizedBusiness } from "../types.js";

function keyFromRecord(record: NormalizedBusiness): string {
  const name = record.name.toLowerCase();
  const city = record.city.toLowerCase();
  const phone = record.phone ?? "";
  const url = record.sourceUrl?.toLowerCase() ?? "";
  return [name, city, phone, url].join("|");
}

export function dedupeRecords(records: NormalizedBusiness[]): NormalizedBusiness[] {
  const map = new Map<string, NormalizedBusiness>();

  for (const record of records) {
    const key = keyFromRecord(record);
    const existing = map.get(key);
    if (!existing || existing.confidenceScore < record.confidenceScore) {
      map.set(key, record);
    }
  }

  return [...map.values()];
}
