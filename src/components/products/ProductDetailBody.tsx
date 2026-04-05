"use client";

import { useState } from "react";
import { BomEditor } from "./BomEditor";
import { formatCurrency } from "@/lib/utils/currency";
import type { Product } from "@/lib/api/products";
import type { BomLine } from "@/lib/api/productMaterials";
import type { InventoryItem } from "@/lib/api/inventory";
import { Package } from "lucide-react";
import styles from "@/app/admin/products/[id]/page.module.css";

interface Props {
  product: Product;
  initialBom: BomLine[];
  allInventoryItems: InventoryItem[];
}

export function ProductDetailBody({ product, initialBom, allInventoryItems }: Props) {
  const [makingCost, setMakingCost] = useState(product.making_cost);
  const imageIds = product.image_ids?.length ? product.image_ids : (product.image_id ? [product.image_id] : []);

  const profitRs = product.selling_price - makingCost;
  const marginPct =
    product.selling_price > 0
      ? (profitRs / product.selling_price) * 100
      : 0;

  return (
    <div className={styles.layout}>
      {/* Left: info cards */}
      <div className={styles.left}>
        {/* Product images */}
        {imageIds.length > 0 ? (
          <div className={styles.imageGallery}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${imageIds[0]}/preview?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&width=700&height=700`}
              alt={product.name}
              className={styles.productImage}
            />
            {imageIds.length > 1 ? (
              <div className={styles.thumbRow}>
                {imageIds.slice(1).map((imageId) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={imageId}
                    src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${imageId}/preview?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&width=220&height=220`}
                    alt={`${product.name} thumbnail`}
                    className={styles.thumbImage}
                  />
                ))}
              </div>
            ) : null}
          </div>
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
