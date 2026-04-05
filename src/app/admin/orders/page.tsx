import { getOrders } from "@/lib/api/orders";
import { getCustomers } from "@/lib/api/customers";
import { getInvoices } from "@/lib/api/invoices";
import { OrderTable } from "@/components/orders/OrderTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [orders, customers, invoices] = await Promise.all([
    getOrders(),
    getCustomers(),
    getInvoices(),
  ]);

  const customerMap = Object.fromEntries(customers.map(c => [c.$id, c.name]));

  // Map orderId → invoiceId so the table can show "View Invoice" vs "→ Invoice"
  const orderInvoiceMap: Record<string, string> = {};
  for (const inv of invoices) {
    if (inv.order_id) {
      orderInvoiceMap[inv.order_id] = inv.$id;
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Orders</h1>
          <p>Manage catalog and custom print orders.</p>
        </div>
        <Link href="/admin/orders/new" className={styles.primaryAction}>
          <Plus size={18} />
          <span>New Order</span>
        </Link>
      </header>

      <div className={styles.tableCard}>
        <OrderTable
          initialOrders={orders}
          customerMap={customerMap}
          orderInvoiceMap={orderInvoiceMap}
        />
      </div>
    </div>
  );
}
