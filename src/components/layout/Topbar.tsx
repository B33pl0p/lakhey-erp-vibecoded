"use client";

import { usePathname } from "next/navigation";
import { Plus, Moon, Sun, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./Topbar.module.css";
import Link from "next/link";

export function Topbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Basic theme toggle sync with system preference initially
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
    
    // Check localStorage
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.style.colorScheme = saved;
      if (saved === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  };

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
        <button onClick={toggleTheme} className={styles.iconButton} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Link href="/orders/new" className={styles.newBtn}>
          <Plus size={18} />
          <span>New Order</span>
        </Link>
      </div>
    </header>
  );
}
