"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addCartItem,
  CART_EVENT,
  type CartItem,
  type CartProductInput,
  clearCart,
  getCartCount,
  getCartSubtotal,
  readCart,
  removeCartItem,
  updateCartItemQuantity,
} from "./cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    function syncCart() {
      setItems(readCart());
      setIsReady(true);
    }

    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener(CART_EVENT, syncCart);

    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener(CART_EVENT, syncCart);
    };
  }, []);

  const count = useMemo(() => getCartCount(items), [items]);
  const subtotal = useMemo(() => getCartSubtotal(items), [items]);

  return {
    items,
    count,
    subtotal,
    isReady,
    addItem: (product: CartProductInput) => setItems(addCartItem(product)),
    updateQuantity: (productId: string, quantity: number) => setItems(updateCartItemQuantity(productId, quantity)),
    removeItem: (productId: string) => setItems(removeCartItem(productId)),
    clear: () => {
      clearCart();
      setItems([]);
    },
  };
}
