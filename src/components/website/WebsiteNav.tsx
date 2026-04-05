import Image from "next/image";
import Link from "next/link";
import styles from "./WebsiteNav.module.css";

type WebsiteNavProps = {
  className?: string;
};

export function WebsiteNav({ className }: WebsiteNavProps) {
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

        <div className={styles.links}>
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/studio">Start Project</Link>
          <Link href="/track">Track Order</Link>
        </div>

        <div className={styles.actions}>
          <Link href="/account" className={styles.secondaryBtn}>
            Login / Signup
          </Link>
          <Link href="/products" className={styles.primaryBtn}>
            Store
          </Link>
        </div>
      </nav>
    </header>
  );
}
