import { createAdminClient } from "@/lib/supabase/admin";

const SEARCHES = [
  { label: "Cleaning services Ottawa", industry: "cleaning", city: "Ottawa", keywords: ["cleaning service", "cleaners", "house cleaning", "commercial cleaning"] },
  { label: "Contractors Ottawa", industry: "contractor", city: "Ottawa", keywords: ["general contractor", "home renovation", "handyman", "electrical contractor", "plumbing contractor"] },
  { label: "Fitness studios Ottawa", industry: "fitness", city: "Ottawa", keywords: ["personal trainer", "gym", "fitness studio", "yoga studio", "crossfit"] },
  { label: "Salons Ottawa", industry: "salon", city: "Ottawa", keywords: ["hair salon", "barbershop", "nail salon", "beauty salon"] },
  { label: "Bakeries Ottawa", industry: "bakery", city: "Ottawa", keywords: ["bakery", "cake shop", "pastry shop"] },
];

export async function seed() {
  const supabase = createAdminClient();
  for (const s of SEARCHES) {
    const { error } = await supabase
      .from("zoftware_saved_searches")
      .insert(s);
    if (error) console.error(`Error seeding ${s.label}:`, error.message);
    else console.log(`Seeded: ${s.label}`);
  }
  console.log("Seed complete");
}

seed().catch(console.error);