import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ToastProvider>
          <AppShell>
            {children}
          </AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
