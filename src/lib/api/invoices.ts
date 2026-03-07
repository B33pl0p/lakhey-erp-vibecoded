"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';
import { getBusinessConfig } from './businessConfig';

export type InvoiceStatus = "draft" | "sent" | "paid" | "partially_paid";

export interface Invoice {
  $id: string;
  customer_id: string;
  order_id: string;
  invoice_number: string;
  amount: number;
  status: InvoiceStatus;
  due_date?: string;
  notes?: string;
  $createdAt: string;
  $updatedAt: string;
}

export async function generateInvoiceNumber(): Promise<string> {
  const { databases } = await createAdminClient();
  const config = await getBusinessConfig();
  const prefix = config.invoice_prefix || "INV";

  // Nepal FY starts ~July 16 each year; use the start-year as the sequence label
  let year: number;
  if (config.fiscal_year_type === 'nepali') {
    const now = new Date();
    const m = now.getMonth(); // 0-indexed: 6 = July
    const d = now.getDate();
    year = (m > 6 || (m === 6 && d >= 16)) ? now.getFullYear() : now.getFullYear() - 1;
  } else {
    year = new Date().getFullYear();
  }
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    [Query.limit(500)]
  );
  // Count invoices for the current year with this prefix
  const count = response.documents.filter((d) =>
    (d.invoice_number as string).startsWith(`${prefix}-${year}-`)
  ).length;
  const seq = String(count + 1).padStart(3, "0");
  return `${prefix}-${year}-${seq}`;
}

export async function getInvoices(): Promise<Invoice[]> {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    [Query.limit(200), Query.orderDesc('$createdAt')]
  );
  return JSON.parse(JSON.stringify(response.documents)) as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { databases } = await createAdminClient();
  const response = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    id
  );
  return JSON.parse(JSON.stringify(response)) as Invoice;
}

export async function getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    [Query.equal('customer_id', customerId), Query.orderDesc('$createdAt')]
  );
  return JSON.parse(JSON.stringify(response.documents)) as Invoice[];
}

export async function getInvoiceByOrder(orderId: string): Promise<Invoice | null> {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    [Query.equal('order_id', orderId), Query.limit(1)]
  );
  if (response.documents.length === 0) return null;
  return JSON.parse(JSON.stringify(response.documents[0])) as Invoice;
}

export async function createInvoice(data: {
  customer_id: string;
  order_id: string;
  amount: number;
  status?: InvoiceStatus;
  due_date?: string;
  notes?: string;
}): Promise<Invoice> {
  const { databases } = await createAdminClient();
  const invoice_number = await generateInvoiceNumber();

  const payload: Record<string, unknown> = {
    customer_id: data.customer_id,
    order_id: data.order_id,
    invoice_number,
    amount: Number(data.amount),
    status: data.status ?? "draft",
  };
  if (data.due_date) payload.due_date = data.due_date;
  if (data.notes) payload.notes = data.notes;

  const doc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    ID.unique(),
    payload
  );

  revalidatePath('/invoices');
  return JSON.parse(JSON.stringify(doc)) as Invoice;
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
  const { databases } = await createAdminClient();

  const payload: Record<string, unknown> = {};
  if (data.status !== undefined) payload.status = data.status;
  if (data.due_date !== undefined) payload.due_date = data.due_date || null;
  if (data.notes !== undefined) payload.notes = data.notes || '';
  if (data.amount !== undefined) payload.amount = Number(data.amount);

  const doc = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    id,
    payload
  );

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${id}`);
  return JSON.parse(JSON.stringify(doc)) as Invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    id
  );
  revalidatePath('/invoices');
}
