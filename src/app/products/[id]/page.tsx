import { getProduct } from "@/lib/api/products";
import { getBomForProduct } from "@/lib/api/productMaterials";
import { getInventoryItems } from "@/lib/api/inventory";
import { BomEditor } from "@/components/products/BomEditor";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Edit2, ArrowLeft, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
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

  const marginPct = product.selling_price > 0
    ? ((product.selling_price - product.making_cost) / product.selling_price) * 100
    : 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/products" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className={styles.nameRow}>
              <h1>{product.name}</h1>
              <span className={`${styles.badge} ${product.is_active ? styles.active : styles.inactive}`}>
                {product.is_active ? "Active" : "Inactive"}
              </span>
              <span className={styles.categoryBadge}>{product.category}</span>
            </div>
            {product.description && (
              <p className={styles.description}>{product.description}</p>
            )}
          </div>
        </div>
        <Link href={`/products/${id}/edit`} className={styles.editBtn}>
          <Edit2 size={16} />
          Edit Product
        </Link>
      </header>

      <div className={styles.layout}>
        {/* Left: info cards */}
        <div className={styles.left}>
          {/* Product image */}
          {product.image_id ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${product.image_id}/preview?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&width=400&height=400`}
              alt={product.name}
              className={styles.productImage}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <Package size={40} />
              <span>No photo</span>
            </div>
          )}

          {/* Pricing summary */}
          <div className={styles.card}>
            <h3>Pricing</h3>
            <div className={styles.statRow}>
              <span>Labor Cost</span>
              <strong>{formatCurrency(product.labor_cost)}</strong>
            </div>
            <div className={styles.statRow}>
              <span>Making Cost</span>
              <strong>{formatCurrency(product.making_cost)}</strong>
            </div>
            <div className={styles.statRow}>
              <span>Selling Price</span>
              <strong className={styles.price}>{formatCurrency(product.selling_price)}</strong>
            </div>
            <div className={styles.statRow}>
              <span>Margin</span>
              <strong className={marginPct < 20 ? styles.marginLow : styles.marginGood}>
                {marginPct.toFixed(1)}%
              </strong>
            </div>
          </div>

          {/* Dimensions */}
          {(product.height_mm || product.width_mm || product.depth_mm) && (
            <div className={styles.card}>
              <h3>Dimensions</h3>
              <div className={styles.statRow}>
                <span>Height</span><strong>{product.height_mm ?? "—"} mm</strong>
              </div>
              <div className={styles.statRow}>
                <span>Width</span><strong>{product.width_mm ?? "—"} mm</strong>
              </div>
              <div className={styles.statRow}>
                <span>Depth</span><strong>{product.depth_mm ?? "—"} mm</strong>
              </div>
            </div>
          )}

          {/* STL file link */}
          {product.file_id && (
            <div className={styles.card}>
              <h3>Print File</h3>
              <a
                href={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${product.file_id}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                target="_blank"
                rel="noreferrer"
                className={styles.downloadLink}
              >
                Download STL / 3MF
              </a>
            </div>
          )}
        </div>

        {/* Right: BOM Editor */}
        <div className={styles.right}>
          <BomEditor
            productId={id}
            laborCost={product.labor_cost}
            sellingPrice={product.selling_price}
            initialBom={bom}
            allInventoryItems={inventoryItems}
          />
        </div>
      </div>
    </div>
  );
}
