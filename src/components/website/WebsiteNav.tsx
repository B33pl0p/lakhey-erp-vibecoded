"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleUserRound, Menu, X } from "lucide-react";
import { CartLink } from "@/components/website/CartLink";
import styles from "./WebsiteNav.module.css";
import { logoutCustomerAction } from "@/lib/api/customerAuth";

type WebsiteNavProps = {
  className?: string;
};

export function WebsiteNav({ className }: WebsiteNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  useEffect(() => {
    let isActive = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/customer/session", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (isActive) {
          setUser(data.user || null);
        }
      } finally {
        if (isActive) {
          setIsLoadingUser(false);
        }
      }
    }

    loadSession();

    return () => {
      isActive = false;
    };
  }, []);

  const accountLabel = user?.name?.trim()
    ? user.name.trim().split(" ")[0]
    : "Account";

  return (
    <header className={`${styles.wrap} ${className || ""}`.trim()}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mascotWrap}>
            <Image src="/logo1.png" alt="Lakhey mascot logo" fill className={styles.mascot} />
          </span>
          <span className={styles.brandText}>
            <span className={styles.wordmarkWrap}>
              <Image src="/logo2.svg" alt="Lakhey Labs" fill className={styles.wordmark} />
            </span>
          </span>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={isMenuOpen}
          aria-controls="website-nav-menu"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div
          id="website-nav-menu"
          className={`${styles.menuPanel} ${isMenuOpen ? styles.menuPanelOpen : ""}`.trim()}
        >
          <div className={styles.links}>
            <Link href="/" onClick={closeMenu}>Home</Link>
            <Link href="/products" onClick={closeMenu}>Products</Link>
            <CartLink className={styles.cartLink} onClick={closeMenu} />
            <Link href="/studio" onClick={closeMenu}>Start Project</Link>
            <Link href="/track" onClick={closeMenu}>Track Order</Link>
          </div>

          <div className={styles.actions}>
            {isLoadingUser ? null : user ? (
              <div className={styles.accountArea}>
                <Link href="/account" className={styles.accountBtn} onClick={closeMenu}>
                  <CircleUserRound size={16} />
                  <span>{accountLabel}</span>
                </Link>
                <form action={logoutCustomerAction}>
                  <button type="submit" className={styles.secondaryBtn}>
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/account" className={styles.secondaryBtn} onClick={closeMenu}>
                Login / Signup
              </Link>
            )}
            <CartLink className={styles.primaryBtn} onClick={closeMenu} />
          </div>
        </div>
      </nav>
    </header>
  );
}
