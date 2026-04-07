"use client";

import { useEffect, useState } from "react";
import { type CartProductInput } from "@/lib/cart/cart";
import { useCart } from "@/lib/cart/useCart";

type Props = {
  product: CartProductInput;
  className?: string;
  quantity?: number;
  idleLabel?: string;
  addedLabel?: string;
};

export function AddToCartButton({
  product,
  className,
  quantity = 1,
  idleLabel = "Add to Cart",
  addedLabel = "Added",
}: Props) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!isAdded) return;
    const timeout = window.setTimeout(() => setIsAdded(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [isAdded]);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        addItem({ ...product, quantity });
        setIsAdded(true);
      }}
    >
      {isAdded ? addedLabel : idleLabel}
    </button>
  );
}
