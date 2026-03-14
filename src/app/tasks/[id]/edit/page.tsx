import { getJobTask } from "@/lib/api/jobTasks";
import { getCustomers } from "@/lib/api/customers";
import { JobTaskForm } from "@/components/tasks/JobTaskForm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: Props) {
  const { id } = await params;

  let task;
  try {
    task = await getJobTask(id);
  } catch {
    notFound();
  }

  const customers = await getCustomers();
  return <JobTaskForm initialData={task} customers={customers} />;
}
