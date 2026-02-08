import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { createClient } from "@/utils/supabase/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlexIA Control Center",
  description: "Centralized SaaS management for FlexIA AI services",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Hide navigation elements for unauthenticated users (login page)
  const isAuthPage = !user;

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-[#030303] text-foreground">
          {!isAuthPage && <Sidebar />}
          <div className={isAuthPage ? "flex-1 flex flex-col" : "flex-1 ml-64 flex flex-col"}>
            {!isAuthPage && <TopBar />}
            <main className={isAuthPage ? "flex-1" : "flex-1 p-8"}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
