import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: {
    default: "Lakhey Labs",
    template: "%s | Lakhey Labs",
  },
  description: "Enterprise resource planning for Lakhey Labs. Manage orders, customers, inventory and invoices.",
  icons: {
    icon: "/logo2.svg",
    shortcut: "/logo2.svg",
    apple: "/logo2.svg",
  },
};

import { ToastProvider } from "@/components/ui/ToastContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppShell>
            {children}
          </AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
