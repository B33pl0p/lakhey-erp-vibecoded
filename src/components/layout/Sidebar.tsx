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
} from "lucide-react";
import styles from "./Sidebar.module.css";
import { PriceCalculator } from "./PriceCalculator";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products", href: "/products", icon: Package },
  { name: "Inventory", href: "/inventory", icon: Layers },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Quotations", href: "/quotations", icon: ClipboardList },
  { name: "Expenses",       href: "/expenses",  icon: Receipt },
  { name: "Finance",        href: "/finance",   icon: Landmark },
  { name: "Job Tracker",    href: "/tasks",     icon: ListChecks },
  { name: "Pricing",        href: "/pricing",   icon: DollarSign },
  { name: "Settings",       href: "/settings",  icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>LL</div>
          <span className={styles.logoText}>Lakhey Labs</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
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
  );
}
