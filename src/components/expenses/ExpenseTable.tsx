"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit2, Trash2, Search, TrendingDown, ExternalLink } from "lucide-react";
import { deleteExpense, type Expense, type ExpenseSummary } from "@/lib/api/expenses";
import { useToast } from "@/components/ui/ToastContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./ExpenseTable.module.css";

const CATEGORY_LABELS: Record<string, string> = {
  utilities:    "Utilities",
  equipment:    "Equipment",
  raw_materials:"Raw Materials",
  rent:         "Rent / Overhead",
  software:     "Software",
  shipping:     "Shipping",
  other:        "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  utilities:    "#3b82f6",
  equipment:    "#8b5cf6",
  raw_materials:"#f59e0b",
  rent:         "#ef4444",
  software:     "#06b6d4",
  shipping:     "#10b981",
  other:        "#6b7280",
};

const PAYMENT_LABELS: Record<string, string> = {
  cash:          "Cash",
  card:          "Card",
  bank_transfer: "Bank Transfer",
  online:        "Online",
  other:         "Other",
};

interface ExpenseTableProps {
  initialExpenses: Expense[];
  summary: ExpenseSummary;
}

export function ExpenseTable({ initialExpenses, summary }: ExpenseTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteExpense(deletingId);
      setExpenses(prev => prev.filter(e => e.$id !== deletingId));
      toast("Expense deleted", "success");
      router.refresh();
    } catch {
      toast("Failed to delete expense", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Unique months available in data
  const availableMonths = Array.from(
    new Set(expenses.map(e => (e.date ?? e.$createdAt).substring(0, 7)))
  ).sort().reverse();

  const filtered = expenses
    .filter(e => {
      const term = search.toLowerCase();
      const matchSearch =
        e.title.toLowerCase().includes(term) ||
        (e.vendor?.toLowerCase().includes(term) ?? false);
      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      const expMonth = (e.date ?? e.$createdAt).substring(0, 7);
      const matchMonth = monthFilter === "all" || expMonth === monthFilter;
      return matchSearch && matchCategory && matchMonth;
    })
    .sort((a, b) => {
      if (sortOrder === "date_desc") return (b.date ?? b.$createdAt).localeCompare(a.date ?? a.$createdAt);
      if (sortOrder === "date_asc")  return (a.date ?? a.$createdAt).localeCompare(b.date ?? b.$createdAt);
      if (sortOrder === "amount_desc") return b.amount - a.amount;
      return a.amount - b.amount;
    });

  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className={styles.wrapper}>
      {/* Summary cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: "#ef444420", color: "#ef4444" }}>
            <TrendingDown size={20} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Total Expenses</p>
            <p className={styles.summaryValue}>{formatCurrency(summary.totalExpenses)}</p>
          </div>
        </div>
        {Object.entries(summary.byCategory)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([cat, total]) => (
            <div key={cat} className={styles.summaryCard}>
              <div
                className={styles.summaryIcon}
                style={{
                  background: `${CATEGORY_COLORS[cat] ?? "#6b7280"}20`,
                  color: CATEGORY_COLORS[cat] ?? "#6b7280",
                }}
              >
                <span className={styles.catDot} />
              </div>
              <div>
                <p className={styles.summaryLabel}>{CATEGORY_LABELS[cat] ?? cat}</p>
                <p className={styles.summaryValue}>{formatCurrency(total)}</p>
              </div>
            </div>
          ))}
      </div>

      {/* Category breakdown + monthly trend */}
      <div className={styles.reportsRow}>
        <div className={styles.reportPanel}>
          <h3 className={styles.reportTitle}>By Category</h3>
          <div className={styles.categoryList}>
            {Object.entries(summary.byCategory).sort(([, a], [, b]) => b - a).map(([cat, total]) => {
              const pct = summary.totalExpenses > 0
                ? Math.round((total / summary.totalExpenses) * 100)
                : 0;
              return (
                <div key={cat} className={styles.categoryRow}>
                  <div className={styles.categoryMeta}>
                    <span
                      className={styles.categoryDot}
                      style={{ background: CATEGORY_COLORS[cat] ?? "#6b7280" }}
                    />
                    <span className={styles.categoryName}>{CATEGORY_LABELS[cat] ?? cat}</span>
                  </div>
                  <div className={styles.categoryBar}>
                    <div
                      className={styles.categoryFill}
                      style={{
                        width: `${pct}%`,
                        background: CATEGORY_COLORS[cat] ?? "#6b7280",
                      }}
                    />
                  </div>
                  <span className={styles.categoryAmount}>{formatCurrency(total)}</span>
                </div>
              );
            })}
            {Object.keys(summary.byCategory).length === 0 && (
              <p className={styles.emptyNote}>No data yet</p>
            )}
          </div>
        </div>

        <div className={styles.reportPanel}>
          <h3 className={styles.reportTitle}>Monthly Totals</h3>
          <div className={styles.monthlyList}>
            {[...summary.byMonth].reverse().slice(0, 12).map(({ month, total }) => (
              <div key={month} className={styles.monthRow}>
                <span className={styles.monthLabel}>{month}</span>
                <span className={styles.monthAmount}>{formatCurrency(total)}</span>
              </div>
            ))}
            {summary.byMonth.length === 0 && (
              <p className={styles.emptyNote}>No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by title or vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="utilities">Utilities</option>
          <option value="equipment">Equipment</option>
          <option value="raw_materials">Raw Materials</option>
          <option value="rent">Rent / Overhead</option>
          <option value="software">Software</option>
          <option value="shipping">Shipping</option>
          <option value="other">Other</option>
        </select>
        <select
          className={styles.filterSelect}
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
        >
          <option value="all">All Months</option>
          {availableMonths.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
        >
          <option value="date_desc">Date (Newest)</option>
          <option value="date_asc">Date (Oldest)</option>
          <option value="amount_desc">Amount (High → Low)</option>
          <option value="amount_asc">Amount (Low → High)</option>
        </select>
      </div>

      {filtered.length > 0 && (
        <div className={styles.filteredTotal}>
          Showing {filtered.length} expense{filtered.length !== 1 ? "s" : ""} —&nbsp;
          <strong>Total: {formatCurrency(filteredTotal)}</strong>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Vendor</th>
              <th>Method</th>
              <th className={styles.amountCol}>Amount</th>
              <th className={styles.actionsCol}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(expense => (
              <tr key={expense.$id}>
                <td className={styles.dateCell}>
                  {new Date(expense.date ?? expense.$createdAt).toLocaleDateString("en-NP", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </td>
                <td>
                  <div className={styles.titleCell}>
                    <span className={styles.expenseTitle}>{expense.title}</span>
                    {expense.notes && (
                      <span className={styles.notesPreview}>{expense.notes}</span>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    className={styles.categoryBadge}
                    style={{
                      background: `${CATEGORY_COLORS[expense.category] ?? "#6b7280"}20`,
                      color: CATEGORY_COLORS[expense.category] ?? "#6b7280",
                    }}
                  >
                    {CATEGORY_LABELS[expense.category] ?? expense.category}
                  </span>
                </td>
                <td className={styles.vendorCell}>{expense.vendor || "—"}</td>
                <td className={styles.methodCell}>
                  {expense.payment_method ? PAYMENT_LABELS[expense.payment_method] : "—"}
                </td>
                <td className={styles.amountCell}>{formatCurrency(expense.amount)}</td>
                <td className={styles.actionsColCell}>
                  <div className={styles.actions}>
                    {expense.receipt_id && (
                      <a
                        href={`/expenses/${expense.$id}`}
                        title="View receipt"
                        className={styles.iconBtn}
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <Link
                      href={`/expenses/${expense.$id}/edit`}
                      className={styles.iconBtn}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </Link>
                    <button
                      className={`${styles.iconBtn} ${styles.deleteBtn}`}
                      onClick={() => setDeletingId(expense.$id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>
                  No expenses found. <Link href="/expenses/new">Add one →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        onConfirm={() => { void handleDelete(); }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
