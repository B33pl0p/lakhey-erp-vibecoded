"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { createWebsiteCartOrderAction, createWebsiteOrderAction } from "@/lib/api/customerAuth";
import { useCart } from "@/lib/cart/useCart";
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
  checkoutMode: "single" | "cart";
};

export function OrderPageClient({ products, selectedProductId, userEmail, checkoutMode }: Props) {
  const router = useRouter();
  const { items: cartItems, isReady, clear } = useCart();
  const isCartCheckout = checkoutMode === "cart";
  const fallbackProductId = products[0]?.id || "";
  const hasPreselectedProduct = !isCartCheckout && !!selectedProductId && products.some((product) => product.id === selectedProductId);
  const [productId, setProductId] = useState(hasPreselectedProduct ? selectedProductId : fallbackProductId);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [placedOrderIds, setPlacedOrderIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [productId, products]
  );

  const cartDisplayItems = useMemo(
    () => cartItems.map((item) => {
      const matchedProduct = products.find((product) => product.id === item.id);
      return {
        ...item,
        name: matchedProduct?.name || item.name,
        description: matchedProduct?.description || item.description,
        imageUrl: matchedProduct?.imageUrl ?? item.imageUrl,
        price: matchedProduct?.price ?? item.price,
      };
    }),
    [cartItems, products]
  );

  const singleSubtotal = (selectedProduct?.price || 0) * quantity;
  const subtotal = isCartCheckout
    ? cartDisplayItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : singleSubtotal;
  const serviceFee = 0;
  const grandTotal = subtotal + serviceFee;
  const totalCartUnits = cartDisplayItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (placedOrderIds.length === 0) return;

    const timeout = window.setTimeout(() => {
      router.push("/products?ordered=1");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [placedOrderIds, router]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPlacedOrderIds([]);

    startTransition(async () => {
      if (isCartCheckout) {
        if (!isReady || cartDisplayItems.length === 0) {
          setError("Your cart is empty.");
          return;
        }

        const result = await createWebsiteCartOrderAction({
          items: cartDisplayItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
          phone,
          address,
          notes,
        });

        if (result?.error) {
          setError(result.error);
          return;
        }

        const orderIds = result?.orderIds || [];
        setSuccess(`${orderIds.length} order${orderIds.length === 1 ? "" : "s"} placed successfully.`);
        setPlacedOrderIds(orderIds);
        clear();
        setNotes("");
        return;
      }

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
      setPlacedOrderIds(result?.orderId ? [result.orderId] : []);
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
          <h1>{isCartCheckout ? "Checkout your cart" : hasPreselectedProduct ? "Complete your order" : "Place your order"}</h1>
          <p>
            Logged in as <strong>{userEmail}</strong>. This order will be added directly to Lakhey Labs ERP dashboard.
          </p>
        </div>

        <div className={styles.layout}>
          <form className={styles.card} onSubmit={onSubmit}>
            {isCartCheckout ? (
              <div className={styles.lockedProduct}>
                <span>Cart Checkout</span>
                <strong>{isReady ? `${cartDisplayItems.length} product${cartDisplayItems.length === 1 ? "" : "s"}` : "Loading cart"}</strong>
                <small>{isReady ? `${totalCartUnits} total item${totalCartUnits === 1 ? "" : "s"}` : "Preparing cart summary"}</small>
                <Link href="/cart" className={styles.textLink}>
                  Review cart items
                </Link>
              </div>
            ) : hasPreselectedProduct && selectedProduct ? (
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
              {isCartCheckout ? (
                <div className={styles.priceBox}>
                  <span>Cart Items</span>
                  <strong>{isReady ? totalCartUnits : 0}</strong>
                </div>
              ) : (
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
              )}
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
              <Link href={isCartCheckout ? "/cart" : "/products"} className={styles.secondaryBtn}>
                {isCartCheckout ? "Back to Cart" : "Other Products"}
              </Link>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isPending || (isCartCheckout ? !isReady || cartDisplayItems.length === 0 : !selectedProduct)}
              >
                {isPending ? "Placing Order..." : isCartCheckout ? "Place Cart Order" : "Place Order"}
              </button>
            </div>
          </form>

          <aside className={styles.summaryCard}>
            <h2>{isCartCheckout ? "Cart Summary" : "Order Summary"}</h2>
            {isCartCheckout ? (
              isReady && cartDisplayItems.length > 0 ? (
                <>
                  <div className={styles.cartSummaryList}>
                    {cartDisplayItems.map((item) => (
                      <div key={item.id} className={styles.cartSummaryItem}>
                        <div>
                          <h3>{item.name}</h3>
                          <p>{item.quantity} × {formatCurrency(item.price)}</p>
                        </div>
                        <strong>{formatCurrency(item.price * item.quantity)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className={styles.summaryRows}>
                    <div><span>Items</span><strong>{totalCartUnits}</strong></div>
                    <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
                    <div><span>Service Fee</span><strong>{formatCurrency(serviceFee)}</strong></div>
                  </div>
                </>
              ) : (
                <p className={styles.empty}>Your cart is empty.</p>
              )
            ) : selectedProduct ? (
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
              </>
            ) : (
              <p className={styles.empty}>No product selected.</p>
            )}
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <strong>{formatCurrency(grandTotal)}</strong>
            </div>
          </aside>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}
        {success ? (
          <div className={styles.successBox}>
            <p className={styles.success}>{success}</p>
            {placedOrderIds.length > 0 ? (
              <div className={styles.successMeta}>
                <span>
                  Order ID{placedOrderIds.length === 1 ? "" : "s"}: {placedOrderIds.join(", ")}
                </span>
                <span>Redirecting to products...</span>
                <div className={styles.successActions}>
                  {placedOrderIds.length === 1 ? (
                    <Link href={`/track?order=${placedOrderIds[0]}`} className={styles.primaryBtn}>
                      Track This Order
                    </Link>
                  ) : (
                    <Link href="/account" className={styles.primaryBtn}>
                      View My Account
                    </Link>
                  )}
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
