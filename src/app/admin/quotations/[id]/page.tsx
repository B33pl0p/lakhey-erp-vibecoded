import { getQuotation } from "@/lib/api/quotations";
import { getCustomer } from "@/lib/api/customers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Printer, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/currency";
import { getBusinessConfig } from "@/lib/api/businessConfig";
import { ConvertButton } from "./ConvertButton";
import styles from "./page.module.css";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({ params }: Props) {
  const { id } = await params;

  let quote;
  try {
    quote = await getQuotation(id);
  } catch {
    notFound();
  }

  const [customer, config] = await Promise.all([
    getCustomer(quote.customer_id).catch(() => null),
    getBusinessConfig(),
  ]);

  const createdAt = new Date(quote.$createdAt).toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });

  const validUntil = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString("en-NP", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  const isExpired =
    quote.valid_until &&
    new Date(quote.valid_until) < new Date() &&
    quote.status !== "accepted" &&
    quote.status !== "rejected";

  const lineItems = JSON.parse(quote.line_items || "[]") as {
    description: string; qty: number; unit_price: number;
  }[];

  const canConvert = quote.status === "sent" || quote.status === "draft";
  const canEdit = quote.status === "draft";

  const vatRate = config.vat_rate ?? 13;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/admin/quotations" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className={styles.titleRow}>
              <h1>{quote.quote_number}</h1>
              <Badge status={quote.status} />
            </div>
            <p className={styles.subtitle}>Created {createdAt}</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Link href={`/admin/quotations/${id}/print`} className={styles.printBtn} target="_blank">
            <Printer size={16} />
            Print / PDF
          </Link>
          {canEdit && (
            <Link href={`/admin/quotations/${id}/edit`} className={styles.editBtn}>
              <Edit2 size={16} />
              Edit
            </Link>
          )}
          {canConvert && !quote.converted_order_id && (
            <ConvertButton quoteId={id} />
          )}
          {quote.converted_order_id && (
            <Link href={`/admin/orders/${quote.converted_order_id}`} className={styles.orderLink}>
              View Order →
            </Link>
          )}
        </div>
      </header>

      <div className={styles.grid}>
        {/* Quote Summary */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Quote Summary</h2>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Quote #</span>
            <span className={styles.statValue} style={{ fontFamily: "monospace" }}>{quote.quote_number}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Subtotal</span>
            <span className={styles.statValue}>{formatCurrency(quote.subtotal)}</span>
          </div>
          {quote.include_vat && quote.vat_amount > 0 && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>VAT ({vatRate}%)</span>
              <span className={styles.statValue}>{formatCurrency(quote.vat_amount)}</span>
            </div>
          )}
          <div className={`${styles.statRow} ${styles.totalRow}`}>
            <span className={styles.statLabel}>Grand Total</span>
            <span className={styles.statValue} style={{ fontWeight: 700 }}>{formatCurrency(quote.grand_total)}</span>
          </div>
          {validUntil && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Valid Until</span>
              <span className={isExpired ? styles.red : styles.statValue}>
                {validUntil}{isExpired ? " ⚠ Expired" : ""}
              </span>
            </div>
          )}
          {quote.notes && (
            <div className={styles.notes}>
              <p className={styles.notesLabel}>Notes</p>
              <p>{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Customer */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <User size={16} style={{ opacity: 0.6 }} />
            Customer
          </h2>
          {customer ? (
            <>
              <Link href={`/admin/customers/${customer.$id}`} className={styles.entityLink}>
                {customer.name}
              </Link>
              {customer.email && <p className={styles.muted}>{customer.email}</p>}
              {customer.phone && <p className={styles.muted}>{customer.phone}</p>}
              {customer.address && <p className={styles.muted}>{customer.address}</p>}
            </>
          ) : (
            <p className={styles.muted}>Customer not found</p>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className={styles.lineItemsCard}>
        <h2 className={styles.sectionTitle}>Line Items</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Description</th>
              <th className={styles.right}>Qty</th>
              <th className={styles.right}>Unit Price</th>
              <th className={styles.right}>Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.description}</td>
                <td className={styles.right}>{item.qty}</td>
                <td className={styles.right}>{formatCurrency(item.unit_price)}</td>
                <td className={styles.right}>{formatCurrency(item.qty * item.unit_price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className={styles.right} style={{ opacity: 0.6, fontSize: "0.85rem" }}>Subtotal</td>
              <td className={styles.right}>{formatCurrency(quote.subtotal)}</td>
            </tr>
            {quote.include_vat && quote.vat_amount > 0 && (
              <tr>
                <td colSpan={3} className={styles.right} style={{ opacity: 0.6, fontSize: "0.85rem" }}>VAT ({vatRate}%)</td>
                <td className={styles.right}>{formatCurrency(quote.vat_amount)}</td>
              </tr>
            )}
            <tr className={styles.grandTotalRow}>
              <td colSpan={3} className={styles.right}>Grand Total</td>
              <td className={styles.right}>{formatCurrency(quote.grand_total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
