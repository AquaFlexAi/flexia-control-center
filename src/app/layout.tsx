import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlexIA Control Center",
  description: "Centralized SaaS management for FlexIA AI services",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-[#030303] text-foreground">
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col">
            <TopBar />
            <main className="flex-1 p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
