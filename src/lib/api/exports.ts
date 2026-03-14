"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { Query } from 'node-appwrite';

export async function getOrdersForExport() {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    [Query.limit(1000), Query.orderDesc('$createdAt')]
  );
  return response.documents.map(d => ({
    id: d.$id,
    title: d.title as string,
    customer_id: d.customer_id as string,
    status: d.status as string,
    quantity: d.quantity as number,
    unit_price: d.unit_price as number,
    total_price: d.total_price as number,
    is_product: d.is_product as boolean,
    deadline: (d.deadline as string) || '',
    delivery_address: (d.delivery_address as string) || '',
    custom_notes: (d.custom_notes as string) || '',
    created_at: d.$createdAt as string,
  }));
}

export async function getCustomersForExport() {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    [Query.limit(1000), Query.orderDesc('$createdAt')]
  );
  return response.documents.map(d => ({
    id: d.$id,
    name: d.name as string,
    email: (d.email as string) || '',
    phone: (d.phone as string) || '',
    address: (d.address as string) || '',
    notes: (d.notes as string) || '',
    created_at: d.$createdAt as string,
  }));
}

export async function getInvoicesForExport() {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.invoices,
    [Query.limit(1000), Query.orderDesc('$createdAt')]
  );
  return response.documents.map(d => ({
    invoice_number: d.invoice_number as string,
    customer_id: d.customer_id as string,
    order_id: d.order_id as string,
    amount: d.amount as number,
    status: d.status as string,
    due_date: (d.due_date as string) || '',
    notes: (d.notes as string) || '',
    created_at: d.$createdAt as string,
  }));
}

export async function getExpensesForExport() {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.expenses,
    [Query.limit(1000), Query.orderDesc('date')]
  );
  return response.documents.map(d => ({
    id: d.$id,
    title: d.title as string,
    amount: d.amount as number,
    category: d.category as string,
    date: (d.date as string) || '',
    vendor: (d.vendor as string) || '',
    payment_method: (d.payment_method as string) || '',
    notes: (d.notes as string) || '',
    created_at: d.$createdAt as string,
  }));
}
