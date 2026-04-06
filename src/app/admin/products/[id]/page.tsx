import { getProduct } from "@/lib/api/products";
import { getBomForProduct } from "@/lib/api/productMaterials";
import { getInventoryItems } from "@/lib/api/inventory";
import { ProductDetailBody } from "@/components/products/ProductDetailBody";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Edit2, ArrowLeft } from "lucide-react";
import { formatProductCategoryLabel } from "@/lib/products/categories";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  let product, bom, inventoryItems;
  try {
    [product, bom, inventoryItems] = await Promise.all([
      getProduct(id),
      getBomForProduct(id),
      getInventoryItems(),
    ]);
  } catch {
    notFound();
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/admin/products" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className={styles.nameRow}>
              <h1>{product.name}</h1>
              <span className={`${styles.badge} ${product.is_active ? styles.active : styles.inactive}`}>
                {product.is_active ? "Active" : "Inactive"}
              </span>
              <span className={styles.categoryBadge}>{formatProductCategoryLabel(product.category)}</span>
            </div>
            {product.description && (
              <p className={styles.description}>{product.description}</p>
            )}
          </div>
        </div>
        <Link href={`/admin/products/${id}/edit`} className={styles.editBtn}>
          <Edit2 size={16} />
          Edit Product
        </Link>
      </header>

      <ProductDetailBody
        product={product}
        initialBom={bom}
        allInventoryItems={inventoryItems}
      />
    </div>
  );
}
