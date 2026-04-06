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

type StudioInquiryInput = {
  name: string;
  email: string;
  inquiryAs?: string;
  materialPreference?: string;
  projectDescription: string;
  fileLink?: string;
};

function buildStudioInquiryNote(data: StudioInquiryInput) {
  const submittedAt = new Date().toISOString().replace("T", " ").slice(0, 16);

  return [
    `[Studio Inquiry] ${submittedAt} UTC`,
    `Inquiring as: ${data.inquiryAs?.trim() || "Not specified"}`,
    `Material preference: ${data.materialPreference?.trim() || "Not specified"}`,
    `File link: ${data.fileLink?.trim() || "Will send later"}`,
    "",
    "Project Description:",
    data.projectDescription.trim(),
  ].join("\n");
}

function prependCustomerNotes(existingNotes: string | undefined, nextEntry: string) {
  const combined = [nextEntry, existingNotes?.trim()].filter(Boolean).join("\n\n");
  return combined.length <= 1000 ? combined : `${combined.slice(0, 997)}...`;
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

  revalidatePath('/admin/customers');
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

  revalidatePath('/admin/customers');
  revalidatePath(`/admin/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  const { databases } = await createAdminClient();

  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    id
  );

  revalidatePath('/admin/customers');
}

export async function submitStudioInquiry(data: StudioInquiryInput): Promise<{ customerId?: string; error?: string }> {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const projectDescription = data.projectDescription.trim();

  if (!name || !email || !projectDescription) {
    return { error: "Please fill in your name, email, and project description." };
  }

  const { databases } = await createAdminClient();
  const inquiryNote = buildStudioInquiryNote({
    ...data,
    name,
    email,
    projectDescription,
  });

  const existingRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    [Query.equal("email", email), Query.limit(1)]
  );

  const existing = existingRes.documents[0] as (Customer & { $id: string }) | undefined;

  if (existing) {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.customers,
      existing.$id,
      {
        name: name || existing.name,
        notes: prependCustomerNotes(existing.notes, inquiryNote),
      }
    );

    revalidatePath('/admin/customers');
    revalidatePath(`/admin/customers/${existing.$id}`);
    return { customerId: existing.$id };
  }

  const doc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    ID.unique(),
    {
      name,
      email,
      notes: inquiryNote,
    }
  );

  revalidatePath('/admin/customers');
  return { customerId: doc.$id };
}
