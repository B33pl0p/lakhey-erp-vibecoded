"use server";

import { Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "../appwrite/server";
import { appwriteConfig } from "../appwrite/config";

export interface WebsiteTestimonial {
  $id: string;
  name: string;
  role?: string;
  company?: string;
  quote: string;
  rating?: number;
  image_id?: string;
  is_active: boolean;
  sort_order: number;
  $createdAt: string;
  $updatedAt: string;
}

export interface WebsiteClient {
  $id: string;
  name: string;
  logo_image_id?: string;
  website_url?: string;
  is_active: boolean;
  sort_order: number;
  $createdAt: string;
  $updatedAt: string;
}

export interface WebsiteSection {
  $id: string;
  section_key: string;
  title: string;
  body?: string;
  image_id?: string;
  cta_label?: string;
  cta_href?: string;
  is_active: boolean;
  sort_order: number;
  $createdAt: string;
  $updatedAt: string;
}

export interface WebsiteSettings {
  $id: string;
  site_name: string;
  hero_title: string;
  hero_subtitle?: string;
  hero_cta_primary_label?: string;
  hero_cta_primary_href?: string;
  hero_cta_secondary_label?: string;
  hero_cta_secondary_href?: string;
  hero_tagline?: string;
  contact_email?: string;
  contact_phone?: string;
  studio_location?: string;
  is_store_enabled: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export async function getWebsiteTestimonials(): Promise<WebsiteTestimonial[]> {
  const { databases } = await createAdminClient();
  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteTestimonials,
    [Query.orderAsc("sort_order"), Query.orderDesc("$createdAt"), Query.limit(200)]
  );
  return JSON.parse(JSON.stringify(res.documents)) as WebsiteTestimonial[];
}

export async function getWebsiteTestimonial(id: string): Promise<WebsiteTestimonial> {
  const { databases } = await createAdminClient();
  const doc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteTestimonials,
    id
  );
  return JSON.parse(JSON.stringify(doc)) as WebsiteTestimonial;
}

type TestimonialInput = {
  name: string;
  role?: string;
  company?: string;
  quote: string;
  rating?: number;
  image_id?: string;
  is_active?: boolean;
  sort_order?: number;
};

export async function createWebsiteTestimonial(data: TestimonialInput) {
  const { databases } = await createAdminClient();
  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteTestimonials,
    "unique()",
    {
      name: data.name,
      role: data.role || "",
      company: data.company || "",
      quote: data.quote,
      rating: data.rating ?? 5,
      image_id: data.image_id || "",
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 100,
    }
  );
  revalidatePath("/admin/website/testimonials");
  revalidatePath("/");
}

export async function updateWebsiteTestimonial(id: string, data: TestimonialInput) {
  const { databases } = await createAdminClient();
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteTestimonials,
    id,
    {
      name: data.name,
      role: data.role || "",
      company: data.company || "",
      quote: data.quote,
      rating: data.rating ?? 5,
      image_id: data.image_id || "",
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 100,
    }
  );
  revalidatePath("/admin/website/testimonials");
  revalidatePath("/");
}

export async function deleteWebsiteTestimonial(id: string) {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteTestimonials,
    id
  );
  revalidatePath("/admin/website/testimonials");
  revalidatePath("/");
}

export async function setWebsiteTestimonialActive(id: string, isActive: boolean) {
  const { databases } = await createAdminClient();
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteTestimonials,
    id,
    { is_active: isActive }
  );
  revalidatePath("/admin/website/testimonials");
  revalidatePath("/");
}

type ClientInput = {
  name: string;
  logo_image_id?: string;
  website_url?: string;
  is_active?: boolean;
  sort_order?: number;
};

export async function getWebsiteClients(): Promise<WebsiteClient[]> {
  const { databases } = await createAdminClient();
  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteClients,
    [Query.orderAsc("sort_order"), Query.orderDesc("$createdAt"), Query.limit(200)]
  );
  return JSON.parse(JSON.stringify(res.documents)) as WebsiteClient[];
}

export async function getWebsiteClient(id: string): Promise<WebsiteClient> {
  const { databases } = await createAdminClient();
  const doc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteClients,
    id
  );
  return JSON.parse(JSON.stringify(doc)) as WebsiteClient;
}

