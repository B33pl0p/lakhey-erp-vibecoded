"use client";

import { useState } from "react";
import type { Order, OrderStatus } from "@/lib/api/orders";
import { deleteOrder, updateOrderStatus } from "@/lib/api/orders";
import { useToast } from "@/components/ui/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Edit2, Trash2, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./OrderTable.module.css";

interface OrderTableProps {
  initialOrders: Order[];
  customerMap: Record<string, string>; // id → name
}

const STATUS_OPTIONS: OrderStatus[] = ["pending", "printing", "done", "delivered", "cancelled"];

export function OrderTable({ initialOrders, customerMap }: OrderTableProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteOrder(deletingId);
      setOrders(prev => prev.filter(o => o.$id !== deletingId));
      toast("Order deleted", "success");
    } catch {
      toast("Error deleting order", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    setUpdatingId(id);
    try {
      await updateOrderStatus(id, status);
      setOrders(prev => prev.map(o => o.$id === id ? { ...o, status } : o));
      toast("Status updated", "success");
    } catch {
      toast("Error updating status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter(o => {
    const customerName = customerMap[o.customer_id] || "";
    const q = search.toLowerCase();
    const matchSearch =
      o.title.toLowerCase().includes(q) ||
      customerName.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by title or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Status</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Deadline</th>
              <th className={styles.actionsCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  <div className={styles.emptyContent}>
                    <ShoppingCart size={40} />
                    <p>No orders found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(order => {
                const deadline = order.deadline
                  ? new Date(order.deadline).toLocaleDateString("en-NP")
                  : null;
                const isOverdue =
                  order.deadline &&
                  new Date(order.deadline) < new Date() &&
                  order.status !== "delivered" &&
                  order.status !== "cancelled";

                return (
                  <tr key={order.$id}>
                    <td>
                      <Link href={`/orders/${order.$id}`} className={styles.titleLink}>
                        {order.title}
                      </Link>
                    </td>
                    <td className={styles.muted}>
                      {customerMap[order.customer_id] || "—"}
                    </td>
                    <td>
                      <span className={order.is_product ? styles.typeBadgeProduct : styles.typeBadgeCustom}>
                        {order.is_product ? "Catalog" : "Custom"}
                      </span>
                    </td>
                    <td>
                      <select
                        className={styles.statusSelect}
                        value={order.status}
                        disabled={updatingId === order.$id}
                        onChange={e => handleStatusChange(order.$id, e.target.value as OrderStatus)}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <Badge status={order.status} />
                    </td>
                    <td className={styles.muted}>{order.quantity}</td>
                    <td className={styles.price}>{formatCurrency(order.total_price)}</td>
                    <td className={isOverdue ? styles.overdue : styles.muted}>
                      {deadline || "—"}
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actions}>
                        <Link href={`/orders/${order.$id}/edit`} className={styles.editBtn} title="Edit">
                          <Edit2 size={16} />
                        </Link>
                        <button
                          className={styles.deleteBtn}
                          title="Delete"
                          onClick={() => setDeletingId(order.$id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Order"
        message="Are you sure you want to delete this order? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
