import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import "@/styles/main.scss";
import { Sidebar } from "@/components/layout/sidebar";
import { MainLayout } from "@/components/layout/MainLayout";
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
        <div className="flex h-screen overflow-hidden bg-[#030303] text-foreground">
          <MainLayout isAuthPage={isAuthPage}>
            {children}
          </MainLayout>
        </div>
      </body>
    </html>
  );
}
