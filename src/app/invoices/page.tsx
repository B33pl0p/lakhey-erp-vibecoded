import { getInvoices } from "@/lib/api/invoices";
import { getCustomers } from "@/lib/api/customers";
import { getOrders } from "@/lib/api/orders";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const [invoices, customers, orders] = await Promise.all([
    getInvoices(),
    getCustomers(),
    getOrders(),
  ]);

  const customerMap = Object.fromEntries(customers.map(c => [c.$id, c.name]));
  const orderMap = Object.fromEntries(orders.map(o => [o.$id, o.title]));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Invoices</h1>
          <p>Track payments and generate bills for orders.</p>
        </div>
        <Link href="/invoices/new" className={styles.primaryAction}>
          <Plus size={18} />
          <span>New Invoice</span>
        </Link>
      </header>

      <div className={styles.tableCard}>
        <InvoiceTable
          initialInvoices={invoices}
          customerMap={customerMap}
          orderMap={orderMap}
        />
      </div>
    </div>
  );
}
