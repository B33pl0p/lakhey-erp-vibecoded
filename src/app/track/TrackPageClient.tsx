"use client";

import { useMemo, useState, useTransition } from "react";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { trackWebsiteOrderAction, type WebsiteTrackedOrder } from "@/lib/api/customerAuth";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./page.module.css";

type Props = {
  user: { name?: string; email: string } | null;
  initialOrderId?: string;
  initialEmail?: string;
  initialOrders: WebsiteTrackedOrder[];
};

const statusSteps = ["pending", "printing", "done", "delivered", "paid"];

function toTitleCase(input: string) {
  return input
    .replaceAll("_", " ")
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function TrackPageClient({ user, initialOrderId = "", initialEmail = "", initialOrders }: Props) {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState(initialOrders);
  const [order, setOrder] = useState<WebsiteTrackedOrder | null>(
    initialOrders.find((item) => item.orderId === initialOrderId) || initialOrders[0] || null
  );
  const [isPending, startTransition] = useTransition();

  const currentStep = useMemo(() => {
    if (!order) return -1;
    const idx = statusSteps.indexOf(order.status);
    return idx === -1 ? 0 : idx;
  }, [order]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await trackWebsiteOrderAction({ orderId, email });
      if (res.error) {
        if (!orders.length) {
          setOrder(null);
        }
        setError(res.error);
        return;
      }

      const nextOrder = res.order || null;

      if (nextOrder) {
        setOrders((prev) => {
          const existing = prev.find((item) => item.orderId === nextOrder.orderId);
          if (existing) {
            return prev.map((item) => (item.orderId === nextOrder.orderId ? nextOrder : item));
          }
          return [nextOrder, ...prev];
        });
      }

      setOrder(nextOrder);
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <WebsiteNav />
        <header className={styles.header}>
          <p className={styles.kicker}>Order Tracking</p>
          <h1>{user ? "Your orders" : "Track your order"}</h1>
          <p>
            {user
              ? "Your latest orders are already linked to your account. Tap any order to open its full status."
              : "Enter your order ID and email to see the latest status."}
          </p>
        </header>

        {user ? (
          <section className={styles.accountCard}>
            <div>
              <p className={styles.resultKicker}>Signed in as</p>
              <h2>{user.name || "Customer"}</h2>
              <p className={styles.accountSubtle}>{user.email}</p>
            </div>
            <a href="/order" className={styles.primaryBtn}>Place Another Order</a>
          </section>
        ) : null}

        {orders.length > 0 ? (
          <section className={styles.orderListCard}>
            <div className={styles.orderListHead}>
              <div>
                <p className={styles.resultKicker}>Order history</p>
                <h2>Open any order in one tap</h2>
              </div>
            </div>

            <div className={styles.orderList}>
              {orders.map((item) => (
                <button
                  key={item.orderId}
                  type="button"
                  className={`${styles.orderListItem} ${order?.orderId === item.orderId ? styles.orderListItemActive : ""}`.trim()}
                  onClick={() => {
                    setOrder(item);
                    setOrderId(item.orderId);
                    setError(null);
                  }}
                >
                  <div>
                    <strong>{item.title}</strong>
                    <span>Order #{item.orderId}</span>
                  </div>
                  <div className={styles.orderListMeta}>
                    <span className={styles.statusBadge}>{toTitleCase(item.status)}</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <form className={styles.formCard} onSubmit={onSubmit}>
          <div className={styles.formIntro}>
            <strong>{user ? "Find a specific order" : "Guest lookup"}</strong>
            <span>
              {user
                ? "Paste an order ID if you want to jump directly to one order."
                : "Use your order ID and email if you are not logged in."}
            </span>
          </div>
          <label>
            Order ID
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="e.g. 69ad13f..." required />
          </label>
          {!user ? (
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </label>
          ) : (
            <div className={styles.identityChip}>
              Using account email <strong>{user.email}</strong>
            </div>
          )}
          <button type="submit" className={styles.primaryBtn} disabled={isPending}>
            {isPending ? "Checking..." : user ? "Open Order" : "Track Order"}
          </button>
        </form>

        {error ? <p className={styles.error}>{error}</p> : null}

        {order ? (
          <section className={styles.resultCard}>
            <div className={styles.resultHead}>
              <div>
                <p className={styles.resultKicker}>Order #{order.orderId}</p>
                <h2>{order.title}</h2>
              </div>
              <span className={styles.statusBadge}>{toTitleCase(order.status)}</span>
            </div>

            <div className={styles.timeline}>
              {statusSteps.map((step, index) => (
                <div
                  key={step}
                  className={`${styles.step} ${index <= currentStep ? styles.stepActive : ""}`}
                >
                  <div className={styles.dot} />
                  <span>{toTitleCase(step)}</span>
                </div>
              ))}
            </div>

            <div className={styles.metaGrid}>
              <div><span>Quantity</span><strong>{order.quantity}</strong></div>
              <div><span>Unit Price</span><strong>{formatCurrency(order.unitPrice)}</strong></div>
              <div><span>Total</span><strong>{formatCurrency(order.totalPrice)}</strong></div>
              <div><span>Last Updated</span><strong>{new Date(order.updatedAt).toLocaleString("en-NP")}</strong></div>
            </div>

            {order.deliveryAddress ? (
              <div className={styles.block}>
                <span>Delivery Address</span>
                <p>{order.deliveryAddress}</p>
              </div>
            ) : null}

            {order.notes ? (
              <div className={styles.block}>
                <span>Notes</span>
                <p>{order.notes}</p>
              </div>
            ) : null}
          </section>
        ) : null}
        <WebsiteFooter />
      </section>
    </main>
  );
}
