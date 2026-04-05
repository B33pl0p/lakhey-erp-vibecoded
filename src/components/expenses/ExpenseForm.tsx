"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContext";
import { createExpense, updateExpense, type Expense } from "@/lib/api/expenses";
import { updateInventoryItem, type InventoryItem } from "@/lib/api/inventory";
import { uploadFile, deleteFile, getFilePreviewUrl } from "@/lib/api/storage";
import Link from "next/link";
import { ArrowLeft, Save, Upload, X, Receipt, Package, RefreshCw } from "lucide-react";
import styles from "./ExpenseForm.module.css";

interface ExpenseFormProps {
  initialData?: Expense;
  inventoryItems?: InventoryItem[];
}

export function ExpenseForm({ initialData, inventoryItems = [] }: ExpenseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().substring(0, 10);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    amount: initialData?.amount?.toString() || "",
    category: initialData?.category || "other",
    date: initialData?.date?.substring(0, 10) || today,
    vendor: initialData?.vendor || "",
    notes: initialData?.notes || "",
    payment_method: initialData?.payment_method || "cash",
  });

  // Inventory sync state (only for raw_materials)
  const [syncToInventory, setSyncToInventory] = useState(false);
  const [syncItemId, setSyncItemId] = useState("");
  const [syncQty, setSyncQty] = useState("");

  const computedUnitCost =
    syncItemId && syncQty && Number(syncQty) > 0 && Number(formData.amount) > 0
      ? Number(formData.amount) / Number(syncQty)
      : null;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [existingReceiptId, setExistingReceiptId] = useState<string | null>(
    initialData?.receipt_id || null
  );

  // Load existing receipt preview
  useEffect(() => {
    if (initialData?.receipt_id) {
      getFilePreviewUrl(initialData.receipt_id, 200, 200).then(url => {
        setReceiptPreviewUrl(url);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast("File too large — maximum size is 10 MB", "error");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      setReceiptPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveReceipt = async () => {
    if (existingReceiptId) {
      await deleteFile(existingReceiptId).catch(() => null);
      setExistingReceiptId(null);
    }
    setSelectedFile(null);
    setReceiptPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) {
      toast("Title and amount are required", "error");
      return;
    }
    setIsSubmitting(true);

    let receiptId = existingReceiptId;

    try {
      if (selectedFile) {
        toast("Uploading receipt...", "info");
        const fd = new FormData();
        fd.append("file", selectedFile);
        receiptId = await uploadFile(fd);
        // Delete old receipt if replaced
        if (initialData?.receipt_id && initialData.receipt_id !== receiptId) {
          await deleteFile(initialData.receipt_id).catch(() => null);
        }
      }

      const payload = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        category: formData.category as Expense["category"],
        date: formData.date,
        vendor: formData.vendor.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        payment_method: formData.payment_method as Expense["payment_method"],
        receipt_id: receiptId || undefined,
      };

      if (initialData) {
        await updateExpense(initialData.$id, payload);
        toast("Expense updated", "success");
      } else {
        await createExpense(payload);
        toast("Expense recorded", "success");
      }

      // Sync unit_cost to inventory if opted in
      if (syncToInventory && syncItemId && computedUnitCost !== null) {
        try {
          await updateInventoryItem(syncItemId, { unit_cost: computedUnitCost });
          toast("Inventory price updated", "success");
        } catch {
          toast("Expense saved, but inventory price update failed", "warning");
        }
      }

      router.refresh();
      router.push("/admin/expenses");
    } catch (err) {
      console.error(err);
      toast("Failed to save expense", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/admin/expenses" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={styles.title}>
              {initialData ? "Edit Expense" : "New Expense"}
            </h1>
            <p className={styles.subtitle}>
              {initialData ? "Update expense details" : "Record a business expense"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Core details */}
        <div className={styles.section}>
          <h2><Receipt size={16} /> Expense Details</h2>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Title <span className={styles.required}>*</span></label>
              <input
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Monthly electricity bill"
                required
              />
            </div>
            <div className={styles.field}>
              <label>Amount (Rs) <span className={styles.required}>*</span></label>
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className={styles.grid3}>
            <div className={styles.field}>
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="utilities">Utilities</option>
                <option value="equipment">Equipment</option>
                <option value="raw_materials">Raw Materials</option>
                <option value="rent">Rent / Overhead</option>
                <option value="software">Software / Subscriptions</option>
                <option value="shipping">Shipping / Delivery</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Date</label>
              <input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label>Payment Method</label>
              <select name="payment_method" value={formData.payment_method} onChange={handleChange}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label>Vendor / Payee</label>
            <input
              name="vendor"
              type="text"
              value={formData.vendor}
              onChange={handleChange}
              placeholder="e.g. NEA, Daraz, Supplier name..."
            />
          </div>

          <div className={styles.field}>
            <label>Notes</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional details..."
            />
          </div>
        </div>

        {/* Inventory sync — only for raw_materials */}
        {formData.category === "raw_materials" && inventoryItems.length > 0 && (
          <div className={styles.section}>
            <h2><Package size={16} /> Update Inventory Price</h2>
            <div className={styles.syncToggleRow}>
              <label className={styles.syncToggleLabel}>
                <input
                  type="checkbox"
                  checked={syncToInventory}
                  onChange={e => setSyncToInventory(e.target.checked)}
                />
                Sync unit cost to an inventory item after saving
              </label>
            </div>
            {syncToInventory && (
              <div className={styles.syncFields}>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label>Inventory Item</label>
                    <select value={syncItemId} onChange={e => setSyncItemId(e.target.value)}>
                      <option value="">— Select item —</option>
                      {inventoryItems.map(item => (
                        <option key={item.$id} value={item.$id}>
                          {item.name} (current: Rs {item.unit_cost}/{item.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Quantity Purchased ({inventoryItems.find(i => i.$id === syncItemId)?.unit ?? "units"})</label>
                    <input
                      type="number"
                      min="0.001"
                      step="any"
                      value={syncQty}
                      onChange={e => setSyncQty(e.target.value)}
                      placeholder="e.g. 1000"
                    />
                  </div>
                </div>
                {computedUnitCost !== null && (
                  <div className={styles.computedCostBox}>
                    <RefreshCw size={14} />
                    New unit cost will be set to&nbsp;
                    <strong>Rs {computedUnitCost.toFixed(4)}</strong> per&nbsp;
                    {inventoryItems.find(i => i.$id === syncItemId)?.unit ?? "unit"}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Receipt upload */}
        <div className={styles.section}>
          <h2><Upload size={16} /> Receipt / Attachment</h2>
          {receiptPreviewUrl ? (
            <div className={styles.receiptPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={receiptPreviewUrl} alt="Receipt" className={styles.receiptImg} />
              <button
                type="button"
                className={styles.removeReceiptBtn}
                onClick={handleRemoveReceipt}
              >
                <X size={14} /> Remove
              </button>
            </div>
          ) : (
            <div className={styles.uploadArea}>
              <label htmlFor="receipt-upload" className={styles.uploadLabel}>
                <Upload size={20} />
                <span>Click to upload receipt / invoice image</span>
                <span className={styles.uploadHint}>PNG, JPG, PDF supported</span>
              </label>
              <input
                id="receipt-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <div className={styles.actions}>
          <Link href="/admin/expenses" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            <Save size={16} />
            {isSubmitting ? "Saving..." : initialData ? "Update Expense" : "Save Expense"}
          </button>
        </div>
      </form>
    </div>
  );
}
