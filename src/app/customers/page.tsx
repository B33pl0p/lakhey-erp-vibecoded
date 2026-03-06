import { getCustomers } from "@/lib/api/customers";
import { CustomerTable } from "@/components/customers/CustomerTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Customers</h1>
          <p>Manage your customer base.</p>
        </div>
        <Link href="/customers/new" className={styles.primaryAction}>
          <Plus size={18} />
          <span>New Customer</span>
        </Link>
      </header>

      <div className={styles.tableCard}>
        <CustomerTable initialCustomers={customers} />
      </div>
    </div>
  );
}
