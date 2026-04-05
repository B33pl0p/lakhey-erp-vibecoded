"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID, Query } from 'node-appwrite';
import { revalidatePath } from 'next/cache';

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus   = "todo" | "in_progress" | "done";

export interface JobTask {
  $id: string;
  customer_name: string;
  customer_id?: string;       // optional link to customers collection
  task_description: string;
  deadline: string;           // ISO date string (date only)
  assigned_to: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
  estimated_price?: number;
  $createdAt: string;
  $updatedAt: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function getJobTasks(): Promise<JobTask[]> {
  const { databases } = await createAdminClient();
  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.jobTasks,
    [Query.limit(500), Query.orderAsc('deadline')]
  );
  return JSON.parse(JSON.stringify(res.documents)) as JobTask[];
}

export async function getJobTask(id: string): Promise<JobTask> {
  const { databases } = await createAdminClient();
  const doc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.jobTasks,
    id
  );
  return JSON.parse(JSON.stringify(doc)) as JobTask;
}

export async function createJobTask(data: {
  customer_name: string;
  customer_id: string;       // required — always linked to a customer record
  task_description: string;
  deadline: string;
  assigned_to: string;
  priority: TaskPriority;
  status?: TaskStatus;
  notes?: string;
  estimated_price?: number;
}): Promise<JobTask> {
  const { databases } = await createAdminClient();

  const payload: Record<string, unknown> = {
    customer_name: data.customer_name,
    customer_id: data.customer_id,
    task_description: data.task_description,
    deadline: data.deadline,
    assigned_to: data.assigned_to,
    priority: data.priority,
    status: data.status ?? "todo",
  };
  if (data.notes)            payload.notes           = data.notes;
  if (data.estimated_price != null) payload.estimated_price = Number(data.estimated_price);

  const doc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.jobTasks,
    ID.unique(),
    payload
  );
  revalidatePath('/admin/tasks');
  return JSON.parse(JSON.stringify(doc)) as JobTask;
}

export async function updateJobTask(id: string, data: Partial<{
  customer_name: string;
  customer_id: string;
  task_description: string;
  deadline: string;
  assigned_to: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string;
  estimated_price: number;
}>): Promise<JobTask> {
  const { databases } = await createAdminClient();

  const payload: Record<string, unknown> = {};
  if (data.customer_name     !== undefined) payload.customer_name     = data.customer_name;
  if (data.customer_id       !== undefined) payload.customer_id       = data.customer_id;
  if (data.task_description  !== undefined) payload.task_description  = data.task_description;
  if (data.deadline          !== undefined) payload.deadline          = data.deadline;
  if (data.assigned_to       !== undefined) payload.assigned_to       = data.assigned_to;
  if (data.priority          !== undefined) payload.priority          = data.priority;
  if (data.status            !== undefined) payload.status            = data.status;
  if (data.notes             !== undefined) payload.notes             = data.notes || '';
  if (data.estimated_price   !== undefined) payload.estimated_price   = data.estimated_price != null ? Number(data.estimated_price) : null;

  const doc = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.jobTasks,
    id,
    payload
  );
  revalidatePath('/admin/tasks');
  revalidatePath(`/admin/tasks/${id}`);
  return JSON.parse(JSON.stringify(doc)) as JobTask;
}

export async function deleteJobTask(id: string): Promise<void> {
  const { databases } = await createAdminClient();
  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.jobTasks,
    id
  );
  revalidatePath('/admin/tasks');
}

// ── Quick status update (used by inline toggle) ────────────────────────────

export async function setJobTaskStatus(id: string, status: TaskStatus): Promise<void> {
  await updateJobTask(id, { status });
}
