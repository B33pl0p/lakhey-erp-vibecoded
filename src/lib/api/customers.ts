"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';

export interface Customer {
  $id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  $createdAt: string;
  $updatedAt: string;
}

export async function getCustomers(): Promise<Customer[]> {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    [Query.limit(200), Query.orderDesc('$createdAt')]
  );
  return JSON.parse(JSON.stringify(response.documents)) as Customer[];
}

export async function getCustomer(id: string): Promise<Customer> {
  const { databases } = await createAdminClient();
  const response = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    id
  );
  return JSON.parse(JSON.stringify(response)) as Customer;
}

export async function createCustomer(data: Partial<Customer>) {
  const { databases } = await createAdminClient();

  const payload = {
    name: data.name,
    ...(data.email && { email: data.email }),
    ...(data.phone && { phone: data.phone }),
    ...(data.address && { address: data.address }),
    ...(data.notes && { notes: data.notes }),
  };

  const doc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    ID.unique(),
    payload
  );

  revalidatePath('/customers');
  return JSON.parse(JSON.stringify(doc)) as Customer;
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  const { databases } = await createAdminClient();

  const payload: Record<string, string | null> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.email !== undefined) payload.email = data.email || '';
  if (data.phone !== undefined) payload.phone = data.phone || '';
  if (data.address !== undefined) payload.address = data.address || '';
  if (data.notes !== undefined) payload.notes = data.notes || '';

  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    id,
    payload
  );

  revalidatePath('/customers');
  revalidatePath(`/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  const { databases } = await createAdminClient();

  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    id
  );

  revalidatePath('/customers');
}
