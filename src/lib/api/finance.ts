"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { Query } from 'node-appwrite';

export interface FinanceSummary {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalExpenses: number;
  netProfit: number;
}

export interface CustomerReceivable {
  customerId: string;
  customerName: string;
  phone?: string;
  openInvoices: number;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  oldestDueDate?: string;
  isOverdue: boolean;
}

export interface OverdueInvoice {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paid: number;
  balance: number;
  dueDate: string;
  daysOverdue: number;
}

export interface MonthlyFlow {
  key: string;      // "2026-01"
  label: string;    // "Jan 2026"
  revenue: number;
  expenses: number;
  net: number;
}

export interface RecentPaymentEntry {
  paymentId: string;
  customerName: string;
  invoiceNumber: string;
  amountPaid: number;
  paymentMethod: string;
  paymentDate: string;
}

export interface FinanceData {
  summary: FinanceSummary;
  receivables: CustomerReceivable[];
  overdueInvoices: OverdueInvoice[];
  monthlyFlow: MonthlyFlow[];
  recentPayments: RecentPaymentEntry[];
}

export async function getFinanceData(): Promise<FinanceData> {
  const { databases } = await createAdminClient();
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  // Fetch everything in parallel
  const [customersRes, invoicesRes, paymentsRes, expensesRes, ordersRes] = await Promise.all([
    databases.listDocuments(
      appwriteConfig.databaseId, appwriteConfig.collections.customers,
      [Query.limit(500)]
    ),
    databases.listDocuments(
      appwriteConfig.databaseId, appwriteConfig.collections.invoices,
      [Query.limit(1000), Query.orderDesc('$createdAt')]
    ),
    databases.listDocuments(
      appwriteConfig.databaseId, appwriteConfig.collections.payments,
      [Query.limit(2000), Query.orderDesc('$createdAt')]
    ),
    databases.listDocuments(
      appwriteConfig.databaseId, appwriteConfig.collections.expenses,
      [Query.limit(1000), Query.orderDesc('date')]
    ),
    databases.listDocuments(
      appwriteConfig.databaseId, appwriteConfig.collections.orders,
      [Query.limit(1000), Query.orderDesc('$createdAt')]
    ),
  ]);

  // ── Lookup maps ──────────────────────────────────────────────────────
  const customerMap = new Map<string, { name: string; phone?: string }>();
  for (const c of customersRes.documents) {
    customerMap.set(c.$id, { name: c.name as string, phone: c.phone as string | undefined });
  }

  // Set of order_ids that already have an invoice
  const invoicedOrderIds = new Set<string>();
  for (const inv of invoicesRes.documents) {
    if (inv.order_id) invoicedOrderIds.add(inv.order_id as string);
  }

  // invoice_id → total amount paid
  const invoicePaidMap = new Map<string, number>();
  for (const p of paymentsRes.documents) {
    const invId = p.invoice_id as string;
    invoicePaidMap.set(invId, (invoicePaidMap.get(invId) ?? 0) + (p.amount_paid as number));
  }

  const allInvoices = invoicesRes.documents;

  // ── Orders without invoices (historical data pre-auto-invoice) ───────
  // Paid orders with no invoice → count their total_price as collected revenue
  const uninvoicedPaidOrders = ordersRes.documents.filter(
    o => o.status === 'paid' && !invoicedOrderIds.has(o.$id)
  );
  // Active orders with advance_paid > 0 but no invoice → outstanding balance
  const uninvoicedAdvanceOrders = ordersRes.documents.filter(
    o => o.status !== 'paid' && o.status !== 'cancelled' &&
         !invoicedOrderIds.has(o.$id) &&
         (o.advance_paid as number | undefined ?? 0) > 0
  );

  // Paid invoices that have NO payment records (status set directly, no PaymentPanel used)
  const paidInvoicesNoRecord = allInvoices.filter(
    inv => inv.status === 'paid' && !invoicePaidMap.has(inv.$id)
  );
  const paidNoRecordAmount = paidInvoicesNoRecord.reduce((s, inv) => s + (inv.amount as number), 0);

  // ── Summary ──────────────────────────────────────────────────────────
  const totalInvoiced = allInvoices.reduce((s, inv) => s + (inv.amount as number), 0)
    + uninvoicedPaidOrders.reduce((s, o) => s + (o.total_price as number), 0);

  const invoiceCollected = paymentsRes.documents.reduce((s, p) => s + (p.amount_paid as number), 0)
    + paidNoRecordAmount;
  const orderCollected = uninvoicedPaidOrders.reduce((s, o) => s + (o.total_price as number), 0)
    + uninvoicedAdvanceOrders.reduce((s, o) => s + ((o.advance_paid as number | undefined) ?? 0), 0);
  const totalCollected = invoiceCollected + orderCollected;

  let totalOutstanding = 0;
  for (const inv of allInvoices) {
    if (inv.status === 'paid') continue;
    const paid = invoicePaidMap.get(inv.$id) ?? 0;
    const bal = (inv.amount as number) - paid;
    if (bal > 0) totalOutstanding += bal;
  }
  // Add outstanding from advance orders (total - advance = remaining balance)
  for (const o of uninvoicedAdvanceOrders) {
    const advance = (o.advance_paid as number | undefined) ?? 0;
    const bal = (o.total_price as number) - advance;
    if (bal > 0) totalOutstanding += bal;
  }

  const totalExpenses = expensesRes.documents.reduce((s, e) => s + (e.amount as number), 0);
  const netProfit = totalCollected - totalExpenses;

  // ── Receivables per customer ─────────────────────────────────────────
  type RecAcc = { openInvoices: number; totalInvoiced: number; totalPaid: number; balance: number; dueDates: string[] };
  const recMap = new Map<string, RecAcc>();

  for (const inv of allInvoices) {
    if (inv.status === 'paid') continue;
    const paid = invoicePaidMap.get(inv.$id) ?? 0;
    const balance = (inv.amount as number) - paid;
    if (balance <= 0.01) continue;

    const custId = inv.customer_id as string;
    if (!recMap.has(custId)) {
      recMap.set(custId, { openInvoices: 0, totalInvoiced: 0, totalPaid: 0, balance: 0, dueDates: [] });
    }
    const rec = recMap.get(custId)!;
    rec.openInvoices += 1;
    rec.totalInvoiced += inv.amount as number;
    rec.totalPaid += paid;
    rec.balance += balance;
    if (inv.due_date) rec.dueDates.push(inv.due_date as string);
  }

  const receivables: CustomerReceivable[] = [];
  for (const [custId, rec] of recMap) {
    const customer = customerMap.get(custId);
    const oldestDueDate = rec.dueDates.length > 0 ? rec.dueDates.sort()[0] : undefined;
    const oldestDueDateStart = oldestDueDate ? new Date(`${oldestDueDate}T00:00:00`) : null;
    const isOverdue = oldestDueDateStart ? oldestDueDateStart < todayStart : false;
    receivables.push({
      customerId: custId,
      customerName: customer?.name ?? '—',
      phone: customer?.phone,
      openInvoices: rec.openInvoices,
      totalInvoiced: rec.totalInvoiced,
      totalPaid: rec.totalPaid,
      balance: rec.balance,
      oldestDueDate,
      isOverdue,
    });
  }

  // Also add un-invoiced orders with advance (partial payment, balance still owed)
  for (const o of uninvoicedAdvanceOrders) {
    const custId = o.customer_id as string;
    const advance = (o.advance_paid as number | undefined) ?? 0;
    const balance = (o.total_price as number) - advance;
    if (balance <= 0.01) continue;
    const existing = receivables.find(r => r.customerId === custId);
    if (existing) {
      existing.openInvoices += 1;
      existing.totalInvoiced += o.total_price as number;
      existing.totalPaid += advance;
      existing.balance += balance;
    } else {
      const customer = customerMap.get(custId);
      receivables.push({
        customerId: custId,
        customerName: customer?.name ?? '—',
        phone: customer?.phone,
        openInvoices: 1,
        totalInvoiced: o.total_price as number,
        totalPaid: advance,
        balance,
        oldestDueDate: undefined,
        isOverdue: false,
      });
    }
  }
  receivables.sort((a, b) => b.balance - a.balance);

  // ── Overdue invoices ─────────────────────────────────────────────────
  const overdueInvoices: OverdueInvoice[] = [];
  for (const inv of allInvoices) {
    if (!inv.due_date || inv.status === 'paid') continue;
    const dueDate = new Date(`${inv.due_date as string}T00:00:00`);
    if (dueDate >= todayStart) continue;
    const paid = invoicePaidMap.get(inv.$id) ?? 0;
    const balance = (inv.amount as number) - paid;
    if (balance <= 0.01) continue;
    const daysOverdue = Math.floor((todayStart.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const custId = inv.customer_id as string;
    overdueInvoices.push({
      invoiceId: inv.$id,
      invoiceNumber: inv.invoice_number as string,
      customerId: custId,
      customerName: customerMap.get(custId)?.name ?? '—',
      amount: inv.amount as number,
      paid,
      balance,
      dueDate: inv.due_date as string,
      daysOverdue,
    });
  }
  overdueInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue);

  // ── Monthly cash flow (last 12 months) ───────────────────────────────
  const monthlyData = new Map<string, { revenue: number; expenses: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData.set(key, { revenue: 0, expenses: 0 });
  }

  for (const p of paymentsRes.documents) {
    const dateStr = ((p.payment_date || p.$createdAt) as string).substring(0, 10);
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData.has(key)) {
      monthlyData.get(key)!.revenue += p.amount_paid as number;
    }
  }

  // Add paid invoices with no payment records into monthly revenue
  for (const inv of paidInvoicesNoRecord) {
    const dateStr = (inv.$updatedAt as string).substring(0, 10);
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData.has(key)) {
      monthlyData.get(key)!.revenue += inv.amount as number;
    }
  }

  // Add uninvoiced paid orders into monthly revenue (historical)
  for (const o of uninvoicedPaidOrders) {
    const dateStr = (o.$updatedAt as string).substring(0, 10);
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData.has(key)) {
      monthlyData.get(key)!.revenue += o.total_price as number;
    }
  }

  for (const e of expensesRes.documents) {
    const dateStr = ((e.date || e.$createdAt) as string).substring(0, 10);
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData.has(key)) {
      monthlyData.get(key)!.expenses += e.amount as number;
    }
  }

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyFlow: MonthlyFlow[] = [];
  for (const [key, data] of monthlyData) {
    const [yr, mo] = key.split('-').map(Number);
    monthlyFlow.push({
      key,
      label: `${MONTH_NAMES[mo - 1]} ${yr}`,
      revenue: data.revenue,
      expenses: data.expenses,
      net: data.revenue - data.expenses,
    });
  }

  // ── Recent payments (last 15) ─────────────────────────────────────────
  const invoiceNumberMap = new Map<string, string>();
  const invoiceCustomerMap = new Map<string, string>();
  for (const inv of allInvoices) {
    invoiceNumberMap.set(inv.$id, inv.invoice_number as string);
    invoiceCustomerMap.set(inv.$id, inv.customer_id as string);
  }

  // Real payment records
  const fromPaymentRecords: RecentPaymentEntry[] = paymentsRes.documents.map(p => ({
    paymentId: p.$id,
    customerName: customerMap.get(p.customer_id as string)?.name
      ?? customerMap.get(invoiceCustomerMap.get(p.invoice_id as string) ?? '')?.name
      ?? '—',
    invoiceNumber: invoiceNumberMap.get(p.invoice_id as string) ?? '—',
    amountPaid: p.amount_paid as number,
    paymentMethod: p.payment_method as string,
    paymentDate: ((p.payment_date || p.$createdAt) as string).substring(0, 10),
  }));

  // Synthetic entries for paid invoices with no payment records
  const fromPaidNoRecord: RecentPaymentEntry[] = paidInvoicesNoRecord.map(inv => ({
    paymentId: `inv-${inv.$id}`,
    customerName: customerMap.get(inv.customer_id as string)?.name ?? '—',
    invoiceNumber: inv.invoice_number as string,
    amountPaid: inv.amount as number,
    paymentMethod: 'other',
    paymentDate: (inv.$updatedAt as string).substring(0, 10),
  }));

  const recentPayments: RecentPaymentEntry[] = [...fromPaymentRecords, ...fromPaidNoRecord]
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
    .slice(0, 15);

  return {
    summary: { totalInvoiced, totalCollected, totalOutstanding, totalExpenses, netProfit },
    receivables,
    overdueInvoices,
    monthlyFlow,
    recentPayments,
  };
}
