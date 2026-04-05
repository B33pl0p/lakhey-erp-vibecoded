"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const AUTH_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAuthPage = AUTH_ROUTES.includes(pathname);
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    if (!isSidebarOpen) return;

    const media = window.matchMedia("(max-width: 1024px)");
    if (!media.matches) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  if (isAuthPage || !isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="appLayout">
      <Sidebar
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />
      <div className="mainArea">
        <Topbar onMenuClick={() => setIsSidebarOpen((prev) => !prev)} />
        <div className="contentWrapper">{children}</div>
      </div>
    </div>
  );
}
