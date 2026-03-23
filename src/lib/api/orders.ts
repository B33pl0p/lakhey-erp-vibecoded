"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';
import { getInvoiceByOrder, createInvoice } from './invoices';
import { addPayment } from './payments';

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
  // Advance payment
  advance_paid?: number;
  advance_notes?: string;
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
  if (data.advance_paid !== undefined && data.advance_paid !== null) payload.advance_paid = Number(data.advance_paid);
  if (data.advance_notes) payload.advance_notes = data.advance_notes;

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
  if (data.advance_paid !== undefined) payload.advance_paid = data.advance_paid !== null ? Number(data.advance_paid) : null;
  if (data.advance_notes !== undefined) payload.advance_notes = data.advance_notes || null;
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

  // Auto-create invoice if status was explicitly set to paid via full edit
  if (data.status === 'paid') {
    try {
      const existing = await getInvoiceByOrder(id);
      if (!existing) {
        const orderDoc = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.orders,
          id
        );
        const totalPrice = orderDoc.total_price as number;
        const customerId = orderDoc.customer_id as string;
        const advancePaid = (orderDoc.advance_paid as number | undefined) ?? 0;
        const advanceNotes = (orderDoc.advance_notes as string | undefined) ?? undefined;
        const invoice = await createInvoice({
          customer_id: customerId,
          order_id: id,
          amount: totalPrice,
          status: 'paid',
          notes: advanceNotes,
        });
        const todayStr = new Date().toISOString().split('T')[0];
        if (advancePaid > 0) {
          await addPayment({ invoice_id: invoice.$id, customer_id: customerId, amount_paid: advancePaid, payment_method: 'cash', payment_date: todayStr, notes: advanceNotes ? `Advance — ${advanceNotes}` : 'Advance payment' });
          const remaining = totalPrice - advancePaid;
          if (remaining > 0.01) await addPayment({ invoice_id: invoice.$id, customer_id: customerId, amount_paid: remaining, payment_method: 'cash', payment_date: todayStr, notes: 'Remaining balance paid' });
        } else {
          await addPayment({ invoice_id: invoice.$id, customer_id: customerId, amount_paid: totalPrice, payment_method: 'cash', payment_date: todayStr, notes: 'Full payment — auto-generated from order' });
        }
      }
    } catch (err) {
      console.error('[auto-invoice] Failed on updateOrder', id, err);
    }
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${id}`);
  revalidatePath('/invoices');
  revalidatePath('/finance');
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { databases } = await createAdminClient();
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    id,
    { status }
  );

  // When marked as paid → auto-create a paid invoice (if one doesn't exist yet)
  if (status === 'paid') {
    try {
      const existing = await getInvoiceByOrder(id);
      if (!existing) {
        // Fetch the order to get amount, customer, and advance details
        const orderDoc = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.orders,
          id
        );
        const totalPrice = orderDoc.total_price as number;
        const customerId = orderDoc.customer_id as string;
        const advancePaid = (orderDoc.advance_paid as number | undefined) ?? 0;
        const advanceNotes = (orderDoc.advance_notes as string | undefined) ?? undefined;

        // Create the invoice as paid
        const invoice = await createInvoice({
          customer_id: customerId,
          order_id: id,
          amount: totalPrice,
          status: 'paid',
          notes: advanceNotes,
        });

        // Record payment(s) so the payment ledger is complete
        const today = new Date().toISOString().split('T')[0];
        if (advancePaid > 0) {
          // Advance payment first
          await addPayment({
            invoice_id: invoice.$id,
            customer_id: customerId,
            amount_paid: advancePaid,
            payment_method: 'cash',
            payment_date: today,
            notes: advanceNotes ? `Advance — ${advanceNotes}` : 'Advance payment',
          });
          // Remaining balance
          const remaining = totalPrice - advancePaid;
          if (remaining > 0.01) {
            await addPayment({
              invoice_id: invoice.$id,
              customer_id: customerId,
              amount_paid: remaining,
              payment_method: 'cash',
              payment_date: today,
              notes: 'Remaining balance paid',
            });
          }
        } else {
          // Full payment at once
          await addPayment({
            invoice_id: invoice.$id,
            customer_id: customerId,
            amount_paid: totalPrice,
            payment_method: 'cash',
            payment_date: today,
            notes: 'Full payment — auto-generated from order',
          });
        }
      }
    } catch (err) {
      // Non-critical — status was updated; log but don't throw
      console.error('[auto-invoice] Failed to create invoice for order', id, err);
    }
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${id}`);
  revalidatePath('/invoices');
  revalidatePath('/finance');
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

/**
 * Convert an order to a draft invoice (or return existing invoice ID if one already exists).
 * Returns { invoiceId } so the client can navigate to /invoices/{invoiceId}.
 */
export async function convertOrderToInvoice(orderId: string): Promise<{ invoiceId: string }> {
  // Check if invoice already exists
  const existing = await getInvoiceByOrder(orderId);
  if (existing) {
    return { invoiceId: existing.$id };
  }

  // Fetch order details
  const { databases } = await createAdminClient();
  const orderDoc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    orderId
  );
  const order = JSON.parse(JSON.stringify(orderDoc)) as Order;

  const invoice = await createInvoice({
    customer_id: order.customer_id,
    order_id: order.$id,
    amount: order.total_price,
    status: 'draft',
    notes: `Invoice for order: ${order.title}`,
  });

  revalidatePath('/invoices');
  revalidatePath('/orders');
  revalidatePath('/finance');

  return { invoiceId: invoice.$id };
}
