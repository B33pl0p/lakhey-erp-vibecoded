"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';

export interface Product {
  $id: string;
  name: string;
  category: string;
  description?: string;
  labor_cost: number;
  making_cost: number; // stored but also computed from BOM + labor_cost
  selling_price: number;
  height_mm?: number;
  width_mm?: number;
  depth_mm?: number;
  image_id?: string;
  image_ids?: string[];
  file_id?: string;
  is_active: boolean;
  $createdAt: string;
  $updatedAt: string;
}

function normalizeImageIds(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  }
  if (typeof input === "string" && input.trim().length > 0) {
    // Backward/compat mode: if stored as JSON string, parse; otherwise treat as single id
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      }
    } catch {
      return [input];
    }
    return [input];
  }
  return [];
}

function normalizeProduct(product: Product): Product {
  const imageIds = normalizeImageIds((product as unknown as { image_ids?: unknown }).image_ids);
  const merged = imageIds.length > 0
    ? imageIds
    : (product.image_id ? [product.image_id] : []);

  return {
    ...product,
    image_ids: merged,
    image_id: merged[0],
  };
}

function isUnknownImageIdsAttributeError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes('Unknown attribute: "image_ids"');
}

function isInvalidProductCategoryError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  return lower.includes("category") && (
    lower.includes("invalid document structure") ||
    lower.includes("invalid enum value") ||
    lower.includes("must be one of")
  );
}

function toProductSaveError(err: unknown): Error {
  if (isInvalidProductCategoryError(err)) {
    return new Error(
      'This Appwrite environment still restricts product categories. Update the products.category enum before saving a new category.'
    );
  }

  return err instanceof Error ? err : new Error(String(err));
}

async function ensureImageIdsAttribute(databases: Awaited<ReturnType<typeof createAdminClient>>["databases"]) {
  try {
    await databases.getAttribute(
      appwriteConfig.databaseId,
      appwriteConfig.collections.products,
      "image_ids"
    );
    return;
  } catch {
    // Attribute doesn't exist yet; create it.
  }

  await databases.createStringAttribute(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    "image_ids",
    128,
    false,
    undefined,
    true
  );

  // Wait until attribute is available before re-trying document mutation.
  for (let i = 0; i < 12; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      const attr = await databases.getAttribute(
        appwriteConfig.databaseId,
        appwriteConfig.collections.products,
        "image_ids"
      );
      if ((attr as { status?: string }).status === "available") return;
    } catch {
      // keep polling
    }
  }
}

export async function getProducts(): Promise<Product[]> {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    [Query.limit(100), Query.orderDesc('$createdAt')]
  );
  const products = JSON.parse(JSON.stringify(response.documents)) as Product[];
  return products.map(normalizeProduct);
}

export async function getProduct(id: string): Promise<Product> {
  const { databases } = await createAdminClient();
  const response = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    id
  );
  const product = JSON.parse(JSON.stringify(response)) as Product;
  return normalizeProduct(product);
}

export async function createProduct(data: Partial<Product>) {
  const { databases } = await createAdminClient();
  const payload: Record<string, unknown> = {
    ...data,
    image_ids: data.image_ids,
    image_id: data.image_ids?.[0] || data.image_id,
    labor_cost: Number(data.labor_cost || 0),
    making_cost: Number(data.making_cost || 0),
    selling_price: Number(data.selling_price || 0),
    height_mm: data.height_mm ? Number(data.height_mm) : undefined,
    width_mm: data.width_mm ? Number(data.width_mm) : undefined,
    depth_mm: data.depth_mm ? Number(data.depth_mm) : undefined,
    is_active: data.is_active ?? true,
  };

  let doc;
  try {
    doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.products,
      ID.unique(),
      payload
    );
  } catch (err) {
    if (!isUnknownImageIdsAttributeError(err)) throw toProductSaveError(err);

    // Self-heal schema then retry once with full multi-image payload.
    await ensureImageIdsAttribute(databases);
    try {
      doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.products,
        ID.unique(),
        payload
      );
    } catch (retryErr) {
      // Final fallback: persist single image only.
      const fallbackPayload = { ...payload };
      delete fallbackPayload.image_ids;
      doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.products,
        ID.unique(),
        fallbackPayload
      );
      console.warn("[products] Falling back to single image field on createProduct", retryErr);
    }
  }

  revalidatePath('/admin/products');
  return JSON.parse(JSON.stringify(doc)) as Product;
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const { databases } = await createAdminClient();

  const payload: Record<string, unknown> = {
    ...data,
    ...(data.image_ids !== undefined && { image_ids: data.image_ids }),
    ...(data.image_ids !== undefined && { image_id: (data.image_ids[0] || null) as unknown as string }),
    ...(data.labor_cost !== undefined && { labor_cost: Number(data.labor_cost) }),
    ...(data.making_cost !== undefined && { making_cost: Number(data.making_cost) }),
    ...(data.selling_price !== undefined && { selling_price: Number(data.selling_price) }),
    ...(data.height_mm !== undefined && { height_mm: data.height_mm ? Number(data.height_mm) : undefined }),
    ...(data.width_mm !== undefined && { width_mm: data.width_mm ? Number(data.width_mm) : undefined }),
    ...(data.depth_mm !== undefined && { depth_mm: data.depth_mm ? Number(data.depth_mm) : undefined }),
  };

  // Strip undefined fields
  Object.keys(payload).forEach(key => {
    if (payload[key as keyof typeof payload] === undefined) {
      delete payload[key as keyof typeof payload];
    }
  });

  try {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.products,
      id,
      payload
    );
  } catch (err) {
    if (!isUnknownImageIdsAttributeError(err)) throw toProductSaveError(err);

    // Self-heal schema then retry once with full multi-image payload.
    await ensureImageIdsAttribute(databases);
    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.products,
        id,
        payload
      );
    } catch (retryErr) {
      // Final fallback: persist single image only.
      const fallbackPayload = { ...payload };
      delete fallbackPayload.image_ids;
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.products,
        id,
        fallbackPayload
      );
      console.warn("[products] Falling back to single image field on updateProduct", retryErr);
    }
  }

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const { databases } = await createAdminClient();
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    id,
    { is_active: isActive }
  );
  revalidatePath('/admin/products');
}

export async function deleteProduct(id: string) {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    id
  );
  revalidatePath('/admin/products');
}

/**
 * Updates the stored making_cost on a product.
 * Called automatically after any BOM change so the list view stays accurate.
 */
export async function syncProductMakingCost(id: string, makingCost: number) {
  const { databases } = await createAdminClient();
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    id,
    { making_cost: makingCost }
  );
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
}
