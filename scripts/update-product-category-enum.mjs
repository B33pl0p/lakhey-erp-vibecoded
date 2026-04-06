import { Client, Databases } from "node-appwrite";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(process.cwd(), ".env") });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID;
const collectionId = process.env.NEXT_PUBLIC_COLLECTION_PRODUCTS || "products";

if (!endpoint || !projectId || !apiKey || !databaseId) {
  console.error("Missing Appwrite environment variables.");
  process.exit(1);
}

const categoriesToAdd = process.argv
  .slice(2)
  .map((value) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  )
  .filter(Boolean);

if (categoriesToAdd.length === 0) {
  console.error("Usage: node scripts/update-product-category-enum.mjs <category> [more-categories]");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function main() {
  const attribute = await databases.getAttribute(databaseId, collectionId, "category");

  if (attribute.type !== "enum") {
    console.log('The "category" attribute is not an enum. No update needed.');
    return;
  }

  const currentElements = Array.isArray(attribute.elements) ? attribute.elements : [];
  const nextElements = Array.from(new Set([...currentElements, ...categoriesToAdd])).sort((a, b) => a.localeCompare(b));

  if (nextElements.length === currentElements.length) {
    console.log("No new categories to add.");
    console.log("Allowed categories:", currentElements.join(", "));
    return;
  }

  await databases.updateEnumAttribute(
    databaseId,
    collectionId,
    "category",
    nextElements,
    attribute.required,
    attribute.default
  );

  console.log("Updated product category enum.");
  console.log("Allowed categories:", nextElements.join(", "));
}

main().catch((error) => {
  console.error("Failed to update product category enum.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
