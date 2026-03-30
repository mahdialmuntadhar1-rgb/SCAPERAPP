export const SOURCE_IDS = ["gemini", "facebook", "instagram", "web_directory"] as const;
export type SourceId = (typeof SOURCE_IDS)[number];

export type DiscoveryInput = {
  city: string;
  category: string;
  sources: SourceId[];
};

export type RawBusiness = {
  name?: string;
  city?: string;
  category?: string;
  phone?: string;
  source: SourceId;
  sourceUrl?: string;
  address?: string;
  notes?: string;
};

export type NormalizedBusiness = {
  name: string;
  city: string;
  category: string;
  phone: string | null;
  source: SourceId;
  sourceUrl: string | null;
  address: string | null;
  notes: string | null;
  confidenceScore: number;
};

export type AdapterResult = {
  source: SourceId;
  records: RawBusiness[];
  errors: string[];
};

export type RunSummary = {
  requestedSources: SourceId[];
  attemptedSources: SourceId[];
  successfulSources: SourceId[];
  skippedSources: { source: SourceId; reason: string }[];
  adapterErrors: { source: SourceId; error: string }[];
  discoveredCount: number;
  normalizedCount: number;
  deduplicatedCount: number;
  insertedCount: number;
};

export type BusinessFilters = {
  page: number;
  pageSize: number;
  city?: string;
  category?: string;
  source?: SourceId;
};
