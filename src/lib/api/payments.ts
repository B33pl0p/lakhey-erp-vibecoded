"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "online" | "other";

export interface Payment {
  $id: string;
  invoice_id: string;
  customer_id: string;
  amount_paid: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  notes?: string;
  $createdAt: string;
  $updatedAt: string;
}

async function listAllPaymentsForInvoice(invoiceId: string): Promise<Record<string, unknown>[]> {
  const { databases } = await createAdminClient();
  const allPayments: Record<string, unknown>[] = [];
  let cursor: string | undefined;

  while (true) {
    const queries = [Query.equal('invoice_id', invoiceId), Query.limit(100), Query.orderAsc('$id')];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.payments,
      queries
    );

    allPayments.push(...(page.documents as Record<string, unknown>[]));
    if (page.documents.length < 100) break;
    cursor = page.documents[page.documents.length - 1].$id;
  }

  return allPayments;
}

export async function getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.payments,
    [Query.equal('invoice_id', invoiceId), Query.orderDesc('$createdAt')]
  );
  return JSON.parse(JSON.stringify(response.documents)) as Payment[];
}

export async function addPayment(data: {
  invoice_id: string;
  customer_id: string;
  amount_paid: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  notes?: string;
}): Promise<Payment> {
  const { databases } = await createAdminClient();
  const amountPaid = Number(data.amount_paid);
  if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const invoiceDoc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    data.invoice_id
  );

  const invoiceAmount = invoiceDoc.amount as number;
  const invoiceCustomerId = invoiceDoc.customer_id as string;
  if (data.customer_id !== invoiceCustomerId) {
    throw new Error("Payment customer does not match invoice customer.");
  }

  const existingPayments = await listAllPaymentsForInvoice(data.invoice_id);
  const alreadyPaid = existingPayments.reduce(
    (sum, p) => sum + (p.amount_paid as number),
    0
  );
  const remaining = Math.max(0, invoiceAmount - alreadyPaid);
  if (amountPaid > remaining + 0.01) {
    throw new Error(`Payment exceeds remaining balance. Remaining: ${remaining.toFixed(2)}`);
  }

  const payload: Record<string, unknown> = {
    invoice_id: data.invoice_id,
    customer_id: data.customer_id,
    amount_paid: amountPaid,
    payment_method: data.payment_method,
  };
  if (data.payment_date) payload.payment_date = data.payment_date;
  if (data.notes) payload.notes = data.notes;

  const doc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.payments,
    ID.unique(),
    payload
  );

  // Sync invoice status after adding payment
  await syncInvoiceStatus(data.invoice_id);

  revalidatePath(`/admin/invoices/${data.invoice_id}`);
  revalidatePath('/admin/invoices');
  return JSON.parse(JSON.stringify(doc)) as Payment;
}

export async function deletePayment(paymentId: string, invoiceId: string): Promise<void> {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.payments,
    paymentId
  );

  // Sync invoice status after removing payment
  await syncInvoiceStatus(invoiceId);

  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath('/admin/invoices');
}

/**
 * Recalculates invoice status based on total payments vs. invoice amount.
 * - totalPaid == 0         → keeps current status (don't revert sent→draft)
 * - 0 < totalPaid < amount → "partially_paid"
 * - totalPaid >= amount    → "paid"
 */
export async function syncInvoiceStatus(invoiceId: string): Promise<void> {
  const { databases } = await createAdminClient();

  // Get invoice
  const invoiceDoc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    invoiceId
  );

  const allPayments = await listAllPaymentsForInvoice(invoiceId);
  const totalPaid = allPayments.reduce(
    (sum, p) => sum + (p.amount_paid as number),
    0
  );
  const amount = invoiceDoc.amount as number;

  let newStatus: string;
  if (totalPaid >= amount && amount > 0) {
    newStatus = "paid";
  } else if (totalPaid > 0) {
    newStatus = "partially_paid";
  } else {
    // No payments: drafts stay draft; anything else reverts to sent.
    newStatus = invoiceDoc.status === "draft" ? "draft" : "sent";
  }

  if (newStatus !== invoiceDoc.status) {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.invoices,
      invoiceId,
      { status: newStatus }
    );
  }
}
