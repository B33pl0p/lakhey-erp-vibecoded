"use client";

import { useMemo, useState, useTransition } from "react";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { trackWebsiteOrderAction, type WebsiteTrackedOrder } from "@/lib/api/customerAuth";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./page.module.css";

type Props = {
  initialOrderId?: string;
  initialEmail?: string;
};

const statusSteps = ["pending", "printing", "done", "delivered", "paid"];

function toTitleCase(input: string) {
  return input
    .replaceAll("_", " ")
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function TrackPageClient({ initialOrderId = "", initialEmail = "" }: Props) {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<WebsiteTrackedOrder | null>(null);
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
        setOrder(null);
        setError(res.error);
        return;
      }
      setOrder(res.order || null);
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <WebsiteNav />
        <header className={styles.header}>
          <p className={styles.kicker}>Order Tracking</p>
          <h1>Track your order</h1>
          <p>Enter your order ID and email to see the latest status.</p>
        </header>

        <form className={styles.formCard} onSubmit={onSubmit}>
          <label>
            Order ID
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="e.g. 69ad13f..." required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>
          <button type="submit" className={styles.primaryBtn} disabled={isPending}>
            {isPending ? "Checking..." : "Track Order"}
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
