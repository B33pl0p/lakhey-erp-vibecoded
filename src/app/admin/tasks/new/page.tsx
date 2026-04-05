import { getCustomers } from "@/lib/api/customers";
import { JobTaskForm } from "@/components/tasks/JobTaskForm";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const customers = await getCustomers();
  return <JobTaskForm customers={customers} />;
}
