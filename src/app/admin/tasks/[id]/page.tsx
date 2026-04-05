import { getJobTask } from "@/lib/api/jobTasks";
import { getCustomer } from "@/lib/api/customers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./page.module.css";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

const PRIORITY_LABEL: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High", urgent: "Urgent",
};
const PRIORITY_CLASS: Record<string, string> = {
  low: "prioLow", medium: "prioMedium", high: "prioHigh", urgent: "prioUrgent",
};
const STATUS_LABEL: Record<string, string> = {
  todo: "To Do", in_progress: "In Progress", done: "Done",
};
const STATUS_CLASS: Record<string, string> = {
  todo: "statusTodo", in_progress: "statusInProgress", done: "statusDone",
};

function isOverdue(deadline: string, status: string) {
  if (status === "done") return false;
  return new Date(deadline) < new Date(new Date().toDateString());
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;

  let task;
  try {
    task = await getJobTask(id);
  } catch {
    notFound();
  }

  const customer = task.customer_id
    ? await getCustomer(task.customer_id).catch(() => null)
    : null;

  const deadlineDate = new Date(task.deadline).toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });
  const createdAt = new Date(task.$createdAt).toLocaleDateString("en-NP", {
    year: "numeric", month: "short", day: "numeric",
  });
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/admin/tasks" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className={styles.titleRow}>
              <h1>{task.customer_name}</h1>
              <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[task.status]]}`}>
                {STATUS_LABEL[task.status]}
              </span>
              <span className={`${styles.prioBadge} ${styles[PRIORITY_CLASS[task.priority]]}`}>
                {PRIORITY_LABEL[task.priority]}
              </span>
            </div>
            <p className={styles.subtitle}>Created {createdAt}</p>
          </div>
        </div>
        <Link href={`/admin/tasks/${id}/edit`} className={styles.editBtn}>
          <Edit2 size={15} />
          Edit
        </Link>
      </header>

      <div className={styles.grid}>
        {/* Main info */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Task Details</h2>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Assigned To</span>
            <span className={styles.statValue}>{task.assigned_to}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Deadline</span>
            <span className={`${styles.statValue} ${overdue ? styles.red : ""}`}>
              {deadlineDate}{overdue ? " ⚠ Overdue" : ""}
            </span>
          </div>
          {task.estimated_price != null && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Estimated Price</span>
              <span className={styles.statValue}>{formatCurrency(task.estimated_price)}</span>
            </div>
          )}
        </div>

        {/* Customer */}
        {customer && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Customer</h2>
            <Link href={`/admin/customers/${customer.$id}`} className={styles.customerLink}>
              {customer.name}
            </Link>
            {customer.phone && <p className={styles.muted}>{customer.phone}</p>}
            {customer.email && <p className={styles.muted}>{customer.email}</p>}
          </div>
        )}
      </div>

      {/* Task description */}
      <div className={styles.descCard}>
        <h2 className={styles.cardTitle}>Task / Print Description</h2>
        <p className={styles.descText}>{task.task_description}</p>
      </div>

      {/* Notes */}
      {task.notes && (
        <div className={styles.descCard}>
          <h2 className={styles.cardTitle}>Notes</h2>
          <p className={styles.descText}>{task.notes}</p>
        </div>
      )}
    </div>
  );
}
