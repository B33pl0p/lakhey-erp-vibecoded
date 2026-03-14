"use client";

import { useState } from "react";
import { BomEditor } from "./BomEditor";
import { formatCurrency } from "@/lib/utils/currency";
import type { Product } from "@/lib/api/products";
import type { BomLine } from "@/lib/api/productMaterials";
import type { InventoryItem } from "@/lib/api/inventory";
import { Package } from "lucide-react";
import styles from "@/app/products/[id]/page.module.css";

interface Props {
  product: Product;
  initialBom: BomLine[];
  allInventoryItems: InventoryItem[];
}

export function ProductDetailBody({ product, initialBom, allInventoryItems }: Props) {
  const [makingCost, setMakingCost] = useState(product.making_cost);

  const profitRs = product.selling_price - makingCost;
  const marginPct =
    product.selling_price > 0
      ? (profitRs / product.selling_price) * 100
      : 0;

  return (
    <div className={styles.layout}>
      {/* Left: info cards */}
      <div className={styles.left}>
        {/* Product image */}
        {product.image_id ? (
          // eslint-disable-next-line @next/next/no-img-element
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

        {/* Pricing summary — live via shared makingCost state */}
        <div className={styles.card}>
          <h3>Pricing</h3>
          <div className={styles.statRow}>
            <span>Labor Cost</span>
            <strong>{formatCurrency(product.labor_cost)}</strong>
          </div>
          <div className={styles.statRow}>
            <span>Making Cost</span>
            <strong>{formatCurrency(makingCost)}</strong>
          </div>
          <div className={styles.statRow}>
            <span>Selling Price</span>
            <strong className={styles.price}>{formatCurrency(product.selling_price)}</strong>
          </div>
          <div className={styles.statRow}>
            <span>Profit</span>
            <strong className={profitRs < 0 ? styles.profitLoss : styles.marginGood}>
              {formatCurrency(profitRs)}
            </strong>
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
          productId={product.$id}
          laborCost={product.labor_cost}
          sellingPrice={product.selling_price}
          initialBom={initialBom}
          allInventoryItems={allInventoryItems}
          onMakingCostChange={setMakingCost}
        />
      </div>
    </div>
  );
}
