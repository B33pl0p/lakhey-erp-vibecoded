"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Layers,
  FileText,
  ClipboardList,
  Settings,
  Receipt,
  ListChecks,
  DollarSign,
  Landmark,
  Globe2,
  X,
} from "lucide-react";
import styles from "./Sidebar.module.css";
import { PriceCalculator } from "./PriceCalculator";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Inventory", href: "/admin/inventory", icon: Layers },
  { name: "Invoices", href: "/admin/invoices", icon: FileText },
  { name: "Quotations", href: "/admin/quotations", icon: ClipboardList },
  { name: "Expenses",       href: "/admin/expenses",  icon: Receipt },
  { name: "Finance",        href: "/admin/finance",   icon: Landmark },
  { name: "Job Tracker",    href: "/admin/tasks",     icon: ListChecks },
  { name: "Pricing",        href: "/admin/pricing",   icon: DollarSign },
  { name: "Website",        href: "/admin/website",   icon: Globe2 },
  { name: "Settings",       href: "/admin/settings",  icon: Settings },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        className={`${styles.backdrop} ${isMobileOpen ? styles.backdropVisible : ""}`}
        onClick={onCloseMobile}
      />

      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ""}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>LL</div>
          <span className={styles.logoText}>Lakhey Labs</span>
        </div>
        <button
          type="button"
          className={styles.mobileCloseBtn}
          aria-label="Close navigation menu"
          onClick={onCloseMobile}
        >
          <X size={20} />
        </button>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              onClick={onCloseMobile}
            >
              <Icon className={styles.icon} size={20} />
              <span className={styles.label}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <PriceCalculator />
      </div>
      </aside>
    </>
  );
}
