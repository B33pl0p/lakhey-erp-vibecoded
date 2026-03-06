import { getOrders } from "@/lib/api/orders";
import { getCustomers } from "@/lib/api/customers";
import { OrderTable } from "@/components/orders/OrderTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [orders, customers] = await Promise.all([getOrders(), getCustomers()]);

  const customerMap = Object.fromEntries(customers.map(c => [c.$id, c.name]));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Orders</h1>
          <p>Manage catalog and custom print orders.</p>
        </div>
        <Link href="/orders/new" className={styles.primaryAction}>
          <Plus size={18} />
          <span>New Order</span>
        </Link>
      </header>

      <div className={styles.tableCard}>
        <OrderTable initialOrders={orders} customerMap={customerMap} />
      </div>
    </div>
  );
}
