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
  collectedOrdersRevenue: number;
  collectedOrdersCount: number;
  totalExpenses: number;
  netProfit: number;
  // Fiscal-period filtered
  fiscalRevenue: number;
  fiscalExpenses: number;
  fiscalNetProfit: number;
  fiscalYearLabel: string;
  lowStockItems: LowStockItem[];
  recentOrders: RecentOrder[];
  recentInvoices: RecentInvoice[];
  recentCustomers: RecentCustomer[];
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

export interface RecentCustomer {
  $id: string;
  name: string;
  email?: string;
  phone?: string;
  $createdAt: string;
}

export async function getDashboardData(): Promise<DashboardStats> {
  const { databases } = await createAdminClient();
  const config = await getBusinessConfig();
  const globalThreshold = config.low_stock_threshold ?? 5;

  // ── Fiscal year calculation ──────────────────────────────────────────
  const now = new Date();
  let fyStart: Date;
  let fiscalYearLabel: string;

  if (config.fiscal_year_type === 'nepali') {
    // Nepal FY starts ~Jul 16. If we're before Jul 16 this year, FY started last year.
    const fyStartThisYear = new Date(now.getFullYear(), 6, 16); // Jul 16
    if (now >= fyStartThisYear) {
      fyStart = fyStartThisYear;
      fiscalYearLabel = `${now.getFullYear()}/${String(now.getFullYear() + 1).slice(2)}`;
    } else {
      fyStart = new Date(now.getFullYear() - 1, 6, 16);
      fiscalYearLabel = `${now.getFullYear() - 1}/${String(now.getFullYear()).slice(2)}`;
    }
  } else {
    fyStart = new Date(now.getFullYear(), 0, 1); // Jan 1
    fiscalYearLabel = String(now.getFullYear());
  }
  const fyStartISO = fyStart.toISOString();

  // Parallel fetch of all collections needed
  const [ordersRes, invoicesRes, paymentsRes, inventoryRes, customersRes, expensesRes] = await Promise.all([
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
      appwriteConfig.collections.payments,
      [Query.limit(2000), Query.orderDesc('$createdAt')]
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
    databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.expenses,
      [Query.limit(1000)]
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
  const inProgressOrders = ordersRes.documents.filter(d => d.status === 'printing').length;

  const invoicedOrderIds = new Set<string>();
  for (const inv of invoicesRes.documents) {
    if (inv.order_id) invoicedOrderIds.add(inv.order_id as string);
  }

  const invoicePaidMap = new Map<string, number>();
  for (const p of paymentsRes.documents) {
    const invoiceId = p.invoice_id as string;
    invoicePaidMap.set(invoiceId, (invoicePaidMap.get(invoiceId) ?? 0) + (p.amount_paid as number));
  }

  // Revenue aggregations from invoices
  const invoiceRevenue = invoicesRes.documents
    .filter(d => d.status === 'paid')
    .reduce((sum, d) => sum + (d.amount as number), 0);

  const unpaidRevenue = invoicesRes.documents
    .filter(d => d.status === 'sent' || d.status === 'partially_paid')
    .reduce((sum, d) => {
      const paid = invoicePaidMap.get(d.$id) ?? 0;
      const remaining = (d.amount as number) - paid;
      return sum + Math.max(0, remaining);
    }, 0);

  // Directly collected orders (marked as paid without invoice)
  const collectedOrders = ordersRes.documents.filter(
    d => d.status === 'paid' && !invoicedOrderIds.has(d.$id)
  );
  const collectedOrdersRevenue = collectedOrders.reduce((sum, d) => sum + (d.total_price as number), 0);
  const collectedOrdersCount = collectedOrders.length;

  // Combined revenue
  const totalRevenue = invoiceRevenue + collectedOrdersRevenue;

  // Expense aggregations
  const totalExpenses = expensesRes.documents
    .reduce((sum, d) => sum + (d.amount as number), 0);

  // Fiscal period aggregations
  const fiscalInvoiceRevenue = invoicesRes.documents
    .filter(d => d.status === 'paid' && d.$createdAt >= fyStartISO)
    .reduce((sum, d) => sum + (d.amount as number), 0);

  const fiscalCollectedRevenue = ordersRes.documents
    .filter(d => d.status === 'paid' && d.$updatedAt >= fyStartISO && !invoicedOrderIds.has(d.$id))
    .reduce((sum, d) => sum + (d.total_price as number), 0);

  const fiscalRevenue = fiscalInvoiceRevenue + fiscalCollectedRevenue;

  const fiscalExpenses = expensesRes.documents
    .filter(d => {
      const dateStr = (d.date as string) || (d.$createdAt as string);
      return dateStr >= fyStartISO.substring(0, 10);
    })
    .reduce((sum, d) => sum + (d.amount as number), 0);

  const fiscalNetProfit = fiscalRevenue - fiscalExpenses;

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

  // Recent customers (last 5 by createdAt)
  const sortedCustomers = [...customersRes.documents].sort(
    (a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
  );
  const recentCustomers: RecentCustomer[] = sortedCustomers.slice(0, 5).map(d => ({
    $id: d.$id,
    name: d.name as string,
    email: d.email as string | undefined,
    phone: d.phone as string | undefined,
    $createdAt: d.$createdAt as string,
  }));

  return {
    totalOrders,
    pendingOrders,
    inProgressOrders,
    totalRevenue,
    unpaidRevenue,
    collectedOrdersRevenue,
    collectedOrdersCount,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    fiscalRevenue,
    fiscalExpenses,
    fiscalNetProfit,
    fiscalYearLabel,
    lowStockItems,
    recentOrders,
    recentInvoices,
    recentCustomers,
    totalCustomers: customersRes.total,
  };
}
