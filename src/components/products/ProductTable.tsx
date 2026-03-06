"use client";

import { useState } from "react";
import type { Product } from "@/lib/api/products";
import { deleteProduct, toggleProductActive } from "@/lib/api/products";
import { getFilePreviewUrl } from "@/lib/api/storage";
import { useToast } from "@/components/ui/ToastContext";
import { Edit2, Trash2, Search, ImageIcon, Eye } from "lucide-react";
import Link from "next/link";
import styles from "./ProductTable.module.css";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { formatCurrency } from "@/lib/utils/currency";
import { useEffect } from "react";

const CATEGORIES = ["lamp", "print", "enclosure", "decor", "other"] as const;

function calcMargin(selling: number, making: number): string {
  if (!selling || selling === 0) return "—";
  const pct = ((selling - making) / selling) * 100;
  return `${pct.toFixed(1)}%`;
}

export function ProductTable({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    const loadImages = async () => {
      const urls: Record<string, string> = {};
      for (const p of initialProducts) {
        if (p.image_id) {
          urls[p.$id] = await getFilePreviewUrl(p.image_id, 60, 60);
        }
      }
      setImageUrls(urls);
    };
    loadImages();
  }, [initialProducts]);

  const handleToggleActive = async (product: Product) => {
    setTogglingId(product.$id);
    try {
      await toggleProductActive(product.$id, !product.is_active);
      setProducts(prev =>
        prev.map(p => p.$id === product.$id ? { ...p, is_active: !p.is_active } : p)
      );
      toast(`Product ${!product.is_active ? "activated" : "deactivated"}`, "success");
    } catch {
      toast("Failed to update product status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteProduct(deletingId);
      setProducts(prev => prev.filter(p => p.$id !== deletingId));
      toast("Product deleted", "success");
    } catch {
      toast("Error deleting product", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Selling Price</th>
              <th>Making Cost</th>
              <th>Margin</th>
              <th>Active</th>
              <th className={styles.actionsCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>No products found.</td>
              </tr>
            ) : null}
            {filtered.map(p => (
              <tr key={p.$id} className={!p.is_active ? styles.inactiveRow : ""}>
                <td className={styles.imageCell}>
                  <div className={styles.thumbnail}>
                    {imageUrls[p.$id]
                      /* eslint-disable-next-line @next/next/no-img-element */
                      ? <img src={imageUrls[p.$id]} alt={p.name} />
                      : <div className={styles.thumbPlaceholder}><ImageIcon size={16} /></div>
                    }
                  </div>
                </td>
                <td className={styles.nameCell}>{p.name}</td>
                <td className={styles.capitalize}>{p.category}</td>
                <td>{formatCurrency(p.selling_price)}</td>
                <td>{formatCurrency(p.making_cost)}</td>
                <td>
                  <span className={styles.marginBadge}>
                    {calcMargin(p.selling_price, p.making_cost)}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleToggleActive(p)}
                    disabled={togglingId === p.$id}
                    className={`${styles.toggle} ${p.is_active ? styles.toggleOn : styles.toggleOff}`}
                    title={p.is_active ? "Click to deactivate" : "Click to activate"}
                  >
                    {p.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className={styles.actionsCell}>
                  <Link href={`/products/${p.$id}`} className={styles.viewBtn} title="View / BOM">
                    <Eye size={16} />
                  </Link>
                  <Link href={`/products/${p.$id}/edit`} className={styles.editBtn} title="Edit">
                    <Edit2 size={16} />
                  </Link>
                  <button onClick={() => setDeletingId(p.$id)} className={styles.deleteBtn} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Product?"
        message="This will permanently delete the product. Any linked BOM entries will also be removed. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
