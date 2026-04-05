"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContext";
import {
  setJobTaskStatus, deleteJobTask,
  type JobTask, type TaskStatus,
} from "@/lib/api/jobTasks";
import { formatCurrency } from "@/lib/utils/currency";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Edit2, Trash2, ExternalLink } from "lucide-react";
import styles from "./JobTaskTable.module.css";

interface JobTaskTableProps {
  tasks: JobTask[];
}

const PRIORITY_LABEL: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High", urgent: "Urgent",
};
const PRIORITY_CLASS: Record<string, string> = {
  low: "prioLow", medium: "prioMedium", high: "prioHigh", urgent: "prioUrgent",
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do", in_progress: "In Progress", done: "Done",
};
const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress", in_progress: "done", done: "todo",
};

function isOverdue(deadline: string, status: TaskStatus) {
  if (status === "done") return false;
  return new Date(deadline) < new Date(new Date().toDateString());
}

export function JobTaskTable({ tasks: initialTasks }: JobTaskTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<JobTask[]>(initialTasks);
  const [isPending, startTransition] = useTransition();

  const [filterStatus,   setFilterStatus]   = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [search,         setSearch]         = useState("");
  const [deleteId,       setDeleteId]       = useState<string | null>(null);

  // unique assignees for filter dropdown
  const assignees = useMemo(() => {
    const set = new Set(tasks.map(t => t.assigned_to));
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filterStatus   !== "all" && t.status   !== filterStatus)   return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterAssignee !== "all" && t.assigned_to !== filterAssignee) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.customer_name.toLowerCase().includes(q) &&
          !t.task_description.toLowerCase().includes(q) &&
          !t.assigned_to.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [tasks, filterStatus, filterPriority, filterAssignee, search]);

  const handleStatusToggle = async (task: JobTask) => {
    const next = STATUS_NEXT[task.status];
    // optimistic update
    setTasks(prev => prev.map(t => t.$id === task.$id ? { ...t, status: next } : t));
    startTransition(async () => {
      try {
        await setJobTaskStatus(task.$id, next);
        router.refresh();
      } catch {
        // revert
        setTasks(prev => prev.map(t => t.$id === task.$id ? { ...t, status: task.status } : t));
        toast("Failed to update status", "error");
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteJobTask(deleteId);
      setTasks(prev => prev.filter(t => t.$id !== deleteId));
      toast("Task deleted", "success");
      router.refresh();
    } catch {
      toast("Failed to delete task", "error");
    } finally {
      setDeleteId(null);
    }
  };

  // summary counts
  const todoCount       = tasks.filter(t => t.status === "todo").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const overdueCount    = tasks.filter(t => isOverdue(t.deadline, t.status)).length;

  return (
    <div className={styles.wrapper}>

      {/* ── Summary chips ── */}
      <div className={styles.summaryRow}>
        <div className={styles.chip}>
          <span className={styles.chipNum}>{todoCount}</span>
          <span className={styles.chipLabel}>To Do</span>
        </div>
        <div className={styles.chip}>
          <span className={styles.chipNum}>{inProgressCount}</span>
          <span className={styles.chipLabel}>In Progress</span>
        </div>
        {overdueCount > 0 && (
          <div className={`${styles.chip} ${styles.chipOverdue}`}>
            <span className={styles.chipNum}>{overdueCount}</span>
            <span className={styles.chipLabel}>Overdue ⚠</span>
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <div className={styles.filters}>
        <input
          type="text"
          className={styles.search}
          placeholder="Search customer, task, assignee…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select className={styles.filterSelect} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select className={styles.filterSelect} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
          <option value="all">All Assignees</option>
          {assignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          {tasks.length === 0 ? "No tasks yet. Create your first job task." : "No tasks match the filters."}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Task / Print</th>
                <th>Deadline</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Est. Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const overdue = isOverdue(task.deadline, task.status);
                const deadlineDate = new Date(task.deadline).toLocaleDateString("en-NP", {
                  year: "numeric", month: "short", day: "numeric",
                });
                return (
                  <tr key={task.$id} className={overdue ? styles.overdueRow : undefined}>
                    <td>
                      <Link href={`/admin/tasks/${task.$id}`} className={styles.nameLink}>
                        {task.customer_name}
                      </Link>
                      {task.customer_id && (
                        <Link href={`/admin/customers/${task.customer_id}`} className={styles.extLink} title="View customer">
                          <ExternalLink size={11} />
                        </Link>
                      )}
                    </td>
                    <td className={styles.taskCell} title={task.task_description}>
                      {task.task_description.length > 60
                        ? task.task_description.slice(0, 60) + "…"
                        : task.task_description}
                    </td>
                    <td className={overdue ? styles.overdueDate : styles.dateCell}>
                      {deadlineDate}
                      {overdue && <span className={styles.overdueTag}> ⚠ Overdue</span>}
                    </td>
                    <td>{task.assigned_to}</td>
                    <td>
                      <span className={`${styles.prioBadge} ${styles[PRIORITY_CLASS[task.priority]]}`}>
                        {PRIORITY_LABEL[task.priority]}
                      </span>
                    </td>
                    <td className={styles.right}>
                      {task.estimated_price != null ? formatCurrency(task.estimated_price) : "—"}
                    </td>
                    <td>
                      <button
                        className={`${styles.statusBtn} ${styles[`status_${task.status}`]}`}
                        onClick={() => handleStatusToggle(task)}
                        disabled={isPending}
                        title={`Click to advance → ${STATUS_LABEL[STATUS_NEXT[task.status]]}`}
                      >
                        {STATUS_LABEL[task.status]}
                      </button>
                    </td>
                    <td className={styles.actions}>
                      <Link href={`/admin/tasks/${task.$id}/edit`} className={styles.iconBtn} title="Edit">
                        <Edit2 size={14} />
                      </Link>
                      <button
                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                        onClick={() => setDeleteId(task.$id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
