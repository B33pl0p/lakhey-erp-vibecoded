"use client";

import { useState } from "react";
import type { Payment, PaymentMethod } from "@/lib/api/payments";
import { addPayment, deletePayment } from "@/lib/api/payments";
import { useToast } from "@/components/ui/ToastContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency } from "@/lib/utils/currency";
import { PlusCircle, Trash2 } from "lucide-react";
import styles from "./PaymentPanel.module.css";

interface PaymentPanelProps {
  invoiceId: string;
  customerId: string;
  invoiceAmount: number;
  initialPayments: Payment[];
}

const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "bank_transfer", "online", "other"];

const emptyForm = {
  amount_paid: "",
  payment_method: "cash" as PaymentMethod,
  payment_date: new Date().toISOString().split("T")[0],
  notes: "",
};

export function PaymentPanel({ invoiceId, customerId, invoiceAmount, initialPayments }: PaymentPanelProps) {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalPaid = payments.reduce((s, p) => s + p.amount_paid, 0);
  const remaining = Math.max(0, invoiceAmount - totalPaid);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const amt = Number(form.amount_paid);
    if (!form.amount_paid || isNaN(amt) || amt <= 0) errs.amount_paid = "Enter a valid amount";
    if (amt > remaining + 0.01) errs.amount_paid = `Cannot exceed remaining balance (${formatCurrency(remaining)})`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const newPayment = await addPayment({
        invoice_id: invoiceId,
        customer_id: customerId,
        amount_paid: Number(form.amount_paid),
        payment_method: form.payment_method,
        payment_date: form.payment_date || undefined,
        notes: form.notes || undefined,
      });
      setPayments(prev => [newPayment, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      toast("Payment recorded", "success");
    } catch {
      toast("Error recording payment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deletePayment(deletingId, invoiceId);
      setPayments(prev => prev.filter(p => p.$id !== deletingId));
      toast("Payment removed", "success");
    } catch {
      toast("Error removing payment", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.panel}>
      {/* Summary bar */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Invoice Total</span>
          <span className={styles.summaryValue}>{formatCurrency(invoiceAmount)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Paid</span>
          <span className={`${styles.summaryValue} ${styles.paid}`}>{formatCurrency(totalPaid)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Remaining</span>
          <span className={`${styles.summaryValue} ${remaining > 0 ? styles.remaining : styles.zeroed}`}>
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>

      {/* Payments list */}
      {payments.length === 0 ? (
        <p className={styles.empty}>No payments recorded yet.</p>
      ) : (
        <div className={styles.list}>
          {payments.map(p => (
            <div key={p.$id} className={styles.paymentRow}>
              <div className={styles.paymentLeft}>
                <span className={styles.paymentMethod}>
                  {p.payment_method.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                {p.payment_date && (
                  <span className={styles.paymentDate}>
                    {new Date(p.payment_date).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                )}
                {p.notes && <span className={styles.paymentNotes}>{p.notes}</span>}
              </div>
              <div className={styles.paymentRight}>
                <span className={styles.paymentAmount}>{formatCurrency(p.amount_paid)}</span>
                <button
                  className={styles.deleteBtn}
                  onClick={() => setDeletingId(p.$id)}
                  title="Remove payment"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add payment form toggle */}
      {remaining > 0 && !showForm && (
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          <PlusCircle size={16} />
          Add Payment
        </button>
      )}

      {showForm && (
        <form onSubmit={handleAddPayment} className={styles.addForm}>
          <h3>Record Payment</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Amount (Rs) *</label>
              <input
                type="number"
                name="amount_paid"
                className={errors.amount_paid ? styles.inputError : ""}
                value={form.amount_paid}
                onChange={handleChange}
                placeholder={`Max ${formatCurrency(remaining)}`}
                min="0.01"
                step="0.01"
              />
              {errors.amount_paid && <p className={styles.error}>{errors.amount_paid}</p>}
            </div>

            <div className={styles.field}>
              <label>Payment Method</label>
              <select name="payment_method" value={form.payment_method} onChange={handleChange}>
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>
                    {m.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Payment Date</label>
              <input
                type="date"
                name="payment_date"
                value={form.payment_date}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label>Notes</label>
              <input
                type="text"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => { setShowForm(false); setForm(emptyForm); }}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Remove Payment"
        message="Remove this payment record? The invoice balance will be updated."
        onConfirm={() => { void handleDelete(); }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
