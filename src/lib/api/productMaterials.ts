"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';
import type { InventoryItem } from './inventory';

export interface ProductMaterial {
  $id: string;
  product_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_cost_override?: number | null; // null = use inventory unit_cost
  notes?: string;
}

/** BOM line enriched with live inventory item details */
export interface BomLine extends ProductMaterial {
  item_name: string;
  item_unit: string;
  item_unit_cost: number; // base cost from inventory (used when no override)
  item_weight_per_unit_grams: number;
  // Computed helpers
  effective_unit_cost: number; // override ?? item_unit_cost
  line_total: number;          // quantity * effective_unit_cost
  line_weight_grams: number;   // quantity * item_weight_per_unit_grams
}

export async function getBomForProduct(productId: string): Promise<BomLine[]> {
  const { databases } = await createAdminClient();

  const matsRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.productMaterials,
    [Query.equal('product_id', productId), Query.limit(100)]
  );

  const materials = JSON.parse(JSON.stringify(matsRes.documents)) as ProductMaterial[];

  if (materials.length === 0) return [];

  // Batch-fetch distinct inventory items
  const itemIds = [...new Set(materials.map(m => m.inventory_item_id))];
  const itemsRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.inventoryItems,
    [Query.equal('$id', itemIds), Query.limit(100)]
  );
  const itemMap = new Map<string, InventoryItem>(
    (JSON.parse(JSON.stringify(itemsRes.documents)) as InventoryItem[]).map(i => [i.$id, i])
  );

  return materials.map(m => {
    const inv = itemMap.get(m.inventory_item_id);
    const item_unit_cost = inv?.unit_cost ?? 0;
    const item_weight = inv?.weight_per_unit_grams ?? 0;
    const effective_unit_cost = m.unit_cost_override != null ? m.unit_cost_override : item_unit_cost;

    return {
      ...m,
      item_name: inv?.name ?? 'Unknown item',
      item_unit: inv?.unit ?? '',
      item_unit_cost,
      item_weight_per_unit_grams: item_weight,
      effective_unit_cost,
      line_total: m.quantity * effective_unit_cost,
      line_weight_grams: m.quantity * item_weight,
    };
  });
}

export async function addBomLine(data: {
  product_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_cost_override?: number | null;
  notes?: string;
}): Promise<{ $id: string }> {
  const { databases } = await createAdminClient();

  const payload = {
    product_id: data.product_id,
    inventory_item_id: data.inventory_item_id,
    quantity: Number(data.quantity),
    ...(data.unit_cost_override != null && { unit_cost_override: Number(data.unit_cost_override) }),
    ...(data.notes && { notes: data.notes }),
  };

  const doc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.productMaterials,
    ID.unique(),
    payload
  );

  revalidatePath(`/products/${data.product_id}`);
  return { $id: doc.$id };
}

export async function updateBomLine(
  lineId: string,
  productId: string,
  data: { quantity: number; unit_cost_override?: number | null; notes?: string }
) {
  const { databases } = await createAdminClient();

  const payload: Record<string, unknown> = {
    quantity: Number(data.quantity),
    notes: data.notes ?? null,
  };

  // Explicitly allow nulling out the override (revert to inventory cost)
  if (data.unit_cost_override != null && data.unit_cost_override !== undefined) {
    payload.unit_cost_override = Number(data.unit_cost_override);
  } else {
    payload.unit_cost_override = null;
  }

  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.productMaterials,
    lineId,
    payload
  );

  revalidatePath(`/products/${productId}`);
}

export async function removeBomLine(lineId: string, productId: string) {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.productMaterials,
    lineId
  );
  revalidatePath(`/products/${productId}`);
}
