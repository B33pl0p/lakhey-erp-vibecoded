"use client";

import { usePathname } from "next/navigation";
import { Plus, Menu } from "lucide-react";
import styles from "./Topbar.module.css";
import Link from "next/link";

export function Topbar() {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    const segment = pathname.split("/")[1];
    if (!segment) return "Dashboard";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.mobileMenuBtn}>
          <Menu size={24} />
        </button>
        <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
      </div>

      <div className={styles.right}>
        <Link href="/orders/new" className={styles.newBtn}>
          <Plus size={18} />
          <span>New Order</span>
        </Link>
      </div>
    </header>
  );
}
