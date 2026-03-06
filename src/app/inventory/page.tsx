import { getInventoryItems } from "@/lib/api/inventory";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./page.module.css";

// Force dynamic since inventory changes frequently
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await getInventoryItems();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Inventory Hub</h1>
          <p>Manage filaments, hardware, and shop supplies.</p>
        </div>
        <Link href="/inventory/new" className={styles.primaryAction}>
          <Plus size={18} />
          <span>Add Item</span>
        </Link>
      </header>

      <div className={styles.tableCard}>
        <InventoryTable initialItems={items} />
      </div>
    </div>
  );
}
