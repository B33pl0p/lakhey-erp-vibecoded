"use client";

import Link from "next/link";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { useCart } from "@/lib/cart/useCart";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./page.module.css";

export function CartPageClient() {
  const { items, subtotal, isReady, updateQuantity, removeItem, clear } = useCart();

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <WebsiteNav />

        <header className={styles.header}>
          <p className={styles.kicker}>Your Cart</p>
          <h1>Review your selected products</h1>
          <p>Adjust quantities, remove items, or continue to checkout when everything looks right.</p>
        </header>

        {!isReady ? (
          <section className={styles.emptyCard}>
            <p>Loading cart...</p>
          </section>
        ) : items.length === 0 ? (
          <section className={styles.emptyCard}>
            <h2>Your cart is empty</h2>
            <p>Browse the catalog and add products before heading to checkout.</p>
            <Link href="/products" className={styles.primaryBtn}>Browse Products</Link>
          </section>
        ) : (
          <div className={styles.layout}>
            <div className={styles.list}>
              {items.map((item) => (
                <article key={item.id} className={styles.itemCard}>
                  <div className={styles.mediaWrap}>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className={styles.media} />
                    ) : (
                      <div className={styles.mediaFallback}>Lakhey Labs</div>
                    )}
                  </div>

                  <div className={styles.itemBody}>
                    <p className={styles.category}>{item.category}</p>
                    <h2>{item.name}</h2>
                    <p>{item.description || "Premium 3D printed product by Lakhey Labs."}</p>

                    <div className={styles.itemFooter}>
                      <label className={styles.qtyField}>
                        <span>Quantity</span>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, Math.max(1, Number(e.target.value) || 1))}
                        />
                      </label>

                      <div className={styles.priceBlock}>
                        <span>{formatCurrency(item.price)} each</span>
                        <strong>{formatCurrency(item.price * item.quantity)}</strong>
                      </div>
                    </div>

                    <div className={styles.itemActions}>
                      <Link href={`/products/${item.id}`} className={styles.secondaryBtn}>View Product</Link>
                      <button type="button" className={styles.ghostBtn} onClick={() => removeItem(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className={styles.summaryCard}>
              <h2>Cart Summary</h2>
              <div className={styles.summaryRows}>
                <div><span>Items</span><strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong></div>
                <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
                <div><span>Service Fee</span><strong>{formatCurrency(0)}</strong></div>
              </div>
              <div className={styles.totalRow}>
                <span>Total</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div className={styles.summaryActions}>
                <Link href="/order?cart=1" className={styles.primaryBtn}>Checkout Cart</Link>
                <Link href="/products" className={styles.secondaryBtn}>Continue Shopping</Link>
                <button type="button" className={styles.ghostBtn} onClick={clear}>Clear Cart</button>
              </div>
            </aside>
          </div>
        )}

        <WebsiteFooter />
      </section>
    </main>
  );
}
