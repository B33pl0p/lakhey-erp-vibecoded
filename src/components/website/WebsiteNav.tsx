"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { CartLink } from "@/components/website/CartLink";
import styles from "./WebsiteNav.module.css";

type WebsiteNavProps = {
  className?: string;
};

export function WebsiteNav({ className }: WebsiteNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

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
            <Link href="/account" className={styles.secondaryBtn} onClick={closeMenu}>
              Login / Signup
            </Link>
            <CartLink className={styles.primaryBtn} onClick={closeMenu} />
          </div>
        </div>
      </nav>
    </header>
  );
}
