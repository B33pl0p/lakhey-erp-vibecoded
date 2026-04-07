"use client";

import { usePathname } from "next/navigation";
import { Plus, Menu, LogOut, Bell, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import styles from "./Topbar.module.css";
import Link from "next/link";
import { logoutAction } from "@/lib/api/auth";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);
  const notifWrapRef = useRef<HTMLDivElement | null>(null);
  const [feed, setFeed] = useState<{
    total: number;
    newOrders: number;
    newCustomers: number;
    notifications: Array<{
      id: string;
      type: "order" | "customer";
      title: string;
      subtitle: string;
      href: string;
      createdAt: string;
    }>;
  }>({ total: 0, newOrders: 0, newCustomers: 0, notifications: [] });

  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard";
    const segment = pathname.split("/")[2];
    if (!segment) return "Dashboard";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const unreadKey = "admin-notifications-last-seen";
  const unreadCount = (() => {
    return feed.notifications.filter((n) => new Date(n.createdAt).getTime() > lastSeen).length;
  })();

  async function fetchNotifications() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setFeed({
        total: Number(data.total || 0),
        newOrders: Number(data.newOrders || 0),
        newCustomers: Number(data.newCustomers || 0),
        notifications: Array.isArray(data.notifications) ? data.notifications : [],
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLastSeen(Number(window.localStorage.getItem(unreadKey) || "0"));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const nextLastSeen = Date.now();
    window.localStorage.setItem(unreadKey, String(nextLastSeen));
    setLastSeen(nextLastSeen);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!notifWrapRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          aria-label="Open navigation menu"
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </button>
        <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
      </div>

      <div className={styles.right}>
        <div className={styles.notifWrap} ref={notifWrapRef}>
          <button
            type="button"
            className={styles.iconButton}
            title="Notifications"
            onClick={() => setIsOpen((v) => !v)}
          >
            <Bell size={16} />
            {unreadCount > 0 ? <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
          </button>

          {isOpen ? (
            <div className={styles.notifPanel}>
              <div className={styles.notifHead}>
                <strong>Notifications</strong>
                <button type="button" className={styles.smallBtn} onClick={fetchNotifications} disabled={isLoading}>
                  <RefreshCw size={14} className={isLoading ? styles.spin : ""} />
                </button>
              </div>
              <p className={styles.notifMeta}>
                {feed.newOrders} new orders · {feed.newCustomers} new customers (last 24h)
              </p>
              <div className={styles.notifList}>
                {feed.notifications.length === 0 ? (
                  <p className={styles.empty}>No new items.</p>
                ) : (
                  feed.notifications.map((n) => (
                    <Link key={n.id} href={n.href} className={styles.notifItem} onClick={() => setIsOpen(false)}>
                      <span className={styles.notifType}>{n.type === "order" ? "Order" : "Customer"}</span>
                      <span className={styles.notifTitle}>{n.title}</span>
                      <span className={styles.notifSub}>{n.subtitle || "—"}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        <Link href="/admin/orders/new" className={styles.newBtn}>
          <Plus size={18} />
          <span>New Order</span>
        </Link>
        <button
          className={styles.logoutBtn}
          title="Sign out"
          disabled={isPending}
          onClick={() => startTransition(() => logoutAction())}
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
