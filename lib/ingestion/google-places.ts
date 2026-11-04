import { createAdminClient } from "@/lib/supabase/admin";
import type { Industry, SavedSearch } from "@/lib/types";

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
}

export interface IngestSummary {
  source: string;
  fetched: number;
  inserted: number;
  duplicates: number;
  failed: number;
  error: string | null;
}

const INDUSTRY_SEARCH_TERMS: Record<Industry, string[]> = {
  cleaning: ["cleaning service", "cleaners", "house cleaning", "commercial cleaning"],
  contractor: ["general contractor", "home renovation", "handyman", "electrical contractor", "plumbing contractor"],
  fitness: ["personal trainer", "gym", "fitness studio", "yoga studio", "crossfit"],
  salon: ["hair salon", "barbershop", "nail salon", "beauty salon"],
  bakery: ["bakery", "cake shop", "pastry shop"],
  retail: ["boutique", "retail store", "shop", "fashion store"],
  hospitality: ["hotel", "restaurant", "cafe", "event venue"],
  professional_services: ["accounting firm", "law firm", "consulting firm", "real estate agency"],
  other: [],
};

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchGooglePlaces(
  query: string,
  location: string,
  apiKey: string,
): Promise<GooglePlaceResult[]> {
  // Use Places API (New) - Text Search
  const url = "https://places.googleapis.com/v1/places:searchText";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.id,places.rating,places.userRatingCount,places.types",
    },
    body: JSON.stringify({
      textQuery: `${query} in ${location}`,
      languageCode: "en",
      regionCode: "CA",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Places API error: ${response.status} ${errorText}`,
    );
  }

  const data = await response.json();
  const places = data.places || [];

  return places.map((p: any) => ({
    place_id: p.id,
    name: p.displayName?.text || "",
    formatted_address: p.formattedAddress || "",
    formatted_phone_number: p.nationalPhoneNumber || undefined,
    website: p.websiteUri || undefined,
    types: p.types || [],
    rating: p.rating || undefined,
    user_ratings_total: p.userRatingCount || undefined,
  }));
}

export async function runIngestion(): Promise<IngestSummary[]> {
  const supabase = createAdminClient();
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY not configured");
  }

  const summaries: IngestSummary[] = [];

  // Fetch active saved searches
  const { data: searches } = await supabase
    .from("zoftware_saved_searches")
    .select("*")
    .eq("is_active", true);

  if (!searches || searches.length === 0) {
    console.log("No active saved searches found");
    return summaries;
  }

  for (const search of searches as SavedSearch[]) {
    const startedAt = new Date().toISOString();
    let fetched = 0;
    let inserted = 0;
    let duplicates = 0;
    let failed = 0;
    let error: string | null = null;

    try {
      const searchTerms = search.industry
        ? INDUSTRY_SEARCH_TERMS[search.industry]
        : search.keywords;

      const location = search.city || "Ottawa, Ontario, Canada";

      for (const term of searchTerms) {
        const places = await searchGooglePlaces(term, location, apiKey);
        fetched += places.length;

        for (const place of places) {
          const result = await upsertCompany(supabase, place, search.industry);
          if (result === "inserted") inserted++;
          if (result === "duplicate") duplicates++;
          if (result === "failed") failed++;
        }

        // Rate limiting: wait 100ms between API calls
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    await supabase.from("zoftware_ingestion_runs").insert({
      source: "google_places",
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      fetched_count: fetched,
      inserted_count: inserted,
      duplicate_count: duplicates,
      error,
    });

    summaries.push({
      source: "google_places",
      fetched,
      inserted,
      duplicates,
      failed,
      error,
    });
  }

  return summaries;
}

async function upsertCompany(
  supabase: ReturnType<typeof createAdminClient>,
  place: GooglePlaceResult,
  industry: Industry | null,
): Promise<"inserted" | "duplicate" | "failed"> {
  const normalizedName = normalizeCompanyName(place.name);

  // Check if company already exists (including disapproved ones — prevents duplicates)
  const { data: existing } = await supabase
    .from("zoftware_companies")
    .select("id, disapproved_at")
    .eq("normalized_name", normalizedName)
    .single();

  if (existing) {
    // Company already in the system — skip to avoid duplicates.
    // Disapproved companies stay disapproved; they won't be resurrected by re-ingestion.
    return "duplicate";
  }

  const row = {
    name: place.name,
    normalized_name: normalizedName,
    industry,
    city: "Ottawa", // Default for now, could parse from formatted_address
    state: "Ontario",
    phone: place.formatted_phone_number || null,
    website: place.website || null,
    google_place_id: place.place_id,
    size: null, // Would need to fetch details separately
    linkedin_url: null,
    notes: null,
  };

  const { error: insertError } = await supabase
    .from("zoftware_companies")
    .insert(row);

  if (insertError) {
    console.error(`Failed to insert company ${place.name}:`, insertError.message);
    return "failed";
  }

  // Leave new companies in triage; the approval flow creates their leads.
  return "inserted";
}