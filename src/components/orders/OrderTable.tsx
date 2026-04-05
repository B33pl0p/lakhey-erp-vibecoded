"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/lib/api/orders";
import { deleteOrder, updateOrderStatus, convertOrderToInvoice } from "@/lib/api/orders";
import { useToast } from "@/components/ui/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Edit2, Trash2, Search, ShoppingCart, FileText } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./OrderTable.module.css";

interface OrderTableProps {
  initialOrders: Order[];
  customerMap: Record<string, string>; // id → name
  orderInvoiceMap?: Record<string, string>; // orderId → invoiceId
}

const STATUS_OPTIONS: OrderStatus[] = ["pending", "printing", "done", "delivered", "paid", "cancelled"];

export function OrderTable({ initialOrders, customerMap, orderInvoiceMap = {} }: OrderTableProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [invoiceMap, setInvoiceMap] = useState<Record<string, string>>(orderInvoiceMap);
  const { toast } = useToast();

  const handleConvertToInvoice = async (orderId: string) => {
    setConfirmOrderId(null);
    setConvertingId(orderId);
    try {
      const { invoiceId } = await convertOrderToInvoice(orderId);
      setInvoiceMap(prev => ({ ...prev, [orderId]: invoiceId }));
      toast("Invoice created successfully", "success");
    } catch {
      toast("Error creating invoice", "error");
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteOrder(deletingId);
      setOrders(prev => prev.filter(o => o.$id !== deletingId));
      toast("Order deleted", "success");
      router.refresh();
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
      if (status === 'paid') {
        toast("Order marked as paid — invoice auto-created", "success");
      } else {
        toast("Status updated", "success");
      }
      router.refresh();
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
              <th>Created</th>
              <th className={styles.actionsCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.emptyState}>
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
                const createdAt = new Date(order.$createdAt).toLocaleDateString("en-NP", {
                  year: "numeric", month: "short", day: "numeric",
                });
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const deadlineStart = order.deadline ? new Date(`${order.deadline}T00:00:00`) : null;
                const isOverdue =
                  deadlineStart &&
                  deadlineStart < todayStart &&
                  order.status !== "delivered" &&
                  order.status !== "paid" &&
                  order.status !== "cancelled";

                return (
                  <tr key={order.$id}>
                    <td>
                      <Link href={`/admin/orders/${order.$id}`} className={styles.titleLink}>
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
                    <td className={styles.price}>
                      {formatCurrency(order.total_price)}
                      {order.advance_paid != null && order.advance_paid > 0 && (
                        <span className={styles.advanceBadge} title={`Advance: ${formatCurrency(order.advance_paid)}`}>
                          Adv. {formatCurrency(order.advance_paid)}
                        </span>
                      )}
                    </td>
                    <td className={isOverdue ? styles.overdue : styles.muted}>
                      {deadline || "—"}
                    </td>
                    <td className={styles.muted}>{createdAt}</td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actions}>
                        {invoiceMap[order.$id] ? (
                          <Link
                            href={`/admin/invoices/${invoiceMap[order.$id]}`}
                            className={styles.invoiceViewBtn}
                            title="View Invoice"
                          >
                            <FileText size={14} />
                            <span>Invoice</span>
                          </Link>
                        ) : confirmOrderId === order.$id ? (
                          <span className={styles.confirmInline}>
                            <span className={styles.confirmText}>Convert to invoice?</span>
                            <button
                              className={styles.confirmYes}
                              disabled={convertingId === order.$id}
                              onClick={() => handleConvertToInvoice(order.$id)}
                            >
                              {convertingId === order.$id ? "…" : "Yes"}
                            </button>
                            <button
                              className={styles.confirmNo}
                              onClick={() => setConfirmOrderId(null)}
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            className={styles.convertBtn}
                            title="Convert to Invoice"
                            disabled={convertingId === order.$id}
                            onClick={() => setConfirmOrderId(order.$id)}
                          >
                            <FileText size={14} />
                            <span>→ Invoice</span>
                          </button>
                        )}
                        <Link href={`/admin/orders/${order.$id}/edit`} className={styles.editBtn} title="Edit">
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
