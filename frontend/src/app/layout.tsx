import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ubicar.ar | Geographic Audits",
  description: "Cross-platform progressive web application for creating and managing custom geographical location collections.",
  manifest: "/manifest.json",
};

import { AuthProvider } from "@/context/AuthContext";
import SyncManager from "@/components/SyncManager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <SyncManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
