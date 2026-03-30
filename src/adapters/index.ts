import { env } from "../env.js";
import type { AdapterResult, DiscoveryInput, RawBusiness, SourceId } from "../types.js";

export interface SourceAdapter {
  id: SourceId;
  label: string;
  isConfigured: () => { ok: boolean; reason?: string };
  discover: (input: DiscoveryInput) => Promise<RawBusiness[]>;
}

function parseGeminiTextToRecords(text: string, source: SourceId, input: DiscoveryInput): RawBusiness[] {
  try {
    const parsed = JSON.parse(text) as Array<Record<string, unknown>>;
    return parsed.map((row) => ({
      source,
      name: typeof row.name === "string" ? row.name : undefined,
      city: input.city,
      category: input.category,
      phone: typeof row.phone === "string" ? row.phone : undefined,
      sourceUrl: typeof row.sourceUrl === "string" ? row.sourceUrl : undefined,
      address: typeof row.address === "string" ? row.address : undefined,
      notes: typeof row.notes === "string" ? row.notes : undefined
    }));
  } catch {
    return [];
  }
}

const geminiAdapter: SourceAdapter = {
  id: "gemini",
  label: "Gemini",
  isConfigured: () =>
    env.geminiApiKey
      ? { ok: true }
      : { ok: false, reason: "GEMINI_API_KEY is missing." },
  async discover(input) {
    if (!env.geminiApiKey) {
      throw new Error("Gemini source is selected but GEMINI_API_KEY is not configured.");
    }

    const prompt = `Return JSON array only. Find up to 10 ${input.category} businesses in ${input.city}, Iraq. Fields: name, phone, sourceUrl, address, notes.`;
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!resp.ok) {
      throw new Error(`Gemini request failed (${resp.status}).`);
    }

    const body = (await resp.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];

    return parseGeminiTextToRecords(text, "gemini", input);
  }
};

const facebookAdapter: SourceAdapter = {
  id: "facebook",
  label: "Facebook",
  isConfigured: () => ({ ok: false, reason: "Facebook discovery adapter is not configured yet." }),
  async discover() {
    return [];
  }
};

const instagramAdapter: SourceAdapter = {
  id: "instagram",
  label: "Instagram",
  isConfigured: () => ({ ok: false, reason: "Instagram discovery adapter is not configured yet." }),
  async discover() {
    return [];
  }
};

const webDirectoryAdapter: SourceAdapter = {
  id: "web_directory",
  label: "Web Directory",
  isConfigured: () => ({ ok: true }),
  async discover(input) {
    const q = encodeURIComponent(`${input.category} ${input.city} Iraq`);
    const resp = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1&no_html=1`);
    if (!resp.ok) throw new Error(`Web directory request failed (${resp.status}).`);

    const body = (await resp.json()) as {
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
    };

    return (body.RelatedTopics ?? []).slice(0, 15).map((row) => ({
      source: "web_directory",
      name: row.Text?.split(" - ")[0],
      city: input.city,
      category: input.category,
      sourceUrl: row.FirstURL,
      notes: row.Text
    }));
  }
};

const adapters: Record<SourceId, SourceAdapter> = {
  gemini: geminiAdapter,
  facebook: facebookAdapter,
  instagram: instagramAdapter,
  web_directory: webDirectoryAdapter
};

export async function runDiscovery(input: DiscoveryInput): Promise<AdapterResult[]> {
  const results: AdapterResult[] = [];

  for (const source of input.sources) {
    const adapter = adapters[source];
    const check = adapter.isConfigured();

    if (!check.ok) {
      results.push({
        source,
        records: [],
        errors: [check.reason ?? `${source} adapter unavailable`]
      });
      continue;
    }

    try {
      const records = await adapter.discover(input);
      results.push({ source, records, errors: [] });
    } catch (error) {
      results.push({
        source,
        records: [],
        errors: [error instanceof Error ? error.message : "Unknown adapter error"]
      });
    }
  }

  return results;
}
