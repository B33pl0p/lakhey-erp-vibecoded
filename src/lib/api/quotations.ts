"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';
import { getBusinessConfig } from './businessConfig';
import { createOrder } from './orders';

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface QuoteLineItem {
  description: string;
  qty: number;
  unit_price: number;
}

export interface Quote {
  $id: string;
  quote_number: string;
  customer_id: string;
  title: string;
  line_items: string; // JSON-encoded QuoteLineItem[]
  subtotal: number;
  vat_amount: number;
  grand_total: number;
  notes?: string;
  valid_until?: string;
  status: QuoteStatus;
  converted_order_id?: string;
  include_vat?: boolean;
  $createdAt: string;
  $updatedAt: string;
}

// ── Number generator ─────────────────────────────────────────────────────────

export async function generateQuoteNumber(): Promise<string> {
  const { databases } = await createAdminClient();
  const config = await getBusinessConfig();
  const prefix = config.quote_prefix || "QUO";

  let year: number;
  if (config.fiscal_year_type === 'nepali') {
    const now = new Date();
    const m = now.getMonth();
    const d = now.getDate();
    year = (m > 6 || (m === 6 && d >= 16)) ? now.getFullYear() : now.getFullYear() - 1;
  } else {
    year = new Date().getFullYear();
  }

  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.quotations,
    [Query.limit(500)]
  );
  const count = response.documents.filter((d) =>
    (d.quote_number as string).startsWith(`${prefix}-${year}-`)
  ).length;
  const seq = String(count + 1).padStart(3, "0");
  return `${prefix}-${year}-${seq}`;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getQuotations(): Promise<Quote[]> {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.quotations,
    [Query.limit(200), Query.orderDesc('$createdAt')]
  );
  return JSON.parse(JSON.stringify(response.documents)) as Quote[];
}

export async function getQuotation(id: string): Promise<Quote> {
  const { databases } = await createAdminClient();
  const response = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.quotations,
    id
  );
  return JSON.parse(JSON.stringify(response)) as Quote;
}

export async function createQuotation(data: {
  customer_id: string;
  title: string;
  line_items: QuoteLineItem[];
  subtotal: number;
  vat_amount: number;
  grand_total: number;
  notes?: string;
  valid_until?: string;
  status?: QuoteStatus;
  include_vat?: boolean;
}): Promise<Quote> {
  const { databases } = await createAdminClient();
  const quote_number = await generateQuoteNumber();

  const payload: Record<string, unknown> = {
    quote_number,
    customer_id: data.customer_id,
    title: data.title,
    line_items: JSON.stringify(data.line_items),
    subtotal: Number(data.subtotal),
    vat_amount: Number(data.vat_amount),
    grand_total: Number(data.grand_total),
    status: data.status ?? "draft",
    include_vat: data.include_vat ?? false,
  };
  if (data.notes) payload.notes = data.notes;
  if (data.valid_until) payload.valid_until = data.valid_until;

  const doc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.quotations,
    ID.unique(),
    payload
  );
  revalidatePath('/quotations');
  return JSON.parse(JSON.stringify(doc)) as Quote;
}

export async function updateQuotation(id: string, data: {
  customer_id?: string;
  title?: string;
  line_items?: QuoteLineItem[];
  subtotal?: number;
  vat_amount?: number;
  grand_total?: number;
  notes?: string;
  valid_until?: string;
  status?: QuoteStatus;
  converted_order_id?: string;
  include_vat?: boolean;
}): Promise<Quote> {
  const { databases } = await createAdminClient();

  const payload: Record<string, unknown> = {};
  if (data.customer_id !== undefined) payload.customer_id = data.customer_id;
  if (data.title !== undefined) payload.title = data.title;
  if (data.line_items !== undefined) payload.line_items = JSON.stringify(data.line_items);
  if (data.subtotal !== undefined) payload.subtotal = Number(data.subtotal);
  if (data.vat_amount !== undefined) payload.vat_amount = Number(data.vat_amount);
  if (data.grand_total !== undefined) payload.grand_total = Number(data.grand_total);
  if (data.notes !== undefined) payload.notes = data.notes || '';
  if (data.valid_until !== undefined) payload.valid_until = data.valid_until || null;
  if (data.status !== undefined) payload.status = data.status;
  if (data.converted_order_id !== undefined) payload.converted_order_id = data.converted_order_id;
  if (data.include_vat !== undefined) payload.include_vat = data.include_vat;

  const doc = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.quotations,
    id,
    payload
  );
  revalidatePath('/quotations');
  revalidatePath(`/quotations/${id}`);
  return JSON.parse(JSON.stringify(doc)) as Quote;
}

export async function deleteQuotation(id: string): Promise<void> {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.quotations,
    id
  );
  revalidatePath('/quotations');
}

// ── Convert accepted quote → Order ───────────────────────────────────────────

export async function convertQuoteToOrder(quoteId: string): Promise<{ orderId: string }> {
  const quote = await getQuotation(quoteId);

  const items: QuoteLineItem[] = JSON.parse(quote.line_items || "[]");
  const itemsSummary = items
    .map(i => `• ${i.description} (×${i.qty})`)
    .join("\n");

  const order = await createOrder({
    customer_id: quote.customer_id,
    title: quote.title,
    is_product: false,
    quantity: 1,
    unit_price: quote.grand_total,
    total_price: quote.grand_total,
    status: "pending",
    custom_notes: `From quotation ${quote.quote_number}\n\n${itemsSummary}`,
  });

  // Mark quote as accepted with the linked order id
  await updateQuotation(quoteId, {
    status: "accepted",
    converted_order_id: order.$id,
  });

  revalidatePath('/orders');
  revalidatePath('/quotations');
  return { orderId: order.$id };
}
