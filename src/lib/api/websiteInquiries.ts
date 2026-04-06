"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "../appwrite/server";
import { appwriteConfig } from "../appwrite/config";

export const WEBSITE_INQUIRY_STATUSES = ["new", "contacted", "quoted", "closed"] as const;
export type WebsiteInquiryStatus = typeof WEBSITE_INQUIRY_STATUSES[number];

export interface WebsiteInquiry {
  $id: string;
  customer_id?: string;
  name: string;
  email: string;
  inquiry_type: string;
  inquiry_as?: string;
  material_preference?: string;
  project_description: string;
  file_link?: string;
  source_page?: string;
  status: WebsiteInquiryStatus | string;
  $createdAt: string;
  $updatedAt: string;
}

type WebsiteInquiryInput = {
  customer_id?: string;
  name: string;
  email: string;
  inquiry_type: string;
  inquiry_as?: string;
  material_preference?: string;
  project_description: string;
  file_link?: string;
  source_page?: string;
  status?: WebsiteInquiryStatus | string;
};

type StudioInquiryInput = {
  name: string;
  email: string;
  inquiryAs?: string;
  materialPreference?: string;
  projectDescription: string;
  fileLink?: string;
};

const INQUIRY_COLLECTION_NAME = "website_inquiries";

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureCollection(databases: Awaited<ReturnType<typeof createAdminClient>>["databases"], collectionId: string, name: string) {
  try {
    await databases.getCollection(appwriteConfig.databaseId, collectionId);
    return;
  } catch {
    await databases.createCollection(appwriteConfig.databaseId, collectionId, name, [], false, true);
  }
}

async function getAttributeKeys(databases: Awaited<ReturnType<typeof createAdminClient>>["databases"], collectionId: string) {
  const res = await databases.listAttributes(appwriteConfig.databaseId, collectionId);
  return new Set(res.attributes.map((attribute) => attribute.key));
}

async function ensureStringAttribute(
  databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
  collectionId: string,
  key: string,
  size: number,
  required = false,
  def: string | undefined = undefined
) {
  const keys = await getAttributeKeys(databases, collectionId);
  if (keys.has(key)) return;
  await databases.createStringAttribute(
    appwriteConfig.databaseId,
    collectionId,
    key,
    size,
    required,
    required ? undefined : def
  );
  await wait(250);
}

async function ensureWebsiteInquiriesCollection(databases: Awaited<ReturnType<typeof createAdminClient>>["databases"]) {
  const collectionId = appwriteConfig.collections.websiteInquiries;
  await ensureCollection(databases, collectionId, INQUIRY_COLLECTION_NAME);
  await ensureStringAttribute(databases, collectionId, "customer_id", 120, false, "");
  await ensureStringAttribute(databases, collectionId, "name", 160, true);
  await ensureStringAttribute(databases, collectionId, "email", 200, true);
  await ensureStringAttribute(databases, collectionId, "inquiry_type", 80, true);
  await ensureStringAttribute(databases, collectionId, "inquiry_as", 80, false, "");
  await ensureStringAttribute(databases, collectionId, "material_preference", 200, false, "");
  await ensureStringAttribute(databases, collectionId, "project_description", 4000, true);
  await ensureStringAttribute(databases, collectionId, "file_link", 500, false, "");
  await ensureStringAttribute(databases, collectionId, "source_page", 200, false, "/studio");
  await ensureStringAttribute(databases, collectionId, "status", 80, false, "new");
}

function isMissingInquiryCollectionError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  return (
    lower.includes("collection") && lower.includes("not found")
  ) || lower.includes("attribute not found");
}

export async function getWebsiteInquiries(): Promise<WebsiteInquiry[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return [];
  }

  const { databases } = await createAdminClient();
  try {
    const res = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.websiteInquiries,
      [Query.orderDesc("$createdAt"), Query.limit(200)]
    );
    return JSON.parse(JSON.stringify(res.documents)) as WebsiteInquiry[];
  } catch (err) {
    if (isMissingInquiryCollectionError(err)) {
      return [];
    }
    throw err;
  }
}

export async function createWebsiteInquiry(data: WebsiteInquiryInput) {
  const { databases } = await createAdminClient();
  await ensureWebsiteInquiriesCollection(databases);

  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteInquiries,
    ID.unique(),
    {
      customer_id: data.customer_id || "",
      name: data.name,
      email: data.email,
      inquiry_type: data.inquiry_type,
      inquiry_as: data.inquiry_as || "",
      material_preference: data.material_preference || "",
      project_description: data.project_description,
      file_link: data.file_link || "",
      source_page: data.source_page || "/studio",
      status: data.status || "new",
    }
  );

  revalidatePath("/admin/website/inquiries");
}

export async function updateWebsiteInquiryStatus(id: string, status: WebsiteInquiryStatus | string) {
  const { databases } = await createAdminClient();
  await ensureWebsiteInquiriesCollection(databases);
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteInquiries,
    id,
    { status }
  );
  revalidatePath("/admin/website/inquiries");
}

export async function deleteWebsiteInquiry(id: string) {
  const { databases } = await createAdminClient();
  await ensureWebsiteInquiriesCollection(databases);
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteInquiries,
    id
  );
  revalidatePath("/admin/website/inquiries");
}

export async function submitStudioInquiry(data: StudioInquiryInput): Promise<{ customerId?: string; error?: string }> {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const projectDescription = data.projectDescription.trim();

  if (!name || !email || !projectDescription) {
    return { error: "Please fill in your name, email, and project description." };
  }

  const { databases } = await createAdminClient();
  const existingRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    [Query.equal("email", email), Query.limit(1)]
  );

  const existing = JSON.parse(JSON.stringify(existingRes.documents[0] ?? null)) as {
    $id: string;
    name: string;
  } | null;

  let customerId = existing?.$id;

  if (existing) {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.customers,
      existing.$id,
      { name: name || existing.name }
    );
  } else {
    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.customers,
      ID.unique(),
      {
        name,
        email,
        notes: "",
      }
    );
    customerId = doc.$id;
    revalidatePath("/admin/customers");
  }

  await createWebsiteInquiry({
    customer_id: customerId,
    name,
    email,
    inquiry_type: "studio",
    inquiry_as: data.inquiryAs?.trim(),
    material_preference: data.materialPreference?.trim(),
    project_description: projectDescription,
    file_link: data.fileLink?.trim(),
    source_page: "/studio",
    status: "new",
  });

  if (customerId) {
    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${customerId}`);
  }

  return { customerId };
}
