import { getProducts } from "@/lib/api/products";
import { ProductTable } from "@/components/products/ProductTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Products</h1>
          <p>Manage your 3D printed product catalog and bill of materials.</p>
        </div>
        <Link href="/admin/products/new" className={styles.primaryAction}>
          <Plus size={18} />
          <span>New Product</span>
        </Link>
      </header>

      <div className={styles.tableCard}>
        <ProductTable initialProducts={products} />
      </div>
    </div>
  );
}
