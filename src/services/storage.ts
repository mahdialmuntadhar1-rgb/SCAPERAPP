import { getSupabaseClient } from "../lib/supabase.js";
import type { BusinessFilters, NormalizedBusiness } from "../types.js";

export async function insertBusinesses(records: NormalizedBusiness[]): Promise<number> {
  if (!records.length) return 0;

  const supabase = getSupabaseClient();
  const payload = records.map((r) => ({
    name: r.name,
    city: r.city,
    category: r.category,
    phone: r.phone,
    source: r.source,
    source_url: r.sourceUrl,
    address: r.address,
    notes: r.notes,
    confidence_score: r.confidenceScore
  }));

  const { error, count } = await supabase
    .from("businesses")
    .insert(payload, { count: "exact" });

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return count ?? records.length;
}

export async function listBusinesses(filters: BusinessFilters) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("businesses")
    .select("id,name,city,category,phone,source,source_url,address,notes,confidence_score,created_at", {
      count: "exact"
    })
    .order("created_at", { ascending: false });

  if (filters.city) query = query.eq("city", filters.city);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.source) query = query.eq("source", filters.source);

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(`Supabase query failed: ${error.message}`);

  const total = count ?? 0;
  return {
    data: data ?? [],
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize))
    }
  };
}
