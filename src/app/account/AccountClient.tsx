"use client";

import { useState, useTransition } from "react";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import {
  cancelWebsiteOrderAction,
  loginCustomerAction,
  logoutCustomerAction,
  signupCustomerAction,
  type WebsiteCustomerOrderSummary,
} from "@/lib/api/customerAuth";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./page.module.css";

type Props = {
  nextPath: string;
  user: { name?: string; email: string } | null;
  orders: WebsiteCustomerOrderSummary[];
};

function toTitleCase(input: string) {
  return input
    .replaceAll("_", " ")
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function AccountClient({ nextPath, user, orders }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [orderList, setOrderList] = useState(orders);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancelOrder(orderId: string) {
    if (!window.confirm("Cancel this order? This is only possible while it is still pending.")) return;

    setError(null);
    setCancelingOrderId(orderId);

    startTransition(async () => {
      const result = await cancelWebsiteOrderAction({ orderId });
      if (result.error) {
        setError(result.error);
        setCancelingOrderId(null);
        return;
      }

      if (result.order) {
        setOrderList((prev) => prev.map((order) => (
          order.orderId === orderId
            ? { ...order, status: result.order!.status, updatedAt: result.order!.updatedAt }
            : order
        )));
      }

      setCancelingOrderId(null);
    });
  }

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    startTransition(async () => {
      const result = await loginCustomerAction({ email, password, nextPath });
      if (result?.error) setError(result.error);
    });
  }

  function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;

    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
    const address = (form.elements.namedItem("address") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    startTransition(async () => {
      const result = await signupCustomerAction({ name, email, phone, address, password, nextPath });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <WebsiteNav />
        <div className={styles.header}>
          <p className={styles.kicker}>Lakhey Labs Account</p>
          <h1>Login or create account to place orders</h1>
          <p>
            Customer orders require an account so we can keep your delivery details, order history, and contact updates
            in sync with our production dashboard.
          </p>
        </div>

        {user ? (
          <div className={styles.loggedInLayout}>
            <div className={styles.loggedInBox}>
              <h2>Your account</h2>
              <p>
                <strong>{user.name || "Customer"}</strong>
                <span>{user.email}</span>
              </p>
              <div className={styles.loggedInActions}>
                <a href={nextPath} className={styles.primaryBtn}>Place New Order</a>
                <a href="/track" className={styles.secondaryBtn}>Track My Orders</a>
                <form action={logoutCustomerAction}>
                  <button className={styles.secondaryBtn} type="submit">Logout</button>
                </form>
              </div>
            </div>

            <div className={styles.historyCard}>
              <div className={styles.historyHead}>
                <div>
                  <h2>Order history</h2>
                  <p>Your recent website orders and latest statuses.</p>
                </div>
                {orderList.length > 0 ? (
                  <a href="/track" className={styles.secondaryBtn}>Open Tracker</a>
                ) : null}
              </div>

              {orderList.length > 0 ? (
                <div className={styles.historyList}>
                  {orderList.map((order) => (
                    <div key={order.orderId} className={styles.historyItem}>
                      <a href={`/track?order=${order.orderId}`} className={styles.historyTitleLink}>
                        <strong>{order.title}</strong>
                        <span>Order #{order.orderId}</span>
                      </a>
                      <div className={styles.historyMeta}>
                        <span className={styles.statusBadge}>{toTitleCase(order.status)}</span>
                        <span>{formatCurrency(order.totalPrice)}</span>
                        <span>{new Date(order.updatedAt).toLocaleDateString("en-NP", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}</span>
                      </div>
                      {order.status === "pending" ? (
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          disabled={cancelingOrderId === order.orderId}
                          onClick={() => handleCancelOrder(order.orderId)}
                        >
                          {cancelingOrderId === order.orderId ? "Cancelling..." : "Cancel Order"}
                        </button>
                      ) : (
                        <p className={styles.cancelNote}>Cancellation is only available while an order is pending.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <strong>No orders yet</strong>
                  <p>Once you place an order, it will appear here automatically.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            <form className={styles.card} onSubmit={handleLogin}>
              <h2>Login</h2>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Password
                <input name="password" type="password" required />
              </label>
              <button type="submit" className={styles.primaryBtn} disabled={isPending}>
                {isPending ? "Please wait..." : "Login"}
              </button>
            </form>

            <form className={styles.card} onSubmit={handleSignup}>
              <h2>Sign up</h2>
              <label>
                Full Name
                <input name="name" required />
              </label>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Phone
                <input name="phone" required />
              </label>
              <label>
                Address
                <input name="address" required />
              </label>
              <label>
                Password (min 8 chars)
                <input name="password" type="password" minLength={8} required />
              </label>
              <button type="submit" className={styles.primaryBtn} disabled={isPending}>
                {isPending ? "Please wait..." : "Create account"}
              </button>
            </form>
          </div>
        )}

        {error ? <p className={styles.error}>{error}</p> : null}
        <WebsiteFooter />
      </section>
    </main>
  );
}
