import { Router } from "express";
import { z } from "zod";
import { runDiscovery } from "../adapters/index.js";
import { dedupeRecords } from "../services/dedupe.js";
import { normalizeRecords } from "../services/normalization.js";
import { listBusinesses, insertBusinesses } from "../services/storage.js";
import { SOURCE_IDS, type SourceId } from "../types.js";

const sourceEnum = z.enum(SOURCE_IDS);

const runSchema = z.object({
  city: z.string().trim().min(2),
  category: z.string().trim().min(2),
  sources: z.array(sourceEnum).min(1)
});

const businessesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  city: z.string().trim().optional(),
  category: z.string().trim().optional(),
  source: sourceEnum.optional()
});

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "scaperapp" });
});

apiRouter.post("/run", async (req, res) => {
  const parsed = runSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten()
    });
  }

  const input = parsed.data;
  const adapterResults = await runDiscovery(input);

  const discovered = adapterResults.flatMap((r) => r.records);
  const normalized = normalizeRecords(discovered);
  const deduped = dedupeRecords(normalized);

  let insertedCount = 0;
  try {
    insertedCount = await insertBusinesses(deduped);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Storage failure",
      summary: {
        requestedSources: input.sources,
        attemptedSources: adapterResults.map((r) => r.source),
        discoveredCount: discovered.length,
        normalizedCount: normalized.length,
        deduplicatedCount: deduped.length,
        insertedCount: 0
      }
    });
  }

  const summary = {
    requestedSources: input.sources,
    attemptedSources: adapterResults.map((r) => r.source),
    successfulSources: adapterResults.filter((r) => r.errors.length === 0).map((r) => r.source),
    skippedSources: adapterResults
      .filter((r) => r.records.length === 0 && r.errors.length > 0)
      .map((r) => ({ source: r.source, reason: r.errors[0] })),
    adapterErrors: adapterResults.flatMap((r) => r.errors.map((error) => ({ source: r.source, error }))),
    discoveredCount: discovered.length,
    normalizedCount: normalized.length,
    deduplicatedCount: deduped.length,
    insertedCount
  };

  return res.json({ ok: true, summary });
});

apiRouter.get("/businesses", async (req, res) => {
  const parsed = businessesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
  }

  const query = parsed.data as {
    page: number;
    pageSize: number;
    city?: string;
    category?: string;
    source?: SourceId;
  };

  try {
    const result = await listBusinesses(query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Query failure"
    });
  }
});
