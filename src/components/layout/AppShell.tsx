"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const AUTH_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="appLayout">
      <Sidebar />
      <div className="mainArea">
        <Topbar />
        <div className="contentWrapper">{children}</div>
      </div>
    </div>
  );
}
