"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContext";
import {
  createQuotation, updateQuotation,
  type Quote, type QuoteStatus, type QuoteLineItem,
} from "@/lib/api/quotations";
import type { Customer } from "@/lib/api/customers";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./QuoteForm.module.css";

interface QuoteFormProps {
  initialData?: Quote;
  customers: Customer[];
  vatRate: number;
  vatEnabled: boolean;
}

const STATUS_OPTIONS: QuoteStatus[] = ["draft", "sent", "accepted", "rejected", "expired"];

const emptyItem = (): QuoteLineItem => ({ description: "", qty: 1, unit_price: 0 });

export function QuoteForm({ initialData, customers, vatRate, vatEnabled }: QuoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [customerId, setCustomerId] = useState(initialData?.customer_id || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [status, setStatus] = useState<QuoteStatus>((initialData?.status || "draft") as QuoteStatus);
  const [validUntil, setValidUntil] = useState(
    initialData?.valid_until ? initialData.valid_until.slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [includeVat, setIncludeVat] = useState<boolean>(
    initialData?.include_vat !== undefined ? initialData.include_vat : vatEnabled
  );
  const [items, setItems] = useState<QuoteLineItem[]>(
    initialData?.line_items
      ? JSON.parse(initialData.line_items)
      : [emptyItem()]
  );

  // ── Line item helpers ─────────────────────────────────────────────────────

  const updateItem = (idx: number, field: keyof QuoteLineItem, value: string | number) => {
    setItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, [field]: field === "description" ? value : Number(value) } : it
    ));
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (idx: number) => {
    if (items.length === 1) return; // keep at least one row
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Derived totals ────────────────────────────────────────────────────────

  const subtotal = items.reduce((s, it) => s + it.qty * it.unit_price, 0);
  const vatAmount = includeVat ? (subtotal * vatRate) / 100 : 0;
  const grandTotal = subtotal + vatAmount;

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customerId = "Please select a customer";
    if (!title.trim()) errs.title = "Title is required";
    if (items.every(it => !it.description.trim())) errs.items = "Add at least one line item";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        customer_id: customerId,
        title: title.trim(),
        line_items: items.filter(it => it.description.trim()),
        subtotal,
        vat_amount: vatAmount,
        grand_total: grandTotal,
        notes: notes.trim() || undefined,
        valid_until: validUntil || undefined,
        status,
        include_vat: includeVat,
      };

      router.refresh();
      if (initialData?.$id) {
        await updateQuotation(initialData.$id, payload);
        toast("Quotation updated", "success");
        router.push(`/admin/quotations/${initialData.$id}`);
      } else {
        const quote = await createQuotation(payload);
        toast("Quotation created", "success");
        router.push(`/admin/quotations/${quote.$id}`);
      }
    } catch (err) {
      console.error(err);
      toast("Error saving quotation", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Link href="/admin/quotations" className={styles.backBtn}>
          <ArrowLeft size={18} />
        </Link>
        <h1>{initialData ? "Edit Quotation" : "New Quotation"}</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* ── Basic info ── */}
        <div className={styles.row}>
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

          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select
              className={styles.select}
              value={status}
              onChange={e => setStatus(e.target.value as QuoteStatus)}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Title / Brief Description *</label>
          <input
            type="text"
            className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
            value={title}
            onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: "" })); }}
            placeholder="e.g. Custom bracket set for XYZ machine"
          />
          {errors.title && <span className={styles.error}>{errors.title}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Valid Until</label>
          <input
            type="date"
            className={styles.input}
            value={validUntil}
            onChange={e => setValidUntil(e.target.value)}
          />
        </div>

        {/* ── Line items ── */}
        <div className={styles.field}>
          <div className={styles.lineItemsHeader}>
            <label className={styles.label}>Line Items *</label>
            <button type="button" className={styles.addItemBtn} onClick={addItem}>
              <Plus size={14} /> Add Item
            </button>
          </div>
          {errors.items && <span className={styles.error}>{errors.items}</span>}

          <div className={styles.lineItemsTable}>
            <div className={styles.lineItemRow + " " + styles.lineItemHead}>
              <span className={styles.colDesc}>Description</span>
              <span className={styles.colQty}>Qty</span>
              <span className={styles.colPrice}>Unit Price (Rs)</span>
              <span className={styles.colTotal}>Total</span>
              <span className={styles.colDel} />
            </div>

            {items.map((item, idx) => (
              <div key={idx} className={styles.lineItemRow}>
                <input
                  type="text"
                  className={`${styles.input} ${styles.colDesc}`}
                  placeholder="Item description"
                  value={item.description}
                  onChange={e => updateItem(idx, "description", e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  className={`${styles.input} ${styles.colQty}`}
                  value={item.qty}
                  onChange={e => updateItem(idx, "qty", e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${styles.input} ${styles.colPrice}`}
                  value={item.unit_price}
                  onChange={e => updateItem(idx, "unit_price", e.target.value)}
                />
                <span className={styles.colTotal}>
                  {formatCurrency(item.qty * item.unit_price)}
                </span>
                <button
                  type="button"
                  className={styles.removeItemBtn}
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Totals summary ── */}
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className={styles.vatToggleRow}>
            <label className={styles.vatToggleLabel}>
              <input
                type="checkbox"
                checked={includeVat}
                onChange={e => setIncludeVat(e.target.checked)}
                className={styles.vatToggleCheckbox}
              />
              Include VAT ({vatRate}%)
            </label>
            {includeVat && (
              <span>{formatCurrency(vatAmount)}</span>
            )}
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>Grand Total</span>
            <span>{formatCurrency(grandTotal)}</span>
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
            placeholder="Validity conditions, delivery notes, payment terms…"
          />
        </div>

        {/* ── Actions ── */}
        <div className={styles.formActions}>
          <Link href="/admin/quotations" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : initialData ? "Update Quotation" : "Create Quotation"}
          </button>
        </div>
      </form>
    </div>
  );
}
