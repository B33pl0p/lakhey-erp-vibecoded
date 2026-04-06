import { Client, Databases, ID } from "node-appwrite";
import fs from "fs";
import { resolve } from "path";

function loadEnvFile(filename) {
  const full = resolve(process.cwd(), filename);
  if (!fs.existsSync(full)) return;
  const raw = fs.readFileSync(full, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

if (!endpoint || !projectId || !apiKey || !databaseId) {
  console.error("Missing Appwrite env vars. Required: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID");
  process.exit(1);
}

const COLLECTIONS = {
  websiteSettings: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_SETTINGS || "website_settings",
  websiteTestimonials: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_TESTIMONIALS || "website_testimonials",
  websiteClients: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_CLIENTS || "website_clients",
  websiteSections: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_SECTIONS || "website_sections",
  websiteFaq: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_FAQ || "website_faq",
  websiteInquiries: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_INQUIRIES || "website_inquiries",
};

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const db = new Databases(client);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureCollection(collectionId, name) {
  try {
    await db.getCollection(databaseId, collectionId);
    console.log(`• Collection exists: ${collectionId}`);
    return;
  } catch {
    await db.createCollection(databaseId, collectionId, name, [], false, true);
    console.log(`+ Created collection: ${collectionId}`);
  }
}

async function getAttributeKeys(collectionId) {
  const res = await db.listAttributes(databaseId, collectionId);
  return new Set(res.attributes.map((a) => a.key));
}

async function ensureString(collectionId, key, size = 255, required = false, def = null) {
  const keys = await getAttributeKeys(collectionId);
  if (keys.has(key)) return;
  await db.createStringAttribute(databaseId, collectionId, key, size, required, required ? undefined : def);
  console.log(`  + string ${collectionId}.${key}`);
  await wait(250);
}

async function ensureInt(collectionId, key, required = false, min = null, max = null, def = null) {
  const keys = await getAttributeKeys(collectionId);
  if (keys.has(key)) return;
  await db.createIntegerAttribute(databaseId, collectionId, key, required, min, max, required ? undefined : def);
  console.log(`  + integer ${collectionId}.${key}`);
  await wait(250);
}

async function ensureBool(collectionId, key, required = false, def = null) {
  const keys = await getAttributeKeys(collectionId);
  if (keys.has(key)) return;
  await db.createBooleanAttribute(databaseId, collectionId, key, required, required ? undefined : def);
  console.log(`  + boolean ${collectionId}.${key}`);
  await wait(250);
}

async function ensureWebsiteSettings() {
  const id = COLLECTIONS.websiteSettings;
  await ensureCollection(id, "website_settings");
  await ensureString(id, "site_name", 120, true);
  await ensureString(id, "hero_title", 300, true);
  await ensureString(id, "hero_subtitle", 2000, false, "");
  await ensureString(id, "hero_cta_primary_label", 120, false, "Visit Store");
  await ensureString(id, "hero_cta_primary_href", 200, false, "/products");
  await ensureString(id, "hero_cta_secondary_label", 120, false, "Start Custom Project");
  await ensureString(id, "hero_cta_secondary_href", 200, false, "/studio");
  await ensureString(id, "hero_tagline", 300, false, "Designed in Nepal, built with precision.");
  await ensureString(id, "contact_email", 200, false, "hello@lakheylabs.com");
  await ensureString(id, "contact_phone", 60, false, "");
  await ensureString(id, "studio_location", 255, false, "Kathmandu, Nepal");
  await ensureBool(id, "is_store_enabled", false, true);
}

async function ensureTestimonials() {
  const id = COLLECTIONS.websiteTestimonials;
  await ensureCollection(id, "website_testimonials");
  await ensureString(id, "name", 120, true);
  await ensureString(id, "role", 140, false, "");
  await ensureString(id, "company", 140, false, "");
  await ensureString(id, "quote", 2000, true);
  await ensureInt(id, "rating", false, 1, 5, 5);
  await ensureString(id, "image_id", 120, false, "");
  await ensureBool(id, "is_active", false, true);
  await ensureInt(id, "sort_order", false, 0, 9999, 100);
}

async function ensureClients() {
  const id = COLLECTIONS.websiteClients;
  await ensureCollection(id, "website_clients");
  await ensureString(id, "name", 160, true);
  await ensureString(id, "logo_image_id", 120, false, "");
  await ensureString(id, "website_url", 500, false, "");
  await ensureBool(id, "is_active", false, true);
  await ensureInt(id, "sort_order", false, 0, 9999, 100);
}

async function ensureSections() {
  const id = COLLECTIONS.websiteSections;
  await ensureCollection(id, "website_sections");
  await ensureString(id, "section_key", 80, true);
  await ensureString(id, "title", 220, true);
  await ensureString(id, "body", 4000, false, "");
  await ensureString(id, "image_id", 120, false, "");
  await ensureString(id, "cta_label", 120, false, "");
  await ensureString(id, "cta_href", 200, false, "");
  await ensureBool(id, "is_active", false, true);
  await ensureInt(id, "sort_order", false, 0, 9999, 100);
}

async function ensureFaq() {
  const id = COLLECTIONS.websiteFaq;
  await ensureCollection(id, "website_faq");
  await ensureString(id, "question", 500, true);
  await ensureString(id, "answer", 4000, true);
  await ensureBool(id, "is_active", false, true);
  await ensureInt(id, "sort_order", false, 0, 9999, 100);
}

async function ensureInquiries() {
  const id = COLLECTIONS.websiteInquiries;
  await ensureCollection(id, "website_inquiries");
  await ensureString(id, "customer_id", 120, false, "");
  await ensureString(id, "name", 160, true);
  await ensureString(id, "email", 200, true);
  await ensureString(id, "inquiry_type", 80, true);
  await ensureString(id, "inquiry_as", 80, false, "");
  await ensureString(id, "material_preference", 200, false, "");
  await ensureString(id, "project_description", 4000, true);
  await ensureString(id, "file_link", 500, false, "");
  await ensureString(id, "source_page", 200, false, "/studio");
  await ensureString(id, "status", 80, false, "new");
}

async function seedIfEmpty(collectionId, docs) {
  const existing = await db.listDocuments(databaseId, collectionId);
  if (existing.total > 0) {
    console.log(`• Seed skipped for ${collectionId} (already has ${existing.total} docs)`);
    return;
  }
  for (const doc of docs) {
    await db.createDocument(databaseId, collectionId, ID.unique(), doc);
    await wait(120);
  }
  console.log(`+ Seeded ${docs.length} docs into ${collectionId}`);
}

async function seedWebsiteData() {
  await seedIfEmpty(COLLECTIONS.websiteSettings, [
    {
      site_name: "Lakhey Labs",
      hero_title: "Simple, reliable 3D printing for custom work and product sales.",
      hero_subtitle: "We help individuals and businesses turn ideas into physical parts and products.",
      hero_cta_primary_label: "Visit Store",
      hero_cta_primary_href: "/products",
      hero_cta_secondary_label: "Start Custom Project",
      hero_cta_secondary_href: "/studio",
      hero_tagline: "Designed in Nepal, built with precision.",
      contact_email: "hello@lakheylabs.com",
      contact_phone: "",
      studio_location: "Kathmandu, Nepal",
      is_store_enabled: true,
    },
  ]);

  await seedIfEmpty(COLLECTIONS.websiteTestimonials, [
    {
      name: "Product Team Lead",
      role: "Prototype Engineering",
      company: "Local Startup",
      quote: "Great communication and fast iterations. The final parts were clean and practical to test.",
      rating: 5,
      image_id: "",
      is_active: true,
      sort_order: 10,
    },
    {
      name: "Architecture Studio",
      role: "Design Team",
      company: "Kathmandu",
      quote: "Presentation models came out crisp and on time. The process was smooth from start to finish.",
      rating: 5,
      image_id: "",
      is_active: true,
      sort_order: 20,
    },
  ]);

  await seedIfEmpty(COLLECTIONS.websiteClients, [
    { name: "Architecture", logo_image_id: "", website_url: "", is_active: true, sort_order: 10 },
    { name: "Engineering", logo_image_id: "", website_url: "", is_active: true, sort_order: 20 },
    { name: "Product Teams", logo_image_id: "", website_url: "", is_active: true, sort_order: 30 },
  ]);

  await seedIfEmpty(COLLECTIONS.websiteSections, [
    {
      section_key: "info",
      title: "Everything you need to know in one place.",
      body: "We keep our service straightforward: clear options, fair pricing, and dependable turnaround.",
      image_id: "",
      cta_label: "",
      cta_href: "",
      is_active: true,
      sort_order: 10,
    },
    {
      section_key: "store",
      title: "Browse our ready-to-buy products.",
      body: "Discover our current product collection or open a custom request from the studio page.",
      image_id: "",
      cta_label: "View Full Store",
      cta_href: "/products",
      is_active: true,
      sort_order: 20,
    },
  ]);

  await seedIfEmpty(COLLECTIONS.websiteFaq, [
    {
      question: "Can I request a custom part?",
      answer: "Yes. Use The Studio inquiry form and share your file link or project details.",
      is_active: true,
      sort_order: 10,
    },
    {
      question: "Do you sell ready products too?",
      answer: "Yes. Visit the store page to browse currently available products and place an order.",
      is_active: true,
      sort_order: 20,
    },
  ]);
}

async function run() {
  console.log("Setting up website content collections...");
  await ensureWebsiteSettings();
  await ensureTestimonials();
  await ensureClients();
  await ensureSections();
  await ensureFaq();
  await ensureInquiries();

  console.log("Seeding starter website content...");
  await seedWebsiteData();

  console.log("\nDone. Add these env vars if not present:");
  console.log(`NEXT_PUBLIC_COLLECTION_WEBSITE_SETTINGS=${COLLECTIONS.websiteSettings}`);
  console.log(`NEXT_PUBLIC_COLLECTION_WEBSITE_TESTIMONIALS=${COLLECTIONS.websiteTestimonials}`);
  console.log(`NEXT_PUBLIC_COLLECTION_WEBSITE_CLIENTS=${COLLECTIONS.websiteClients}`);
  console.log(`NEXT_PUBLIC_COLLECTION_WEBSITE_SECTIONS=${COLLECTIONS.websiteSections}`);
  console.log(`NEXT_PUBLIC_COLLECTION_WEBSITE_FAQ=${COLLECTIONS.websiteFaq}`);
  console.log(`NEXT_PUBLIC_COLLECTION_WEBSITE_INQUIRIES=${COLLECTIONS.websiteInquiries}`);
}

run().catch((err) => {
  console.error("Setup failed:", err?.message || err);
  process.exit(1);
});
