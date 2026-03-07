"use client";

import { useState } from "react";
import type { Invoice, InvoiceStatus } from "@/lib/api/invoices";
import { deleteInvoice } from "@/lib/api/invoices";
import { useToast } from "@/components/ui/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Edit2, Trash2, Search, Eye } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./InvoiceTable.module.css";

interface InvoiceTableProps {
  initialInvoices: Invoice[];
  customerMap: Record<string, string>;
  orderMap: Record<string, string>;
}

const STATUS_OPTIONS: InvoiceStatus[] = ["draft", "sent", "paid", "partially_paid"];

export function InvoiceTable({ initialInvoices, customerMap, orderMap }: InvoiceTableProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteInvoice(deletingId);
      setInvoices(prev => prev.filter(i => i.$id !== deletingId));
      toast("Invoice deleted", "success");
    } catch {
      toast("Error deleting invoice", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = invoices.filter(inv => {
    const customerName = customerMap[inv.customer_id] || "";
    const q = search.toLowerCase();
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(q) ||
      customerName.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const now = new Date();

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by invoice # or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>No invoices found.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const isOverdue =
                  inv.due_date &&
                  new Date(inv.due_date) < now &&
                  inv.status !== "paid";
                return (
                  <tr key={inv.$id}>
                    <td>
                      <Link href={`/invoices/${inv.$id}`} className={styles.invLink}>
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td>{customerMap[inv.customer_id] || <span className={styles.muted}>Unknown</span>}</td>
                    <td className={styles.muted}>{orderMap[inv.order_id] || "—"}</td>
                    <td className={styles.price}>{formatCurrency(inv.amount)}</td>
                    <td><Badge status={inv.status} /></td>
                    <td className={isOverdue ? styles.overdue : styles.muted}>
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })
                        : "—"}
                      {isOverdue ? " ⚠" : ""}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/invoices/${inv.$id}`} className={styles.actionBtn} title="View">
                          <Eye size={16} />
                        </Link>
                        <Link href={`/invoices/${inv.$id}/edit`} className={styles.actionBtn} title="Edit">
                          <Edit2 size={16} />
                        </Link>
                        <button
                          className={`${styles.actionBtn} ${styles.danger}`}
                          onClick={() => setDeletingId(inv.$id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? All linked payments will also be removed."
        onConfirm={() => { void handleDelete(); }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
