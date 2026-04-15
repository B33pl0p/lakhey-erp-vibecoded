"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, Copy, ExternalLink, Phone, Search } from "lucide-react";
import type { Customer } from "@/lib/api/customers";
import type { Order, OrderStatus } from "@/lib/api/orders";
import { updateOrderStatus } from "@/lib/api/orders";
import { useToast } from "@/components/ui/ToastContext";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./OrderSheet.module.css";

type Props = {
  initialOrders: Order[];
  customers: Customer[];
};

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "printing", "done", "delivered"];

function paymentLabel(order: Order) {
  const advance = order.advance_paid ?? 0;
  if (order.status === "paid") return `${formatCurrency(order.total_price)} (paid)`;
  if (advance > 0) return `${formatCurrency(order.total_price)} (${formatCurrency(advance)} adv, ${formatCurrency(Math.max(0, order.total_price - advance))} due)`;
  return `${formatCurrency(order.total_price)} (not paid)`;
}

function toSheetDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function toTitleCase(input: string) {
  return input
    .replaceAll("_", " ")
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function OrderSheet({ initialOrders, customers }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const customerMap = useMemo(() => new Map(customers.map((customer) => [customer.$id, customer])), [customers]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      const customer = customerMap.get(order.customer_id);
      const haystack = [
        order.title,
        customer?.name,
        customer?.phone,
        customer?.email,
        customer?.address,
        order.delivery_address,
        order.status,
      ].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || ACTIVE_STATUSES.includes(order.status);
      return matchesQuery && matchesStatus;
    });
  }, [customerMap, orders, query, statusFilter]);

  async function copyText(text: string, label: string) {
    if (!text.trim()) {
      toast(`No ${label} to copy`, "info");
      return;
    }

    await navigator.clipboard.writeText(text);
    toast(`${label} copied`, "success");
  }

  async function confirmOrder(orderId: string) {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, "confirmed");
      setOrders((prev) => prev.map((order) => order.$id === orderId ? { ...order, status: "confirmed" } : order));
      toast("Order confirmed", "success");
    } catch {
      toast("Could not confirm order", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className={styles.sheetCard}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customer, phone, address, order..."
          />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "active" | "all")}>
          <option value="active">Active sheet</option>
          <option value="all">All orders</option>
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.sheetTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Amount / Payment</th>
              <th>Status</th>
              <th>Quick</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>No orders in this sheet.</td>
              </tr>
            ) : filteredOrders.map((order) => {
              const customer = customerMap.get(order.customer_id);
              const phone = customer?.phone || "";
              const address = order.delivery_address || customer?.address || "";
              const telHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : "#";

              return (
                <tr key={order.$id}>
                  <td className={styles.dateCell}>{toSheetDate(order.$createdAt)}</td>
                  <td className={styles.orderCell}>
                    <Link href={`/admin/orders/${order.$id}`}>{order.title}</Link>
                    <span>{order.is_product ? "Catalog" : "Custom"} · Qty {order.quantity}</span>
                  </td>
                  <td>{customer?.name || "—"}</td>
                  <td className={styles.phoneCell}>{phone || "—"}</td>
                  <td className={styles.addressCell}>{address || "—"}</td>
                  <td className={styles.amountCell}>{paymentLabel(order)}</td>
                  <td>
                    <span className={`${styles.statusPill} ${styles[`status_${order.status}`] || ""}`.trim()}>
                      {toTitleCase(order.status)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.quickActions}>
                      <button type="button" onClick={() => copyText(address, "Address")} title="Copy address">
                        <Copy size={14} />
                      </button>
                      <a href={telHref} aria-disabled={!phone} title="Call customer">
                        <Phone size={14} />
                      </a>
                      {order.status === "pending" ? (
                        <button type="button" disabled={updatingId === order.$id} onClick={() => confirmOrder(order.$id)} title="Confirm order">
                          <CheckCircle size={14} />
                        </button>
                      ) : null}
                      <Link href={`/admin/orders/${order.$id}`} title="Open order">
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
