"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { Query } from 'node-appwrite';
import { getBusinessConfig } from './businessConfig';

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  totalRevenue: number;
  unpaidRevenue: number;
  lowStockItems: LowStockItem[];
  recentOrders: RecentOrder[];
  recentInvoices: RecentInvoice[];
  totalCustomers: number;
}

export interface LowStockItem {
  $id: string;
  name: string;
  category: string;
  stock_qty: number;
  low_stock_threshold: number;
  unit: string;
}

export interface RecentOrder {
  $id: string;
  title: string;
  customer_name: string;
  status: string;
  total_price: number;
  $createdAt: string;
}

export interface RecentInvoice {
  $id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  status: string;
  due_date?: string;
  $createdAt: string;
}

export async function getDashboardData(): Promise<DashboardStats> {
  const { databases } = await createAdminClient();
  const config = await getBusinessConfig();
  const globalThreshold = config.low_stock_threshold ?? 5;

  // Parallel fetch of all collections needed
  const [ordersRes, invoicesRes, inventoryRes, customersRes] = await Promise.all([
    databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.orders,
      [Query.limit(1000), Query.orderDesc('$createdAt')]
    ),
    databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.invoices,
      [Query.limit(1000), Query.orderDesc('$createdAt')]
    ),
    databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.inventoryItems,
      [Query.limit(500)]
    ),
    databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.customers,
      [Query.limit(500)]
    ),
  ]);

  // Build a customer ID → name map for quick lookup
  const customerMap = new Map<string, string>();
  for (const c of customersRes.documents) {
    customerMap.set(c.$id, c.name as string);
  }

  // Order aggregations
  const totalOrders = ordersRes.total;
  const pendingOrders = ordersRes.documents.filter(d => d.status === 'pending').length;
  const inProgressOrders = ordersRes.documents.filter(d => d.status === 'in_progress').length;

  // Revenue aggregations from invoices
  const totalRevenue = invoicesRes.documents
    .filter(d => d.status === 'paid')
    .reduce((sum, d) => sum + (d.amount as number), 0);

  const unpaidRevenue = invoicesRes.documents
    .filter(d => d.status === 'sent' || d.status === 'partially_paid')
    .reduce((sum, d) => sum + (d.amount as number), 0);

  // Low stock: use per-item threshold if set, else global default
  const lowStockItems: LowStockItem[] = inventoryRes.documents
    .filter(d => {
      const threshold = (d.low_stock_threshold as number) ?? globalThreshold;
      return (d.stock_qty as number) <= threshold;
    })
    .map(d => ({
      $id: d.$id,
      name: d.name as string,
      category: d.category as string,
      stock_qty: d.stock_qty as number,
      low_stock_threshold: (d.low_stock_threshold as number) ?? globalThreshold,
      unit: d.unit as string,
    }))
    .slice(0, 8); // show top 8

  // Recent orders (last 5)
  const recentOrders: RecentOrder[] = ordersRes.documents.slice(0, 5).map(d => ({
    $id: d.$id,
    title: d.title as string,
    customer_name: customerMap.get(d.customer_id as string) ?? '—',
    status: d.status as string,
    total_price: d.total_price as number,
    $createdAt: d.$createdAt as string,
  }));

  // Recent invoices (last 5)
  const recentInvoices: RecentInvoice[] = invoicesRes.documents.slice(0, 5).map(d => ({
    $id: d.$id,
    invoice_number: d.invoice_number as string,
    customer_id: d.customer_id as string,
    customer_name: customerMap.get(d.customer_id as string) ?? '—',
    amount: d.amount as number,
    status: d.status as string,
    due_date: d.due_date as string | undefined,
    $createdAt: d.$createdAt as string,
  }));

  return {
    totalOrders,
    pendingOrders,
    inProgressOrders,
    totalRevenue,
    unpaidRevenue,
    lowStockItems,
    recentOrders,
    recentInvoices,
    totalCustomers: customersRes.total,
  };
}
