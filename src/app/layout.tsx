import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lakhey Labs ERP",
  description: "Enterprise resource planning for Lakhey Labs. Manage orders, customers, inventory and invoices.",
};

import { ToastProvider } from "@/components/ui/ToastContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ToastProvider>
          <div className="appLayout">
            <Sidebar />
            <div className="mainArea">
              <Topbar />
              <div className="contentWrapper">
                {children}
              </div>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
