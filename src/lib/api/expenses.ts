"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';

export type ExpenseCategory =
  | "utilities"
  | "equipment"
  | "raw_materials"
  | "rent"
  | "software"
  | "shipping"
  | "other";

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "online" | "other";

export interface Expense {
  $id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  vendor?: string;
  notes?: string;
  payment_method?: PaymentMethod;
  receipt_id?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  byCategory: Record<string, number>;
  byMonth: { month: string; total: number }[];
}

export async function getExpenses(): Promise<Expense[]> {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.expenses,
    [Query.limit(1000), Query.orderDesc('date')]
  );
  return JSON.parse(JSON.stringify(response.documents)) as Expense[];
}

export async function getExpense(id: string): Promise<Expense> {
  const { databases } = await createAdminClient();
  const response = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.expenses,
    id
  );
  return JSON.parse(JSON.stringify(response)) as Expense;
}

export async function createExpense(data: Omit<Expense, '$id' | '$createdAt' | '$updatedAt'>) {
  const { databases } = await createAdminClient();
  const payload = {
    ...data,
    amount: Number(data.amount),
  };
  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.expenses,
    ID.unique(),
    payload
  );
  revalidatePath('/admin/expenses');
}

export async function updateExpense(id: string, data: Partial<Omit<Expense, '$id' | '$createdAt' | '$updatedAt'>>) {
  const { databases } = await createAdminClient();
  const payload = {
    ...data,
    ...(data.amount !== undefined ? { amount: Number(data.amount) } : {}),
  };
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.expenses,
    id,
    payload
  );
  revalidatePath('/admin/expenses');
  revalidatePath(`/admin/expenses/${id}`);
}

export async function deleteExpense(id: string) {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.expenses,
    id
  );
  revalidatePath('/admin/expenses');
}

export async function getExpenseSummary(): Promise<ExpenseSummary> {
  const expenses = await getExpenses();

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  // Aggregate by month (YYYY-MM)
  const monthMap: Record<string, number> = {};
  for (const e of expenses) {
    const month = e.date?.substring(0, 7) ?? e.$createdAt.substring(0, 7);
    monthMap[month] = (monthMap[month] || 0) + e.amount;
  }
  const byMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  return { totalExpenses, byCategory, byMonth };
}

export async function getTotalExpenses(): Promise<number> {
  const expenses = await getExpenses();
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}
