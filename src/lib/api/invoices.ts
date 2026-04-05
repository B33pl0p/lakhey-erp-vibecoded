"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';
import { getBusinessConfig } from './businessConfig';
import { syncInvoiceStatus } from './payments';

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

function getSequenceYear(fiscalYearType: 'calendar' | 'nepali' | undefined): number {
  if (fiscalYearType === 'nepali') {
    const now = new Date();
    const m = now.getMonth(); // 0-indexed: 6 = July
    const d = now.getDate();
    return (m > 6 || (m === 6 && d >= 16)) ? now.getFullYear() : now.getFullYear() - 1;
  }
  return new Date().getFullYear();
}

async function getNextInvoiceSequence(prefix: string, year: number): Promise<number> {
  const { databases } = await createAdminClient();
  const prefixToken = `${prefix}-${year}-`;
  let cursor: string | undefined;
  let maxSeq = 0;

  while (true) {
    const queries = [Query.limit(100), Query.orderAsc("$id")];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.invoices,
      queries
    );

    for (const d of page.documents) {
      const invoiceNumber = d.invoice_number as string | undefined;
      if (!invoiceNumber || !invoiceNumber.startsWith(prefixToken)) continue;
      const seqPart = invoiceNumber.slice(prefixToken.length);
      const seq = Number(seqPart);
      if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
    }

    if (page.documents.length < 100) break;
    cursor = page.documents[page.documents.length - 1].$id;
  }

  return maxSeq + 1;
}

export async function generateInvoiceNumber(): Promise<string> {
  const config = await getBusinessConfig();
  const prefix = config.invoice_prefix || "INV";
  const year = getSequenceYear(config.fiscal_year_type);
  const nextSeq = await getNextInvoiceSequence(prefix, year);
  const seq = String(nextSeq).padStart(3, "0");
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
  const config = await getBusinessConfig();
  const prefix = config.invoice_prefix || "INV";
  const year = getSequenceYear(config.fiscal_year_type);
  const baseSeq = await getNextInvoiceSequence(prefix, year);
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const invoice_number = `${prefix}-${year}-${String(baseSeq + attempt).padStart(3, "0")}`;
    const existing = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.invoices,
      [Query.equal("invoice_number", invoice_number), Query.limit(1)]
    );
    if (existing.total > 0) continue;

    const payload: Record<string, unknown> = {
      customer_id: data.customer_id,
      order_id: data.order_id,
      invoice_number,
      amount: Number(data.amount),
      status: data.status ?? "draft",
    };
    if (data.due_date) payload.due_date = data.due_date;
    if (data.notes) payload.notes = data.notes;

    try {
      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.invoices,
        ID.unique(),
        payload
      );
      revalidatePath('/admin/invoices');
      return JSON.parse(JSON.stringify(doc)) as Invoice;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      const retryableConflict =
        message.includes("already exists") ||
        message.includes("duplicate") ||
        message.includes("unique");
      if (!retryableConflict) throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to create invoice after multiple invoice-number collision retries.");
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

  if (data.amount !== undefined || data.status !== undefined) {
    await syncInvoiceStatus(id);
  }

  revalidatePath('/admin/invoices');
  revalidatePath(`/admin/invoices/${id}`);
  revalidatePath('/admin/finance');
  return JSON.parse(JSON.stringify(doc)) as Invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { databases } = await createAdminClient();

  // Delete all linked payments first to avoid orphaned payment records.
  while (true) {
    const page = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.payments,
      [Query.equal('invoice_id', id), Query.limit(100)]
    );
    if (page.documents.length === 0) break;

    for (const payment of page.documents) {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.payments,
        payment.$id
      );
    }
  }

  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    id
  );
  revalidatePath('/admin/invoices');
  revalidatePath('/admin/finance');
}
