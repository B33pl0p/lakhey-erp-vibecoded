import { getQuotations } from "@/lib/api/quotations";
import { getCustomers } from "@/lib/api/customers";
import { QuoteTable } from "@/components/quotations/QuoteTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  const [quotes, customers] = await Promise.all([
    getQuotations(),
    getCustomers(),
  ]);

  const customerMap = Object.fromEntries(customers.map(c => [c.$id, c.name]));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Quotations</h1>
          <p>Create quotes for customers and convert them into orders.</p>
        </div>
        <Link href="/quotations/new" className={styles.primaryAction}>
          <Plus size={18} />
          <span>New Quotation</span>
        </Link>
      </header>

      <div className={styles.tableCard}>
        <QuoteTable
          initialQuotes={quotes}
          customerMap={customerMap}
        />
      </div>
    </div>
  );
}
