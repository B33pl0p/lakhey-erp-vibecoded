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

  const payload: Record<string, unknown> = {
    invoice_id: data.invoice_id,
    customer_id: data.customer_id,
    amount_paid: Number(data.amount_paid),
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

  revalidatePath(`/invoices/${data.invoice_id}`);
  revalidatePath('/invoices');
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

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath('/invoices');
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

  // Get all payments for this invoice
  const paymentsRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.payments,
    [Query.equal('invoice_id', invoiceId), Query.limit(500)]
  );

  const totalPaid = paymentsRes.documents.reduce(
    (sum, p) => sum + (p.amount_paid as number),
    0
  );
  const amount = invoiceDoc.amount as number;

  let newStatus: string = invoiceDoc.status as string;
  if (totalPaid >= amount && totalPaid > 0) {
    newStatus = "paid";
  } else if (totalPaid > 0) {
    newStatus = "partially_paid";
  } else {
    // No payments — restore to "sent" if was previously partially_paid, else leave as-is
    if (invoiceDoc.status === "partially_paid") {
      newStatus = "sent";
    }
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
