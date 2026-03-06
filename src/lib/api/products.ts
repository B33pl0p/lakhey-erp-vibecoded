"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';

export interface Product {
  $id: string;
  name: string;
  category: "lamp" | "print" | "enclosure" | "decor" | "other";
  description?: string;
  labor_cost: number;
  making_cost: number; // stored but also computed from BOM + labor_cost
  selling_price: number;
  height_mm?: number;
  width_mm?: number;
  depth_mm?: number;
  image_id?: string;
  file_id?: string;
  is_active: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export async function getProducts(): Promise<Product[]> {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    [Query.limit(100), Query.orderDesc('$createdAt')]
  );
  return JSON.parse(JSON.stringify(response.documents)) as Product[];
}

export async function getProduct(id: string): Promise<Product> {
  const { databases } = await createAdminClient();
  const response = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    id
  );
  return JSON.parse(JSON.stringify(response)) as Product;
}

export async function createProduct(data: Partial<Product>) {
  const { databases } = await createAdminClient();
  const payload = {
    ...data,
    labor_cost: Number(data.labor_cost || 0),
    making_cost: Number(data.making_cost || 0),
    selling_price: Number(data.selling_price || 0),
    height_mm: data.height_mm ? Number(data.height_mm) : undefined,
    width_mm: data.width_mm ? Number(data.width_mm) : undefined,
    depth_mm: data.depth_mm ? Number(data.depth_mm) : undefined,
    is_active: data.is_active ?? true,
  };

  const doc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    ID.unique(),
    payload
  );

  revalidatePath('/products');
  return JSON.parse(JSON.stringify(doc)) as Product;
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const { databases } = await createAdminClient();

  const payload: Partial<Product> = {
    ...data,
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

  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    id,
    payload
  );

  revalidatePath('/products');
  revalidatePath(`/products/${id}`);
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const { databases } = await createAdminClient();
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    id,
    { is_active: isActive }
  );
  revalidatePath('/products');
}

export async function deleteProduct(id: string) {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    id
  );
  revalidatePath('/products');
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
  revalidatePath('/products');
  revalidatePath(`/products/${id}`);
}
