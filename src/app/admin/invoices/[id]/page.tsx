import { getInvoice } from "@/lib/api/invoices";
import { getPaymentsByInvoice } from "@/lib/api/payments";
import { getCustomer } from "@/lib/api/customers";
import { getOrder } from "@/lib/api/orders";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Printer, User, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { PaymentPanel } from "@/components/invoices/PaymentPanel";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./page.module.css";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;

  let invoice;
  try {
    invoice = await getInvoice(id);
  } catch {
    notFound();
  }

  const [customer, order, payments] = await Promise.all([
    getCustomer(invoice.customer_id).catch(() => null),
    getOrder(invoice.order_id).catch(() => null),
    getPaymentsByInvoice(id),
  ]);

  const createdAt = new Date(invoice.$createdAt).toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });

  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("en-NP", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isOverdue =
    invoice.due_date &&
    new Date(`${invoice.due_date}T00:00:00`) < todayStart &&
    invoice.status !== "paid";

  const totalPaid = payments.reduce((s, p) => s + p.amount_paid, 0);
  const remaining = Math.max(0, invoice.amount - totalPaid);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/admin/invoices" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className={styles.titleRow}>
              <h1>{invoice.invoice_number}</h1>
              <Badge status={invoice.status} />
            </div>
            <p className={styles.subtitle}>Created {createdAt}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/admin/invoices/${id}/print`} className={styles.printBtn} target="_blank">
            <Printer size={16} />
            Print Bill
          </Link>
          <Link href={`/admin/invoices/${id}/edit`} className={styles.editBtn}>
            <Edit2 size={16} />
            Edit
          </Link>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Invoice Summary */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Invoice Summary</h2>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Invoice #</span>
            <span className={styles.statValue} style={{ fontFamily: "monospace" }}>{invoice.invoice_number}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Amount</span>
            <span className={styles.statValue}>{formatCurrency(invoice.amount)}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Total Paid</span>
            <span className={`${styles.statValue} ${styles.green}`}>{formatCurrency(totalPaid)}</span>
          </div>
          <div className={`${styles.statRow} ${styles.totalRow}`}>
            <span className={styles.statLabel}>Remaining</span>
            <span className={remaining > 0 ? styles.amber : styles.green}>
              {formatCurrency(remaining)}
            </span>
          </div>
          {dueDate && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Due Date</span>
              <span className={isOverdue ? styles.red : styles.statValue}>
                {dueDate}{isOverdue ? " ⚠ Overdue" : ""}
              </span>
            </div>
          )}
          {invoice.notes && (
            <div className={styles.notes}>
              <p className={styles.notesLabel}>Notes</p>
              <p>{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Customer Card */}
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

        {/* Order Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <ShoppingCart size={16} style={{ opacity: 0.6 }} />
            Linked Order
          </h2>
          {order ? (
            <>
              <Link href={`/admin/orders/${order.$id}`} className={styles.entityLink}>
                {order.title}
              </Link>
              <div className={styles.statRow} style={{ marginTop: "0.75rem" }}>
                <span className={styles.statLabel}>Qty</span>
                <span className={styles.statValue}>{order.quantity}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Unit Price</span>
                <span className={styles.statValue}>{formatCurrency(order.unit_price)}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Order Total</span>
                <span className={styles.statValue}>{formatCurrency(order.total_price)}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Status</span>
                <Badge status={order.status} />
              </div>
            </>
          ) : (
            <p className={styles.muted}>Order not found</p>
          )}
        </div>
      </div>

      {/* Payments Section */}
      <div className={styles.paymentsSection}>
        <h2 className={styles.sectionTitle}>Payments</h2>
        <PaymentPanel
          invoiceId={id}
          customerId={invoice.customer_id}
          invoiceAmount={invoice.amount}
          initialPayments={payments}
        />
      </div>
    </div>
  );
}
