"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { createWebsiteOrderAction } from "@/lib/api/customerAuth";
import { formatCurrency } from "@/lib/utils/currency";
import styles from "./page.module.css";

type ProductOption = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string | null;
};

type Props = {
  products: ProductOption[];
  selectedProductId?: string;
  userEmail: string;
};

export function OrderPageClient({ products, selectedProductId, userEmail }: Props) {
  const router = useRouter();
  const fallbackProductId = products[0]?.id || "";
  const hasPreselectedProduct = !!selectedProductId && products.some((product) => product.id === selectedProductId);
  const [productId, setProductId] = useState(hasPreselectedProduct ? selectedProductId : fallbackProductId);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [productId, products]
  );

  const subtotal = (selectedProduct?.price || 0) * quantity;
  const serviceFee = 0;
  const grandTotal = subtotal + serviceFee;

  useEffect(() => {
    if (!placedOrderId) return;

    const timeout = window.setTimeout(() => {
      router.push("/products?ordered=1");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [placedOrderId, router]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPlacedOrderId(null);

    startTransition(async () => {
      const result = await createWebsiteOrderAction({
        productId,
        quantity,
        phone,
        address,
        notes,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSuccess("Order placed successfully.");
      setPlacedOrderId(result?.orderId || null);
      setQuantity(1);
      setNotes("");
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <WebsiteNav />

        <div className={styles.head}>
          <p className={styles.kicker}>Secure Order Portal</p>
          <h1>{hasPreselectedProduct ? "Complete your order" : "Place your order"}</h1>
          <p>
            Logged in as <strong>{userEmail}</strong>. This order will be added directly to Lakhey Labs ERP dashboard.
          </p>
        </div>

        <div className={styles.layout}>
          <form className={styles.card} onSubmit={onSubmit}>
            {hasPreselectedProduct && selectedProduct ? (
              <div className={styles.lockedProduct}>
                <span>Selected Product</span>
                <strong>{selectedProduct.name}</strong>
                <small>{selectedProduct.category}</small>
                <Link href="/products" className={styles.textLink}>
                  Choose a different product
                </Link>
              </div>
            ) : (
              <label>
                Select Product
                <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className={styles.row}>
              <label>
                Quantity
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  required
                />
              </label>
              <div className={styles.priceBox}>
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
            </div>

            <label>
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>

            <label>
              Delivery Address
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required />
            </label>

            <label>
              Order Notes (optional)
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </label>

            <div className={styles.footer}>
              <Link href="/products" className={styles.secondaryBtn}>Other Products</Link>
              <button type="submit" className={styles.primaryBtn} disabled={isPending || !selectedProduct}>
                {isPending ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </form>

          <aside className={styles.summaryCard}>
            <h2>Order Summary</h2>
            {selectedProduct ? (
              <>
                <div className={styles.productPreview}>
                  {selectedProduct.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className={styles.previewImage} />
                  ) : (
                    <div className={styles.previewFallback}>Lakhey Labs</div>
                  )}
                  <div className={styles.previewInfo}>
                    <p className={styles.category}>{selectedProduct.category}</p>
                    <h3>{selectedProduct.name}</h3>
                    <p>{selectedProduct.description || "Premium 3D printed product."}</p>
                  </div>
                </div>

                <div className={styles.summaryRows}>
                  <div><span>Unit Price</span><strong>{formatCurrency(selectedProduct.price)}</strong></div>
                  <div><span>Quantity</span><strong>{quantity}</strong></div>
                  <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
                  <div><span>Service Fee</span><strong>{formatCurrency(serviceFee)}</strong></div>
                </div>
                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <strong>{formatCurrency(grandTotal)}</strong>
                </div>
              </>
            ) : (
              <p className={styles.empty}>No product selected.</p>
            )}
          </aside>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}
        {success ? (
          <div className={styles.successBox}>
            <p className={styles.success}>{success}</p>
            {placedOrderId ? (
              <div className={styles.successMeta}>
                <span>Order ID: {placedOrderId}</span>
                <span>Redirecting to products...</span>
                <div className={styles.successActions}>
                  <Link href={`/track?order=${placedOrderId}`} className={styles.primaryBtn}>
                    Track This Order
                  </Link>
                  <Link href="/track" className={styles.secondaryBtn}>
                    Open Tracker
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <WebsiteFooter />
      </section>
    </main>
  );
}
