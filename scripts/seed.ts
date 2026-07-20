// Seeds demo data for a fresh clone of this project: a 3-level category
// tree, two approved vendors with a varied catalog (2-4 metal variants
// each), and one test customer. Safe to re-run — everything is checked by
// slug/email before insert, so it won't duplicate rows.
//
// Deliberately does NOT seed an admin account — that stays a live,
// demoable step via /admin/setup, per the project's bootstrap design.
//
// Usage: npm run seed

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureCategory(name: string, parentId: string | null) {
  const slug = slugify(name);
  const baseQuery = supabase.from("categories").select("id").eq("slug", slug);
  // Comparing parent_id to null needs `.is()`, not `.eq()` — branching the
  // whole query (rather than reassigning a `let`) also sidesteps the
  // supabase-js query-builder generic-narrowing issue hit in
  // lib/payouts/calculate.ts.
  const { data: existing } = await (parentId
    ? baseQuery.eq("parent_id", parentId)
    : baseQuery.is("parent_id", null)
  ).maybeSingle();

  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, slug, parent_id: parentId })
    .select("id")
    .single();

  if (error || !data) throw new Error(`Failed to create category "${name}": ${error?.message}`);
  console.log(`  + category ${name}`);
  return data.id as string;
}

async function ensureAuthUser(email: string, password: string) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing.users.find((u) => u.email === email);
  if (found) return found.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create user ${email}: ${error?.message}`);
  return data.user.id;
}

async function ensureVendor(input: {
  email: string;
  password: string;
  businessName: string;
  addressLine1: string;
  city: string;
  country: string;
  commissionPct: number;
}) {
  const userId = await ensureAuthUser(input.email, input.password);

  await supabase.from("profiles").upsert({ id: userId, role: "vendor" });

  const slug = slugify(input.businessName);
  const { data: existingVendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingVendor) return userId;

  const { error } = await supabase.from("vendors").insert({
    id: userId,
    business_name: input.businessName,
    slug,
    is_approved: true,
    approved_at: new Date().toISOString(),
    commission_pct: input.commissionPct,
    address_line1: input.addressLine1,
    city: input.city,
    country: input.country,
  });
  if (error) throw new Error(`Failed to create vendor ${input.businessName}: ${error.message}`);
  console.log(`  + vendor ${input.businessName}`);
  return userId;
}

async function ensureCustomer(email: string, password: string, fullName: string) {
  const userId = await ensureAuthUser(email, password);
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  await supabase.from("profiles").upsert({ id: userId, role: "customer", full_name: fullName });
  if (!existingProfile) console.log(`  + customer ${fullName}`);
}

type VariantSeed = { metalType: string; hex: string; priceDelta: number; stock: number };

async function ensureProduct(input: {
  vendorId: string;
  categoryId: string;
  title: string;
  description: string;
  basePrice: number;
  stock: number;
  primaryImageUrl: string;
  variants: VariantSeed[];
}) {
  const slug = slugify(input.title);
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      vendor_id: input.vendorId,
      category_id: input.categoryId,
      title: input.title,
      slug,
      description: input.description,
      base_price: input.basePrice,
      stock: input.stock,
      primary_image_url: input.primaryImageUrl,
      status: "approved",
    })
    .select("id")
    .single();

  if (error || !product) throw new Error(`Failed to create product "${input.title}": ${error?.message}`);

  await supabase.from("product_variants").insert(
    input.variants.map((v) => ({
      product_id: product.id,
      metal_type: v.metalType,
      swatch_hex: v.hex,
      price_delta: v.priceDelta,
      stock: v.stock,
    }))
  );

  console.log(`  + product ${input.title}`);
  return product.id as string;
}

const METALS = {
  white_gold: "#e8e8e8",
  yellow_gold: "#d4af37",
  rose_gold: "#e0aa94",
  silver: "#c0c0c0",
};

async function main() {
  console.log("Categories...");
  const jewelry = await ensureCategory("Jewelry", null);
  const labGrown = await ensureCategory("Lab Grown", jewelry);
  const natural = await ensureCategory("Natural", jewelry);

  const labGrownEarrings = await ensureCategory("Earrings", labGrown);
  const labGrownRings = await ensureCategory("Rings", labGrown);
  const labGrownNecklaces = await ensureCategory("Necklaces", labGrown);
  const labGrownBracelets = await ensureCategory("Bracelets", labGrown);

  const naturalEarrings = await ensureCategory("Earrings", natural);
  const naturalRings = await ensureCategory("Rings", natural);
  const naturalNecklaces = await ensureCategory("Necklaces", natural);
  const naturalBracelets = await ensureCategory("Bracelets", natural);

  console.log("Vendors...");
  const aurumId = await ensureVendor({
    email: "vendor@aurum.demo",
    password: "DemoVendor123!",
    businessName: "Aurum Fine Jewelry",
    addressLine1: "88 Makati Ave",
    city: "Makati City",
    country: "Philippines",
    commissionPct: 15,
  });
  const solsticeId = await ensureVendor({
    email: "vendor@solstice.demo",
    password: "DemoVendor123!",
    businessName: "Solstice Gems",
    addressLine1: "42 Ortigas Center",
    city: "Pasig City",
    country: "Philippines",
    commissionPct: 12,
  });

  console.log("Customer...");
  await ensureCustomer("customer@shopper.demo", "DemoShopper123!", "Chloe Customer");

  console.log("Products...");
  await ensureProduct({
    vendorId: aurumId,
    categoryId: labGrownRings,
    title: "Eternity Band Ring",
    description: "A continuous row of lab-grown round brilliants, 2mm band.",
    basePrice: 620,
    stock: 15,
    primaryImageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a",
    variants: [
      { metalType: "white_gold", hex: METALS.white_gold, priceDelta: 0, stock: 6 },
      { metalType: "yellow_gold", hex: METALS.yellow_gold, priceDelta: 0, stock: 5 },
      { metalType: "rose_gold", hex: METALS.rose_gold, priceDelta: 20, stock: 4 },
    ],
  });

  await ensureProduct({
    vendorId: aurumId,
    categoryId: labGrownBracelets,
    title: "Tennis Bracelet",
    description: "Classic four-prong tennis bracelet, 7 inches.",
    basePrice: 980,
    stock: 8,
    primaryImageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d",
    variants: [
      { metalType: "white_gold", hex: METALS.white_gold, priceDelta: 0, stock: 4 },
      { metalType: "silver", hex: METALS.silver, priceDelta: -150, stock: 4 },
    ],
  });

  await ensureProduct({
    vendorId: aurumId,
    categoryId: labGrownNecklaces,
    title: "Solitaire Pendant Necklace",
    description: "0.5ct lab-grown solitaire on an 18-inch chain.",
    basePrice: 410,
    stock: 12,
    primaryImageUrl: "https://images.unsplash.com/photo-1599459183200-59c7687a0275",
    variants: [
      { metalType: "yellow_gold", hex: METALS.yellow_gold, priceDelta: 0, stock: 6 },
      { metalType: "rose_gold", hex: METALS.rose_gold, priceDelta: 0, stock: 6 },
    ],
  });

  await ensureProduct({
    vendorId: aurumId,
    categoryId: naturalRings,
    title: "Halo Engagement Ring",
    description: "Natural center stone surrounded by a double halo.",
    basePrice: 2400,
    stock: 5,
    primaryImageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e",
    variants: [
      { metalType: "white_gold", hex: METALS.white_gold, priceDelta: 0, stock: 3 },
      { metalType: "rose_gold", hex: METALS.rose_gold, priceDelta: 50, stock: 2 },
    ],
  });

  await ensureProduct({
    vendorId: solsticeId,
    categoryId: naturalEarrings,
    title: "Pearl Drop Earrings",
    description: "Freshwater pearls suspended from a delicate wire setting.",
    basePrice: 180,
    stock: 20,
    primaryImageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908",
    variants: [
      { metalType: "silver", hex: METALS.silver, priceDelta: 0, stock: 10 },
      { metalType: "yellow_gold", hex: METALS.yellow_gold, priceDelta: 15, stock: 10 },
    ],
  });

  await ensureProduct({
    vendorId: solsticeId,
    categoryId: naturalBracelets,
    title: "Chain Link Bracelet",
    description: "Chunky curb-chain bracelet, adjustable clasp.",
    basePrice: 260,
    stock: 14,
    primaryImageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a",
    variants: [
      { metalType: "silver", hex: METALS.silver, priceDelta: 0, stock: 7 },
      { metalType: "yellow_gold", hex: METALS.yellow_gold, priceDelta: 25, stock: 4 },
      { metalType: "rose_gold", hex: METALS.rose_gold, priceDelta: 25, stock: 3 },
    ],
  });

  await ensureProduct({
    vendorId: solsticeId,
    categoryId: naturalNecklaces,
    title: "Layered Pendant Necklace",
    description: "Two-strand layered necklace with a natural gemstone drop.",
    basePrice: 320,
    stock: 10,
    primaryImageUrl: "https://images.unsplash.com/photo-1599459183200-59c7687a0275",
    variants: [
      { metalType: "yellow_gold", hex: METALS.yellow_gold, priceDelta: 0, stock: 5 },
      { metalType: "silver", hex: METALS.silver, priceDelta: -40, stock: 5 },
    ],
  });

  await ensureProduct({
    vendorId: solsticeId,
    categoryId: labGrownEarrings,
    title: "Cluster Stud Earrings",
    description: "A cluster of small lab-grown round stones in a flower setting.",
    basePrice: 290,
    stock: 18,
    primaryImageUrl: "https://images.unsplash.com/photo-1608042314453-ae338d80c427",
    variants: [
      { metalType: "white_gold", hex: METALS.white_gold, priceDelta: 0, stock: 9 },
      { metalType: "rose_gold", hex: METALS.rose_gold, priceDelta: 0, stock: 9 },
    ],
  });

  await ensureProduct({
    vendorId: solsticeId,
    categoryId: labGrownRings,
    title: "Signet Ring",
    description: "Engravable flat-top signet ring, unisex sizing.",
    basePrice: 340,
    stock: 16,
    primaryImageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a",
    variants: [
      { metalType: "yellow_gold", hex: METALS.yellow_gold, priceDelta: 0, stock: 8 },
      { metalType: "silver", hex: METALS.silver, priceDelta: -80, stock: 8 },
    ],
  });

  console.log("\nDone. Sign in with:");
  console.log("  vendor@aurum.demo / DemoVendor123!");
  console.log("  vendor@solstice.demo / DemoVendor123!");
  console.log("  customer@shopper.demo / DemoShopper123!");
  console.log("  (bootstrap an admin at /admin/setup)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
