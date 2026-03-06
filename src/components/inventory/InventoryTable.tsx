"use client";

import { useState, useEffect } from "react";
import type { InventoryItem } from "@/lib/api/inventory";
import { deleteInventoryItem } from "@/lib/api/inventory";
import { getFilePreviewUrl } from "@/lib/api/storage";
import { useToast } from "@/components/ui/ToastContext";
import { Edit2, Trash2, Search, AlertCircle, ImageIcon } from "lucide-react";
import Link from "next/link";
import styles from "./InventoryTable.module.css";
import { formatCurrency } from "@/lib/utils/currency";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function InventoryTable({ initialItems }: { initialItems: InventoryItem[] }) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    // Load image previews for all items that have an image_id
    const loadImages = async () => {
      const urls: Record<string, string> = {};
      for (const item of initialItems) {
        if (item.image_id) {
          urls[item.$id] = await getFilePreviewUrl(item.image_id, 100, 100);
        }
      }
      setImageUrls(urls);
    };
    loadImages();
  }, [initialItems]);

  // Stock adjustments are now handled exclusively through the Edit item form.

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteInventoryItem(deletingId);
      setItems(prev => prev.filter(i => i.$id !== deletingId));
      toast("Item deleted successfully", "success");
    } catch {
      toast("Error deleting item. It might be used in a Product BOM.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                         (item.supplier && item.supplier.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name or supplier..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="filament">Filament</option>
          <option value="resin">Resin</option>
          <option value="electronics">Electronics</option>
          <option value="wire">Wire</option>
          <option value="hardware">Hardware</option>
          <option value="packaging">Packaging</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Unit Cost</th>
              <th>Supplier</th>
              <th className={styles.actionsCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>No items found matching your filters.</td>
              </tr>
            ) : null}
            {filteredItems.map(item => {
              const isLowStock = item.stock_qty <= item.low_stock_threshold;
              
              return (
                <tr key={item.$id} className={isLowStock ? styles.lowStockRow : ""}>
                  <td className={styles.imageCell}>
                    <div className={styles.thumbnailWrapper}>
                      {imageUrls[item.$id] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={imageUrls[item.$id]} alt={item.name} className={styles.thumbnail} />
                      ) : (
                        <div className={styles.thumbnailPlaceholder}><ImageIcon size={18} /></div>
                      )}
                      {isLowStock && (
                        <div className={styles.lowStockBadge} title="Low Stock">
                          <AlertCircle size={14} color="#fff" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={styles.nameCell}>
                    <div className={styles.itemName}>{item.name}</div>
                    {isLowStock && <div className={styles.lowStockText}>Below threshold ({item.low_stock_threshold})</div>}
                  </td>
                  <td className={styles.capitalize}>{item.category}</td>
                  <td>
                    <div className={styles.stockControls}>
                      <span className={styles.qty}>{item.stock_qty}</span>
                      <span className={styles.unit}>{item.unit}</span>
                    </div>
                  </td>
                  <td>{formatCurrency(item.unit_cost)}</td>
                  <td className={styles.supplierText}>{item.supplier || '-'}</td>
                  <td className={styles.actionsCell}>
                    <Link href={`/inventory/${item.$id}/edit`} className={styles.editBtn}>
                      <Edit2 size={16} />
                    </Link>
                    <button onClick={() => setDeletingId(item.$id)} className={styles.deleteBtn}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog 
        isOpen={!!deletingId}
        title="Delete Inventory Item?"
        message="Are you sure you want to delete this specific item? This action is permanent and might fail if the item is currently used in any Product Bill of Materials."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
