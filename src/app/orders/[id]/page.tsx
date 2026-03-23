import { getOrder } from "@/lib/api/orders";
import { getCustomer } from "@/lib/api/customers";
import { getProduct } from "@/lib/api/products";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, User, Package, FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./page.module.css";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  let order;
  try {
    order = await getOrder(id);
  } catch {
    notFound();
  }

  const [customer, product] = await Promise.all([
    getCustomer(order.customer_id).catch(() => null),
    order.product_id ? getProduct(order.product_id).catch(() => null) : null,
  ]);

  const deadline = order.deadline
    ? new Date(order.deadline).toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const createdAt = new Date(order.$createdAt).toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });

  const isOverdue =
    order.deadline &&
    new Date(order.deadline) < new Date() &&
    order.status !== "delivered" &&
    order.status !== "paid" &&
    order.status !== "cancelled";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/orders" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className={styles.titleRow}>
              <h1>{order.title}</h1>
              <Badge status={order.status} />
              <span className={order.is_product ? styles.typeProd : styles.typeCustom}>
                {order.is_product ? "Catalog" : "Custom"}
              </span>
            </div>
            <p className={styles.subtitle}>Created {createdAt}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/invoices/new?order_id=${order.$id}`} className={styles.invoiceBtn}>
            <FileText size={16} />
            Generate Invoice
          </Link>
          <Link href={`/orders/${id}/edit`} className={styles.editBtn}>
            <Edit2 size={16} />
            Edit
          </Link>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Pricing Summary */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Pricing</h2>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Quantity</span>
            <span className={styles.statValue}>{order.quantity}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Unit Price</span>
            <span className={styles.statValue}>{formatCurrency(order.unit_price)}</span>
          </div>
          <div className={`${styles.statRow} ${styles.totalRow}`}>
            <span className={styles.statLabel}>Total Price</span>
            <span className={styles.totalValue}>{formatCurrency(order.total_price)}</span>
          </div>
          {order.advance_paid != null && order.advance_paid > 0 && (
            <>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Advance Paid</span>
                <span className={styles.advancePaidValue}>{formatCurrency(order.advance_paid)}</span>
              </div>
              <div className={`${styles.statRow} ${styles.totalRow}`}>
                <span className={styles.statLabel}>Balance Due</span>
                <span className={styles.balanceDueValue}>{formatCurrency(Math.max(0, order.total_price - order.advance_paid))}</span>
              </div>
              {order.advance_notes && (
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Payment Notes</span>
                  <span className={styles.statValue}>{order.advance_notes}</span>
                </div>
              )}
            </>
          )}
          {deadline && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Deadline</span>
              <span className={isOverdue ? styles.overdueValue : styles.statValue}>{deadline}{isOverdue ? " ⚠ Overdue" : ""}</span>
            </div>
          )}
          {order.delivery_address && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Delivery Address</span>
              <span className={styles.statValue}>{order.delivery_address}</span>
            </div>
          )}
        </div>

        {/* Customer */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}><User size={15} /> Customer</h2>
          {customer ? (
            <div className={styles.infoBlock}>
              <Link href={`/customers/${customer.$id}`} className={styles.bigLink}>{customer.name}</Link>
              {customer.email && <span className={styles.infoLine}>{customer.email}</span>}
              {customer.phone && <span className={styles.infoLine}>{customer.phone}</span>}
            </div>
          ) : (
            <p className={styles.muted}>Customer not found</p>
          )}
        </div>

        {/* Linked product (catalog orders) */}
        {order.is_product && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}><Package size={15} /> Product</h2>
            {product ? (
              <div className={styles.infoBlock}>
                <Link href={`/products/${product.$id}`} className={styles.bigLink}>{product.name}</Link>
                <span className={styles.infoLine}>{product.category}</span>
                <span className={styles.infoLine}>Selling price: {formatCurrency(product.selling_price)}</span>
              </div>
            ) : (
              <p className={styles.muted}>Product not linked</p>
            )}
          </div>
        )}

        {/* Custom order details */}
        {!order.is_product && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Print Specs</h2>
            <div className={styles.specGrid}>
              {order.filament_type && <div className={styles.spec}><span>Filament</span><strong>{order.filament_type}</strong></div>}
              {order.filament_color && <div className={styles.spec}><span>Color</span><strong>{order.filament_color}</strong></div>}
              {order.filament_weight_grams && <div className={styles.spec}><span>Weight</span><strong>{order.filament_weight_grams}g</strong></div>}
              {order.filament_price_per_gram && <div className={styles.spec}><span>Price/g</span><strong>{formatCurrency(order.filament_price_per_gram)}</strong></div>}
              {(order.print_x_mm || order.print_y_mm || order.print_z_mm) && (
                <div className={styles.spec}>
                  <span>Dimensions</span>
                  <strong>{order.print_x_mm ?? "?"}×{order.print_y_mm ?? "?"}×{order.print_z_mm ?? "?"}mm</strong>
                </div>
              )}
              <div className={styles.spec}><span>Multi-color</span><strong>{order.is_multicolor ? "Yes" : "No"}</strong></div>
              <div className={styles.spec}><span>Assembly</span><strong>{order.is_assembled ? "Required" : "No"}</strong></div>
              <div className={styles.spec}><span>Parts</span><strong>{order.is_single_part ? "Single" : "Multi-part"}</strong></div>
            </div>
            {order.custom_material && (
              <div className={styles.noteBlock}>
                <span className={styles.noteLabel}>Material notes</span>
                <p>{order.custom_material}</p>
              </div>
            )}
            {order.custom_notes && (
              <div className={styles.noteBlock}>
                <span className={styles.noteLabel}>Custom notes</span>
                <p>{order.custom_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Files */}
      {(order.file_id || order.image_id) && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Attachments</h2>
          <div className={styles.attachments}>
            {order.file_id && (
              <a
                href={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${order.file_id}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.attachBtn}
              >
                <Download size={16} />
                Download 3MF / STL
              </a>
            )}
            {order.image_id && (
              <a
                href={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${order.image_id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.attachBtn}
              >
                View Reference Image
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
