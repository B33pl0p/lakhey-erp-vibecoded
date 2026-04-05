import { getQuotation } from "@/lib/api/quotations";
import { getCustomer } from "@/lib/api/customers";
import { getBusinessConfig } from "@/lib/api/businessConfig";
import { getFilePreviewUrl } from "@/lib/api/storage";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import Image from "next/image";
import styles from "./page.module.css";
import PrintButton from "./PrintButton";

const STATUS_COLORS: Record<string, string> = {
  draft:    "#6b7280",
  sent:     "#2563eb",
  accepted: "#059669",
  rejected: "#ef4444",
  expired:  "#d97706",
};

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PrintQuotationPage({ params }: Props) {
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

  const logoUrl = config.logo_id
    ? await getFilePreviewUrl(config.logo_id, 160, 160)
    : null;

  const lineItems = JSON.parse(quote.line_items || "[]") as {
    description: string; qty: number; unit_price: number;
  }[];

  const vatRate = config.vat_rate ?? 13;

  const issueDate = new Date(quote.$createdAt).toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });

  const validUntil = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString("en-NP", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  return (
    <div className={styles.printPage}>
      {/* Screen-only controls */}
      <div className={styles.screenControls}>
        <PrintButton />
        <a href={`/admin/quotations/${id}`} className={styles.backLink}>← Back to Quotation</a>
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
              {config.tagline     && <p className={styles.businessTagline}>{config.tagline}</p>}
              {config.address     && <p className={styles.businessDetail}>{config.address}</p>}
              {config.phone       && <p className={styles.businessDetail}>{config.phone}</p>}
              {config.email       && <p className={styles.businessDetail}>{config.email}</p>}
              {config.pan_number  && <p className={styles.businessDetail}><strong>PAN:</strong> {config.pan_number}</p>}
              {config.vat_number  && <p className={styles.businessDetail}><strong>VAT No:</strong> {config.vat_number}</p>}
            </div>
          </div>

          <div className={styles.invoiceMeta}>
            {/* "QUOTATION" label */}
            <p className={styles.docType}>QUOTATION</p>
            <h2 className={styles.invoiceNumber}>{quote.quote_number}</h2>
            <span style={{
              display: "inline-block",
              padding: "0.2rem 0.75rem",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              background: `${STATUS_COLORS[quote.status] ?? "#6b7280"}22`,
              color: STATUS_COLORS[quote.status] ?? "#6b7280",
              border: `1px solid ${STATUS_COLORS[quote.status] ?? "#6b7280"}44`,
            }}>
              {quote.status}
            </span>
            <p className={styles.dateInfo}>Issued: {issueDate}</p>
            {validUntil && <p className={styles.dateInfo}>Valid Until: {validUntil}</p>}
            {config.invoice_payment_terms && (
              <p className={styles.dateInfo}>Terms: {config.invoice_payment_terms}</p>
            )}
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Customer info */}
        <div className={styles.infoGrid}>
          <div className={styles.infoBlock}>
            <h3 className={styles.infoTitle}>Quoted To</h3>
            {customer ? (
              <>
                <p className={styles.infoName}>{customer.name}</p>
                {customer.email   && <p className={styles.infoLine}>{customer.email}</p>}
                {customer.phone   && <p className={styles.infoLine}>{customer.phone}</p>}
                {customer.address && <p className={styles.infoLine}>{customer.address}</p>}
              </>
            ) : (
              <p className={styles.infoLine}>—</p>
            )}
          </div>

          <div className={styles.infoBlock}>
            <h3 className={styles.infoTitle}>Reference</h3>
            <p className={styles.infoName}>{quote.title}</p>
          </div>
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
            {lineItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.description}</td>
                <td className={styles.right}>{item.qty}</td>
                <td className={styles.right}>{formatCurrency(item.unit_price)}</td>
                <td className={styles.right}>{formatCurrency(item.qty * item.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className={styles.totalsSection}>
          <div className={styles.totalsBlock}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.include_vat && quote.vat_amount > 0 && (
              <div className={styles.totalRow}>
                <span>VAT ({vatRate}%)</span>
                <span>{formatCurrency(quote.vat_amount)}</span>
              </div>
            )}
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span>Grand Total</span>
              <span>{formatCurrency(quote.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(quote.notes || config.invoice_default_notes) && (
          <>
            <hr className={styles.divider} />
            <div className={styles.notesSection}>
              <h3 className={styles.sectionHeading}>Notes</h3>
              <p>{quote.notes || config.invoice_default_notes}</p>
            </div>
          </>
        )}

        {/* Footer */}
        <div className={styles.billFooter}>
          <p>This is a quotation, not an invoice. Prices are valid until {validUntil ?? "further notice"}.</p>
          {config.website && <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>{config.website}</p>}
        </div>
      </div>
    </div>
  );
}
