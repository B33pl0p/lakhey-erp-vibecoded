"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Quote, QuoteStatus } from "@/lib/api/quotations";
import { deleteQuotation } from "@/lib/api/quotations";
import { useToast } from "@/components/ui/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Edit2, Trash2, Search, Eye, Printer } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./QuoteTable.module.css";

interface QuoteTableProps {
  initialQuotes: Quote[];
  customerMap: Record<string, string>;
}

const STATUS_OPTIONS: QuoteStatus[] = ["draft", "sent", "accepted", "rejected", "expired"];

export function QuoteTable({ initialQuotes, customerMap }: QuoteTableProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteQuotation(deletingId);
      setQuotes(prev => prev.filter(q => q.$id !== deletingId));
      toast("Quotation deleted", "success");
      router.refresh();
    } catch {
      toast("Error deleting quotation", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = quotes.filter(q => {
    const customerName = customerMap[q.customer_id] || "";
    const ql = search.toLowerCase();
    const matchSearch =
      q.quote_number.toLowerCase().includes(ql) ||
      q.title.toLowerCase().includes(ql) ||
      customerName.toLowerCase().includes(ql);
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by quote # , title or customer..."
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
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>No quotations found.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Title</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Valid Until</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => {
                const isExpired =
                  q.valid_until &&
                  new Date(q.valid_until) < new Date() &&
                  q.status !== "accepted" &&
                  q.status !== "rejected";
                return (
                  <tr key={q.$id}>
                    <td>
                      <Link href={`/admin/quotations/${q.$id}`} className={styles.quoteLink}>
                        {q.quote_number}
                      </Link>
                    </td>
                    <td className={styles.title}>{q.title}</td>
                    <td>{customerMap[q.customer_id] || <span className={styles.muted}>Unknown</span>}</td>
                    <td className={styles.price}>{formatCurrency(q.grand_total)}</td>
                    <td><Badge status={q.status} /></td>
                    <td className={isExpired ? styles.expired : styles.muted}>
                      {q.valid_until
                        ? new Date(q.valid_until).toLocaleDateString("en-NP", {
                            year: "numeric", month: "short", day: "numeric",
                          })
                        : "—"}
                      {isExpired ? " ⚠" : ""}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/admin/quotations/${q.$id}`} className={styles.actionBtn} title="View">
                          <Eye size={15} />
                        </Link>
                        <Link href={`/admin/quotations/${q.$id}/print`} className={styles.actionBtn} title="Print" target="_blank">
                          <Printer size={15} />
                        </Link>
                        {q.status === "draft" && (
                          <Link href={`/admin/quotations/${q.$id}/edit`} className={styles.actionBtn} title="Edit">
                            <Edit2 size={15} />
                          </Link>
                        )}
                        <button
                          className={`${styles.actionBtn} ${styles.danger}`}
                          onClick={() => setDeletingId(q.$id)}
                          title="Delete"
                        >
                          <Trash2 size={15} />
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
        title="Delete Quotation"
        message="This quotation will be permanently deleted. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
