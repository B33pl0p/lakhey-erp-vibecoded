"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/useCart";

type Props = {
  className?: string;
  onClick?: () => void;
};

export function CartLink({ className, onClick }: Props) {
  const { count, isReady } = useCart();
  const label = isReady && count > 0 ? `Cart (${count})` : "Cart";

  return (
    <Link href="/cart" className={className} onClick={onClick}>
      {label}
    </Link>
  );
}
