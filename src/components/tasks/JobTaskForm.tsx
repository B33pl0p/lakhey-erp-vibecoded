"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContext";
import {
  createJobTask, updateJobTask,
  type JobTask, type TaskPriority, type TaskStatus,
} from "@/lib/api/jobTasks";
import type { Customer } from "@/lib/api/customers";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./JobTaskForm.module.css";

interface JobTaskFormProps {
  initialData?: JobTask;
  customers: Customer[];
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
  { value: "urgent", label: "🔴 Urgent" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo",        label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done" },
];

export function JobTaskForm({ initialData, customers }: JobTaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [customerId,       setCustomerId]       = useState(initialData?.customer_id   || "");
  const [taskDescription,  setTaskDescription]  = useState(initialData?.task_description || "");
  const [deadline,         setDeadline]         = useState(
    initialData?.deadline ? initialData.deadline.slice(0, 10) : ""
  );
  const [assignedTo,       setAssignedTo]       = useState(initialData?.assigned_to   || "");
  const [priority,         setPriority]         = useState<TaskPriority>(
    (initialData?.priority || "medium") as TaskPriority
  );
  const [status,           setStatus]           = useState<TaskStatus>(
    (initialData?.status || "todo") as TaskStatus
  );
  const [notes,            setNotes]            = useState(initialData?.notes || "");
  const [estimatedPrice,   setEstimatedPrice]   = useState(
    initialData?.estimated_price != null ? String(initialData.estimated_price) : ""
  );

  const selectedCustomer = customers.find(c => c.$id === customerId) ?? null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!customerId)             errs.customerId      = "Please select a customer";
    if (!taskDescription.trim()) errs.taskDescription = "Task description is required";
    if (!deadline)               errs.deadline        = "Deadline is required";
    if (!assignedTo.trim())      errs.assignedTo      = "Assigned to is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        customer_name:    selectedCustomer?.name ?? "",
        customer_id:      customerId,
        task_description: taskDescription.trim(),
        deadline,
        assigned_to:      assignedTo.trim(),
        priority,
        status,
        notes:            notes.trim() || undefined,
        estimated_price:  estimatedPrice ? Number(estimatedPrice) : undefined,
      };

      router.refresh();
      if (initialData?.$id) {
        await updateJobTask(initialData.$id, payload);
        toast("Task updated", "success");
        router.push(`/tasks/${initialData.$id}`);
      } else {
        const task = await createJobTask(payload);
        toast("Task created", "success");
        router.push(`/tasks/${task.$id}`);
      }
    } catch (err) {
      console.error(err);
      toast("Error saving task", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Link href="/tasks" className={styles.backBtn}>
          <ArrowLeft size={18} />
        </Link>
        <h1>{initialData ? "Edit Task" : "New Job Task"}</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* ── Customer ── */}
        <div className={styles.field}>
          <label className={styles.label}>Customer *</label>
          <select
            className={`${styles.select} ${errors.customerId ? styles.inputError : ""}`}
            value={customerId}
            onChange={e => { setCustomerId(e.target.value); setErrors(p => ({ ...p, customerId: "" })); }}
          >
            <option value="">Select customer…</option>
            {customers.map(c => (
              <option key={c.$id} value={c.$id}>{c.name}</option>
            ))}
          </select>
          {errors.customerId && <span className={styles.error}>{errors.customerId}</span>}
        </div>

        {/* ── Task description ── */}
        <div className={styles.field}>
          <label className={styles.label}>Task / Print Description *</label>
          <textarea
            rows={3}
            className={`${styles.textarea} ${errors.taskDescription ? styles.inputError : ""}`}
            value={taskDescription}
            onChange={e => { setTaskDescription(e.target.value); setErrors(p => ({ ...p, taskDescription: "" })); }}
            placeholder="e.g. Print 3× bracket in PLA white, 20% infill, 0.2mm layer height"
          />
          {errors.taskDescription && <span className={styles.error}>{errors.taskDescription}</span>}
        </div>

        {/* ── Deadline + Assigned to ── */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Deadline *</label>
            <input
              type="date"
              className={`${styles.input} ${errors.deadline ? styles.inputError : ""}`}
              value={deadline}
              onChange={e => { setDeadline(e.target.value); setErrors(p => ({ ...p, deadline: "" })); }}
            />
            {errors.deadline && <span className={styles.error}>{errors.deadline}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Assigned To *</label>
            <input
              type="text"
              className={`${styles.input} ${errors.assignedTo ? styles.inputError : ""}`}
              value={assignedTo}
              onChange={e => { setAssignedTo(e.target.value); setErrors(p => ({ ...p, assignedTo: "" })); }}
              placeholder="e.g. Suman"
            />
            {errors.assignedTo && <span className={styles.error}>{errors.assignedTo}</span>}
          </div>
        </div>

        {/* ── Priority + Status + Estimated price ── */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Priority</label>
            <select
              className={styles.select}
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
            >
              {PRIORITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select
              className={styles.select}
              value={status}
              onChange={e => setStatus(e.target.value as TaskStatus)}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Estimated Price (Rs)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={styles.input}
              value={estimatedPrice}
              onChange={e => setEstimatedPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* ── Notes ── */}
        <div className={styles.field}>
          <label className={styles.label}>Notes (optional)</label>
          <textarea
            rows={3}
            className={styles.textarea}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any extra instructions, colour, material, special requirements…"
          />
        </div>

        {/* price preview */}
        {estimatedPrice && (
          <p className={styles.pricePreview}>
            Estimated: <strong>{formatCurrency(Number(estimatedPrice))}</strong>
          </p>
        )}

        {/* ── Actions ── */}
        <div className={styles.formActions}>
          <Link href="/tasks" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : initialData ? "Update Task" : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
