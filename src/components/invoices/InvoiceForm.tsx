"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContext";
import { createInvoice, updateInvoice, type Invoice, type InvoiceStatus } from "@/lib/api/invoices";
import type { Order } from "@/lib/api/orders";
import type { Customer } from "@/lib/api/customers";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import styles from "./InvoiceForm.module.css";

interface InvoiceFormProps {
  initialData?: Invoice;          // provided when editing
  orders: Order[];
  customers: Customer[];
  preselectedOrderId?: string;    // from ?order_id= query param
}

const STATUS_OPTIONS: InvoiceStatus[] = ["draft", "sent", "paid", "partially_paid"];

export function InvoiceForm({ initialData, orders, customers, preselectedOrderId }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    order_id: initialData?.order_id || preselectedOrderId || "",
    customer_id: initialData?.customer_id || "",
    amount: initialData?.amount?.toString() || "",
    status: (initialData?.status || "draft") as InvoiceStatus,
    due_date: initialData?.due_date
      ? new Date(initialData.due_date).toISOString().split("T")[0]
      : "",
    notes: initialData?.notes || "",
  });

  // When order changes, auto-fill customer + amount
  const handleOrderChange = (orderId: string) => {
    const order = orders.find(o => o.$id === orderId);
    setFormData(prev => ({
      ...prev,
      order_id: orderId,
      customer_id: order?.customer_id || prev.customer_id,
      amount: order ? order.total_price.toString() : prev.amount,
    }));
    if (errors.order_id) setErrors(prev => ({ ...prev, order_id: "" }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.order_id) errs.order_id = "Please select an order";
    if (!formData.customer_id) errs.customer_id = "Customer is required";
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0)
      errs.amount = "Enter a valid amount";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      if (initialData?.$id) {
        await updateInvoice(initialData.$id, {
          status: formData.status,
          due_date: formData.due_date || undefined,
          notes: formData.notes || undefined,
          amount: Number(formData.amount),
        });
        toast("Invoice updated", "success");
        router.push(`/invoices/${initialData.$id}`);
      } else {
        const inv = await createInvoice({
          order_id: formData.order_id,
          customer_id: formData.customer_id,
          amount: Number(formData.amount),
          status: formData.status,
          due_date: formData.due_date || undefined,
          notes: formData.notes || undefined,
        });
        toast("Invoice created", "success");
        router.push(`/invoices/${inv.$id}`);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      toast("Error saving invoice", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCustomer = customers.find(c => c.$id === formData.customer_id);
  const isEditing = !!initialData;

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Link href="/invoices" className={styles.backBtn}>
          <ArrowLeft size={18} />
        </Link>
        <h1>{isEditing ? `Edit ${initialData.invoice_number}` : "New Invoice"}</h1>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Order */}
        <div className={styles.field}>
          <label className={styles.label}>Order *</label>
          {isEditing ? (
            <div className={styles.readonlyField}>
              {orders.find(o => o.$id === formData.order_id)?.title || formData.order_id}
            </div>
          ) : (
            <select
              name="order_id"
              className={`${styles.select} ${errors.order_id ? styles.inputError : ""}`}
              value={formData.order_id}
              onChange={e => handleOrderChange(e.target.value)}
            >
              <option value="">— Select an order —</option>
              {orders.map(o => (
                <option key={o.$id} value={o.$id}>
                  {o.title} ({customers.find(c => c.$id === o.customer_id)?.name || "?"})
                </option>
              ))}
            </select>
          )}
          {errors.order_id && <p className={styles.error}>{errors.order_id}</p>}
        </div>

        {/* Customer (auto-filled) */}
        <div className={styles.field}>
          <label className={styles.label}>Customer</label>
          <div className={styles.readonlyField}>
            {selectedCustomer
              ? `${selectedCustomer.name}${selectedCustomer.email ? " · " + selectedCustomer.email : ""}`
              : formData.customer_id
              ? formData.customer_id
              : <span style={{ opacity: 0.5 }}>Auto-filled from order</span>}
          </div>
          {errors.customer_id && <p className={styles.error}>{errors.customer_id}</p>}
        </div>

        {/* Amount */}
        <div className={styles.field}>
          <label className={styles.label}>Amount (Rs) *</label>
          <input
            type="number"
            name="amount"
            className={`${styles.input} ${errors.amount ? styles.inputError : ""}`}
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          {errors.amount && <p className={styles.error}>{errors.amount}</p>}
        </div>

        {/* Status */}
        <div className={styles.field}>
          <label className={styles.label}>Status</label>
          <select name="status" className={styles.select} value={formData.status} onChange={handleChange}>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div className={styles.field}>
          <label className={styles.label}>Due Date</label>
          <input
            type="date"
            name="due_date"
            className={styles.input}
            value={formData.due_date}
            onChange={handleChange}
          />
        </div>

        {/* Notes */}
        <div className={styles.field}>
          <label className={styles.label}>Notes</label>
          <textarea
            name="notes"
            className={styles.textarea}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Payment terms, special instructions..."
            rows={3}
          />
        </div>

        <div className={styles.formActions}>
          <Link href="/invoices" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
