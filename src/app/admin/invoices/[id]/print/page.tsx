import { getInvoice } from "@/lib/api/invoices";
import { getPaymentsByInvoice } from "@/lib/api/payments";
import { getCustomer } from "@/lib/api/customers";
import { getOrder } from "@/lib/api/orders";
import { getBusinessConfig } from "@/lib/api/businessConfig";
import { getFilePreviewUrl } from "@/lib/api/storage";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import Image from "next/image";
import styles from "./page.module.css";
import PrintButton from "./PrintButton";

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  sent: "#2563eb",
  paid: "#059669",
  partially_paid: "#d97706",
};

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PrintInvoicePage({ params }: Props) {
  const { id } = await params;

  let invoice;
  try {
    invoice = await getInvoice(id);
  } catch {
    notFound();
  }

  const [customer, order, payments, config] = await Promise.all([
    getCustomer(invoice.customer_id).catch(() => null),
    getOrder(invoice.order_id).catch(() => null),
    getPaymentsByInvoice(id),
    getBusinessConfig(),
  ]);

  const logoUrl = config.logo_id
    ? await getFilePreviewUrl(config.logo_id, 160, 160)
    : null;

  const subtotal = invoice.amount;
  const vatRate = config.vat_enabled ? (config.vat_rate ?? 13) : 0;
  const vatAmount = config.vat_enabled ? (subtotal * vatRate) / 100 : 0;
  const grandTotal = subtotal + vatAmount;
  const totalPaid = payments.reduce((s, p) => s + p.amount_paid, 0);
  const remaining = Math.max(0, grandTotal - totalPaid);

  const issueDate = new Date(invoice.$createdAt).toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });

  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("en-NP", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  return (
    <div className={styles.printPage}>
      {/* Screen-only controls */}
      <div className={styles.screenControls}>
        <PrintButton />
        <a href={`/admin/invoices/${id}`} className={styles.backLink}>← Back to Invoice</a>
      </div>

      {/* Bill */}
      <div className={styles.bill} id="bill">
        {/* Header */}
        <div className={styles.billHeader}>
          <div className={styles.businessInfo}>
            {logoUrl && (
              <Image src={logoUrl} alt="Logo" width={72} height={72} className={styles.logoImg} unoptimized />
            )}
            <div>
              <h1 className={styles.businessName}>{config.company_name || "PrintFlow Studio"}</h1>
              {config.tagline && <p className={styles.businessTagline}>{config.tagline}</p>}
              {config.address && <p className={styles.businessDetail}>{config.address}</p>}
              {config.phone && <p className={styles.businessDetail}>{config.phone}</p>}
              {config.email && <p className={styles.businessDetail}>{config.email}</p>}
              {config.pan_number && <p className={styles.businessDetail}><strong>PAN:</strong> {config.pan_number}</p>}
              {config.vat_number && <p className={styles.businessDetail}><strong>VAT No:</strong> {config.vat_number}</p>}
            </div>
          </div>
          <div className={styles.invoiceMeta}>
            <h2 className={styles.invoiceNumber}>{invoice.invoice_number}</h2>
            <span style={{
              display: "inline-block",
              padding: "0.2rem 0.75rem",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              background: `${STATUS_COLORS[invoice.status] ?? "#6b7280"}22`,
              color: STATUS_COLORS[invoice.status] ?? "#6b7280",
              border: `1px solid ${STATUS_COLORS[invoice.status] ?? "#6b7280"}44`,
            }}>
              {invoice.status.replace("_", " ")}
            </span>
            <p className={styles.dateInfo}>Issued: {issueDate}</p>
            {dueDate && <p className={styles.dateInfo}>Due: {dueDate}</p>}
            {config.invoice_payment_terms && (
              <p className={styles.dateInfo}>Terms: {config.invoice_payment_terms}</p>
            )}
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Customer & Order info */}
        <div className={styles.infoGrid}>
          <div className={styles.infoBlock}>
            <h3 className={styles.infoTitle}>Bill To</h3>
            {customer ? (
              <>
                <p className={styles.infoName}>{customer.name}</p>
                {customer.email && <p className={styles.infoLine}>{customer.email}</p>}
                {customer.phone && <p className={styles.infoLine}>{customer.phone}</p>}
                {customer.address && <p className={styles.infoLine}>{customer.address}</p>}
              </>
            ) : (
              <p className={styles.infoLine}>—</p>
            )}
          </div>

          {order && (
            <div className={styles.infoBlock}>
              <h3 className={styles.infoTitle}>Order Details</h3>
              <p className={styles.infoName}>{order.title}</p>
              <p className={styles.infoLine}>Type: {order.is_product ? "Catalog Product" : "Custom Job"}</p>
              {order.deadline && (
                <p className={styles.infoLine}>
                  Deadline: {new Date(order.deadline).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              )}
            </div>
          )}
        </div>

        <hr className={styles.divider} />

        {/* Line items */}
        <table className={styles.lineTable}>
          <thead>
            <tr>
              <th>Description</th>
              <th className={styles.right}>Qty</th>
              <th className={styles.right}>Unit Price</th>
              <th className={styles.right}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order ? (
              <tr>
                <td>{order.title}</td>
                <td className={styles.right}>{order.quantity}</td>
                <td className={styles.right}>{formatCurrency(order.unit_price)}</td>
                <td className={styles.right}>{formatCurrency(order.total_price)}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={4} className={styles.center}>Order details unavailable</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className={styles.totalsSection}>
          <div className={styles.totalsBlock}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {config.vat_enabled && vatAmount > 0 && (
              <div className={styles.totalRow}>
                <span>VAT ({vatRate}%)</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
            )}
            {config.vat_enabled && vatAmount > 0 && (
              <div className={styles.totalRow} style={{ borderTop: "1px solid #e5e7eb", paddingTop: "0.5rem", fontWeight: 700 }}>
                <span>Total (incl. VAT)</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            )}
            {totalPaid > 0 && (
              <div className={styles.totalRow}>
                <span>Amount Paid</span>
                <span className={styles.greenText}>- {formatCurrency(totalPaid)}</span>
              </div>
            )}
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span>Balance Due</span>
              <span>{formatCurrency(remaining)}</span>
            </div>
          </div>
        </div>

        {/* Payments history */}
        {payments.length > 0 && (
          <>
            <hr className={styles.divider} />
            <div className={styles.paymentsSection}>
              <h3 className={styles.sectionHeading}>Payment History</h3>
              <table className={styles.lineTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Notes</th>
                    <th className={styles.right}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.$id}>
                      <td>
                        {p.payment_date
                          ? new Date(p.payment_date).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })
                          : "—"}
                      </td>
                      <td>{p.payment_method.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</td>
                      <td className={styles.muted}>{p.notes || "—"}</td>
                      <td className={`${styles.right} ${styles.greenText}`}>{formatCurrency(p.amount_paid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Notes */}
        {(invoice.notes || config.invoice_default_notes) && (
          <>
            <hr className={styles.divider} />
            <div className={styles.notesSection}>
              <h3 className={styles.sectionHeading}>Notes</h3>
              <p>{invoice.notes || config.invoice_default_notes}</p>
            </div>
          </>
        )}

        {/* Footer */}
        <div className={styles.billFooter}>
          <p>Thank you for your business!</p>
          {config.website && <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>{config.website}</p>}
        </div>
      </div>
    </div>
  );
}