export async function createWebsiteClient(data: ClientInput) {
  const { databases } = await createAdminClient();
  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteClients,
    "unique()",
    {
      name: data.name,
      logo_image_id: data.logo_image_id || "",
      website_url: data.website_url || "",
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 100,
    }
  );
  revalidatePath("/admin/website/clients");
  revalidatePath("/");
}

export async function updateWebsiteClient(id: string, data: ClientInput) {
  const { databases } = await createAdminClient();
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteClients,
    id,
    {
      name: data.name,
      logo_image_id: data.logo_image_id || "",
      website_url: data.website_url || "",
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 100,
    }
  );
  revalidatePath("/admin/website/clients");
  revalidatePath("/");
}

export async function deleteWebsiteClient(id: string) {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteClients,
    id
  );
  revalidatePath("/admin/website/clients");
  revalidatePath("/");
}

export async function setWebsiteClientActive(id: string, isActive: boolean) {
  const { databases } = await createAdminClient();
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteClients,
    id,
    { is_active: isActive }
  );
  revalidatePath("/admin/website/clients");
  revalidatePath("/");
}

type SectionInput = {
  section_key: string;
  title: string;
  body?: string;
  image_id?: string;
  cta_label?: string;
  cta_href?: string;
  is_active?: boolean;
  sort_order?: number;
};

export async function getWebsiteSections(): Promise<WebsiteSection[]> {
  const { databases } = await createAdminClient();
  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteSections,
    [Query.orderAsc("sort_order"), Query.orderDesc("$createdAt"), Query.limit(200)]
  );
  return JSON.parse(JSON.stringify(res.documents)) as WebsiteSection[];
}

export async function getWebsiteSection(id: string): Promise<WebsiteSection> {
  const { databases } = await createAdminClient();
  const doc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteSections,
    id
  );
  return JSON.parse(JSON.stringify(doc)) as WebsiteSection;
}

export async function createWebsiteSection(data: SectionInput) {
  const { databases } = await createAdminClient();
  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteSections,
    "unique()",
    {
      section_key: data.section_key,
      title: data.title,
      body: data.body || "",
      image_id: data.image_id || "",
      cta_label: data.cta_label || "",
      cta_href: data.cta_href || "",
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 100,
    }
  );
  revalidatePath("/admin/website/sections");
  revalidatePath("/");
}

export async function updateWebsiteSection(id: string, data: SectionInput) {
  const { databases } = await createAdminClient();
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteSections,
    id,
    {
      section_key: data.section_key,
      title: data.title,
      body: data.body || "",
      image_id: data.image_id || "",
      cta_label: data.cta_label || "",
      cta_href: data.cta_href || "",
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 100,
    }
  );
  revalidatePath("/admin/website/sections");
  revalidatePath("/");
}

export async function deleteWebsiteSection(id: string) {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteSections,
    id
  );
  revalidatePath("/admin/website/sections");
  revalidatePath("/");
}

export async function setWebsiteSectionActive(id: string, isActive: boolean) {
  const { databases } = await createAdminClient();
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteSections,
    id,
    { is_active: isActive }
  );
  revalidatePath("/admin/website/sections");
  revalidatePath("/");
}

type SettingsInput = Omit<WebsiteSettings, "$id" | "$createdAt" | "$updatedAt">;

export async function getWebsiteSettings(): Promise<WebsiteSettings | null> {
  const { databases } = await createAdminClient();
  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.websiteSettings,
    [Query.limit(1), Query.orderAsc("$createdAt")]
  );
  if (res.total === 0) return null;
  return JSON.parse(JSON.stringify(res.documents[0])) as WebsiteSettings;
}

export async function upsertWebsiteSettings(data: SettingsInput) {
  const { databases } = await createAdminClient();
  const existing = await getWebsiteSettings();

  if (existing) {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.websiteSettings,
      existing.$id,
      data
    );
  } else {
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.websiteSettings,
      "unique()",
      data
    );
  }
  revalidatePath("/admin/website/settings");
  revalidatePath("/");
}
