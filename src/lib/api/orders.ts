"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';

export type OrderStatus = "pending" | "printing" | "done" | "delivered" | "paid" | "cancelled";
export type FilamentType = "PLA" | "PETG" | "ABS" | "TPU" | "ASA" | "Resin" | "Other";

export interface Order {
  $id: string;
  customer_id: string;
  is_product: boolean;
  product_id?: string;
  title: string;
  status: OrderStatus;
  quantity: number;
  unit_price: number;
  total_price: number;
  // Custom order fields
  custom_material?: string;
  custom_notes?: string;
  filament_type?: FilamentType;
  filament_color?: string;
  is_multicolor?: boolean;
  print_x_mm?: number;
  print_y_mm?: number;
  print_z_mm?: number;
  is_assembled?: boolean;
  is_single_part?: boolean;
  filament_price_per_gram?: number;
  filament_weight_grams?: number;
  // Shared
  deadline?: string;
  file_id?: string;
  image_id?: string;
  delivery_address?: string;
  $createdAt: string;
  $updatedAt: string;
}

export async function getOrders(): Promise<Order[]> {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    [Query.limit(200), Query.orderDesc('$createdAt')]
  );
  return JSON.parse(JSON.stringify(response.documents)) as Order[];
}

export async function getOrder(id: string): Promise<Order> {
  const { databases } = await createAdminClient();
  const response = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    id
  );
  return JSON.parse(JSON.stringify(response)) as Order;
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    [Query.equal('customer_id', customerId), Query.orderDesc('$createdAt')]
  );
  return JSON.parse(JSON.stringify(response.documents)) as Order[];
}

export async function createOrder(data: Partial<Order>) {
  const { databases } = await createAdminClient();

  const payload: Record<string, unknown> = {
    customer_id: data.customer_id,
    is_product: data.is_product ?? false,
    title: data.title,
    status: data.status ?? "pending",
    quantity: Number(data.quantity),
    unit_price: Number(data.unit_price),
    total_price: Number(data.total_price),
  };

  // Optional shared fields
  if (data.product_id) payload.product_id = data.product_id;
  if (data.deadline) payload.deadline = data.deadline;
  if (data.file_id) payload.file_id = data.file_id;
  if (data.image_id) payload.image_id = data.image_id;
  if (data.delivery_address) payload.delivery_address = data.delivery_address;

  // Custom order fields
  if (!data.is_product) {
    if (data.custom_material) payload.custom_material = data.custom_material;
    if (data.custom_notes) payload.custom_notes = data.custom_notes;
    if (data.filament_type) payload.filament_type = data.filament_type;
    if (data.filament_color) payload.filament_color = data.filament_color;
    if (data.is_multicolor !== undefined) payload.is_multicolor = data.is_multicolor;
    if (data.is_assembled !== undefined) payload.is_assembled = data.is_assembled;
    if (data.is_single_part !== undefined) payload.is_single_part = data.is_single_part;
    if (data.print_x_mm) payload.print_x_mm = Number(data.print_x_mm);
    if (data.print_y_mm) payload.print_y_mm = Number(data.print_y_mm);
    if (data.print_z_mm) payload.print_z_mm = Number(data.print_z_mm);
    if (data.filament_price_per_gram) payload.filament_price_per_gram = Number(data.filament_price_per_gram);
    if (data.filament_weight_grams) payload.filament_weight_grams = Number(data.filament_weight_grams);
  }

  const doc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    ID.unique(),
    payload
  );

  revalidatePath('/orders');
  return JSON.parse(JSON.stringify(doc)) as Order;
}

export async function updateOrder(id: string, data: Partial<Order>) {
  const { databases } = await createAdminClient();

  const payload: Record<string, unknown> = {};

  if (data.customer_id !== undefined) payload.customer_id = data.customer_id;
  if (data.title !== undefined) payload.title = data.title;
  if (data.status !== undefined) payload.status = data.status;
  if (data.quantity !== undefined) payload.quantity = Number(data.quantity);
  if (data.unit_price !== undefined) payload.unit_price = Number(data.unit_price);
  if (data.total_price !== undefined) payload.total_price = Number(data.total_price);
  if (data.deadline !== undefined) payload.deadline = data.deadline || null;
  if (data.delivery_address !== undefined) payload.delivery_address = data.delivery_address || null;
  if (data.file_id !== undefined) payload.file_id = data.file_id || null;
  if (data.image_id !== undefined) payload.image_id = data.image_id || null;
  if (data.product_id !== undefined) payload.product_id = data.product_id || null;
  // Custom fields
  if (data.custom_material !== undefined) payload.custom_material = data.custom_material || null;
  if (data.custom_notes !== undefined) payload.custom_notes = data.custom_notes || null;
  if (data.filament_type !== undefined) payload.filament_type = data.filament_type || null;
  if (data.filament_color !== undefined) payload.filament_color = data.filament_color || null;
  if (data.is_multicolor !== undefined) payload.is_multicolor = data.is_multicolor;
  if (data.is_assembled !== undefined) payload.is_assembled = data.is_assembled;
  if (data.is_single_part !== undefined) payload.is_single_part = data.is_single_part;
  if (data.print_x_mm !== undefined) payload.print_x_mm = data.print_x_mm ? Number(data.print_x_mm) : null;
  if (data.print_y_mm !== undefined) payload.print_y_mm = data.print_y_mm ? Number(data.print_y_mm) : null;
  if (data.print_z_mm !== undefined) payload.print_z_mm = data.print_z_mm ? Number(data.print_z_mm) : null;
  if (data.filament_price_per_gram !== undefined) payload.filament_price_per_gram = data.filament_price_per_gram ? Number(data.filament_price_per_gram) : null;
  if (data.filament_weight_grams !== undefined) payload.filament_weight_grams = data.filament_weight_grams ? Number(data.filament_weight_grams) : null;

  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    id,
    payload
  );

  revalidatePath('/orders');
  revalidatePath(`/orders/${id}`);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { databases } = await createAdminClient();
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    id,
    { status }
  );
  revalidatePath('/orders');
  revalidatePath(`/orders/${id}`);
}

export async function deleteOrder(id: string) {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    id
  );
  revalidatePath('/orders');
}
