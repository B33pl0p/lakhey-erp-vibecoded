import { getExpense } from "@/lib/api/expenses";
import { getFilePreviewUrl } from "@/lib/api/storage";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Calendar, Tag, CreditCard, Building2, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./page.module.css";

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

interface ExpenseDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const { id } = await params;

  let expense;
  try {
    expense = await getExpense(id);
  } catch {
    notFound();
  }

  const receiptUrl = expense.receipt_id
    ? await getFilePreviewUrl(expense.receipt_id, 800, 1000)
    : null;

  const catColor = CATEGORY_COLORS[expense.category] ?? "#6b7280";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/admin/expenses" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={styles.title}>{expense.title}</h1>
            <p className={styles.subtitle}>Expense Detail</p>
          </div>
        </div>
        <Link href={`/admin/expenses/${id}/edit`} className={styles.editBtn}>
          <Edit2 size={16} /> Edit
        </Link>
      </div>

      <div className={styles.body}>
        {/* Details card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Details</h2>

          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><Tag size={14} /> Category</span>
              <span
                className={styles.badge}
                style={{ background: `${catColor}20`, color: catColor }}
              >
                {CATEGORY_LABELS[expense.category] ?? expense.category}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><Calendar size={14} /> Date</span>
              <span className={styles.detailValue}>
                {new Date(expense.date ?? expense.$createdAt).toLocaleDateString("en-NP", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><CreditCard size={14} /> Payment Method</span>
              <span className={styles.detailValue}>
                {expense.payment_method
                  ? expense.payment_method.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())
                  : "—"}
              </span>
            </div>

            {expense.vendor && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}><Building2 size={14} /> Vendor</span>
                <span className={styles.detailValue}>{expense.vendor}</span>
              </div>
            )}

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Amount</span>
              <span className={styles.amountValue}>{formatCurrency(expense.amount)}</span>
            </div>
          </div>

          {expense.notes && (
            <div className={styles.notesBox}>
              <span className={styles.detailLabel}><FileText size={14} /> Notes</span>
              <p className={styles.notesText}>{expense.notes}</p>
            </div>
          )}
        </div>

        {/* Receipt */}
        {receiptUrl && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Receipt</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptUrl}
              alt="Receipt"
              className={styles.receiptImg}
            />
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.viewOriginalBtn}
            >
              View full size ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
