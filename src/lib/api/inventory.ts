"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';

export interface InventoryItem {
  $id: string;
  name: string;
  category: "filament" | "resin" | "electronics" | "wire" | "hardware" | "packaging" | "other";
  unit: "grams" | "meters" | "pieces" | "liters";
  unit_cost: number;
  stock_qty: number;
  low_stock_threshold: number;
  supplier?: string;
  supplier_sku?: string;
  weight_per_unit_grams?: number;
  length_mm?: number;
  width_mm?: number;
  height_mm?: number;
  notes?: string;
  image_id?: string;
  $createdAt: string;
  $updatedAt: string;
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const { databases } = await createAdminClient();
  
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.inventoryItems,
    [
      Query.limit(100), // Adjust pagination as needed for larger datasets
      Query.orderDesc('$createdAt')
    ]
  );
  
  // Strip Appwrite class instances/prototypes so Next.js can serialize to Client Components
  return JSON.parse(JSON.stringify(response.documents)) as InventoryItem[];
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const { databases } = await createAdminClient();
  const response = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.inventoryItems,
    id
  );
  
  // Strip Appwrite class instances/prototypes
  return JSON.parse(JSON.stringify(response)) as InventoryItem;
}

export async function createInventoryItem(data: Partial<InventoryItem>) {
  const { databases } = await createAdminClient();
  
  // Appwrite requires float types explicitly, not integers, so we ensure parsing if forms send strings
  const payload = {
    ...data,
    unit_cost: Number(data.unit_cost),
    stock_qty: Number(data.stock_qty),
    low_stock_threshold: Number(data.low_stock_threshold || 0),
    weight_per_unit_grams: Number(data.weight_per_unit_grams || 0),
    length_mm: data.length_mm ? Number(data.length_mm) : undefined,
    width_mm: data.width_mm ? Number(data.width_mm) : undefined,
    height_mm: data.height_mm ? Number(data.height_mm) : undefined,
  };

  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.inventoryItems,
    ID.unique(),
    payload
  );
  
  revalidatePath('/admin/inventory');
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItem>) {
  const { databases } = await createAdminClient();
  
  const payload: Partial<InventoryItem> = {
    ...data,
    ...(data.unit_cost !== undefined && { unit_cost: Number(data.unit_cost) }),
    ...(data.stock_qty !== undefined && { stock_qty: Number(data.stock_qty) }),
    ...(data.low_stock_threshold !== undefined && { low_stock_threshold: Number(data.low_stock_threshold) }),
    ...(data.weight_per_unit_grams !== undefined && { weight_per_unit_grams: Number(data.weight_per_unit_grams) }),
    ...(data.length_mm !== undefined && { length_mm: data.length_mm ? Number(data.length_mm) : undefined }),
    ...(data.width_mm !== undefined && { width_mm: data.width_mm ? Number(data.width_mm) : undefined }),
    ...(data.height_mm !== undefined && { height_mm: data.height_mm ? Number(data.height_mm) : undefined }),
  };

  // Clean up undefined fields to not overwrite with null unless intentional
  Object.keys(payload).forEach(key => {
    if (payload[key as keyof typeof payload] === undefined) {
      delete payload[key as keyof typeof payload];
    }
  });

  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.inventoryItems,
    id,
    payload
  );
  
  revalidatePath('/admin/inventory');
  revalidatePath(`/admin/inventory/${id}/edit`);
}

export async function adjustStock(id: string, currentStock: number, adjustment: number) {
  const { databases } = await createAdminClient();
  
  const newStock = Math.max(0, currentStock + adjustment); // Prevent negative stock
  
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.inventoryItems,
    id,
    { stock_qty: newStock }
  );
  
  revalidatePath('/admin/inventory');
}

export async function deleteInventoryItem(id: string) {
  const { databases } = await createAdminClient();
  
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.inventoryItems,
    id
  );
  
  revalidatePath('/admin/inventory');
}
