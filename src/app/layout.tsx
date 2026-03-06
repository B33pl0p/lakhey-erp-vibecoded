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
  title: "PrintFlow | 3D Printer ERP",
  description: "Advanced enterprise resource planning for 3D printing farms. Manage your fleet, filaments, and fulfillment.",
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
