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
  confirmedOrderBacklog: number;
  quotationPipeline: number;
  projectedCashPosition: number;
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
  key: string;
  label: string;
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

function num(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDocDate(value: unknown, fallback: unknown) {
  return String(value || fallback || new Date().toISOString()).substring(0, 10);
}

export async function getFinanceData(): Promise<FinanceData> {
  const { databases } = await createAdminClient();
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const [customersRes, invoicesRes, paymentsRes, expensesRes, ordersRes, quotationsRes] = await Promise.all([
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
    databases.listDocuments(
      appwriteConfig.databaseId, appwriteConfig.collections.quotations,
      [Query.limit(1000), Query.orderDesc('$createdAt')]
    ),
  ]);

  const customerMap = new Map<string, { name: string; phone?: string }>();
  for (const c of customersRes.documents) {
    customerMap.set(c.$id, { name: String(c.name || '—'), phone: c.phone as string | undefined });
  }

  const invoicedOrderIds = new Set<string>();
  for (const inv of invoicesRes.documents) {
    if (inv.order_id) invoicedOrderIds.add(inv.order_id as string);
  }

  const invoicePaidMap = new Map<string, number>();
  for (const p of paymentsRes.documents) {
    const invId = p.invoice_id as string;
    invoicePaidMap.set(invId, (invoicePaidMap.get(invId) ?? 0) + num(p.amount_paid));
  }

  const allInvoices = invoicesRes.documents;
  const activeOrders = ordersRes.documents.filter(o => o.status !== 'cancelled');
  const unpaidActiveOrders = activeOrders.filter(o => o.status !== 'paid');
  const uninvoicedPaidOrders = ordersRes.documents.filter(
    o => o.status === 'paid' && !invoicedOrderIds.has(o.$id)
  );
  const uninvoicedOpenOrders = ordersRes.documents.filter(
    o => o.status !== 'paid' && o.status !== 'cancelled' && !invoicedOrderIds.has(o.$id)
  );

  const paidInvoicesNoRecord = allInvoices.filter(
    inv => inv.status === 'paid' && !invoicePaidMap.has(inv.$id)
  );
  const paidNoRecordAmount = paidInvoicesNoRecord.reduce((s, inv) => s + num(inv.amount), 0);

  const totalInvoiced = allInvoices.reduce((s, inv) => s + num(inv.amount), 0)
    + uninvoicedPaidOrders.reduce((s, o) => s + num(o.total_price), 0);

  const invoiceCollected = paymentsRes.documents.reduce((s, p) => s + num(p.amount_paid), 0)
    + paidNoRecordAmount;
  const orderCollected = uninvoicedPaidOrders.reduce((s, o) => s + num(o.total_price), 0)
    + uninvoicedOpenOrders.reduce((s, o) => s + num(o.advance_paid), 0);
  const totalCollected = invoiceCollected + orderCollected;

  let totalOutstanding = 0;
  for (const inv of allInvoices) {
    if (inv.status === 'paid') continue;
    const bal = num(inv.amount) - (invoicePaidMap.get(inv.$id) ?? 0);
    if (bal > 0.01) totalOutstanding += bal;
  }
  for (const o of uninvoicedOpenOrders) {
    const bal = num(o.total_price) - num(o.advance_paid);
    if (bal > 0.01) totalOutstanding += bal;
  }

  const totalExpenses = expensesRes.documents.reduce((s, e) => s + num(e.amount), 0);
  const netProfit = totalCollected - totalExpenses;
  const confirmedOrderBacklog = unpaidActiveOrders.reduce((s, o) => s + num(o.total_price), 0);
  const quotationPipeline = quotationsRes.documents
    .filter(q => q.status === 'draft' || q.status === 'sent')
    .reduce((s, q) => s + num(q.grand_total), 0);
  const projectedCashPosition = totalCollected + totalOutstanding - totalExpenses;

  type RecAcc = { openInvoices: number; totalInvoiced: number; totalPaid: number; balance: number; dueDates: string[] };
  const recMap = new Map<string, RecAcc>();

  function addReceivable(custId: string, amount: number, paid: number, balance: number, dueDate?: string) {
    if (balance <= 0.01) return;
    if (!recMap.has(custId)) {
      recMap.set(custId, { openInvoices: 0, totalInvoiced: 0, totalPaid: 0, balance: 0, dueDates: [] });
    }
    const rec = recMap.get(custId)!;
    rec.openInvoices += 1;
    rec.totalInvoiced += amount;
    rec.totalPaid += paid;
    rec.balance += balance;
    if (dueDate) rec.dueDates.push(dueDate);
  }

  for (const inv of allInvoices) {
    if (inv.status === 'paid') continue;
    const paid = invoicePaidMap.get(inv.$id) ?? 0;
    const amount = num(inv.amount);
    addReceivable(inv.customer_id as string, amount, paid, amount - paid, inv.due_date as string | undefined);
  }

  for (const o of uninvoicedOpenOrders) {
    const advance = num(o.advance_paid);
    const amount = num(o.total_price);
    addReceivable(o.customer_id as string, amount, advance, amount - advance);
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
  receivables.sort((a, b) => b.balance - a.balance);

  const overdueInvoices: OverdueInvoice[] = [];
  for (const inv of allInvoices) {
    if (!inv.due_date || inv.status === 'paid') continue;
    const dueDate = new Date(`${inv.due_date as string}T00:00:00`);
    if (dueDate >= todayStart) continue;
    const paid = invoicePaidMap.get(inv.$id) ?? 0;
    const amount = num(inv.amount);
    const balance = amount - paid;
    if (balance <= 0.01) continue;
    const daysOverdue = Math.floor((todayStart.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const custId = inv.customer_id as string;
    overdueInvoices.push({
      invoiceId: inv.$id,
      invoiceNumber: inv.invoice_number as string,
      customerId: custId,
      customerName: customerMap.get(custId)?.name ?? '—',
      amount,
      paid,
      balance,
      dueDate: inv.due_date as string,
      daysOverdue,
    });
  }
  overdueInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue);

  const monthlyData = new Map<string, { revenue: number; expenses: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData.set(key, { revenue: 0, expenses: 0 });
  }

  function addMonthlyRevenue(dateStr: string, amount: number) {
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData.has(key)) monthlyData.get(key)!.revenue += amount;
  }

  for (const p of paymentsRes.documents) addMonthlyRevenue(getDocDate(p.payment_date, p.$createdAt), num(p.amount_paid));
  for (const inv of paidInvoicesNoRecord) addMonthlyRevenue(getDocDate(inv.$updatedAt, inv.$createdAt), num(inv.amount));
  for (const o of uninvoicedPaidOrders) addMonthlyRevenue(getDocDate(o.$updatedAt, o.$createdAt), num(o.total_price));
  for (const o of uninvoicedOpenOrders) {
    const advance = num(o.advance_paid);
    if (advance > 0) addMonthlyRevenue(getDocDate(o.$updatedAt, o.$createdAt), advance);
  }

  for (const e of expensesRes.documents) {
    const d = new Date(getDocDate(e.date, e.$createdAt));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData.has(key)) monthlyData.get(key)!.expenses += num(e.amount);
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

  const invoiceNumberMap = new Map<string, string>();
  const invoiceCustomerMap = new Map<string, string>();
  for (const inv of allInvoices) {
    invoiceNumberMap.set(inv.$id, inv.invoice_number as string);
    invoiceCustomerMap.set(inv.$id, inv.customer_id as string);
  }

  const fromPaymentRecords: RecentPaymentEntry[] = paymentsRes.documents.map(p => ({
    paymentId: p.$id,
    customerName: customerMap.get(p.customer_id as string)?.name
      ?? customerMap.get(invoiceCustomerMap.get(p.invoice_id as string) ?? '')?.name
      ?? '—',
    invoiceNumber: invoiceNumberMap.get(p.invoice_id as string) ?? '—',
    amountPaid: num(p.amount_paid),
    paymentMethod: p.payment_method as string,
    paymentDate: getDocDate(p.payment_date, p.$createdAt),
  }));

  const fromPaidNoRecord: RecentPaymentEntry[] = paidInvoicesNoRecord.map(inv => ({
    paymentId: `inv-${inv.$id}`,
    customerName: customerMap.get(inv.customer_id as string)?.name ?? '—',
    invoiceNumber: inv.invoice_number as string,
    amountPaid: num(inv.amount),
    paymentMethod: 'other',
    paymentDate: getDocDate(inv.$updatedAt, inv.$createdAt),
  }));

  const fromAdvanceOrders: RecentPaymentEntry[] = uninvoicedOpenOrders
    .filter(o => num(o.advance_paid) > 0)
    .map(o => ({
      paymentId: `order-advance-${o.$id}`,
      customerName: customerMap.get(o.customer_id as string)?.name ?? '—',
      invoiceNumber: `Order ${String(o.$id).slice(0, 8)}`,
      amountPaid: num(o.advance_paid),
      paymentMethod: 'cash',
      paymentDate: getDocDate(o.$updatedAt, o.$createdAt),
    }));

  const recentPayments: RecentPaymentEntry[] = [...fromPaymentRecords, ...fromPaidNoRecord, ...fromAdvanceOrders]
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
    .slice(0, 15);

  return {
    summary: {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalExpenses,
      netProfit,
      confirmedOrderBacklog,
      quotationPipeline,
      projectedCashPosition,
    },
    receivables,
    overdueInvoices,
    monthlyFlow,
    recentPayments,
  };
}
