"use client";

import { useState } from "react";
import type { Customer } from "@/lib/api/customers";
import type { Order } from "@/lib/api/orders";
import { OrderSheet } from "@/components/orders/OrderSheet";
import { OrderTable } from "@/components/orders/OrderTable";
import styles from "./OrderManagementTabs.module.css";

type Props = {
  orders: Order[];
  customers: Customer[];
  customerMap: Record<string, string>;
  orderInvoiceMap: Record<string, string>;
};

export function OrderManagementTabs({ orders, customers, customerMap, orderInvoiceMap }: Props) {
  const [view, setView] = useState<"sheet" | "detailed">("sheet");

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={view === "sheet" ? styles.tabActive : styles.tab}
          onClick={() => setView("sheet")}
        >
          Operations Sheet
        </button>
        <button
          type="button"
          className={view === "detailed" ? styles.tabActive : styles.tab}
          onClick={() => setView("detailed")}
        >
          Detailed Table
        </button>
      </div>

      {view === "sheet" ? (
        <OrderSheet initialOrders={orders} customers={customers} />
      ) : (
        <div className={styles.tableCard}>
          <OrderTable
            initialOrders={orders}
            customerMap={customerMap}
            orderInvoiceMap={orderInvoiceMap}
          />
        </div>
      )}
    </div>
  );
}
